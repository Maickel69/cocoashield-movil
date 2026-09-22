import React, { useState, useRef } from "react";
import {
  IconUser,
  IconCompass,
  IconLogout,
  IconMapPin,
  IconMoon,
  IconSun,
  IconCamera,
  IconCheck
} from "@tabler/icons-react";
import { Switch } from "@base-ui/react/switch";

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
  backendStatus
}) {
  const nameParts = (farmerName || "").trim().split(" ");
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName]   = useState(nameParts.slice(1).join(" ") || "");
  const [email, setEmail]         = useState(currentUser?.email || "maicolalverto158@gmail.com");
  const [mobilePhone, setMobilePhone] = useState(() => localStorage.getItem("cocoashield_farmer_phone") || "+51 984 123 456");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("cocoashield_gemini_key") || "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("cocoashield_user_avatar") || null);
  const avatarInputRef = useRef(null);

  const role = currentUser?.role || "Trabajador de Campo";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      try {
        localStorage.setItem("cocoashield_user_avatar", dataUrl);
      } catch (err) {
        console.warn("No se pudo persistir avatar en localStorage", err);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (fullName) {
      setFarmerName(fullName);
      localStorage.setItem("cocoashield_farmer_name", fullName);
    }
    localStorage.setItem("cocoashield_farm_name", farmName.trim());
    localStorage.setItem("cocoashield_farmer_phone", mobilePhone.trim());
    if (geminiKey.trim()) {
      localStorage.setItem("cocoashield_gemini_key", geminiKey.trim());
    } else {
      localStorage.removeItem("cocoashield_gemini_key");
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2800);
  };

  const inputClass = "w-full py-3.5 px-5 rounded-full bg-[#F4F6F4] dark:bg-[var(--color-surface-container-high)] text-sm font-medium text-[var(--color-text-dark)] placeholder:text-[var(--color-text-muted)]/70 border-none outline-none focus:bg-[#EAEFEA] dark:focus:bg-[var(--color-surface-container-highest)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all";
  const labelClass = "text-xs font-bold text-[var(--color-text-muted)] px-1 uppercase tracking-wider";

  return (
    <div className="flex flex-col px-1 py-2 pb-36 min-h-full">
      {/* Header del Perfil de Usuario (Destino Principal sin botón atrás) */}
      <div className="flex items-center justify-center mb-6 pt-1">
        <h1 className="text-base font-extrabold text-[var(--color-text-dark)] tracking-tight text-center">
          Perfil de Usuario
        </h1>
      </div>

      {/* Avatar Circular con Mini Botón de Cámara y Rol */}
      <div className="flex flex-col items-center justify-center mb-7">
        <div className="relative w-28 h-28 mb-3">
          <div className="w-full h-full rounded-full bg-[var(--color-primary-container)] border-none shadow-sm overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar de perfil" className="w-full h-full object-cover" />
            ) : (
              <IconUser size={58} stroke={1.6} className="text-[var(--color-primary)]" />
            )}
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[var(--color-surface-container-lowest)] dark:bg-[var(--color-surface-container-high)] border-none flex items-center justify-center text-[var(--color-primary)] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Actualizar foto de perfil"
          >
            <IconCamera size={18} stroke={2} />
          </button>
        </div>

        {/* Badge de Rol */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-on-secondary-container)] bg-[var(--color-secondary-container)] px-4 py-1 rounded-full border-none">
          {role}
        </span>
      </div>

      {/* Formulario Estilizado M3 Expressive Filled */}
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
        {/* First Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-first-name" className={labelClass}>
            Nombres
          </label>
          <input
            id="config-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
            placeholder="John"
          />
        </div>

        {/* Last Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-last-name" className={labelClass}>
            Apellidos
          </label>
          <input
            id="config-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
            placeholder="Doe"
          />
        </div>

        {/* E-Mail */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-email" className={labelClass}>
            Correo Electrónico
          </label>
          <input
            id="config-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="johndoe@gmail.com"
          />
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-mobile-phone" className={labelClass}>
            Teléfono Móvil
          </label>
          <input
            id="config-mobile-phone"
            type="text"
            value={mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            className={inputClass}
            placeholder="+51 984 123 456"
          />
        </div>

        {/* Finca / Parcela */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-farm-name" className={labelClass}>
            Parcela / Fundo de Campo
          </label>
          <input
            id="config-farm-name"
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className={inputClass}
            placeholder="Finca Cacaotera Lote 1"
          />
        </div>

        {/* Ubicación GPS */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center px-1">
            <span className={labelClass}>
              Coordenadas GPS de Parcela
            </span>
            <button
              type="button"
              onClick={fetchRealGPS}
              className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 transition-colors border-none bg-transparent cursor-pointer"
            >
              <IconCompass size={14} stroke={2.2} /> Actualizar
            </button>
          </div>
          <div className={`${inputClass} flex items-center gap-2 text-[var(--color-text-dark)] font-mono text-xs cursor-default`}>
            <IconMapPin size={16} stroke={2} className="text-[var(--color-primary)] shrink-0" />
            <span className="truncate">
              {currentGPS.name} {currentGPS.lat !== 0 && `(${currentGPS.lat.toFixed(4)}, ${currentGPS.lng.toFixed(4)})`}
            </span>
          </div>
        </div>

        {/* Google Gemini API Key */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="config-gemini-key" className={labelClass}>
            Google Gemini API Key (Opcional)
          </label>
          <input
            id="config-gemini-key"
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className={inputClass}
            placeholder="Pega tu clave de aistudio.google.com"
          />
        </div>

        {/* Alternar Modo Oscuro (M3 Filled Surface) */}
        <div className="flex justify-between items-center py-4 px-5 rounded-3xl bg-[#F4F6F4] dark:bg-[var(--color-surface-container-high)] border-none mt-1 transition-colors">
          <div>
            <div className="font-bold text-[14px] text-[var(--color-text-dark)]">Modo Oscuro</div>
            <div className="text-[11px] text-[var(--color-text-muted)] font-medium">Para uso bajo luz solar directa o noche</div>
          </div>
          <Switch.Root
            checked={isDarkMode}
            onCheckedChange={(checked) => setIsDarkMode(checked)}
            className="w-13 h-7.5 rounded-full bg-[var(--color-surface-container-highest)] data-[checked]:bg-[var(--color-primary)] transition-colors cursor-pointer relative p-0.5 border-none outline-none"
          >
            <Switch.Thumb className="w-6.5 h-6.5 rounded-full bg-[var(--color-surface-container-lowest)] shadow-md flex items-center justify-center transition-transform duration-200 ease-out data-[checked]:translate-x-5.5 translate-x-0">
              {isDarkMode ? (
                <IconMoon size={14} stroke={2.2} className="text-[var(--color-primary)]" />
              ) : (
                <IconSun size={14} stroke={2.2} className="text-amber-500" />
              )}
            </Switch.Thumb>
          </Switch.Root>
        </div>

        {/* Botón Principal SAVE en píldora Material 3 Filled */}
        <button
          type="submit"
          className={`w-full py-4 px-6 rounded-full text-[var(--color-on-primary)] text-sm font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 mt-3 cursor-pointer border-none ${
            savedSuccess
              ? "bg-[var(--color-primary-hover)]"
              : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
          }`}
        >
          {savedSuccess ? (
            <>
              <IconCheck size={18} stroke={2.5} />
              <span>Guardado con éxito</span>
            </>
          ) : (
            <span>Guardar Cambios</span>
          )}
        </button>

        {/* Cerrar Sesión */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs py-3 mt-1 hover:text-rose-700 transition-colors cursor-pointer"
        >
          <IconLogout size={16} stroke={2} />
          <span>Cerrar Sesión de Trabajador</span>
        </button>
      </form>
    </div>
  );
}
