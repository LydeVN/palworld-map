import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { API_CONFIG } from '../config';
import 'leaflet/dist/leaflet.css';

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 2048;
const bounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

// Cache pour éviter de spammer l'API Twitch pour les mêmes joueurs
const twitchAvatarCache = {};

export default function PalworldMap() {
  const [players, setPlayers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [avatars, setAvatars] = useState({});

  // Récupération de l'avatar Twitch pour un joueur donné (sécurisé)
  const fetchTwitchAvatar = async (username) => {
    if (!username) return `https://ui-avatars.com/api/?name=Aventurier&background=f59e0b&color=0f172a&bold=true&rounded=true`;
    
    if (twitchAvatarCache[username]) {
      return twitchAvatarCache[username];
    }

    try {
      if (API_CONFIG.TWITCH_CLIENT_ID && API_CONFIG.TWITCH_OAUTH_TOKEN) {
        const response = await fetch(`https://api.twitch.tv/helix/users?login=${username.toLowerCase()}`, {
          headers: {
            'Client-ID': API_CONFIG.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${API_CONFIG.TWITCH_OAUTH_TOKEN}`
          }
        });
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const url = data.data[0].profile_image_url;
          twitchAvatarCache[username] = url;
          return url;
        }
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'avatar Twitch pour", username, err);
    }

    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=f59e0b&color=0f172a&bold=true&rounded=true`;
    twitchAvatarCache[username] = fallback;
    return fallback;
  };

  // Charger les avatars quand la liste des joueurs change (sécurisé)
  useEffect(() => {
    players.forEach(async (player) => {
      if (!player) return;
      const pId = player.userId || player.player_uid || "unknown";
      const pName = player.name || player.player_name || "Aventurier";

      if (player.avatar_url) {
        setAvatars(prev => ({ ...prev, [pId]: player.avatar_url }));
        return;
      }
      if (!avatars[pId]) {
        const url = await fetchTwitchAvatar(pName);
        setAvatars(prev => ({ ...prev, [pId]: url }));
      }
    });
  }, [players]);

  // Conversion calibrée : gère les inversions et l'échelle réelle de Palworld
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

  // Création d'une icône Leaflet personnalisée avec l'avatar Twitch (sécurisé)
  const createTwitchIcon = (username, userId) => {
    const pName = username || "Aventurier";
    const pId = userId || "unknown";
    const avatarUrl = avatars[pId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=f59e0b&color=0f172a&bold=true`;
    
    return L.divIcon({
      className: 'custom-twitch-marker',
      html: `
        <div class="relative group flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-amber-500/40 animate-ping opacity-75"></div>
          <div class="w-10 h-10 rounded-full border-2 border-amber-500 bg-[#0f172a] p-0.5 overflow-hidden shadow-lg shadow-black/80 relative z-10 transition-transform duration-200 group-hover:scale-110">
            <img src="${avatarUrl}" alt="${pName}" class="w-full h-full rounded-full object-cover" />
          </div>
          <div class="w-3.5 h-3.5 bg-amber-500 rotate-45 absolute -bottom-1 z-0 rounded-sm shadow-md"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40], 
      popupAnchor: [0, -42]
    });
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
        console.error("Erreur parsing WebSocket message:", err);
      }
    };
    return () => ws.close();
  }, []);

  // 🛡️ Filtre blindé contre les champs indéfinis/nuls pendant les synchronisations
  const filteredPlayers = players.filter(p => {
    const name = p?.name || p?.player_name || p?.nickname || "Aventurier";
    const term = searchTerm || "";
    return name.toLowerCase().includes(term.toLowerCase());
  });

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
                  filteredPlayers.map((player) => {
                    const pId = player?.userId || player?.player_uid || "unknown";
                    const pName = player?.name || player?.player_name || player?.nickname || "Aventurier";
                    return (
                      <div 
                        key={pId}
                        className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 hover:border-amber-500/30 rounded-lg transition-all group"
                      >
                        <div className="flex justify-between items-start mb-1 flex-nowrap gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img 
                              src={avatars[pId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(pName)}&background=f59e0b&color=0f172a&bold=true`} 
                              alt="" 
                              className="w-6 h-6 rounded-full border border-amber-500/50 object-cover flex-shrink-0"
                            />
                            <span className="font-bold text-sm text-slate-250 group-hover:text-amber-400 transition-colors truncate">
                              {pName}
                            </span>
                          </div>
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 self-center">
                            LVL {player?.level ?? 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
                          <span>X: {Math.round(player?.location_x ?? 0)} | Y: {Math.round(player?.location_y ?? 0)}</span>
                          {player?.ping !== undefined && (
                            <span className="text-emerald-500/80">{Math.round(player.ping)}ms</span>
                          )}
                        </div>
                      </div>
                    );
                  })
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
              const pId = player?.userId || player?.player_uid || "unknown";
              const pName = player?.name || player?.player_name || player?.nickname || "Aventurier";
              const position = gameToMap(player?.location_x ?? 0, player?.location_y ?? 0);
              const customIcon = createTwitchIcon(pName, pId);
              
              return (
                <Marker key={pId} position={position} icon={customIcon}>
                  <Popup className="custom-popup">
                    <div className="text-slate-100 bg-[#0f172a] border border-slate-800 p-2 rounded-lg shadow-xl font-sans min-w-[140px]">
                      <div className="border-b border-slate-800 pb-1 mb-1.5 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <img src={avatars[pId]} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <strong className="text-sm font-bold text-amber-500">{pName}</strong>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1 rounded flex-shrink-0">Lv.{player?.level ?? 0}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Secteur:</span>
                          <span className="text-slate-200">X:{Math.round(player?.location_x ?? 0)} Y:{Math.round(player?.location_y ?? 0)}</span>
                        </div>
                        {player?.ping !== undefined && (
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

      {/* Styles d'ajustement */}
      <style>{`
        .leaflet-container {
          background: #090d16 !important;
        }
        .custom-twitch-marker {
          background: none !important;
          border: none !important;
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
      `}</style>
    </div>
  );
}