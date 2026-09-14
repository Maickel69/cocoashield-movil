import React, { useState, useEffect } from 'react';
import { Camera, History, Wifi, Compass, Settings } from 'lucide-react';

export default function DeviceShell({
  isOnline,
  currentGPS,
  activeTab,
  setActiveTab,
  children,
  unsyncedCount
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="phone-wrapper">
      {/* Dynamic Status Bar */}
      <div className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{formatTime(time)}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span style={{ color: '#A7C5B0', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}>
            <Compass size={11} /> GPS: ON
          </span>
        </div>

        {/* Dynamic Signal/Network Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isOnline ? (
              <>
                <Wifi size={13} style={{ color: '#4ade80' }} />
                <span style={{ fontSize: '9px', color: '#A7C5B0' }}>4G</span>
              </>
            ) : (
              <Wifi size={13} style={{ color: '#94a3b8' }} />
            )}
          </div>
        </div>
      </div>

      {/* Screen Area (Active Tab) */}
      <div className="screen-container">
        <div className="screen-content">
          {children}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bottom-nav">
          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`nav-button ${activeTab === 'diagnostico' ? 'active' : ''}`}
          >
            <Camera size={22} />
            <span>Diagnóstico</span>
          </button>

          {/* Ocultado por solicitud del cliente: módulo de mapas desactivado
          <button
            onClick={() => setActiveTab('mapa')}
            className={`nav-button ${activeTab === 'mapa' ? 'active' : ''}`}
          >
            <Map size={22} />
            <span>Mapa Alertas</span>
          </button>
          */}

          <button
            onClick={() => setActiveTab('historial')}
            className={`nav-button ${activeTab === 'historial' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            <History size={22} />
            <span>Historial</span>
            {unsyncedCount > 0 && (
              <span className="nav-badge">
                {unsyncedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('configuracion')}
            className={`nav-button ${activeTab === 'configuracion' ? 'active' : ''}`}
          >
            <Settings size={22} />
            <span>Mi Cuenta</span>
          </button>
        </div>
      </div>

      {/* Rugged Phone Side Button Mockups (Physical Feel) */}
      <div className="absolute" style={{ left: '-4px', top: '140px', width: '4px', height: '60px', backgroundColor: '#325640', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', borderRight: '1px solid #1C2E24' }} />
      <div className="absolute" style={{ left: '-4px', top: '210px', width: '4px', height: '60px', backgroundColor: '#325640', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', borderRight: '1px solid #1C2E24' }} />
      <div className="absolute" style={{ right: '-4px', top: '180px', width: '4px', height: '80px', backgroundColor: '#22392B', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', borderLeft: '1px solid #1C2E24' }} />
    </div>
  );
}
