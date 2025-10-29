import React from 'react';

const LoadingState = ({ roomCode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">
          {roomCode ? `Joining room ${roomCode}...` : 'Loading room...'}
        </p>
      </div>
    </div>
  );
};

export default LoadingState;