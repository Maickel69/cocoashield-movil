// Database.js — CocoaShield Cloud AI | 100% Online Cloud Integration
// Integración directa y limpia con la API de IA en la nube (Render & Supabase)

export const BACKEND_URL = 'https://cocoashield-backend.onrender.com';
export const updateBackendIp = () => {};
export const clearDatabase = () => {};
export const syncPendingRecords = async () => [];

// ─── Catálogo de Enfermedades y Protocolos Fitosantitarios ─────────────────────
export const DISEASE_CATALOG = {
  'Escoba de Bruja': {
    name: 'Escoba de Bruja',
    scientificName: 'Moniliophthora perniciosa',
    severity: 'Alta',
    description: 'Hongo que deforma las ramas haciendo que crezcan en racimo y pudre las mazorcas.',
    steps: [
      'Paso 1: Corta la rama afectada 30 cm por debajo de la zona infectada.',
      'Paso 2: Quema o entierra los restos de las ramas fuera de tu lote.',
      'Paso 3: Desinfecta herramientas de corte con alcohol al 70% o cloro antes de podar otro árbol.'
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
      'Paso 1: Retira la mazorca enferma del árbol ANTES de que suelte el polvo de esporas.',
      'Paso 2: Coloca la mazorca infectada en el suelo y cúbrela bien con hojarasca seca.',
      'Paso 3: Evita mover frutos enfermos entre lotes. Lávate las manos después del manejo.'
    ],
    color: '#D93025',
    badgeBg: 'bg-red-100 text-red-800'
  },
  'Mazorca Negra': {
    name: 'Mazorca Negra',
    scientificName: 'Phytophthora spp.',
    severity: 'Media-Alta',
    description: 'Enfermedad fúngica por alta humedad que genera una mancha necrótica que cubre toda la mazorca.',
    steps: [
      'Paso 1: Cosecha y retira todas las mazorcas infectadas para evitar contagios.',
      'Paso 2: Poda las ramas más bajas para incrementar la radiación solar y la ventilación.',
      'Paso 3: Limpia las zanjas de drenaje para evitar encharcamientos de agua de lluvia.'
    ],
    color: '#F4B400',
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  'Sano': {
    name: 'Cacao Saludable',
    scientificName: 'Theobroma cacao (Saludable)',
    severity: 'Ninguna',
    description: 'El fruto se encuentra en excelente estado fitosanitario, sin infecciones visibles.',
    steps: [
      'Paso 1: Continúa realizando inspecciones semanales en tus lotes.',
      'Paso 2: Mantén los pasillos limpios de maleza excesiva.',
      'Paso 3: Aplica fertilización balanceada y buenas prácticas agrícolas (BPA).'
    ],
    color: '#2C5E3B',
    badgeBg: 'bg-green-100 text-green-800'
  }
};

/**
 * Obtiene el historial de casos directamente desde la API Cloud en Supabase / Backend.
 */
export const getHistory = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cases`);
    if (!response.ok) throw new Error('Error de conexión con el backend en la nube');
    const cases = await response.json();
    return cases.map(c => ({
      id: c.id,
      disease: c.diagnosis || c.disease,
      certainty: c.confidence || c.certainty,
      date: c.date || c.created_at || new Date().toISOString(),
      locationName: c.location || 'Finca Cacaotera',
      farmer: c.farmer || 'Técnico Agrónomo',
      severity: c.severity || 'Media',
      image: c.image
    }));
  } catch (error) {
    console.error('[Cloud DB] Error consultando historial:', error);
    return [];
  }
};

/**
 * Ejecuta el diagnóstico de Inteligencia Artificial en la nube.
 */
export const runOnlineDiagnosis = async (imageBase64, locationObj) => {
  const payload = {
    image: imageBase64,
    location: locationObj?.name || 'Finca Cacaotera',
    region: 'Napo',
    farmer: localStorage.getItem('cocoashield_farmer_name') || 'Productor Cacaotero',
    lat: locationObj?.lat || -1.0234,
    lng: locationObj?.lng || -77.5432
  };

  const response = await fetch(`${BACKEND_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error procesando diagnóstico en la nube');
  }

  const result = await response.json();
  return {
    disease: result.caseData?.diagnosis || 'Sano',
    certainty: result.caseData?.confidence || 95,
    details: result.details,
    model: result.model,
    caseData: result.caseData
  };
};

/**
 * Guarda un diagnóstico en el servidor de la nube.
 */
export const saveDiagnosis = async (record) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return response.ok;
  } catch (err) {
    console.error('[Cloud DB] Error guardando registro:', err);
    return false;
  }
};
