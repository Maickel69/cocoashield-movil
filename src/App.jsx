import React, { useState, useEffect, useCallback } from "react";
import DeviceShell from "./components/DeviceShell";
import DiagnosisTab from "./components/DiagnosisTab";
import HistoryTab from "./components/HistoryTab";
import { getHistory, saveDiagnosis, BACKEND_URL, runOnlineDiagnosis } from "./components/Database";
import AutoUpdateBanner from "./components/AutoUpdateBanner";
import { User, Settings, Compass, Lock, Eye, EyeOff, LogOut, Shield, AlertTriangle } from "lucide-react";

const isMobileDevice = () => window.innerWidth <= 768;

// ── CUENTAS AUTORIZADAS PARA LA APP ──────────────────────────────────────────
const APP_ACCOUNTS = [
  {
    identifiers: ["maicolalverto158@gmail.com", "maicolalverto158", "maicol", "trabajador"],
    passwords: ["cocoashield2026", "maicol158", "123456"],
    name: "Maicol Alberto",
    email: "maicolalverto158@gmail.com",
    role: "Trabajador de Campo",
    defaultFarm: "Finca Cacaotera Lote 1"
  },
  {
    identifiers: ["8040182@unamad.edu.pe", "8040182", "maickel", "dueno"],
    passwords: ["cocoashield2026", "8040182", "maickel2026", "123456"],
    name: "Maickel (Dueño)",
    email: "8040182@unamad.edu.pe",
    role: "Dueño / Propietario",
    defaultFarm: "Finca Experimental UNAMAD"
  },
  {
    identifiers: ["admin@cocoashield.com", "admin"],
    passwords: ["cocoashield2026", "admin2026", "admin", "123456"],
    name: "Administrador Central",
    email: "admin@cocoashield.com",
    role: "Administrador",
    defaultFarm: "Centro Agronómico"
  }
];

// ── PANTALLA DE LOGIN MÓVIL ──────────────────────────────────────────────────
function MobileLoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMsg("Ingresa tu correo o usuario.");
      return;
    }
    if (!cleanPass) {
      setErrorMsg("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const account = APP_ACCOUNTS.find(acc =>
        acc.identifiers.some(id => id.toLowerCase() === cleanId)
      );

      if (!account) {
        setLoading(false);
        setErrorMsg("Cuenta no registrada en el sistema.");
        return;
      }

      if (!account.passwords.includes(cleanPass)) {
        setLoading(false);
        setErrorMsg("Contraseña incorrecta. Inténtalo de nuevo.");
        return;
      }

      const sessionData = {
        name: account.name,
        email: account.email,
        role: account.role,
        defaultFarm: account.defaultFarm,
        loginAt: new Date().toISOString()
      };

      if (rememberMe) {
        localStorage.setItem("cocoashield_worker_user", JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem("cocoashield_worker_user", JSON.stringify(sessionData));
      }

      setLoading(false);
      onLoginSuccess(sessionData);
    }, 400);
  };

  const fillQuick = (type) => {
    if (type === "worker") {
      setIdentifier("maicolalverto158@gmail.com");
      setPassword("cocoashield2026");
      setErrorMsg("");
    } else if (type === "owner") {
      setIdentifier("8040182@unamad.edu.pe");
      setPassword("cocoashield2026");
      setErrorMsg("");
    }
  };

  return (
    <div style={{
      minHeight: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "24px 20px",
      background: "radial-gradient(circle at 50% 25%, #0d2744 0%, #0B192C 80%, #060e18 100%)",
      color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box", position: "relative"
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: "absolute", top: "10%", right: "5%", width: 220, height: 220,
        borderRadius: "50%", background: "radial-gradient(circle, rgba(17,202,160,0.15) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        width: "100%", maxWidth: 360, background: "rgba(15, 29, 49, 0.75)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
        padding: "32px 24px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
        boxSizing: "border-box", position: "relative", zIndex: 1
      }}>
        {/* Cabecera */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 18, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #005088 0%, #11CAA0 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, boxShadow: "0 8px 20px rgba(17,202,160,0.3)"
          }}>🌿</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>CocoaShield</h1>
          <p style={{ fontSize: 11, color: "#11CAA0", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", margin: "4px 0 6px" }}>
            App de Campo Móvil
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Inicia sesión para registrar diagnósticos
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 12, padding: "10px 12px", marginBottom: 18, color: "#FCA5A5", fontSize: 12,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Usuario o Correo
            </label>
            <div style={{ position: "relative" }}>
              <User size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="ej. maicol o tu correo"
                autoComplete="username"
                style={{
                  width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                  color: "#FFFFFF", fontSize: 13, outline: "none", boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748B" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingresa tu clave"
                autoComplete="current-password"
                style={{
                  width: "100%", padding: "10px 38px 10px 36px", borderRadius: 10,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                  color: "#FFFFFF", fontSize: 13, outline: "none", boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4,
                  display: "flex", alignItems: "center"
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "2px 0 4px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: "#11CAA0", width: 14, height: 14, cursor: "pointer" }}
              />
              <span>Recordar sesión</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 10,
              background: loading ? "rgba(17,202,160,0.5)" : "linear-gradient(135deg, #11CAA0 0%, #008f6f 100%)",
              border: "none", color: "#0B192C", fontSize: 13.5, fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, boxShadow: "0 6px 16px rgba(17,202,160,0.3)"
            }}
          >
            {loading ? "Iniciando sesión..." : "Ingresar a la App"}
          </button>
        </form>

        {/* Atajos de acceso rápido para trabajadores */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", margin: "0 0 8px", textAlign: "center" }}>
            Acceso rápido para demostración:
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => fillQuick("worker")}
              style={{
                flex: 1, padding: "7px 8px", borderRadius: 8, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#11CAA0", fontSize: 11,
                fontWeight: 700, cursor: "pointer", textAlign: "center"
              }}
            >
              🌾 Maicol (Trabajador)
            </button>
            <button
              type="button"
              onClick={() => fillQuick("owner")}
              style={{
                flex: 1, padding: "7px 8px", borderRadius: 8, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#38BDF8", fontSize: 11,
                fontWeight: 700, cursor: "pointer", textAlign: "center"
              }}
            >
              👑 Dueño (8040182)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser]     = useState(null);
  const [authLoading, setAuthLoading]     = useState(true);
  const [history, setHistory]             = useState([]);
  const [activeTab, setActiveTab]         = useState("diagnostico");
  const [isMobile, setIsMobile]           = useState(isMobileDevice());
  const [backendStatus, setBackendStatus] = useState("checking");

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
    if (!currentUser) return;
    fetchRealGPS();
    checkBackend();
    getHistory().then(setHistory);
  }, [currentUser, fetchRealGPS, checkBackend]);

  useEffect(() => {
    if (!currentUser) return;
    const id = setInterval(checkBackend, 30000);
    return () => clearInterval(id);
  }, [currentUser, checkBackend]);

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
          currentUser={currentUser}
          onLogout={handleLogout}
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
    if (isMobile) {
      return (
        <div className="mobile-app-root">
          <MobileLoginPage onLoginSuccess={handleLoginSuccess} />
        </div>
      );
    }
    return (
      <div className="app-container">
        <DeviceShell
          isOnline={backendStatus === "online"}
          currentGPS={currentGPS}
          activeTab="configuracion"
          setActiveTab={() => {}}
          unsyncedCount={0}
        >
          <MobileLoginPage onLoginSuccess={handleLoginSuccess} />
        </DeviceShell>
      </div>
    );
  }

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

