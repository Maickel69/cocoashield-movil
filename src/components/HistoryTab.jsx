import React from 'react';
import { Clock, RefreshCw, MapPin, Database, Cloud } from 'lucide-react';
import { DISEASE_CATALOG } from './Database';

// Offline SVGs for thumbnails in history list
const HistoryMiniSVG = ({ type }) => {
  switch (type) {
    case 'Monilia':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#E2EBF0" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#C68A4C" stroke="#8D5A2B" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#FAFAFA" stroke="#D1D5DB" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.95" />
        </svg>
      );
    case 'Escoba de Bruja':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#FAF0E6" />
          <path d="M50 80 C50 60, 45 45, 35 35" fill="none" stroke="#5C4033" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M50 80 C50 65, 52 50, 62 42" fill="none" stroke="#5C4033" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M35 35 C30 25, 25 30, 20 27" fill="none" stroke="#8B5A2B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 42 C67 32, 72 35, 77 31" fill="none" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'Mazorca Negra':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#EADCC9" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#B5804C" stroke="#7A4E26" strokeWidth="2" />
          <path d="M50 86 C38 82, 32 72, 36 65 C42 60, 55 62, 62 68 C66 73, 62 82, 50 86 Z" fill="#2B2017" />
        </svg>
      );
    case 'Sano':
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect width="100" height="100" fill="#E6F2E7" />
          <path d="M50 20 C62 28, 70 40, 70 55 C70 70, 62 82, 50 86 C38 82, 30 70, 30 55 C30 40, 38 28, 50 20 Z" fill="#E5A93C" stroke="#A67117" strokeWidth="2" />
        </svg>
      );
  }
};

export default function HistoryTab({ history, isOnline, onSyncNow, unsyncedCount }) {
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hour}:${minute}`;
  };

  return (
    <div className="tab-content animate-fade-in">
      {/* Header */}
      <div className="hist-header-row">
        <div>
          <h1 className="tab-title">Mi Historial</h1>
          <p className="tab-subtitle">SQLite local DB</p>
        </div>

        {/* Sync Trigger button */}
        {unsyncedCount > 0 && (
          <button
            onClick={onSyncNow}
            disabled={!isOnline}
            className={isOnline ? 'btn-sync-active animate-pulse' : 'btn-sync-disabled'}
          >
            <RefreshCw size={12} className={isOnline ? 'animate-spin' : ''} />
            Sincronizar
          </button>
        )}
      </div>

      {/* History Cards List */}
      <div className="hist-list">
        {history.length === 0 ? (
          <div className="hist-empty">
            <Database size={40} style={{ color: '#cbd5e1' }} />
            <h3 className="hist-empty-title">Sin registros aún</h3>
            <p className="hist-empty-desc">
              Realiza diagnósticos en campo desde la pestaña de cámara para ver tus fichas aquí.
            </p>
          </div>
        ) : (
          history.map((record) => {
            const diseaseDetails = DISEASE_CATALOG[record.disease] || DISEASE_CATALOG['Sano'];
            return (
              <div key={record.id} className="hist-card">
                {/* Image frame */}
                <div className="hist-card-img-box" style={{ overflow: 'hidden', borderRadius: '8px' }}>
                  {record.photo ? (
                    <img src={record.photo} alt={record.disease} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <HistoryMiniSVG type={record.disease} />
                  )}
                </div>

                {/* Details */}
                <div className="hist-card-details">
                  <div>
                    <div className="hist-card-title-row">
                      <h4 className="hist-card-title">{diseaseDetails.name}</h4>
                      <span className="hist-card-certainty">{record.certainty}%</span>
                    </div>
                    <span className="hist-card-date">{formatDate(record.date)}</span>
                  </div>

                  {/* Location and sync status bottom row */}
                  <div className="hist-card-footer">
                    <div className="hist-card-gps">
                      <MapPin size={10} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.locationName}
                      </span>
                    </div>

                    {/* Sync Indicator */}
                    <div className={`hist-card-sync-badge ${record.synced ? 'synced' : 'pending'}`}>
                      {record.synced ? (
                        <>
                          <Cloud size={10} style={{ fill: 'currentColor' }} />
                          <span>Subido</span>
                        </>
                      ) : (
                        <>
                          <Clock size={10} />
                          <span>Pendiente</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
