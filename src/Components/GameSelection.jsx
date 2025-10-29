// components/GameSelection.jsx
import React from 'react';

const GAME_OPTIONS = [
  { 
    value: "basketball", 
    label: "Basketball", 
    icon: "🏀", 
    description: "Score baskets against the clock!",
    color: "from-orange-500 to-red-500",
    borderColor: "border-orange-400"
  },
  { 
    value: "memory", 
    label: "Memory Match", 
    icon: "🧠", 
    description: "Test your memory with card matching",
    color: "from-purple-500 to-indigo-500",
    borderColor: "border-purple-400",
    comingSoon: true
  },
{ 
    value: "survivor", 
    label: "battle arena", 
    icon: "⚔️", 
    description: "defeat your enemies",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-400",
},
    {
    value: "dart", 
    label: "Sharp shooter",
    icon: "🎯", 
    description: "Shoot fast moving targets",
    color: "from-green-500 to-emerald-500",
    borderColor: "border-green-400"
    },
{ 
    value: "conquest", 
    label: "Medieval Conquest", 
    icon: "🛡️", 
    description: "Battle across realms with sword and magic",
    color: "from-purple-600 to-indigo-600",
    borderColor: "border-purple-500",
    comingSoon: false
},
  { 
    value: "math", 
    label: "Math Blitz", 
    icon: "🔢", 
    description: "Solve math problems quickly",
    color: "from-pink-500 to-rose-500",
    borderColor: "border-pink-400",
    comingSoon: true
  }
];

const GameSelection = ({ winner, onGameSelect, user, mode = 'winner-game' }) => {
  // Only the winner can select the game
  const canSelect = winner?.id === user?.id;

  const handleGameSelect = (game) => {
    if (canSelect && !game.comingSoon) {
      onGameSelect(game.value);
    }
  };

  return (
    <div className="max-w-6xl mx-auto text-center">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          {mode === 'loser-game'
            ? "🎮 Choose Game for Opponent"
            : "🎮 Choose Your Game!"
          }
        </h2>
        <p className="text-purple-100 text-lg">
          {canSelect 
            ? mode === 'loser-game'
              ? `${winner.name}, choose a game for your opponent to play`
              : `${winner.name}, select a mini-game to play`
            : `${winner.name} is choosing a game...`
          }
        </p>
        {mode === 'loser-game' && canSelect && (
          <p className="text-yellow-200 text-sm mt-2">
            You'll be answering questions while they play this game
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAME_OPTIONS.map((game) => (
          <button
            key={game.value}
            onClick={() => handleGameSelect(game)}
            disabled={!canSelect || game.comingSoon}
            className={`p-6 rounded-2xl border-2 transition-all transform text-left ${
              canSelect && !game.comingSoon
                ? `bg-gradient-to-br ${game.color} hover:scale-105 cursor-pointer ${game.borderColor}`
                : 'bg-gray-800 border-gray-600 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{game.icon}</div>
              {game.comingSoon && (
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">
                  Coming Soon
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{game.label}</h3>
            <p className="text-gray-200 text-sm mb-4">{game.description}</p>
            
            {canSelect && !game.comingSoon && (
              <div className="text-green-200 text-sm font-semibold">
                Click to select ✓
              </div>
            )}
            
            {game.comingSoon && (
              <div className="text-yellow-300 text-sm">
                Available soon!
              </div>
            )}
          </button>
        ))}
      </div>

      {canSelect && (
        <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl">
          <p className="text-yellow-300">
            {mode === 'loser-game'
              ? "💡 Choose a challenging game for your opponent!"
              : "💡 Tip: Choose a game you're good at! You'll play this while your opponent answers questions."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default GameSelection;