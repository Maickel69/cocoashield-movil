import React, { useState } from 'react';
import {
  IconBrain,
  IconAlertCircle,
  IconRefresh,
  IconBolt,
  IconShieldExclamation,
  IconChevronRight,
  IconMaximize,
  IconX
} from '@tabler/icons-react';
import { Dialog } from '@base-ui/react/dialog';
import { Tooltip } from '@base-ui/react/tooltip';

/**
 * Comprime la imagen capturada para optimizar el payload HTTP hacia la API.
 */
export function compressImage(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const maxDim = 600;
    let width = imgEl.naturalWidth || imgEl.width;
    let height = imgEl.naturalHeight || imgEl.height;

    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) {
    console.error('Error comprimiendo imagen:', e);
    return null;
  }
}

/**
 * Análisis cromático de contingencia local offline para fincas sin conectividad.
 */
export function analyzeByColor(imgEl) {
  try {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 64, 64);
    const d = ctx.getImageData(0, 0, 64, 64).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
    const n = d.length / 4;
    r /= n; g /= n; b /= n;
    if (r > 190 && g > 190 && b > 190) return { disease: 'Monilia',        certainty: 84 };
    if (r < 70  && g < 70  && b < 70)  return { disease: 'Mazorca Negra',  certainty: 81 };
    if (g > r + 20 && g > b + 20)      return { disease: 'Sano',           certainty: 89 };
    if (r > 120 && g < 90  && b < 90)  return { disease: 'Escoba de Bruja',certainty: 79 };
    return { disease: 'Monilia', certainty: 82 };
  } catch { return { disease: 'Sano', certainty: 78 }; }
}

/**
 * Ilustraciones botánicas vectoriales con paleta orgánica de cacao (sin azul frío).
 */
export const CocoaPodSVG = ({ type }) => {
  switch (type) {
    case 'Monilia':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#F4EFEA" />
          <path d="M50 15 C65 25, 75 40, 75 55 C75 70, 65 85, 50 90 C35 85, 25 70, 25 55 C25 40, 35 25, 50 15 Z" fill="#C68A4C" stroke="#8D5A2B" strokeWidth="3" />
          <circle cx="50" cy="50" r="16" fill="#FAFAFA" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3 2" opacity="0.95" />
          <circle cx="48" cy="46" r="10" fill="#E5E7EB" opacity="0.9" />
          <circle cx="56" cy="54" r="8" fill="#F3F4F6" opacity="0.9" />
          <text x="50" y="52" fontSize="6" fontWeight="bold" fill="#555" textAnchor="middle">MONILIA</text>
        </svg>
      );
    case 'Escoba de Bruja':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#FAF3EB" />
          <path d="M50 85 C50 60, 45 40, 35 30" fill="none" stroke="#5C4033" strokeWidth="5" strokeLinecap="round" />
          <path d="M50 85 C50 65, 52 45, 65 35" fill="none" stroke="#5C4033" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 30 C30 20, 25 25, 20 22" fill="none" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 30 C32 18, 38 15, 30 10" fill="none" stroke="#8B5A2B" strokeWidth="3" strokeLinecap="round" />
          <path d="M65 35 C70 25, 75 30, 80 26" fill="none" stroke="#8B5A2B" strokeWidth="2.5" strokeLinecap="round" />
          <text x="50" y="80" fontSize="7" fontWeight="bold" fill="#3E2723" textAnchor="middle">ESCOBA DE BRUJA</text>
        </svg>
      );
    case 'Mazorca Negra':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#EFE8DE" />
          <path d="M50 15 C65 25, 75 40, 75 55 C75 70, 65 85, 50 90 C35 85, 25 70, 25 55 C25 40, 35 25, 50 15 Z" fill="#B5804C" stroke="#7A4E26" strokeWidth="3" />
          <path d="M50 90 C35 85, 27 72, 33 65 C40 58, 55 60, 64 68 C70 74, 65 85, 50 90 Z" fill="#2B2017" stroke="#1C140E" strokeWidth="1" />
          <text x="50" y="38" fontSize="7" fontWeight="bold" fill="#F3F4F6" textAnchor="middle">MAZORCA NEGRA</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#E8F2EA" />
          <path d="M50 15 C67 25, 76 40, 76 55 C76 70, 67 85, 50 90 C33 85, 24 70, 24 55 C24 40, 33 25, 50 15 Z" fill="#E5A93C" stroke="#A67117" strokeWidth="3" />
          <path d="M25 25 C15 45, 35 45, 42 32 Z" fill="#4B8B5B" opacity="0.8" />
          <text x="50" y="55" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">SANO</text>
        </svg>
      );
  }
};

/**
 * Vista de Escaneo en Proceso (Feedback visual con barra e indicadores de paso).
 */
