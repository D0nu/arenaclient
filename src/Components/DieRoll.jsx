import React, { useState, useEffect, useRef } from 'react';

const DieRoll = ({ room, user, dieRolls, diceRollers, onRollDie }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [currentRoll, setCurrentRoll] = useState(null);
  const dieRef = useRef(null);
  
  // Check if current user should roll (is in diceRollers array)
  const shouldUserRoll = diceRollers.some(player => player.id === user.id);
  const hasRolled = dieRolls[user.id];

  const handleRoll = () => {
    if (!shouldUserRoll || hasRolled || isRolling) return;
    
    setIsRolling(true);
    setCurrentRoll(null);
    
    // Animate rolling
    let rollCount = 0;
    const maxRolls = 20;
    const rollInterval = setInterval(() => {
      setCurrentRoll(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setCurrentRoll(finalRoll);
        setIsRolling(false);
        onRollDie();
      }
    }, 100);
  };

  const handleSwipe = (e) => {
    if (!shouldUserRoll || hasRolled || isRolling) return;
    
    if (e.type === 'touchstart') {
      e.currentTarget.addEventListener('touchend', handleRoll);
    } else {
      handleRoll();
    }
  };

  // Determine if all required players have rolled
  const allRequiredRolled = diceRollers.every(player => dieRolls[player.id]);

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Roll the Die!</h2>
      
      {diceRollers.length > 2 ? (
        <p className="text-gray-300 mb-6">
          Team Leaders: Roll to see who chooses first!
        </p>
      ) : (
        <p className="text-gray-300 mb-6">
          Swipe or click to roll. Highest roll chooses first.
        </p>
      )}

      {/* Die Display - Only show if user should roll */}
      {shouldUserRoll && (
        <div 
          ref={dieRef}
          onClick={handleSwipe}
          onTouchStart={handleSwipe}
          className={`w-32 h-32 mx-auto mb-8 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-6xl font-bold cursor-pointer transform transition-transform duration-300 ${
            isRolling ? 'animate-bounce' : 'hover:scale-110'
          } ${hasRolled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {currentRoll || '🎲'}
        </div>
      )}

      {/* Roll Status */}
      <div className="mb-8">
        {shouldUserRoll && hasRolled && (
          <p className="text-green-400 text-xl font-semibold">
            You rolled: {dieRolls[user.id]}
          </p>
        )}
        {shouldUserRoll && !hasRolled && !isRolling && (
          <p className="text-yellow-400">Waiting for your roll...</p>
        )}
        {shouldUserRoll && isRolling && (
          <p className="text-blue-400">Rolling...</p>
        )}
        {!shouldUserRoll && (
          <p className="text-purple-400">
            Waiting for team leaders to roll...
          </p>
        )}
      </div>

      {/* Players' Rolls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {diceRollers.map(player => (
          <div key={player.id} className={`bg-gray-700/50 rounded-xl p-4 text-center ${
            player.id === user.id ? 'ring-2 ring-yellow-400' : ''
          }`}>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
              {player.name.charAt(0)}
            </div>
            <p className="text-white text-sm truncate">{player.name}</p>
            <p className="text-gray-400 text-sm">
              {dieRolls[player.id] ? `Rolled: ${dieRolls[player.id]}` : 'Waiting...'}
            </p>
            {diceRollers.length > 2 && (
              <p className="text-blue-400 text-xs mt-1">Team Leader</p>
            )}
          </div>
        ))}
      </div>

      {/* Waiting Message */}
      {allRequiredRolled && (
        <div className="mt-8 bg-green-500/20 border border-green-500 rounded-2xl p-6 inline-block">
          <p className="text-green-400 text-lg font-semibold">
            All rolls complete! Determining winner...
          </p>
        </div>
      )}
    </div>
  );
};

export default DieRoll;