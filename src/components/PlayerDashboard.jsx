import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../config';

// Cache local pour les avatars Twitch
const twitchAvatarCache = {};

export default function PlayersDashboard() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [avatars, setAvatars] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Simulation / Récupération des données du backend
  useEffect(() => {
    const fetchAllPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.API_BASE_URL}/api/players`);
        const data = await response.json();
        setAllPlayers(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des joueurs:", err);
        // Fallback de démonstration si ton API n'est pas encore prête :
        setAllPlayers(getMockPlayersData());
      } finally {
        setLoading(false);
      }
    };

    fetchAllPlayers();
  }, []);

  // Récupération des avatars Twitch (identique à ton système sur la carte)
  const fetchTwitchAvatar = async (username) => {
    if (twitchAvatarCache[username]) return twitchAvatarCache[username];
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
    } catch (err) {}
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=f59e0b&color=0f172a&bold=true&rounded=true`;
    twitchAvatarCache[username] = fallback;
    return fallback;
  };

  useEffect(() => {
    allPlayers.forEach(async (player) => {
      if (player.avatar_url) {
        setAvatars(prev => ({ ...prev, [player.userId]: player.avatar_url }));
        return;
      }
      if (!avatars[player.userId]) {
        const url = await fetchTwitchAvatar(player.name);
        setAvatars(prev => ({ ...prev, [player.userId]: url }));
      }
    });
  }, [allPlayers]);

  const filteredPlayers = allPlayers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-6 font-sans">
      
      {/* HEADER DE LA PAGE */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-wider text-amber-500 uppercase">Registre des Aventuriers</h1>
          <p className="text-sm text-slate-400 font-mono mt-1">PROFILeS, PALS ET STATISTIQUES GLOBALES DU SERVEUR</p>
        </div>
        
        {/* BARRE DE RECHERCHE */}
        <div className="w-full md:w-80">
          <input 
            type="text" 
            placeholder="Rechercher un aventurier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <div 
              key={player.userId}
              onClick={() => setSelectedPlayer(player)}
              className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/5 group flex flex-col justify-between"
            >
              <div>
                {/* ID & NIVEAU */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                    player.isOnline 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-800/60 text-slate-400 border border-slate-700/30'
                  }`}>
                    {player.isOnline ? '● EN LIGNE' : 'HORS LIGNE'}
                  </span>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded font-mono font-black">
                    LVL {player.level}
                  </span>
                </div>

                {/* PROFIL JOUEUR */}
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={avatars[player.userId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=f59e0b&color=0f172a&bold=true`} 
                    alt={player.name}
                    className="w-14 h-14 rounded-full border-2 border-slate-800 group-hover:border-amber-500/50 transition-colors object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate max-w-[160px]">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">Guilde : {player.guildName || 'Sans Guilde'}</p>
                  </div>
                </div>

                {/* MINI APERÇU DES PALS DE L'ÉQUIPE */}
                <div className="border-t border-slate-800/60 pt-4 mt-2">
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Équipe active</h4>
                  <div className="flex gap-2">
                    {player.pals && player.pals.slice(0, 5).map((pal, idx) => (
                      <div 
                        key={idx} 
                        className="w-10 h-10 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-col items-center justify-center relative group/pal"
                        title={`${pal.name} (Lvl ${pal.level})`}
                      >
                        <span className="text-lg">{pal.emoji || '🐾'}</span>
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 text-[8px] px-0.5 rounded font-bold font-mono text-amber-500">
                          {pal.level}
                        </span>
                      </div>
                    ))}
                    {(!player.pals || player.pals.length === 0) && (
                      <p className="text-xs text-slate-500 italic py-1">Aucun Pal équipé</p>
                    )}
                  </div>
                </div>
              </div>

              {/* STATS RAPIDES */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-800/60 pt-4 mt-4">
                <span>Pals Capturés : <strong className="text-slate-300">{player.capturedCount || 0}</strong></span>
                <span>Morts : <strong className="text-slate-300">{player.deaths || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DÉTAIL DU JOUEUR */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-xl cursor-pointer"
            >
              ✕
            </button>

            {/* Header Modal */}
            <div className="p-6 bg-slate-950/50 border-b border-slate-800 flex items-center gap-4">
              <img 
                src={avatars[selectedPlayer.userId]} 
                alt="" 
                className="w-16 h-16 rounded-full border-2 border-amber-500 object-cover" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-amber-500">{selectedPlayer.name}</h2>
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs px-2 py-0.5 rounded font-mono font-black">
                    LVL {selectedPlayer.level}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {selectedPlayer.userId}</p>
              </div>
            </div>

            {/* Contenu Modal */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              {/* Infos Générales */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Guilde</span>
                  <span className="text-sm font-bold text-slate-200">{selectedPlayer.guildName || 'Aucune'}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Temps de jeu</span>
                  <span className="text-sm font-bold text-slate-200">{selectedPlayer.playTime || '0h'}</span>
                </div>
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Statut</span>
                  <span className={`text-sm font-bold ${selectedPlayer.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedPlayer.isOnline ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>

              {/* Équipe Complète de Pals détaillés */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Pals dans l'équipe ({selectedPlayer.pals?.length || 0})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedPlayer.pals?.map((pal, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-950 rounded-lg flex items-center justify-center text-2xl border border-slate-800">
                        {pal.emoji || '🐾'}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <strong className="text-sm text-slate-200 truncate">{pal.name}</strong>
                          <span className="text-xs text-amber-500 font-mono font-bold">Lvl {pal.level}</span>
                        </div>
                        {/* Traits / Compétences passives croustillantes */}
                        {pal.passives && pal.passives.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {pal.passives.map((passive, pIdx) => (
                              <span key={pIdx} className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 rounded font-sans uppercase">
                                {passive}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Données fictives pour la démonstration (en attendant que ton API les renvoie via le fichier Level.sav)
function getMockPlayersData() {
  return [
    {
      userId: "player_01",
      name: "TwitchGamer",
      level: 48,
      isOnline: true,
      guildName: "Les Pal-adinautes",
      capturedCount: 142,
      deaths: 12,
      playTime: "74h",
      pals: [
        { name: "Anubis", level: 45, emoji: "🦊", passives: ["Chef d'équipe", "Vitesse folle"] },
        { name: "Jetragon", level: 48, emoji: "🐉", passives: ["Légende", "Sprint"] },
        { name: "Grizzbolt", level: 42, emoji: "⚡", passives: ["Gros bras"] }
      ]
    },
    {
      userId: "player_02",
      name: "Slayer_FR",
      level: 22,
      isOnline: false,
      guildName: "Mercenaires",
      capturedCount: 45,
      deaths: 34,
      playTime: "18h",
      pals: [
        { name: "Lamball", level: 20, emoji: "🐑", passives: ["Lâche"] },
        { name: "Depresso", level: 22, emoji: "🙀", passives: ["Insomniaque", "Négatif"] }
      ]
    }
  ];
}