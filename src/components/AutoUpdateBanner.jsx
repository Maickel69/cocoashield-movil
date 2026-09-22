import React, { useState, useEffect } from 'react';
import { IconRefresh } from '@tabler/icons-react';

export default function AutoUpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);

        // Detectar si ya hay una versión esperando ser activada
        if (reg.waiting) {
          setShowUpdate(true);
        }

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      }).catch((err) => {
        console.warn('[PWA] Error registrando ServiceWorker:', err);
      });

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      padding: '14px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      border: '1px solid #3b82f6',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '90%',
      width: '380px'
    }}>
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
        <IconRefresh size={18} className="text-blue-400" />
      </div>
      <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.4' }}>
        <strong>Nueva versión disponible</strong>
        <div style={{ color: '#94a3b8' }}>Se han aplicado mejoras en el sistema.</div>
      </div>
      <button
        onClick={handleUpdate}
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff',
          border: 'none',
          padding: '8px 14px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '12px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Actualizar
      </button>
    </div>
  );
}
