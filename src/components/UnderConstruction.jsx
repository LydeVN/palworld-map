import React from 'react';

export default function UnderConstruction() {
  return (
    <div className="relative w-screen h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-center items-center font-sans overflow-hidden">
      
      {/* EFFET DE LUMIÈRE EN ARRIÈRE-PLAN */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none"></div>

      <div className="z-10 text-center px-6 max-w-md flex flex-col items-center">
        
        {/* LOGO PW / ICONE DE TRAVAUX */}
        <div className="relative mb-8">
          {/* Engrenage animé */}
          <div className="w-20 h-20 border-4 border-dashed border-amber-500 rounded-full flex items-center justify-center animate-spin-slow">
            <span className="text-3xl">🛠️</span>
          </div>
          {/* Petit voyant clignotant */}
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* TITRES */}
        <h1 className="text-3xl font-black tracking-wider text-white uppercase mb-2">
          Page en <span className="text-amber-500">construction</span>
        </h1>
        <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mb-6">
          Work in Progress
        </p>

        {/* DESCRIPTION SIMPLE */}
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          Nos développeurs et nos Pals travaillent dur pour finaliser cette section. Revenez très bientôt !
        </p>

        {/* BOUTON RETOUR */}
        <button 
          onClick={() => window.history.back() || (window.location.href = "/")}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>

      {/* CSS INJECTÉ POUR L'ANIMATION DE ROTATION DOUCE */}
      <style>{`
        @keyframes spinSlow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spinSlow 12s linear infinite;
        }
      `}</style>
    </div>
  );
}