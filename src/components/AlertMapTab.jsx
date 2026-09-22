import { useState } from 'react';
import {
  IconMapPin,
  IconZoomIn,
  IconZoomOut,
  IconWifiOff,
  IconCloud,
  IconDatabase,
  IconX
} from '@tabler/icons-react';
import { Dialog } from '@base-ui/react/dialog';

const MAP_VIEWBOX = "0 0 400 400";

const GPS_TO_SVG_MAP = {
  'Finca La Estrella (Lote A)': { x: 120, y: 140 },
  'Finca La Estrella (Lote B)': { x: 180, y: 190 },
  'Cooperativa Sur': { x: 260, y: 290 },
  'Finca Vecina El Placer': { x: 310, y: 110 }
};

const OUTBREAK_HOTSPOTS = [
  { id: 'h-1', farm: 'Finca La Estrella - Lote A', disease: 'Monilia', cases: 5, x: 130, y: 130, severity: 'Crítica' },
  { id: 'h-2', farm: 'Cooperativa Sur', disease: 'Escoba de Bruja', cases: 3, x: 250, y: 280, severity: 'Alta' },
  { id: 'h-3', farm: 'Finca Vecina El Placer', disease: 'Mazorca Negra', cases: 2, x: 320, y: 120, severity: 'Media' },
  { id: 'h-4', farm: 'Finca La Estrella - Lote B', disease: 'Monilia', cases: 4, x: 190, y: 200, severity: 'Crítica' },
  { id: 'h-5', farm: 'Lote Comunitario Bajo', disease: 'Escoba de Bruja', cases: 6, x: 80, y: 310, severity: 'Alta' }
];

const DISEASE_COLORS = {
  'Monilia': '#D93025',
  'Escoba de Bruja': '#F4B400',
  'Mazorca Negra': '#E37400'
};

const getDiseaseColor = (disease) => DISEASE_COLORS[disease] ?? '#E37400';

