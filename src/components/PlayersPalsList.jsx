import React, { useState, useEffect } from 'react';

// Dictionnaire de traduction française pour les aptitudes au travail
const WORK_TRANSLATIONS = {
  "WorkSuitability_EmitFlame": { name: "Allumage de feu", color: "text-red-400 bg-red-950/40 border-red-900/40" },
  "WorkSuitability_Watering": { name: "Arrosage", color: "text-blue-400 bg-blue-950/40 border-blue-900/40" },
  "WorkSuitability_Seeding": { name: "Semence", color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/40" },
  "WorkSuitability_GeneratingElectricity": { name: "Génération d'énergie", color: "text-yellow-400 bg-yellow-950/40 border-yellow-900/40" },
  "WorkSuitability_Handwork": { name: "Travaux manuels", color: "text-amber-400 bg-amber-950/40 border-amber-900/40" },
  "WorkSuitability_Collection": { name: "Collecte", color: "text-teal-400 bg-teal-950/40 border-teal-900/40" },
  "WorkSuitability_Deforest": { name: "Abattage", color: "text-orange-400 bg-orange-950/40 border-orange-900/40" },
  "WorkSuitability_Mining": { name: "Minage", color: "text-cyan-400 bg-cyan-950/40 border-cyan-900/40" },
  "WorkSuitability_OilExtraction": { name: "Extraction d'huile", color: "text-slate-400 bg-slate-950/40 border-slate-900/40" },
  "WorkSuitability_ProductMedicine": { name: "Pharmacie", color: "text-pink-400 bg-pink-950/40 border-pink-900/40" },
  "WorkSuitability_Cooling": { name: "Refroidissement", color: "text-sky-300 bg-sky-950/40 border-sky-300/10" },
  "WorkSuitability_Transport": { name: "Transport", color: "text-indigo-400 bg-indigo-950/40 border-indigo-900/40" },
  "WorkSuitability_MonsterFarm": { name: "Élevage", color: "text-lime-400 bg-lime-950/40 border-lime-900/40" }
};

// Fonction de calcul de la statistique de base pure d'origine
function getPureSpeciesStat(statValue, level, isHp = false) {
  if (!statValue || !level) return 0;
  
  // Correction des PV stockés en x1000 dans Palworld
  const realValue = isHp ? statValue / 1000 : statValue;
  
  // Formule inverse de montée de niveau : Stat = Base + (Base * 0.1 * (Niv - 1))
  const rawBase = realValue / (1 + 0.1 * (level - 1));
  
  return Math.round(rawBase);
}

// ==========================================
// COMPOSANT : DÉTAILS DU PAL (FENÊTRE MODALE)
// ==========================================
function PalDetailsModal({ pal, onClose }) {
  if (!pal) return null;

  const isBoss = pal.name?.startsWith("BOSS_") || pal.type?.startsWith("BOSS_") || pal.is_boss;
  const isLucky = pal.is_lucky || pal.name?.includes("LUCKY");

  // Calcul des statistiques de base réelles de l'espèce sans modificateur
  const baseHp = getPureSpeciesStat(pal.hp, pal.level, true);
  const baseAttack = getPureSpeciesStat(pal.attack, pal.level, false);
  const baseDefense = getPureSpeciesStat(pal.defense, pal.level, false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Bouton de fermeture */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-950/50 p-2 rounded-full border border-slate-800"
        >
          ✕
        </button>

        {/* En-tête */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-indigo-400 font-extrabold uppercase bg-indigo-950/50 border border-indigo-900/50 px-2.5 py-0.5 rounded-full">
              Niv. {pal.level}
            </span>
            {isLucky && <span className="text-[11px] font-mono text-purple-400 font-extrabold bg-purple-950 border border-purple-900 px-2 py-0.5 rounded-full">LUCKY</span>}
            {isBoss && <span className="text-[11px] font-mono text-amber-400 font-extrabold bg-amber-950 border border-amber-900 px-2 py-0.5 rounded-full">BOSS</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">{pal.name || pal.type}</h3>
          {pal.name !== pal.type && (
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">{pal.type}</p>
          )}
        </div>

        {/* Statistiques de Base de l'espèce */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 mb-6 space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Statistiques de Base de l'espèce (Sans niveau)</h4>
          
          {/* PV de base */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>PV de base</span>
              <span className="font-bold text-slate-200">{baseHp || "Inconnu"}</span>
            </div>
            <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: baseHp ? `${Math.min((baseHp / 200) * 100, 100)}%` : '0%' }}></div>
            </div>
          </div>

          {/* Attaque de base */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Attaque de base</span>
              <span className="font-bold text-slate-200">{baseAttack || "Inconnu"}</span>
            </div>
            <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: baseAttack ? `${Math.min((baseAttack / 200) * 100, 100)}%` : '0%' }}></div>
            </div>
          </div>

          {/* Défense de base */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Défense de base</span>
              <span className="font-bold text-slate-200">{baseDefense || "Inconnu"}</span>
            </div>
            <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: baseDefense ? `${Math.min((baseDefense / 200) * 100, 100)}%` : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Aptitudes au travail */}
        <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Aptitudes de travail</h4>
          {pal.work_suitabilities && pal.work_suitabilities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pal.work_suitabilities.map((suitability, index) => {
                const spec = WORK_TRANSLATIONS[suitability.suitability] || { name: suitability.suitability, color: "text-slate-300 bg-slate-900 border-slate-800" };
                return (
                  <div 
                    key={index} 
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${spec.color}`}
                  >
                    <span>{spec.name}</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded font-black">Lvl {suitability.level}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic py-2">Ce Pal ne possède aucune aptitude spécifique.</p>
          )}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// COMPOSANT : CARTE INDIVIDUELLE DU JOUEUR
// ==========================================
function PlayerCard({ player, onSelectPal }) {
  const [isOpen, setIsOpen] = useState(false);
  const [palSearch, setPalSearch] = useState("");
  const [pinnedPalIds, setPinnedPalIds] = useState([]);

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

  const togglePinPal = (e, palUniqueKey) => {
    e.stopPropagation();
    let updated;
    if (pinnedPalIds.includes(palUniqueKey)) {
      updated = pinnedPalIds.filter(id => id !== palUniqueKey);
    } else {
      if (pinnedPalIds.length >= 5) return;
      updated = [...pinnedPalIds, palUniqueKey];
    }
    setPinnedPalIds(updated);
    localStorage.setItem(`pinned_pals_${player.uid}`, JSON.stringify(updated));
  };

  const sortedPals = [...(player.pals || [])].sort((a, b) => (b.level || 0) - (a.level || 0));

  const palsWithKeys = sortedPals.map((pal, idx) => ({
    ...pal,
    uniqueKey: `${pal.type}_${pal.level}_${idx}`
  }));

  const pinnedPals = palsWithKeys.filter(pal => pinnedPalIds.includes(pal.uniqueKey));
  const activeTeam = pinnedPals.length > 0 ? pinnedPals : palsWithKeys.slice(0, 5);

  const activeKeys = activeTeam.map(p => p.uniqueKey);
  const palbox = palsWithKeys.filter(pal => !activeKeys.includes(pal.uniqueKey));

  const filteredPalbox = palbox.filter(pal => {
    const name = pal.name || pal.type || "";
    return name.toLowerCase().includes(palSearch.toLowerCase());
  });

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-slate-700/80 transition-all duration-300 backdrop-blur-md">
      
      {/* Infos Joueur */}
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

      {/* Équipe active */}
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
          <div className="space-y-3">
            {activeTeam.map((pal) => {
              const hasNickname = pal.name && pal.name !== pal.type;
              const isBoss = pal.name?.startsWith("BOSS_") || pal.type?.startsWith("BOSS_") || pal.is_boss;
              const isLucky = pal.is_lucky || pal.name?.includes("LUCKY");
              const isPinned = pinnedPalIds.includes(pal.uniqueKey);
              
              // Calcul des stats de base pures de l'espèce
              const baseHp = getPureSpeciesStat(pal.hp, pal.level, true);
              const baseAttack = getPureSpeciesStat(pal.attack, pal.level, false);
              const baseDefense = getPureSpeciesStat(pal.defense, pal.level, false);

              return (
                <div 
                  key={pal.uniqueKey} 
                  onClick={() => onSelectPal(pal)}
                  className="flex flex-col bg-slate-950/40 hover:bg-slate-950/90 p-3 rounded-xl border border-slate-850 hover:border-indigo-500/30 transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <button 
                        onClick={(e) => togglePinPal(e, pal.uniqueKey)}
                        className="text-slate-600 hover:text-amber-400 transition-colors shrink-0 z-10"
                        title={isPinned ? "Désépingler de l'équipe" : "Épingler dans l'équipe active"}
                      >
                        <span className={isPinned ? "text-amber-400 text-sm" : "text-slate-700 group-hover:text-slate-500 text-sm"}>★</span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-bold truncate ${isBoss ? 'text-amber-400' : isLucky ? 'text-purple-400' : 'text-slate-200 group-hover:text-white'}`}>
                            {pal.name || pal.type}
                          </p>
                          {isLucky && <span className="text-[9px] px-1 bg-purple-950 text-purple-400 border border-purple-800 rounded font-black shrink-0">LUCKY</span>}
                        </div>
                        {hasNickname && (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {pal.type}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded font-black font-mono border border-slate-700/50 shrink-0">
                      Lvl {pal.level}
                    </span>
                  </div>

                  {/* Statistiques de base pures */}
                  {(baseHp || baseAttack || baseDefense) && (
                    <div className="mt-2 pt-2 border-t border-slate-900/60 flex gap-4 text-[10px] font-mono text-slate-400">
                      {baseHp && <span>PV Base: <strong className="text-slate-300">{baseHp}</strong></span>}
                      {baseAttack && <span>ATK Base: <strong className="text-slate-300">{baseAttack}</strong></span>}
                      {baseDefense && <span>DEF Base: <strong className="text-slate-300">{baseDefense}</strong></span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Palbox */}
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

          {isOpen && (
            <div className="mt-4 space-y-3 animate-fade-in">
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

              <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredPalbox.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-600 italic">Aucun Pal trouvé.</p>
                ) : (
                  filteredPalbox.map((pal) => {
                    const isBoss = pal.name?.startsWith("BOSS_") || pal.type?.startsWith("BOSS_") || pal.is_boss;
                    return (
                      <div 
                        key={pal.uniqueKey} 
                        onClick={() => onSelectPal(pal)}
                        className="flex flex-col bg-slate-950/20 hover:bg-slate-950/50 p-2.5 rounded-lg border border-slate-900 text-xs cursor-pointer hover:border-slate-800 transition group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 min-w-0">
                            <button 
                              onClick={(e) => togglePinPal(e, pal.uniqueKey)}
                              className="text-slate-800 hover:text-amber-450 transition-colors shrink-0 z-10"
                              title="Épingler dans l'équipe active"
                            >
                              ★
                            </button>
                            <span className={`font-semibold truncate max-w-[120px] ${isBoss ? 'text-amber-500/90' : 'text-slate-400 group-hover:text-slate-200'}`}>
                              {pal.name || pal.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            Niv. {pal.level}
                          </span>
                        </div>
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
  const [selectedPal, setSelectedPal] = useState(null);

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
    <div className="max-w-7xl mx-auto px-4 py-8 text-white relative">
      
      {/* En-tête et Barre de recherche */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-800/80">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Nos Joueurs & leurs Pals
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Mise à jour en temps réel • <strong className="text-slate-200">{players.length}</strong> joueurs actifs
          </p>
          <p className="text-red-500 text-xs mt-1.5">
            Les données sont encore en construction et peuvent contenir des erreurs. Merci de votre compréhension.
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
          <p className="text-slate-500 text-lg">Aucun joueur ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start">
          {filteredPlayers.map((player) => (
            <PlayerCard 
              key={player.uid} 
              player={player} 
              onSelectPal={(pal) => setSelectedPal(pal)}
            />
          ))}
        </div>
      )}

      {/* Affichage de la modale au clic d'un Pal */}
      {selectedPal && (
        <PalDetailsModal 
          pal={selectedPal} 
          onClose={() => setSelectedPal(null)} 
        />
      )}
    </div>
  );
}