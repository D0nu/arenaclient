import React from 'react'

const GameLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Starting Game</h2>
        <p className="text-gray-400">Preparing your gaming experience...</p>
      </div>
    </div>
  );
};

export default GameLoading;