import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { API_CONFIG } from '../config';
import 'leaflet/dist/leaflet.css';

// Fix robuste pour les marqueurs Leaflet génériques
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

// --- 1. BASE DE DONNÉES DES POINTS DE TÉLÉPORTATION (Exemples) ---
// Note : Ajustez les coordonnées gameX et gameY selon les valeurs réelles de votre serveur.
// (Généralement, les coordonnées affichées en jeu sont multipliées par 1000 en interne)
const TELEPORT_POINTS = [
  { id: 'tp_start', name: 'Plateau du Commencement', gameX: -350000, gameY: -250000 },
  { id: 'tp_desert', name: 'Désert Anide', gameX: 400000, gameY: 350000 },
  { id: 'tp_volcano', name: 'Mont Obsidienne', gameX: -600000, gameY: -500000 },
  { id: 'tp_snow', name: 'Montagnes Enneigées', gameX: -100000, gameY: 600000 },
];

// Icône personnalisée pour les points de TP (Aspect Statue de voyage rapide bleue/cyan)
const createTPIcon = () => {
  return L.divIcon({
    className: 'custom-tp-icon-container',
    html: `
      <div class="tp-marker shadow-lg">
        <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <div class="tp-pulse-ring"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12]
  });
};

function MapController({ targetPosition }) {
  const map = useMap();

  useEffect(() => {
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();

    window.addEventListener('zoomIn', handleZoomIn);
    window.addEventListener('zoomOut', handleZoomOut);

    return () => {
      window.removeEventListener('zoomIn', handleZoomIn);
      window.removeEventListener('zoomOut', handleZoomOut);
    };
  }, [map]);

  useEffect(() => {
    if (targetPosition) {
      map.flyTo(targetPosition, 1, {
        animate: true,
        duration: 1.5
      });
    }
  }, [targetPosition, map]);

  return null;
}

export default function PalworldMap() {
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [targetPosition, setTargetPosition] = useState(null);
  
  // --- 2. ÉTAT POUR AFFICHER / MASQUER LES TP ---
  const [showTPs, setShowTPs] = useState(true);
  
  const markerRefs = useRef({});

  const gameToMap = (gameX, gameY) => {
    const minX = -1024000;
    const maxX = 1024000;
    const minY = -1024000;
    const maxY = 1024000;

    let percentX = (gameX - minX) / (maxX - minX);
    let percentY = (gameY - minY) / (maxY - minY);

    const temp = percentX;
    percentX = percentY;
    percentY = temp;

    const scaleX = 1.42; 
    const scaleY = 1.42;

    const offsetX = -0.21; 
    const offsetY = 0.05; 

    percentX = (percentX * scaleX) + offsetX;
    percentY = (percentY * scaleY) + offsetY;

    percentX = Math.max(0, Math.min(1, percentX));
    percentY = Math.max(0, Math.min(1, percentY));

    const x = percentX * MAP_WIDTH;
    const y = percentY * MAP_HEIGHT; 

    return [y, x];
  };

  useEffect(() => {
    const ws = new WebSocket(`${API_CONFIG.WS_BASE_URL}/ws/players`);
    
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'players_update') {
          setPlayers(data.players || []);
        }
      } catch (err) {
        console.error("Erreur lors de la réception des données joueurs:", err);
      }
    };
    
    return () => ws.close();
  }, []);

  const handlePlayerClick = (player) => {
    const position = gameToMap(player.location_x || 0, player.location_y || 0);
    setTargetPosition(position);

    const playerKey = player.uid || player.userId;
    if (markerRefs.current[playerKey]) {
      setTimeout(() => {
        markerRefs.current[playerKey].openPopup();
      }, 500); 
    }
  };

  const getPlayerAvatarUrl = (player) => {
    const rawId = player.uid || player.userId || player.steamId || "";
    const steamId = rawId.toString().trim();
    const playerName = player.name || "Player";

    if (steamId.length === 17 && steamId.startsWith("7656")) {
      return `https://images.rep.tf/${steamId}.png`;
    }

    return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(playerName)}`;
  };

  const createPlayerIcon = (player) => {
    const avatarUrl = getPlayerAvatarUrl(player);
    const playerName = player.name || "P";
    const firstLetter = playerName.charAt(0).toUpperCase();

    return L.divIcon({
      className: 'custom-player-icon-container',
      html: `
        <div class="player-avatar-wrapper shadow-lg">
          <img src="${avatarUrl}" alt="${playerName}" class="player-avatar-img" onerror="this.onerror=null; this.src='https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';" />
          <div class="player-avatar-fallback">${firstLetter}</div>
          <div class="player-pulse-ring"></div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -20]
    });
  };

  const filteredPlayers = players.filter(p => 
    p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );

  return (
    <div className="relative w-screen h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* HEADER */}
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

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800/50">
            <span className="relative flex h-2 w-2">
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
        
        {/* SIDEBAR */}
        <aside className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-80' : 'w-0'} bg-[#0f172a]/95 backdrop-blur-md border-r border-slate-800/85 flex flex-col z-[998] relative shadow-2xl`}>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-10 top-4 w-10 h-10 bg-[#0f172a]/95 border-y border-r border-slate-800 flex items-center justify-center rounded-r-lg cursor-pointer text-slate-400 hover:text-amber-500 transition-colors shadow-md z-[1001]"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>

          {sidebarOpen && (
            <div className="p-4 flex flex-col h-full overflow-hidden">
              <div className="mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Joueurs Connectés</h2>
                <div className="text-2xl font-black text-white mt-1">
                  {players.length} <span className="text-xs font-normal text-slate-400">en ligne</span>
                </div>
              </div>

              <div className="relative mb-4">
                <input 
                  type="text" 
                  placeholder="Rechercher un joueur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-850 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    Aucun joueur trouvé
                  </div>
                ) : (
                  filteredPlayers.map((player) => {
                    const avatarUrl = getPlayerAvatarUrl(player);

                    return (
                      <div 
                        key={player.uid || player.userId}
                        onClick={() => handlePlayerClick(player)}
                        className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 hover:border-amber-500/50 rounded-lg transition-all group cursor-pointer flex items-center gap-3 active:scale-[0.98]"
                      >
                        <img 
                          src={avatarUrl} 
                          alt={player.name} 
                          className="w-8 h-8 rounded-full border border-slate-700/60 group-hover:border-amber-500/60 transition-colors object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                              {player.name ?? "Joueur inconnu"}
                            </span>
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              LVL {player.level}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>X: {Math.round(player.location_x || 0)} | Y: {Math.round(player.location_y || 0)}</span>
                            {player.ping !== undefined && (
                              <span className="text-emerald-500/80">{Math.round(player.ping)}ms</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </aside>

        {/* CONTAINER DE LA CARTE */}
        <div className="flex-1 h-full relative bg-[#0C161E]">
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
            <MapController targetPosition={targetPosition} />
            <ImageOverlay
              url="palpagos.webp"
              bounds={bounds}
            />

            {/* --- 3. CONTRÔLES MAP : BOUTON DE TOGGLE TP & ZOOM --- */}
            <div className="leaflet-top leaflet-right !mt-4 !mr-4 z-[1000] flex flex-col gap-2">
              {/* Bouton pour afficher/masquer les TPs */}
              <button 
                onClick={() => setShowTPs(!showTPs)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center border border-slate-800 shadow-lg cursor-pointer transition-all duration-200 ${
                  showTPs 
                    ? 'bg-[#0f172a] text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                    : 'bg-[#0f172a]/90 text-slate-400 hover:text-white'
                }`}
                title={showTPs ? "Masquer les points de TP" : "Afficher les points de TP"}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>

              {/* Contrôles de zoom */}
              <div className="leaflet-bar border-0 shadow-lg flex flex-col">
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-t-lg" title="Zoom in" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomIn')); }}>+</a>
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-b-lg" title="Zoom out" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomOut')); }}>−</a>
              </div>
            </div>

            {/* MARQUEURS DES JOUEURS */}
            {players.map((player) => {
              const position = gameToMap(player.location_x || 0, player.location_y || 0);
              const playerKey = player.uid || player.userId;

              return (
                <Marker 
                  key={playerKey} 
                  position={position}
                  icon={createPlayerIcon(player)}
                  ref={(el) => {
                    if (el) markerRefs.current[playerKey] = el;
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="text-slate-100 bg-[#0f172a] border border-slate-800 p-2 rounded-lg shadow-xl font-sans min-w-[140px]">
                      <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center">
                        <strong className="text-sm font-bold text-amber-500">{player.name}</strong>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded">Lv.{player.level}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Secteur:</span>
                          <span className="text-slate-200">X:{Math.round(player.location_x || 0)} Y:{Math.round(player.location_y || 0)}</span>
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

            {/* --- 4. AFFICHAGE CONDITIONNEL DES MARQUEURS TP --- */}
            {showTPs && TELEPORT_POINTS.map((tp) => {
              const position = gameToMap(tp.gameX, tp.gameY);
              return (
                <Marker 
                  key={tp.id} 
                  position={position}
                  icon={createTPIcon()}
                >
                  <Popup className="custom-popup">
                    <div className="text-slate-100 bg-[#0f172a] border border-slate-800/80 p-2.5 rounded-lg shadow-xl font-sans min-w-[150px]">
                      <div className="border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <strong className="text-xs font-bold text-cyan-400">Voyage Rapide</strong>
                      </div>
                      <div className="text-sm font-black text-white mb-1">{tp.name}</div>
                      <div className="text-[9px] font-mono text-slate-500">
                        Coords : X:{Math.round(tp.gameX / 1000)} | Y:{Math.round(tp.gameY / 1000)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          </MapContainer>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #0C161E !important;
        }
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

        /* Styles de l'avatar circulaire du joueur */
        .player-avatar-wrapper {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 2px solid #f59e0b;
          background: #0f172a;
          display: flex !important;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .player-avatar-img {
          width: 100% !important;
          height: 100% !important;
          border-radius: 50% !important;
          object-fit: cover !important;
          display: block !important;
        }

        /* Fallback si l'avatar ne se charge pas */
        .player-avatar-fallback {
          display: none;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #1e293b;
          color: #f59e0b;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }

        /* Effet d'onde radar animée autour de l'avatar du joueur */
        .player-pulse-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          border: 2px solid #f59e0b;
          border-radius: 50%;
          animation: playerPulse 1.8s infinite ease-out;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes playerPulse {
          0% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        /* --- STYLES DESIGN DES TP (Nouveau) --- */
        .tp-marker {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2.5px solid #22d3ee; /* Cyan */
          background: #0f172a;
          display: flex !important;
          align-items: center;
          justify-content: center;
          z-index: 9;
        }

        .tp-pulse-ring {
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 1.5px solid #06b6d4;
          border-radius: 50%;
          animation: tpPulse 2s infinite ease-in-out;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes tpPulse {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}