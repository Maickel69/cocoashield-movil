import React, { useState, useEffect, useCallback, useRef } from "react";
import DiagnosisTab from "./components/DiagnosisTab";
import HistoryTab from "./components/HistoryTab";
import ConfigTab from "./components/ConfigTab";
import MobileLoginPage from "./components/MobileLoginPage";
import { getHistory, saveDiagnosis, BACKEND_URL, runOnlineDiagnosis } from "./components/Database";
import AutoUpdateBanner from "./components/AutoUpdateBanner";
import {
  IconUser,
  IconCamera,
  IconHistory
} from "@tabler/icons-react";

// ── Componente Indicador de Estado Fuera de App ──────────────────────────────
function StatusDot({ backendStatus }) {
  if (backendStatus === "online") return null;

  const isChecking = backendStatus === "checking";
  const color = isChecking ? "#facc15" : "#ef4444";
  const label = isChecking ? "Conectando al servidor..." : "Servidor desconectado (Modo Offline)";

  return (
    <div style={{
      position: "fixed", top: 10, right: 10, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 20,
      background: isChecking ? "rgba(40, 30, 10, 0.88)" : "rgba(45, 15, 15, 0.88)",
      backdropFilter: "blur(8px)",
      border: `1px solid ${isChecking ? "rgba(250, 204, 21, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.4px",
      color: isChecking ? "#fef08a" : "#fca5a5",
      boxShadow: "0 4px 14px rgba(0,0,0,0.35)", userSelect: "none"
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%", backgroundColor: color,
        display: "inline-block", flexShrink: 0
      }} />
      {label}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser]     = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [history, setHistory]             = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState("diagnostico");
  const [backendStatus, setBackendStatus] = useState("checking");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailOpen, setIsDetailOpen]   = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("cocoashield_dark_mode") === "true"
  );
  const [farmerName, setFarmerName] = useState(
    () => localStorage.getItem("cocoashield_farmer_name") || "Maicol Alberto"
  );
  const [farmName, setFarmName] = useState(
    () => localStorage.getItem("cocoashield_farm_name") || "Finca Cacaotera Lote 1"
  );
  const [currentGPS, setCurrentGPS] = useState({ name: "Obteniendo ubicacion...", lat: 0, lng: 0 });
  const [deviceBattery, setDeviceBattery] = useState(null);
  const farmNameRef = useRef(farmName);
  const cameraTriggerRef = useRef(null);

  // Cargar sesión persistente de trabajador
  useEffect(() => {
    try {
      const savedLocal = localStorage.getItem("cocoashield_worker_user");
      const savedSession = sessionStorage.getItem("cocoashield_worker_user");
      const saved = savedLocal || savedSession;
      if (saved) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        if (user.name) setFarmerName(user.name);
        if (user.defaultFarm && !localStorage.getItem("cocoashield_farm_name")) {
          setFarmName(user.defaultFarm);
        }
      }
    } catch (e) {
      console.error("Error cargando sesion de trabajador", e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    if (user.name) setFarmerName(user.name);
    if (user.defaultFarm) setFarmName(user.defaultFarm);
  };

  const handleLogout = () => {
    localStorage.removeItem("cocoashield_worker_user");
    sessionStorage.removeItem("cocoashield_worker_user");
    setCurrentUser(null);
  };

  useEffect(() => {
    localStorage.setItem("cocoashield_dark_mode", isDarkMode);
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("cocoashield_farmer_name", farmerName);
    localStorage.setItem("cocoashield_farm_name", farmName);
    farmNameRef.current = farmName;
  }, [farmerName, farmName]);

  useEffect(() => {
    let active = true;
    let batteryInstance = null;
    const handleLevelChange = () => {
      if (active && batteryInstance) {
        setDeviceBattery(Math.round(batteryInstance.level * 100));
      }
    };

    const fetchBattery = async () => {
      try {
        if (navigator.getBattery) {
          batteryInstance = await navigator.getBattery();
          if (active) {
            setDeviceBattery(Math.round(batteryInstance.level * 100));
            batteryInstance.addEventListener("levelchange", handleLevelChange);
          }
        }
      } catch (_) {}
    };
    fetchBattery();

    return () => {
      active = false;
      if (batteryInstance) {
        batteryInstance.removeEventListener("levelchange", handleLevelChange);
      }
    };
  }, []);

  const fetchRealGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = Math.round(pos.coords.accuracy);
        setCurrentGPS({ name: `Ubicacion GPS (+-${acc}m)`, lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { setCurrentGPS({ name: farmNameRef.current, lat: 0, lng: 0 }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cases`, { signal: AbortSignal.timeout(15000) });
      setBackendStatus(res.ok ? "online" : "offline");
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchRealGPS();
    checkBackend();
    setHistoryLoading(true);
    getHistory()
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [currentUser, fetchRealGPS, checkBackend]);

  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(checkBackend, 30000);
    return () => clearInterval(id);
  }, [currentUser, checkBackend]);

  const getDeviceModel = () => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      const match = /Android[^;]+;\s*([^;)]+)/.exec(ua);
      return match ? match[1].replaceAll("_", " ").trim() : "Android";
    }
    if (/iPhone/i.test(ua)) return "iPhone";
    return "Dispositivo Movil";
  };

  const handleRunOnlineDiagnosis = async (base64Photo) => {
    const result = await runOnlineDiagnosis(
      base64Photo, farmName, farmerName, currentGPS,
      deviceBattery ?? 100, getDeviceModel()
    );
    const updated = await getHistory();
    setHistory(updated);
    return result;
  };

  const handleSaveDiagnosis = async (diagnosisData) => {
    saveDiagnosis({ ...diagnosisData, farmer: farmerName, locationName: farmName, battery: deviceBattery ?? 100, deviceModel: getDeviceModel() });
    const updated = await getHistory();
    setHistory(updated);
  };

  const handleSelectRecord = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(Boolean(record));
  };

  const TABS = ["diagnostico", "historial", "configuracion"];
  const currentTabIndex = Math.max(0, TABS.indexOf(activeTab));

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0B192C", color: "#fff", fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 34, height: 34, border: "3px solid rgba(17,202,160,0.25)", borderTopColor: "#11CAA0",
            borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite"
          }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>Cargando CocoaShield...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Si no está autenticado, mostrar Login
  if (!currentUser) {
    return (
      <div className="flex flex-col w-full h-[100dvh] min-h-[100dvh] bg-[var(--color-bg)] relative overflow-hidden mx-auto">
        <MobileLoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full h-[100dvh] min-h-[100dvh] ${activeTab === "configuracion" ? "bg-white dark:bg-[var(--color-bg)]" : "bg-[var(--color-bg)]"} relative overflow-hidden mx-auto transition-colors duration-200`}>
      <StatusDot backendStatus={backendStatus} />

      {/* Contenedor Viewport con Track Horizontal para Transición Slide */}
      <div className="flex-1 w-full max-w-[680px] mx-auto overflow-hidden relative">
        <div
          className="flex w-[300%] h-full transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] will-change-transform"
          style={{
            transform: `translate3d(-${currentTabIndex * (100 / 3)}%, 0, 0)`
          }}
        >
          {/* Pestaña 0: Diagnóstico */}
          <div
            className="w-1/3 h-full shrink-0 overflow-y-auto overflow-x-hidden pt-[max(18px,env(safe-area-inset-top,18px))] px-4 pb-[100px] md:px-6 md:pb-[110px] touch-pan-y"
            aria-hidden={activeTab !== "diagnostico"}
          >
            <DiagnosisTab
              onSaveDiagnosis={handleSaveDiagnosis}
              onRunOnlineDiagnosis={handleRunOnlineDiagnosis}
              currentGPS={currentGPS}
              addLog={() => {}}
              recentHistory={history}
              onNavigateTab={setActiveTab}
              currentUser={currentUser}
              onSelectRecord={handleSelectRecord}
              onRegisterCameraTrigger={(trigger) => { cameraTriggerRef.current = trigger; }}
            />
          </div>

          {/* Pestaña 1: Historial Fitosanitario */}
          <div
            className="w-1/3 h-full shrink-0 overflow-y-auto overflow-x-hidden pt-[max(18px,env(safe-area-inset-top,18px))] px-4 pb-[100px] md:px-6 md:pb-[110px] touch-pan-y"
            aria-hidden={activeTab !== "historial"}
          >
            <HistoryTab
              history={history}
              isLoading={historyLoading}
              isOnline={backendStatus === "online"}
              onSyncNow={async () => {
                setHistoryLoading(true);
                try {
                  const data = await getHistory();
                  setHistory(data);
                } finally {
                  setHistoryLoading(false);
                }
              }}
              unsyncedCount={0}
              onDetailOpen={setIsDetailOpen}
              selectedRecord={selectedRecord}
              onSelectRecord={handleSelectRecord}
            />
          </div>

          {/* Pestaña 2: Mi Cuenta / Configuración (Fondo Blanco Puro) */}
          <div
            className="w-1/3 h-full shrink-0 overflow-y-auto overflow-x-hidden pt-[max(18px,env(safe-area-inset-top,18px))] px-4 pb-[100px] md:px-6 md:pb-[110px] touch-pan-y bg-white dark:bg-[var(--color-bg)]"
            aria-hidden={activeTab !== "configuracion"}
          >
            <ConfigTab
              currentUser={currentUser}
              onLogout={handleLogout}
              farmerName={farmerName}
              setFarmerName={setFarmerName}
              farmName={farmName}
              setFarmName={setFarmName}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              currentGPS={currentGPS}
              fetchRealGPS={fetchRealGPS}
              backendStatus={backendStatus}
            />
          </div>
        </div>
      </div>
      {!isDetailOpen && (
        <div className="fixed bottom-0 inset-x-0 w-full max-w-[680px] mx-auto px-3 pb-[max(14px,env(safe-area-inset-bottom,14px))] pt-2 flex items-center justify-between gap-2.5 z-40 pointer-events-none md:max-w-[680px] md:px-4 md:pb-[max(16px,env(safe-area-inset-bottom,16px))]">
          <div className="flex-1 bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container)] rounded-full border-none flex items-center justify-between p-1.5 h-16 shadow-[0_8px_32px_rgba(18,30,23,0.08)] pointer-events-auto">
            {[
              { id: "diagnostico",   icon: <IconCamera size={20} stroke={1.8} />,   label: "Diagnóstico" },
              { id: "historial",     icon: <IconHistory size={20} stroke={1.8} />,  label: "Historial" },
              { id: "configuracion", icon: <IconUser size={20} stroke={1.8} />,     label: "Mi Cuenta" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold h-[52px] px-3 py-2 cursor-pointer transition-all duration-200 select-none border-none bg-transparent ${
                  activeTab === tab.id
                    ? "bg-[var(--color-primary-container)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-stone-800 dark:hover:text-stone-200"
                }`}
              >
                <span className={`flex items-center justify-center transition-transform duration-200 ${activeTab === tab.id ? "scale-105" : ""}`}>
                  {tab.icon}
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Botón Circular de Acción Principal (Cámara / Captura FAB) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('diagnostico');
              cameraTriggerRef.current?.();
            }}
            className="w-16 h-16 min-w-16 min-h-16 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center cursor-pointer shadow-[0_12px_28px_rgba(30,70,32,0.35)] transition-all hover:bg-[var(--color-primary-hover)] active:scale-90 shrink-0 ml-1.5 pointer-events-auto select-none border-none p-0"
            title="Tomar Foto / Analizar Mazorca"
          >
            <IconCamera size={28} stroke={2.4} />
          </button>
        </div>
      )}
      <AutoUpdateBanner />
    </div>
  );
}
