import React, { useState, useEffect } from 'react';

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
    // Premier chargement immédiat
    fetchData();

    // Actualisation automatique toutes les 60 secondes (alignée sur le script Python)
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les joueurs selon la recherche
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400">Chargement de la base de données des Pals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-8 p-4 bg-red-900/50 border border-red-500 rounded-lg text-white text-center">
        <h3 className="font-bold text-lg mb-2">Une erreur est survenue</h3>
        <p className="text-sm text-red-200">{error}</p>
        <button 
          onClick={fetchData} 
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-semibold text-xs transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white">
      {/* En-tête et Barre de recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            Registre des Aventuriers
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Mise à jour automatique • {players.length} inscrits
          </p>
        </div>
        
        <input
          type="text"
          placeholder="Rechercher un joueur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-80 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition"
        />
      </div>

      {/* Grille des joueurs */}
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-800">
          <p className="text-slate-400">Aucun joueur ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <div 
              key={player.uid} 
              className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg hover:border-slate-700 transition"
            >
              {/* Infos Joueur */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 truncate max-w-[180px]" title={player.name}>
                    {player.name}
                  </h3>
                  <span className="text-xs text-slate-500 select-all">{player.uid.substring(0, 15)}...</span>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-full">
                  Niv. {player.level}
                </span>
              </div>

              {/* Liste des Pals (Les 5 actifs) */}
              <div className="mt-auto pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Équipe Active ({player.pals?.length || 0}/5)
                </h4>
                
                {(!player.pals || player.pals.length === 0) ? (
                  <p className="text-xs text-slate-600 italic">Aucun Pal équipé.</p>
                ) : (
                  <div className="space-y-2">
                    {player.pals.map((pal, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center bg-slate-950/60 hover:bg-slate-950 px-3 py-2 rounded-lg border border-slate-800/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">#{pal.slot + 1}</span>
                          <span className="text-sm font-medium text-slate-200 truncate max-w-[150px]">
                            {pal.name}
                          </span>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">
                          Lvl {pal.level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}