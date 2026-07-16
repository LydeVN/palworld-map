import React, { useState, useEffect } from 'react';
import { API_CONFIG } from '../config';

export default function Home() {
  const [serverStats, setServerStats] = useState({ online: false, playersCount: 0 });

  // Simuler ou récupérer l'état de connexion via ton API
  useEffect(() => {
    const checkServer = async () => {
      try {
        // Optionnel : remplace par un vrai fetch sur ton API
        // const res = await fetch(`${API_CONFIG.BASE_URL}/api/status`);
        // const data = await res.json();
        // setServerStats({ online: true, playersCount: data.online_players });
        
        setServerStats({ online: true, playersCount: 3 }); // Valeurs simulées temporaires
      } catch (err) {
        setServerStats({ online: false, playersCount: 0 });
      }
    };
    checkServer();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* EFFETS DE LUMIÈRE EN ARRIÈRE-PLAN (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none"></div>

      {/* HEADER / NAVIGATION */}
      <header className="w-full h-20 px-6 md:px-12 bg-[#0f172a]/40 backdrop-blur-md border-b border-slate-800/60 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-black text-slate-950 text-base">PW</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase">Palworld</h1>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest font-semibold uppercase">Community Platform</p>
          </div>
        </div>

        {/* Statut du Serveur en Direct */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800/80 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${serverStats.online ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${serverStats.online ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-xs font-mono text-slate-300">
            {serverStats.online ? `SERVEUR EN LIGNE (${serverStats.playersCount} JOUEURS)` : 'SERVEUR HORS-LIGNE'}
          </span>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center max-w-5xl mx-auto z-10">
        
        {/* Badge Nouveauté */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full mb-6 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Mise à jour v0.3.1 Active</span>
        </div>

        {/* Titre Principal */}
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase leading-none mb-6">
          Suivez vos aventures <br />
          sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600">Palpagos</span> en temps réel
        </h2>

        {/* Description courte */}
        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Visualisez la position en direct de vos alliés (et de vos rivaux), analysez leurs statistiques et explorez la carte interactive mise à jour instantanément.
        </p>

        {/* Bouton d'action principal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 w-full">
          <button 
            onClick={() => window.location.href = "/map"} // Modifie la route selon ton système (ex: React Router, href, etc.)
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-amber-500/20 hover:shadow-amber-500/45 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            🗺️ Ouvrir la carte Live
          </button>
          
          <button 
            onClick={() => window.location.href = "/construction"} 
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          >
            Statistiques globales
          </button>
        </div>

        {/* GRID DE FONCTIONNALITÉS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          
          {/* Carte 1 */}
          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-amber-500/30 transition-all group backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              📡
            </div>
            <h3 className="text-md font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Radar WebSocket</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vos coordonnées s'actualisent sans latence sur la carte grâce à une connexion socket persistante et optimisée.
            </p>
          </div>

          {/* Carte 2 */}
          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-amber-500/30 transition-all group backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              👤
            </div>
            <h3 className="text-md font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Profils Steam Directs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Récupération et mise en cache automatiques des avatars officiels des joueurs pour une immersion visuelle totale.
            </p>
          </div>

          {/* Carte 3 */}
          <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-amber-500/30 transition-all group backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              ⚔️
            </div>
            <h3 className="text-md font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Suivi des Niveaux</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consultez le niveau, le ping et la localisation précise de chaque survivant actuellement connecté sur le serveur.
            </p>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full py-6 text-center border-t border-slate-900 bg-slate-950/40 mt-auto">
        <p className="text-[11px] text-slate-500 font-mono">
          PROJET NON-OFFICIEL ASSOCIE À PALWORLD — DÉVELOPPÉ AVEC ❤️ POUR LA COMMUNAUTÉ
        </p>
      </footer>
    </div>
  );
}