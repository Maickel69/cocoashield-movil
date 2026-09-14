import React, { useState, useEffect, useCallback, useRef } from 'react';
import DeviceShell from './components/DeviceShell';
import SimulationPanel from './components/SimulationPanel';
import DiagnosisTab from './components/DiagnosisTab';
import AlertMapTab from './components/AlertMapTab';
import HistoryTab from './components/HistoryTab';
import { getHistory, saveDiagnosis, clearDatabase, syncPendingRecords, BACKEND_URL, updateBackendIp, runOnlineDiagnosis } from './components/Database';
import AutoUpdateBanner from './components/AutoUpdateBanner';
import { Settings, X, Wifi, WifiOff, User, HardDrive, Battery, Compass, Trash2, MapPin, Camera } from 'lucide-react';

// Detect if the visitor is on a real mobile device
const isMobileDevice = () => {
  return window.innerWidth <= 768;
};

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentGPS, setCurrentGPS] = useState({
    name: 'Finca La Estrella (Lote A)',
    lat: -1.0234,
    lng: -77.5432
  });
  const [history, setHistory] = useState([]);
  const [syncLogs, setSyncLogs] = useState([
    '[SQLite] Base de datos local inicializada.',
    navigator.onLine 
      ? '[Red] Inicial: Conectado a la red celular/Wi-Fi.' 
      : '[Red] Inicial: Sin cobertura celular (Offline).',
    `[Backend] Dirección del servidor: ${BACKEND_URL}`
  ]);
  const [activeTab, setActiveTab] = useState('diagnostico');
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cocoashield_dark_mode') === 'true');
  const [farmerName, setFarmerName] = useState(() => localStorage.getItem('cocoashield_farmer_name') || 'Carlos Muñoz');
  const [farmName, setFarmName] = useState(() => localStorage.getItem('cocoashield_farm_name') || 'Finca La Estrella (Lote A)');
  const [deviceBattery, setDeviceBattery] = useState(85);
  const [backendIp, setBackendIp] = useState(() => localStorage.getItem('cocoashield_backend_ip') || '192.168.1.24');
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const isScanningRef = useRef(false);
  const [connectionPath, setConnectionPath] = useState(() => localStorage.getItem('cocoashield_connection_path') || 'Desconectado');

  useEffect(() => {
    localStorage.setItem('cocoashield_connection_path', connectionPath);
  }, [connectionPath]);


  useEffect(() => {
    localStorage.setItem('cocoashield_dark_mode', isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // QR connection scanner states/refs
  const [isScanningQr, setIsScanningQr] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const startQrScan = async () => {
    setIsScanningQr(true);
    addLog('[QR Scanner] Iniciando cámara para escanear QR...');
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          
          const { default: jsQR } = await import('jsqr');
          
          scanIntervalRef.current = setInterval(() => {
            if (!videoRef.current || !canvasRef.current) return;
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              
              if (code) {
                const scannedData = code.data.trim();
                addLog(`[QR Scanner] QR detectado: "${scannedData}"`);
                
                if (scannedData.startsWith('http://') || scannedData.startsWith('https://') || /^[0-9.]+(:[0-9]+)?$/.test(scannedData)) {
                  updateBackendIp(scannedData);
                  setBackendIp(scannedData);
                  addLog(`[Config] Servidor vinculado con éxito: ${scannedData}`);
                  stopQrScan();
                  checkBackendConnection();
                } else {
                  addLog(`[QR Scanner] ⚠️ Contenido de QR inválido: "${scannedData}"`);
                }
              }
            }
          }, 200);
        }
      } catch (err) {
        addLog(`[QR Scanner] ❌ Error de cámara: ${err.message || err}`);
        setIsScanningQr(false);
      }
    }, 300);
  };

  const stopQrScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanningQr(false);
  };

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cocoashield_farmer_name', farmerName);
  }, [farmerName]);

  useEffect(() => {
    localStorage.setItem('cocoashield_farm_name', farmName);
  }, [farmName]);

  useEffect(() => {
    let active = true;
    const fetchBattery = async () => {
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          if (active) {
            setDeviceBattery(Math.round(battery.level * 100));
          }
          battery.addEventListener('levelchange', () => {
            if (active) setDeviceBattery(Math.round(battery.level * 100));
          });
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchBattery();
    return () => { active = false; };
  }, []);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addLog = useCallback((message) => {
    setSyncLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ${message}`
    ]);
  }, []);

  // Detect if we need HTTPS to talk to the local server
  // (needed when app is served from Vercel over HTTPS)
  const useHttps = window.location.protocol === 'https:' && !window.Capacitor;
  const LOCAL_HTTP_PORT  = 5000;
  const LOCAL_HTTPS_PORT = 5443;

  // Check if backend is reachable
  const checkBackendConnection = useCallback(async () => {
    try {
      const host = window.location.hostname;
      const isIpAddress = /^[0-9.]+$/.test(host);
      let currentUrl;

      if (isIpAddress) {
        currentUrl = `http://${host}:${LOCAL_HTTP_PORT}`;
      } else {
        const savedIp = localStorage.getItem('cocoashield_backend_ip');
        if (savedIp) {
          // If it's a tunnel or public URL, keep it as is
          if (savedIp.includes('.loca.lt') || savedIp.includes('.ngrok-free.app')) {
            currentUrl = savedIp.startsWith('http') ? savedIp : `https://${savedIp}`;
          } else {
            // Clean IP address
            let cleanIp = savedIp.replace(/^(https?:\/\/)/, '').replace(/:[0-9]+$/, '').replace(/\/$/, '');
            currentUrl = useHttps
              ? `https://${cleanIp}:${LOCAL_HTTPS_PORT}`
              : `http://${cleanIp}:${LOCAL_HTTP_PORT}`;
          }
        } else {
          currentUrl = useHttps
            ? `https://192.168.1.24:${LOCAL_HTTPS_PORT}`
            : `http://192.168.1.24:${LOCAL_HTTP_PORT}`;
        }
      }

      const response = await fetch(`${currentUrl}/api/cases`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        setBackendStatus('online');
        setIsOnline(true);
        
        // Detect connection path type from currentUrl
        if (currentUrl.includes('.loca.lt') || currentUrl.includes('.ngrok-free.app')) {
          setConnectionPath('Túnel Seguro (Internet)');
        } else {
          const matchIp = currentUrl.match(/\/\/([0-9.]+)/);
          if (matchIp && matchIp[1]) {
            const ip = matchIp[1];
            if (ip.startsWith('100.') || ip.startsWith('10.8.') || ip.startsWith('10.9.')) {
              setConnectionPath('VPN Corporativa');
            } else {
              setConnectionPath('Wi-Fi / Red Local');
            }
          } else {
            setConnectionPath('Wi-Fi / Red Local');
          }
        }
        return true;
      }
    } catch {
      setBackendStatus('offline');
      setIsOnline(false);
      setConnectionPath('Desconectado');
    }
    return false;
  }, [useHttps]);

  // Background server auto-discovery using Cloud Registry and fast pinging
  const discoverServer = useCallback(async () => {
    if (isScanningRef.current) return;
    isScanningRef.current = true;
    setIsScanningNetwork(true);
    addLog('[Auto-Discovery] Descargando coordenadas del servidor desde registro en la nube...');

    try {
      const response = await fetch('https://jsonbin-zeta.vercel.app/api/bins/7RpZP8VJpJ', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) throw new Error('No se pudo leer el registro en la nube.');
      const data = await response.json();
      
      const { localIps = [], tunnelUrl = '', ports = { http: 5000, https: 5443 } } = data;
      addLog(`[Auto-Discovery] IPs locales recibidas: [${localIps.join(', ')}]. Túnel: ${tunnelUrl || 'Ninguno'}`);

      // Try local IPs in parallel
      if (localIps.length > 0) {
        addLog('[Auto-Discovery] Probando IPs de red local y VPN en paralelo...');
        
        const scanIP = async (ip) => {
          const scheme = useHttps ? 'https' : 'http';
          const port = useHttps ? (ports.https || 5443) : (ports.http || 5000);
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 1500);
          try {
            const res = await fetch(`${scheme}://${ip}:${port}/api/server-info`, {
              signal: controller.signal,
              headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            clearTimeout(id);
            if (res.ok) {
              return { ip, url: `${scheme}://${ip}:${port}` };
            }
          } catch (e) {
            // ignore
          } finally {
            clearTimeout(id);
          }
          return null;
        };

        const scanPromises = localIps.map(scanIP);
        const scanResults = await Promise.all(scanPromises);
        const resolved = scanResults.find(r => r !== null);

        if (resolved) {
          const isVpn = resolved.ip.startsWith('100.') || resolved.ip.startsWith('10.8.') || resolved.ip.startsWith('10.9.');
          const pathType = isVpn ? 'VPN Corporativa' : 'Wi-Fi / Red Local';
          
          updateBackendIp(resolved.url);
          setBackendIp(resolved.ip);
          setConnectionPath(pathType);
          setBackendStatus('online');
          setIsOnline(true);
          addLog(`[Auto-Discovery] ✅ ¡Conectado al servidor en ${resolved.url} (${pathType})!`);

          // Force history reload
          try {
            const h = await getHistory();
            setHistory(h);
          } catch (err) {
            // ignore
          }
          
          isScanningRef.current = false;
          setIsScanningNetwork(false);
          return true;
        }
      }

      // If no local IPs responded, try public tunnel URL
      if (tunnelUrl) {
        addLog('[Auto-Discovery] Sin conexión en red local/VPN. Intentando conectar vía túnel público...');
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        try {
          const res = await fetch(`${tunnelUrl}/api/server-info`, {
            signal: controller.signal,
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
          });
          clearTimeout(id);
          if (res.ok) {
            updateBackendIp(tunnelUrl);
            setBackendIp(tunnelUrl);
            setConnectionPath('Túnel Seguro (Internet)');
            setBackendStatus('online');
            setIsOnline(true);
            addLog(`[Auto-Discovery] ✅ ¡Conectado vía Túnel Público: ${tunnelUrl}!`);

            // Force history reload
            try {
              const h = await getHistory();
              setHistory(h);
            } catch (err) {
              // ignore
            }

            isScanningRef.current = false;
            setIsScanningNetwork(false);
            return true;
          }
        } catch (e) {
          addLog('[Auto-Discovery] ❌ Conexión al túnel fallida.');
        } finally {
          clearTimeout(id);
        }
      }

    } catch (err) {
      addLog(`[Auto-Discovery] Error al consultar registro: ${err.message}`);
    }

    // Fallback: If cloud registry lookup or all pings failed, check the last saved settings
    addLog('[Auto-Discovery] Todos los intentos fallidos. Probando última configuración guardada...');
    const savedIp = localStorage.getItem('cocoashield_backend_ip');
    if (savedIp) {
      let currentUrl;
      if (savedIp.startsWith('http://') || savedIp.startsWith('https://')) {
        currentUrl = savedIp;
      } else {
        currentUrl = useHttps
          ? `https://${savedIp}:${LOCAL_HTTPS_PORT}`
          : `http://${savedIp}:${LOCAL_HTTP_PORT}`;
      }

      try {
        const response = await fetch(`${currentUrl}/api/server-info`, {
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
          signal: AbortSignal.timeout(2000)
        });
        if (response.ok) {
          addLog('[Auto-Discovery] ✅ Conectado usando última configuración de respaldo.');
          setBackendStatus('online');
          setIsOnline(true);
          if (currentUrl.includes('.loca.lt')) {
            setConnectionPath('Túnel Seguro (Internet)');
          } else if (currentUrl.includes('10.8.') || currentUrl.includes('10.9.') || currentUrl.includes('100.')) {
            setConnectionPath('VPN Corporativa');
          } else {
            setConnectionPath('Wi-Fi / Red Local');
          }
          isScanningRef.current = false;
          setIsScanningNetwork(false);
          return true;
        }
      } catch (e) {
        // ignore
      }
    }

    addLog('[Auto-Discovery] ❌ No se pudo encontrar ningún servidor CocoaShield activo.');
    setBackendStatus('offline');
    setIsOnline(false);
    setConnectionPath('Desconectado');
    isScanningRef.current = false;
    setIsScanningNetwork(false);
    return false;
  }, [addLog, useHttps]);


  // Fetch real coordinates from the mobile device GPS hardware
  const fetchRealGPS = useCallback(() => {
    if (!navigator.geolocation) {
      addLog('[GPS] ❌ Geolocalización no soportada en este dispositivo.');
      return;
    }
    addLog('[GPS] Solicitando ubicación GPS real...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        
        setCurrentGPS({
          name: `Ubicación GPS Real (±${accuracy}m)`,
          lat: lat,
          lng: lng
        });
        addLog(`[GPS] ✅ Ubicación obtenida: Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)} (±${accuracy}m)`);
      },
      (error) => {
        let msg = 'Error desconocido';
        if (error.code === 1) msg = 'Permiso denegado por el agricultor';
        else if (error.code === 2) msg = 'Señal GPS no disponible';
        else if (error.code === 3) msg = 'Tiempo de espera agotado';
        addLog(`[GPS] ❌ Error de ubicación: ${msg}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [addLog]);

  // Initial load: fetch history from backend and trigger location popup
  useEffect(() => {
    const init = async () => {
      // Trigger location permission immediately on load
      fetchRealGPS();
      
      const reachable = await checkBackendConnection();
      if (reachable) {
        addLog('[Backend] Servidor CocoaShield detectado y activo.');
      } else {
        addLog('[Backend] Servidor no disponible. Usando caché local.');
        // Async auto discovery on startup if server is not immediately reachable
        discoverServer();
      }
      const h = await getHistory();
      setHistory(h);
    };
    init();
  }, [discoverServer, checkBackendConnection, fetchRealGPS, addLog]);

  // Network connection event listeners
  useEffect(() => {
    const handleOnline = async () => {
      addLog('[Red] Internet público detectado por el navegador.');
      checkBackendConnection();
    };
    const handleOffline = () => {
      addLog('[Red] Sin internet público (Modo Local/Misma Red activo).');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addLog, checkBackendConnection]);

  // Ping backend every 10 seconds to update status indicator
  useEffect(() => {
    const interval = setInterval(checkBackendConnection, 10000);
    return () => clearInterval(interval);
  }, [checkBackendConnection]);

  // Auto-sync when going online
  useEffect(() => {
    const runAutoSync = async () => {
      if (isOnline) {
        addLog('[Red] Conexión a Internet activa.');
        const pendingCount = history.filter((item) => !item.synced).length;
        if (pendingCount > 0) {
          addLog(`[Sincronizador] Iniciando subida automática de ${pendingCount} fichas pendientes...`);
          const result = await syncPendingRecords(isOnline, (log) => addLog(log));
          if (result.success) {
            const updated = await getHistory();
            setHistory(updated);
          }
        } else {
          addLog('[Sincronizador] No hay datos pendientes de sincronización.');
        }
      } else {
        addLog('[Red] Modo local activo. Nuevos diagnósticos irán a la caché local.');
      }
    };
    if (history.length > 0) runAutoSync();
  }, [isOnline]);

  const handleSaveDiagnosis = async (diagnosisData) => {
    let deviceModel = 'Dispositivo Móvil';
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android\s+([^\s;]+);?\s+([^\s;]+)\s+Build/);
      deviceModel = (match && match[2] ? match[2].replace(/_/g, ' ') : 'Dispositivo Android');
    } else if (/iPhone/i.test(ua)) {
      deviceModel = 'iPhone';
    } else if (/Windows NT/i.test(ua)) {
      deviceModel = 'PC Windows';
    }

    const finalData = {
      ...diagnosisData,
      farmer: farmerName,
      locationName: farmName,
      battery: deviceBattery,
      deviceModel: deviceModel
    };

    const savedRecord = saveDiagnosis(finalData);
    const updated = await getHistory();
    setHistory(updated);
    addLog(`[SQLite] Ficha de diagnóstico guardada con ID: ${savedRecord.id}.`);
    if (isOnline) {
      addLog('[Edge AI] Detectada conexión activa. Intentando sincronización inmediata...');
      setTimeout(async () => {
        const result = await syncPendingRecords(isOnline, (log) => addLog(log));
        if (result.success) {
          const refreshed = await getHistory();
          setHistory(refreshed);
        }
      }, 500);
    } else {
      addLog('[SQLite] Guardado en cola local. Esperando señal de red para subir al servidor.');
    }
  };

  const handleRunOnlineDiagnosis = async (base64Photo) => {
    let deviceModel = 'Dispositivo Móvil';
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android\s+([^\s;]+);?\s+([^\s;]+)\s+Build/);
      deviceModel = (match && match[2] ? match[2].replace(/_/g, ' ') : 'Dispositivo Android');
    } else if (/iPhone/i.test(ua)) {
      deviceModel = 'iPhone';
    } else if (/Windows/i.test(ua)) {
      deviceModel = 'PC Windows';
    }

    const diagResult = await runOnlineDiagnosis(
      base64Photo,
      farmName,
      farmerName,
      currentGPS,
      deviceBattery,
      deviceModel
    );

    // Recargar historial local
    const updated = await getHistory();
    setHistory(updated);

    return diagResult;
  };

  const handleManualSync = async () => {
    addLog('[Botón Sincronizar] Forzando sincronización de registros...');
    const result = await syncPendingRecords(isOnline, (log) => addLog(log));
    if (result.success) {
      const updated = await getHistory();
      setHistory(updated);
    }
  };

  const handleClearDb = async () => {
    addLog('[SQLite] Reiniciando base de datos local y servidor...');
    const resetHistory = await clearDatabase();
    setHistory(resetHistory);
    setSyncLogs([
      `[SQLite] Base de datos restablecida a datos por defecto.`,
      isOnline ? '[Red] Conectado (4G)' : '[Red] Desconectado (Offline)',
      `[Backend] Dirección del servidor: ${BACKEND_URL}`
    ]);
    addLog('[Backend] Base de datos del servidor también reiniciada.');
  };

  const unsyncedCount = history.filter((item) => !item.synced).length;

  // The shared tab content renderer
  const renderTabContent = () => (
    <>
      {activeTab === 'diagnostico' && (
        <DiagnosisTab
          onSaveDiagnosis={handleSaveDiagnosis}
          onRunOnlineDiagnosis={handleRunOnlineDiagnosis}
          currentGPS={currentGPS}
          addLog={addLog}
        />
      )}
      {activeTab === 'mapa' && (
        <AlertMapTab
          isOnline={isOnline}
          currentGPS={currentGPS}
          addLog={addLog}
        />
      )}
      {activeTab === 'historial' && (
        <HistoryTab
          history={history}
          isOnline={isOnline}
          onSyncNow={handleManualSync}
          unsyncedCount={unsyncedCount}
        />
      )}
      {activeTab === 'configuracion' && (
        <div className="tab-content animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
          <div className="tab-header">
            <h1 className="tab-title">Mi Cuenta</h1>
            <p className="tab-subtitle">Ajustes del productor y telemetría de red</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <User size={15} color="#005088" /> Datos del Agricultor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nombre del Productor:</label>
              <input
                type="text"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-dark)', outline: 'none', backgroundColor: 'var(--color-bg)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Nombre de la Finca:</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-dark)', outline: 'none', backgroundColor: 'var(--color-bg)' }}
              />
            </div>
          </div>

          {/* Ajustes de Interfaz (Modo Oscuro) Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <Settings size={15} color="var(--color-primary)" /> Ajustes de Interfaz
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 650, color: 'var(--color-text-dark)', fontSize: '13px' }}>Modo Oscuro</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Reduce la fatiga visual en campo</span>
              </div>
              <button
                onClick={() => setIsDarkMode(prev => !prev)}
                style={{
                  width: '46px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: isDarkMode ? 'var(--color-primary)' : '#CBD5E1',
                  position: 'relative',
                  padding: '2px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transform: isDarkMode ? 'translateX(22px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}>
                  {isDarkMode ? '🌙' : '☀️'}
                </div>
              </button>
            </div>
          </div>

          {/* Servidor Backend Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <Wifi size={15} color="var(--color-primary)" /> Dirección del Servidor
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Dirección IP o URL del Servidor:</label>
              <input
                type="text"
                value={backendIp}
                onChange={(e) => setBackendIp(e.target.value)}
                placeholder="Ej: 192.168.1.24 o enlace del túnel"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '13px', color: 'var(--color-text-dark)', outline: 'none', backgroundColor: 'var(--color-bg)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => {
                  updateBackendIp(backendIp);
                  addLog(`[Config] IP del servidor actualizada a: ${backendIp}`);
                  checkBackendConnection();
                }}
                className="btn-config-success"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
              >
                Guardar Manual
              </button>
              <button
                onClick={startQrScan}
                className="btn-config-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
              >
                <Camera size={14} /> Escanear QR
              </button>
            </div>
            <button
              onClick={discoverServer}
              disabled={isScanningNetwork}
              style={{
                marginTop: '6px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: isScanningNetwork ? 'rgba(52, 168, 83, 0.05)' : 'rgba(52, 168, 83, 0.12)',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success)',
                cursor: isScanningNetwork ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isScanningNetwork ? '0 0 15px rgba(52, 168, 83, 0.15)' : 'none'
              }}
            >
              <span className="sonar-wrapper" style={{ color: 'var(--color-success)', marginRight: '2px', display: 'inline-flex' }}>
                {isScanningNetwork && <span className="sonar-pulse-ring" style={{ width: '22px', height: '22px' }} />}
                {isScanningNetwork && <span className="sonar-pulse-ring-2" style={{ width: '22px', height: '22px' }} />}
                <Wifi size={14} className={isScanningNetwork ? 'animate-bounce' : ''} />
              </span>
              {isScanningNetwork ? 'Escaneando Red local/VPN...' : 'Buscar servidor'}
            </button>

          </div>

          {/* Geolocalización Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--color-bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <Compass size={15} color="var(--color-primary)" /> Geolocalización en Campo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Ubicación Actual:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-dark)', textAlign: 'right', maxWidth: '60%' }}>
                  {currentGPS.name}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Latitud:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontFamily: 'monospace' }}>
                  {currentGPS.lat.toFixed(6)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Longitud:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text-dark)', fontFamily: 'monospace' }}>
                  {currentGPS.lng.toFixed(6)}
                </span>
              </div>
            </div>
            <button
              onClick={fetchRealGPS}
              className="btn-config-success"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginTop: '4px', width: '100%' }}
            >
              <Compass size={14} />
              Actualizar Ubicación GPS Real
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--color-bg-card)', padding: '14px', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-dark)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <HardDrive size={15} color="var(--color-primary)" /> Telemetría del Dispositivo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Modelo de Celular:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>
                  {(() => {
                    const ua = navigator.userAgent;
                    if (/Android/i.test(ua)) {
                      const match = ua.match(/Android\s+([^\s;]+);?\s+([^\s;]+)\s+Build/);
                      return (match && match[2] ? match[2].replace(/_/g, ' ') : 'Dispositivo Android');
                    }
                    if (/iPhone/i.test(ua)) return 'iPhone';
                    if (/Windows/i.test(ua)) return 'PC con Windows';
                    return 'Dispositivo Móvil';
                  })()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Servidor Backend:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '10.5px' }}>
                  {localStorage.getItem('cocoashield_backend_ip') || '192.168.1.24 (Por defecto)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Canal de Red:</span>
                <span style={{ fontWeight: 700, color: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-critical)' }}>
                  {connectionPath}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Estado del Servidor IA:</span>
                <span style={{ fontWeight: 700, color: backendStatus === 'online' ? 'var(--color-success)' : 'var(--color-critical)' }}>
                  {backendStatus === 'online' ? 'ONLINE (Inferencia Real)' : 'OFFLINE (Desconectado)'}
                </span>
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={handleClearDb}
              className="btn-config-danger"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}
            >
              <Trash2 size={13} /> Reiniciar Datos Locales & Nube
            </button>
          </div>
        </div>
      )}
    </>
  );

  // Backend status pill
  const BackendPill = () => {
    const isOnline = backendStatus === 'online';
    const isChecking = backendStatus === 'checking';
    const dotColor = isOnline ? '#11CAA0' : isChecking ? '#F4B400' : '#D93025';
    
    return (
      <div
        title={`Backend: ${BACKEND_URL}`}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '0.6px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E6ECE8',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          cursor: 'default',
          userSelect: 'none'
        }}
      >
        <span className="sonar-wrapper" style={{ color: dotColor, display: 'inline-flex' }}>
          {isOnline && <span className="sonar-pulse-ring" />}
          {isOnline && <span className="sonar-pulse-ring-2" />}
          {isChecking && <span className="sonar-pulse-ring" style={{ animationDuration: '1.2s' }} />}
          <span className="glow-dot" />
        </span>
        <span>
          {isOnline ? 'SERVIDOR ON' : isChecking ? 'BUSCANDO...' : 'SERVIDOR OFF'}
        </span>
      </div>
    );
  };


  // ─────────────────────────────────────────────
  // MOBILE LAYOUT: Full-screen real app experience
  // ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="mobile-app-root">
        <BackendPill />

        {/* Native Status Bar Simulation */}
        <div className="mobile-status-bar">
          <span className="mobile-status-time">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          <span className={`mobile-status-signal ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? '📶 4G' : '✕ OFFLINE'}
          </span>
        </div>

        {/* Scrollable Screen Content */}
        <div className="mobile-screen">
          {renderTabContent()}
        </div>

        <div className="mobile-bottom-nav">
          {[
            { id: 'diagnostico', icon: '📷', label: 'Diagnóstico' },
            // Ocultado por solicitud del cliente: módulo de mapas desactivado
            // { id: 'mapa', icon: '🗺️', label: 'Mapa Alertas' },
            { id: 'historial', icon: '📋', label: 'Historial' },
            { id: 'configuracion', icon: '⚙️', label: 'Mi Cuenta' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mobile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">{tab.icon}</span>
              <span className="mobile-nav-label">{tab.label}</span>
              {tab.id === 'historial' && unsyncedCount > 0 && (
                <span className="mobile-nav-badge">{unsyncedCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Floating Debug Button */}
        <button
          onClick={() => setShowDebugPanel(true)}
          className="mobile-fab"
          title="Panel de simulación"
        >
          <Settings size={20} />
        </button>

        {/* Debug Panel Slide-up Drawer */}
        {showDebugPanel && (
          <>
            <div className="mobile-drawer-overlay" onClick={() => setShowDebugPanel(false)} />
            <div className="mobile-drawer">
              <div className="mobile-drawer-handle-bar" />
              <div className="mobile-drawer-header">
                <h3 className="mobile-drawer-title">Panel de Simulación</h3>
                <button onClick={() => setShowDebugPanel(false)} className="mobile-drawer-close">
                  <X size={20} />
                </button>
              </div>
              <div className="mobile-drawer-content">
                <SimulationPanel
                  isOnline={isOnline}
                  setIsOnline={setIsOnline}
                  currentGPS={currentGPS}
                  setCurrentGPS={setCurrentGPS}
                  syncLogs={syncLogs}
                  onSync={handleManualSync}
                  onClearDb={handleClearDb}
                  historyCount={history.length}
                  unsyncedCount={unsyncedCount}
                />
              </div>
            </div>
          </>
        )}

        {isScanningQr && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, textAlign: 'center', color: '#fff', padding: '0 24px', zIndex: 10 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Vincular Servidor</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.4 }}>
                Apunta con la cámara al código QR en la pantalla de la computadora.
              </p>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{
                position: 'absolute',
                width: '240px',
                height: '240px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: '24px',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}>
                <div style={{ position: 'absolute', top: -2, left: -2, width: '20px', height: '20px', borderTop: '4px solid #10B981', borderLeft: '4px solid #10B981', borderTopLeftRadius: '24px' }}></div>
                <div style={{ position: 'absolute', top: -2, right: -2, width: '20px', height: '20px', borderTop: '4px solid #10B981', borderRight: '4px solid #10B981', borderTopRightRadius: '24px' }}></div>
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: '20px', height: '20px', borderBottom: '4px solid #10B981', borderLeft: '4px solid #10B981', borderBottomLeftRadius: '24px' }}></div>
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderBottom: '4px solid #10B981', borderRight: '4px solid #10B981', borderBottomRightRadius: '24px' }}></div>
                
                <div style={{
                  width: '100%',
                  height: '2px',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                  position: 'absolute',
                  animation: 'scanLine 2s linear infinite'
                }}></div>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
              <button
                onClick={stopQrScan}
                style={{
                  padding: '12px 32px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '30px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              >
                Cancelar
              </button>
            </div>
            <style>{`
              @keyframes scanLine {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
            `}</style>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // DESKTOP LAYOUT: Phone mockup + Simulation Panel
  // ─────────────────────────────────────────────
  return (
    <div className="app-container">
      <BackendPill />
      <DeviceShell
        isOnline={isOnline}
        currentGPS={currentGPS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unsyncedCount={unsyncedCount}
      >
        {renderTabContent()}
      </DeviceShell>

      <SimulationPanel
        isOnline={isOnline}
        setIsOnline={setIsOnline}
        currentGPS={currentGPS}
        setCurrentGPS={setCurrentGPS}
        syncLogs={syncLogs}
        onSync={handleManualSync}
        onClearDb={handleClearDb}
        historyCount={history.length}
        unsyncedCount={unsyncedCount}
      />

      {isScanningQr && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: '#000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, textAlign: 'center', color: '#fff', padding: '0 24px', zIndex: 10 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>Vincular Servidor</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#CBD5E1', lineHeight: 1.4 }}>
              Apunta con la cámara al código QR en la pantalla de la computadora.
            </p>
          </div>
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              ref={videoRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div style={{
              position: 'absolute',
              width: '240px',
              height: '240px',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '24px',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box'
            }}>
              <div style={{ position: 'absolute', top: -2, left: -2, width: '20px', height: '20px', borderTop: '4px solid #10B981', borderLeft: '4px solid #10B981', borderTopLeftRadius: '24px' }}></div>
              <div style={{ position: 'absolute', top: -2, right: -2, width: '20px', height: '20px', borderTop: '4px solid #10B981', borderRight: '4px solid #10B981', borderTopRightRadius: '24px' }}></div>
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: '20px', height: '20px', borderBottom: '4px solid #10B981', borderLeft: '4px solid #10B981', borderBottomLeftRadius: '24px' }}></div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: '20px', height: '20px', borderBottom: '4px solid #10B981', borderRight: '4px solid #10B981', borderBottomRightRadius: '24px' }}></div>
              
              <div style={{
                width: '100%',
                height: '2px',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                position: 'absolute',
                animation: 'scanLine 2s linear infinite'
              }}></div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <button
              onClick={stopQrScan}
              style={{
                padding: '12px 32px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: '30px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              Cancelar
            </button>
          </div>
          <style>{`
            @keyframes scanLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
        </div>
      )}
      <AutoUpdateBanner />
    </div>
  );
}
