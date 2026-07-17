import React, { useState, useEffect } from 'react';

// Nom de la clé de sauvegarde locale
const STORAGE_KEY = 'palworld_custom_builds';

export default function PalBuildPlanner() {
  const [passives, setPassives] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour l'interface de recherche et sélection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPassives, setSelectedPassives] = useState([]); // Max 4 passifs sélectionnés pour le build en cours de création

  // États pour la création d'un build
  const [buildName, setBuildName] = useState('');
  const [buildDescription, setBuildDescription] = useState('');

  // Liste des builds enregistrés par l'utilisateur
  const [savedBuilds, setSavedBuilds] = useState([]);

  // 1. Charger les compétences passives depuis ton fichier JSON public
  useEffect(() => {
    const loadPassives = async () => {
      try {
        const response = await fetch('/passive_skills.json');
        if (!response.ok) {
          throw new Error("Impossible de charger le fichier des compétences passives.");
        }
        const data = await response.json();
        setPassives(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPassives();
  }, []);

  // 2. Charger les builds sauvegardés en local au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedBuilds(JSON.parse(saved));
      } catch (e) {
        console.error("Erreur de lecture du stockage local :", e);
      }
    }
  }, []);

  // 3. Ajouter / Retirer un passif de la sélection en cours (limite de 4)
  const handleTogglePassive = (key, passiveData) => {
    const isAlreadySelected = selectedPassives.some(p => p.key === key);

    if (isAlreadySelected) {
      setSelectedPassives(selectedPassives.filter(p => p.key !== key));
    } else {
      if (selectedPassives.length >= 4) {
        alert("Un Pal ne peut avoir que 4 compétences passives au maximum !");
        return;
      }
      setSelectedPassives([...selectedPassives, { key, ...passiveData }]);
    }
  };

  // 4. Enregistrer l'assortiment (Build) créé
  const handleSaveBuild = (e) => {
    e.preventDefault();
    if (!buildName.trim()) {
      alert("Veuillez donner un nom à votre assortiment.");
      return;
    }
    if (selectedPassives.length === 0) {
      alert("Veuillez sélectionner au moins une compétence passive.");
      return;
    }

    const newBuild = {
      id: Date.now().toString(),
      name: buildName,
      description: buildDescription,
      passives: selectedPassives, // Tableau de 1 à 4 passifs
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    const updatedBuilds = [newBuild, ...savedBuilds];
    setSavedBuilds(updatedBuilds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBuilds));

    // Réinitialiser le formulaire de création
    setBuildName('');
    setBuildDescription('');
    setSelectedPassives([]);
  };

  // 5. Supprimer un build sauvegardé
  const handleDeleteBuild = (id) => {
    if (confirm("Voulez-vous vraiment supprimer cet assortiment ?")) {
      const updatedBuilds = savedBuilds.filter(b => b.id !== id);
      setSavedBuilds(updatedBuilds);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBuilds));
    }
  };

  // Filtrer les passifs selon la recherche de l'utilisateur
  const filteredPassives = Object.entries(passives).filter(([key, value]) => {
    const search = searchQuery.toLowerCase();
    const name = (value.localized_name || '').toLowerCase();
    const desc = (value.description || '').toLowerCase();
    return name.includes(search) || desc.includes(search) || key.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Chargement des compétences passives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-red-950/40 border border-red-500/30 rounded-2xl text-white text-center">
        <p className="text-sm text-red-350 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* Titre */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">
          Planificateur de Builds & Assortiments
        </h2>
        <p className="text-slate-400 text-sm mt-1.5">
          Sélectionne jusqu'à 4 passifs pour créer la combinaison parfaite d'un Pal de combat, de travail ou de monture, et sauvegarde tes recettes localement !
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLONNE 1 & 2 : RECHERCHE ET LISTE DES PASSIFS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="text-teal-400">⚡</span> Liste des Compétences Passives
            </h3>

            {/* Barre de recherche */}
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Rechercher un passif (ex: Vif, Légende, Attaque, Monde...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-white placeholder-slate-500 transition-all"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Grille des passifs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {filteredPassives.length === 0 ? (
                <p className="text-slate-500 text-xs italic col-span-2 text-center py-8">Aucun passif ne correspond à cette recherche.</p>
              ) : (
                filteredPassives.map(([key, val]) => {
                  const isSelected = selectedPassives.some(p => p.key === key);
                  return (
                    <div
                      key={key}
                      onClick={() => handleTogglePassive(key, val)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none ${
                        isSelected 
                          ? 'bg-teal-950/40 border-teal-500 shadow-md shadow-teal-950/20' 
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-bold text-sm ${isSelected ? 'text-teal-400' : 'text-slate-200'}`}>
                          {val.localized_name || key}
                        </span>
                        {isSelected && (
                          <span className="bg-teal-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                            ACTIF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {val.description || <span className="text-slate-600 italic">Aucune description disponible</span>}
                      </p>
                      <span className="text-[9px] font-mono text-slate-600 block mt-2 uppercase tracking-wide">
                        ID: {key}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLONNE 3 : CRÉATEUR DE BUILD ET SAUVEGARDES */}
        <div className="space-y-6">
          
          {/* Créateur d'assortiment */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="text-indigo-400">🔨</span> Créer un Assortiment
            </h3>

            <form onSubmit={handleSaveBuild} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Nom du build / Cible</label>
                <input
                  type="text"
                  placeholder="ex: Monture Terrestre Ultime, Combattant Eau..."
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5">Notes ou astuces (Optionnel)</label>
                <textarea
                  placeholder="ex: Idéal pour Pyrin ou Direhowl afin de maximiser la vitesse de course."
                  value={buildDescription}
                  onChange={(e) => setBuildDescription(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Aperçu du build en cours */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  Passifs Associés ({selectedPassives.length}/4)
                </label>
                
                {selectedPassives.length === 0 ? (
                  <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-500 italic">
                    Cliquez sur des compétences passives à gauche pour les ajouter au build
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPassives.map((p) => (
                      <div key={p.key} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-2 rounded-lg text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-teal-400 truncate">{p.localized_name || p.key}</p>
                          <p className="text-[10px] text-slate-500 truncate">{p.description || "Aucune description"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePassive(p.key, p)}
                          className="text-red-400 hover:text-red-300 font-bold px-2 py-1 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={selectedPassives.length === 0 || !buildName.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl uppercase tracking-widest shadow-lg transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Enregistrer l'assortiment
              </button>
            </form>
          </div>

          {/* Liste des assortiments sauvegardés */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="text-purple-400">💾</span> Vos Recettes Sauvegardées ({savedBuilds.length})
            </h3>

            {savedBuilds.length === 0 ? (
              <p className="text-slate-500 text-xs italic py-4 text-center border border-dashed border-slate-800 rounded-xl">
                Aucun assortiment enregistré en local pour le moment.
              </p>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-850">
                {savedBuilds.map((build) => (
                  <div key={build.id} className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 p-4 rounded-xl relative group">
                    <button
                      onClick={() => handleDeleteBuild(build.id)}
                      className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors text-xs"
                      title="Supprimer ce build"
                    >
                      🗑️
                    </button>

                    <h4 className="text-sm font-black text-white pr-6">{build.name}</h4>
                    {build.description && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">{build.description}</p>
                    )}

                    {/* Tags des passifs du build */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {build.passives.map((p) => (
                        <span 
                          key={p.key} 
                          className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-[10px] font-bold text-teal-300"
                          title={p.description || ""}
                        >
                          {p.localized_name || p.key}
                        </span>
                      ))}
                    </div>

                    <span className="text-[9px] text-slate-600 font-mono block mt-3">
                      Créé le {build.createdAt}
                    </span>
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