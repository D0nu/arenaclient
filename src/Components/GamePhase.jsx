import React, { useState, useEffect } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DieRoll from './DieRoll';
import ChoiceSelection from './ChoiceSelection';
import QuestionRound from '../Games/QuestionRound';
import MiniGameRound from '../Games/MiniGameRound';
import RoundResults from './RoundResults';
import GameLoading from './GameLoading';


const GamePhase = ({ room, gameState: initialGameState, onQuitGame }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rematching, setRematching] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [gameState, setGameState] = useState(initialGameState);
  const [currentPlayerView, setCurrentPlayerView] = useState(0);

   const [autoStartAttempted, setAutoStartAttempted] = useState(false);
  const [lastAutoStartPhase, setLastAutoStartPhase] = useState('');
  

  const gameMode = room?.settings?.mode || 'question-vs-game';
  const isQuestionVsGame = gameMode === 'question-vs-game';
  const isQuestionOnly = gameMode === 'question-vs-question';
  const isGameOnly = gameMode === 'game-vs-game';
  const isNewMode = isQuestionOnly || isGameOnly;
  const is1v1 = isQuestionVsGame && gameState?.teams?.A?.length === 1 && gameState?.teams?.B?.length === 1;
  const isViewer = user && room && !room.players.some(player => player.id === user.id);

  useEffect(() => {
    if (gameState?.phase === 'random-selection' && !autoStartAttempted && isNewMode) {
      if ((isQuestionOnly && gameState.selectedTopic) || (isGameOnly && gameState.selectedGame)) {
        console.log('🎯 Auto-starting new mode round');
        setAutoStartAttempted(true);
        
        const timer = setTimeout(() => {
          if (isQuestionOnly) {
            startRound('questions', gameState.selectedTopic, null);
          } else if (isGameOnly) {
            startRound('games', null, gameState.selectedGame);
          }
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.phase, autoStartAttempted, isNewMode, isQuestionOnly, isGameOnly, gameState?.selectedTopic, gameState?.selectedGame]);

  useEffect(() => {
    if (gameState?.phase !== lastAutoStartPhase) {
      setAutoStartAttempted(false);
      setLastAutoStartPhase(gameState?.phase || '');
    }
  }, [gameState?.phase, lastAutoStartPhase]);


  useEffect(() => {
    if (socket && room?.code) {
      console.log('🎮 Requesting game state for room:', room.code);
      socket.emit('get-game-state', room.code);
    }
  }, [socket, room]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (serverGameState) => {
      console.log('🎮 Received game state from server:', serverGameState);
      setGameState(serverGameState);
      room && setLoading(false);
      setError(null);
    };

    const handleGameStateUpdated = (updatedState) => {
      console.log('🔄 Game state updated:', updatedState);
      setGameState(updatedState);
    };

    const handleDieRolled = (data) => {
      setGameState((prev) => ({
        ...prev,
        dieRolls: { ...prev.dieRolls, [data.playerId]: data.roll },
      }));
    };

    const handleDieRollWinner = (data) => {
      setGameState((prev) => ({
        ...prev,
        winner: data.winner,
        phase: 'choice',
      }));
    };

    const handleChoiceMade = (data) => {
      console.log('🎯 Choice made data:', data);
      
      setGameState((prev) => {
        const winnerTeam = data.winner?.team;
        const loserTeam = winnerTeam === 'A' ? 'B' : 'A';
        
        return {
          ...prev,
          choice: data.choice,
          winnerChoice: data.choice,
          selectedTopic: data.topic,
          selectedGame: data.game,
          teamRoundTypes: {
            [winnerTeam]: data.choice,
            [loserTeam]: data.choice === 'questions' ? 'games' : 'questions'
          },
          phase: 'round-started',
        };
      });
    };

    const handleRoundStarted = (data) => {
      console.log('🎮 Round started with data:', data);
      setGameState((prev) => ({
        ...prev,
        roundStarted: true,
        roundTimeLeft: data.timeLeft || 180,
        phase: determinePlayerPhase(prev, user),
      }));
    };

    const determinePlayerPhase = (gameState, currentUser) => {
      if (!gameState.teamRoundTypes || !currentUser) return 'question-round';
      
      const userTeam = gameState.teams?.A?.some(p => p.id === currentUser.id) ? 'A' : 
                      gameState.teams?.B?.some(p => p.id === currentUser.id) ? 'B' : null;
      
      if (!userTeam) return 'question-round';
      
      const userRoundType = gameState.teamRoundTypes[userTeam];
      return userRoundType === 'questions' ? 'question-round' : 'game-round';
    };

    const handleTimerUpdate = (data) => {
      setGameState((prev) => ({
        ...prev,
        roundTimeLeft: data.timeLeft,
      }));
    };

    // ✅ FIXED: Handle game completion properly
    const handleRoundCompleted = (data) => {
      console.log('🏁 ROUND COMPLETED - Showing results:', data);
      setGameState((prev) => ({
        ...prev,
        scores: data.scores,
        playerScores: data.playerScores,
        currentRound: data.nextRound,
        roundStarted: false,
        phase: 'round-completed', // ✅ Go straight to results
        roundTimeLeft: 0,
        // Keep game choices for display in results
      }));
      setUserScore(0);
    };

    // ✅ NEW: Handle game ended (final results)
    const handleGameEnded = (data) => {
      console.log('🎊 GAME ENDED - Final results:', data);
      setGameState((prev) => ({
        ...prev,
        scores: data.scores,
        playerScores: data.playerScores,
        roundStarted: false,
        phase: 'round-completed', // Show final results
        gameEnded: true, // Mark as final game
      }));
    };

    const handleScoreUpdated = (data) => {
      setGameState((prev) => ({
        ...prev,
        scores: { ...prev.scores, [data.team]: data.teamScore },
        playerScores: data.playerScores,
      }));
    };

    const handleGameError = (errorData) => {
      console.error('❌ Game error received:', errorData);
      setError(errorData.message || 'An unexpected error occurred.');
      setLoading(false);
      if (room?.code) {
        setTimeout(() => navigate(`/room/${room.code}`), 5000);
      }
    };

    const handleRedirectToGameRoom = () => {
      console.log('🔄 Redirecting to game room due to game error');
      if (room?.code) {
        navigate(`/room/${room.code}`);
      }
    };

    const handleRematching = () => setRematching(true);
    
    const handleRematched = () => {
      setRematching(false);
      setUserScore(0);
    };

    // Register listeners
    socket.on('game-state', handleGameState);
    socket.on('game-state-updated', handleGameStateUpdated);
    socket.on('die-rolled', handleDieRolled);
    socket.on('die-roll-winner', handleDieRollWinner);
    socket.on('choice-made', handleChoiceMade);
    socket.on('round-started', handleRoundStarted);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('round-completed', handleRoundCompleted);
    socket.on('game-ended', handleGameEnded); // ✅ NEW
    socket.on('score-updated', handleScoreUpdated);
    socket.on('game-error', handleGameError);
    socket.on('redirect-to-room', handleRedirectToGameRoom);
    socket.on('rematching', handleRematching);
    socket.on('rematched', handleRematched);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('game-state-updated', handleGameStateUpdated);
      socket.off('die-rolled', handleDieRolled);
      socket.off('die-roll-winner', handleDieRollWinner);
      socket.off('choice-made', handleChoiceMade);
      socket.off('round-started', handleRoundStarted);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('round-completed', handleRoundCompleted);
      socket.off('game-ended', handleGameEnded); // ✅ NEW
      socket.off('score-updated', handleScoreUpdated);
      socket.off('game-error', handleGameError);
      socket.off('redirect-to-room', handleRedirectToGameRoom);
      socket.off('rematching', handleRematching);
      socket.off('rematched', handleRematched);
    };
  }, [socket, room, navigate, user]);

  // Game actions
  const rollDie = () => {
    if (!room?.code) return;
    const roll = Math.floor(Math.random() * 6) + 1;
    socket.emit('roll-die', { roomCode: room.code, roll });
  };

  const makeChoice = (choice, topic, game) => {
    socket.emit('make-choice', { roomCode: room.code, choice, topic, game });
  };

  const submitScore = (score, roundType) => {
    socket.emit('submit-score', {
      roomCode: room.code,
      score,
      roundType,
      userId: user?.id,
    });
  };

  const startRound = (choice, topic, game) => {
    socket.emit('start-round', { 
      roomCode: room.code, 
      choice, 
      topic, 
      game 
    });
  };

  const returnToRoom = () => {
    if (!room?.code) return;
    navigate(`/room/${room.code}`);
  };
    
  const handleRematch = () => {
    socket.emit('rematch', room.code);
  };

  const getPlayerRoundType = () => {
    if (isNewMode) {
      return gameState.choice || 'questions';
    }
    
    const userTeam = gameState.teams?.A?.some(p => p.id === user?.id) ? 'A' : 
                    gameState.teams?.B?.some(p => p.id === user?.id) ? 'B' : null;
    
    if (!userTeam || !gameState.teamRoundTypes) {
      return gameState.choice || 'questions';
    }
    
    return gameState.teamRoundTypes[userTeam] || gameState.choice || 'questions';
  };

  // Viewer mode navigation
  const nextPlayerView = () => {
    setCurrentPlayerView(prev => (prev + 1) % room.players.length);
  };

  const prevPlayerView = () => {
    setCurrentPlayerView(prev => (prev - 1 + room.players.length) % room.players.length);
  };

  // Render viewer mode
  const renderViewerMode = () => {
    if (!room?.players) return null;

    const playersToShow = room.players.length > 2 
      ? [room.players[currentPlayerView]] // Show one at a time for >2 players
      : room.players; // Show all for 2 players

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Viewer Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">👁️ Game Viewer</h1>
              <p className="text-gray-400">
                Room: {room.code} • {room.players.length} Player{room.players.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={returnToRoom}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Exit Viewer
            </button>
          </div>

          {/* Navigation for more than 2 players */}
          {room.players.length > 2 && (
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={prevPlayerView}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              
              <div className="text-white text-center">
                <span className="font-bold">{currentPlayerView + 1}</span>
                <span className="text-gray-400"> / {room.players.length}</span>
              </div>
              
              <button
                onClick={nextPlayerView}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          )}

          {/* Player Screens Grid */}
          <div className={`grid gap-4 ${
            room.players.length > 2 
              ? 'grid-cols-1' // Single column for >2 players
              : 'grid-cols-1 lg:grid-cols-2' // Two columns for 2 players
          }`}>
            {playersToShow.map((player, index) => (
              <div
                key={player.socketId}
                className="bg-gray-800/70 border-2 border-purple-500 rounded-2xl p-6 text-center"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                    {player.avatar || '👤'}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xl text-white">
                      {player.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {player.isOwner ? 'Room Owner' : 'Player'} • Team {player.team}
                    </p>
                  </div>
                </div>

                {/* Player's Screen Preview */}
                <div className="bg-black/40 rounded-xl h-96 flex flex-col items-center justify-center border-2 border-gray-700 relative overflow-hidden">
                  {/* Game State Display */}
                  <div className="absolute top-4 left-4 bg-purple-600/80 text-white px-3 py-1 rounded-lg text-sm">
                    {gameState?.phase === 'question-round' ? '📝 Questions' : 
                     gameState?.phase === 'game-round' ? '🎮 Mini-Game' : 
                     gameState?.phase || 'Waiting...'}
                  </div>

                  {/* Score Display */}
                  <div className="absolute top-4 right-4 bg-green-600/80 text-white px-3 py-1 rounded-lg text-sm">
                    Score: {gameState?.playerScores?.[player.id] || 0}
                  </div>

                  {/* Simulated Game Content */}
                  <div className="text-center p-8">
                    {gameState?.roundStarted ? (
                      <>
                        <div className="text-6xl mb-4">
                          {gameState?.phase === 'question-round' ? '📝' : '🎮'}
                        </div>
                        <h4 className="text-2xl font-bold text-white mb-2">
                          {gameState?.phase === 'question-round' ? 'Answering Questions' : 'Playing Mini-Game'}
                        </h4>
                        <p className="text-gray-300 mb-4">
                          {gameState?.selectedTopic && `Topic: ${gameState.selectedTopic}`}
                          {gameState?.selectedGame && `Game: ${gameState.selectedGame}`}
                        </p>
                        <div className="inline-block bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
                          <span className="text-yellow-400 font-bold">
                            Time: {Math.floor(gameState?.roundTimeLeft / 60)}:
                            {(gameState?.roundTimeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">⏳</div>
                        <h4 className="text-2xl font-bold text-white mb-2">
                          {gameState?.phase === 'die-roll' ? 'Rolling Dice...' :
                           gameState?.phase === 'choice' ? 'Making Choice...' :
                           gameState?.phase === 'round-completed' ? 'Round Complete!' :
                           'Waiting for Game...'}
                        </h4>
                        <p className="text-gray-300">
                          {gameState?.phase === 'die-roll' ? 'Players are rolling for choice priority' :
                           gameState?.phase === 'choice' ? `${gameState.winner?.name} is choosing...` :
                           gameState?.phase === 'round-completed' ? 'Check the results!' :
                           'Game will start soon'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Player Status */}
                <div className="mt-4 flex justify-between items-center text-sm">
                  <span className={`px-3 py-1 rounded-full ${
                    player.isReady 
                      ? 'bg-green-500/20 text-green-400 border border-green-500' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                  }`}>
                    {player.isReady ? 'Ready' : 'Not Ready'}
                  </span>
                  <span className="text-gray-400">
                    Player {room.players.findIndex(p => p.id === player.id) + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Mobile Next/Prev Navigation - Fixed */}
          {isViewer && room.players.length > 1 && (
            <div className="flex justify-center gap-4 mt-4 lg:hidden">
              <button
                onClick={() =>
                  setCurrentPlayerView((i) => Math.max(i - 1, 0))
                }
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
              >
                ← Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPlayerView((i) =>
                    Math.min(i + 1, room.players.length - 1)
                  )
                }
                className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded"
              >
                Next →
              </button>
            </div>
          )}

          {/* Game Info Panel */}
          <div className="mt-6 bg-gray-800/50 rounded-2xl p-6 border-2 border-blue-500">
            <h3 className="text-xl font-bold text-white mb-4">📊 Game Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-gray-400">Mode</p>
                <p className="text-white font-bold text-lg">{gameMode}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Round</p>
                <p className="text-white font-bold text-lg">{gameState?.currentRound || 1}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Status</p>
                <p className="text-white font-bold text-lg capitalize">{gameState?.phase || 'waiting'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  

 const renderNewModeContent = () => {
    if (!gameState) return null;

    switch (gameState.phase) {
      case 'random-selection':
        // ✅ FIXED: Show loading state while auto-starting, prevent multiple renders
        if (!gameState.roundStarted) {
          return (
            <div className="text-center p-8">
              <div className="text-6xl mb-4">
                {isQuestionOnly ? '📝' : '🎮'}
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Starting {isQuestionOnly ? 'Question Round' : 'Mini-Game'}
              </h2>
              <p className="text-gray-300 mb-4">
                {isQuestionOnly ? `Topic: ${gameState.selectedTopic}` : `Game: ${gameState.selectedGame}`}
              </p>
              <div className="inline-block bg-purple-500/20 border border-purple-500 rounded-lg px-4 py-2">
                <span className="text-purple-400 font-bold">Loading...</span>
              </div>
            </div>
          );
        }
        
        // ✅ If round has started, fall through to the appropriate phase
        if (isQuestionOnly || gameState.choice === 'questions') {
          return (
            <QuestionRound
              topic={gameState.selectedTopic}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'question'); 
                setUserScore(prev => prev + score);
              }}
              mode="individual"
              team={null}
            />
          );
        } else if (isGameOnly || gameState.choice === 'games') {
          return (
            <MiniGameRound
              gameType={gameState.selectedGame || 'basketball'}
              userScore={userScore}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'game'); 
                setUserScore(prev => prev + score);
              }}
              mode="individual"
              team={null}
            />
          );
        }
        return <GameLoading />;

      case 'question-round':
        return (
          <QuestionRound
            topic={gameState.selectedTopic}
            timeLeft={gameState.roundTimeLeft}
            roundStarted={gameState.roundStarted}
            onScoreSubmit={(score) => {
              submitScore(score, 'question'); 
              setUserScore(prev => prev + score);
            }}
            mode="individual"
            team={null}
          />
        );

      case 'game-round':
        return (
          <MiniGameRound
            gameType={gameState.selectedGame || 'basketball'}
            userScore={userScore}
            timeLeft={gameState.roundTimeLeft}
            roundStarted={gameState.roundStarted}
            onScoreSubmit={(score) => {
              submitScore(score, 'game'); 
              setUserScore(prev => prev + score);
            }}
            mode="individual"
            team={null}
          />
        );

      case 'round-started':
        if (isQuestionOnly || gameState.choice === 'questions') {
          return (
            <QuestionRound
              topic={gameState.selectedTopic}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'question'); 
                setUserScore(prev => prev + score);
              }}
              mode="individual"
              team={null}
            />
          );
        } else if (isGameOnly || gameState.choice === 'games') {
          return (
            <MiniGameRound
              gameType={gameState.selectedGame || 'basketball'}
              userScore={userScore}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'game'); 
                setUserScore(prev => prev + score);
              }}
              mode="individual"
              team={null}
            />
          );
        }
        return <GameLoading />;

      case 'round-completed':
        return (
          <RoundResults
            gameState={gameState}
            user={user}
            userScore={userScore}
            onReturnToRoom={returnToRoom}
            rematching={rematching}
            onRematch={handleRematch}
            onQuitGame={onQuitGame}
            mode="individual"
            gameMode={gameMode}
            isFinal={gameState.gameEnded}
          />
        );

      default:
        return <GameLoading />;
    }
  };

  const renderQuestionVsGameContent = () => {
    if (!gameState) return null;

    const userTeam = gameState.teams?.A?.some(p => p.id === user?.id) ? 'A' : 
                    gameState.teams?.B?.some(p => p.id === user?.id) ? 'B' : null;
    
    const isWinnerTeamLeader = gameState.winner?.id === user?.id;
    const playerRoundType = getPlayerRoundType();

    switch (gameState.phase) {
      case 'die-roll': {
        const userIsDiceRoller = gameState.diceRollers?.some(
          (p) => p.id === user?.id
        );
        return (
          <DieRoll
            room={room}
            user={user}
            dieRolls={gameState.dieRolls}
            diceRollers={gameState.diceRollers}
            onRollDie={rollDie}
            userIsDiceRoller={userIsDiceRoller}
            mode={is1v1 ? '1v1' : 'team'}
          />
        );
      }

      case 'choice':
        if (isWinnerTeamLeader) {
          return (
            <ChoiceSelection
              winner={gameState.winner}
              user={user}
              onMakeChoice={makeChoice}
              mode={is1v1 ? '1v1' : 'team'}
            />
          );
        } else {
          return (
            <div className="text-center bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Waiting for {is1v1 ? 'Opponent' : 'Team Leader'} to Choose...
              </h2>
              <p className="text-purple-100 text-lg">
                {gameState.winner?.name} is selecting the next challenge!
              </p>
            </div>
          );
        }

      case 'question-round':
      case 'game-round':
      case 'round-started': {
        if (playerRoundType === 'questions') {
          return (
            <QuestionRound
              topic={gameState.selectedTopic}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'question'); 
                setUserScore(prev => prev + score);
              }}
              mode={is1v1 ? '1v1' : 'team'}
              team={userTeam}
            />
          );
        } else {
          return (
            <MiniGameRound
              gameType={gameState.selectedGame || 'basketball'}
              userScore={userScore}
              timeLeft={gameState.roundTimeLeft}
              roundStarted={gameState.roundStarted}
              onScoreSubmit={(score) => {
                submitScore(score, 'game'); 
                setUserScore(prev => prev + score);
              }}
              mode={is1v1 ? '1v1' : 'team'}
              team={userTeam}
            />
          );
        }
      }

      case 'round-completed':
        return (
          <RoundResults
            gameState={gameState}
            user={user}
            userScore={userScore}
            onReturnToRoom={returnToRoom}
            rematching={rematching}
            onRematch={handleRematch}
            onQuitGame={onQuitGame}
            mode={is1v1 ? '1v1' : 'team'}
            gameMode={gameMode}
            isFinal={gameState.gameEnded} // ✅ Pass if this is final game
          />
        );

      default:
        return <GameLoading />;
    }
  };

  const renderCurrentPhase = () => {
    if (!gameState) return null;

    if (isNewMode) {
      return renderNewModeContent();
    } else {
      return renderQuestionVsGameContent();
    }
  };

  // ✅ If user is a viewer, show viewer mode
  if (isViewer) {
    return renderViewerMode();
  }

  if (loading) return <GameLoading />;

  if (!room && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-8 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Room Not Found</h2>
            <p className="text-yellow-300 mb-6">Unable to load game room.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-8 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Game Error</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <p className="text-gray-400 text-sm mb-4">
              Returning to game room in 5 seconds...
            </p>
            <button
              onClick={() => room?.code && navigate(`/room/${room.code}`)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Return to Room Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Game Session</h1>
            <p className="text-gray-400">
              Room: {room.code} • Mode: {gameMode} •{' '}
              {isNewMode ? 'Individual Competition' : 
               is1v1 ? '1v1' : `${gameState?.teams?.A?.length || 0}v${gameState?.teams?.B?.length || 0}`}
            </p>
          </div>
          <button
            onClick={onQuitGame}
            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Quit Game
          </button>
        </div>

        {/* Timer - Only show when round is active */}
        {gameState?.roundStarted && gameState.phase !== 'round-completed' && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 mb-6 text-center">
            <div className="text-2xl font-bold text-white">
              Time: {Math.floor(gameState.roundTimeLeft / 60)}:
              {(gameState.roundTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Game Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500">
          {renderCurrentPhase()}
        </div>

        {/* Scores - Only show when round is active */}
        {gameState?.phase !== 'round-completed' && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-gray-400">Round</p>
              <p className="text-2xl font-bold text-white">
                {gameState?.currentRound || 1}
              </p>
            </div>
            
            {isNewMode ? (
              // Individual mode scores
              <>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border-2 border-blue-500">
                  <p className="text-gray-400">Your Score</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {gameState?.playerScores?.[user?.id] || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border-2 border-green-500">
                  <p className="text-gray-400">Leader</p>
                  <p className="text-2xl font-bold text-green-400">
                    {Math.max(...Object.values(gameState?.playerScores || {0: 0})) || 0}
                  </p>
                </div>
              </>
            ) : (
              // Team mode scores
              <>
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border-2 border-blue-500">
                  <p className="text-gray-400">Team A</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {gameState?.scores?.A || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-4 border-2 border-red-500">
                  <p className="text-gray-400">Team B</p>
                  <p className="text-2xl font-bold text-red-400">
                    {gameState?.scores?.B || 0}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePhase;