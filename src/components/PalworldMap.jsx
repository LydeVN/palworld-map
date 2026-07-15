import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { API_CONFIG } from '../config';
import 'leaflet/dist/leaflet.css';

// Fix robuste pour les marqueurs Leaflet en production (Vite)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 2048;
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

export default function PalworldMap() {
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Conversion des coordonnées réelles Unreal Engine -> pixels sur la carte 2048x2048
  const gameToMap = (gameX, gameY) => {
    // Échelle de la carte du jeu (environ -1024000 à 1024000)
    const minCoord = -1024000;
    const maxCoord = 1024000;
    const range = maxCoord - minCoord; // 2048000

    const percentX = (gameX - minCoord) / range;
    const percentY = (gameY - minCoord) / range;

    const x = percentX * MAP_WIDTH;
    const y = (1 - percentY) * MAP_HEIGHT; 

    return [y, x];
  };

  useEffect(() => {
    const ws = new WebSocket(`${API_CONFIG.WS_BASE_URL}/ws/players`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'players_update') {
        setPlayers(data.players || []);
      }
    };
    return () => ws.close();
  }, []);

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-screen h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER ULTRA MODERNE */}
      <header className="h-16 px-6 bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800/80 flex justify-between items-center z-[999] shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="font-black text-slate-950 text-sm">PW</span>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-wider text-amber-500 uppercase">Palworld Community</h1>
            <p className="text-[10px] text-slate-400 font-mono">LIVE TRACKING RADAR</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/50">
            <span className={`relative flex h-2 w-2`}>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
            <span className="text-xs font-medium text-slate-300">
              {connected ? 'LIVE SYNC' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden">
        
        {/* SIDEBAR DYNAMIQUE */}
        <aside className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-80' : 'w-0'} bg-[#0f172a]/95 backdrop-blur-md border-r border-slate-800/85 flex flex-col z-[998] relative shadow-2xl`}>
          
          {/* Bouton pour fermer/ouvrir la sidebar */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-10 top-4 w-10 h-10 bg-[#0f172a]/95 border-y border-r border-slate-800 flex items-center justify-center rounded-r-lg cursor-pointer text-slate-400 hover:text-amber-500 transition-colors shadow-md z-[1001]"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <div className="p-4 flex flex-col h-full overflow-hidden">
              {/* Titre Sidebar */}
              <div className="mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Joueurs Connectés</h2>
                <div className="text-2xl font-black text-white mt-1">
                  {players.length} <span className="text-xs font-normal text-slate-400">en ligne</span>
                </div>
              </div>

              {/* Barre de Recherche */}
              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Rechercher un joueur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-850 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
                />
              </div>

              {/* Liste des Joueurs */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    Aucun joueur trouvé
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <div 
                      key={player.userId}
                      className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 hover:border-amber-500/30 rounded-lg transition-all group"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-slate-250 group-hover:text-amber-400 transition-colors">
                          {player.name}
                        </span>
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                          LVL {player.level}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>X: {Math.round(player.location_x)} | Y: {Math.round(player.location_y)}</span>
                        {player.ping !== undefined && (
                          <span className="text-emerald-500/80">{Math.round(player.ping)}ms</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CONTAINER DE LA CARTE INTEGRÉE */}
        <div className="flex-1 h-full relative bg-[#090d16]">
          <MapContainer
            crs={L.CRS.Simple}
            bounds={bounds}
            maxZoom={2}
            minZoom={-2}
            zoom={-1}
            center={[MAP_HEIGHT / 2, MAP_WIDTH / 2]}
            zoomControl={false}
            style={{ height: '100%', width: '100%', position: 'absolute' }}
            className="w-full h-full"
          >
            <ImageOverlay
              url="palpagos.webp"
              bounds={bounds}
            />

            {/* Repositionnement manuel des contrôles de zoom pour le design */}
            <div className="leaflet-top leaflet-right !mt-4 !mr-4">
              <div className="leaflet-bar border-0 shadow-lg">
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-t-lg" title="Zoom in" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomIn')); }}>+</a>
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-b-lg" title="Zoom out" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomOut')); }}>−</a>
              </div>
            </div>

            {players.map((player) => {
              const position = gameToMap(player.location_x, player.location_y);
              return (
                <Marker key={player.userId} position={position}>
                  <Popup className="custom-popup">
                    <div className="text-slate-100 bg-[#0f172a] border border-slate-800 p-2 rounded-lg shadow-xl font-sans min-w-[140px]">
                      <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
                        <strong className="text-sm font-bold text-amber-500">{player.name}</strong>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">Lv.{player.level}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Secteur:</span>
                          <span className="text-slate-200">X:{Math.round(player.location_x)} Y:{Math.round(player.location_y)}</span>
                        </div>
                        {player.ping !== undefined && (
                          <div className="flex justify-between">
                            <span>Latence:</span>
                            <span className="text-emerald-400">{Math.round(player.ping)} ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Styles d'ajustement pour forcer Leaflet à respecter notre thème sombre */}
      <style>{`
        .leaflet-container {
          background: #090d16 !important;
        }
        /* Rendre les popups Leaflet entièrement transparentes et sombres */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 6px 6px 0 0 !important;
        }
        /* Custom scrollbar pour la sidebar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f59e0b;
        }
      `}</style>
    </div>
  );
}