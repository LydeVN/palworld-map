import React, { useState, useEffect } from 'react';

export default function Paldex() {
  const [pals, setPals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("Tous");

  useEffect(() => {
    const fetchPals = async () => {
      try {
        // Appel à l'API publique Palworld
        const response = await fetch("https://sky-pro-palworld-api.vercel.app/api/pals");
        if (!response.ok) throw new Error("Erreur lors de la récupération du Paldex");
        const data = await response.json();
        
        // L'API renvoie généralement un tableau de Pals directement ou dans un objet
        setPals(Array.isArray(data) ? data : data.content || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPals();
  }, []);

  // Extraction unique de tous les types/éléments existants pour le filtre
  const allTypes = ["Tous", ...new Set(pals.flatMap(pal => pal.types || []))];

  // Filtrage des Pals
  const filteredPals = pals.filter(pal => {
    const matchesSearch = pal.name.toLowerCase().includes(search.toLowerCase()) || 
                          (pal.key && pal.key.toLowerCase().includes(search.toLowerCase()));
    const matchesType = selectedType === "Tous" || (pal.types && pal.types.includes(selectedType));
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-medium">Chargement du Paldex officiel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>Impossible de charger le Paldex : {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      
      {/* En-tête et contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Paldex Officiel
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Découvrez les caractéristiques et types de chaque Pal du jeu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher un Pal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Filtre par Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grille des Pals */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredPals.map((pal) => (
          <div 
            key={pal.id || pal.key} 
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col items-center hover:border-slate-700 transition duration-300"
          >
            {/* Image du Pal */}
            <div className="w-24 h-24 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden mb-4 border border-slate-800">
              <img 
                src={pal.imageWiki || pal.image || `https://img.game8.co/3820291/image.png`} 
                alt={pal.name}
                className="w-20 h-20 object-contain hover:scale-110 transition duration-300"
                onError={(e) => { e.target.src = "https://img.game8.co/3820291/image.png"; }} // Image de secours
              />
            </div>

            {/* Id & Nom */}
            <span className="text-xs font-mono text-slate-500 font-bold">N°{pal.id || pal.key}</span>
            <h3 className="text-lg font-bold text-slate-200 mt-1">{pal.name}</h3>

            {/* Éléments / Types */}
            <div className="flex gap-1.5 mt-3">
              {pal.types && pal.types.map((type) => (
                <span 
                  key={type} 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-blue-300 border border-slate-700"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}