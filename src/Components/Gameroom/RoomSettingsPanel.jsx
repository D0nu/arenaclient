import React, { useEffect, useState } from 'react';

const RoomSettingsPanel = ({ 
  user, 
  isOwner, 
  setShowSettings, 
  copyRoomCode, 
  room, 
  currentPlayer 
}) => {
  const [changed, setChanged] = useState(false)
  // Add safety checks for room and room.settings
  if (!room || !room.settings) {
    return (
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold text-white mb-4">Match Room Settings</h2>
          <div className="text-center py-4">
            <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }
  
  useEffect(() => {
    setChanged(true)
    setTimeout(()=>setChanged(false), 5000)
  }, [ room.settings ])

  const handleSettingsClick = () => {
    console.log('🔄 Settings button clicked, isOwner:', isOwner);
    setShowSettings(true);
  };

  // ✅ SIMPLE STATUS DISPLAY - Trust the backend room.status
  const getStatusDisplay = () => {
    switch (room.status) {
      case 'ready-to-start':
        return { text: 'Ready to Start', color: 'text-yellow-400' };
      case 'in-game':
        return { text: 'Game in Progress', color: 'text-blue-400' };
      case 'starting':
        return { text: 'Starting Game', color: 'text-blue-400' };
      case 'waiting':
      default:
        return { text: 'Waiting', color: 'text-green-400' };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="lg:col-span-1 space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
        <h2 className="text-xl font-bold text-white mb-4">Match Room Settings</h2>
        
        {changed && <div className='fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] bg-amber-400 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in'>Room owner changed settings</div>}
        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-white font-semibold">{user?.name}</p>
                <p className={isOwner ? "text-green-400 text-sm" : "text-blue-400 text-sm"}>
                  {isOwner ? '⭐ Owner' : 'Player'}
                </p>
                {currentPlayer?.isReady && (
                  <p className="text-green-400 text-sm">✅ Ready</p>
                )}
              </div>
            </div>
          </div>

          
          <button
            onClick={handleSettingsClick}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105"
          >
            ⚙️ Match Settings
          </button>

          <button 
            onClick={copyRoomCode}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105"
          >
            📤 Invite Friends
          </button>
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-500">
        <h3 className="text-lg font-bold text-white mb-4">Room Info</h3>
        <div className="space-y-2 text-gray-300">
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="text-white capitalize">{room.settings.mode?.replace(/-/g, ' ') || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span>Players:</span>
            <span className="text-white">{room.players?.length || 0}/{room.settings.playerCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Ready:</span>
            <span className="text-yellow-400">
              {room.players?.filter(p => p.isReady).length || 0}/{room.players?.length || 0}
            </span>
          </div>
          {/* ✅ SIMPLE STATUS DISPLAY - Trust backend */}
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={statusInfo.color}>
              {statusInfo.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSettingsPanel;