import React from 'react';

const LeaderboardScreen = ({ players, playerScores, currentUserId, wagerInfo }) => {
  // Sort players by score in descending order
  const rankedPlayers = players
    .map(player => ({
      ...player,
      score: playerScores[player.id] || 0,
      isCurrentUser: (player.id || player._id)?.toString() === currentUserId?.toString()
    }))
    .sort((a, b) => b.score - a.score);

  // Determine positions (handling ties)
  let currentPosition = 1;
  let currentScore = rankedPlayers[0]?.score;
  let skipPositions = 0;

  rankedPlayers.forEach((player, index) => {
    if (player.score === currentScore) {
      player.position = currentPosition;
      skipPositions++;
    } else {
      currentPosition += skipPositions;
      skipPositions = 1;
      player.position = currentPosition;
      currentScore = player.score;
    }
  });

  // Helper to get position suffix
  const getPositionSuffix = (position) => {
    if (position > 3 && position < 21) return 'th';
    switch (position % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper to get position styles and emoji
  const getPositionInfo = (position) => {
    switch (position) {
      case 1:
        return {
          badge: '🥇',
          gradient: 'from-yellow-500 to-amber-500',
          border: 'border-yellow-400',
          shine: 'animate-shine-gold'
        };
      case 2:
        return {
          badge: '🥈',
          gradient: 'from-gray-300 to-gray-400',
          border: 'border-gray-300',
          shine: 'animate-shine-silver'
        };
      case 3:
        return {
          badge: '🥉',
          gradient: 'from-amber-600 to-amber-700',
          border: 'border-amber-600',
          shine: 'animate-shine-bronze'
        };
      default:
        return {
          badge: position + getPositionSuffix(position),
          gradient: 'from-gray-700 to-gray-800',
          border: 'border-gray-600',
          shine: ''
        };
    }
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white text-center mb-6">Final Rankings</h2>

      <div className="space-y-3">
        {rankedPlayers.map((player) => {
          const posInfo = getPositionInfo(player.position);
          const isWinner = player.position === 1;
          
          // Get wager outcome for this player
          const playerWager = wagerInfo?.[player.id];
          const showWager = playerWager && typeof playerWager.amount !== 'undefined';
          
          return (
            <div
              key={player.id}
              className={`
                relative overflow-hidden
                ${player.isCurrentUser ? 'transform scale-105 z-10' : ''}
                bg-gradient-to-r ${posInfo.gradient}
                rounded-xl p-4 border-2 ${posInfo.border}
                ${posInfo.shine}
                transition-all duration-300
              `}
            >
              <div className="flex items-center gap-4">
                {/* Position Badge */}
                <div className="text-2xl font-bold min-w-[2.5rem] text-center">
                  {posInfo.badge}
                </div>

                {/* Player Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {player.name}
                      {player.isCurrentUser && (
                        <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-white/80">
                    Score: {player.score} points
                  </div>
                </div>

                {/* Wager Outcome */}
                {showWager && (
                  <div className={`
                    text-right font-bold whitespace-nowrap
                    ${playerWager.type === 'win' ? 'text-green-400' : 'text-red-400'}
                  `}>
                    {playerWager.type === 'win' ? (
                      <>+{playerWager.amount} 💰</>
                    ) : (
                      <>-{playerWager.amount} 💸</>
                    )}
                    {playerWager.message && (
                      <div className="text-xs text-white/60 mt-1">
                        {playerWager.message}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Winner's Crown */}
              {isWinner && (
                <div className="absolute top-0 right-4 transform -translate-y-1/2 text-3xl">
                  👑
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardScreen;