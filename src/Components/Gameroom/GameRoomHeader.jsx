import React from 'react';

const GameRoomHeader = ({ 
  roomCode, 
  room, 
  isOwner, 
  canStartGame, 
  isRoomFull, 
  currentPlayer, 
  leaveRoom, 
  closeRoom,
  startGame, 
  toggleReady,
  copyRoomCode 
}) => {
  
  // ✅ ADDED: Safety check and ensure proper state after game
  if (!room || room.status === 'in-game') {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-500">
        <div className="text-center py-4">
          <div className="w-8 h-8 border-t-2 border-green-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Game in progress...</p>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Ready button should NEVER be disabled when player is ready (so they can unready)
  // Only disable if room isn't full AND player isn't ready yet
  const readyButtonDisabled = !isRoomFull && !currentPlayer?.isReady;
  
  // ✅ KEEP ORIGINAL: Start button logic - trust the backend's canStartGame prop
  const startButtonDisabled = !canStartGame;

  // ✅ FIXED: Better button text logic
  const getReadyButtonText = () => {
    if (!isRoomFull && !currentPlayer?.isReady) {
      return '⏳ Wait for Players';
    }
    if (currentPlayer?.isReady) {
      return '❌ Unready';
    }
    return '✅ Ready Up';
  };

  const getStartButtonText = () => {
    if (!isRoomFull) {
      return '⏳ Need More Players';
    }
    if (!canStartGame) {
      return '⏳ Waiting for Ready...';
    }
    return '🚀 Start Game';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-500">
      <div className="flex flex-col gap-4 justify-between items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-white">Match Room</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-gray-400">Room Code:</span>
            <span className="text-2xl font-mono text-yellow-400">{roomCode}</span>
            <button
              onClick={copyRoomCode}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
            >
              📋 Copy
            </button>
          </div>
        </div>
        
        <div className="flex space-x-4">
          {/* Room Owner gets Close Room button */}
          {isOwner ? (
            <button
              onClick={closeRoom}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center"
            >
              🚫 Close Room
            </button>
          ) : (
            <button
              onClick={leaveRoom}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              ← Leave Room
            </button>
          )}
          
          {isOwner ? (
            <>
              {/* ✅ FIXED: Owner's Ready/Unready Toggle Button - Always clickable when ready */}
              <button
                onClick={toggleReady}
                disabled={readyButtonDisabled}
                className={`font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 ${
                  readyButtonDisabled 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : currentPlayer?.isReady
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                }`}
              >
                {getReadyButtonText()}
              </button>
              
              {/* Owner's Start Game Button - TRUST BACKEND PROP */}
              <button
                onClick={startGame}
                disabled={startButtonDisabled}
                className={`font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 ${
                  startButtonDisabled 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' 
                }`}
              >
                {getStartButtonText()}
              </button>
            </>
          ) : (
            // ✅ FIXED: Non-owner Ready/Unready Toggle Button - Always clickable when ready
            <button
              onClick={toggleReady}
              disabled={readyButtonDisabled}
              className={`font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-105 ${
                readyButtonDisabled 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : currentPlayer?.isReady
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
              }`}
            >
              {getReadyButtonText()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoomHeader;