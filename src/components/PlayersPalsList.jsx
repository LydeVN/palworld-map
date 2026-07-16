import React, { useState, useEffect } from 'react';

// ==========================================
// COMPOSANT : CARTE INDIVIDUELLE DU JOUEUR
// ==========================================
function PlayerCard({ player }) {
  const [isOpen, setIsOpen] = useState(false);
  const [palSearch, setPalSearch] = useState("");
  const [pinnedPalIds, setPinnedPalIds] = useState([]);

  // Charger les favoris/équipe réelle sauvegardés localement pour ce joueur
  useEffect(() => {
    const saved = localStorage.getItem(`pinned_pals_${player.uid}`);
    if (saved) {
      try {
        setPinnedPalIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [player.uid]);

  // Sauvegarder les épingles
  const togglePinPal = (palUniqueKey) => {
    let updated;
    if (pinnedPalIds.includes(palUniqueKey)) {
      updated = pinnedPalIds.filter(id => id !== palUniqueKey);
    } else {
      // Limite à 5 Pals actifs maximum
      if (pinnedPalIds.length >= 5) return;
      updated = [...pinnedPalIds, palUniqueKey];
    }
    setPinnedPalIds(updated);
    localStorage.setItem(`pinned_pals_${player.uid}`, JSON.stringify(updated));
  };

  // 1. TRI DE TOUS LES PALS PAR NIVEAU DÉCROISSANT
  // On trie d'abord par niveau (du plus grand au plus petit) avant d'attribuer les clés
  const sortedPals = [...(player.pals || [])].sort((a, b) => {
    return (b.level || 0) - (a.level || 0);
  });

  // Création des identifiants uniques basés sur la liste triée
  const palsWithKeys = sortedPals.map((pal, idx) => ({
    ...pal,
    uniqueKey: `${pal.type}_${pal.level}_${idx}`
  }));

  // L'équipe active : priorité aux épingles, sinon prend les 5 plus hauts niveaux
  const pinnedPals = palsWithKeys.filter(pal => pinnedPalIds.includes(pal.uniqueKey));
  const activeTeam = pinnedPals.length > 0 ? pinnedPals : palsWithKeys.slice(0, 5);

  // La Palbox contient tout le reste (déjà trié par niveau !)
  const activeKeys = activeTeam.map(p => p.uniqueKey);
  const palbox = palsWithKeys.filter(pal => !activeKeys.includes(pal.uniqueKey));

  // Filtrer la Palbox selon la recherche locale
  const filteredPalbox = palbox.filter(pal => {
    const name = pal.name || pal.type || "";
    return name.toLowerCase().includes(palSearch.toLowerCase());
  });

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700/80 transition-all duration-300 backdrop-blur-md">
      
      {/* 1. INFOS PRINCIPALES DU JOUEUR */}
      <div className="flex justify-between items-center mb-6">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-white truncate tracking-wide" title={player.name}>
            {player.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-mono select-all">
            UID: {player.uid}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="px-3.5 py-1.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-400 border border-blue-500/30 text-xs font-black rounded-full uppercase tracking-widest shadow-inner">
            Niv. {player.level}
          </span>
        </div>
      </div>

      {/* 2. L'ÉQUIPE ACTIVE (Top 5 Niveaux ou Épinglée) */}
      <div className="pt-4 border-t border-slate-800/60">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            {pinnedPals.length > 0 ? "Équipe Épinglée" : "Top 5 Niveaux"}
          </h4>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md font-mono border border-slate-800">
            {activeTeam.length}/5
          </span>
        </div>

        {activeTeam.length === 0 ? (
          <p className="text-xs text-slate-600 italic py-2 text-center bg-slate-950/20 rounded-lg">
            Aucun Pal dans la boîte.
          </p>
        ) : (
          <div className="space-y-2">
            {activeTeam.map((pal, idx) => {
              const hasNickname = pal.name && pal.name !== pal.type;
              const isBoss = pal.name?.startsWith("BOSS_") || pal.type?.startsWith("BOSS_");
              const isPinned = pinnedPalIds.includes(pal.uniqueKey);
              
              return (
                <div 
                  key={pal.uniqueKey} 
                  className="flex justify-between items-center bg-slate-950/40 hover:bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-850 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => togglePinPal(pal.uniqueKey)}
                      className="text-slate-600 hover:text-amber-400 transition-colors"
                      title={isPinned ? "Désépingler de l'équipe" : "Épingler dans l'équipe active"}
                    >
                      <span className={isPinned ? "text-amber-400 text-sm" : "text-slate-700 group-hover:text-slate-500 text-sm"}>★</span>
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isBoss ? 'text-amber-400' : 'text-slate-200'}`}>
                        {pal.name}
                      </p>
                      {hasNickname && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {pal.type}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded font-black font-mono border border-slate-700/50">
                    Lvl {pal.level}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. LE CONTENEUR DE LA PALBOX (Déroulant) */}
      {player.pals && player.pals.length > 5 && (
        <div className="mt-4 pt-4 border-t border-slate-800/40">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/50 hover:bg-slate-950 text-xs font-bold text-slate-300 rounded-xl border border-slate-850 hover:border-slate-800 transition-all"
          >
            <span className="flex items-center gap-2">
              📦 Consulter la Palbox
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[9px]">
                {palbox.length} Pals
              </span>
            </span>
            <svg 
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Section Accordéon */}
          {isOpen && (
            <div className="mt-4 space-y-3">
              {/* Message d'aide */}
              <p className="text-[10px] text-slate-500 italic px-1">
                Cliquez sur l'étoile ★ d'un Pal pour l'ajouter à votre sélection de 5.
              </p>

              {/* Filtre interne pour la Palbox */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher dans la boîte..."
                  value={palSearch}
                  onChange={(e) => setPalSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <svg className="absolute left-2.5 top-2.5 w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Grille de la Palbox */}
              <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredPalbox.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-600 italic">Aucun Pal trouvé.</p>
                ) : (
                  filteredPalbox.map((pal) => {
                    const isBoss = pal.name?.startsWith("BOSS_") || pal.type?.startsWith("BOSS_");
                    return (
                      <div 
                        key={pal.uniqueKey} 
                        className="flex justify-between items-center bg-slate-950/20 hover:bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-900 text-xs transition group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button 
                            onClick={() => togglePinPal(pal.uniqueKey)}
                            className="text-slate-800 hover:text-amber-450 transition-colors"
                            title="Épingler dans l'équipe active"
                          >
                            ★
                          </button>
                          <span className={`font-semibold truncate max-w-[120px] ${isBoss ? 'text-amber-500/90' : 'text-slate-400'}`}>
                            {pal.name || pal.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Niv. {pal.level}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL : REGISTRE
// ==========================================
export default function PlayersPalsList() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch("https://opal.lydecorp.fr/api/all-players-pals");
      if (!response.ok) {
        throw new Error("Impossible de récupérer les données du serveur.");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setPlayers(data.players || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Chargement de la base de données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-950/40 border border-red-500/30 rounded-2xl text-white text-center backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="font-bold text-lg mb-1">Synchronisation impossible</h3>
        <p className="text-sm text-red-300/85">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* En-tête et Barre de recherche */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-800/80">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Registre des Aventuriers
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Mise à jour en temps réel • <strong className="text-slate-200">{players.length}</strong> explorateurs actifs
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Rechercher un joueur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
          />
          <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Grille des cartes Joueurs */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-500 text-lg">Aucun aventurier ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredPlayers.map((player) => (
            <PlayerCard key={player.uid} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}