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

function getPureSpeciesStat(statValue, level, isHp = false) {
  if (!statValue || !level) return 0;
  const realValue = isHp ? statValue / 1000 : statValue;
  return Math.round(realValue / (1 + 0.1 * (level - 1)));
}

// ==========================================
// COMPOSANT : DÉTAILS DU PAL (FENÊTRE MODALE)
// ==========================================
function PalDetailsModal({ pal, onClose, getPalNameAndIcon }) {
  if (!pal) return null;

  const isBoss = pal.name?.includes("(Boss)") || pal.type?.includes("(Boss)") || pal.is_boss;
  const isLucky = pal.is_lucky || pal.name?.includes("LUCKY");

  const baseHp = getPureSpeciesStat(pal.hp, pal.level, true);
  const baseAttack = getPureSpeciesStat(pal.attack, pal.level, false);

  const { displayName, iconUrl } = getPalNameAndIcon(pal.type, pal.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-950/50 p-3 rounded-full border border-slate-800 text-lg">✕</button>
        <div className="flex items-center gap-6 mb-8">
          <div className="w-28 h-28 bg-slate-950 border-2 border-slate-800 rounded-2xl p-2 shrink-0 flex items-center justify-center">
            <img src={iconUrl} alt={displayName} className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/img/unknown.webp'; }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-indigo-400 font-extrabold uppercase bg-indigo-950/60 border border-indigo-900/50 px-3 py-1 rounded-full">Niveau {pal.level}</span>
              {isLucky && <span className="text-xs font-mono text-purple-400 font-extrabold bg-purple-950 border border-purple-900 px-3 py-1 rounded-full">LUCKY</span>}
              {isBoss && <span className="text-xs font-mono text-amber-400 font-extrabold bg-amber-950 border border-amber-900 px-3 py-1 rounded-full">BOSS</span>}
            </div>
            <h3 className="text-3xl font-black tracking-tight text-white truncate">{displayName}</h3>
          </div>
        </div>
        
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 mb-6 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Statistiques de Base</h4>
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-1.5"><span>PV de base</span><span className="font-bold text-slate-200">{baseHp || "Inconnu"}</span></div>
            <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: baseHp ? `${Math.min((baseHp / 200) * 100, 100)}%` : '0%' }}></div></div>
          </div>
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-1.5"><span>Attaque de base</span><span className="font-bold text-slate-200">{baseAttack || "Inconnu"}</span></div>
            <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden"><div className="bg-red-500 h-full" style={{ width: baseAttack ? `${Math.min((baseAttack / 200) * 100, 100)}%` : '0%' }}></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPOSANT : CARTE INDIVIDUELLE DU JOUEUR
