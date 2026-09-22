import React, { useState, useMemo, useRef } from 'react';
import {
  IconMapPin,
  IconCalendar,
  IconPlant2,
  IconShieldExclamation,
  IconSparkles,
  IconX,
  IconExternalLink,
  IconSearch,
  IconChevronRight,
  IconMaximize,
  IconArrowLeft
} from '@tabler/icons-react';
import { Dialog } from '@base-ui/react/dialog';
import { Tooltip } from '@base-ui/react/tooltip';
import { DISEASE_CATALOG } from './Database';
import { CocoaPodSVG } from './DiagnosisTab.subwidgets';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DISEASE_CATEGORY_COLORS = {
  Sano: 'text-[#205537] dark:text-[#7ED4A2]',
  Monilia: 'text-[#8B5514] dark:text-[#EDB271]',
  'Mazorca Negra': 'text-[#7B3D23] dark:text-[#ECA58A]',
  'Escoba de Bruja': 'text-[#6B3356] dark:text-[#E1A4CB]'
};
const getDiseaseCategoryColor = (d) => DISEASE_CATEGORY_COLORS[d] || 'text-[#205537] dark:text-[#7ED4A2]';

const getRelativeTimeLabel = (d, diffDays, timeStr) => {
  if (diffDays <= 0) return `Hoy, ${timeStr}`;
  if (diffDays === 1) return `Ayer, ${timeStr}`;
  if (diffDays < 7) return `${DAYS[d.getDay()]}, ${timeStr}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'} • ${timeStr}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'} • ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }
  const years = Math.floor(diffDays / 365);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'} • ${d.getFullYear()}`;
};

const formatSmartDate = (isoString, showExact = false) => {
  if (!isoString) return 'Hoy';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;

  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${h % 12 || 12}:${m} ${h >= 12 ? 'pm' : 'am'}`;
  if (showExact) return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} • ${timeStr}`;

  const today = new Date().setHours(0, 0, 0, 0);
  const target = new Date(d).setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - target) / 86400000);

  return getRelativeTimeLabel(d, diffDays, timeStr);
};

