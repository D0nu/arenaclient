import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackgroundElements from './LobbyComponents/BackgroundElements';
import JoinGamePopup from './LobbyComponents/JoinGamePopUp.jsx';

import LobbyHeader from './LobbyComponents/LobbyHeader.jsx';
import ActionButtons from './LobbyComponents/ActionButtons.jsx';
import CreateGamePopup from './LobbyComponents/CreateGamePopup.jsx';
import UserStatus from './LobbyComponents/UserStatus.jsx';
import StatsFooter from './LobbyComponents/StatsFooter.jsx';
import NotificationBanner from './LobbyComponents/NotificationBanner.jsx';
import LoadingState from './LobbyComponents/LoadingState.jsx';

const Lobby = ({ onJoinGame, setCurrentView }) => {
  const navigate = useNavigate();
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [wager, setWager] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [check, setCheck] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState('');

  const { socket } = useSocket();
  const { user, isAuthenticated, loading } = useAuth();
  
  const hasAttemptedReconnect = useRef(false);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleReconnectToRoom = (roomData) => {
      console.log('🔁 Reconnected to existing room:', roomData);
      hasAttemptedReconnect.current = true;
      navigate(`/room/${roomData.code}`);
    };

    const handleNoRoomFound = () => {
      console.log('ℹ️ No existing room found for user');
      hasAttemptedReconnect.current = true;
    };

    const handleRoomClosed = (data) => {
      console.log('🚫 Room closed by owner:', data);
      setNotification('The room has been closed by the owner');
      setTimeout(() => setNotification(''), 5000);
    };

    const handleRedirectToHome = () => {
      console.log('🏠 Redirecting to home');
      setShowJoinPopup(false);
      setGameCode('');
      setJoinError('');
      setIsJoining(false);
      setIsCreating(false);
    };

    socket.on('room-reconnected', handleReconnectToRoom);
    socket.on('no-room-found', handleNoRoomFound);
    socket.on('room-closed', handleRoomClosed);
    socket.on('redirect-to-home', handleRedirectToHome);

    if (socket.connected && !hasAttemptedReconnect.current) {
      console.log('🔄 Attempting initial room reconnection...');
      socket.emit('reconnect-to-room');
    }

    const handleSocketConnect = () => {
      if (!hasAttemptedReconnect.current) {
        console.log('🔄 Socket connected, attempting room reconnection...');
        socket.emit('reconnect-to-room');
      }
    };

    socket.on('connect', handleSocketConnect);
    socket.emit('get-rooms');
    socket.on('created-rooms', (data) => setRooms(data || []));

    return () => {
      if (socket) {
        socket.off('room-reconnected', handleReconnectToRoom);
        socket.off('created-rooms');
        socket.off('no-room-found', handleNoRoomFound);
        socket.off('room-closed', handleRoomClosed);
        socket.off('redirect-to-home', handleRedirectToHome);
        socket.off('connect', handleSocketConnect);
      }
    };
  }, [socket, isAuthenticated, navigate]);

  const handleWagerChoice = () => {
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    setCheck(true);
  };

  const handleCreateGame = () => {
    if (!socket || !socket.connected) {
      console.error('❌ Socket not available or not connected for creating game');
      setJoinError('Connection lost. Please refresh the page.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }

    setIsCreating(true);
    setJoinError('');

    if (socket) {
      socket.off('room-created');
      socket.off('room-error');
    }

    const handleRoomCreated = (data) => {
      console.log('✅ Room created:', data);
      setIsCreating(false);
      clearTimeout(timeoutId);
      navigate(`/room/${data.room.code}`);
    };

    const handleRoomError = (errorData) => {
      console.error('❌ Room creation error:', errorData);
      setJoinError(errorData.message || 'Failed to create room');
      setIsCreating(false);
      clearTimeout(timeoutId);
    };

    if (socket) {
      socket.once('room-created', handleRoomCreated);
      socket.once('room-error', handleRoomError);

      socket.emit('create-room', {
        wager: wager,
        mode: 'question-vs-game', 
        playerCount: 2,
        topic: 'general',
        difficulty: 'medium',
        rounds: 1
      });
    } else {
      setJoinError('Connection lost. Please refresh the page.');
      setIsCreating(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (socket) {
        socket.off('room-created', handleRoomCreated);
        socket.off('room-error', handleRoomError);
      }
      if (isCreating) {
        setJoinError('Room creation timeout. Please try again.');
        setIsCreating(false);
      }
    }, 10000);
  };

  const handleJoinGame = () => {
    if (!socket) {
      console.error('❌ Socket not available for joining game');
      setJoinError('Connection lost. Please refresh the page.');
      return;
    }

    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    
    if (!gameCode.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    const roomCodeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!roomCodeRegex.test(gameCode)) {
      setJoinError('Please enter a valid room code (e.g., ABCD-1234)');
      return;
    }

    console.log('🎯 Attempting to join room:', {
      inputCode: gameCode,
      trimmedCode: gameCode.trim(),
      formattedCode: gameCode.trim().toUpperCase()
    });

    setIsJoining(true);
    setJoinError('');

    if (socket) {
      socket.off('room-joined');
      socket.off('room-not-found');
      socket.off('room-full');
      socket.off('room-error');
    }

    const handleRoomJoined = (data) => {
      console.log('✅ Successfully joined room:', data);
      setIsJoining(false);
      clearTimeout(timeoutId);
      setShowJoinPopup(false);
      setGameCode('');
      navigate(`/room/${data.room.code}`);
    };

    const handleRoomNotFound = () => {
      console.log('❌ Room not found for code:', gameCode);
      setJoinError('Room not found! Please check the code and try again.');
      setIsJoining(false);
      clearTimeout(timeoutId);
    };

    const handleRoomFull = () => {
      console.log('❌ Room is full:', gameCode);
      setJoinError('This room is full! Try another room.');
      setIsJoining(false);
      clearTimeout(timeoutId);
    };

    const handleRoomError = (errorData) => {
      console.error('❌ Room error:', errorData);
      setJoinError(errorData.message || 'Failed to join room. Please try again.');
      setIsJoining(false);
      clearTimeout(timeoutId);
    };

    if (socket) {
      socket.once('room-joined', handleRoomJoined);
      socket.once('room-not-found', handleRoomNotFound);
      socket.once('room-full', handleRoomFull);
      socket.once('room-error', handleRoomError);

      console.log('🚀 Emitting join-room event with:', { 
        roomCode: gameCode.trim().toUpperCase() 
        // OR try: code: gameCode.trim().toUpperCase()
      });
      
      socket.emit('join-room', { 
        roomCode: gameCode.trim().toUpperCase() 
      });
    } else {
      setJoinError('Connection lost. Please refresh the page.');
      setIsJoining(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (socket) {
        socket.off('room-joined', handleRoomJoined);
        socket.off('room-not-found', handleRoomNotFound);
        socket.off('room-full', handleRoomFull);
        socket.off('room-error', handleRoomError);
      }
      if (isJoining) {
        setJoinError('Connection timeout. Please try again.');
        setIsJoining(false);
      }
    }, 10000);
  };

  const handleViewGames = () => {
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    navigate('/view-games');  
  };

  const handleGameCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 4) {
      value = value.slice(0, 4) + '-' + value.slice(4, 8);
    }
    
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
    setGameCode(value);
    setJoinError('');
  };

  const handleClosePopup = () => {
    setShowJoinPopup(false);
    setGameCode('');
    setJoinError('');
    setIsJoining(false);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      <BackgroundElements />
      
      <NotificationBanner notification={notification} />

      <JoinGamePopup
        rooms={rooms}
        showJoinPopup={showJoinPopup}
        gameCode={gameCode}
        joinError={joinError}
        isJoining={isJoining}
        onGameCodeChange={handleGameCodeChange}
        onJoinGame={handleJoinGame}
        onClosePopup={handleClosePopup}
      />

      <CreateGamePopup
        check={check}
        wager={wager}
        coinBalance={user ? user.coinBalance : 0}
        setWager={setWager}
        isCreating={isCreating}
        onClosePopup={() => setCheck(false)}
        onCreateGame={handleCreateGame}
      />

      <div className="max-w-lg w-full relative z-10">
        <LobbyHeader />
        
        <ActionButtons
          isAuthenticated={isAuthenticated}
          isCreating={isCreating}
          onCreateGame={handleWagerChoice}
          onShowJoinPopup={() => setShowJoinPopup(true)}
          onViewGames={handleViewGames}
        />

        <UserStatus user={user} isAuthenticated={isAuthenticated} />
        
        <StatsFooter />
      </div>
    </div>
  );
};

export default Lobby;