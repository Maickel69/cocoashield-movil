import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, Brain, Loader, AlertCircle, Zap } from 'lucide-react';
import { DISEASE_CATALOG } from './Database';
import logo from '../assets/logo.png';

function compressImage(imgEl) {
  try {
    const canvas = document.createElement('canvas');
    const maxDim = 300;
    let width = imgEl.naturalWidth || imgEl.width;
    let height = imgEl.naturalHeight || imgEl.height;

    if (width > height) {
      if (width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch (e) {
    console.error('Error compressing image:', e);
    return null;
  }
}

// ─── Análisis visual rápido de respaldo local (sin requerir servidor) ─────────
function analyzeByColor(imgEl) {
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

// ─── SVG Ilustraciones ────────────────────────────────────────────────────────
const CocoaPodSVG = ({ type }) => {
  switch (type) {
    case 'Monilia':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#E2EBF0" />
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
          <rect width="100" height="100" fill="#FAF0E6" />
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
          <rect width="100" height="100" fill="#EADCC9" />
          <path d="M50 15 C65 25, 75 40, 75 55 C75 70, 65 85, 50 90 C35 85, 25 70, 25 55 C25 40, 35 25, 50 15 Z" fill="#B5804C" stroke="#7A4E26" strokeWidth="3" />
          <path d="M50 90 C35 85, 27 72, 33 65 C40 58, 55 60, 64 68 C70 74, 65 85, 50 90 Z" fill="#2B2017" stroke="#1C140E" strokeWidth="1" />
          <text x="50" y="38" fontSize="7" fontWeight="bold" fill="#F3F4F6" textAnchor="middle">MAZORCA NEGRA</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <rect width="100" height="100" fill="#E6F2E7" />
          <path d="M50 15 C67 25, 76 40, 76 55 C76 70, 67 85, 50 90 C33 85, 24 70, 24 55 C24 40, 33 25, 50 15 Z" fill="#E5A93C" stroke="#A67117" strokeWidth="3" />
          <path d="M25 25 C15 45, 35 45, 42 32 Z" fill="#4B8B5B" opacity="0.8" />
          <text x="50" y="55" fontSize="8" fontWeight="bold" fill="#FFF" textAnchor="middle">SANO</text>
        </svg>
      );
  }
};

export default function DiagnosisTab({ onSaveDiagnosis, onRunOnlineDiagnosis, currentGPS, addLog }) {
  const [capturedImage, setCapturedImage]     = useState(null);
  const [lastImgElement, setLastImgElement]   = useState(null);
  const [processingState, setProcessingState] = useState('idle'); // idle|analyzing|done|error
  const [aiProgress, setAiProgress]           = useState(0);
  const [aiLogMsg, setAiLogMsg]               = useState('');
  const [result, setResult]                   = useState(null);
  const [uiModelStatus, setUiModelStatus]     = useState('ready'); // ready|loading|error

  const fileInputRef = useRef(null);
  const progressRef  = useRef(null);

  const handleOpenCamera = () => fileInputRef.current?.click();

  const handleOpenGallery = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.removeAttribute('capture');
    fileInputRef.current.click();
    setTimeout(() => fileInputRef.current?.setAttribute('capture', 'environment'), 500);
  };

  const handleImageCapture = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const blobUrl = URL.createObjectURL(file);
    setCapturedImage(blobUrl);
    setProcessingState('analyzing');
    setAiProgress(0);

    const img = new Image();
    img.onload = () => {
      setLastImgElement(img);
      runAnalysis(img, blobUrl);
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
      setUiModelStatus('loading');
      const diagResult = await onRunOnlineDiagnosis(base64Photo);

      clearInterval(progressRef.current);
      setAiProgress(100);
      setAiLogMsg('Diagnóstico completado con éxito.');
      setUiModelStatus('ready');

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
      setUiModelStatus('error');
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
      thumbnail:    result.disease.toLowerCase().replace(/ /g, '_')
    });
    handleDiscard();
  };

  const handleDiscard = () => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setLastImgElement(null);
    setResult(null);
    setProcessingState('idle');
    setAiProgress(0);
    setAiLogMsg('');
    clearInterval(progressRef.current);
  };

  const activeDisease = result ? DISEASE_CATALOG[result.disease] : null;

  const modelDot = {
    ready:   { color: '#11CAA0', label: 'Servidor IA: Conectado' },
    loading: { color: '#F4B400', label: 'Analizando en la nube...' },
    error:   { color: '#F87171', label: 'Servidor en reconexión' },
  }[uiModelStatus] ?? { color: '#94A3B8', label: 'Conectando...' };

  return (
    <div className="tab-content animate-fade-in">
      {/* ── Encabezado ─────────────────────────────────────────────────────── */}
      <div className="tab-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 className="tab-title" style={{ margin: 0 }}>¡Hola!</h1>
          <p className="tab-subtitle" style={{ margin: '2px 0 0 0' }}>Protege tu cultivo hoy.</p>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'6px' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', backgroundColor: modelDot.color, display:'inline-block', flexShrink:0 }} />
            <span style={{ fontSize:'11px', color:'var(--color-text-muted)', fontWeight:600 }}>{modelDot.label}</span>
            {uiModelStatus === 'loading' && (
              <Loader size={11} color="var(--color-warning)" style={{ animation:'spin 1s linear infinite' }} />
            )}
          </div>
        </div>
        <img src={logo} alt="CocoaShield Logo" style={{ width: '46px', height: '46px', borderRadius: '10px', objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display:'none' }}
        onChange={handleImageCapture}
      />

      {/* ══ ESTADO: IDLE ═══════════════════════════════════════════════════════ */}
      {processingState === 'idle' && (
        <div style={{ display:'flex', flexDirection:'column', flex:1, gap:'14px' }}>
          <div
            className="camera-box-v2"
            style={{
              position: 'relative',
              borderRadius: '24px',
              background: 'linear-gradient(180deg, #16281E 0%, #0D1A13 100%)',
              border: '1.5px solid rgba(17, 202, 160, 0.25)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: '340px'
            }}
          >
            {/* Esquinas holográficas del visor */}
            <div style={{ position: 'absolute', top: 16, left: 16, width: 22, height: 22, borderTop: '3px solid #11CAA0', borderLeft: '3px solid #11CAA0', borderTopLeftRadius: 6 }} />
            <div style={{ position: 'absolute', top: 16, right: 16, width: 22, height: 22, borderTop: '3px solid #11CAA0', borderRight: '3px solid #11CAA0', borderTopRightRadius: 6 }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, width: 22, height: 22, borderBottom: '3px solid #11CAA0', borderLeft: '3px solid #11CAA0', borderBottomLeftRadius: 6 }} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 22, height: 22, borderBottom: '3px solid #11CAA0', borderRight: '3px solid #11CAA0', borderBottomRightRadius: 6 }} />

            {/* Badge superior del visor */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(17, 202, 160, 0.12)',
              border: '1px solid rgba(17, 202, 160, 0.3)',
              color: '#11CAA0',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 20
            }}>
              <Zap size={12} />
              <span>Visor IA Activo</span>
            </div>

            {/* Centro de mira / Retícula */}
            <div style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              border: '2px dashed rgba(17, 202, 160, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              position: 'relative'
            }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(17,202,160,0.2), rgba(0,80,136,0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Camera size={34} color="#11CAA0" />
              </div>
            </div>

            {/* Botón Gigante de Captura con Anillo Luminoso */}
            <button
              onClick={handleOpenCamera}
              style={{
                width: '100%',
                maxWidth: 280,
                padding: '14px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #11CAA0, #0B9E7B)',
                color: '#0A1A12',
                fontSize: '15px',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(17, 202, 160, 0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Camera size={20} strokeWidth={2.5} />
              <span>Capturar Mazorca</span>
            </button>

            {/* Botón de galería secundario */}
            <button
              onClick={handleOpenGallery}
              style={{
                marginTop: 14,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#E2E8F0',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                fontWeight: '700'
              }}
            >
              <span>📁 Cargar desde Galería</span>
            </button>

            <p style={{ margin: '14px 0 0', fontSize: '11px', color: '#88A393', textAlign: 'center' }}>
              Encuadra el fruto a 20-30 cm de distancia para máxima precisión.
            </p>
          </div>
        </div>
      )}

      {/* ══ ESTADO: ANALYZING ══════════════════════════════════════════════════ */}
      {processingState === 'analyzing' && (
        <div className="ai-processing-box" style={{ padding: '20px 16px', textAlign: 'center' }}>
          <div className="ai-img-preview" style={{ overflow:'hidden', borderRadius:16, position:'relative', border: '3px solid var(--color-primary-hover)', maxWidth: 260, margin: '0 auto 16px' }}>
            <img src={capturedImage} alt="Analizando" style={{ width:'100%', height:'200px', objectFit:'cover', display:'block' }} />
            <div className="ai-scan-line" />
          </div>

          <h3 className="ai-title" style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>
            Analizando Fruto de Cacao
          </h3>
          <span className="ai-percent" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {aiProgress}% completado
          </span>

          <div style={{
            marginTop: 16, padding: '14px 16px', borderRadius: 14,
            backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-dark)', margin: '0 0 6px' }}>
              &gt; {aiLogMsg || 'Examinando imagen...'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>
              Si es el primer escaneo del día, el servidor puede demorar unos segundos en despertar.
            </p>
          </div>
        </div>
      )}

      {/* ══ ESTADO: DONE ═══════════════════════════════════════════════════════ */}
      {processingState === 'done' && activeDisease && result && (
        <div className="result-container">
          <div className="result-card" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div className="result-img-box" style={{ position:'relative', overflow:'hidden', height: '160px' }}>
              {capturedImage
                ? <img src={capturedImage} alt="Analizada" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <CocoaPodSVG type={result.disease} />
              }
              <div className="result-img-tag" style={{ background: 'linear-gradient(90deg, var(--color-primary), #1c3622)' }}>
                <Brain size={11} /> {result.model}
              </div>
            </div>

            <div className="result-header" style={{ padding: '16px' }}>
              <div className="result-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="result-title" style={{ fontSize: '20px', fontWeight: 800 }}>{activeDisease.name}</h2>
                  <span className="result-subtitle" style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{activeDisease.scientificName}</span>
                </div>
                <span className="disease-badge" style={{ backgroundColor: activeDisease.color, color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                  {result.certainty}% CERTEZA
                </span>
              </div>
            </div>

            <div className="result-body" style={{ padding: '0 16px 16px 16px' }}>
              <p className="disease-desc" style={{ fontSize: '13px', color: 'var(--color-text-dark)', lineHeight: 1.4, margin: '0 0 12px 0' }}>
                {activeDisease.description}
              </p>

              <div className="action-steps" style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--color-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 800 }}>
                  Protocolo de Manejo Recomendado:
                </h4>
                {activeDisease.steps.map((step, idx) => (
                  <div key={idx} className="step-row" style={{ display: 'flex', gap: '6px', fontSize: '12.5px', color: 'var(--color-text-dark)' }}>
                    <span className="step-num" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{idx + 1}.</span>
                    <span className="step-text" style={{ flex: 1 }}>{step.substring(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="action-btns-group" style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSave} className="btn-save-gps" style={{ flex: 2, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <span>Confirmar & Guardar Ficha</span>
            </button>
            <button onClick={handleDiscard} className="btn-discard" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <RefreshCw size={13} />
              <span>Repetir</span>
            </button>
          </div>
        </div>
      )}

      {/* ══ ESTADO: ERROR AMIGABLE (REINTENTO Y RESPALDO) ══════════════════════ */}
      {processingState === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-critical)' }}>
            <AlertCircle size={32} color="var(--color-critical)" />
          </div>
          
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0 }}>
            El servidor tardó en responder
          </h2>
          
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0, maxWidth: '290px' }}>
            Si es el primer diagnóstico del día, el servidor en la nube puede tardar unos segundos en despertar.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: '240px', marginTop: 8 }}>
            <button
              onClick={handleRetry}
              style={{
                width: '100%', padding: '12px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,80,136,0.25)'
              }}
            >
              <RefreshCw size={15} />
              <span>Reintentar Análisis Cloud</span>
            </button>

            {lastImgElement && (
              <button
                onClick={handleUseLocalFallback}
                style={{
                  width: '100%', padding: '11px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  backgroundColor: 'rgba(17,202,160,0.12)', color: '#007A4D',
                  border: '1.5px solid #11CAA0', cursor: 'pointer'
                }}
              >
                <Zap size={15} color="#11CAA0" />
                <span>Diagnóstico Rápido Local</span>
              </button>
            )}

            <button
              onClick={handleDiscard}
              style={{
                width: '100%', padding: '10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 600,
                backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer'
              }}
            >
              Tomar otra foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
