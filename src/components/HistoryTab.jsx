import React, { useState } from 'react';
import {
  IconMapPin,
  IconCalendar,
  IconUser,
  IconShieldExclamation,
  IconCircleCheck,
  IconChevronRight,
  IconX,
  IconExternalLink,
  IconFilter,
  IconSparkles,
  IconPlant2,
  IconInfoCircle
} from '@tabler/icons-react';
import { DISEASE_CATALOG } from './Database';

// Offline SVGs for thumbnails in history list when image is missing
const HistoryMiniSVG = ({ type }) => {
  switch (type) {
    case 'Monilia':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#E2EBF0" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#C68A4C" stroke="#8D5A2B" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#FAFAFA" stroke="#D1D5DB" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.95" />
        </svg>
      );
    case 'Escoba de Bruja':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#FAF0E6" />
          <path d="M50 80 C50 60, 45 45, 35 35" fill="none" stroke="#5C4033" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M50 80 C50 65, 52 50, 62 42" fill="none" stroke="#5C4033" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M35 35 C30 25, 25 30, 20 27" fill="none" stroke="#8B5A2B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 42 C67 32, 72 35, 77 31" fill="none" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Mazorca Negra':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#EADCC9" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#B5804C" stroke="#7A4E26" strokeWidth="2" />
          <path d="M50 86 C38 82, 32 72, 36 65 C42 60, 55 62, 62 68 C66 73, 62 82, 50 86 Z" fill="#2B2017" />
        </svg>
      );
    case 'Sano':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#E6F2E7" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#E5A93C" stroke="#A67117" strokeWidth="2" />
        </svg>
      );
  }
};

