import React, { useState, useEffect } from 'react';

const PlayerList = ({ players }) => {
  const [playerCharacters, setPlayerCharacters] = useState({});

  // Mock data - replace with actual character data from your backend
  const mockCharacters = {
    face1: { emoji: '😀', color: 'from-purple-500 to-pink-500' },
    face2: { emoji: '😎', color: 'from-blue-500 to-cyan-500' },
    face3: { emoji: '🤠', color: 'from-green-500 to-teal-500' },
    face4: { emoji: '🧐', color: 'from-orange-500 to-red-500' }
  };

  const getRandomCharacter = (playerId) => {
    const faces = Object.keys(mockCharacters);
    const randomFace = faces[Math.floor(Math.random() * faces.length)];
    return mockCharacters[randomFace];
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4 text-center">Players</h2>
      
      {players.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>Waiting for players...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {players.map((player, index) => {
            const character = getRandomCharacter(player.socketId);
            
            return (
              <div 
                key={player.socketId} 
                className="flex items-center gap-4 bg-gray-700 rounded-xl p-4 border border-gray-600"
              >
                {/* Character Avatar */}
                <div className={`bg-gradient-to-br ${character.color} rounded-full w-12 h-12 flex items-center justify-center text-xl`}>
                  {character.emoji}
                </div>
                
                {/* Player Info */}
                <div className="flex-1">
                  <p className="font-semibold">
                    {player.character?.name || `Player ${index + 1}`}
                  </p>
                  <p className="text-sm text-gray-400">
                    Ready to play!
                  </p>
                </div>
                
                {/* Status Indicator */}
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Player Count */}
      <div className="mt-6 text-center text-gray-400">
        <p>{players.length} player{players.length !== 1 ? 's' : ''} in game</p>
      </div>
    </div>
  );
};

export default PlayerList;