import React from 'react';

const UserStatus = ({ user, isAuthenticated }) => {
  return (
    <div className="mt-12 text-center animate-fade-in-up animation-delay-800">
      <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-6 border border-gray-700 backdrop-blur-sm hover:bg-opacity-70 transition-all duration-300">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500 animate-ping' : 'bg-orange-500'}`}></div>
          <p className="text-gray-300 text-lg">
            {isAuthenticated ? (
              <span className="text-green-400 font-semibold">
                Welcome back, {user?.name}! Ready to play!
              </span>
            ) : (
              <span className="text-orange-400">Sign in to create games</span>
            )}
          </p>
        </div>
        <p className="text-gray-400 text-sm">
          {isAuthenticated ? `You have ${user?.coinBalance || 0} coins` : 'Connect your wallet to start earning SOL rewards'}
        </p>
      </div>
    </div>
  );
};

export default UserStatus;