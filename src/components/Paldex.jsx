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
  "WorkSuitability_Cooling": { name: "Refroidissement", color: "text-sky-300 bg-sky-950/40 border-sky-900/40" },
  "WorkSuitability_Transport": { name: "Transport", color: "text-indigo-400 bg-indigo-950/40 border-indigo-900/40" },
  "WorkSuitability_MonsterFarm": { name: "Élevage", color: "text-lime-400 bg-lime-950/40 border-lime-900/40" }
};

export default function Paldex() {
  const [pals, setPals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Tous");
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPals = await fetch("/pals.json");
        if (!resPals.ok) throw new Error("Impossible de lire pals.json");
        const dataPals = await resPals.json();

        const resTrads = await fetch("/pals_fr.json");
        if (!resTrads.ok) throw new Error("Impossible de lire pals_fr.json");
        const dataTrads = await resTrads.json();

        const uniquePalsMap = new Map();

        Object.keys(dataPals).forEach(key => {
          const rawTrad = dataTrads[key];
          let realName = key;
          let description = "";

          if (rawTrad) {
            if (typeof rawTrad === 'object') {
              realName = rawTrad.localized_name || key;
              description = rawTrad.description || "";
            } else if (typeof rawTrad === 'string') {
              realName = rawTrad;
            }
          } else {
            realName = key.replace(/([A-Z])/g, ' $1').trim();
          }

          const palData = dataPals[key];

          if (palData.is_pal && palData.pal_deck_index > 0) {
            const index = palData.pal_deck_index;

            if (!uniquePalsMap.has(index) || (!key.includes("GYM_") && !key.includes("Boss_"))) {
              uniquePalsMap.set(index, {
                key: key,
                realName: realName,
                description: description,
                hp: palData.hp || palData.base_hp || 100,
                attack: palData.melee_attack || palData.attack || 100,
                defense: palData.defense || 100,
                ...palData
              });
            }
          }
        });

        const palsList = Array.from(uniquePalsMap.values())
          .sort((a, b) => (a.pal_deck_index || 0) - (b.pal_deck_index || 0));

        setPals(palsList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const allTypes = [
    "Tous",
    ...new Set(pals.flatMap(pal => pal.element_types || []))
  ];

  const filteredPals = pals.filter(pal => {
    const name = (pal.realName || pal.key || "").toString();
    const idString = (pal.pal_deck_index || "").toString();
    
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || idString.includes(search);
    const matchesType = selectedType === "Tous" || (pal.element_types && pal.element_types.includes(selectedType));
    
    return matchesSearch && matchesType;
  });

  const getPalImageUrl = (palKey) => {
    if (!palKey) return null;
    return `https://raw.githubusercontent.com/itstait/palpedia/main/public/images/pals/${palKey}.png`;
  };

  const handleImageError = (palKey) => {
    setImageErrors(prev => ({
      ...prev,
      [palKey]: true
    }));
  };

  // Helper pour traduire proprement l'aptitude
  const getWorkTranslation = (suitabilityKey) => {
    return WORK_TRANSLATIONS[suitabilityKey] || { name: suitabilityKey, color: "text-slate-300 bg-slate-900 border-slate-800" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Chargement de ton Paldex local...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400 bg-slate-900/40 border border-red-500/20 rounded-2xl max-w-md mx-auto my-8">
        <p className="font-bold mb-2">Erreur lors de la lecture des fichiers JSON</p>
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Paldex Local Unique
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Fiches complètes avec aptitudes de travail traduites en français. ({pals.length} Pals chargés)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher (ex: Kitsun, Melpaca...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600"
          />
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-300"
          >
            {allTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grille */}
      {filteredPals.length === 0 ? (
        <p className="text-center text-slate-500 py-12">Aucun Pal ne correspond à ta recherche.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPals.map((pal) => {
            const imageUrl = getPalImageUrl(pal.key);
            const hasImageError = imageErrors[pal.key];

            return (
              <div 
                key={pal.key} 
                className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col hover:border-slate-700/80 hover:bg-slate-900/60 transition duration-300 group justify-between"
              >
                <div>
                  {/* ID, Image & Infos Principales */}
                  <div className="flex gap-4 items-center mb-4">
                    <div className="w-16 h-16 bg-slate-950/80 rounded-xl flex items-center justify-center overflow-hidden border border-slate-800/60 group-hover:border-slate-700 shrink-0">
                      {imageUrl && !hasImageError ? (
                        <img 
                          src={imageUrl} 
                          alt={pal.realName}
                          className="w-12 h-12 object-contain group-hover:scale-110 transition duration-300"
                          onError={() => handleImageError(pal.key)}
                        />
                      ) : (
                        <span className="text-xs text-slate-600 font-bold font-mono">
                          {pal.realName.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        N°{pal.pal_deck_index || "???"}
                      </span>
                      <h3 className="text-base font-bold text-slate-200 truncate" title={pal.realName}>
                        {pal.realName}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pal.element_types && pal.element_types.map((type, index) => (
                          <span 
                            key={`${pal.key}_type_${index}`} 
                            className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-950 text-blue-400 border border-slate-800/60"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Statistiques de Combat */}
                  <div className="mb-4 bg-slate-950/30 p-3 rounded-xl border border-slate-800/40 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-emerald-400">PV : <strong className="text-slate-200">{pal.hp}</strong></span>
                      <span className="text-red-400">ATK : <strong className="text-slate-200">{pal.attack}</strong></span>
                      <span className="text-blue-400">DEF : <strong className="text-slate-200">{pal.defense}</strong></span>
                    </div>
                  </div>

                  {/* Description */}
                  {pal.description && (
                    <p className="text-xs text-slate-400 italic line-clamp-2 mb-4 leading-relaxed">
                      "{pal.description}"
                    </p>
                  )}
                </div>

                {/* Aptitudes au Travail (Traduites) */}
                {pal.work_suitabilities && pal.work_suitabilities.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/50">
                    <h4 className="text-[10px] uppercase font-bold text-slate-550 mb-2 tracking-wider">Aptitudes de travail</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {pal.work_suitabilities.map((suitability, index) => {
                        const translation = getWorkTranslation(suitability.suitability);
                        return (
                          <span 
                            key={`${pal.key}_work_${index}`}
                            className={`px-2 py-1 rounded-lg text-[9px] font-semibold border flex items-center gap-1.5 ${translation.color}`}
                          >
                            <span>{translation.name}</span>
                            <span className="font-black bg-black/30 px-1 rounded">Lvl {suitability.level}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}