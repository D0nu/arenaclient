// Components/GameContentView.jsx - UPDATED
import React from 'react';

const GameContentView = ({ gameState, selectedPlayer }) => {
  if (!gameState) return null;

  // If we have a selected player, show the overview instead of individual player view
  // This component now only handles the global overview when no specific player is selected
  if (selectedPlayer) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">👀</div>
        <h3 className="text-xl font-bold text-white mb-2">Player View Active</h3>
        <p className="text-gray-300">
          Currently watching {selectedPlayer.name}'s screen
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Switch to global view by selecting "Overview" in player selection
        </p>
      </div>
    );
  }

  const renderQuestionContent = () => {
    if (!gameState.currentQuestion) {
      return (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-4">❓</div>
          <p>Waiting for question to be selected...</p>
          <p className="text-sm mt-2">Players are currently in: {gameState.phase}</p>
        </div>
      );
    }

    const question = gameState.currentQuestion;
    
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-blue-500/30">
        {/* Question Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Current Question</h3>
          {question.category && (
            <span className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30">
              {question.category}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="mb-6 p-4 bg-black/30 rounded-lg border border-gray-600">
          <p className="text-lg text-gray-200 leading-relaxed">{question.question}</p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {question.options?.map((option, index) => {
            const isCorrect = index === question.correctAnswer;
            const hasAnswered = gameState.playerAnswers && Object.keys(gameState.playerAnswers).length > 0;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCorrect && gameState.phase === 'round-completed'
                    ? 'bg-green-500/20 border-green-500'
                    : hasAnswered
                    ? 'bg-gray-700/50 border-gray-600 opacity-70'
                    : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center">
                  <span className="font-bold mr-3 text-gray-300 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="text-gray-200">{option}</span>
                </div>
                
                {isCorrect && gameState.phase === 'round-completed' && (
                  <div className="flex justify-end mt-2">
                    <span className="text-sm px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                      Correct Answer
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Player Answers Status */}
        {gameState.playerAnswers && Object.keys(gameState.playerAnswers).length > 0 && (
          <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <h4 className="font-semibold text-gray-300 mb-3">Player Answers:</h4>
            <div className="space-y-2">
              {Object.entries(gameState.playerAnswers).map(([playerId, answerIndex]) => {
                const player = [...(gameState.teams?.A || []), ...(gameState.teams?.B || [])]
                  .find(p => p.id === playerId);
                if (!player) return null;
                
                const isCorrect = answerIndex === question.correctAnswer;
                const answerLetter = String.fromCharCode(65 + answerIndex);
                
                return (
                  <div key={playerId} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-300 font-medium">{player.name}</span>
                      <span className="ml-2 text-xs bg-gray-600 px-2 py-1 rounded">
                        Team {player.team}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">
                        Answered: <strong>{answerLetter}</strong>
                      </span>
                      {gameState.phase === 'round-completed' && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          isCorrect 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {isCorrect ? '✓ Correct' : '✗ Wrong'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting for answers */}
        {(!gameState.playerAnswers || Object.keys(gameState.playerAnswers).length === 0) && (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-400">Waiting for players to answer...</div>
          </div>
        )}
      </div>
    );
  };

  const renderMiniGameContent = () => {
    if (!gameState.currentGame) {
      return (
        <div className="text-center text-gray-400 py-8">
          <div className="text-4xl mb-4">🎮</div>
          <p>Waiting for game to start...</p>
        </div>
      );
    }

    const currentGame = gameState.currentGame;
    
    return (
      <div className="bg-gray-800/50 rounded-xl p-6 border-2 border-green-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Current Mini-Game</h3>
        
        <div className="mb-4">
          <h4 className="text-lg text-green-400 font-semibold mb-2">{currentGame.name}</h4>
          <p className="text-gray-300 mb-3">{currentGame.description}</p>
          
          {currentGame.instructions && (
            <div className="bg-gray-700/30 p-3 rounded-lg mb-3">
              <p className="text-sm text-gray-400">{currentGame.instructions}</p>
            </div>
          )}
        </div>

        {/* Game progress visualization */}
        {gameState.gameProgress && Object.keys(gameState.gameProgress).length > 0 && (
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-300">Game Progress:</h5>
            {Object.entries(gameState.gameProgress).map(([playerId, progress]) => {
              const player = [...(gameState.teams?.A || []), ...(gameState.teams?.B || [])]
                .find(p => p.id === playerId);
              if (!player) return null;
              
              // Different progress displays based on game type
              if (currentGame.type === 'typing') {
                return (
                  <div key={playerId} className="bg-gray-700/30 p-3 rounded">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">{player.name}</span>
                      <span className="text-gray-400">{progress.wordsTyped || 0} WPM</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (progress.wordsTyped || 0) / 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              } else if (currentGame.type === 'reaction') {
                return (
                  <div key={playerId} className="flex justify-between items-center bg-gray-700/30 p-3 rounded">
                    <span className="text-gray-300">{player.name}</span>
                    <span className="text-yellow-400">{progress.reactionTime || 'Waiting...'}ms</span>
                  </div>
                );
              } else if (currentGame.type === 'memory') {
                return (
                  <div key={playerId} className="flex justify-between items-center bg-gray-700/30 p-3 rounded">
                    <span className="text-gray-300">{player.name}</span>
                    <span className="text-blue-400">{progress.cardsMatched || 0} matched</span>
                  </div>
                );
              } else {
                // Generic progress display
                return (
                  <div key={playerId} className="flex justify-between items-center bg-gray-700/30 p-3 rounded">
                    <span className="text-gray-300">{player.name}</span>
                    <span className="text-purple-400">Playing...</span>
                  </div>
                );
              }
            })}
          </div>
        )}

        {/* Generic progress fallback */}
        {(!gameState.gameProgress || Object.keys(gameState.gameProgress).length === 0) && (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-400">Game in progress...</div>
          </div>
        )}
      </div>
    );
  };

  // Determine what to show based on current phase and available data
  const showQuestionContent = 
    (gameState.phase === 'question-round' || 
     gameState.phase === 'round-started' || 
     gameState.phase === 'round-completed') && 
    gameState.currentQuestion;

  const showGameContent = 
    (gameState.phase === 'game-round' || 
     gameState.phase === 'round-started' || 
     gameState.phase === 'round-completed') && 
    gameState.currentGame;

  return (
    <div className="space-y-4">
      {/* Show question content when available */}
      {showQuestionContent && renderQuestionContent()}
      
      {/* Show mini-game content when available */}
      {showGameContent && renderMiniGameContent()}
      
      {/* Show appropriate message when no specific content but in active round */}
      {!showQuestionContent && !showGameContent && 
       (gameState.phase.includes('round') || gameState.phase === 'round-started') && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-white mb-2">Round in Progress</h3>
          <p className="text-gray-300">
            {gameState.phase === 'question-round' 
              ? 'Waiting for question to be selected...' 
              : gameState.phase === 'game-round'
              ? 'Waiting for game to start...'
              : 'Active round - content loading...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameContentView;