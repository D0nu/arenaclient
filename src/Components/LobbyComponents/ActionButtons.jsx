import React from 'react';

const ActionButtons = ({
  isAuthenticated,
  isCreating,
  onCreateGame,
  onShowJoinPopup,
  onViewGames
}) => {
  return (
    <div className="space-y-6 animate-fade-in-up animation-delay-600">
      {/* Create Game Button */}
      <button
        onClick={onCreateGame}
        disabled={isCreating}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 disabled:opacity-50 text-white font-bold py-8 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl border-2 border-purple-500 hover:border-purple-300 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center space-x-4">
          {isCreating ? (
            <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin"></div>
          ) : (
            <span className="text-3xl group-hover:scale-110 transition-transform duration-300 animate-wiggle">🎮</span>
          )}
          <div className="text-left">
            <div className="text-2xl">
              {isCreating ? 'Creating Room...' : 'Create Game'}
            </div>
            <div className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              {isAuthenticated ? 'Start your own battle' : 'Sign up to create games'}
            </div>
          </div>
        </div>
        {!isCreating && (
          <div className="absolute top-3 right-4 text-xs bg-purple-500 px-2 py-1 rounded-full animate-pulse">
            NEW
          </div>
        )}
      </button>

      {/* Join Game Button */}
      <button
        onClick={onShowJoinPopup}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-8 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl border-2 border-green-500 hover:border-green-300 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center space-x-4">
          <span className="text-3xl group-hover:scale-110 transition-transform duration-300 animate-wiggle">🚀</span>
          <div className="text-left">
            <div className="text-2xl">Join Game</div>
            <div className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              Enter code to join friends
            </div>
          </div>
        </div>
      </button>

      {/* View Games Button */}
      <button
        onClick={onViewGames}
        className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 hover:from-orange-700 hover:via-red-700 hover:to-pink-700 text-white font-bold py-8 px-8 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:shadow-2xl border-2 border-orange-500 hover:border-orange-300 shadow-lg"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        <div className="relative flex items-center justify-center space-x-4">
          <span className="text-3xl group-hover:scale-110 transition-transform duration-300 animate-wiggle">👀</span>
          <div className="text-left">
            <div className="text-2xl">View Games</div>
            <div className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">
              Watch live battles & tournaments
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ActionButtons;