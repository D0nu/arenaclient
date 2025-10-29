import React from 'react';

const StatsFooter = () => {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4 text-center animate-fade-in-up animation-delay-1000">
      <div className="bg-gray-800 bg-opacity-30 rounded-xl p-3 hover:bg-opacity-50 transition-all duration-300 cursor-pointer group">
        <div className="text-2xl font-bold text-purple-400 group-hover:scale-110 transition-transform">1.2K</div>
        <div className="text-xs text-gray-400 group-hover:text-gray-300">Players Online</div>
      </div>
      <div className="bg-gray-800 bg-opacity-30 rounded-xl p-3 hover:bg-opacity-50 transition-all duration-300 cursor-pointer group">
        <div className="text-2xl font-bold text-green-400 group-hover:scale-110 transition-transform">24</div>
        <div className="text-xs text-gray-400 group-hover:text-gray-300">Active Games</div>
      </div>
      <div className="bg-gray-800 bg-opacity-30 rounded-xl p-3 hover:bg-opacity-50 transition-all duration-300 cursor-pointer group">
        <div className="text-2xl font-bold text-blue-400 group-hover:scale-110 transition-transform">5.7K</div>
        <div className="text-xs text-gray-400 group-hover:text-gray-300">SOL Rewards</div>
      </div>
    </div>
  );
};

export default StatsFooter;