export default function AlertMapTab({ isOnline, currentGPS, addLog }) {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  // Dynamic user position pin mapper supporting preset names and raw GPS coords
  const userPos = (() => {
    if (GPS_TO_SVG_MAP[currentGPS.name]) {
      return GPS_TO_SVG_MAP[currentGPS.name];
    }
    const lat = currentGPS.lat;
    const lng = currentGPS.lng;
    const minLat = -1.036, maxLat = -1.018;
    const minLng = -77.552, maxLng = -77.531;
    // Map dynamically to the 400x400 SVG box (x: 40 to 360, y: 40 to 360)
    const x = 40 + ((lng - minLng) / (maxLng - minLng)) * 320;
    const y = 360 - ((lat - minLat) / (maxLat - minLat)) * 320;
    return {
      x: Math.max(20, Math.min(380, x)),
      y: Math.max(20, Math.min(380, y))
    };
  })();

  const handleHotspotClick = (hotspot) => {
    setSelectedHotspot(hotspot);
    addLog?.(`[Mapa] Inspeccionando foco de ${hotspot.disease} en: ${hotspot.farm}`);
  };

  const filteredHotspots = OUTBREAK_HOTSPOTS.filter(h => {
    if (activeFilter === 'Todos') return true;
    return h.disease === activeFilter;
  });

  return (
    <div className="flex flex-col h-full animate-fade-in relative" style={{ height: '100%' }}>
      {/* Offline/Online Cache Indicator Bar with Tailwind */}
      <div className={`px-4 py-2 flex justify-between items-center text-[11px] font-bold tracking-wide border-b ${
        isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
      }`}>
        <span className="flex items-center gap-1.5">
          {isOnline ? <IconCloud size={14} stroke={2} /> : <IconWifiOff size={14} stroke={2} />}
          {isOnline ? 'CONEXIÓN ACTIVA (Mapas Dinámicos)' : 'TRABAJANDO OFFLINE (Caché Local Activa)'}
        </span>
        <span className="inline-flex items-center gap-1 uppercase text-[9px] font-bold bg-white text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md shadow-2xs">
          <IconDatabase size={10} stroke={2} /> {isOnline ? 'Nube' : 'SQLite'}
        </span>
      </div>

      {/* Disease quick filters with Tailwind */}
      <div className="p-3 bg-white border-b border-stone-200 flex gap-2 overflow-x-auto no-scrollbar z-10">
        {['Todos', 'Monilia', 'Escoba de Bruja', 'Mazorca Negra'].map(filterName => {
          const isActive = activeFilter === filterName;
          return (
            <button
              key={filterName}
              onClick={() => {
                setActiveFilter(filterName);
                setSelectedHotspot(null);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              {filterName}
            </button>
          );
        })}
      </div>

      {/* SVG Map Canvas Area with Tailwind */}
      <div className="flex-1 relative bg-[#E6F3E7] overflow-hidden min-h-[calc(100dvh-120px-68px)]">
        <svg
          viewBox={MAP_VIEWBOX}
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.3s ease',
            transformOrigin: 'center'
          }}
        >
          {/* Grid lines (simulating cached tiles grid) */}
          <defs>
            <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D5E8D7" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          {/* Natural elements: Wavy River */}
          <path
            d="M -20,280 C 100,290 120,210 210,190 C 300,170 340,90 420,80"
            fill="none"
            stroke="#A3C1AD"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M -20,280 C 100,290 120,210 210,190 C 300,170 340,90 420,80"
            fill="none"
            stroke="#BDE3FF"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Trails / Rural Roads */}
          <path
            d="M 50,-20 L 50,420 M 10,160 L 410,160 M 200,160 L 350,380"
            fill="none"
            stroke="#E3D7C5"
            strokeWidth="3.5"
            strokeDasharray="4 3"
          />

          {/* Farm Plots / Parcels */}
          {/* Plot 1: Top Left */}
          <polygon points="20,40 160,20 150,110 30,120" fill="#C8E6C9" stroke="#81C784" strokeWidth="1.5" opacity="0.85" />
          <text x="75" y="75" fontSize="8" fontWeight="bold" fill="#2E7D32" opacity="0.8">Finca La Estrella (Lote A)</text>

          {/* Plot 2: Center */}
          <polygon points="120,170 230,140 240,240 130,230" fill="#C8E6C9" stroke="#81C784" strokeWidth="1.5" opacity="0.85" />
          <text x="140" y="210" fontSize="8" fontWeight="bold" fill="#2E7D32" opacity="0.8">Finca La Estrella (Lote B)</text>

          {/* Plot 3: Bottom Right */}
          <polygon points="210,260 380,240 370,360 220,380" fill="#C8E6C9" stroke="#81C784" strokeWidth="1.5" opacity="0.85" />
          <text x="270" y="325" fontSize="8" fontWeight="bold" fill="#2E7D32" opacity="0.8">Cooperativa Sur</text>

          {/* Plot 4: Top Right */}
          <polygon points="250,30 380,40 370,140 260,130" fill="#C8E6C9" stroke="#81C784" strokeWidth="1.5" opacity="0.85" />
          <text x="290" y="80" fontSize="8" fontWeight="bold" fill="#2E7D32" opacity="0.8">Finca El Placer</text>

          {/* Heatmap Layer (Foci of infection) */}
          {filteredHotspots.map((hotspot) => {
            const isSelected = selectedHotspot?.id === hotspot.id;
            const color = getDiseaseColor(hotspot.disease);
            return (
              <g key={hotspot.id} className="cursor-pointer" onClick={() => handleHotspotClick(hotspot)}>
                <circle
                  cx={hotspot.x}
                  cy={hotspot.y}
                  r={12 + hotspot.cases * 2}
                  fill={color}
                  fillOpacity="0.25"
                  className={isSelected ? 'animate-ping' : ''}
                  style={{ transformOrigin: `${hotspot.x}px ${hotspot.y}px` }}
                />
                <circle
                  cx={hotspot.x}
                  cy={hotspot.y}
                  r={5 + hotspot.cases * 0.5}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <circle
                  cx={hotspot.x}
                  cy={hotspot.y}
                  r={20}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
              </g>
            );
          })}

          {/* Live Farmer Location Pin */}
          <g>
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="24"
              fill="#2C5E3B"
              fillOpacity="0.15"
              className="animate-ping"
              style={{ transformOrigin: `${userPos.x}px ${userPos.y}px`, animationDuration: '3s' }}
            />
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="8"
              fill="#FFFFFF"
              stroke="#2C5E3B"
              strokeWidth="2.5"
            />
            <circle
              cx={userPos.x}
              cy={userPos.y}
              r="4"
              fill="#2C5E3B"
            />
          </g>
        </svg>

        {/* Floating Map Controls with Tailwind */}
        <div className="absolute right-4 bottom-5 flex flex-col gap-2 z-10">
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
            title="Acercar mapa"
          >
            <IconZoomIn size={18} stroke={2} />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-xs border border-stone-200 shadow-md flex items-center justify-center text-stone-700 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
            title="Alejar mapa"
          >
            <IconZoomOut size={18} stroke={2} />
          </button>
        </div>

        {/* Hotspot details bottom card drawer using Base UI Dialog & Tailwind CSS */}
        <Dialog.Root open={Boolean(selectedHotspot)} onOpenChange={(open) => !open && setSelectedHotspot(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
            <Dialog.Popup className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-white rounded-3xl p-5 shadow-2xl border border-emerald-200 z-50 transition-all duration-200 ease-out data-[ending-style]:translate-y-6 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-6 data-[starting-style]:opacity-0">
              {selectedHotspot && (
                <>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800/60 block">
                        Ubicación del brote
                      </span>
                      <Dialog.Title className="text-base font-black text-stone-800 m-0">
                        {selectedHotspot.farm}
                      </Dialog.Title>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        selectedHotspot.severity === 'Crítica'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {selectedHotspot.severity}
                      </span>
                      <Dialog.Close className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer border-none p-0">
                        <IconX size={16} stroke={2.5} />
                      </Dialog.Close>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-stone-100">
                    <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100">
                      <span className="text-[11px] font-medium text-stone-500 block mb-1">Plaga reportada</span>
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                          style={{ backgroundColor: selectedHotspot.disease === 'Monilia' ? '#D93025' : '#F4B400' }}
                        />
                        {selectedHotspot.disease}
                      </span>
                    </div>
                    <div className="bg-stone-50/80 p-2.5 rounded-2xl border border-stone-100">
                      <span className="text-[11px] font-medium text-stone-500 block mb-1">Casos reportados</span>
                      <span className="text-sm font-black text-stone-800">
                        {selectedHotspot.cases} <span className="text-xs font-semibold text-stone-500">árboles</span>
                      </span>
                    </div>
                  </div>

                  <Dialog.Close className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-emerald-900/10 cursor-pointer border-none text-center block">
                    Cerrar Detalle
                  </Dialog.Close>
                </>
              )}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        {/* Small location tag indicator overlay with Tailwind */}
        <div className="absolute left-4 top-4 bg-white/90 backdrop-blur-xs border border-stone-200 px-3 py-1.5 rounded-xl shadow-xs text-[11px] font-bold text-stone-800 flex items-center gap-1.5 z-10 max-w-[200px] truncate">
          <IconMapPin size={13} stroke={2.5} className="text-emerald-700 shrink-0" />
          <span className="truncate">{currentGPS.name}</span>
        </div>
      </div>
    </div>
  );
}
