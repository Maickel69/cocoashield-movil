import React, { useState } from "react";
import {
  IconPlant2,
  IconAlertTriangle,
  IconUser,
  IconLock,
  IconEye,
  IconEyeOff,
  IconUserCheck,
  IconCrown
} from "@tabler/icons-react";

export const APP_ACCOUNTS = [
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

export default function MobileLoginPage({ onLoginSuccess }) {
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
      background: "#0B192C",
      color: "#FFFFFF", fontFamily: "'Outfit', sans-serif", boxSizing: "border-box", position: "relative"
    }}>
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
            background: "#166534",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(17,202,160,0.3)"
          }}>
            <IconPlant2 size={32} color="#11CAA0" stroke={2} />
          </div>
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
            <IconAlertTriangle size={15} style={{ flexShrink: 0 }} />
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
              <IconUser size={16} stroke={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.45)" }} />
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
              <IconLock size={16} stroke={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.45)" }} />
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
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
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
              background: loading ? "rgba(17,202,160,0.5)" : "#11CAA0",
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
                fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
              }}
            >
              <IconUserCheck size={13} stroke={2} /> Maicol (Trabajador)
            </button>
            <button
              type="button"
              onClick={() => fillQuick("owner")}
              style={{
                flex: 1, padding: "7px 8px", borderRadius: 8, background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#38BDF8", fontSize: 11,
                fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
              }}
            >
              <IconCrown size={13} stroke={2} /> Dueño (8040182)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
