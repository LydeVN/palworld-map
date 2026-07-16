import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PalworldMap from './components/PalworldMap';
import PlayersPalsList from './components/PlayersPalsList';
import Paldex from './components/Paldex'; // <--- Importation du nouveau composant
import UnderConstruction from './components/UnderConstruction'; // <--- Importation du nouveau composant
import Home from './components/Home'; // <--- Importation du composant Home

function App() {
  return (
    <Router>
      <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-white">
        
        {/* BARRE DE NAVIGATION */}
        <header className="flex justify-between items-center px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
          <h1 className="font-extrabold text-lg tracking-wider text-blue-500">
            OPAL PALWORLD
          </h1>
          
          <nav className="flex gap-2">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Carte en direct
            </NavLink>
            
            <NavLink
              to="/players"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Membres & Pals
            </NavLink>

            {/* Nouveau bouton Paldex */}
            <NavLink
              to="/paldex"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              Paldex
            </NavLink>
          </nav>
        </header>

        {/* CONTENU DYNAMIQUE */}
        <div className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            <Route path="/home" element={<div className="w-full h-full"><Home /></div>} />
            <Route path="/map" element={<div className="w-full h-full"><PalworldMap /></div>} />
            <Route path="/players" element={<div className="w-full h-full overflow-y-auto bg-slate-950"><PlayersPalsList /></div>} />
            
            {/* Nouvelle route Paldex */}
            {/* <Route path="/paldex" element={<div className="w-full h-full overflow-y-auto bg-slate-950"><Paldex /></div>} /> */}

            <Route path="*" element={<UnderConstruction />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;