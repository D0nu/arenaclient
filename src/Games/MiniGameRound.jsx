import React from 'react';
import BasketballGame from './miniGames/BaketBall';
import DartGame from './miniGames/Dart';
import SurvivorArena from './miniGames/SurvivorArena';
import Conquest from './miniGames/Conquest';
// Import other games as you create them:
// import MemoryGame from './games/MemoryGame';
// import TriviaGame from './games/TriviaGame';
// import PuzzleGame from './games/PuzzleGame';

const MiniGameRound = ({ gameType, timeLeft, roundStarted, onScoreSubmit , userScore }) => {
  // Define available mini-games
  const gameComponents = {
    'basketball': BasketballGame,
    'dart': DartGame,
    'survivor': SurvivorArena,
    // Add more games as you create them:
     'conquest' : Conquest,
    // 'trivia': TriviaGame,
    // 'puzzle': PuzzleGame,
  };

  // Get the appropriate game component
  const GameComponent = gameComponents[gameType];

  if (!GameComponent) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/20 border border-red-500 rounded-2xl p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Game Not Available</h2>
          <p className="text-gray-300">
            The selected game "{gameType}" is not available yet.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Please try another game or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mini-game-round">
      <GameComponent 
        timeLeft={timeLeft}
        userScore={userScore}
        roundStarted={roundStarted}
        onScoreSubmit={onScoreSubmit}
      />
    </div>
  );
};

export default MiniGameRound;