// ==========================================
function PlayerCard({ player, onSelectPal, filters, getPalNameAndIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [palSearch, setPalSearch] = useState("");
  const [pinnedPalIds, setPinnedPalIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(`pinned_pals_${player.uid}`);
    if (saved) { try { setPinnedPalIds(JSON.parse(saved)); } catch (e) {} }
  }, [player.uid]);

  const togglePinPal = (e, palUniqueKey) => {
    e.stopPropagation();
    const updated = pinnedPalIds.includes(palUniqueKey) ? pinnedPalIds.filter(id => id !== palUniqueKey) : [...pinnedPalIds, palUniqueKey];
    setPinnedPalIds(updated);
    localStorage.setItem(`pinned_pals_${player.uid}`, JSON.stringify(updated));
  };

  const sortedPals = [...(player.pals || [])].sort((a, b) => (b.level || 0) - (a.level || 0));

  const palsWithKeys = sortedPals.map((pal, idx) => {
    const { displayName, iconUrl } = getPalNameAndIcon(pal.type, pal.name);
    return { ...pal, displayName, iconUrl, uniqueKey: `${pal.type}_${pal.level}_${idx}` };
  });

  const filteredAllPals = palsWithKeys.filter(pal => {
    return pal.displayName.toLowerCase().includes(filters.palSearchQuery.toLowerCase()) ||
           (pal.type || "").toLowerCase().includes(filters.palSearchQuery.toLowerCase());
  });

  const pinnedPals = filteredAllPals.filter(pal => pinnedPalIds.includes(pal.uniqueKey));
  const activeTeam = pinnedPals.length > 0 ? pinnedPals : filteredAllPals.slice(0, 5);
  const activeKeys = activeTeam.map(p => p.uniqueKey);
  const palbox = filteredAllPals.filter(pal => !activeKeys.includes(pal.uniqueKey));

  const filteredPalbox = palbox.filter(pal => 
    pal.displayName.toLowerCase().includes(palSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-black text-white truncate">{player.name}</h3>
          <p className="text-xs text-slate-500 font-mono">UID: {player.uid}</p>
        </div>
        <span className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black rounded-full">Niv. {player.level}</span>
      </div>

      <div className="pt-5 border-t border-slate-800/60 space-y-3">
        {activeTeam.map((pal) => {
          const isBoss = pal.name?.includes("(Boss)") || pal.type?.includes("(Boss)") || pal.is_boss;
          const isPinned = pinnedPalIds.includes(pal.uniqueKey);
          const baseHp = getPureSpeciesStat(pal.hp, pal.level, true);

          return (
            <div key={pal.uniqueKey} onClick={() => onSelectPal(pal)} className="flex items-center gap-4 bg-slate-950/40 hover:bg-slate-950/90 p-4 rounded-xl border border-slate-850 cursor-pointer group">
              <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                <img src={pal.iconUrl} alt={pal.displayName} className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/img/unknown.webp'; }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={(e) => togglePinPal(e, pal.uniqueKey)} className="text-slate-600 hover:text-amber-400 text-base">
                      {isPinned ? "★" : "☆"}
                    </button>
                    <p className={`text-base font-bold truncate ${isBoss ? 'text-amber-400' : 'text-slate-200'}`}>{pal.displayName}</p>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Lvl {pal.level}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAllPals.length > 5 && (
        <div className="mt-5 pt-4 border-t border-slate-800/40">
          <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-950/50 hover:bg-slate-950 text-xs font-bold text-slate-300 rounded-xl border border-slate-850">
            <span>📦 Reste de la Boîte ({palbox.length})</span>
            <span className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
          </button>

          {isOpen && (
            <div className="mt-4 space-y-3">
              <input type="text" placeholder="Rechercher..." value={palSearch} onChange={(e) => setPalSearch(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white" />
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {filteredPalbox.map((pal) => (
                  <div key={pal.uniqueKey} onClick={() => onSelectPal(pal)} className="flex items-center gap-3 bg-slate-950/20 hover:bg-slate-950/50 p-2 rounded-xl border border-slate-900 text-xs cursor-pointer">
                    <img src={pal.iconUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => { e.target.onerror = null; e.target.src = '/img/unknown.webp'; }} />
                    <span className="truncate flex-1 text-slate-400">{pal.displayName}</span>
                    <span className="font-mono text-slate-500">Niv.{pal.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL : REGISTRE COMPLET
// ==========================================
export default function PlayersPalsList() {
  const [players, setPlayers] = useState([]);
  const [palTranslations, setPalTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPal, setSelectedPal] = useState(null); // CORRECTION : Déclaration essentielle de selectedPal !

  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [palSearchQuery, setPalSearchQuery] = useState("");

  useEffect(() => {
    fetch('/pals.json')
      .then(res => res.json())
      .then(data => setPalTranslations(data))
      .catch(err => console.error("Erreur pals.json:", err));
  }, []);

  useEffect(() => {
    fetch("https://opal.lydecorp.fr/api/all-players-pals")
      .then(res => res.json())
      .then(data => setPlayers(data.players || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // RESOLUTION : LIAISON DIRECTE API -> DOSSIER IMAGES IMGMAPPING
  const getPalNameAndIcon = (characterId, fallbackName) => {
    const rawName = characterId || fallbackName || "Pal Inconnu";
    
    // 1. Nettoyer le suffixe " (Boss)" généré par ton API
    let cleanName = rawName.replace(/\s*\(Boss\)/i, "").trim();
    
    // Le nom d'affichage final est le nom propre nettoyé
    const displayName = cleanName;

    // 2. Traitement du nom pour le dossier d'images (Tout en minuscules, gestion des espaces)
    let imageName = cleanName.toLowerCase().replace(/\s+/g, "");

    // 3. Mapping exact entre le nom Français/Anglique de l'API et ton dossier /public/img/
    const apiToImageFile = {
      "melpaca": "alpaca",
      "kitsun": "amaterasuwolf",
      "kitsunnoct": "amaterasuwolf_dark",
      "fuddler": "badcatgirl",
      "petallia": "lilyqueen",
      "flopie": "flowerat",
      "dumud": "lazycatfish",
      "relaxaurus": "lazydragon",
      "elphidran": "elfdragon",
      "chillet": "chillet",
      "anubis": "anubis",
      "sekhmet": "sekhmet"
    };

    const finalImageName = apiToImageFile[imageName] || imageName;
    const iconUrl = `/img/${finalImageName}.webp`;

    return { displayName, iconUrl };
  };

  const filteredPlayers = players.filter(player => player.name.toLowerCase().includes(playerSearchQuery.toLowerCase()));

  if (loading) return <div className="text-center text-white p-20">Chargement...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="text" placeholder="Rechercher un Joueur..." value={playerSearchQuery} onChange={(e) => setPlayerSearchQuery(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl" />
        <input type="text" placeholder="Rechercher un Pal..." value={palSearchQuery} onChange={(e) => setPalSearchQuery(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl" />
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player) => (
          <PlayerCard key={player.uid} player={player} filters={{ palSearchQuery }} onSelectPal={(pal) => setSelectedPal(pal)} getPalNameAndIcon={getPalNameAndIcon} />
        ))}
      </div>

      {selectedPal && <PalDetailsModal pal={selectedPal} onClose={() => setSelectedPal(null)} getPalNameAndIcon={getPalNameAndIcon} />}
    </div>
  );
}