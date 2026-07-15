import React, { useState } from 'react';
import PalworldMap from './PalworldMap';
import PlayersDashboard from './PlayersDashboard';

export default function Home() {
  // Navigation simple par état : 'home', 'map', ou 'dashboard'
  const [currentPage, setCurrentPage] = useState('home');

  // Rendu conditionnel des pages
  if (currentPage === 'map') {
    return (
      <div className="relative w-screen h-screen">
        {/* Bouton retour discret */}
        <button 
          onClick={() => setCurrentPage('home')}
          className="absolute left-6 top-3.5 z-[1000] px-4 py-1.5 bg-[#0f172a]/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-mono text-xs font-bold rounded-lg border border-slate-800 transition-all cursor-pointer shadow-lg shadow-black/40"
        >
          ◀ ACCUEIL
        </button>
        <PalworldMap />
      </div>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <div className="relative min-h-screen bg-[#0b0f19]">
        {/* Bouton retour */}
        <button 
          onClick={() => setCurrentPage('home')}
          className="absolute left-6 top-6 z-[1000] px-4 py-2 bg-[#0f172a]/90 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-mono text-xs font-bold rounded-lg border border-slate-800 transition-all cursor-pointer shadow-lg shadow-black/40"
        >
          ◀ RETOUR ACCUEIL
        </button>
        <PlayersDashboard />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans overflow-x-hidden">
      
      {/* EFFETS DE LUMIÈRE D'AMBIANCE */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="h-16 px-8 bg-[#0f172a]/40 backdrop-blur-md border-b border-slate-800/50 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <span className="font-black text-slate-950 text-sm">PW</span>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-wider text-amber-500 uppercase">Palworld Community</h1>
            <p className="text-[10px] text-slate-400 font-mono">REPERTOIRE ET PARTAGE</p>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden sm:block">
          Portail communautaire v1.0.4
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-6xl mx-auto px-6 flex flex-col justify-center items-center py-12 relative z-10 w-full">
        
        {/* TITRE PRINCIPAL COMMU */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-400 font-mono font-bold tracking-widest uppercase">
            Espace Membres de Palpagos
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">
            Explorons notre monde <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300">Ensemble</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Retrouvez vos amis en direct sur l'archipel et découvrez les profils, statistiques et équipes de Pals de tous les aventuriers du serveur.
          </p>
        </div>

        {/* GRILLE DES DEUX GRANDS LIENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          
          {/* LIEN CARTE : REJOINDRE L'AVENTURE */}
          <div 
            onClick={() => setCurrentPage('map')}
            className="group relative bg-[#0f172a]/60 backdrop-blur-md border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-8 cursor-pointer transition-all duration-350 hover:-translate-y-1.5 shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between overflow-hidden"
          >
            {/* Dégradé léger en arrière plan au survol */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-350"></div>
            
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xl font-bold font-mono group-hover:scale-110 transition-transform">
                🗺️
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors uppercase">
                  Où sont les joueurs ?
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                  Consultez la carte interactive en direct pour localiser les autres joueurs connectés. Idéal pour s'organiser, se regrouper ou prêter main-forte sur un boss !
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 mt-8 flex justify-between items-center text-[10px] font-mono text-amber-500 relative z-10">
              <span>EXPLORER LA CARTE</span>
              <span className="group-hover:translate-x-1 transition-transform">REJOINDRE LA CARTE ▶</span>
            </div>
          </div>

          {/* LIEN REGISTRE : BASE DE DONNÉES JOUEURS */}
          <div 
            onClick={() => setCurrentPage('dashboard')}
            className="group relative bg-[#0f172a]/60 backdrop-blur-md border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-8 cursor-pointer transition-all duration-350 hover:-translate-y-1.5 shadow-xl hover:shadow-amber-500/5 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-350"></div>

            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xl font-bold font-mono group-hover:scale-110 transition-transform">
                🏆
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors uppercase">
                  Le Hall des Aventuriers
                </h3>
                <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
                  Découvrez l'annuaire complet de la guilde et du serveur. Inspectez les niveaux des joueurs, leurs captures phares et leurs compagnons de voyage favoris.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 mt-8 flex justify-between items-center text-[10px] font-mono text-amber-500 relative z-10">
              <span>COMMUNAUTÉ ACTIVE</span>
              <span className="group-hover:translate-x-1 transition-transform">VOIR LES AVENTURIERS ▶</span>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-slate-950/40 text-center text-[10px] font-mono text-slate-600 relative z-10">
        PALWORLD COMMUNITY HUB &copy; 2026 — CONÇU AVEC 💛 PAR ET POUR LA COMMUNAUTÉ
      </footer>
    </div>
  );
}