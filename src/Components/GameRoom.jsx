import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import GameRoomHeader from './Gameroom/GameRoomHeader';
import PlayerArea from './Gameroom/PlayerArea';
import RoomSettingsPanel from './Gameroom/RoomSettingsPanel';
import StatusMessages from './Gameroom/StatusMessages';
import MatchSettingsModal from './Gameroom/MatchSettingsModal';
import LoadingState from './Gameroom/LoadingState';
import ConnectionError from './Gameroom/ConnectionError';
import CloseRoomModal from './Gameroom/CloseRoomModal';

const GameRoom = () => {
  const navigate = useNavigate();
  const { id: roomCode } = useParams();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socketError, setSocketError] = useState(null);

  // ✅ FIX: Add refs to track initial connection attempts
  const hasAttemptedJoin = useRef(false);
  const hasAttemptedReconnect = useRef(false);

  // Debug logs
  console.log('🔧 Modal Debug: showSettings=', showSettings, 'isOwner=', room?.players?.find(p => p.id === user?.id)?.isOwner);

  // ✅ FIXED: Stable callback functions for socket events
  const handleRoomUpdated = useCallback((roomData) => {
    console.log('🔄 Room updated:', roomData);
    setRoom(roomData);
    setIsLoading(false);
    setSocketError(null);
  }, []);

  const handleRoomJoined = useCallback((data) => {
    console.log('✅ Room joined:', data);
    setRoom(data.room);
    setIsLoading(false);
    setSocketError(null);
    hasAttemptedJoin.current = true; // Mark as joined
  }, []);

  const handleRoomState = useCallback((roomData) => {
    console.log('🏠 Room state received:', roomData);
    setRoom(roomData);
    setIsLoading(false);
    setSocketError(null);
  }, []);

  const handlePlayerJoined = useCallback((playerData) => {
    console.log('👤 Player joined:', playerData);
    // Just update state, don't re-join room
    if (socket) {
      socket.emit('get-room-state', roomCode);
    }
  }, [socket, roomCode]);

  const handlePlayerLeft = useCallback((data) => {
    console.log('👤 Player left:', data);
    // Just update state, don't re-join room
    if (socket) {
      socket.emit('get-room-state', roomCode);
    }
  }, [socket, roomCode]);

  const handleRoomError = useCallback((error) => {
    console.error('❌ Room error:', error);
    setSocketError(error.message);
    setIsLoading(false);
  }, []);

  const handleRoomClosed = useCallback((data) => {
    console.log('🚪 Room closed successfully:', data);
    // Navigate back to home when room is closed
    navigate('/');
  }, [navigate]);

  const handleRoomFull = useCallback(() => {
    console.log('❌ Room is full');
    setSocketError('This room is full! Please try another room.');
    setIsLoading(false);
  }, []);

  const handleRoomNotFound = useCallback(() => {
    console.log('❌ Room not found');
    setSocketError('Room not found! The room may have expired or the code is incorrect.');
    setIsLoading(false);
    setTimeout(() => navigate('/'), 2000);
  }, [navigate]);

  const handleGameStarted = useCallback((gameData) => {
    console.log('🎯 Game started:', gameData);
    navigate(`/room/${roomCode}/game`, { state: { gameData } });
  }, [navigate, roomCode]);

  // ✅ FIXED: Socket connection and event setup - REMOVED room from dependencies
  useEffect(() => {
    if (!socket || !user) {
      console.log('❌ Waiting for socket or user...');
      return;
    }

    if (!isConnected) {
      console.log('❌ Socket not connected, waiting...');
      setSocketError('Connecting to server...');
      return;
    }

    console.log('🎮 GameRoom mounted, roomCode:', roomCode, 'socket connected:', socket.id);
    console.log('🔄 Connection attempts - Join:', hasAttemptedJoin.current, 'Reconnect:', hasAttemptedReconnect.current);

    // Register event listeners
    socket.on('room-updated', handleRoomUpdated);
    socket.on('room-joined', handleRoomJoined);
    socket.on('room-state', handleRoomState);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('player-left', handlePlayerLeft);
    socket.on('room-error', handleRoomError);
    socket.on('room-full', handleRoomFull);
    socket.on('room-not-found', handleRoomNotFound);
    socket.on('game-started', handleGameStarted);
    socket.on('room-closed', handleRoomClosed);


    // ✅ FIX: Only attempt reconnection/join ONCE when component mounts
    if (!hasAttemptedReconnect.current) {
      console.log('🔄 Attempting room reconnection...');
      socket.emit('reconnect-to-room');
      hasAttemptedReconnect.current = true;
      
      // Set timeout for join attempt only if reconnection fails
      const timeout = setTimeout(() => {
        if (!room && !hasAttemptedJoin.current) {
          console.log('🚀 Attempting to join room via code:', roomCode);
          socket.emit('join-room', { roomCode });
          hasAttemptedJoin.current = true;
        }
      }, 1000);

      return () => {
        console.log('🧹 Cleaning up socket listeners and timeout');
        clearTimeout(timeout);
        socket.off('room-updated', handleRoomUpdated);
        socket.off('room-joined', handleRoomJoined);
        socket.off('room-state', handleRoomState);
        socket.off('player-joined', handlePlayerJoined);
        socket.off('player-left', handlePlayerLeft);
        socket.off('room-error', handleRoomError);
        socket.off('room-full', handleRoomFull);
        socket.off('room-not-found', handleRoomNotFound);
        socket.off('game-started', handleGameStarted);
        socket.off('room-closed', handleRoomClosed);
      };
    }

    // Cleanup without re-joining if already attempted
    return () => {
      console.log('🧹 Cleaning up socket listeners (no re-join)');
      socket.off('room-updated', handleRoomUpdated);
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-state', handleRoomState);
      socket.off('player-joined', handlePlayerJoined);
      socket.off('player-left', handlePlayerLeft);
      socket.off('room-error', handleRoomError);
      socket.off('room-full', handleRoomFull);
      socket.off('room-not-found', handleRoomNotFound);
      socket.off('game-started', handleGameStarted);
      socket.off('room-closed', handleRoomClosed);
    };
  }, [
    socket, 
    user, 
    isConnected, 
    roomCode, 
    // ✅ REMOVED: room dependency to prevent loops
    handleRoomUpdated,
    handleRoomJoined,
    handleRoomState,
    handlePlayerJoined,
    handlePlayerLeft,
    handleRoomError,
    handleRoomFull,
    handleRoomNotFound,
    handleGameStarted,
    handleRoomClosed 
  ]);

  // ✅ FIXED: Action functions
  const copyRoomCode = useCallback(() => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      alert('Room code copied to clipboard!');
    }
  }, [room]);

  const updateGameSettings = useCallback((newSettings) => {
    if (!socket || !room) return;
    
    console.log('💾 Saving new settings:', newSettings);
    setShowSettings(false);
    
    // Only owner can update settings
    const isOwner = room.players.find(p => p.id === user.id)?.isOwner;
    if (isOwner) {
      socket.emit('update-room-settings', newSettings);
    } else {
      console.error('❌ Non-owner tried to update settings');
    }
  }, [socket, room, user]);

  const toggleReady = useCallback(() => {
    if (!socket || !room) return;
    
    // Check if room is full before allowing ready
    const isRoomFull = room?.players.length === room?.settings.playerCount;
    if (!isRoomFull) {
      setSocketError('Room must be full to ready up');
      return;
    }
    
    socket.emit('toggle-ready', room.code);
  }, [socket, room]);

  const startGame = useCallback(() => {
    if (!socket || !room) return;
    
    // Only owner can start game
    const isOwner = room.players.find(p => p.id === user.id)?.isOwner;
    if (!isOwner) {
      setSocketError('Only room owner can start the game');
      return;
    }

    // Check if room is full
    if (room.players.length !== room.settings.playerCount) {
      setSocketError('Room is not full');
      return;
    }

    // Check if all players are ready
    const allReady = room.players.every(player => player.isReady);
    if (!allReady) {
      setSocketError('Not all players are ready');
      return;
    }

    console.log('🚀 Starting game...');
    socket.emit('start-game-from-room', room.code);
  }, [socket, room, user]);

  const leaveRoom = useCallback(() => {
    if (socket && room) {
      socket.emit('leave-room', room.code);
    }
    navigate('/');
  }, [socket, room, navigate]);

  const closeRoom = useCallback(() => {
    if (!socket || !room) return;
    
    const isOwner = room.players.find(p => p.id === user.id)?.isOwner;
    if (!isOwner) {
      setSocketError('Only room owner can close the room');
      return;
    }
    
    setShowCloseConfirm(true);
  }, [socket, room, user]);

    const handleCloseConfirm = useCallback(() => {
    if (!socket || !room) return;
    
    console.log('🚫 Closing room:', room.code);
    socket.emit('close-room', room.code);
    

  }, [socket, room]);

  
  const handleCloseCancel = useCallback(() => {
    setShowCloseConfirm(false);
  }, []);

  // ✅ FIXED: Modal handlers
  const handleShowSettings = useCallback(() => {
    console.log('🎯 Opening settings modal');
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    console.log('🎯 Closing settings modal');
    setShowSettings(false);
  }, []);

  // Derived state
  const isOwner = room?.players?.find(p => p.id === user?.id)?.isOwner || false;
  const currentPlayer = room?.players?.find(p => p.id === user?.id);
  const isRoomFull = room && room.players && room.players.length === room.settings?.playerCount;
  const allPlayersReady = room && room.players && room.players.every(p => p.isReady);
  const canStartGame = isRoomFull && allPlayersReady && isOwner;

  // Show connection states
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Please log in to join a game room</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || socketError) {
    return <ConnectionError socketError={socketError} navigate={navigate} />;
  }

  if (isLoading) {
    return <LoadingState roomCode={roomCode} />;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Failed to load room</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      {/* MODAL - Moved outside the grid for proper z-index */}
      {showSettings && (
        <MatchSettingsModal 
          currentSettings={room?.settings || {}}
          onSave={updateGameSettings}
          onClose={handleCloseSettings}
          isOwner={isOwner}
        />
      )}

      {showCloseConfirm && (
        <CloseRoomModal 
          onConfirm={handleCloseConfirm}
          onCancel={handleCloseCancel}
          isOpen={showCloseConfirm}
        />
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Panel - Settings */}
        <RoomSettingsPanel 
          user={user}
          isOwner={isOwner}
          setShowSettings={handleShowSettings}
          copyRoomCode={copyRoomCode}
          room={room}
          currentPlayer={currentPlayer}
        />

        {/* Right Panel - Game Area */}
        <div className="lg:col-span-3 space-y-6">
          <GameRoomHeader 
            roomCode={room.code}
            room={room}
            isOwner={isOwner}
            canStartGame={canStartGame}
            isRoomFull={isRoomFull}
            currentPlayer={currentPlayer}
            leaveRoom={leaveRoom}
            closeRoom={closeRoom}
            startGame={startGame}
            toggleReady={toggleReady}
            copyRoomCode={copyRoomCode}
          />

          {socketError && (
            <div className="bg-red-600/30 text-red-300 p-4 rounded-2xl border border-red-500 backdrop-blur-sm">
              <div className="flex items-center">
                <span className="text-lg mr-2">⚠️</span>
                <span>{socketError}</span>
                <button 
                  onClick={() => setSocketError(null)}
                  className="ml-auto text-red-200 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <PlayerArea room={room} user={user} />

          <StatusMessages 
            room={room}
            isRoomFull={isRoomFull}
            allPlayersReady={allPlayersReady}
            isOwner={isOwner}
          />

          {/* Quick Actions for Mobile */}
          <div className="lg:hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border-2 border-purple-500">
            <div className="flex flex-col space-y-3">
              <button
                onClick={toggleReady}
                disabled={!isRoomFull}
                className={`w-full py-3 px-4 rounded-xl transition-all ${
                  !isRoomFull 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : currentPlayer?.isReady
                    ? 'bg-green-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                }`}
              >
                {!isRoomFull ? 'Wait for Players' : 
                 currentPlayer?.isReady ? '✅ Ready!' : '🎯 Get Ready'}
              </button>

              {isOwner && (
                <button
                  onClick={startGame}
                  disabled={!canStartGame}
                  className={`w-full py-3 px-4 rounded-xl transition-all ${
                    canStartGame 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canStartGame ? '🚀 Start Game' : 'Waiting for Ready...'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;