import React from 'react';
import PlayerSlot from './PlayerSlot';
import EmptySlot from './EmptySlot';

const PlayerArea = ({ room, user }) => {
  // Add safety check
  if (!room || !room.settings || !room.players) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-t-2 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Loading players...</p>
        </div>
      </div>
    );
  }

  const renderPlayerSlots = () => {
    if (!room?.settings) return null;

    const totalSlots = room.settings?.playerCount || 0;
    const filledSlots = room.players?.length || 0;
    const emptySlots = totalSlots - filledSlots;

    if (room.settings.mode === 'question-vs-game' && totalSlots === 2) {
      // 1v1 layout
      return (
        <div className="flex flex-col items-center space-y-8">
          {/* Team A - Only creator */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-blue-500 w-64">
            <div className="text-center mb-4">
              <span className="text-blue-400 font-bold text-lg">Team A</span>
            </div>
            <div className="flex justify-center">
              {room.players?.filter(p => p.team === 'A').map(player => (
                <PlayerSlot key={player.id} player={player} currentUser={user} />
              ))}
            </div>
          </div>

          {/* VS Separator */}
          <div className="text-2xl font-bold text-yellow-400">VS</div>

          {/* Team B - Empty slot or player */}
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-red-500 w-64">
            <div className="text-center mb-4">
              <span className="text-red-400 font-bold text-lg">Team B</span>
            </div>
            <div className="flex justify-center">
              {room.players?.filter(p => p.team === 'B').map(player => (
                <PlayerSlot key={player.id} player={player} currentUser={user} />
              ))}
              {emptySlots > 0 && <EmptySlot />}
            </div>
          </div>
        </div>
      );
    } else if (room.settings.mode === 'question-vs-game' && totalSlots >= 4) {
      // Team layout for 4+ players
      const teamASlots = Math.ceil(totalSlots / 2);
      const teamBSlots = Math.floor(totalSlots / 2);
      
      const teamAPlayers = room.players?.filter(p => p.team === 'A') || [];
      const teamBPlayers = room.players?.filter(p => p.team === 'B') || [];

      return (
        <div className="flex flex-col space-y-8">
          {/* Team A - Top */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border-2 border-blue-500">
            <div className="text-center mb-4">
              <span className="text-blue-400 font-bold text-lg">Team A</span>
              <span className="text-gray-400 ml-2">({teamAPlayers.length}/{teamASlots})</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {teamAPlayers.map(player => (
                <PlayerSlot key={player.id} player={player} currentUser={user} />
              ))}
              {Array.from({ length: teamASlots - teamAPlayers.length }).map((_, i) => (
                <EmptySlot key={`empty-a-${i}`} />
              ))}
            </div>
          </div>

          {/* VS Separator */}
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">VS</div>
          </div>

          {/* Team B - Bottom */}
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-red-500">
            <div className="text-center mb-4">
              <span className="text-red-400 font-bold text-lg">Team B</span>
              <span className="text-gray-400 ml-2">({teamBPlayers.length}/{teamBSlots})</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {teamBPlayers.map(player => (
                <PlayerSlot key={player.id} player={player} currentUser={user} />
              ))}
              {Array.from({ length: teamBSlots - teamBPlayers.length }).map((_, i) => (
                <EmptySlot key={`empty-b-${i}`} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // For question-only or game-only modes (simple list)
    return (
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border-2 border-purple-500">
        <div className="text-center mb-4">
          <span className="text-purple-400 font-bold text-lg">Players</span>
          <span className="text-gray-400 ml-2">({filledSlots}/{totalSlots})</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {room.players?.map(player => (
            <PlayerSlot key={player.id} player={player} currentUser={user} />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-500">
      {renderPlayerSlots()}
    </div>
  );
};

export default PlayerArea;