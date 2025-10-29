import React from 'react';

const LobbyHeader = () => {
  return (
    <div className="text-center mb-16 animate-fade-in-up">
      <div className="mb-6">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl animate-bounce-slow">
          <span className="text-4xl">⚡</span>
        </div>
      </div>
      <h1 className="text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4 animate-gradient">
        Airdrop Arena
      </h1>
      <p className="text-xl text-gray-300 mb-2 animate-fade-in-up animation-delay-200">
        Where Knowledge Meets Skill
      </p>
      <div className="flex items-center justify-center gap-2 text-blue-400 animate-fade-in-up animation-delay-400">
        <span className="text-lg">🔗</span>
        <p className="text-lg font-semibold">Powered by Solana</p>
      </div>
    </div>
  );
};

export default LobbyHeader;