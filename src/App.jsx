import React, { useState, useEffect, useCallback } from "react";
import DeviceShell from "./components/DeviceShell";
import DiagnosisTab from "./components/DiagnosisTab";
import HistoryTab from "./components/HistoryTab";
import { getHistory, saveDiagnosis, BACKEND_URL, runOnlineDiagnosis } from "./components/Database";
import AutoUpdateBanner from "./components/AutoUpdateBanner";
import { User, Settings, Compass } from "lucide-react";

const isMobileDevice = () => window.innerWidth <= 768;

export default function App() {
  const [history, setHistory]             = useState([]);
  const [activeTab, setActiveTab]         = useState("diagnostico");
  const [isMobile, setIsMobile]           = useState(isMobileDevice());
  const [backendStatus, setBackendStatus] = useState("checking");

  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("cocoashield_dark_mode") === "true"
  );
  const [farmerName, setFarmerName] = useState(
    () => localStorage.getItem("cocoashield_farmer_name") || "Tu nombre"
  );
  const [farmName, setFarmName] = useState(
    () => localStorage.getItem("cocoashield_farm_name") || "Mi Finca"
  );
  const [currentGPS, setCurrentGPS] = useState({ name: "Obteniendo ubicacion...", lat: 0, lng: 0 });
  const [deviceBattery, setDeviceBattery] = useState(null);

  useEffect(() => {
    localStorage.setItem("cocoashield_dark_mode", isDarkMode);
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => { localStorage.setItem("cocoashield_farmer_name", farmerName); }, [farmerName]);
  useEffect(() => { localStorage.setItem("cocoashield_farm_name", farmName); }, [farmName]);

  useEffect(() => {
    let active = true;
    const fetchBattery = async () => {
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          if (active) setDeviceBattery(Math.round(battery.level * 100));
          battery.addEventListener("levelchange", () => {
            if (active) setDeviceBattery(Math.round(battery.level * 100));
          });
        }
      } catch (_) {}
    };
    fetchBattery();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handler = () => setIsMobile(isMobileDevice());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const fetchRealGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const acc = Math.round(pos.coords.accuracy);
        setCurrentGPS({ name: `Ubicacion GPS (+-${acc}m)`, lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { setCurrentGPS({ name: farmName, lat: 0, lng: 0 }); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [farmName]);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/cases`, { signal: AbortSignal.timeout(5000) });
      setBackendStatus(res.ok ? "online" : "offline");
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    fetchRealGPS();
    checkBackend();
    getHistory().then(setHistory);
  }, [fetchRealGPS, checkBackend]);

  useEffect(() => {
    const id = setInterval(checkBackend, 30000);
    return () => clearInterval(id);
  }, [checkBackend]);

  const getDeviceModel = () => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      const m = ua.match(/Android\s+[^;]+;\s+([^)]+)\s+Build/);
      return m ? m[1].replace(/_/g, " ") : "Android";
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

  const renderTabContent = () => (
    <>
      {activeTab === "diagnostico" && (
        <DiagnosisTab
          onSaveDiagnosis={handleSaveDiagnosis}
          onRunOnlineDiagnosis={handleRunOnlineDiagnosis}
          currentGPS={currentGPS}
          addLog={() => {}}
        />
      )}
      {activeTab === "historial" && (
        <HistoryTab
          history={history}
          isOnline={backendStatus === "online"}
          onSyncNow={() => getHistory().then(setHistory)}
          unsyncedCount={0}
        />
      )}
      {activeTab === "configuracion" && (
        <ConfigTab
          farmerName={farmerName} setFarmerName={setFarmerName}
          farmName={farmName} setFarmName={setFarmName}
          isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}
          currentGPS={currentGPS} fetchRealGPS={fetchRealGPS}
          backendStatus={backendStatus}
        />
      )}
    </>
  );

  const StatusDot = () => {
    const color = backendStatus === "online" ? "#22c55e" : backendStatus === "checking" ? "#facc15" : "#ef4444";
    const label = backendStatus === "online" ? "Conectado" : backendStatus === "checking" ? "Conectando..." : "Sin conexion";
    return (
      <div style={{
        position: "fixed", top: 10, right: 10, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px", borderRadius: 20,
        background: "rgba(15,23,42,0.72)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", color: "#e2e8f0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)", userSelect: "none"
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", backgroundColor: color,
          boxShadow: backendStatus === "online" ? `0 0 6px ${color}` : "none", display: "inline-block"
        }} />
        {label}
      </div>
    );
  };

  if (isMobile) {
    return (
      <div className="mobile-app-root">
        <StatusDot />
        <div className="mobile-status-bar">
          <span className="mobile-status-time">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
          <span style={{ fontSize: 14 }}>📶</span>
        </div>
        <div className="mobile-screen">
          {renderTabContent()}
        </div>
        <div className="mobile-bottom-nav">
          {[
            { id: "diagnostico", icon: "📷", label: "Diagnostico" },
            { id: "historial",   icon: "📋", label: "Historial" },
            { id: "configuracion", icon: "👤", label: "Mi Cuenta" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`mobile-nav-btn ${activeTab === tab.id ? "active" : ""}`}
            >
              <span className="mobile-nav-icon">{tab.icon}</span>
              <span className="mobile-nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
        <AutoUpdateBanner />
      </div>
    );
  }

  return (
    <div className="app-container">
      <StatusDot />
      <DeviceShell
        isOnline={backendStatus === "online"}
        currentGPS={currentGPS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unsyncedCount={0}
      >
        {renderTabContent()}
      </DeviceShell>
      <AutoUpdateBanner />
    </div>
  );
}

function ConfigTab({ farmerName, setFarmerName, farmName, setFarmName, isDarkMode, setIsDarkMode, currentGPS, fetchRealGPS, backendStatus }) {
  const initials = farmerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="tab-content animate-fade-in" style={{
      padding: "20px 16px", display: "flex", flexDirection: "column",
      gap: 16, overflowY: "auto", height: "100%", boxSizing: "border-box"
    }}>
      <div style={{ marginBottom: 4 }}>
        <h1 className="tab-title">Mi Cuenta</h1>
        <p className="tab-subtitle">Informacion del productor</p>
      </div>

      {/* Hero card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        background: "linear-gradient(135deg, #005088 0%, #007A4D 100%)",
        borderRadius: 18, padding: "20px 18px", color: "#fff",
        boxShadow: "0 4px 20px rgba(0,80,136,0.25)"
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: initials ? 22 : 28, fontWeight: 800, flexShrink: 0,
          border: "2px solid rgba(255,255,255,0.35)", color: "#fff"
        }}>
          {initials || "🌱"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{farmerName}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{farmName}</div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.3px",
            background: backendStatus === "online" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            borderRadius: 20, padding: "3px 10px",
            border: `1px solid ${backendStatus === "online" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", display: "inline-block",
              backgroundColor: backendStatus === "online" ? "#22c55e" : "#ef4444"
            }} />
            {backendStatus === "online" ? "IA activa y lista" : "Sin conexion al servidor"}
          </div>
        </div>
      </div>

      {/* Producer data */}
      <CsCard icon={<User size={15} color="var(--color-primary)" />} title="Datos del Productor">
        <CsField label="Tu nombre">
          <input type="text" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
        </CsField>
        <CsField label="Nombre de la Finca">
          <input type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} placeholder="Nombre de tu finca" />
        </CsField>
      </CsCard>

      {/* GPS */}
      <CsCard icon={<Compass size={15} color="var(--color-primary)" />} title="Mi Ubicacion en Campo">
        <div style={{ fontSize: 13, color: "var(--color-text-dark)", lineHeight: 1.5, marginBottom: 10 }}>
          📍 {currentGPS.name}
          {currentGPS.lat !== 0 && (
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              Lat {currentGPS.lat.toFixed(5)}, Lng {currentGPS.lng.toFixed(5)}
            </div>
          )}
        </div>
        <button
          onClick={fetchRealGPS}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 12,
            background: "rgba(0,80,136,0.07)", border: "1.5px solid var(--color-primary)",
            color: "var(--color-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7
          }}
        >
          <Compass size={14} /> Actualizar mi ubicacion
        </button>
      </CsCard>

      {/* Appearance */}
      <CsCard icon={<Settings size={15} color="var(--color-primary)" />} title="Apariencia">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-dark)" }}>Modo Oscuro</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Mejor visibilidad bajo el sol</div>
          </div>
          <button onClick={() => setIsDarkMode(p => !p)} style={{
            width: 48, height: 26, borderRadius: 13, border: "none",
            backgroundColor: isDarkMode ? "var(--color-primary)" : "#CBD5E1",
            cursor: "pointer", position: "relative", transition: "background-color 0.2s",
            padding: 3, display: "flex", alignItems: "center"
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", backgroundColor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              transform: isDarkMode ? "translateX(22px)" : "translateX(0)",
              transition: "transform 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11
            }}>
              {isDarkMode ? "🌙" : "☀️"}
            </div>
          </button>
        </div>
      </CsCard>

      <div style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 11, paddingBottom: 8 }}>
        CocoaShield AI · v1.0 · UNAMAD
      </div>
    </div>
  );
}

function CsCard({ icon, title, children }) {
  return (
    <div style={{
      backgroundColor: "var(--color-bg-card)", borderRadius: 14,
      border: "1px solid var(--color-border)", padding: "14px 16px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex",
      flexDirection: "column", gap: 12
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontWeight: 700, fontSize: 13, color: "var(--color-text-dark)",
        borderBottom: "1px solid var(--color-border)", paddingBottom: 8
      }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function CsField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  padding: "9px 12px", borderRadius: 10,
  border: "1px solid var(--color-border)",
  fontSize: 13, color: "var(--color-text-dark)",
  outline: "none", backgroundColor: "var(--color-bg)",
  width: "100%", boxSizing: "border-box"
};
