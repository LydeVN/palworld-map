import React, { useState, useEffect } from 'react';

// Clé de sauvegarde locale
const STORAGE_KEY = 'palworld_curated_builds';

// Fonction utilitaire de catégorisation adaptée à tes noms en français
const determineCategory = (name, desc) => {
  const lowerName = String(name || '').toLowerCase();
  const lowerDesc = String(desc || '').toLowerCase();

  if (
    lowerName.match(/(vif|coursier|sprinteur|infatigable|nage|vagues)/) ||
    lowerDesc.includes('vitesse de déplacement') ||
    lowerDesc.includes('endurance')
  ) {
    return 'vitesse';
  }
  
  if (
    lowerName.match(/(sérieux|appliqué|maîtrise exceptionnelle|soumis|nocturne)/) ||
    lowerDesc.includes('vitesse de travail')
  ) {
    return 'travail';
  }
  
  if (
    lowerName.match(/(chef d'assaut|stratège de forteresse|motivateur)/) ||
    lowerDesc.includes('joueur') ||
    lowerDesc.includes("vitesse de travail du joueur")
  ) {
    return 'joueur';
  }
  
  if (lowerName.includes('arbre-monde') || lowerDesc.includes('arbre-monde')) {
    return 'arbre_monde';
  }
  
  // Par défaut : Combat (Attaque, Défense, Tiers élémentaires, etc.)
  return 'combat';
};

export default function PalBuildPlanner() {
  const [passives, setPassives] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Création d'un assortiment
  const [selectedPassives, setSelectedPassives] = useState([]); // Max 4
  const [buildName, setBuildName] = useState('');
  const [buildDescription, setBuildDescription] = useState('');

  // Builds sauvegardés
  const [savedBuilds, setSavedBuilds] = useState([]);

  // 1. Chargement & Nettoyage robuste du fichier JSON
  useEffect(() => {
    const loadAndCleanPassives = async () => {
      try {
        const response = await fetch('/passive_skills.json');
        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status} (Impossible de charger le fichier passive_skills.json)`);
        }
        const rawData = await response.json();

        const cleaned = {};
        Object.entries(rawData).forEach(([key, val]) => {
          if (!val) return;

          const name = key; 
          
          const isInvalid = 
            !name || 
            name.trim() === '' || 
            name === 'fr_Text' ||
            name.startsWith('BossDefeatReward_');

          if (!isInvalid) {
            let fallbackDescription = "Compétence passive (Bonus de statistiques)";
            if (val.description && typeof val.description === 'string' && val.description.trim() !== "") {
              fallbackDescription = val.description;
            }
            
            cleaned[key] = {
              localized_name: name,
              tier: val.tier || 'Normal',
              description: fallbackDescription,
              category: determineCategory(name, fallbackDescription)
            };
          }
        });

        setPassives(cleaned);
      } catch (err) {
        console.error("Erreur durant le chargement du JSON :", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAndCleanPassives();
  }, []);

  // 2. Récupération des builds sauvegardés au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedBuilds(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de lecture du localStorage", e);
      }
    }
  }, []);

  // 3. Ajouter / Retirer un passif de la sélection (Max 4)
  const handleTogglePassive = (key, passiveData) => {
    const exists = selectedPassives.some(p => p.key === key);
    if (exists) {
      setSelectedPassives(selectedPassives.filter(p => p.key !== key));
    } else {
      if (selectedPassives.length >= 4) {
        alert("Un Pal ne peut posséder que 4 compétences passives au maximum !");
        return;
      }
      setSelectedPassives([...selectedPassives, { key, ...passiveData }]);
    }
  };

  // 4. Enregistrer l'assortiment dans le localStorage
  const handleSaveBuild = (e) => {
    e.preventDefault();
    if (!buildName.trim()) return;
    if (selectedPassives.length === 0) {
      alert("Ajoute au moins une compétence à ton assortiment.");
      return;
    }

    const newBuild = {
      id: Date.now().toString(),
      name: buildName,
      description: buildDescription,
      passives: selectedPassives,
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    const updated = [newBuild, ...savedBuilds];
    setSavedBuilds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Reset du formulaire
    setBuildName('');
    setBuildDescription('');
    setSelectedPassives([]);
  };

  // 5. Supprimer un assortiment
  const handleDeleteBuild = (id) => {
    if (confirm("Supprimer cet assortiment sauvegardé ?")) {
      const updated = savedBuilds.filter(b => b.id !== id);
      setSavedBuilds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Filtrer les compétences selon l'input et la catégorie sélectionnée
  const filteredPassives = Object.entries(passives).filter(([key, value]) => {
    const matchesCategory = selectedCategory === 'all' || value.category === selectedCategory;
    
    const search = searchQuery.toLowerCase();
    const matchesSearch = 
      (value.localized_name || '').toLowerCase().includes(search) || 
      (value.description || '').toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  // Détermine la classe CSS pour chaque compétence selon son tier / type
  const getPassiveStyles = (name, tier, desc, isSelected) => {
    if (isSelected) {
      return 'bg-emerald-950/30 border-emerald-500/70 shadow-lg shadow-emerald-500/5';
    }

    const lowerName = name.toLowerCase();
    const lowerDesc = desc.toLowerCase();

    // 1. Négatif / Malus (Rouge)
    const isNegative = 
      lowerName.match(/(brute|destructeur|lâche|gringalet|glouton|impulsif|somnolent)/) || 
      lowerDesc.includes('-') || 
      lowerDesc.includes('diminuent de');
    if (isNegative) {
      return 'bg-slate-950/50 border-red-900/40 hover:border-red-500 hover:bg-red-950/20 hover:shadow-lg hover:shadow-red-500/10';
    }

    // 2. Légendaire (Sapphire clair)
    if (tier === 'Légendaire' || lowerName === 'légende') {
      return 'bg-slate-950/50 border-sky-900/40 hover:border-sky-400 hover:bg-sky-950/20 hover:shadow-lg hover:shadow-sky-500/15';
    }

    // 3. Tier 3 (Jaune)
    const isTier3 = 
      lowerName.match(/(maîtrise exceptionnelle|divinité|monarque|esprit|fureur|chef d'assaut|stratège de forteresse)/) || 
      lowerDesc.includes('+20 %') || 
      lowerDesc.includes('+30 %');
    if (isTier3) {
      return 'bg-slate-950/50 border-amber-900/40 hover:border-amber-500 hover:bg-amber-950/20 hover:shadow-lg hover:shadow-amber-500/10';
    }

    // 4. Tier 1 / Normal par défaut (Blanc / Argent)
    return 'bg-slate-950/50 border-slate-850 hover:border-slate-400 hover:bg-slate-900/60 hover:shadow-lg hover:shadow-white/5';
  };

  const getTextColorClass = (name, tier, desc, isSelected) => {
    if (isSelected) return 'text-emerald-400';

    const lowerName = name.toLowerCase();
    const lowerDesc = desc.toLowerCase();

    const isNegative = 
      lowerName.match(/(brute|destructeur|lâche|gringalet|glouton|impulsif|somnolent)/) || 
      lowerDesc.includes('-') || 
      lowerDesc.includes('diminuent de');
    if (isNegative) return 'text-red-400';

    if (tier === 'Légendaire' || lowerName === 'légende') return 'text-sky-400';

    const isTier3 = 
      lowerName.match(/(maîtrise exceptionnelle|divinité|monarque|esprit|fureur|chef d'assaut|stratège de forteresse)/) || 
      lowerDesc.includes('+20 %') || 
      lowerDesc.includes('+30 %');
    if (isTier3) return 'text-amber-400';

    return 'text-slate-200';
  };

  const getBadgeElement = (name, tier, desc, isSelected) => {
    if (isSelected) {
      return (
        <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          Sélectionné
        </span>
      );
    }

    const lowerName = name.toLowerCase();
    const lowerDesc = desc.toLowerCase();

    const isNegative = 
      lowerName.match(/(brute|destructeur|lâche|gringalet|glouton|impulsif|somnolent)/) || 
      lowerDesc.includes('-') || 
      lowerDesc.includes('diminuent de');
    if (isNegative) {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          Malus
        </span>
      );
    }

    if (tier === 'Légendaire' || lowerName === 'légende') {
      return (
        <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          ✦ Légendaire
        </span>
      );
    }

    const isTier3 = 
      lowerName.match(/(maîtrise exceptionnelle|divinité|monarque|esprit|fureur|chef d'assaut|stratège de forteresse)/) || 
      lowerDesc.includes('+20 %') || 
      lowerDesc.includes('+30 %');
    if (isTier3) {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
          ★ Tier 3
        </span>
      );
    }

    return (
      <span className="bg-slate-800/30 text-slate-400 border border-slate-700/50 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
        Tier 1
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4"></div>
        <p>Chargement et nettoyage des données passives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-400 text-center">
        <p className="font-bold text-lg">Erreur de chargement des gènes</p>
        <p className="text-sm text-slate-500 mt-2">{error}</p>
        <p className="text-xs text-slate-600 mt-4 italic">
          Vérifie que le fichier `passive_skills.json` est bien placé dans le dossier <strong>public/</strong> de ton application web.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 bg-clip-text text-transparent">
          Laboratoire d'Assortiment des Gènes
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Associe les meilleurs gènes épurés du jeu, prépare tes builds parfaits et sauvegarde-les localement sur ton navigateur.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLONNE 1 & 2 : LISTE DES PASSIFS NETTOYÉE & FILTRÉE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            
            {/* Barre de recherche et Catégories */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Rechercher (ex: Légende, Vitesse, Travail...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-white placeholder-slate-600 transition-all"
              />
              
              <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'combat', label: '⚔️ Combat' },
                  { id: 'vitesse', label: '🚀 Vitesse' },
                  { id: 'travail', label: '🔨 Base' },
                  { id: 'joueur', label: '👤 Joueur' },
                  { id: 'arbre_monde', label: '🌳 Arbre' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id 
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille des passifs épurés */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredPassives.length === 0 ? (
                <p className="text-slate-500 text-xs italic col-span-2 text-center py-12">Aucune compétence ne correspond à ces critères.</p>
              ) : (
                filteredPassives.map(([key, val]) => {
                  const isSelected = selectedPassives.some(p => p.key === key);
                  const passiveStyles = getPassiveStyles(val.localized_name, val.tier, val.description, isSelected);
                  const textColorClass = getTextColorClass(val.localized_name, val.tier, val.description, isSelected);

                  return (
                    <div
                      key={key}
                      onClick={() => handleTogglePassive(key, val)}
                      className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 select-none ${passiveStyles}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-extrabold text-sm ${textColorClass}`}>
                          {val.localized_name}
                        </span>
                        {getBadgeElement(val.localized_name, val.tier, val.description, isSelected)}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        {val.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLONNE 3 : PLANIFICATEUR ET SAUVEGARDES LOCALES */}
        <div className="space-y-6">
          
          {/* Formulaire de création */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black mb-4 flex items-center gap-2 text-indigo-400">
              <span>🧬</span> Composer le code génétique
            </h3>

            <form onSubmit={handleSaveBuild} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nom de l'assortiment</label>
                <input
                  type="text"
                  placeholder="ex: Anubis Travailleur Parfait, Jetragon Ultime..."
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Notes de reproduction (Optionnel)</label>
                <textarea
                  placeholder="ex: Transmettre en priorité via Grizzbolt et Orserk."
                  value={buildDescription}
                  onChange={(e) => setBuildDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Gènes associés */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  Gènes Sélectionnés ({selectedPassives.length}/4)
                </label>
                
                {selectedPassives.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-xs text-slate-600 italic">
                    Clique sur les compétences à gauche pour composer ton assortiment
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPassives.map((p) => {
                      const textColorClass = getTextColorClass(p.localized_name, p.tier, p.description, false);
                      return (
                        <div key={p.key} className="flex justify-between items-center bg-slate-950/80 border border-slate-850 p-2.5 rounded-lg text-xs">
                          <div className="min-w-0 pr-2">
                            <p className={`font-bold truncate ${textColorClass}`}>{p.localized_name}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePassive(p.key, p)}
                            className="text-slate-500 hover:text-red-400 font-bold p-1 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={selectedPassives.length === 0 || !buildName.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl uppercase tracking-widest shadow-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Sauvegarder l'assortiment
              </button>
            </form>
          </div>

          {/* Liste des builds sauvegardés */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-black mb-4 flex items-center gap-2 text-purple-400">
              <span>💾</span> Tes assortiments sauvegardés ({savedBuilds.length})
            </h3>

            {savedBuilds.length === 0 ? (
              <p className="text-slate-600 text-xs italic py-6 text-center border border-dashed border-slate-800 rounded-xl">
                Aucune recette de gènes enregistrée en local.
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {savedBuilds.map((build) => (
                  <div key={build.id} className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl relative group">
                    <button
                      onClick={() => handleDeleteBuild(build.id)}
                      className="absolute top-3.5 right-3.5 text-slate-500 hover:text-red-400 transition-colors text-xs"
                      title="Supprimer la recette"
                    >
                      🗑️
                    </button>

                    <h4 className="text-xs font-black text-white pr-6">{build.name}</h4>
                    {build.description && (
                      <p className="text-[10px] text-slate-500 mt-1 italic">{build.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1">
                      {build.passives.map((p) => {
                        const isLegendary = p.tier === 'Légendaire' || p.localized_name.toLowerCase() === 'légende';
                        const isNegative = p.description.includes('-') || p.description.includes('diminuent de');
                        const isTier3 = p.localized_name.toLowerCase().match(/(maîtrise exceptionnelle|divinité|monarque|esprit|fureur)/) || p.description.includes('+20 %') || p.description.includes('+30 %');

                        let badgeColorClass = "bg-slate-900 border-slate-800 text-slate-200";
                        if (isLegendary) {
                          badgeColorClass = "bg-sky-950/50 border-sky-900/40 text-sky-400";
                        } else if (isNegative) {
                          badgeColorClass = "bg-red-950/50 border-red-900/40 text-red-400";
                        } else if (isTier3) {
                          badgeColorClass = "bg-amber-950/50 border-amber-900/40 text-amber-400";
                        }

                        return (
                          <span 
                            key={p.key} 
                            className={`px-2 py-0.5 border rounded text-[9px] font-bold ${badgeColorClass}`}
                            title={p.description || ""}
                          >
                            {p.localized_name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}