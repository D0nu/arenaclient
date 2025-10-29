// ActiveGamesList.js
import React from 'react';

const ActiveGamesList = ({ activeGames, onWatchGame, selectedGame }) => {
  if (activeGames.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500 text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Active Games</h3>
        <p className="text-gray-300">
          There are no games running right now. <br />
          Be the first to create a game!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
        <h2 className="text-2xl font-bold text-white mb-4">Live Games</h2>
        <p className="text-gray-300 mb-4">
          Watch ongoing games and interact with viewers!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeGames.map((game) => (
          <GameCard
            key={game.roomCode}
            game={game}
            isSelected={selectedGame?.roomCode === game.roomCode}
            onWatch={onWatchGame}
          />
        ))}
      </div>
    </div>
  );
};

const GameCard = ({ game, isSelected, onWatch }) => {
  const getGameModeDisplay = (mode) => {
    const modes = {
      'question-vs-game': 'Q&A vs Game',
      'question-vs-question': 'Q&A Battle',
      'game-vs-game': 'Game Battle'
    };
    return modes[mode] || mode;
  };

  const getWagerDisplay = (wager) => {
    if (!wager || wager === 0) return 'Free Play';
    return `${wager} 🪙 Wager`;
  };

  return (
    <div 
      className={`bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border-2 transition-all cursor-pointer hover:scale-105 ${
        isSelected 
          ? 'border-green-500 bg-green-500/10' 
          : 'border-purple-500 hover:border-purple-400'
      }`}
      onClick={() => onWatch(game)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-bold text-lg">Room {game.roomCode}</h3>
          <p className="text-gray-300 text-sm">{getGameModeDisplay(game.mode)}</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-bold text-sm">
            {getWagerDisplay(game.wager)}
          </div>
          <div className="text-green-400 text-xs">
            {game.playerCount}/{game.maxPlayers} Players
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="mb-3">
        <div className="text-gray-400 text-sm mb-2">Players:</div>
        <div className="flex flex-wrap gap-2">
          {game.players.slice(0, 4).map((player, index) => (
            <div key={player.id} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-white text-xs">
                {player.name}
              </span>
            </div>
          ))}
          {game.players.length > 4 && (
            <span className="text-gray-400 text-xs">
              +{game.players.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            game.status === 'playing' ? 'bg-red-500 animate-pulse' : 
            game.status === 'waiting' ? 'bg-yellow-500' : 'bg-green-500'
          }`}></div>
          <span className="text-white text-sm capitalize">
            {game.status === 'playing' ? 'Live' : game.status}
          </span>
        </div>
        
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isSelected
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isSelected ? '👁️ Watching' : '👁️ Watch'}
        </button>
      </div>
    </div>
  );
};

export default ActiveGamesList;