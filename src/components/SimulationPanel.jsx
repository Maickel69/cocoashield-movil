import React, { useEffect, useRef } from 'react';
import {
  IconWifi,
  IconWifiOff,
  IconMapPin,
  IconRefresh,
  IconTrash,
  IconDatabase,
  IconTerminal2
} from '@tabler/icons-react';

const GPS_PRESETS = [
  { name: 'Finca La Estrella (Lote A)', lat: -1.0234, lng: -77.5432 },
  { name: 'Finca La Estrella (Lote B)', lat: -1.0256, lng: -77.5401 },
  { name: 'Cooperativa Sur', lat: -1.0289, lng: -77.5478 },
  { name: 'Finca Vecina El Placer', lat: -1.0321, lng: -77.5385 }
];

export default function SimulationPanel({
  isOnline,
  setIsOnline,
  currentGPS,
  setCurrentGPS,
  syncLogs,
  onSync,
  onClearDb,
  historyCount,
  unsyncedCount
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [syncLogs]);

  const dbSizeEstimate = Math.max(12, 12 + historyCount * 1.8).toFixed(1);

  return (
    <div className="simulation-panel">
      <div>
        {/* Header */}
        <div className="sim-header">
          <div className="sim-header-icon">
            <IconDatabase size={24} stroke={1.8} />
          </div>
          <div>
            <h2 className="sim-title">Panel de Control AI</h2>
            <p className="sim-subtitle">Simulador de conectividad y entorno rural</p>
          </div>
        </div>

        {/* Simular Red */}
        <div className="sim-section">
          <div className="sim-section-title">
            <span>Conexión a Internet</span>
            <span className={`sim-badge ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? <IconWifi size={12} stroke={2} /> : <IconWifiOff size={12} stroke={2} />}
              {isOnline ? 'CONECTADO (4G/Wi-Fi)' : 'SIN SEÑAL (Offline)'}
            </span>
          </div>
          <div className="sim-btn-group">
            <button
              onClick={() => setIsOnline(true)}
              className={`sim-btn ${isOnline ? 'active-online' : ''}`}
            >
              Simular Online
            </button>
            <button
              onClick={() => setIsOnline(false)}
              className={`sim-btn ${!isOnline ? 'active-offline' : ''}`}
            >
              Simular Offline
            </button>
          </div>
        </div>

        {/* Simular Ubicación GPS */}
        <div className="sim-section">
          <div className="sim-section-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IconMapPin size={16} stroke={2} className="text-primary" /> Ubicación del Agricultor
            </span>
          </div>
          <div className="gps-list">
            {GPS_PRESETS.map((preset) => {
              const isSelected = currentGPS.name === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => setCurrentGPS(preset)}
                  className={`gps-item ${isSelected ? 'active' : ''}`}
                >
                  <div className="gps-item-info">
                    <span className="gps-item-name">{preset.name}</span>
                    <span className="gps-item-coords">
                      Lat: {preset.lat.toFixed(4)}, Lng: {preset.lng.toFixed(4)}
                    </span>
                  </div>
                  {isSelected && <div className="gps-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Métricas de Base de Datos SQLite */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <span className="stat-title">Tamaño SQLite</span>
            <div className="stat-val-group">
              <span className="stat-val">{dbSizeEstimate}</span>
              <span className="stat-unit">KB</span>
            </div>
            <span className="stat-desc">Almacenamiento Local</span>
          </div>
          <div className="stat-card default">
            <span className="stat-title">Por Sincronizar</span>
            <div className="stat-val-group">
              <span className="stat-val" style={{ color: unsyncedCount > 0 ? 'var(--color-warning)' : 'inherit' }}>
                {unsyncedCount}
              </span>
              <span className="stat-unit">fichas</span>
            </div>
            <span className="stat-desc">Guardados offline</span>
          </div>
        </div>
      </div>

      {/* Consola e Historial de Sincronización */}
      <div className="log-console">
        <div className="log-console-header">
          <span className="log-console-title">
            <IconTerminal2 size={14} stroke={2} style={{ color: '#4ade80' }} /> LOGS DE BASE DE DATOS
          </span>
          <div className="log-btn-group">
            <button
              onClick={onSync}
              title="Sincronizar ahora"
              disabled={!isOnline || unsyncedCount === 0}
              className={`log-console-btn ${isOnline && unsyncedCount > 0 ? 'primary' : ''}`}
            >
              <IconRefresh size={12} stroke={2} className={unsyncedCount > 0 && isOnline ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClearDb}
              title="Restablecer base de datos SQLite"
              className="log-console-btn"
            >
              <IconTrash size={12} stroke={2} />
            </button>
          </div>
        </div>
        <div className="log-scroll-area">
          {syncLogs.map((log, index) => (
            <div
              key={index}
              className={`console-log-line`}
              style={{
                color: log.includes('✅') || log.includes('completada')
                  ? '#4ade80'
                  : log.includes('Error') || log.includes('abortada')
                  ? '#f87171'
                  : log.includes('Sincronizador')
                  ? '#22d3ee'
                  : '#94a3b8'
              }}
            >
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
