import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  IconCamera,
  IconFolderOpen
} from '@tabler/icons-react';
import { DISEASE_CATALOG } from './Database';
import {
  compressImage,
  analyzeByColor,
  CocoaPodSVG,
  DiagnosisAnalyzingView,
  DiagnosisDoneView,
  DiagnosisErrorView
} from './DiagnosisTab.subwidgets';
import logo from '../assets/logo.png';

export default function DiagnosisTab({
  onSaveDiagnosis,
  onRunOnlineDiagnosis,
  currentGPS,
  addLog,
  recentHistory = [],
  onNavigateTab,
  currentUser,
  onSelectRecord,
  onRegisterCameraTrigger
}) {
  const [capturedImage, setCapturedImage]     = useState(null);
  const [lastImgElement, setLastImgElement]   = useState(null);
  const [processingState, setProcessingState] = useState('idle'); // idle|analyzing|done|error
  const [aiProgress, setAiProgress]           = useState(0);
  const [aiLogMsg, setAiLogMsg]               = useState('');
  const [result, setResult]                   = useState(null);

  const fileInputRef = useRef(null);
  const progressRef  = useRef(null);
  const blobUrlRef   = useRef(null);

  const handleOpenCamera = useCallback(() => fileInputRef.current?.click(), []);

  const handleOpenGallery = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
    setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 500);
  };

  useEffect(() => {
    onRegisterCameraTrigger?.(handleOpenCamera);
    return () => onRegisterCameraTrigger?.(null);
  }, [onRegisterCameraTrigger, handleOpenCamera]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      clearInterval(progressRef.current);
    };
  }, []);

  const handleImageCapture = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setCapturedImage(blobUrl);
    setProcessingState('analyzing');
    setAiProgress(0);

    const img = new Image();
    img.onload = () => {
      setLastImgElement(img);
      runAnalysis(img, blobUrl);
    };
    img.onerror = () => {
      setProcessingState('error');
      setAiLogMsg('No se pudo decodificar la imagen capturada.');
    };
    img.src = blobUrl;
  }, []);

  const runAnalysis = async (imgEl, blobUrl) => {
    const STEPS = [
      'Preparando imagen...',
      'Conectando con el servidor en la nube...',
      'Analizando síntomas y signos fúngicos...',
      'Comparando patrones fitosanitarios...',
      'Generando recomendaciones de tratamiento...',
      'Registrando reporte agronómico...',
    ];
    let stepIdx = 0;

    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setAiProgress(p => Math.min(p + 16, 92));
      if (stepIdx < STEPS.length) {
        setAiLogMsg(STEPS[stepIdx++]);
      }
    }, 450);

    const base64Photo = compressImage(imgEl);

    try {
      const diagResult = await onRunOnlineDiagnosis(base64Photo);

      clearInterval(progressRef.current);
      setAiProgress(100);
      setAiLogMsg('Diagnóstico completado con éxito.');

      setTimeout(() => {
        setResult({
          disease: diagResult.disease,
          certainty: diagResult.certainty,
          model: 'Inteligencia Artificial CocoaShield',
          details: diagResult.details,
          photo: base64Photo
        });
        setProcessingState('done');
      }, 400);

    } catch (err) {
      clearInterval(progressRef.current);
      console.warn('Servidor cloud ocupado o no responde:', err.message);
      setAiProgress(0);
      setAiLogMsg('Tiempo de espera agotado.');

      setTimeout(() => {
        setProcessingState('error');
      }, 300);
    }
  };

  const handleRetry = () => {
    if (lastImgElement && capturedImage) {
      setProcessingState('analyzing');
      setAiProgress(0);
      runAnalysis(lastImgElement, capturedImage);
    } else {
      handleDiscard();
    }
  };

  const handleUseLocalFallback = () => {
    if (!lastImgElement) return;
    const base64Photo = compressImage(lastImgElement);
    const local = analyzeByColor(lastImgElement);
    setResult({
      disease: local.disease,
      certainty: local.certainty,
      model: 'Análisis Rápido Visual',
      details: null,
      photo: base64Photo
    });
    setProcessingState('done');
  };

  const handleSave = () => {
    if (!result) return;
    onSaveDiagnosis({
      disease:      result.disease,
      certainty:    result.certainty,
      latitude:     currentGPS.lat,
      longitude:    currentGPS.lng,
      locationName: currentGPS.name,
      photo:        result.photo,
      thumbnail:    result.disease.toLowerCase().replaceAll(' ', '_')
    });
    handleDiscard();
  };

  const handleDiscard = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setCapturedImage(null);
    setLastImgElement(null);
    setResult(null);
    setProcessingState('idle');
    setAiProgress(0);
    setAiLogMsg('');
    clearInterval(progressRef.current);
  };

  const activeDisease = result ? DISEASE_CATALOG[result.disease] : null;

  return (
    <div className="tab-content animate-fade-in">
      {/* ── Encabezado Superior con Marca ────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 2px 14px',
        marginBottom: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logo} alt="Logo CocoaShield" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover' }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-dark)', letterSpacing: '-0.3px' }}>
            CocoaShield AI
          </h1>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageCapture}
      />

      {/* ══ ESTADO: IDLE (HERO CARD DE ESCANEO & DIAGNÓSTICOS RECIENTES) ══════ */}
      {processingState === 'idle' && (
        <div className="flex flex-col gap-5">
          {/* Tarjeta Principal de Escaneo (Material 3 Filled Card) */}
          <div className="p-6 rounded-3xl bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] border-none shadow-[0_2px_16px_rgba(18,30,23,0.04)] dark:shadow-none flex flex-col items-center text-center gap-4.5">
            {/* Botón Circular Central de Cámara con Anillo Suave */}
            <button
              type="button"
              onClick={handleOpenCamera}
              aria-label="Abrir cámara para escanear mazorca"
              className="w-20 h-20 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 border-none select-none outline-none p-0"
            >
              <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md">
                <IconCamera size={28} stroke={2} />
              </div>
            </button>

            {/* Tipografía Fitosanitaria Limpia */}
            <div className="flex flex-col gap-1.5 max-w-[280px]">
              <h2 className="text-base font-extrabold text-[var(--color-text-dark)] m-0 tracking-tight">
                Escanear Mazorca de Cacao
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] m-0 leading-relaxed font-normal">
                Apunta la cámara al fruto a 20–30 cm con buena iluminación para diagnóstico instantáneo.
              </p>
            </div>

            {/* Acciones Rápidas (Cámara + Galería M3 Filled & Tonal) */}
            <div className="flex items-center gap-2.5 w-full max-w-[320px]">
              <button
                type="button"
                onClick={handleOpenCamera}
                className="flex-1 py-3.5 px-5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-on-primary)] text-xs font-bold border-none cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all select-none"
              >
                <IconCamera size={17} stroke={2.2} />
                <span>Abrir Cámara</span>
              </button>

              <button
                type="button"
                onClick={handleOpenGallery}
                title="Subir foto desde galería"
                className="py-3.5 px-5 rounded-full bg-[var(--color-surface-container-high)] hover:bg-[var(--color-surface-container-highest)] text-[var(--color-text-dark)] text-xs font-semibold border-none flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all select-none"
              >
                <IconFolderOpen size={17} stroke={2} />
                <span>Galería</span>
              </button>
            </div>
          </div>

          {/* Sección Inferior: Diagnósticos Recientes */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-extrabold text-[var(--color-text-dark)] m-0">
                Diagnósticos Recientes
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab?.('historial')}
                className="bg-transparent border-none text-[var(--color-primary)] text-xs font-bold cursor-pointer p-1 hover:underline"
              >
                Ver Todos
              </button>
            </div>

            {/* Carrusel de diagnósticos recientes M3 Filled Cards */}
            {recentHistory && recentHistory.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar items-center">
                {recentHistory.slice(0, 5).map((item) => {
                  const diseaseInfo = DISEASE_CATALOG[item.disease] || DISEASE_CATALOG['Sano'];
                  const photoSrc = item.photo || item.image;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (onSelectRecord) {
                          onSelectRecord(item);
                        } else {
                          onNavigateTab?.('historial');
                        }
                      }}
                      className="min-w-[112px] max-w-[112px] rounded-2xl overflow-hidden bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] border-none shadow-[0_2px_10px_rgba(18,30,23,0.04)] dark:shadow-none shrink-0 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 select-none p-0 text-left"
                    >
                      <div className="w-[112px] h-24 relative bg-[var(--color-surface-container)] overflow-hidden">
                        {photoSrc ? (
                          <img
                            src={photoSrc}
                            alt={item.disease}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <CocoaPodSVG type={item.disease} />
                        )}
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/65 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-full border-none leading-none">
                          {item.certainty}%
                        </span>
                      </div>
                      <div className="p-2.5 flex flex-col gap-0.5">
                        <div className="text-xs font-bold text-[var(--color-text-dark)] truncate">
                          {diseaseInfo.name}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] truncate font-normal">
                          {item.locationName || item.location || 'Finca Cacaotera'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 px-4 rounded-2xl bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] border-none text-[var(--color-text-muted)] text-xs">
                Aún no tienes fotos recientes registradas. Tu primera captura aparecerá aquí.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ESTADO: ANALYZING ══════════════════════════════════════════════════ */}
      {processingState === 'analyzing' && (
        <DiagnosisAnalyzingView
          capturedImage={capturedImage}
          aiProgress={aiProgress}
          aiLogMsg={aiLogMsg}
        />
      )}

      {/* ══ ESTADO: DONE ═══════════════════════════════════════════════════════ */}
      {processingState === 'done' && activeDisease && result && (
        <DiagnosisDoneView
          capturedImage={capturedImage}
          activeDisease={activeDisease}
          result={result}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}

      {/* ══ ESTADO: ERROR (REINTENTO Y RESPALDO LOCAL) ═════════════════════════ */}
      {processingState === 'error' && (
        <DiagnosisErrorView
          onRetry={handleRetry}
          onUseLocalFallback={handleUseLocalFallback}
          onDiscard={handleDiscard}
          hasLocalImage={Boolean(lastImgElement)}
        />
      )}
    </div>
  );
}
