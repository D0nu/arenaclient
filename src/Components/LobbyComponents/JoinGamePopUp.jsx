import React from 'react';

const JoinGamePopup = ({
  rooms,
  showJoinPopup,
  gameCode,
  joinError,
  isJoining,
  onGameCodeChange,
  onJoinGame,
  onClosePopup
}) => {
  if (!showJoinPopup) return null;
  const roomCodeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border-2 border-purple-500 shadow-2xl transform animate-scale-in">
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Join Game</h3>
          <p className="text-gray-300">Enter the game code from your friend</p>
        </div>
        
        <div className="space-y-4 mt-6">
          {/* Room Code Input */}
          <div className="relative">
            <input
              type="text"
              value={gameCode}
              onChange={onGameCodeChange}
              placeholder="ABCD-1234"
              className="w-full bg-gray-700 border-2 border-gray-600 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500 focus:ring-opacity-30 text-center text-lg font-mono tracking-widest transition-all duration-300"
              autoFocus
              maxLength={9}
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <span className="text-gray-400">#</span>
            </div>
          </div>

          {/* Error Message */}
          {joinError && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3">
              <p className="text-red-300 text-sm text-center">{joinError}</p>
            </div>
          )}

          {/* Example Code Hint */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Format: <span className="font-mono text-purple-300">XXXX-XXXX</span>
            </p>
          </div>
          { gameCode && <div>{!roomCodeRegex.test(gameCode) ? 'Enter valid game code' : !rooms.find((r) => r.code === gameCode)? 'No room found with this game-code' : rooms.find((r) => r.settings.wager > 0) && `This is a wager room with ${ rooms.find((r) => r.settings.wager > 0).settings.wager} coins on the line`}</div>}
          
          <div className="flex gap-4 pt-2">
            <button
              onClick={onClosePopup}
              disabled={isJoining}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none border-2 border-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={onJoinGame}
              disabled={!gameCode.trim() || isJoining || gameCode.length !== 9}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:hover:scale-100"
            >
              {isJoining ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  Joining...
                </div>
              ) : (
                'Join Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePopup;