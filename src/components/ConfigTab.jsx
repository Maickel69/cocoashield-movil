import React, { useState } from "react";
import {
  IconUser,
  IconCompass,
  IconLogout,
  IconMapPin,
  IconMoon,
  IconSun,
  IconCamera,
  IconArrowLeft
} from "@tabler/icons-react";

const materialProfileInputStyle = {
  padding: "15px 20px",
  borderRadius: 9999,
  border: "1.5px solid var(--color-border)",
  fontSize: 14.5,
  fontWeight: 500,
  color: "var(--color-text-dark)",
  backgroundColor: "var(--color-bg-card)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease"
};

export default function ConfigTab({
  currentUser,
  onLogout,
  farmerName,
  setFarmerName,
  farmName,
  setFarmName,
  isDarkMode,
  setIsDarkMode,
  currentGPS,
  fetchRealGPS,
  backendStatus,
  onBack
}) {
  const nameParts = (farmerName || "").trim().split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName]   = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail]         = useState(currentUser?.email || "maicolalverto158@gmail.com");
  const [mobilePhone, setMobilePhone] = useState(() => localStorage.getItem("cocoashield_farmer_phone") || "+51 984 123 456");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("cocoashield_gemini_key") || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const role = currentUser?.role || "Trabajador de Campo";

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (fullName) {
      setFarmerName(fullName);
      localStorage.setItem("cocoashield_farmer_name", fullName);
    }
    localStorage.setItem("cocoashield_farm_name", farmName.trim());
    localStorage.setItem("cocoashield_farmer_phone", mobilePhone.trim());
    localStorage.setItem("cocoashield_gemini_key", geminiKey.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <div
      className="tab-content animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px 20px 140px",
        boxSizing: "border-box",
        minHeight: "100%",
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch"
      }}
    >
      {/* Header con botón atrás y título centrado 'User Profile' */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        paddingTop: 4
      }}>
        <button
          type="button"
          onClick={() => onBack?.("diagnostico")}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            cursor: "pointer",
            borderRadius: "50%"
          }}
          title="Regresar al inicio"
        >
          <IconArrowLeft size={24} stroke={2.2} />
        </button>

        <h1 style={{
          fontSize: 18,
          fontWeight: 800,
          margin: 0,
          color: "var(--color-text-dark)",
          letterSpacing: "-0.3px",
          textAlign: "center"
        }}>
          User Profile
        </h1>

        <div style={{ width: 36 }} />
      </div>

      {/* Avatar Circular Grande con Mini Botón de Cámara y Rol */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 28
      }}>
        <div style={{
          position: "relative",
          width: 120,
          height: 120,
          marginBottom: 10
        }}>
          {/* Círculo Principal */}
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "#B8D0BE",
            border: "4px solid var(--color-bg-card)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <IconUser size={64} stroke={1.5} color="#2C5E3B" />
          </div>

          {/* Insignia de cámara superpuesta */}
          <button
            type="button"
            onClick={() => {
              const fileInputs = document.querySelectorAll('input[type="file"]');
              if (fileInputs && fileInputs.length > 0) fileInputs[0].click();
            }}
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "var(--color-bg-card)",
              border: "2.5px solid var(--color-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-primary)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer"
            }}
            title="Actualizar foto de perfil"
          >
            <IconCamera size={18} stroke={2} />
          </button>
        </div>

        {/* Badge de Rol */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{
            fontSize: 11.5,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "var(--color-primary)",
            backgroundColor: "rgba(44, 94, 59, 0.1)",
            padding: "5px 16px",
            borderRadius: 9999
          }}>
            {role}
          </span>
        </div>
      </div>

      {/* Formulario Estilizado con Inputs Píldora (Stadium Pill) */}
      <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* First Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-first-name" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            First Name
          </label>
          <input
            id="config-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="John"
          />
        </div>

        {/* Last Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-last-name" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            Last Name
          </label>
          <input
            id="config-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="Doe"
          />
        </div>

        {/* E-Mail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-email" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            E-Mail
          </label>
          <input
            id="config-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="johndoe@gmail.com"
          />
        </div>

        {/* Mobile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-mobile-phone" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            Mobile
          </label>
          <input
            id="config-mobile-phone"
            type="text"
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="+51 984 123 456"
          />
        </div>

        {/* Finca / Parcela */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-farm-name" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            Parcela / Fundo de Campo
          </label>
          <input
            id="config-farm-name"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="Finca Cacaotera Lote 1"
          />
        </div>

        {/* Ubicación GPS Actual en Campo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 4, paddingRight: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)" }}>
              Coordenadas GPS de Parcela
            </span>
            <button
              type="button"
              onClick={fetchRealGPS}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary)",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
            >
              <IconCompass size={14} stroke={2} /> Actualizar
            </button>
          </div>
          <div style={{
            ...materialProfileInputStyle,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--color-text-muted)"
          }}>
            <IconMapPin size={16} stroke={2} color="var(--color-primary)" />
            <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {currentGPS.name} {currentGPS.lat !== 0 && `(${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)})`}
            </span>
          </div>
        </div>

        {/* Google Gemini API Key (Opcional) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="config-gemini-key" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)", paddingLeft: 4 }}>
            Google Gemini API Key (Opcional)
          </label>
          <input
            id="config-gemini-key"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            style={materialProfileInputStyle}
            placeholder="Pega tu clave de aistudio.google.com"
          />
        </div>

        {/* Alternar Modo Oscuro */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
          borderRadius: 9999,
          border: "1.5px solid var(--color-border)",
          backgroundColor: "var(--color-bg-card)",
          marginTop: 2
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--color-text-dark)" }}>Modo Oscuro</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Para uso bajo la luz solar directa</div>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode(p => !p)}
            style={{
              width: 48,
              height: 26,
              borderRadius: 13,
              border: "none",
              backgroundColor: isDarkMode ? "var(--color-primary)" : "#CBD5E1",
              cursor: "pointer",
              position: "relative",
              padding: 3,
              display: "flex",
              alignItems: "center",
              transition: "background-color 0.2s"
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              transform: isDarkMode ? "translateX(22px)" : "translateX(0)",
              transition: "transform 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {isDarkMode ? <IconMoon size={13} stroke={2} color="#0B192C" /> : <IconSun size={13} stroke={2} color="#F59E0B" />}
            </div>
          </button>
        </div>

        {/* Botón Principal SAVE en píldora azul oscuro / índigo elegante */}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "16px 20px",
            borderRadius: 9999,
            backgroundColor: savedSuccess ? "#166534" : "#1B2366",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "1.2px",
            border: "none",
            cursor: "pointer",
            marginTop: 12,
            boxShadow: "0 6px 18px rgba(27, 35, 102, 0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <span>{savedSuccess ? "GUARDADO CON ÉXITO" : "SAVE"}</span>
        </button>

        {/* Cerrar Sesión */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            background: "none",
            border: "none",
            color: "#EF4444",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            padding: "8px 0",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}
        >
          <IconLogout size={16} stroke={2} />
          <span>Cerrar Sesión de {role}</span>
        </button>
      </form>
    </div>
  );
}
