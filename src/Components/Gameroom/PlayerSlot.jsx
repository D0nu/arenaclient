import React from 'react';

const PlayerSlot = ({ player, currentUser }) => (
  <div className={`bg-gray-700/50 rounded-xl p-4 text-center w-24 transform hover:scale-105 transition-transform ${
    player.id === currentUser?.id ? 'ring-2 ring-yellow-400' : ''
  }`}>
    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
      {player.avatar}
    </div>
    <p className="text-white font-semibold text-sm truncate">{player.name}</p>
    {player.isOwner && (
      <p className="text-green-400 text-xs">⭐ Owner</p>
    )}
    {player.isReady && (
      <p className="text-green-400 text-xs">✅ Ready</p>
    )}
    {player.id === currentUser?.id && (
      <p className="text-yellow-400 text-xs">(You)</p>
    )}
  </div>
);

export default PlayerSlot;