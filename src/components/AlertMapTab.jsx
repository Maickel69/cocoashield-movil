import React, { useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, WifiOff, Cloud, Database } from 'lucide-react';

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
      {/* Offline/Online Cache Indicator Bar */}
      <div className={`map-indicator-bar ${isOnline ? 'online' : 'offline'}`}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isOnline ? <Cloud size={12} /> : <WifiOff size={12} />}
          {isOnline ? 'CONEXIÓN ACTIVA (Mapas Dinámicos)' : 'TRABAJANDO OFFLINE (Caché Local Activa)'}
        </span>
        <span className="map-indicator-source">
          <Database size={8} style={{ marginRight: '2px' }} /> {isOnline ? 'Nube' : 'SQLite'}
        </span>
      </div>

      {/* Disease quick filters */}
      <div className="map-filter-bar">
        {['Todos', 'Monilia', 'Escoba de Bruja', 'Mazorca Negra'].map(filterName => {
          const isActive = activeFilter === filterName;
          return (
            <button
              key={filterName}
              onClick={() => {
                setActiveFilter(filterName);
                setSelectedHotspot(null);
              }}
              className={`filter-pill ${isActive ? 'active' : ''}`}
            >
              {filterName}
            </button>
          );
        })}
      </div>

      {/* SVG Map Canvas Area */}
      <div className="map-viewport">
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
            const color = hotspot.disease === 'Monilia' ? '#D93025' : hotspot.disease === 'Escoba de Bruja' ? '#F4B400' : '#E37400';
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

        {/* Floating Map Controls */}
        <div className="map-controls">
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="map-ctrl-btn"
            title="Acercar mapa"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))}
            className="map-ctrl-btn"
            title="Alejar mapa"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        {/* Hotspot details bottom card drawer */}
        {selectedHotspot && (
          <div className="map-popup animate-fade-in">
            <div className="popup-header">
              <div>
                <span className="popup-title-label">Ubicación del brote:</span>
                <h4 className="popup-title">{selectedHotspot.farm}</h4>
              </div>
              <span className={`popup-badge ${selectedHotspot.severity === 'Crítica' ? 'critical' : 'medium'}`}>
                {selectedHotspot.severity}
              </span>
            </div>

            <div className="popup-grid">
              <div>
                <span className="popup-grid-title">Plaga reportada</span>
                <span className="popup-grid-val">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: selectedHotspot.disease === 'Monilia' ? '#D93025' : '#F4B400', display: 'inline-block' }} />
                  {selectedHotspot.disease}
                </span>
              </div>
              <div>
                <span className="popup-grid-title">Casos reportados</span>
                <span className="popup-grid-val popup-grid-val-bold">{selectedHotspot.cases} árboles</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedHotspot(null)}
              className="popup-close-btn"
            >
              Cerrar Detalle
            </button>
          </div>
        )}

        {/* Small location tag indicator overlay */}
        <div className="map-location-tag">
          <MapPin size={12} style={{ color: 'var(--color-primary)' }} />
          <span>{currentGPS.name}</span>
        </div>
      </div>
    </div>
  );
}
