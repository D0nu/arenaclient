// App.js - Fix the routes
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "./Context/GameContext";
import { SocketProvider } from "./Context/SocketContext";
import { SolanaProvider } from "./Context/SolanaContext";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Profile from "./Pages/Profile";
import Navbar from "./Components/Navbar";
import GameRoom from "./Components/GameRoom"; // Updated path
import Signup from './Pages/Signup';
import GamePage from "./Pages/GamePage";
import GameStore from "./Pages/GameStore";
import CharacterCreator from "./Components/CharacterCreator";
import ViewGamesPage from "./Pages/ViewGames";
import { ArenaProvider } from "./Context/ArenaContext";
import SpectatorPage from "./Pages/Spectator";

function App() {
  return (
    <SolanaProvider>
      <SocketProvider>
        <GameProvider>
          <ArenaProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 text-white">
              <Navbar />
              <div className="container mx-auto px-4 py-6">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/profile" element={<Profile />} />

                  <Route path="/character-creator" element={<CharacterCreator />} />
                  <Route path="/store" element={<GameStore />} />

                  <Route path="/view-games" element={ <ViewGamesPage /> } />

                  <Route path="/spectate/:roomCode" element={<SpectatorPage />} />
                  
                  {/* Fixed Game Room Routes */}
                  <Route path="/room/:id" element={<GameRoom />} />
                  <Route path="/room/:id/game" element={<GamePage />} />
                  
                  {/* Redirect old routes */}
                  <Route path="/gameroom/:id" element={<Navigate to="/room/:id" replace />} />
                  <Route path="/gameroom/:id/game" element={<Navigate to="/room/:id/game" replace />} />
                </Routes>
              </div>
            </div>
          </Router>
          </ArenaProvider>
        </GameProvider>
      </SocketProvider>
    </SolanaProvider>
  );
}

export default App;