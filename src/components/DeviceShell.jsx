import React from 'react';
import { IconCamera, IconHistory, IconSettings } from '@tabler/icons-react';
import './DeviceShell.css';

export default function DeviceShell({
  isOnline,
  currentGPS,
  activeTab,
  setActiveTab,
  children,
  unsyncedCount
}) {
  return (
    <div className="phone-wrapper">
      {/* Screen Area (Active Tab) */}
      <div className="screen-container">
        <div className="screen-content">
          {children}
        </div>

        {/* Bottom Navigation Bar - Floating Island Style */}
        <div className="bottom-nav">
          <div className="floating-nav-island">
            <button
              onClick={() => setActiveTab('diagnostico')}
              className={`nav-button ${activeTab === 'diagnostico' ? 'active' : ''}`}
            >
              <IconCamera size={20} stroke={1.8} />
              <span>Diagnóstico</span>
            </button>

            <button
              onClick={() => setActiveTab('historial')}
              className={`nav-button ${activeTab === 'historial' ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <IconHistory size={20} stroke={1.8} />
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
              <IconSettings size={20} stroke={1.8} />
              <span>Mi Cuenta</span>
            </button>
          </div>

          {/* Botón Circular de Acción Principal en la Esquina (Cámara / Captura) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('diagnostico');
              // Disparar click en input si existe en el DOM
              setTimeout(() => {
                const fileInputs = document.querySelectorAll('input[type="file"]');
                if (fileInputs && fileInputs.length > 0) {
                  fileInputs[0].click();
                }
              }, 50);
            }}
            className="floating-action-fab"
            title="Tomar Foto / Analizar Mazorca"
          >
            <IconCamera size={26} stroke={2} />
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
