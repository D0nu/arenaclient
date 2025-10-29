import React, { useEffect, useState } from 'react';

const MatchSettingsModal = ({ currentSettings, onSave, onClose, isOwner }) => {
  const [settings, setSettings] = useState(currentSettings);

  // ✅ UPDATED: Remove 1 player option for question-vs-question and game-vs-game modes
  const gameModes = [
    { value: 'question-vs-game', label: 'Question vs Game', playerOptions: [2, 4, 6, 8, 10] },
    { value: 'question-vs-question', label: 'Questions Only', playerOptions: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { value: 'game-vs-game', label: 'Games Only', playerOptions: [2, 3, 4, 5, 6, 7, 8, 9, 10] }
  ];

  const handleSave = () => {
    if (isOwner) onSave(settings);
  };

  // if (!isOwner) {
  //   return (
  //     <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
  //       <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border-2 border-red-500 shadow-2xl text-center">
  //         <h3 className="text-2xl font-bold text-white mb-4">Access Denied</h3>
  //         <p className="text-gray-300 mb-6">Only the room owner can change settings.</p>
  //         <button
  //           onClick={onClose}
  //           className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
  //         >
  //           Close
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border-2 border-purple-500 shadow-2xl">
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-white mb-2">Match Settings</h3>
          <p className="text-gray-300">Configure your game room</p>
        </div>

        <div className="space-y-6">
          {/* Game Mode Selection */}
          <div>
            <label className="block text-white font-semibold mb-3">Game Mode</label>
            <div className='w-full text-left p-4 rounded-xl transition-all bg-gray-700 text-gray-300 hover:bg-gray-600 mb-2.5'> Wager: {currentSettings.wager ? `${currentSettings.wager} coins` : 'Free'} </div>
            <div className="space-y-2">
              {gameModes.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => isOwner && setSettings({...settings, mode: mode.value, playerCount: mode.playerOptions[0]})}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    settings.mode === mode.value 
                      ? 'bg-purple-600 text-white border-2 border-purple-400' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-semibold">{mode.label}</div>
                  <div className="text-sm opacity-80 mt-1">
                    {mode.value === 'question-vs-game' && 'Die roll → Choose topic/game → Different activities'}
                    {mode.value === 'question-vs-question' && 'Random topic → All players answer questions'}
                    {mode.value === 'game-vs-game' && 'Random game → All players play the same game'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Player Count Selection */}
          <div>
            <label className="block text-white font-semibold mb-3">
              Players: {settings.playerCount}
            </label>
            <div className="flex flex-wrap gap-2">
              {gameModes.find(m => m.value === settings.mode)?.playerOptions.map(count => (
                <button
                  key={count}
                  onClick={() => isOwner && setSettings({...settings, playerCount: count})}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    settings.playerCount === count 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Description */}
          <div className="bg-purple-500/20 border border-purple-500 rounded-xl p-4">
            <h4 className="text-white font-semibold mb-2">Mode Info:</h4>
            <p className="text-purple-200 text-sm">
              {settings.mode === 'question-vs-game' && 
                'Die roll decides who chooses topic or game. Teams do different activities.'}
              {settings.mode === 'question-vs-question' && 
                'Random topic selected. All players answer questions. Individual scoring.'}
              {settings.mode === 'game-vs-game' && 
                'Random game selected. All players play the same game. Individual scoring.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Cancel
            </button>
            {isOwner && <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
            >
              Save Settings
            </button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSettingsModal;