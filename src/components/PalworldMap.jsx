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

  // --- DONNÉES DU REPO ET DICTIONNAIRE DE TRADUCTION ---
  const [fastTravelPoints, setFastTravelPoints] = useState([]);
  const [bosses, setBosses] = useState([]);
  const [effigies, setEffigies] = useState([]);
  const [palTranslations, setPalTranslations] = useState({});

  // --- FILTRES DE VISIBILITÉ ---
  const [showTP, setShowTP] = useState(true);
  const [showBosses, setShowBosses] = useState(true);
  const [showEffigies, setShowEffigies] = useState(false);

  const markerRefs = useRef({});

  // FORMULES DE CALIBRATION CONSERVÉES
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

  // Chargement simultané des POI et de ton fichier de traduction pals.json
  useEffect(() => {
    fetch('/pals.json')
      .then(res => res.json())
      .then(data => {
        const lowerCaseDict = {};
        Object.keys(data).forEach(key => {
          lowerCaseDict[key.toLowerCase()] = data[key];
        });
        setPalTranslations(lowerCaseDict);
      })
      .catch(err => console.error("Erreur de chargement du fichier /pals.json:", err));

    fetch('/fast_travel_points.json')
      .then(res => res.json())
      .then(data => setFastTravelPoints(Object.values(data)))
      .catch(err => console.error("Erreur fast_travel_points.json:", err));

    fetch('/bosses.json')
      .then(res => res.json())
      .then(data => setBosses(Object.values(data)))
      .catch(err => console.error("Erreur bosses.json:", err));

    fetch('/effigies.json')
      .then(res => res.json())
      .then(data => setEffigies(Object.values(data)))
      .catch(err => console.error("Erreur effigies.json:", err));
  }, []);

  // Fonction de traduction dynamique pour le Frontend
  const getFrenchBossName = (characterId) => {
    if (!characterId) return "Pal Inconnu";
    let cleanKey = characterId.replace(/^BOSS_/i, "").trim().toLowerCase();
    
    const palData = palTranslations[cleanKey];
    if (palData && palData.localized_name) {
      return palData.localized_name;
    }
    return characterId.replace(/^BOSS_/i, "").replace(/_/g, " ");
  };

  // WebSocket Joueurs
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
        console.error("Erreur WebSocket joueurs:", err);
      }
    };
    return () => ws.close();
  }, []);

  const handlePlayerClick = (player) => {
    const position = gameToMap(player.location_x || 0, player.location_y || 0);
    setTargetPosition(position);
    const playerKey = player.uid || player.userId;
    if (markerRefs.current[playerKey]) {
      setTimeout(() => { markerRefs.current[playerKey].openPopup(); }, 500);
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
      iconSize: [42, 42], iconAnchor: [21, 21], popupAnchor: [0, -20]
    });
  };

  const createTPIcon = () => L.divIcon({
    className: 'static-poi-tp',
    html: `<div class="w-4 h-4 rounded-full bg-cyan-400 border border-white shadow-md animate-pulse"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8]
  });

  const createBossIcon = (characterId) => {
    let cleanName = (characterId || "").replace(/^BOSS_/i, "").trim().toLowerCase();
    const imgUrl = `/img/${cleanName}.webp`;

    return L.divIcon({
      className: 'static-poi-boss-container',
      html: `
        <div class="boss-map-icon-wrapper shadow-md">
          <img src="${imgUrl}" 
               alt="Boss" 
               class="boss-map-img" 
               loading="lazy"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
          />
          <div class="boss-map-fallback">👑</div>
          <div class="boss-marker-badge">👑</div>
        </div>
      `,
      iconSize: [48, 48],     // <-- Augmenté de 36 à 48
      iconAnchor: [24, 24],   // <-- Ajusté à la moitié (24)
      popupAnchor: [0, -24]   // <-- Ajusté pour le Popup (optionnel)
    });
  };

  const createEffigyIcon = () => L.divIcon({
    className: 'static-poi-effigy',
    html: `<div class="w-3 h-3 rotate-45 bg-fuchsia-500 border border-white shadow-sm"></div>`,
    iconSize: [12, 12], iconAnchor: [6, 6]
  });

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
            <span className="text-xs font-medium text-slate-300">{connected ? 'LIVE SYNC' : 'OFFLINE'}</span>
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
                  <div className="text-center py-8 text-xs text-slate-500 italic">Aucun joueur trouvé</div>
                ) : (
                  filteredPlayers.map((player) => {
                    const avatarUrl = getPlayerAvatarUrl(player);
                    return (
                      <div 
                        key={player.uid || player.userId}
                        onClick={() => handlePlayerClick(player)}
                        className="p-3 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/40 hover:border-amber-500/50 rounded-lg transition-all group cursor-pointer flex items-center gap-3 active:scale-[0.98]"
                      >
                        <img src={avatarUrl} alt={player.name} className="w-8 h-8 rounded-full border border-slate-700/60 group-hover:border-amber-500/60 transition-colors object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="font-bold text-sm text-slate-200 group-hover:text-amber-400 transition-colors truncate">{player.name ?? "Joueur inconnu"}</span>
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0">LVL {player.level}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                            <span>X: {Math.round(player.location_x || 0)} | Y: {Math.round(player.location_y || 0)}</span>
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

        {/* CARTE */}
        <div className="flex-1 h-full relative bg-[#0C161E]">
          
          {/* BARRE DE FILTRES */}
          <div className="absolute left-4 top-4 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800/80 p-3 rounded-xl z-[1000] shadow-2xl flex flex-col gap-2 min-w-[160px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filtres Généraux</div>
            
            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none hover:text-white">
              <input type="checkbox" checked={showTP} onChange={(e) => setShowTP(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0" />
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Téléporteurs</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none hover:text-white">
              <input type="checkbox" checked={showBosses} onChange={(e) => setShowBosses(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0" />
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Alphas & Boss</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none hover:text-white">
              <input type="checkbox" checked={showEffigies} onChange={(e) => setShowEffigies(e.target.checked)} className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0" />
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rotate-45 bg-fuchsia-500"></span> Effigies Lifmunk</span>
            </label>
          </div>

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
            <ImageOverlay url="palpagos.webp" bounds={bounds} />

            {/* CONTROLES ZOOM */}
            <div className="leaflet-top leaflet-right !mt-4 !mr-4 z-[1000]">
              <div className="leaflet-bar border-0 shadow-lg">
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-t-lg" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomIn')); }}>+</a>
                <a href="#" className="!bg-[#0f172a] !text-white !border-slate-800 hover:!bg-amber-500 hover:!text-slate-950 transition-colors !flex !items-center !justify-center !w-10 !h-10 !rounded-b-lg" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event('zoomOut')); }}>−</a>
              </div>
            </div>

            {/* MARQUEURS : TP */}
            {showTP && fastTravelPoints.map((tp, idx) => (
              <Marker key={`tp-${idx}`} position={gameToMap(tp.x, tp.y)} icon={createTPIcon()}>
                <Popup>
                  <div className="bg-[#0f172a] border border-cyan-500/30 p-2 rounded-lg text-slate-100 font-sans min-w-[150px]">
                    <div className="font-bold text-xs text-cyan-400 mb-0.5">🌐 Voyage Rapide</div>
                    <div className="text-sm font-medium">{tp.localized_name || "Statue de TP"}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">X: {Math.round(tp.x)} | Y: {Math.round(tp.y)}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* MARQUEURS : BOSS TRADUITS ET STABILISÉS */}
            {showBosses && bosses.map((boss, idx) => {
              const localizedName = getFrenchBossName(boss.character_id);
              return (
                <Marker key={`boss-${idx}`} position={gameToMap(boss.x, boss.y)} icon={createBossIcon(boss.character_id)}>
                  <Popup>
                    <div className="bg-[#0f172a] border border-rose-500/30 p-2 rounded-lg text-slate-100 font-sans min-w-[160px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-rose-400">👑 Boss Alpha</span>
                        <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-1 rounded">Niv. {boss.level}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-100">{localizedName}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">X: {Math.round(boss.x)} | Y: {Math.round(boss.y)}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* MARQUEURS : EFFIGIES */}
            {showEffigies && effigies.map((effigy, idx) => (
              <Marker key={`effigy-${idx}`} position={gameToMap(effigy.x, effigy.y)} icon={createEffigyIcon()}>
                <Popup>
                  <div className="bg-[#0f172a] border border-fuchsia-500/30 p-1.5 rounded text-slate-100 font-sans">
                    <div className="font-bold text-[11px] text-fuchsia-400">🗿 Effigie de Lifmunk</div>
                    <div className="text-[9px] font-mono text-slate-500">X: {Math.round(effigy.x)} | Y: {Math.round(effigy.y)}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* MARQUEURS JOUEURS */}
            {players.map((player) => {
              const position = gameToMap(player.location_x || 0, player.location_y || 0);
              const playerKey = player.uid || player.userId;

              return (
                <Marker 
                  key={playerKey} 
                  position={position}
                  icon={createPlayerIcon(player)}
                  ref={(el) => { if (el) markerRefs.current[playerKey] = el; }}
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
        .leaflet-container { background: #0C161E !important; }
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-close-button { color: #94a3b8 !important; padding: 6px 6px 0 0 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        
        .player-avatar-wrapper {
          position: relative; width: 38px; height: 38px; border-radius: 50%; border: 2px solid #f59e0b;
          background: #0f172a; display: flex !important; align-items: center; justify-content: center; z-index: 10;
        }
        .player-avatar-img { width: 100% !important; height: 100% !important; border-radius: 50% !important; object-fit: cover !important; display: block !important; }
        .player-avatar-fallback {
          display: none; width: 100%; height: 100%; border-radius: 50%; background: #1e293b; color: #f59e0b; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;
        }
        .player-pulse-ring {
          position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border: 2px solid #f59e0b; border-radius: 50%; animation: playerPulse 1.8s infinite ease-out; opacity: 0; pointer-events: none;
        }
        @keyframes playerPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        /* Styles stabilisés pour les icônes d'illustrations des BOSS */
        .boss-map-icon-wrapper {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 2px solid #ef4444; 
          background: #1a1025; 
          display: flex !important;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .boss-map-img {
          width: 100% !important;
          height: 100% !important;
          border-radius: 50% !important;
          object-fit: cover !important;
          display: block;
        }
        /* Fallback flex centré en cas d'erreur de chargement de l'image */
        .boss-map-fallback {
          display: none;
          position: absolute;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          background: #271420;
          border-radius: 50%;
        }
        .boss-marker-badge {
          position: absolute;
          bottom: -1px;
          right: -1px;
          background: #ef4444;
          color: white;
          font-size: 8px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #1a1025;
          z-index: 15;
        }
      `}</style>
    </div>
  );
}