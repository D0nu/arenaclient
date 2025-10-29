// GamePage.jsx - UPDATED WITH BEAUTIFUL LOADING
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useGame } from "../Context/GameContext";
import GameLoading from '../Components/GameLoading';

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

  // ✅ FIXED: Fetch game + room state on mount
  useEffect(() => {
    if (!socket || !user || !roomCode) {
      console.log('❌ Missing requirements:', { socket: !!socket, user: !!user, roomCode });
      return;
    }

    console.log(`🎮 GamePage mounted for room: ${roomCode}, user: ${user.name}`);

    // Request both room and game state
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

      // ✅ FIXED: Check if user is a player in the room
      const isPlayer = roomData.players.some(p => p.id === user._id.toString());
      setIsViewer(!isPlayer);

      console.log(`👤 User ${user.name} is ${isPlayer ? 'player' : 'viewer'}`);

      // If not a player, join as viewer
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
      console.log('🏁 Game ended:', data);
      setGameState(prev => ({ ...prev, phase: 'round-completed', gameEnded: true }));
      setTimeout(() => {
        navigate(`/room/${roomCode}`);
      }, 5000);
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

    // Register all listeners
    socket.on('game-state', handleGameState);
    socket.on('room-state', handleRoomState);
    socket.on('game-state-updated', handleGameStateUpdated);
    socket.on('game-started', handleGameStarted);
    socket.on('game-ended', handleGameEnded);
    socket.on('room-closed', handleRoomClosed);
    socket.on('game-error', handleGameError);
    socket.on('room-not-found', handleRoomNotFound);

    // ✅ FIXED: Timeout for loading state
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

  // --- Handle quitting the game ---
  const handleQuitGame = () => {
    if (socket && roomCode) {
      console.log('🚪 User quitting game:', roomCode);
      socket.emit('leave-game', roomCode);
    }
    navigate(`/room/${roomCode}`);
  };

    <GameLoading />

  // ✅ BEAUTIFUL ERROR COMPONENT
  const GameError = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Error Icon */}
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

  // ✅ Show loading state while initial data is being fetched
  if (loading) {
    return <GameLoading />;
  }

  // ✅ Show error state
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

  // ✅ Handle case when room is not found
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

  // ✅ FIXED: Derive current game state with proper fallback
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
    isViewer
  });

  // Import GamePhase component (make sure this path is correct)
  const GamePhase = React.lazy(() => import('../Components/GamePhase'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <React.Suspense fallback={<GameLoading message="Loading Game Components" />}>
        <div className={`${isViewer ? 'flex flex-col lg:flex-row gap-4 p-4' : ''}`}>
          {/* Main Game Area */}
          <div className={isViewer ? "flex-1" : "w-full"}>
            <GamePhase
              room={room}
              gameState={currentGameState}
              onQuitGame={handleQuitGame}
            />
          </div>

          {/* Viewer Panel - Only show for viewers */}
          {isViewer && (
            <div className="w-full lg:w-80">
              {/* Import ViewerPanel component */}
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