import React from 'react';

const RoundResults = ({ userScore, gameState, user, onRematch, rematching, onReturnToRoom, onQuitGame, mode = 'team', gameMode = 'question-vs-game', isFinal = false }) => {
  const isQuestionVsGame = gameMode === 'question-vs-game';
  const isQuestionOnly = gameMode === 'question-vs-question';
  const isGameOnly = gameMode === 'game-vs-game';
  
  const is1v1 = mode === '1v1' || (gameState?.teams?.A?.length === 1 && gameState?.teams?.B?.length === 1);

  // Add this condition to show "Final Results" instead of "Round Results"
  const headerText = isFinal ? "🏆 Final Results" : "📊 Round Results";

  // Determine user team and scores based on game mode
  let userTeam, teamScore, opponentTeam, opponentScore, userWon, isTie;

  if (isQuestionVsGame) {
    // FIX: Properly identify user's team
    userTeam = gameState.userTeam || (gameState.teams?.A?.some(p => p.id === user?.id) ? 'A' : 'B');
    teamScore = gameState.scores?.[userTeam] || 0;
    opponentTeam = userTeam === 'A' ? 'B' : 'A';
    opponentScore = gameState.scores?.[opponentTeam] || 0;
    
    // FIX: Correct win/lose logic
    userWon = teamScore > opponentScore;
    isTie = teamScore === opponentScore;
  } else {
    // Individual mode logic - compare player scores
    const userPlayerScore = gameState.playerScores?.[user?.id] || 0;
    
    // Find the highest score among all players (excluding current user)
    const otherPlayersScores = Object.entries(gameState.playerScores || {})
      .filter(([playerId]) => playerId !== user?.id)
      .map(([_, score]) => score);
    
    const highestOpponentScore = otherPlayersScores.length > 0 ? Math.max(...otherPlayersScores) : 0;
    
    teamScore = userPlayerScore;
    opponentScore = highestOpponentScore;
    userWon = userPlayerScore > highestOpponentScore;
    isTie = userPlayerScore === highestOpponentScore;
  }

  const opponent = is1v1 ? gameState.teams[opponentTeam]?.[0] : null;

  // FIX: Add debug logging to help identify issues
  React.useEffect(() => {
    console.log('RoundResults Debug:', {
      gameState,
      user,
      userTeam,
      teamScore,
      opponentTeam,
      opponentScore,
      userWon,
      isTie,
      gameMode,
      is1v1
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto text-center p-4">
      {/* Updated Header Section */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-xl">
        <h1 className="text-4xl font-bold text-white mb-4">
          {headerText}
        </h1>
        <p className="text-purple-100 text-lg">
          {isQuestionVsGame 
            ? (is1v1 
                ? `1v1 Match: ${user?.name} vs ${opponent?.name || 'Opponent'}`
                : `Team Match: Team ${userTeam} vs Team ${opponentTeam}`)
            : `${isQuestionOnly ? 'Question' : 'Game'} Mode - Individual Competition`
          }
        </p>
        <p className="text-purple-200 mt-2 text-sm">
          {isFinal ? 'Game Completed' : `Round ${gameState?.currentRound ? gameState.currentRound - 1 : '1'} Completed`}
        </p>
      </div>

      {/* SCOREBOARD */}
      {isQuestionVsGame ? (
        is1v1 ? (
          /* 🔹 1v1 Mode Layout - FIXED SCORE DISPLAY */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* USER'S SCORE - FIXED: Always show user's actual score */}
            <div className={`bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-6 ${userWon ? 'ring-4 ring-green-400' : ''}`}>
              <h3 className="text-2xl font-bold text-white mb-2">{user?.name} (You)</h3>
              <div className="text-5xl font-bold text-white mb-4">{teamScore} pts</div>
              <div className="text-blue-100">
                {userWon ? '🏆 WINNER' : isTie ? '⚖️ TIED' : '😞 LOST'}
              </div>
            </div>

            {/* OPPONENT'S SCORE - FIXED: Always show opponent's actual score */}
            <div className={`bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 ${!userWon && !isTie ? 'ring-4 ring-green-400' : ''}`}>
              <h3 className="text-2xl font-bold text-white mb-2">{opponent?.name || 'Opponent'}</h3>
              <div className="text-5xl font-bold text-white mb-4">{opponentScore} pts</div>
              <div className="text-red-100">
                {!userWon && !isTie ? '🏆 WINNER' : isTie ? '⚖️ TIED' : '😞 LOST'}
              </div>
            </div>
          </div>
        ) : (
          /* 🔹 Team Mode Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {/* Team A */}
            <div className={`rounded-2xl p-6 shadow-lg ${
              gameState.scores?.A > gameState.scores?.B
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 ring-4 ring-green-300'
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              <h3 className="text-2xl font-bold text-white mb-3">Team A</h3>
              <div className="text-5xl font-bold text-white mb-4">
                {gameState.scores?.A ?? 0} pts
              </div>
              <ul className="space-y-2">
                {gameState.teams?.A?.map((player) => (
                  <li key={player.id} className="flex items-center justify-between text-white text-lg py-2 px-4 rounded-xl bg-white/10">
                    <span>{player.name} {player.id === user?.id && '(You)'}</span>
                    <span className="text-yellow-300">
                      {gameState.playerScores?.[player.id] || 0} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Team B */}
            <div className={`rounded-2xl p-6 shadow-lg ${
              gameState.scores?.B > gameState.scores?.A
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 ring-4 ring-green-300'
                : 'bg-gradient-to-br from-pink-500 to-red-500'
            }`}>
              <h3 className="text-2xl font-bold text-white mb-3">Team B</h3>
              <div className="text-5xl font-bold text-white mb-4">
                {gameState.scores?.B ?? 0} pts
              </div>
              <ul className="space-y-2">
                {gameState.teams?.B?.map((player) => (
                  <li key={player.id} className="flex items-center justify-between text-white text-lg py-2 px-4 rounded-xl bg-white/10">
                    <span>{player.name} {player.id === user?.id && '(You)'}</span>
                    <span className="text-yellow-300">
                      {gameState.playerScores?.[player.id] || 0} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      ) : (
        /* 🔹 Individual Mode Layout (Question-only or Game-only) */
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6">Individual Rankings</h2>
          <div className="space-y-4">
            {Object.entries(gameState.playerScores || {})
              .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
              .map(([playerId, score], index) => {
                const player = [...(gameState.teams?.A || []), ...(gameState.teams?.B || [])]
                  .find(p => p.id === playerId);
                
                if (!player) return null;
                
                const isCurrentUser = playerId === user?.id;
                const rank = index + 1;
                
                return (
                  <div key={playerId} className={`flex items-center justify-between p-4 rounded-xl ${
                    isCurrentUser 
                      ? 'bg-yellow-500/20 border-2 border-yellow-400' 
                      : 'bg-white/10'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        rank === 1 ? 'bg-yellow-500' : 
                        rank === 2 ? 'bg-gray-400' : 
                        rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                      } text-white font-bold`}>
                        {rank}
                      </div>
                      <span className={`text-lg font-semibold ${isCurrentUser ? 'text-yellow-300' : 'text-white'}`}>
                        {player.name} {isCurrentUser && '(You)'}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-300">
                      {score} pts
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 🔹 Summary Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-8 shadow-md">
        <h2 className="text-2xl text-white font-bold mb-2">
          {isFinal ? 'Game Summary' : 'Round Summary'}
        </h2>
        {isTie ? (
          <p className="text-yellow-200 text-lg">Both sides fought well! It's a draw.</p>
        ) : (
          <p className="text-white text-lg">
            {userWon
              ? `🏆 Victory for ${isQuestionVsGame ? (is1v1 ? user?.name : `Team ${userTeam}`) : 'you'}!`
              : `💔 Defeat... ${isQuestionVsGame ? (is1v1 ? opponent?.name : `Team ${opponentTeam}`) : 'better luck next time'}`}
          </p>
        )}
        <p className="text-blue-200 text-sm mt-2 italic">
          {rematching ? 'Starting new game...' : (isFinal ? 'Thanks for playing!' : 'Ready for the next round!')}
        </p>
      </div>

      {/* 🔹 Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRematch}
          disabled={rematching}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
        >
          {rematching ? '🔄 Rematching...' : '🔄 Play Again'}
        </button>

        <button
          onClick={onQuitGame}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105"
        >
          🚪 {isFinal ? 'Return to Lobby' : 'Quit to Lobby'}
        </button>
      </div>
    </div>
  );
};

export default RoundResults;