import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PalworldMap from './components/PalworldMap';
import PlayersPalsList from './components/PlayersPalsList';

function App() {
  return (
    <Router>
      <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-white">
        
        {/* 1. BARRE DE NAVIGATION (HEADER) */}
        <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <h1 className="font-extrabold text-lg tracking-wider text-blue-500">
            OPAL PALWORLD
          </h1>
          
          <nav className="flex gap-2">
            {/* NavLink applique automatiquement les styles en fonction de la route active */}
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Carte en direct
            </NavLink>
            
            <NavLink
              to="/pals"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Membres & Pals
            </NavLink>
          </nav>
        </header>

        {/* 2. ZONE DE CONTENU DYNAMIQUE PAR ROUTE */}
        <div className="flex-1 min-h-0">
          <Routes>
            {/* Redirection automatique de l'accueil "/" vers "/map" */}
            <Route path="/" element={<Navigate to="/map" replace />} />
            
            {/* Route de la Carte */}
            <Route 
              path="/map" 
              element={
                <div className="w-full h-full">
                  <PalworldMap />
                </div>
              } 
            />
            
            {/* Route de la liste des Pals */}
            <Route 
              path="/players" 
              element={
                <div className="w-full h-full overflow-y-auto bg-slate-950">
                  <PlayersPalsList />
                </div>
              } 
            />

            {/* Redirection des URL inconnues vers la carte */}
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;