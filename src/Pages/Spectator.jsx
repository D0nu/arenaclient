// SpectatorPage.jsx - COMPLETE CORRECTED WITH REAL SCREEN MIRRORING
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import ViewerPanel from '../Components/ViewerPanel';
import GameContentView from '../Components/GameContentView';
import RealPlayerScreen from '../Components/RealPlayerScreen';

const SpectatorPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [gameState, setGameState] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // State for tracking player actions and roles
  const [playerActions, setPlayerActions] = useState({});
  const [playerRoles, setPlayerRoles] = useState({});

  useEffect(() => {
    if (!socket || !roomCode) return;

    console.log(`👁️ Spectator joining room: ${roomCode}`);

    // Join as spectator
    socket.emit('join-as-viewer', { roomCode });

    // Get game state
    socket.emit('get-game-state', roomCode);
    socket.emit('get-room-state', roomCode);

    const handleGameState = (state) => {
      console.log('🎮 Spectator received game state:', state);
      setGameState(state);
      setLoading(false);
      
      // Set player roles from game state if available
      if (state.playerRoles) {
        setPlayerRoles(state.playerRoles);
      }
      
      // Auto-select first player if none selected
      if (!selectedPlayer) {
        const allPlayers = getAllPlayersFromState(state);
        if (allPlayers.length > 0) {
          setSelectedPlayer(allPlayers[0].id);
        }
      }
    };

    const handleRoomState = (roomData) => {
      console.log('🎮 Spectator received room state:', roomData);
      setRoom(roomData);
    };

    const handleGameStateUpdated = (updatedState) => {
      console.log('🔄 Spectator game state updated:', updatedState);
      setGameState(updatedState);
      
      // Update player roles if included
      if (updatedState.playerRoles) {
        setPlayerRoles(updatedState.playerRoles);
      }
    };

    const handleGameEnded = () => {
      console.log('🏁 Game ended, redirecting spectator');
      setError('This game has ended');
      setTimeout(() => navigate('/view-games'), 5000);
    };

    const handleRoomClosed = () => {
      setError('This room has been closed');
      setTimeout(() => navigate('/view-games'), 3000);
    };

    const handleGameError = (errorData) => {
      setError(errorData.message);
      setLoading(false);
    };

    // PLAYER SCREEN MIRRORING EVENT LISTENERS
    const handlePlayerScreenUpdate = (data) => {
      console.log('🖥️ Player screen update:', data);
      setPlayerActions(prev => ({
        ...prev,
        [data.playerId]: {
          ...data,
          timestamp: data.timestamp || Date.now()
        }
      }));
    };

    const handlePlayerRolesAssigned = (data) => {
      console.log('🎯 Player roles assigned:', data.playerRoles);
      setPlayerRoles(data.playerRoles);
    };

    // Game content listeners
    const handleQuestionSelected = (data) => {
      console.log('❓ Question selected:', data);
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        selectedTopic: data.topic,
        phase: 'question-round'
      }));
    };

    const handleGameSelected = (data) => {
      console.log('🎮 Game selected:', data);
      setGameState(prev => ({
        ...prev,
        currentGame: data.game,
        phase: 'game-round'
      }));
    };

    const handlePlayerAnswered = (data) => {
      console.log('📝 Player answered:', data);
      setGameState(prev => ({
        ...prev,
        playerAnswers: {
          ...prev.playerAnswers,
          [data.playerId]: data.answerIndex
        }
      }));
    };

    const handleGameProgress = (progress) => {
      console.log('📊 Game progress:', progress);
      setGameState(prev => ({
        ...prev,
        gameProgress: progress
      }));
    };

    // Handle round started events
    const handleRoundStarted = (data) => {
      console.log('🚀 Round started:', data);
      setGameState(prev => ({
        ...prev,
        phase: data.choice === 'questions' ? 'question-round' : 'game-round',
        selectedTopic: data.topic,
        selectedGame: data.game,
        roundTimeLeft: data.timeLeft,
        roundStarted: true
      }));
      
      // Update player roles if included in round start
      if (data.playerRoles) {
        setPlayerRoles(data.playerRoles);
      }
    };

    // Handle choice made events
    const handleChoiceMade = (data) => {
      console.log('🎯 Choice made:', data);
      setGameState(prev => ({
        ...prev,
        choice: data.choice,
        selectedTopic: data.topic,
        selectedGame: data.game,
        teamRoundTypes: data.teamRoundTypes,
        phase: 'round-started',
        roundTimeLeft: data.timeLeft
      }));
      
      // Update player roles if included
      if (data.playerRoles) {
        setPlayerRoles(data.playerRoles);
      }
    };

    // Register all listeners
    socket.on('game-state', handleGameState);
    socket.on('room-state', handleRoomState);
    socket.on('game-state-updated', handleGameStateUpdated);
    socket.on('game-ended', handleGameEnded);
    socket.on('room-closed', handleRoomClosed);
    socket.on('game-error', handleGameError);
    
    // Register player screen mirroring listeners
    socket.on('player-screen-update', handlePlayerScreenUpdate);
    socket.on('player-roles-assigned', handlePlayerRolesAssigned);
    
    // Register game content listeners
    socket.on('question-selected', handleQuestionSelected);
    socket.on('game-selected', handleGameSelected);
    socket.on('player-answered', handlePlayerAnswered);
    socket.on('game-progress', handleGameProgress);
    socket.on('round-started', handleRoundStarted);
    socket.on('choice-made', handleChoiceMade);

    return () => {
      // Clean up all listeners
      socket.off('game-state', handleGameState);
      socket.off('room-state', handleRoomState);
      socket.off('game-state-updated', handleGameStateUpdated);
      socket.off('game-ended', handleGameEnded);
      socket.off('room-closed', handleRoomClosed);
      socket.off('game-error', handleGameError);
      
      // Clean up player screen mirroring listeners
      socket.off('player-screen-update', handlePlayerScreenUpdate);
      socket.off('player-roles-assigned', handlePlayerRolesAssigned);
      
      // Clean up game content listeners
      socket.off('question-selected', handleQuestionSelected);
      socket.off('game-selected', handleGameSelected);
      socket.off('player-answered', handlePlayerAnswered);
      socket.off('game-progress', handleGameProgress);
      socket.off('round-started', handleRoundStarted);
      socket.off('choice-made', handleChoiceMade);
    };
  }, [socket, roomCode, navigate, selectedPlayer]);

  // Get all players from game state
  const getAllPlayersFromState = (state) => {
    if (!state?.teams) return [];
    return [...(state.teams.A || []), ...(state.teams.B || [])];
  };

  // Get what a player is currently doing
  const getPlayerCurrentView = (playerId) => {
    const playerRole = playerRoles[playerId];
    const gameMode = gameState?.mode;
    
    return {
      mode: playerRole || gameMode,
      role: playerRole,
      isAnsweringQuestions: playerRole === 'questions' || gameMode === 'question-vs-question',
      isPlayingGames: playerRole === 'games' || gameMode === 'game-vs-game',
      isWaiting: !playerRole || playerRole === 'waiting'
    };
  };

  // Get selected player data
  const getSelectedPlayerData = () => {
    const players = getAllPlayersFromState(gameState);
    const player = players.find(p => p.id === selectedPlayer);
    
    if (!player) return null;
    
    const playerView = getPlayerCurrentView(selectedPlayer);
    
    return {
      ...player,
      currentView: playerView
    };
  };

  const players = getAllPlayersFromState(gameState);
  const selectedPlayerData = getSelectedPlayerData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Joining as Spectator...</p>
          <p className="text-gray-400 text-sm mt-2">Loading game {roomCode}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500 rounded-2xl p-8 max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Spectator Error</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => navigate('/view-games')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Back to Live Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Game Not Found</h2>
          <p className="text-gray-300 mb-6">Unable to spectate this game.</p>
          <button
            onClick={() => navigate('/view-games')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Back to Live Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => navigate('/view-games')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Live Games
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold">👁️ Spectating Game</h1>
            <p className="text-gray-400 text-sm">
              Room: {roomCode} • {players.length} Player{players.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm border border-red-500/30">
            🔴 LIVE
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Game View (70%) */}
          <div className="lg:flex-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
              {/* Game Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {gameState.mode === 'question-vs-game' ? 'Q&A vs Game' :
                     gameState.mode === 'question-vs-question' ? 'Q&A Only' : 
                     'Games Only'}
                  </h2>
                  <p className="text-gray-400">
                    Phase: <span className="text-purple-400 capitalize">{gameState.phase}</span>
                  </p>
                  {gameState.selectedTopic && (
                    <p className="text-gray-400 text-sm mt-1">
                      Topic: <span className="text-blue-400">{gameState.selectedTopic}</span>
                    </p>
                  )}
                  {gameState.selectedGame && (
                    <p className="text-gray-400 text-sm mt-1">
                      Game: <span className="text-green-400">{gameState.selectedGame}</span>
                    </p>
                  )}
                </div>
                
                {/* Timer */}
                {gameState.roundTimeLeft > 0 && (
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-white">
                      {Math.floor(gameState.roundTimeLeft / 60)}:
                      {(gameState.roundTimeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-purple-200 text-sm">Time Left</div>
                  </div>
                )}
              </div>

              {/* Player Selection */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Select Player to Watch:</h3>
                <div className="flex flex-wrap gap-2">
                  {players.map((player) => {
                    const playerView = getPlayerCurrentView(player.id);
                    const isSelected = selectedPlayer === player.id;
                    
                    return (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-2 border-purple-400'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <span>{player.avatar}</span>
                        <span>{player.name}</span>
                        <span className="ml-2 text-xs opacity-75">(Team {player.team})</span>
                        
                        {/* Player Role Indicator */}
                        {playerView.role && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            playerView.isAnsweringQuestions 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : playerView.isPlayingGames
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>
                            {playerView.isAnsweringQuestions ? '📝 Questions' : 
                             playerView.isPlayingGames ? '🎮 Games' : '⏳ Waiting'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Game Content - REAL SCREEN MIRRORING */}
              <div className="bg-black/40 rounded-xl p-6 border-2 border-gray-700 min-h-96">
                {/* Phase Indicator */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center bg-purple-500/20 border border-purple-500/50 rounded-full px-4 py-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                    <span className="text-purple-300 font-semibold capitalize">
                      {gameState.phase.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* REAL PLAYER SCREEN MIRRORING */}
                {selectedPlayerData ? (
                  <RealPlayerScreen 
                    player={selectedPlayerData}
                    gameState={gameState}
                    playerActions={playerActions}
                  />
                ) : (
                  // Fallback when no player is selected
                  <GameContentView gameState={gameState} selectedPlayer={selectedPlayerData} />
                )}

                {/* Fallback for phases without specific content */}
                {!selectedPlayerData && !gameState.currentQuestion && !gameState.currentGame && (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">
                        {gameState.phase === 'die-roll' && '🎲'}
                        {gameState.phase === 'choice' && '🎯'}
                        {gameState.phase === 'lobby' && '👥'}
                        {gameState.phase === 'random-selection' && '🔀'}
                        {gameState.phase === 'round-completed' && '🏆'}
                        {!['die-roll', 'choice', 'lobby', 'random-selection', 'round-completed'].includes(gameState.phase) && '🎮'}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                        {gameState.phase.replace('-', ' ')} Phase
                      </h3>
                      <p className="text-gray-300">
                        {gameState.phase === 'die-roll' && 'Players are rolling dice to determine who chooses first'}
                        {gameState.phase === 'choice' && `${gameState.winner?.name || 'Winner'} is choosing the next challenge`}
                        {gameState.phase === 'lobby' && 'Waiting for game to start...'}
                        {gameState.phase === 'random-selection' && 'Randomly selecting game content...'}
                        {gameState.phase === 'round-completed' && 'Round completed! Check scores below'}
                        {!['die-roll', 'choice', 'lobby', 'random-selection', 'round-completed'].includes(gameState.phase) && 'Waiting for action...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Scores */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-400">Round</p>
                  <p className="text-2xl font-bold text-white">{gameState.currentRound || 1}</p>
                </div>
                
                {gameState.mode === 'question-vs-game' ? (
                  <>
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border-2 border-blue-500">
                      <p className="text-gray-400">Team A</p>
                      <p className="text-2xl font-bold text-blue-400">{gameState.scores?.A || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl p-4 border-2 border-red-500">
                      <p className="text-gray-400">Team B</p>
                      <p className="text-2xl font-bold text-red-400">{gameState.scores?.B || 0}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border-2 border-blue-500">
                      <p className="text-gray-400">Top Score</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {Math.max(...Object.values(gameState.playerScores || {0: 0}))}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 border-2 border-green-500">
                      <p className="text-gray-400">Players</p>
                      <p className="text-2xl font-bold text-green-400">{players.length}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Viewer Panel (30%) */}
          <div className="lg:w-80">
            <ViewerPanel
              isStreamer={false}
              gameSession={room}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={setSelectedPlayer}
              playerRoles={playerRoles}
              playerActions={playerActions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectatorPage;