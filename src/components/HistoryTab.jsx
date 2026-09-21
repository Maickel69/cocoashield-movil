import React, { useState } from 'react';
import { MapPin, Calendar, User, ShieldAlert, CheckCircle2, ChevronRight, X, ExternalLink, Filter, Sparkles } from 'lucide-react';
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

export default function HistoryTab({ history = [], isOnline, onSyncNow, unsyncedCount }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterType, setFilterType] = useState('Todos');

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
    <div className="tab-content animate-fade-in" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div className="hist-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h1 className="tab-title" style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--color-text-dark)' }}>
            Mi Historial
          </h1>
          <p className="tab-subtitle" style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--color-text-muted)' }}>
            Fichas fitosanitarias de campo ({history.length} escaneos)
          </p>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, marginBottom: 12, scrollbarWidth: 'none' }}>
        {['Todos', 'Monilia', 'Mazorca Negra', 'Escoba de Bruja', 'Sano'].map(f => {
          const active = filterType === f;
          return (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11.5,
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
      <div className="hist-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredHistory.length === 0 ? (
          <div className="hist-empty" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, border: '1px dashed var(--color-border)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>🌿</span>
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
            const badge = getBadgeStyle(record.disease);

            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="hist-card"
                style={{
                  cursor: 'pointer',
                  borderRadius: 16,
                  padding: 12,
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  border: '1.5px solid var(--color-border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
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
                    <ChevronRight size={16} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  </div>

                  <div style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    {diseaseDetails.scientificName}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <Calendar size={11} />
                    <span>{formatDate(record.date)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <MapPin size={11} color="var(--color-primary)" />
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

      {/* ══ MODAL DE FICHA TÉCNICA DETALLADA ══════════════════════════════════ */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 20, 15, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: 'var(--color-bg-card, #1A2820)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px 20px 32px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              border: '1px solid var(--color-border)'
            }}
          >
            {/* Header del Modal */}
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
                onClick={() => setSelectedRecord(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-dark)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Fotografía de Campo en Alta Resolución */}
            <div
              style={{
                width: '100%',
                height: 220,
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                backgroundColor: '#000',
                border: '1.5px solid var(--color-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
            >
              {selectedRecord.photo || selectedRecord.image ? (
                <img
                  src={selectedRecord.photo || selectedRecord.image}
                  alt={selectedRecord.disease}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#0A120D' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A2820' }}>
                  <HistoryMiniSVG type={selectedRecord.disease} />
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(4px)',
                  color: '#11CAA0',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                {selectedRecord.certainty}% Certeza IA
              </div>
            </div>

            {/* Metadatos en cuadrícula */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Finca</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedRecord.locationName || 'Finca Cacaotera'}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Productor</span>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-dark)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedRecord.farmer || 'Técnico de Campo'}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Fecha de Escaneo</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-dark)', marginTop: 2 }}>
                  {formatDate(selectedRecord.date)}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Severidad</span>
                <div style={{ fontSize: 12, fontWeight: 800, color: selectedRecord.disease === 'Sano' ? '#10B981' : '#EF4444', marginTop: 2 }}>
                  {selectedRecord.disease === 'Sano' ? 'Ninguna' : 'Crítica / Alta'}
                </div>
              </div>
            </div>

            {/* Coordenadas GPS */}
            {selectedRecord.lat && selectedRecord.lng && (
              <a
                href={`https://www.google.com/maps?q=${selectedRecord.lat},${selectedRecord.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 14,
                  backgroundColor: 'rgba(17, 202, 160, 0.08)',
                  border: '1.5px solid rgba(17, 202, 160, 0.25)',
                  color: '#11CAA0',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} />
                  <span>GPS: {selectedRecord.lat.toFixed(4)}, {selectedRecord.lng.toFixed(4)}</span>
                </div>
                <ExternalLink size={14} />
              </a>
            )}

            {/* Protocolo Fitosanitario Recomendado */}
            {DISEASE_CATALOG[selectedRecord.disease] && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14, border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <ShieldAlert size={14} color="var(--color-primary)" />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-dark)' }}>
                    Protocolo de Manejo Recomendado
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  {(DISEASE_CATALOG[selectedRecord.disease]?.steps || []).map((step, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Receta Agronómica emitida si existe */}
            {selectedRecord.prescription && (
              <div style={{ backgroundColor: 'rgba(0, 80, 136, 0.1)', borderRadius: 16, padding: 14, border: '1px solid rgba(0, 80, 136, 0.25)' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>Receta Agronómica Emitida</span>
                <p style={{ fontSize: 12, color: 'var(--color-text-dark)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {selectedRecord.prescription}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedRecord(null)}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 14,
                backgroundColor: 'var(--color-primary)',
                color: '#FFF',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(44, 94, 59, 0.4)'
              }}
            >
              Cerrar Ficha
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
