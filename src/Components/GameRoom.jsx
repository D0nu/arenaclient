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
import { useAudioManager } from '../hooks/useAudioManager';

const GameRoom = () => {
  useAudioManager();
  const navigate = useNavigate();
  const { id: roomCode } = useParams();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [room, setRoom] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socketError, setSocketError] = useState(null);

  const hasAttemptedJoin = useRef(false);
  const hasAttemptedReconnect = useRef(false);

  // ✅ MOVED: Calculate these variables BEFORE useEffect
  const isOwner = room?.players?.find(p => p.id === user?.id)?.isOwner || false;
  const currentPlayer = room?.players?.find(p => p.id === user?.id);
  const isRoomFull = room && room.players && room.players.length === room.settings?.playerCount;
  const allPlayersReady = room && room.players && room.players.every(p => p.isReady);
  const canStartGame = isRoomFull && allPlayersReady && isOwner;

  console.log('🔧 Modal Debug: showSettings=', showSettings, 'isOwner=', isOwner);

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
    hasAttemptedJoin.current = true;
  }, []);

  const handleRoomState = useCallback((roomData) => {
    console.log('🏠 Room state received:', roomData);
    setRoom(roomData);
    setIsLoading(false);
    setSocketError(null);
  }, []);

  const handlePlayerJoined = useCallback((playerData) => {
    console.log('👤 Player joined:', playerData);
    if (socket) {
      socket.emit('get-room-state', roomCode);
    }
  }, [socket, roomCode]);

  const handlePlayerLeft = useCallback((data) => {
    console.log('👤 Player left:', data);
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

  const handleGameEnded = useCallback((data) => {
    console.log('🎯 Game ended, resetting room:', data);
    setSocketError(null);
    
    if (socket) {
      socket.emit('get-room-state', roomCode);
    }
  }, [socket, roomCode]);

  const handleRoomReset = useCallback((data) => {
    console.log('🔄 Room reset by server:', data);
    
    if (data.room) {
      const resetRoom = {
        ...data.room,
        status: 'waiting',
        players: data.room.players.map(player => ({
          ...player,
          isReady: false
        }))
      };
      setRoom(resetRoom);
    }
    setSocketError(null);
  }, []);

  const handlePlayerQuitGame = useCallback((data) => {
    console.log('👤 Player quit game:', data);
    setSocketError(`${data.playerName} quit the game`);
    
    // Refresh room state to ensure proper reset
    if (socket) {
      setTimeout(() => {
        socket.emit('get-room-state', roomCode);
      }, 500);
    }
  }, [socket, roomCode]);

  const handleGameEndedCleanup = useCallback((data) => {
    console.log('🔄 Game ended cleanup complete:', data);
    
    if (data.room) {
      const resetRoom = {
        ...data.room,
        status: 'waiting',
        players: data.room.players.map(player => ({
          ...player,
          isReady: false
        }))
      };
      setRoom(resetRoom);
    }
    setSocketError(null);
  }, []);

  // ✅ NEW: Enhanced quit game handlers
  const handleOpponentQuit = useCallback((data) => {
    console.log('🚨 Opponent quit:', data);
    setSocketError(data.message || 'Your opponent quit the game. You win!');
    
    // Force refresh room state
    if (socket) {
      setTimeout(() => {
        socket.emit('get-room-state', roomCode);
      }, 500);
    }
  }, [socket, roomCode]);

  const handlePlayerQuitContinue = useCallback((data) => {
    console.log('🔄 Player quit, game continues:', data);
    setSocketError(data.message || `${data.playerName} quit the game. Game continues.`);
    
    // Refresh room state to show updated player count
    if (socket) {
      setTimeout(() => {
        socket.emit('get-room-state', roomCode);
      }, 500);
    }
  }, [socket, roomCode]);

  const handleGameAlert = useCallback((data) => {
    console.log('📢 Game alert:', data);
    if (data.type === 'player_quit') {
      setSocketError(data.message);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setSocketError(null);
      }, 3000);
    }
  }, []);

  const handleTeamEliminationWin = useCallback((data) => {
    console.log('🏆 Team elimination win:', data);
    setSocketError(data.message || 'Your team wins by elimination!');
    
    // Refresh room state
    if (socket) {
      setTimeout(() => {
        socket.emit('get-room-state', roomCode);
      }, 500);
    }
  }, [socket, roomCode]);

  // ✅ NEW: Handle winnings distribution
  const handleWinningsDistributed = useCallback((data) => {
    console.log('💰 Winnings distributed:', data);
    setSocketError(data.message || `You received ${data.amount} coins!`);
    
    // Clear message after 5 seconds
    setTimeout(() => {
      setSocketError(null);
    }, 5000);
  }, []);

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

    // ✅ FIXED: Check for stale room status
    if (room && room.status === 'starting' && !isLoading) {
      console.log('🔄 Detected stale room status, forcing refresh...');
      socket.emit('get-room-state', roomCode);
    }

    console.log('🎮 GameRoom mounted, roomCode:', roomCode, 'socket connected:', socket.id);
    console.log('🔄 Connection attempts - Join:', hasAttemptedJoin.current, 'Reconnect:', hasAttemptedReconnect.current);

    console.log('🔍 CURRENT ROOM STATE:', {
      status: room?.status,
      players: room?.players?.map(p => ({
        name: p.name,
        isReady: p.isReady,
        isOwner: p.isOwner
      })),
      isRoomFull: isRoomFull,
      allPlayersReady: allPlayersReady
    }); 

    // Register all socket listeners
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
    
    // Enhanced quit game listeners
    socket.on('game-ended', handleGameEnded);
    socket.on('game-ended-cleanup', handleGameEndedCleanup);
    socket.on('room-reset', handleRoomReset);
    socket.on('player-quit-game', handlePlayerQuitGame);
    socket.on('opponent-quit', handleOpponentQuit);
    socket.on('player-quit-continue', handlePlayerQuitContinue);
    socket.on('game-alert', handleGameAlert);
    socket.on('winnings-distributed', handleWinningsDistributed);

    if (!hasAttemptedReconnect.current) {
      console.log('🔄 Attempting room reconnection...');
      socket.emit('reconnect-to-room');
      hasAttemptedReconnect.current = true;
      
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
        socket.off('game-ended', handleGameEnded);
        socket.off('game-ended-cleanup', handleGameEndedCleanup);
        socket.off('room-reset', handleRoomReset);
        socket.off('player-quit-game', handlePlayerQuitGame);
        socket.off('opponent-quit', handleOpponentQuit);
        socket.off('player-quit-continue', handlePlayerQuitContinue);
        socket.off('game-alert', handleGameAlert);
        socket.off('winnings-distributed', handleWinningsDistributed);
      };
    }

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
      socket.off('game-ended', handleGameEnded);
      socket.off('game-ended-cleanup', handleGameEndedCleanup);
      socket.off('room-reset', handleRoomReset);
      socket.off('player-quit-game', handlePlayerQuitGame);
      socket.off('opponent-quit', handleOpponentQuit);
      socket.off('player-quit-continue', handlePlayerQuitContinue);
      socket.off('game-alert', handleGameAlert);
      socket.off('winnings-distributed', handleWinningsDistributed);
    };
  }, [
    socket, 
    user, 
    isConnected, 
    roomCode, 
    handleRoomUpdated,
    handleRoomJoined,
    handleRoomState,
    handlePlayerJoined,
    handlePlayerLeft,
    handleRoomError,
    handleRoomFull,
    handleRoomNotFound,
    handleGameStarted,
    handleRoomClosed,
    handleGameEnded,
    handleRoomReset,
    handlePlayerQuitGame,
    handleGameEndedCleanup,
    handleOpponentQuit,
    handlePlayerQuitContinue,
    handleGameAlert,
    handleTeamEliminationWin,
    handleWinningsDistributed,
    room, 
    isLoading, 
    isRoomFull,
    allPlayersReady
  ]);

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
    
    const isOwner = room.players.find(p => p.id === user.id)?.isOwner;
    if (isOwner) {
      socket.emit('update-room-settings', newSettings);
    } else {
      console.error('❌ Non-owner tried to update settings');
    }
  }, [socket, room, user]);

  // ✅ UPDATED: Toggle ready function - now works as a toggle
  const toggleReady = useCallback(() => {
    if (!socket || !room) return;
    
    // Check if room is full before allowing ready
    const isRoomFull = room?.players.length === room?.settings.playerCount;
    if (!isRoomFull) {
      setSocketError('Room must be full to ready up');
      return;
    }
    
    console.log('🎯 Toggling ready state');
    socket.emit('toggle-ready', room.code);
  }, [socket, room]);

  const startGame = useCallback(() => {
    if (!socket || !room) return;
    
    const isOwner = room.players.find(p => p.id === user.id)?.isOwner;
    if (!isOwner) {
      setSocketError('Only room owner can start the game');
      return;
    }

    if (room.players.length !== room.settings.playerCount) {
      setSocketError('Room is not full');
      return;
    }

    const allReady = room.players.every(player => player.isReady);
    if (!allReady) {
      setSocketError('Not all players are ready');
      return;
    }

    console.log('🚀 Starting game...');
    socket.emit('start-game-from-room', room.code);
  }, [socket, room, user]);

  // Enhanced leaveRoom function with game quit option
  const leaveRoom = useCallback((isGameQuit = false) => {
    if (socket && room) {
      if (isGameQuit) {
        console.log('🎮 Quitting game and leaving room');
        socket.emit('quit-game', room.code);
      } else {
        console.log('🚪 Leaving room normally');
        socket.emit('leave-room', room.code);
      }
    }
    navigate('/');
  }, [socket, room, navigate]);

  // Function to handle returning to room after game
  const returnToRoomAfterGame = useCallback(() => {
    if (socket && room) {
      console.log('🔄 Returning to room after game');
      socket.emit('return-to-room-after-game', room.code);
      // Force refresh room state
      socket.emit('get-room-state', room.code);
    }
  }, [socket, room]);

  // Enhanced quit function specifically for game quitting
  const quitGame = useCallback(() => {
    leaveRoom(true);
  }, [leaveRoom]);

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

  const handleShowSettings = useCallback(() => {
    console.log('🎯 Opening settings modal');
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    console.log('🎯 Closing settings modal');
    setShowSettings(false);
  }, []);

  // ✅ NEW: Auto-clear error messages after timeout
  useEffect(() => {
    if (socketError) {
      const timer = setTimeout(() => {
        setSocketError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [socketError]);

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
        <RoomSettingsPanel 
          user={user}
          isOwner={isOwner}
          setShowSettings={handleShowSettings}
          copyRoomCode={copyRoomCode}
          room={room}
          currentPlayer={currentPlayer}
        />

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
            <div className={`p-4 rounded-2xl border backdrop-blur-sm ${
              socketError.includes('win') || socketError.includes('coins') 
                ? 'bg-green-600/30 text-green-300 border-green-500' 
                : socketError.includes('quit') 
                ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500'
                : 'bg-red-600/30 text-red-300 border-red-500'
            }`}>
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {socketError.includes('win') || socketError.includes('coins') ? '🎉' : 
                   socketError.includes('quit') ? '⚠️' : '❌'}
                </span>
                <span>{socketError}</span>
                <button 
                  onClick={() => setSocketError(null)}
                  className="ml-auto hover:text-white transition-colors"
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

          {/* ✅ UPDATED: Mobile Quick Actions with Unready */}
          <div className="lg:hidden bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border-2 border-purple-500">
            <div className="flex flex-col space-y-3">
              <button
                onClick={toggleReady}
                disabled={!isRoomFull}
                className={`w-full py-3 px-4 rounded-xl transition-all font-semibold ${
                  !isRoomFull 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : currentPlayer?.isReady
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                }`}
              >
                {!isRoomFull ? '⏳ Wait for Players' : 
                 currentPlayer?.isReady ? '❌ Unready' : '✅ Ready Up'}
              </button>

              {isOwner && (
                <button
                  onClick={startGame}
                  disabled={!canStartGame}
                  className={`w-full py-3 px-4 rounded-xl transition-all font-semibold ${
                    canStartGame 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {canStartGame ? '🚀 Start Game' : '⏳ Waiting for Ready...'}
                </button>
              )}

              {/* ✅ NEW: Quit Game Button for mobile */}
              {room?.status === 'starting' && (
                <button
                  onClick={() => leaveRoom(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all"
                >
                  🚪 Quit Game
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