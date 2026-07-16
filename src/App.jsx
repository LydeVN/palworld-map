import React, { useState } from 'react';
import PalworldMap from './components/PalworldMap';
import PlayersPalsList from './components/PlayersPalsList';

function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map' ou 'pals'

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-white">
      {/* Barre de navigation discrète en haut */}
      <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <h1 className="font-extrabold text-lg tracking-wider text-blue-500">
          OPAL PALWORLD
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'map' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Carte en direct
          </button>
          <button
            onClick={() => setActiveTab('pals')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'pals' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Membres & Pals
          </button>
        </div>
      </header>

      {/* Zone de contenu dynamique */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'map' ? (
          // Conteneur plein écran pour que la carte garde son comportement actuel
          <div className="w-full h-full">
            <PalworldMap />
          </div>
        ) : (
          // Liste des joueurs avec scroll si nécessaire
          <div className="w-full h-full overflow-y-auto bg-slate-950">
            <PlayersPalsList />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;