// Database.js — CocoaShield AI | Sincronización real con backend Express
// Reemplaza localStorage + postMessage por API REST real (fetch)

// ─── Detección dinámica de IP del servidor ───────────────────────────────────
// Cuando la app se abre desde Vercel (HTTPS), Chrome bloquea peticiones HTTP.
// Usamos automáticamente el puerto HTTPS 5443 del servidor local en ese caso.
const CLOUD_BACKEND_URL = 'https://cocoashield-backend.onrender.com';

const getBackendUrl = () => {
  const savedUrl = localStorage.getItem('cocoashield_backend_ip');
  if (savedUrl && (savedUrl.startsWith('http://') || savedUrl.startsWith('https://'))) {
    return savedUrl.replace(/\/$/, '');
  }
  return CLOUD_BACKEND_URL;
};

export let BACKEND_URL = getBackendUrl();

export const updateBackendIp = (ipOrUrl) => {
  if (!ipOrUrl) {
    localStorage.removeItem('cocoashield_backend_ip');
  } else {
    localStorage.setItem('cocoashield_backend_ip', ipOrUrl.trim());
  }
  BACKEND_URL = getBackendUrl();
};

// ─── Catálogo de Enfermedades ─────────────────────────────────────────────────
export const DISEASE_CATALOG = {
  'Escoba de Bruja': {
    name: 'Escoba de Bruja',
    scientificName: 'Crinipellis perniciosa',
    severity: 'Alta',
    description: 'Hongo que deforma las ramas haciendo que crezcan en racimo (parecido a una escoba de barrer) y pudre las mazorcas.',
    steps: [
      'Paso 1: Corta la rama afectada 30 centímetros por debajo de donde está lo dañado.',
      'Paso 2: Quema o entierra los restos de las ramas fuera de tu lote para que el hongo no vuele con el viento.',
      'Paso 3: Desinfecta tu machete o tijera con alcohol o cloro antes de podar otro árbol sano.'
    ],
    color: '#F4B400',
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  'Monilia': {
    name: 'Monilia del Cacao',
    scientificName: 'Moniliophthora roreri',
    severity: 'Crítica',
    description: 'Hongo que cubre la mazorca con un polvo blanco como ceniza, pudriendo los granos por dentro.',
    steps: [
      'Paso 1: Retira la mazorca enferma del árbol ANTES de que se ponga blanca y suelte el polvo.',
      'Paso 2: Coloca la mazorca infectada en el suelo y cúbrela bien con hojarasca seca para ahogar al hongo.',
      'Paso 3: Nunca muevas frutos enfermos de un lote a otro. Lávate las manos después de tocarlos.'
    ],
    color: '#D93025',
    badgeBg: 'bg-red-100 text-red-800'
  },
  'Mazorca Negra': {
    name: 'Mazorca Negra',
    scientificName: 'Phytophthora palmivora',
    severity: 'Media',
    description: 'Enfermedad por humedad que crea una mancha café o negra que cubre toda la mazorca rápidamente.',
    steps: [
      'Paso 1: Cosecha todas las mazorcas negras dañadas para que no contagien a las vecinas.',
      'Paso 2: Poda las ramas más bajas de los árboles para que entre viento y sol, secando la humedad.',
      'Paso 3: Limpia las zanjas de drenaje en tu terreno para evitar encharcamientos de agua de lluvia.'
    ],
    color: '#F4B400',
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  'Sano': {
    name: 'Cacao Saludable',
    scientificName: 'Theobroma cacao',
    severity: 'Ninguna',
    description: 'El fruto u hoja se encuentra fuerte, verde/amarillo brillante y sin síntomas de infección.',
    steps: [
      'Paso 1: Continúa revisando tus plantas una vez por semana.',
      'Paso 2: Mantén los pasillos limpios de maleza excesiva.',
      'Paso 3: Sigue cosechando a tiempo para mantener los frutos en su punto óptimo.'
    ],
    color: '#2C5E3B',
    badgeBg: 'bg-green-100 text-green-800'
  }
};

// ─── Historial local de respaldo (sólo se usa si el backend no responde) ──────
const LOCAL_STORAGE_KEY = 'cocoashield_sqlite_history';

const FALLBACK_HISTORY = [
  {
    id: 'scan-1',
    disease: 'Monilia',
    date: '2026-05-24T14:30:00Z',
    certainty: 95,
    latitude: -1.0234,
    longitude: -77.5432,
    locationName: 'Lote Este - Cerca al Río',
    synced: true,
  },
  {
    id: 'scan-2',
    disease: 'Sano',
    date: '2026-05-24T16:15:00Z',
    certainty: 99,
    latitude: -1.0256,
    longitude: -77.5401,
    locationName: 'Lote Norte - Entrada principal',
    synced: true,
  },
  {
    id: 'scan-3',
    disease: 'Escoba de Bruja',
    date: '2026-05-25T08:00:00Z',
    certainty: 88,
    latitude: -1.0289,
    longitude: -77.5478,
    locationName: 'Lote Sur - Finca Vieja',
    synced: false,
  }
];

// ─── Lectura del historial local ──────────────────────────────────────────────
const getLocalHistory = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : FALLBACK_HISTORY;
  } catch {
    return FALLBACK_HISTORY;
  }
};

