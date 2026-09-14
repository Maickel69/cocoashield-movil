import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cocoashield.ai',
  appName: 'CocoaShield AI',
  webDir: 'dist',
  // ── MODO DESARROLLO EN VIVO ────────────────────────────────────────────────
  // La APK carga directamente el servidor Vite en tu PC.
  // Cuando cambias el código → la APK se actualiza al instante (Hot Reload).
  // Cambia esta IP si cambias de red WiFi.
  /*
  server: {
    url: 'http://192.168.1.24:5173',
    cleartext: true,
    androidScheme: 'http'
  },
  */
  android: {
    allowMixedContent: true,
    backgroundColor: '#005088',
  },
  plugins: {
    CapacitorUpdater: {
      // Capgo auto-update: comprueba updates al abrir la app
      autoUpdate: true,
      // Desactivar en modo dev (server.url activo)
      // Activar en producción cuando NO uses server.url
    }
  }
};

export default config;