function ConfigTab({ currentUser, onLogout, farmerName, setFarmerName, farmName, setFarmName, isDarkMode, setIsDarkMode, currentGPS, fetchRealGPS, backendStatus }) {
  const initials = farmerName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const role = currentUser?.role || "Trabajador de Campo";

  return (
    <div className="tab-content animate-fade-in" style={{
      padding: "20px 16px", display: "flex", flexDirection: "column",
      gap: 16, overflowY: "auto", height: "100%", boxSizing: "border-box"
    }}>
      <div style={{ marginBottom: 4 }}>
        <h1 className="tab-title">Mi Cuenta</h1>
        <p className="tab-subtitle">Información del trabajador en campo</p>
      </div>

      {/* Hero card con perfil activo */}
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
          {initials || "🌾"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {farmerName}
          </div>
          <div style={{ fontSize: 11.5, color: "#11CAA0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 3 }}>
            {role}
          </div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {farmName}
          </div>
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
            {backendStatus === "online" ? "IA conectada al servidor" : "Servidor desconectado"}
          </div>
        </div>
      </div>

      {/* Datos del Productor */}
      <CsCard icon={<User size={15} color="var(--color-primary)" />} title="Datos del Productor">
        <CsField label="Nombre del Trabajador">
          <input type="text" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} style={inputStyle} placeholder="Nombre completo" />
        </CsField>
        <CsField label="Nombre de la Finca / Lote">
          <input type="text" value={farmName} onChange={(e) => setFarmName(e.target.value)} style={inputStyle} placeholder="Nombre de la finca" />
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

      {/* Apariencia */}
      <CsCard icon={<Settings size={15} color="var(--color-primary)" />} title="Apariencia">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-dark)" }}>Modo Oscuro</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Para uso bajo la luz solar directa</div>
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

      {/* Botón de Cerrar Sesión */}
      <button
        onClick={onLogout}
        style={{
          width: "100%", padding: "13px 0", borderRadius: 12,
          background: "rgba(239, 68, 68, 0.08)", border: "1.5px solid rgba(239, 68, 68, 0.4)",
          color: "#EF4444", fontSize: 13.5, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s", marginTop: 4
        }}
      >
        <LogOut size={16} /> Cerrar Sesion de {role}
      </button>

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
