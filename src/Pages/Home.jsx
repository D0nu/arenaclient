import React, { useState } from "react";
import Lobby from "../Components/Lobby";
import GameRoom from "../Components/GameRoom";

export default function Home() {
  const [currentView, setCurrentView] = useState("lobby");
  const [gameSession, setGameSession] = useState(null);

  const handleJoinGame = (session) => {
    setGameSession(session);
    setCurrentView("game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {currentView === "lobby" && (
        <Lobby
          onJoinGame={handleJoinGame}
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === "game" && gameSession && (
        <GameRoom
          session={gameSession}
          onLeave={() => setCurrentView("lobby")}
        />
      )}
    </div>
  );
}