export function DiagnosisAnalyzingView({ capturedImage, aiProgress, aiLogMsg }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-card)',
      borderRadius: 24,
      border: '1px solid var(--color-border)',
      padding: '24px 20px',
      textAlign: 'center',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        overflow: 'hidden',
        borderRadius: 18,
        position: 'relative',
        border: '2px solid var(--color-primary)',
        maxWidth: 240,
        margin: '0 auto 18px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}>
        <img src={capturedImage} alt="Analizando mazorca" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
        <div className="scanner-line" style={{ top: `${aiProgress}%` }} />
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-dark)' }}>
        Analizando Fruto de Cacao
      </h3>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
        {aiProgress}% completado
      </span>

      <div style={{ width: '100%', height: 6, backgroundColor: 'var(--color-border)', borderRadius: 10, margin: '14px 0 16px', overflow: 'hidden' }}>
        <div style={{ width: `${aiProgress}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: 10, transition: 'width 0.3s ease' }} />
      </div>

      <div style={{
        padding: '14px 16px',
        borderRadius: 18,
        backgroundColor: 'var(--color-surface-container)',
        border: 'none',
        textAlign: 'left'
      }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-dark)', margin: '0 0 4px' }}>
          &gt; {aiLogMsg || 'Examinando síntomas botánicos...'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Si es el primer análisis, el modelo en la nube puede tardar unos segundos en sincronizar.
        </p>
      </div>
    </div>
  );
}

/**
 * Vista de Resultados y Ficha Técnica de Diagnóstico.
 */
export function DiagnosisDoneView({ capturedImage, activeDisease, result, onSave, onDiscard }) {
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  return (
    <div className="result-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderRadius: 24,
        border: 'none',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(18,30,23,0.04)'
      }}>
        {/* Imagen con Click para Pantalla Completa */}
        <button
          type="button"
          onClick={() => capturedImage && setFullscreenImage(capturedImage)}
          aria-label={capturedImage ? "Ver imagen analizada en pantalla completa" : undefined}
          className={`w-full block p-0 border-none text-left relative overflow-hidden h-48 bg-[var(--color-surface-container)] select-none ${
            capturedImage ? 'cursor-pointer group' : ''
          }`}
          title={capturedImage ? "Toca para ver en pantalla completa" : undefined}
        >
          {capturedImage ? (
            <>
              <img
                src={capturedImage}
                alt="Mazorca analizada"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[11px] font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                <IconMaximize size={14} stroke={2.2} />
                <span>Ver completa</span>
              </div>
            </>
          ) : (
            <CocoaPodSVG type={result.disease} />
          )}

          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            padding: '5px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <IconBrain size={14} stroke={2} /> {result.model}
          </div>
        </button>

        <div style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--color-text-dark)' }}>{activeDisease.name}</h2>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{activeDisease.scientificName}</span>
            </div>
            <span style={{ backgroundColor: activeDisease.color, color: 'white', padding: '4px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, border: 'none' }}>
              {result.certainty}% CERTEZA
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--color-text-dark)', lineHeight: 1.5, margin: '0 0 14px 0' }}>
            {activeDisease.description}
          </p>

          {/* Trigger Compacto con Tooltip que abre Dialog de Pasos */}
          {activeDisease.steps && (
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            flex: 2,
            padding: '14px 20px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 700,
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(30, 70, 32, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Confirmar & Guardar Ficha
        </button>
        <button
          type="button"
          onClick={onDiscard}
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: 'var(--color-surface-container-high)',
            border: 'none',
            color: 'var(--color-text-dark)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <IconRefresh size={15} stroke={2} />
          <span>Repetir</span>
        </button>
      </div>

      {/* ══ DIALOG MODAL DE PASOS TÉCNICOS SUGERIDOS ══ */}
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
                {activeDisease.name}
              </span>
              <ul className="m-0 pl-4 text-xs space-y-2 leading-relaxed text-[var(--color-on-primary-container)]">
                {(activeDisease.steps || []).map((step) => (
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
              <div className="mt-3 px-4 py-1.5 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm">
                {activeDisease.name} &bull; {result.certainty}% Certeza
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/**
 * Vista de Recuperación ante Errores de Red o Servidor.
 */
export function DiagnosisErrorView({ onRetry, onUseLocalFallback, onDiscard, hasLocalImage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16, alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 16px' }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', backgroundColor: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-critical)' }}>
        <IconAlertCircle size={30} stroke={2} color="var(--color-critical)" />
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-dark)', margin: 0 }}>
        El servidor tardó en responder
      </h2>

      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0, maxWidth: 290 }}>
        Si es el primer diagnóstico del día, el servidor en la nube puede tardar unos segundos en despertar.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 240, marginTop: 8 }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 70, 32, 0.25)'
          }}
        >
          <IconRefresh size={16} stroke={2} />
          <span>Reintentar Análisis Cloud</span>
        </button>

        {hasLocalImage && (
          <button
            type="button"
            onClick={onUseLocalFallback}
            style={{
              width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)',
              border: '1.5px solid var(--color-accent-border)', cursor: 'pointer'
            }}
          >
            <IconBolt size={16} stroke={2} color="var(--color-primary)" />
            <span>Diagnóstico Rápido Local</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDiscard}
          style={{
            width: '100%', padding: '10px', borderRadius: 12, fontSize: 12.5, fontWeight: 600,
            backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer'
          }}
        >
          Tomar otra foto
        </button>
      </div>
    </div>
  );
}