export default function HistoryTab({
  history = [],
  isOnline,
  onSyncNow,
  unsyncedCount,
  onDetailOpen,
  selectedRecord: externalSelectedRecord,
  onSelectRecord: externalOnSelectRecord
}) {
  const [internalSelectedRecord, setInternalSelectedRecord] = useState(null);
  const [showProtocolDialog, setShowProtocolDialog] = useState(false);
  const [filterType, setFilterType] = useState('Todos');

  const selectedRecord = externalSelectedRecord !== undefined ? externalSelectedRecord : internalSelectedRecord;

  const handleOpenDetail = (record) => {
    if (externalOnSelectRecord) {
      externalOnSelectRecord(record);
    } else {
      setInternalSelectedRecord(record);
      onDetailOpen?.(true);
    }
  };

  const handleCloseDetail = () => {
    if (externalOnSelectRecord) {
      externalOnSelectRecord(null);
    } else {
      setInternalSelectedRecord(null);
      setShowProtocolDialog(false);
      onDetailOpen?.(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hour}:${minute}`;
  };

  const filteredHistory = history.filter(item => {
    if (filterType === 'Todos') return true;
    return (item.disease || '').toLowerCase().includes(filterType.toLowerCase());
  });

  const getBadgeStyle = (disease) => {
    switch (disease) {
      case 'Monilia':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
      case 'Mazorca Negra':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: '#F59E0B' };
      case 'Escoba de Bruja':
        return { bg: 'rgba(217, 119, 6, 0.15)', text: '#D97706', border: '#D97706' };
      case 'Sano':
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', border: '#10B981' };
    }
  };

  return (
    <div className="tab-content animate-fade-in" style={{ paddingBottom: 20 }}>
      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 8, scrollbarWidth: 'none' }}>
        {['Todos', 'Monilia', 'Mazorca Negra', 'Escoba de Bruja', 'Sano'].map(f => {
          const active = filterType === f;
          return (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                backgroundColor: active ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                color: active ? '#FFFFFF' : 'var(--color-text-muted)',
                border: active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* History Cards List */}
      <div className="hist-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredHistory.length === 0 ? (
          <div className="hist-empty" style={{ textAlign: 'center', padding: '36px 16px', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
            <IconPlant2 size={40} stroke={1.5} color="var(--color-primary)" style={{ margin: '0 auto 10px', display: 'block' }} />
            <h3 className="hist-empty-title" style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--color-text-dark)' }}>
              {filterType === 'Todos' ? 'Sin registros aún' : `Sin registros de ${filterType}`}
            </h3>
            <p className="hist-empty-desc" style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Toma una foto desde la pestaña de Diagnóstico para registrar tu primer caso con IA.
            </p>
          </div>
        ) : (
          filteredHistory.map((record) => {
            const diseaseDetails = DISEASE_CATALOG[record.disease] || DISEASE_CATALOG['Sano'];
            const photoUrl = record.photo || record.image;
            return (
              <div
                key={record.id}
                onClick={() => handleOpenDetail(record)}
                className="hist-card"
                style={{
                  cursor: 'pointer',
                  borderRadius: 14,
                  padding: '10px 12px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'none',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.99)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* Photo Thumbnail */}
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={record.disease}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <HistoryMiniSVG type={record.disease} />
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      right: 4,
                      fontSize: 8.5,
                      fontWeight: 900,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#FFF',
                      padding: '1px 5px',
                      borderRadius: 6
                    }}
                  >
                    {record.certainty}%
                  </span>
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--color-text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {diseaseDetails.name}
                    </h4>
                    <IconChevronRight size={16} stroke={2} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  </div>

                  <div style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    {diseaseDetails.scientificName}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <IconCalendar size={12} stroke={2} />
                    <span>{formatDate(record.date)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <IconMapPin size={12} stroke={2} color="var(--color-primary)" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {record.locationName || 'Finca Cacaotera'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ══ FICHA TÉCNICA DETALLADA - PANTALLA COMPLETA ══════════════════ */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={handleCloseDetail}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 520,
              height: '100dvh',
              maxHeight: '100dvh',
              backgroundColor: 'var(--color-bg-card)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '20px 20px max(36px, env(safe-area-inset-bottom, 36px))',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: 'none',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Tirador del Bottom Sheet */}
            <div style={{
              width: 40,
              height: 4.5,
              borderRadius: 3,
              backgroundColor: 'var(--color-border)',
              margin: '0 auto 2px',
              opacity: 0.8
            }} />

            {/* Header del Bottom Sheet */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                  FICHA TÉCNICA {selectedRecord.id || 'CS-CAMPO'}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--color-text-dark)' }}>
                  {selectedRecord.disease}
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                <IconX size={18} stroke={2} />
              </button>
            </div>

            {/* Fotografía de Campo en Alta Resolución con Certeza IA */}
            <div
              style={{
                width: '100%',
                height: 220,
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#000',
                border: '1px solid var(--color-border)'
              }}
            >
              {selectedRecord.photo || selectedRecord.image ? (
                <img
                  src={selectedRecord.photo || selectedRecord.image}
                  alt={selectedRecord.disease}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#0B140E' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
                  <HistoryMiniSVG type={selectedRecord.disease} />
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  color: '#10B981',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                {selectedRecord.certainty}% Certeza IA
              </div>
            </div>

            {/* Metadatos en cuadrícula Material 3 Filled (sin sombras) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 16, padding: '12px 14px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Finca</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-dark)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedRecord.locationName || 'Finca Cacaotera'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 16, padding: '12px 14px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Productor</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-dark)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedRecord.farmer || 'Técnico de Campo'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 16, padding: '12px 14px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha de Escaneo</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 3 }}>
                  {formatDate(selectedRecord.date)}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 16, padding: '12px 14px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severidad</span>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: selectedRecord.disease === 'Sano' ? '#16A34A' : '#EF4444', marginTop: 3 }}>
                  {selectedRecord.disease === 'Sano' ? 'Ninguna' : 'Crítica / Alta'}
                </div>
              </div>
            </div>

            {/* Coordenadas GPS (Color Pizarra/Neutral Suave y Descansado) */}
            {selectedRecord.lat && selectedRecord.lng && (
              <a
                href={`https://www.google.com/maps?q=${selectedRecord.lat},${selectedRecord.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 16,
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconMapPin size={16} stroke={2} color="#64748B" />
                  <span style={{ color: 'var(--color-text-dark)', fontWeight: 700 }}>
                    GPS: {selectedRecord.lat.toFixed(4)}, {selectedRecord.lng.toFixed(4)}
                  </span>
                </div>
                <IconExternalLink size={15} stroke={2} color="#94A3B8" />
              </a>
            )}

            {/* Botón Disparador del Protocolo Fitosanitario (Dialog / Popover) */}
            {DISEASE_CATALOG[selectedRecord.disease] && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowProtocolDialog(prev => !prev)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    backgroundColor: showProtocolDialog ? 'rgba(44, 94, 59, 0.08)' : 'var(--color-bg)',
                    border: showProtocolDialog ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: 'var(--color-text-dark)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconShieldExclamation size={18} stroke={2} color="var(--color-primary)" />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>Protocolo de Manejo Recomendado</span>
                  </div>
                  <IconInfoCircle size={17} stroke={2} color="var(--color-primary)" />
                </button>

                {/* Diálogo Flotante / Tooltip Enriquecido de Pasos del Protocolo */}
                {showProtocolDialog && (
                  <div
                    style={{
                      marginTop: 8,
                      backgroundColor: 'var(--color-bg-card)',
                      borderRadius: 18,
                      padding: '16px 18px',
                      border: '1.5px solid var(--color-border)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
                        Pasos Técnicos Sugeridos
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowProtocolDialog(false)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                      >
                        <IconX size={15} stroke={2} />
                      </button>
                    </div>

                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                      {(DISEASE_CATALOG[selectedRecord.disease]?.steps || []).map((step, idx) => (
                        <li key={idx} style={{ marginBottom: 6 }}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Receta Agronómica emitida si existe */}
            {selectedRecord.prescription && (
              <div style={{ backgroundColor: 'var(--color-bg)', borderRadius: 16, padding: 14, border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Receta Agronómica Emitida</span>
                <p style={{ fontSize: 12, color: 'var(--color-text-dark)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {selectedRecord.prescription}
                </p>
              </div>
            )}

            {/* Botón de Cierre Bottom Sheet */}
            <button
              type="button"
              onClick={handleCloseDetail}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 9999,
                backgroundColor: 'var(--color-primary)',
                color: '#FFF',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.5px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'none',
                transition: 'transform 0.1s ease',
                marginTop: 4
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