const saveLocalHistory = (history) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
};

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────

/**
 * Obtiene el historial de escaneos.
 * Primero intenta cargarlo desde el backend; si falla, usa localStorage.
 */
export const getHistory = async () => {
  const localHistory = getLocalHistory();
  const unsynced = localHistory.filter(item => !item.synced);

  try {
    const response = await fetch(`${BACKEND_URL}/api/cases`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error('Backend no disponible');
    const serverCases = await response.json();

    // Convertir formato del servidor (CS-xxx) al formato interno de la app (scan-xxx)
    const serverHistory = serverCases.map(c => ({
      id: c.id.startsWith('CS-') ? `scan-${c.id.replace('CS-', '')}` : c.id,
      disease: c.diagnosis,
      date: c.date.includes('T') ? c.date : `${c.date}T00:00:00Z`,
      certainty: c.confidence,
      latitude: c.lat,
      longitude: c.lng,
      locationName: c.location,
      farmer: c.farmer || 'Productor Móvil',
      battery: c.battery || 85,
      deviceModel: c.deviceModel || 'Dispositivo Móvil',
      photo: c.image || null,
      synced: true
    }));

    // Combinar: mantener los no sincronizados al inicio, luego agregar los del servidor
    const merged = [...unsynced];
    for (const item of serverHistory) {
      if (!merged.some(m => m.id === item.id)) {
        merged.push(item);
      }
    }

    saveLocalHistory(merged);
    return merged;
  } catch {
    // Backend no disponible → usa caché local
    return localHistory;
  }
};

/**
 * Guarda un nuevo diagnóstico localmente (pendiente de sincronización).
 */
export const saveDiagnosis = (diagnosis) => {
  const history = getLocalHistory();
  const newRecord = {
    id: `scan-${Date.now()}`,
    date: new Date().toISOString(),
    synced: false,
    ...diagnosis
  };
  const updated = [newRecord, ...history];
  saveLocalHistory(updated);
  return newRecord;
};

/**
 * Realiza un diagnóstico online subiendo la foto al servidor backend.
 * Guarda el caso resultante directamente en la base de datos local (marcado como sincronizado).
 */
export const runOnlineDiagnosis = async (base64Photo, farmName, farmerName, currentGPS, deviceBattery, deviceModel) => {
  const payload = {
    image: base64Photo,
    location: farmName,
    farmer: farmerName,
    lat: currentGPS.lat,
    lng: currentGPS.lng
  };

  const response = await fetch(`${BACKEND_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': 'true'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000) // Aumentado a 60s para soportar el cold-start de TensorFlow en la CPU del servidor
  });

  if (!response.ok) {
    throw new Error(`Error en servidor: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Fallo en diagnóstico de IA');
  }

  // Guardar en la base de datos local (marcado como sincronizado)
  const history = getLocalHistory();
  const newRecord = {
    id: `scan-${result.caseData.id.replace('CS-', '')}`,
    date: result.caseData.date.includes('T') ? result.caseData.date : `${result.caseData.date}T00:00:00Z`,
    synced: true,
    disease: result.caseData.diagnosis,
    certainty: result.caseData.confidence,
    latitude: result.caseData.lat,
    longitude: result.caseData.lng,
    locationName: result.caseData.location,
    farmer: result.caseData.farmer,
    battery: deviceBattery || 85,
    deviceModel: deviceModel || 'Dispositivo Móvil',
    photo: base64Photo,
    thumbnail: result.caseData.diagnosis.toLowerCase().replace(/ /g, '_')
  };
  saveLocalHistory([newRecord, ...history]);

  return {
    success: true,
    disease: result.caseData.diagnosis,
    certainty: result.caseData.confidence,
    model: result.model || 'ResNet-50 (Servidor)',
    details: result.details || 'Procesado en el servidor backend con TensorFlow.',
    photo: base64Photo
  };
};

/**
 * Limpia la base de datos local y reinicia los datos por defecto.
 * También envía señal al servidor para reiniciar su db.json.
 */
export const clearDatabase = async () => {
  try {
    await fetch(`${BACKEND_URL}/api/cases/reset`, {
      method: 'POST',
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: AbortSignal.timeout(3000)
    });
  } catch {
    // ignorar si el backend no responde
  }
  saveLocalHistory(FALLBACK_HISTORY);
  return FALLBACK_HISTORY;
};

/**
 * Sincroniza los registros pendientes con el backend.
 * Convierte el formato scan-xxx al formato CS-xxx del servidor.
 * Llama a onLogProgress(string) para mostrar logs en el panel de simulación.
 */
export const syncPendingRecords = async (isOnline, onLogProgress) => {
  if (!isOnline) {
    onLogProgress?.('[Sincronizador] Error: Sin conexión al servidor backend. Abortando.');
    return { success: false, syncedCount: 0 };
  }

  const history = getLocalHistory();
  const pending = history.filter(item => !item.synced);

  if (pending.length === 0) {
    onLogProgress?.('[Sincronizador] No hay registros pendientes de subir.');
    return { success: true, syncedCount: 0 };
  }

  onLogProgress?.(`[Sincronizador] Detectados ${pending.length} registros pendientes en caché local.`);

  let syncedCount = 0;

  for (const item of pending) {
    onLogProgress?.(`[Sincronizador] Enviando escaneo ${item.id} (${item.disease}) al servidor...`);

    // Mapeo de coordenadas GPS → coordenadas SVG del dashboard
    const svgCoords = mapGpsToSvg(item.latitude, item.longitude);

    // Formato que espera el servidor
    const serverCase = {
      id: `CS-${item.id.replace('scan-', '')}`,
      location: item.locationName || 'Ubicación Móvil',
      region: svgCoords.region,
      date: item.date || new Date().toISOString(),
      diagnosis: item.disease,
      confidence: item.certainty || 90,
      status: item.disease === 'Sano' ? 'Resuelto' : (item.certainty > 90 ? 'Crítico' : 'En seguimiento'),
      farmer: item.farmer || 'Productor Móvil',
      battery: item.battery || 85,
      deviceModel: item.deviceModel || 'Dispositivo Móvil',
      lat: item.latitude,
      lng: item.longitude,
      svgX: svgCoords.x,
      svgY: svgCoords.y,
      severity: item.disease === 'Sano' ? 'ninguna' : (item.certainty > 90 ? 'alta' : 'media'),
      prescription: '',
      image: item.photo
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify(serverCase),
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok || response.status === 409) {
        // 409 = ya existe en el servidor, también lo marcamos como sincronizado
        item.synced = true;
        syncedCount++;
        onLogProgress?.(`[Sincronizador] ✅ Registro ${item.id} guardado en el servidor.`);
      } else {
        onLogProgress?.(`[Sincronizador] ⚠️ Error del servidor (${response.status}) para ${item.id}.`);
      }
    } catch (err) {
      onLogProgress?.(`[Sincronizador] ❌ Sin red: No se pudo enviar ${item.id}. Se reintentará.`);
    }
  }

  saveLocalHistory(history);
  onLogProgress?.(`[Sincronizador] Sincronización completada. ${syncedCount} de ${pending.length} subidos.`);

  return { success: syncedCount > 0, syncedCount };
};

