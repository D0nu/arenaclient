// Components/RealPlayerScreen.jsx
import React from 'react';
import QuestionRound from '../Games/QuestionRound';
import MiniGameRound from '../Games/MiniGameRound';

const RealPlayerScreen = ({ player, gameState, playerActions }) => {
  const getPlayerActivity = () => {
    const playerRole = gameState?.playerRoles?.[player.id];
    const gameMode = gameState?.mode;
    
    if (playerRole === 'questions' || gameMode === 'question-vs-question') {
      return 'answering-questions';
    } else if (playerRole === 'games' || gameMode === 'game-vs-game') {
      return 'playing-games';
    }
    return 'waiting';
  };

  const playerActivity = getPlayerActivity();

  const getPlayerScreenData = () => {
    return {
      topic: gameState?.selectedTopic,
      gameType: gameState?.selectedGame,
      timeLeft: gameState?.roundTimeLeft || 180,
      roundStarted: gameState?.roundStarted || false,
      playerScore: gameState?.playerScores?.[player.id] || 0,
      // ✅ FIX: Include current question
      currentQuestion: gameState?.currentQuestion,
      currentGame: gameState?.currentGame,
    };
  };

  const screenData = getPlayerScreenData();

  const renderRealPlayerScreen = () => {
    switch (playerActivity) {
      case 'answering-questions':
        return (
          <div className="real-player-screen question-screen">
            <div className="screen-header bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <h3 className="text-blue-300 font-bold">
                📝 {player.name}'s Question Screen (LIVE)
              </h3>
              {/* ✅ FIX: Show current question info */}
              {screenData.currentQuestion && (
                <div className="text-blue-200 text-sm">
                  Current Question: {screenData.currentQuestion.question.substring(0, 50)}...
                </div>
              )}
            </div>
            <QuestionRound
              topic={screenData.topic}
              timeLeft={screenData.timeLeft}
              roundStarted={screenData.roundStarted}
              onScoreSubmit={() => {}}
              // ✅ FIX: Pass current question to QuestionRound
              currentQuestion={screenData.currentQuestion}
              playerId={player.id}
            />
          </div>
        );

      case 'playing-games':
        return (
          <div className="real-player-screen game-screen">
            <div className="screen-header bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4">
              <h3 className="text-green-300 font-bold">
                🎮 {player.name}'s Game Screen (LIVE)
              </h3>
              {/* ✅ FIX: Show current game info */}
              {screenData.currentGame && (
                <div className="text-green-200 text-sm">
                  Playing: {screenData.currentGame.name}
                </div>
              )}
            </div>
            <MiniGameRound
              gameType={screenData.gameType}
              timeLeft={screenData.timeLeft}
              roundStarted={screenData.roundStarted}
              onScoreSubmit={() => {}}
              userScore={screenData.playerScore}
              // ✅ FIX: Pass current game data
              currentGame={screenData.currentGame}
            />
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-bold text-white mb-2">Waiting for Game Start</h3>
            <p className="text-gray-300">{player.name} is waiting for assignment</p>
            {/* ✅ FIX: Show debug info */}
            <div className="mt-4 text-xs text-gray-500">
              Debug: Player Role: {gameState?.playerRoles?.[player.id]} | 
              Current Question: {gameState?.currentQuestion ? 'Yes' : 'No'} |
              Game Mode: {gameState?.mode}
            </div>
          </div>
        );
    }
  };

  return <div className="real-player-screen-container">{renderRealPlayerScreen()}</div>;
};

export default RealPlayerScreen;