export default function HistoryTab({
  history = [],
  isOnline,
  onSyncNow,
  unsyncedCount,
  onDetailOpen,
  selectedRecord: externalSelectedRecord,
  onSelectRecord: externalOnSelectRecord,
  isLoading = false
}) {
  const [internalSelectedRecord, setInternalSelectedRecord] = useState(null);
  const [filterType, setFilterType] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showExactDate, setShowExactDate] = useState(false);

  // Gesto táctil de arrastrar para cerrar (Swipe down to dismiss)
  const [sheetTranslateY, setSheetTranslateY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const touchStartY = useRef(0);
  const currentDeltaY = useRef(0);
  const isEligibleForDrag = useRef(false);
  const popupRef = useRef(null);

  const selectedRecord = externalSelectedRecord !== undefined ? externalSelectedRecord : internalSelectedRecord;

  const handleTouchStart = (e) => {
    if (popupRef.current && popupRef.current.scrollTop > 5) {
      isEligibleForDrag.current = false;
      return;
    }
    isEligibleForDrag.current = true;
    touchStartY.current = e.touches[0].clientY;
    currentDeltaY.current = 0;
    setIsSheetDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isEligibleForDrag.current) return;
    const delta = Math.max(0, e.touches[0].clientY - touchStartY.current);
    currentDeltaY.current = delta;
    setSheetTranslateY(delta);
  };

  const handleTouchEnd = () => {
    if (!isEligibleForDrag.current) return;
    isEligibleForDrag.current = false;
    setIsSheetDragging(false);
    if (currentDeltaY.current > 90) {
      setSheetTranslateY(window.innerHeight || 800);
      setTimeout(() => { handleCloseDetail(); setSheetTranslateY(0); currentDeltaY.current = 0; }, 220);
    } else {
      setSheetTranslateY(0);
      currentDeltaY.current = 0;
    }
  };

  const filteredHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    let list = history;
    if (filterType !== 'Todos') {
      list = list.filter((item) => item.disease === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const disease = (item.disease || '').toLowerCase();
        const loc = (item.locationName || item.location || '').toLowerCase();
        const date = (item.date || '').toLowerCase();
        return disease.includes(q) || loc.includes(q) || date.includes(q);
      });
    }
    return list;
  }, [history, filterType, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts = { Todos: Array.isArray(history) ? history.length : 0, Monilia: 0, 'Mazorca Negra': 0, 'Escoba de Bruja': 0, Sano: 0 };
    if (Array.isArray(history)) {
      history.forEach((item) => {
        if (counts[item.disease] !== undefined) counts[item.disease] += 1;
      });
    }
    return counts;
  }, [history]);

  const handleOpenDetail = (record) => {
    setShowExactDate(false);
    if (externalOnSelectRecord) {
      externalOnSelectRecord(record);
    } else {
      setInternalSelectedRecord(record);
      onDetailOpen?.(true);
    }
  };

  const handleCloseDetail = () => {
    setShowExactDate(false);
    if (externalOnSelectRecord) {
      externalOnSelectRecord(null);
    } else {
      setInternalSelectedRecord(null);
      onDetailOpen?.(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? isoString : `${d.getDate()}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
  };

  const renderHistoryContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-3xl bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] shadow-[0_2px_12px_rgba(18,30,23,0.03)] dark:shadow-none gap-3.5 animate-fade-in">
          {/* M3 Circular Progress Indicator (Filled & Tonal) */}
          <div className="w-10 h-10 rounded-full border-3 border-[var(--color-primary-container)] border-t-[var(--color-primary)] animate-spin" />
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-xs font-bold text-[var(--color-text-dark)]">
              Cargando historial fitosanitario...
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-normal">
              Sincronizando registros con el servidor
            </span>
          </div>
        </div>
      );
    }

    if (filteredHistory.length === 0) {
      return (
        <div className="text-center py-12 px-6 rounded-3xl bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] shadow-[0_2px_12px_rgba(18,30,23,0.03)]">
          <IconPlant2 size={40} stroke={1.6} className="text-[var(--color-primary)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--color-text-dark)] mb-1">
            No se encontraron diagnósticos
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto leading-relaxed">
            {searchQuery ? `No hay resultados para "${searchQuery}"` : `Sin registros en la categoría ${filterType}`}
          </p>
        </div>
      );
    }

    return (
      <>
        {filteredHistory.map((record) => {
          const diseaseDetails = DISEASE_CATALOG[record.disease] || DISEASE_CATALOG['Sano'];
          const photoUrl = record.photo || record.image;

          return (
            <button
              key={record.id}
              type="button"
              onClick={() => handleOpenDetail(record)}
              className="w-full text-left group flex items-center gap-3.5 p-4 rounded-3xl bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] shadow-[0_2px_12px_rgba(18,30,23,0.04)] dark:shadow-none hover:bg-[var(--color-surface-container-low)] dark:hover:bg-[var(--color-surface-container-high)] active:scale-[0.99] transition-all duration-200 cursor-pointer border-none select-none"
            >
              {/* Miniatura Cuadrada Material 3 (rounded-2xl sin borde) */}
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-[var(--color-surface-container)] border-none">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={record.disease}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full p-2">
                    <CocoaPodSVG type={record.disease} />
                  </div>
                )}
              </div>

              {/* Columna Central: Título, Categoría con Color, Fecha y Finca */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <h4 className="text-[14px] font-bold text-[var(--color-text-dark)] truncate m-0">
                  {diseaseDetails.name}
                </h4>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className={`font-semibold ${getDiseaseCategoryColor(record.disease)}`}>
                    {record.disease}
                  </span>
                  <span className="text-[var(--color-text-muted)]/50">•</span>
                  <span className="text-[var(--color-text-muted)] font-medium">
                    {formatDate(record.date)}
                  </span>
                </div>

                <div className="text-xs text-[var(--color-text-muted)] truncate font-normal">
                  {record.locationName || 'Finca Cacaotera Lote 1'}
                </div>
              </div>

              {/* Columna Derecha: Certeza Destacada en Tono M3 y Chevron Lateral */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5">
                <span className="text-[13px] font-bold text-[#1F4E34] dark:text-[#7ED4A2] tracking-tight leading-none">
                  {record.certainty || record.confidence || 90}%
                </span>
                <IconChevronRight
                  size={16}
                  stroke={2.2}
                  className="text-[var(--color-text-muted)]/40 group-hover:translate-x-0.5 transition-transform"
                />
              </div>
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="tab-content animate-fade-in pb-12">
      {/* Barra de Búsqueda Material 3 Filled Expressive */}
      <div className="relative mb-3.5 flex items-center">
        <IconSearch size={20} stroke={2} className="absolute left-4 text-[var(--color-text-muted)] pointer-events-none z-10" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar diagnósticos, parcelas..."
          style={{ paddingLeft: '46px', paddingRight: '42px' }}
          className="w-full h-13 rounded-full bg-[var(--color-surface-container-high)] text-sm font-medium text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)]/75 focus:outline-none focus:bg-[var(--color-surface-container-highest)] border-none shadow-none transition-colors"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)] p-1 rounded-full cursor-pointer z-10 border-none bg-transparent"
          >
            <IconX size={17} stroke={2} />
          </button>
        )}
      </div>

      {/* Chips de Categorías (Material 3 Filled & Tonal Filter Chips) */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3.5 -mx-1 px-1 no-scrollbar items-center">
        {['Todos', 'Monilia', 'Mazorca Negra', 'Escoba de Bruja', 'Sano'].map((f) => {
          const active = filterType === f;
          const count = categoryCounts[f] ?? 0;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilterType(f)}
              className={`inline-flex items-center px-4 py-2.5 rounded-full text-xs whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] cursor-pointer shrink-0 font-semibold border-none select-none ${
                active
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-text-dark)] hover:bg-[var(--color-surface-container-highest)] active:scale-95'
              }`}
            >
              <span>{f}</span>
              <span
                aria-hidden={!active}
                className={`inline-flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                  active
                    ? 'max-w-[48px] opacity-100 ml-2 scale-100'
                    : 'max-w-0 opacity-0 ml-0 scale-75 pointer-events-none'
                }`}
              >
                <span className="inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none bg-white/20 text-white dark:bg-black/20 dark:text-[#072014] select-none">
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de Tarjetas Material 3 Filled Expressive */}
      <div className="flex flex-col gap-3">
        {renderHistoryContent()}
      </div>

      {/* ══ FICHA TÉCNICA DETALLADA CON BASE UI DIALOG & TAILWIND ══ */}
      <Dialog.Root open={Boolean(selectedRecord)} onOpenChange={(open) => !open && handleCloseDetail()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-backdrop-in transition-opacity duration-200 data-[ending-style]:opacity-0" />
          <Dialog.Popup
            ref={popupRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              transform: sheetTranslateY > 0 ? `translate3d(0, ${sheetTranslateY}px, 0)` : undefined,
              transition: isSheetDragging ? 'none' : 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
            className="fixed inset-x-0 bottom-0 max-w-2xl mx-auto w-full max-h-[92dvh] bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-t-3xl shadow-2xl z-50 overflow-y-auto p-5 pb-10 flex flex-col gap-4 border-none animate-slide-up-sheet data-[ending-style]:translate-y-full will-change-transform"
          >
            {selectedRecord && (
              <>
                {/* Zona de Arrastre Táctil / Handle Superior */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="w-full pt-1 pb-1 -mt-1 cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                >
                  <div className="w-12 h-1.5 rounded-full bg-[var(--color-surface-container-highest)] mx-auto mb-2.5 transition-colors active:bg-[var(--color-text-muted)]" />

                  {/* Header del Bottom Sheet */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                        FICHA TÉCNICA {selectedRecord.id || 'CS-CAMPO'}
                      </span>
                      <Dialog.Title className="text-xl font-extrabold text-[var(--color-text-dark)] m-0">
                        {selectedRecord.disease}
                      </Dialog.Title>
                    </div>
                    <Dialog.Close className="w-9 h-9 rounded-full bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-text-dark)] transition-colors cursor-pointer border-none p-0">
                      <IconX size={18} stroke={2} />
                    </Dialog.Close>
                  </div>
                </div>

                {/* Fotografía de Campo en Alta Resolución con Certeza IA (Click para Pantalla Completa) */}
                <button
                  type="button"
                  onClick={() => (selectedRecord.image || selectedRecord.photo) && setFullscreenImage(selectedRecord.image || selectedRecord.photo)}
                  aria-label={selectedRecord.image || selectedRecord.photo ? "Ver fotografía en pantalla completa" : undefined}
                  className={`w-full block p-0 text-left h-56 rounded-3xl overflow-hidden relative bg-[var(--color-surface-container)] border-none select-none ${
                    selectedRecord.image || selectedRecord.photo ? 'cursor-pointer group' : ''
                  }`}
                  title={selectedRecord.image || selectedRecord.photo ? "Toca para ver en pantalla completa" : undefined}
                >
                  {selectedRecord.image || selectedRecord.photo ? (
                    <>
                      <img
                        src={selectedRecord.image || selectedRecord.photo}
                        alt={selectedRecord.disease}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                        <IconMaximize size={14} stroke={2.2} />
                        <span>Ver completa</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-2">
                      <div className="w-20 h-20">
                        <CocoaPodSVG type={selectedRecord.disease} />
                      </div>
                      <span className="text-[11px] font-semibold">Registro sin imagen directa de cámara</span>
                    </div>
                  )}

                  {/* Badge Flotante de Certeza */}
                  <div className="absolute top-3 right-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 border-none">
                    <IconSparkles size={14} stroke={2.5} />
                    <span>{selectedRecord.confidence || selectedRecord.certainty || 90}% Certeza IA</span>
                  </div>
                </button>

                {/* Metadata Grid (Fecha, Parcela, Severidad) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowExactDate(prev => !prev)}
                    className="bg-[var(--color-surface-container)] dark:bg-[var(--color-surface-container-high)] p-3.5 rounded-2xl border-none text-left cursor-pointer hover:bg-[var(--color-surface-container-highest)] active:scale-[0.98] transition-all select-none group"
                    title="Toca para alternar entre fecha y formato relativo"
                  >
                    <div className="flex items-center justify-between text-[var(--color-text-muted)] text-[11px] font-semibold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <IconCalendar size={13} stroke={2} /> Captura
                      </span>
                      <span className="text-[10px] text-[var(--color-primary)] font-medium lowercase opacity-70 group-hover:opacity-100 transition-opacity">
                        {showExactDate ? 'relativo' : 'exacta'}
                      </span>
                    </div>
                    <div
                      key={showExactDate ? 'exact' : 'smart'}
                      className="text-xs font-bold text-[var(--color-text-dark)] mt-1 animate-fade-in transition-opacity duration-200"
                    >
                      {formatSmartDate(selectedRecord.date, showExactDate)}
                    </div>
                  </button>

                  <div className="bg-[var(--color-surface-container)] dark:bg-[var(--color-surface-container-high)] p-3.5 rounded-2xl border-none">
                    <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-[11px] font-semibold uppercase">
                      <IconPlant2 size={13} stroke={2} /> Parcela / Fundo
                    </div>
                    <div className="text-xs font-bold text-[var(--color-text-dark)] mt-1 truncate">
                      {selectedRecord.location || selectedRecord.locationName || 'Finca Principal'}
                    </div>
                  </div>
                </div>

                {/* Coordenadas GPS como Textlink Compacto */}
                {selectedRecord.lat && selectedRecord.lng && (
                  <div className="flex items-center justify-start px-0.5 -mt-0.5">
                    <a
                      href={`https://www.google.com/maps?q=${selectedRecord.lat},${selectedRecord.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[12px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/50 active:scale-95 transition-all no-underline"
                      title="Abrir ubicación en Google Maps"
                    >
                      <IconMapPin size={14} stroke={2.2} />
                      <span>GPS: {Number(selectedRecord.lat).toFixed(4)}, {Number(selectedRecord.lng).toFixed(4)}</span>
                      <IconExternalLink size={12} stroke={2.2} className="opacity-70" />
                    </a>
                  </div>
                )}

                {/* Protocolo de Manejo Recomendado (Trigger Compacto con Tooltip y Dialog) */}
                {DISEASE_CATALOG[selectedRecord.disease]?.steps && (
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      type="button"
                      onClick={() => setShowStepsDialog(true)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] text-[var(--color-text-dark)] transition-all cursor-pointer border-none active:scale-[0.99] select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <IconShieldExclamation size={18} stroke={2.2} />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block leading-tight">Pasos Técnicos Sugeridos</span>
                          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Ver protocolo fitosanitario recomendado</span>
                        </div>
                      </div>
                      <IconChevronRight size={17} stroke={2} className="text-[var(--color-text-muted)]" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Positioner side="top" sideOffset={6}>
                        <Tooltip.Popup className="bg-[var(--color-surface-container-highest)] text-[var(--color-text-dark)] px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg border-none z-50">
                          Toca para consultar los pasos de manejo
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                )}

                {/* Receta Agronómica emitida si existe */}
                {selectedRecord.prescription && (
                  <div className="bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary-container)] rounded-2xl p-4 border-none">
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      Receta Agronómica Emitida
                    </span>
                    <p className="text-xs mt-1 leading-relaxed">
                      {selectedRecord.prescription}
                    </p>
                  </div>
                )}

                {/* Botón de Cierre Bottom Sheet */}
                <Dialog.Close className="w-full py-3.5 px-4 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.99] text-[var(--color-on-primary)] font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer border-none flex items-center justify-center gap-2 text-center mt-2">
                  <IconArrowLeft size={18} stroke={2.2} />
                  <span>Regresar</span>
                </Dialog.Close>
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ══ DIALOG MODAL DE PASOS TÉCNICOS SUGERIDOS ══ */}
      {selectedRecord && (
        <Dialog.Root open={showStepsDialog} onOpenChange={setShowStepsDialog}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 animate-fade-in" />
            <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-3xl p-5 shadow-2xl z-60 flex flex-col gap-4 border-none max-h-[85dvh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                  <IconShieldExclamation size={20} stroke={2.2} />
                  <Dialog.Title className="text-sm font-extrabold uppercase tracking-wider text-[var(--color-text-dark)] m-0">
                    Pasos Técnicos Sugeridos
                  </Dialog.Title>
                </div>
                <Dialog.Close className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-text-dark)] border-none cursor-pointer transition-colors p-0">
                  <IconX size={16} stroke={2} />
                </Dialog.Close>
              </div>

              <div className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] p-4 rounded-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[var(--color-primary)]">
                  {selectedRecord.disease}
                </span>
                <ul className="m-0 pl-4 text-xs space-y-2 leading-relaxed text-[var(--color-on-primary-container)]">
                  {(DISEASE_CATALOG[selectedRecord.disease]?.steps || []).map((step) => (
                  <li key={step} className="font-medium">{step}</li>
                ))}
                </ul>
              </div>

              <Dialog.Close className="w-full py-3.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] font-bold text-xs cursor-pointer border-none text-center transition-transform active:scale-[0.99]">
                Entendido
              </Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* ══ DIALOG DE FOTO EN PANTALLA COMPLETA (LIGHTBOX) ══ */}
      <Dialog.Root open={Boolean(fullscreenImage)} onOpenChange={(open) => !open && setFullscreenImage(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 bg-black/90 backdrop-blur-md z-60 animate-fade-in cursor-pointer" />
          <Dialog.Popup className="fixed inset-0 z-60 flex flex-col items-center justify-center p-4 pointer-events-none">
            <div className="relative max-w-3xl w-full max-h-[92dvh] flex flex-col items-center pointer-events-auto">
              <Dialog.Close className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center cursor-pointer border-none transition-transform active:scale-95 shadow-lg">
                <IconX size={20} stroke={2.5} />
              </Dialog.Close>
              <img
                src={fullscreenImage}
                alt="Fotografía en pantalla completa"
                className="max-w-full max-h-[84dvh] object-contain rounded-2xl shadow-2xl"
              />
              {selectedRecord && (
                <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
                  {selectedRecord.disease} &bull; {selectedRecord.location || selectedRecord.locationName || 'Finca Principal'}
                </div>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
