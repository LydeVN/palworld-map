import React, { useState, useEffect } from 'react';

export default function PalworldTechnologies() {
  const [technologies, setTechnologies] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all", "normal", "boss"

  useEffect(() => {
    fetch('/technologies.json')
      .then((res) => res.json())
      .then((data) => {
        setTechnologies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des technologies :", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-[#0b0f19] flex items-center justify-center text-amber-500 font-mono text-base tracking-widest animate-pulse">
        CHARGEMENT DE LA BASE DE DONNÉES TECHNOLOGIQUES...
      </div>
    );
  }

  const techList = Object.entries(technologies).map(([key, value]) => ({
    id: key,
    ...value
  }));

  const filteredTechs = techList.filter((tech) => {
    const matchesSearch = tech.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tech.icon_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "normal") return matchesSearch && !tech.is_boss_technology;
    if (filterType === "boss") return matchesSearch && tech.is_boss_technology;
    return matchesSearch;
  });

  const groupedByLevel = filteredTechs.reduce((groups, tech) => {
    const level = tech.level_cap || 0;
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(tech);
    return groups;
  }, {});

  const sortedLevels = Object.keys(groupedByLevel).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="w-full min-h-screen bg-[#0b0f19] text-slate-100 font-sans p-8 overflow-x-hidden">
      
      {/* EN-TÊTE DE LA PAGE (AGRANDI) */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-slate-800/80 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-2xl">🧬</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-cyan-400 uppercase">Arbre des Technologies</h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-0.5">Database & Unlocks Blueprint</p>
          </div>
        </div>

        {/* RECHERCHE ET FILTRES (AGRANDIS) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Barre de Recherche */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher une technologie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-80 bg-slate-950/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-5 py-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
          </div>

          {/* Filtres de Type */}
          <div className="bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/60 flex gap-1.5">
            <button 
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${filterType === 'all' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
            >
              Tout
            </button>
            <button 
              onClick={() => setFilterType("normal")}
              className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${filterType === 'normal' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
            >
              Normal
            </button>
            <button 
              onClick={() => setFilterType("boss")}
              className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${filterType === 'boss' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
            >
              Antique (Boss)
            </button>
          </div>
        </div>
      </div>

      {/* LISTE DES TECHNOLOGIES */}
      <div className="max-w-7xl mx-auto space-y-8">
        {sortedLevels.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/20 rounded-2xl border border-slate-800/40 text-slate-500 italic text-base">
            Aucune technologie ne correspond à vos critères de recherche.
          </div>
        ) : (
          sortedLevels.map((level) => (
            <div key={level} className="bg-[#0f172a]/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-6 shadow-xl">
              
              {/* Badge de Niveau (Agrandit) */}
              <div className="flex items-center gap-4 mb-6 border-b border-slate-800/40 pb-3">
                <div className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800 text-sm font-mono font-bold text-cyan-400 shadow-md">
                  NIVEAU {level}
                </div>
                <div className="text-xs text-slate-500 font-mono tracking-widest uppercase">
                  {groupedByLevel[level].length} Schéma(s) disponible(s)
                </div>
              </div>

              {/* Grille des cartes technologiques (Agrandie) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedByLevel[level].map((tech) => {
                  const cleanedIconName = (tech.icon || tech.icon_name || "").trim().toLowerCase();
                  const iconUrl = `/img/${cleanedIconName}.webp`; 

                  return (
                    <div 
                      key={tech.id} 
                      className={`relative p-5 rounded-xl bg-slate-950/50 border flex gap-5 items-start shadow-inner transition-all hover:-translate-y-1 ${
                        tech.is_boss_technology 
                          ? 'border-rose-500/30 hover:border-rose-500/50 bg-gradient-to-br from-rose-950/15 to-transparent' 
                          : 'border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      {/* Conteneur de l'icône agrandi (w-18 h-18 soit 72px) */}
                      <div className={`w-18 h-18 rounded-xl border flex-shrink-0 flex items-center justify-center p-2 bg-[#0f172a] shadow-inner relative ${
                        tech.is_boss_technology ? 'border-rose-500/50' : 'border-slate-700/80'
                      }`}>
                        <img 
                          src={iconUrl} 
                          alt={tech.id} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 items-center justify-center text-2xl select-none">
                          {tech.is_boss_technology ? '🟣' : '⚙️'}
                        </div>
                      </div>

                      {/* Informations textuelles (Agrandies) */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-extrabold text-base text-slate-200 truncate" title={tech.id}>
                            {tech.id.replace(/_/g, ' ')}
                          </h3>
                          
                          {/* Coût en points */}
                          <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 ${
                            tech.is_boss_technology 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            <span>{tech.cost}</span>
                            <span className="text-[10px] opacity-70">{tech.is_boss_technology ? '▲' : '●'}</span>
                          </div>
                        </div>

                        {/* Recettes débloquées (Textes agrandis) */}
                        <div className="space-y-2 mt-3">
                          {tech.unlock_item_recipes && tech.unlock_item_recipes.length > 0 && (
                            <div className="text-xs text-slate-400 flex flex-wrap gap-1.5 items-center">
                              <span className="text-slate-500 text-xs font-medium">Débloque :</span>
                              {tech.unlock_item_recipes.map((recipe, idx) => (
                                <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded text-slate-200 font-mono text-xs border border-slate-800">
                                  {recipe}
                                </span>
                              ))}
                            </div>
                          )}

                          {tech.unlock_build_objects && tech.unlock_build_objects.length > 0 && (
                            <div className="text-xs text-slate-400 flex flex-wrap gap-1.5 items-center">
                              <span className="text-slate-500 text-xs font-medium">Structure :</span>
                              {tech.unlock_build_objects.map((build, idx) => (
                                <span key={idx} className="bg-slate-900 px-2 py-0.5 rounded text-cyan-300 font-mono text-xs border border-slate-800">
                                  {build}
                                </span>
                              ))}
                            </div>
                          )}

                          {tech.require_defeat_tower_boss && tech.require_defeat_tower_boss !== "EPalBossType::None" && (
                            <div className="text-xs text-rose-400 bg-rose-950/20 border border-rose-500/20 px-2 py-1 rounded mt-2 font-mono">
                              ⚠️ Requis : Vaincre {tech.require_defeat_tower_boss.split('::')[1]}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}