// ─── Helper: Mapeo GPS → SVG (igual que en el dashboard) ────────────────────
const mapGpsToSvg = (lat, lng) => {
  if (lat === -1.0234 && lng === -77.5432) return { x: 190, y: 155, region: 'Sucumbíos' };
  if (lat === -1.0289 && lng === -77.5478) return { x: 280, y: 295, region: 'Napo' };
  if (lat === -1.0321 && lng === -77.5385) return { x: 370, y: 120, region: 'Sucumbíos' };
  if (lat === -1.0256 && lng === -77.5401) return { x: 230, y: 205, region: 'Napo' };
  if (lat === -1.0310 && lng === -77.5502) return { x: 110, y: 330, region: 'Orellana' };
  if (lat === -1.0198 && lng === -77.5460) return { x: 310, y: 80,  region: 'Pastaza' };
  if (lat === -1.0345 && lng === -77.5350) return { x: 440, y: 250, region: 'Napo' };
  if (lat === -1.0271 && lng === -77.5419) return { x: 250, y: 180, region: 'Sucumbíos' };
  if (lat === -1.0233 && lng === -77.5388) return { x: 340, y: 140, region: 'Napo' };
  if (lat === -1.0299 && lng === -77.5467) return { x: 170, y: 260, region: 'Napo' };
  if (lat === -1.0215 && lng === -77.5510) return { x: 80,  y: 190, region: 'Pastaza' };
  if (lat === -1.0330 && lng === -77.5330) return { x: 410, y: 320, region: 'Orellana' };

  const minLat = -1.036, maxLat = -1.018;
  const minLng = -77.552, maxLng = -77.531;
  const x = 40 + ((lng - minLng) / (maxLng - minLng)) * 420;
  const y = 360 - ((lat - minLat) / (maxLat - minLat)) * 320;
  const region = lng < -77.544
    ? (lat < -1.027 ? 'Orellana' : 'Pastaza')
    : (lat < -1.027 ? 'Napo' : 'Sucumbíos');

  return {
    x: Math.max(40, Math.min(460, x)),
    y: Math.max(40, Math.min(360, y)),
    region
  };
};
