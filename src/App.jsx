import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import PalworldMap from './components/PalworldMap';
import PlayersDashboard from './components/PlayersDashboard';

function App() {
  return (
    <Router>
      <div className="w-screen h-screen overflow-hidden bg-[#0b0f19]">
        <Routes>
          {/* Page d'accueil avec les deux grands boutons futuristes */}
          <Route path="/" element={<Home />} />
          
          {/* Page de la carte interactive (Radar) */}
          <Route path="/map" element={<PalworldMap />} />
          
          {/* Page du registre des joueurs (Dashboard) */}
          <Route path="/players" element={<PlayersDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;