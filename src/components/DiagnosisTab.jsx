import React, { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, HardDrive, Brain, Loader, AlertCircle } from 'lucide-react';
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
    return canvas.toDataURL('image/jpeg', 0.6); // Compress to JPEG, 60% quality
  } catch (e) {
    console.error('Error compressing image:', e);
    return null;
  }
}

// ─── Análisis de color como respaldo (canvas, sin TF.js en el cliente) ─────────────────────
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
    if (r > 190 && g > 190 && b > 190) return { disease: 'Monilia',        certainty: 80 };
    if (r < 70  && g < 70  && b < 70)  return { disease: 'Mazorca Negra',  certainty: 77 };
    if (g > r + 20 && g > b + 20)      return { disease: 'Sano',           certainty: 85 };
    if (r > 120 && g < 90  && b < 90)  return { disease: 'Escoba de Bruja',certainty: 76 };
    return { disease: 'Sano', certainty: 78 };
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
    addLog?.(`[Cámara] Foto capturada: ${file.name} (${Math.round(file.size / 1024)} KB)`);

    const img = new Image();
    img.onload = () => runAnalysis(img, blobUrl);
    img.src = blobUrl;
  }, [addLog]);

  const runAnalysis = async (imgEl, blobUrl) => {
    const STEPS = [
      'Optimizando tamaño de imagen...',
      'Subiendo al servidor central...',
      'Procesando capas en ResNet-50...',
      'Clasificando con TensorFlow en Python...',
      'Generando diagnóstico fitosanitario...',
      'Registrando alerta epidemiológica...',
    ];
    let stepIdx = 0;

    clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setAiProgress(p => Math.min(p + 16, 95));
      if (stepIdx < STEPS.length) {
        setAiLogMsg(STEPS[stepIdx++]);
      }
    }, 350);

    const base64Photo = compressImage(imgEl);

    try {
      addLog?.('[IA] Iniciando inferencia en servidor central (ResNet-50)...');
      setUiModelStatus('loading');

      const diagResult = await onRunOnlineDiagnosis(base64Photo);

      clearInterval(progressRef.current);
      setAiProgress(100);
      setAiLogMsg('Diagnóstico completado en el servidor.');
      setUiModelStatus('ready');

      setTimeout(() => {
        setResult({
          disease: diagResult.disease,
          certainty: diagResult.certainty,
          model: diagResult.model,
          details: diagResult.details,
          photo: base64Photo
        });
        setProcessingState('done');
        addLog?.(`[IA] ✅ ${diagResult.disease} — ${diagResult.certainty}% certeza (${diagResult.model})`);
      }, 400);

    } catch (err) {
      clearInterval(progressRef.current);
      console.error('Error análisis IA servidor:', err);
      addLog?.('[IA] ❌ El servidor central de IA no responde. Se requiere conexión activa.');
      setUiModelStatus('error');
      setAiProgress(0);
      setAiLogMsg('Error de conexión.');

      setTimeout(() => {
        setProcessingState('error');
      }, 400);
    }
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
    setResult(null);
    setProcessingState('idle');
    setAiProgress(0);
    setAiLogMsg('');
    clearInterval(progressRef.current);
  };

  const activeDisease = result ? DISEASE_CATALOG[result.disease] : null;

  const modelDot = {
    ready:   { color: '#11CAA0', label: 'Servidor IA: ResNet-50 (Online)' },
    loading: { color: '#F4B400', label: 'Procesando en servidor...' },
    error:   { color: '#F87171', label: 'Servidor IA: Desconectado' },
  }[uiModelStatus] ?? { color: '#94A3B8', label: 'Inicializando...' };

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
        <div style={{ display:'flex', flexDirection:'column', flex:1, gap:'12px' }}>
          <div className="camera-box" style={{ border: '2px dashed var(--color-primary-hover)', backgroundColor: 'var(--color-bg)' }}>
            <div style={{ width:84, height:84, borderRadius:'50%', backgroundColor:'var(--color-accent)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
              <Camera size={38} strokeWidth={2} color="var(--color-primary)" />
            </div>

            <button onClick={handleOpenCamera} className="camera-btn-giant animate-pulse-glow" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-primary), #1b3823)' }}>
              <Camera size={20} />
              <span>Tomar Foto al Fruto/Hoja</span>
            </button>

            <button
              onClick={handleOpenGallery}
              style={{ marginTop:12, background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', padding:'4px 8px', fontWeight: '700' }}
            >
              📁 Seleccionar desde galería
            </button>
          </div>

          {uiModelStatus === 'loading' && (
            <div className="info-loading-box" style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12 }}>
              <Loader size={16} className="info-loading-icon" style={{ animation:'spin 1s linear infinite', flexShrink:0 }} />
              <div>
                <p style={{ fontSize:12, fontWeight:700, margin:0 }} className="info-loading-title">Procesando en servidor...</p>
                <p style={{ fontSize:11, margin:0 }} className="info-loading-desc">Estableciendo conexión y subiendo telemetría e imagen.</p>
              </div>
            </div>
          )}
          {uiModelStatus === 'error' && (
            <div className="info-warning-box" style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12 }}>
              <AlertCircle size={16} className="info-warning-icon" style={{ flexShrink:0 }} />
              <p style={{ fontSize:11, fontWeight:600, margin:0 }} className="info-warning-text">
                El servidor central está desconectado. Verifique la IP o conéctese a la misma red local.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══ ESTADO: ANALYZING ══════════════════════════════════════════════════ */}
      {processingState === 'analyzing' && (
        <div className="ai-processing-box">
          <div className="ai-img-preview" style={{ overflow:'hidden', borderRadius:16, position:'relative', border: '3px solid var(--color-primary-hover)' }}>
            {capturedImage
              ? <img src={capturedImage} alt="Analizando" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <Brain size={48} color="#11CAA0" />
            }
            <div className="scanner-line" />
          </div>

          <div className="ai-progress-track">
            <div className="ai-progress-bar" style={{ width:`${aiProgress}%`, transition:'width 0.35s ease' }} />
          </div>

          <h3 className="ai-title">ANALIZANDO IMAGEN EN SERVIDOR</h3>
          <span className="ai-percent">{aiProgress}% COMPLETO</span>

          <div className="ai-specs-box" style={{ borderRadius: '12px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="ai-spec-row">
              <span>Modelo:</span>
              <span className="ai-spec-val">ResNet-50 (TensorFlow Keras)</span>
            </div>
            <div className="ai-spec-row">
              <span>Servidor:</span>
              <span className="ai-spec-val green">Express + Python central</span>
            </div>
            <div className="ai-spec-row">
              <span>Red:</span>
              <span className="ai-spec-val green">ONLINE (Subida Base64)</span>
            </div>
            <div className="ai-divider" />
            <div className="ai-spec-log animate-pulse">&gt; {aiLogMsg}</div>
          </div>
        </div>
      )}

      {/* ══ ESTADO: DONE ═══════════════════════════════════════════════════════ */}
      {processingState === 'done' && activeDisease && result && (
        <div className="result-container">
          <div className="result-card" style={{ borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {/* Foto real capturada */}
            <div className="result-img-box" style={{ position:'relative', overflow:'hidden', height: '160px' }}>
              {capturedImage
                ? <img src={capturedImage} alt="Analizada" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <CocoaPodSVG type={result.disease} />
              }
              <div className="result-img-tag" style={{ background: 'linear-gradient(90deg, var(--color-primary), #1c3622)' }}>
                <Brain size={11} /> {result.model || 'ResNet-50'}
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="result-header" style={{ padding: '16px' }}>
              <div className="result-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className="result-title" style={{ fontSize: '20px', fontWeight: 800 }}>{activeDisease.name}</h2>
                  <span className="result-subtitle" style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{activeDisease.scientificName}</span>
                </div>
                <span className={`severity-badge ${
                  activeDisease.severity === 'Ninguna' ? 'none'
                  : activeDisease.severity === 'Media' ? 'medium' : 'critical'
                }`} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px' }}>
                  Riesgo: {activeDisease.severity}
                </span>
              </div>

              {/* Barra certeza */}
              <div style={{ marginTop:12 }}>
                <div className="certainty-label-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Certeza de predicción:</span>
                  <span style={{ fontWeight:900, color:'var(--color-text-dark)' }}>{result.certainty}%</span>
                </div>
                <div className="certainty-bar-track" style={{ height: '6px', borderRadius: '3px' }}>
                  <div className="certainty-bar" style={{ width:`${result.certainty}%`, backgroundColor: activeDisease.color, height: '100%', borderRadius: '3px' }} />
                </div>
              </div>

              {/* Detalles del modelo ejecutado */}
              <div style={{ marginTop: 12, fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <Brain size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span style={{ lineHeight: 1.3 }}><strong>Nota:</strong> {result.details}</span>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="solution-container" style={{ padding: '16px', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
              <div className="solution-title-group" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
                <CheckCircle size={15} />
                <span>Instrucciones recomendadas:</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {activeDisease.steps.map((step, idx) => (
                  <div key={idx} className="step-row" style={{ display: 'flex', gap: '6px', fontSize: '12.5px', color: 'var(--color-text-dark)' }}>
                    <span className="step-num" style={{ fontWeight: 800, color: 'var(--color-primary)' }}>{idx + 1}.</span>
                    <span className="step-text" style={{ flex: 1 }}>{step.substring(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botones */}
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

      {/* ══ ESTADO: ERROR (SERVIDOR DESCONECTADO) ═══════════════════════════════ */}
      {processingState === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px 16px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'rgba(217, 48, 37, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', border: '2px solid var(--color-critical)' }}>
            <AlertCircle size={36} color="var(--color-critical)" />
          </div>
          
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-dark)', margin: 0 }}>
            Servidor de IA Desconectado
          </h2>
          
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0, maxWidth: '280px' }}>
            El modo offline de respaldo local ha sido desactivado. Todo el procesamiento de red neuronal ResNet-50 requiere conexión activa con el servidor. 
            <br /><br />
            Por favor, asegúrese de que el celular tenga acceso a internet o esté en la misma red local que la PC del servidor de CocoaShield.
          </p>

          <button onClick={handleDiscard} className="btn-discard" style={{ width: '100%', maxWidth: '200px', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <RefreshCw size={14} />
            <span>Volver a Intentar</span>
          </button>
        </div>
      )}
    </div>
  );
}
