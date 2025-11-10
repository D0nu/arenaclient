
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useGame } from "../Context/GameContext";
import GameLoading from '../Components/GameLoading';
import LeaderboardScreen from '../Components/LeaderboardScreen';
import { useAudioManager } from '../hooks/useAudioManager';

const GamePage = () => {
  const { id: roomCode } = useParams(); 
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const { state, dispatch } = useGame();

  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isViewer, setIsViewer] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [isQuitting, setIsQuitting] = useState(false);
  useAudioManager('game');


useEffect(() => {

  const preventArrowScroll = (e) => {

    if (!showResults && !loading && gameState && gameState.phase !== 'lobby') {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }
  };

 
  const preventSpaceScroll = (e) => {
    if (!showResults && !loading && gameState && e.code === 'Space') {
      e.preventDefault();
    }
  };

  
  window.addEventListener('keydown', preventArrowScroll, { passive: false });
  window.addEventListener('keydown', preventSpaceScroll, { passive: false });

  return () => {
    
    window.removeEventListener('keydown', preventArrowScroll);
    window.removeEventListener('keydown', preventSpaceScroll);
  };
}, [showResults, loading, gameState]);

  // ✅ Fetch game + room state on mount
  useEffect(() => {
    if (!socket || !user || !roomCode) {
      console.log('❌ Missing requirements:', { socket: !!socket, user: !!user, roomCode });
      return;
    }

    console.log(`🎮 GamePage mounted for room: ${roomCode}, user: ${user.name}`);

    socket.emit('get-room-state', roomCode);
    socket.emit('get-game-state', roomCode);

    const handleGameState = (state) => {
      console.log('🎮 Game state received:', state);
      setGameState(state);
      dispatch({ type: "SET_GAME_DATA", payload: state });
      setLoading(false);
    };

    const handleRoomState = (roomData) => {
      console.log('🎮 Room state received:', roomData);
      setRoom(roomData);

      const isPlayer = roomData.players.some(p => p.id === (user._id || user.id)?.toString());
      setIsViewer(!isPlayer);

      console.log(`👤 User ${user.name} is ${isPlayer ? 'player' : 'viewer'}`);

      if (!isPlayer) {
        console.log(`👁️ Joining as viewer to room: ${roomCode}`);
        socket.emit("join-as-viewer", { roomCode });
      }
    };

    const handleGameStateUpdated = (updatedState) => {
      console.log('🔄 Game state updated:', updatedState);
      setGameState(updatedState);
      dispatch({ type: "SET_GAME_DATA", payload: updatedState });
    };

    const handleGameStarted = (data) => {
      console.log('🚀 Game started:', data);
      setGameState(data.gameState);
      dispatch({ type: "SET_GAME_DATA", payload: data.gameState });
      setLoading(false);
    };

    const handleGameEnded = (data) => {
      console.log('🏁 Game ended with results:', data);
      
      setGameState(prev => ({ 
        ...prev, 
        phase: 'round-completed', 
        gameEnded: true,
        finalScores: data.scores,
        finalPlayerScores: data.playerScores,
        winners: data.winners,
        isDraw: data.isDraw
      }));
      
      if (data.showResults) {
        setResultsData(data);
        setShowResults(true);
        
        if (data.autoReturnDelay) {
          setTimeout(() => {
            navigate(`/room/${roomCode}`);
          }, data.autoReturnDelay);
        }
        
        setIsQuitting(false);
      }
    };

    const handleOpponentQuit = (data) => {
      console.log('🚨 Opponent quit with results:', data);
      
      const userId = user?._id?.toString() || user?.id?.toString();
      console.log('Current user ID:', userId);
      
      // Update game state
      setGameState(prev => ({ 
        ...prev, 
        phase: 'results', 
        gameEnded: true,
        finalScores: data.scores,
        finalPlayerScores: data.playerScores,
        winners: data.winners,
        showResults: true 
      }));

      // Check if current user is winner or quitter
      const isWinner = data.winners?.some(winner => 
        (winner.id || winner._id)?.toString() === userId
      );
      
      console.log('Is winner?', isWinner, 'Winners:', data.winners);
      
      // Prepare data based on user role (winner/quitter)
      const hasWager = data?.hasWager || room?.settings?.wager > 0;
      const wagerAmount = data?.wagerAmount || room?.settings?.wager || 0;
      
      let resultData;
      
      if (isWinner) {
        // Winner's view
        resultData = {
          type: 'opponent_quit',
          reason: 'opponent_quit',
          isOpponentQuit: true,
          message: `${data.quittingPlayer?.name || 'Opponent'} forfeited!`,
          showResults: true,
          autoReturnDelay: data?.autoReturnDelay || 8000,
          hasWager,
          wagerAmount,
          scores: data.scores || { A: 0, B: 0 },
          winners: [user],
          messages: {
            winner: hasWager 
              ? `${data.quittingPlayer?.name || 'Opponent'} forfeited! You win ${wagerAmount * 2} coins! 🎉`
              : `${data.quittingPlayer?.name || 'Opponent'} forfeited! You win! 🎉`
          }
        };
      } else {
        // Quitter's view
        resultData = {
          type: 'player_quit',
          reason: 'you_quit',
          isYouQuit: true,
          message: 'You forfeited the match.',
          showResults: true,
          autoReturnDelay: data?.autoReturnDelay || 8000,
          hasWager,
          wagerAmount,
          scores: data.scores || { A: 0, B: 0 },
          winners: [],
          messages: {
            quitter: hasWager
              ? `You forfeited the match. Lost ${wagerAmount} coins.`
              : 'You forfeited the match.'
          }
        };
      }

      console.log(`📊 Setting ${isWinner ? 'winner' : 'quitter'} results data:`, resultData);
      
   
      const completeData = {
        ...data,
        hasWager,
        wagerAmount,
        showResults: true,
        autoReturnDelay: data?.autoReturnDelay || 8000,
        // Use optimistic data only if server didn't provide these
        reason: data?.reason || 'opponent_quit',
        type: data?.type || 'opponent_quit',
        messages: data?.messages || {
          winner: hasWager 
            ? `Opponent forfeited! You win ${wagerAmount * 2} coins! 🎉` 
            : 'Opponent forfeited! You win! 🎉',
          quitter: hasWager
            ? `You forfeited the match. Lost ${wagerAmount} coins.`
            : 'You forfeited the match.'
        },
        // For quitter, ensure we don't show as winner
        winners: isWinner ? (data?.winners || [user]) : []
      };

      console.log('📊 Complete results data:', completeData);

      // Show results screen with role-specific data
      setResultsData(resultData);
      setShowResults(true);
      
      // Schedule return to room
      const delay = resultData.autoReturnDelay;
      console.log(`⏰ Scheduling return to room in ${delay}ms`);
      setTimeout(() => {
        setGameMessage('');  // Clear message before navigating
        navigate(`/room/${roomCode}`);
      }, delay);
      
      // Clear quitting state
      setIsQuitting(false);
    };

    const handleReturnToRoom = (data) => {
      console.log('📍 Returning to room:', data);

      if (showResults) {
        console.log('⏸️ Results modal active; deferring server return-to-room navigation');
        if (data && data.forceReturn) {
          console.log('⚠️ Server forced return; navigating now');
          navigate(`/room/${roomCode}`);
        }
        // clear quitting state regardless
        setIsQuitting(false);
        return;
      }

   
      navigate(`/room/${roomCode}`);
   
      setIsQuitting(false);
    };

    const handlePlayerQuitContinue = (data) => {
      console.log('🔄 Player quit, game continues:', data);
      setGameMessage(data.message || `${data.playerName} quit the game. Game continues.`);
      
      setTimeout(() => {
        setGameMessage('');
      }, 3000);
    };

    const handleGameAlert = (data) => {
      console.log('📢 Game alert:', data);
      if (data.type === 'player_quit') {
        setGameMessage(data.message);
        
        setTimeout(() => {
          setGameMessage('');
        }, 3000);
      }
    };

    const handleRoomClosed = () => {
      console.log('🚫 Room closed');
      setError('Room has been closed by the owner');
      setTimeout(() => navigate('/'), 3000);
    };

    const handleGameError = (errorData) => {
      console.error('❌ Game error:', errorData);
      setError(errorData.message);
      setLoading(false);
    };

    const handleRoomNotFound = () => {
      console.log('❌ Room not found');
      setError('Game room not found');
      setLoading(false);
    };

    socket.on('game-state', handleGameState);
    socket.on('room-state', handleRoomState);
    socket.on('game-state-updated', handleGameStateUpdated);
    socket.on('game-started', handleGameStarted);
    socket.on('game-ended', handleGameEnded);
    socket.on('opponent-quit', handleOpponentQuit);
    socket.on('return-to-room', handleReturnToRoom);
    socket.on('player-quit-continue', handlePlayerQuitContinue);
    socket.on('game-alert', handleGameAlert);
    socket.on('room-closed', handleRoomClosed);
    socket.on('game-error', handleGameError);
    socket.on('room-not-found', handleRoomNotFound);

    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ Loading timeout - requesting state again');
        socket.emit('get-room-state', roomCode);
        socket.emit('get-game-state', roomCode);
      }
    }, 5000);

    return () => {
      console.log('🧹 Cleaning up GamePage listeners');
      clearTimeout(timeout);
      socket.off('game-state', handleGameState);
      socket.off('room-state', handleRoomState);
      socket.off('game-state-updated', handleGameStateUpdated);
      socket.off('game-started', handleGameStarted);
      socket.off('game-ended', handleGameEnded);
      socket.off('opponent-quit', handleOpponentQuit);
      socket.off('return-to-room', handleReturnToRoom);
      socket.off('player-quit-continue', handlePlayerQuitContinue);
      socket.off('game-alert', handleGameAlert);
      socket.off('room-closed', handleRoomClosed);
      socket.off('game-error', handleGameError);
      socket.off('room-not-found', handleRoomNotFound);
    };
  }, [socket, user, roomCode, navigate, dispatch, loading]);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      console.log('🔐 User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleQuitGame = () => {
    if (isQuitting) {
      console.log('⏳ Quit already in progress, ignoring duplicate click');
      return;
    }

    setIsQuitting(true);

    if (socket && roomCode) {
      console.log('🚪 User quitting game:', roomCode);
      socket.emit('quit-game', roomCode);
    }


    const optimistic = {
      reason: 'you_quit',
      type: 'player_quit',
      message: 'You forfeited the match. Waiting for server confirmation...',
      hasWager: room?.settings?.wager > 0,
      wagerAmount: room?.settings?.wager || 0,
      showResults: true,
      autoReturnDelay: 8000,
      winners: []
    };

    setResultsData(optimistic);
    setShowResults(true);
  };


  const ResultsScreen = ({ data, onClose }) => {
    console.log(data)
    if (!data || !user) return null;
    
    const userId = user._id || user.id;
    if (!userId) {
      console.error('❌ No user ID available in ResultsScreen');
      return null;
    }
    
    // ✅ FIXED: Multiple checks for opponent quit
    const opponentQuit = data.reason === 'opponent_quit' || 
                         data.type === 'opponent_quit' ||
                         data.isOpponentQuit ||
                         (data.message && data.message.toLowerCase().includes('opponent quit'));
    
    const youQuit = data.reason === 'you_quit' || 
                    data.type === 'player_quit' ||
                    data.isYouQuit;
    
    const isWinner = data.winners?.some(winner => {
      const winnerId = winner.id || winner._id;
      return winnerId?.toString() === userId.toString();
    });
    
    const isDraw = data.isDraw;
    
    
    let resultMessage = '';
    let wagerInfo = '';
    
    console.log('🎯 ResultsScreen data:', { 
      opponentQuit, 
      youQuit, 
      isWinner, 
      isDraw, 
      dataReason: data.reason,
      dataType: data.type,
      dataMessage: data.message,
      fullData: data 
    });
    
    if (youQuit) {
      
      resultMessage = data.messages?.quitter || "You forfeited the match.";
      if (data.hasWager) {
        wagerInfo = `You lost ${data.wagerAmount} coins`;
      }
    } else if (opponentQuit || (isWinner && data.reason === 'opponent_quit')) {
     
      resultMessage = data.messages?.winner || "🎉 Opponent forfeited! You win!";
      if (data.hasWager) {
        
        const winAmount = data.winnings || (data.wagerAmount * 2);
        wagerInfo = `You won ${winAmount} coins!`;
      }
    } else if (isDraw) {
      resultMessage = data.message || "Game ended in a draw!";
      if (data.hasWager) {
        wagerInfo = `Wager refunded (minus house fee)`;
      }
    } else if (isWinner) {
      resultMessage = data.message || "Congratulations! You won! 🎉";
      if (data.hasWager) {
        const winAmount = data.winnings || data.wagerAmount * 2;
        wagerInfo = `You won ${winAmount} coins!`;
      }
    } else {
      resultMessage = data.message || "Better luck next time!";
      if (data.hasWager) {
        wagerInfo = `You lost ${data.wagerAmount} coins.`;
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-2xl w-full border-4 border-yellow-400 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">
              {youQuit ? '🏃‍♂️' : 
               opponentQuit ? '🎉' :
               isDraw ? '🤝' : 
               isWinner ? '🏆' : '😔'}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {youQuit ? 'You Quit' :
               opponentQuit ? 'Victory by Forfeit!' :
               isDraw ? 'Game Draw!' : 
               isWinner ? 'Victory!' : 'Game Over'}
            </h1>
            <p className="text-xl text-gray-300">
              {resultMessage}
            </p>
            {wagerInfo && (
              <p className="text-yellow-400 text-lg mt-2 font-semibold">
                {wagerInfo}
              </p>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-purple-500/30">
              <h3 className="text-lg font-semibold text-purple-300 mb-2">Team A</h3>
              <div className="text-3xl font-bold text-white">{data.scores?.A || 0}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-blue-500/30">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Team B</h3>
              <div className="text-3xl font-bold text-white">{data.scores?.B || 0}</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <LeaderboardScreen
              players={room?.players || []}
              playerScores={data.playerScores || {}}
              currentUserId={userId}
              wagerInfo={Object.keys(data.playerScores || {}).reduce((acc, playerId) => {
                const isWinner = playerId === data.winnerId;
                const wageredAmount = room?.wagerAmount || 0;
                
                acc[playerId] = {
                  amount: wageredAmount,
                  type: isWinner ? 'win' : 'loss',
                  message: isWinner ? 'Winner!' : 'Better luck next time!'
                };
                return acc;
              }, {})}
            />
          </div>

          {/* Wager Info */}
          {data.hasWager && (
            <div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 rounded-xl p-4 mb-6 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">💰</span>
                <div className="text-center">
                  <div className="text-yellow-300 font-semibold">
                    {youQuit ? 'Wager Lost' :
                     opponentQuit ? 'Wager Won!' :
                     isDraw ? 'Wager Refunded' : 
                     isWinner ? 'Wager Won!' : 'Wager Lost'}
                  </div>
                  <div className="text-yellow-200 text-sm">
                    Amount: {data.wagerAmount} coins
                  </div>
                  {data.winnings && (
                    <div className="text-green-400 text-sm font-bold">
                      Winnings: {data.winnings} coins
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Return Info with Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="text-center text-gray-400">
              Returning to room in {Math.floor((data.autoReturnDelay || 8000) / 1000)} seconds...
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
                style={{ 
                  width: '100%',
                  animation: `shrink ${data.autoReturnDelay || 8000}ms linear forwards`
                }}
              />
            </div>
          </div>

          <style jsx>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>

          <button 
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-indigo-500 transition-all transform hover:scale-105"
          >
            Return to Room Now
          </button>
        </div>
      </div>
    );
  };

  // ✅ ERROR COMPONENT
  const GameError = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/30 mb-6">
          <div className="text-3xl">⚠️</div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Game Error</h2>
        <p className="text-red-300 mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          {error}
        </p>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onRetry}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl transition-all transform hover:scale-105"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-xl transition-all"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    </div>
  );

  // ✅ GAME MESSAGE COMPONENT
  const GameMessage = ({ message, type = 'info' }) => (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-40 ${
      type === 'info' ? 'bg-blue-600/90' : 'bg-yellow-600/90'
    } text-white px-6 py-3 rounded-xl backdrop-blur-sm border-2 ${
      type === 'info' ? 'border-blue-400' : 'border-yellow-400'
    } shadow-2xl max-w-md text-center`}>
      {message}
    </div>
  );

  if (loading) {
    return <GameLoading />;
  }

  if (error) {
    return (
      <GameError 
        error={error}
        onRetry={() => {
          setLoading(true);
          setError('');
          socket.emit('get-room-state', roomCode);
          socket.emit('get-game-state', roomCode);
        }}
      />
    );
  }

  if (!room) {
    return (
      <GameError 
        error={`The game room "${roomCode}" could not be found.`}
        onRetry={() => {
          setLoading(true);
          socket.emit('get-room-state', roomCode);
          socket.emit('get-game-state', roomCode);
        }}
      />
    );
  }

  const currentGameState = gameState || {
    phase: 'loading',
    teams: {
      A: room.players.filter(p => p.team === 'A'),
      B: room.players.filter(p => p.team === 'B')
    },
    scores: { A: 0, B: 0 },
    playerScores: room.players.reduce((acc, player) => {
      acc[player.id] = 0;
      return acc;
    }, {}),
    currentRound: 1,
    status: 'waiting'
  };

  console.log('🎮 Rendering GamePage with:', {
    roomCode,
    roomPlayers: room?.players?.length,
    gameStatePhase: currentGameState.phase,
    isViewer,
    gameMessage,
    showResults
  });

  const GamePhase = React.lazy(() => import('../Components/GamePhase'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      {gameMessage && (
        <GameMessage 
          message={gameMessage} 
          type="info"
        />
      )}

      {showResults && (
        <ResultsScreen 
          data={resultsData}
          onClose={() => navigate(`/room/${roomCode}`)}
        />
      )}

      <React.Suspense fallback={<GameLoading message="Loading Game Components" />}>
        <div className={`${isViewer ? 'flex flex-col lg:flex-row gap-4 p-4' : ''}`}>
          <div className={isViewer ? "flex-1" : "w-full"}>
            <GamePhase
              room={room}
              gameState={currentGameState}
              onQuitGame={handleQuitGame}
            />
          </div>

          {isViewer && (
            <div className="w-full lg:w-80">
              {React.createElement(React.lazy(() => import("../Components/ViewerPanel")), {
                isStreamer: false,
                gameSession: room
              })}
            </div>
          )}
        </div>
      </React.Suspense>
    </div>
  );
};

export default GamePage;