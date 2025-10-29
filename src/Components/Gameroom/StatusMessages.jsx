import React from 'react';

const StatusMessages = ({ room, isRoomFull, allPlayersReady, isOwner }) => {
  // Add safety check
  if (!room || !room.settings) {
    return null;
  }

  const totalPlayers = room.players?.length || 0;
  const requiredPlayers = room.settings?.playerCount || 0;
  const readyPlayers = room.players?.filter(p => p.isReady).length || 0;

  if (!isRoomFull) {
    return (
      <div className="text-center py-8">
        <div className="bg-orange-500/20 border border-orange-500 rounded-2xl p-6 inline-block">
          <p className="text-orange-400 text-lg font-semibold">
            ⏳ Waiting for {requiredPlayers - totalPlayers} more player(s)...
          </p>
          <p className="text-orange-300 text-sm mt-2">
            Share room code: <span className="font-mono font-bold">{room.code}</span>
          </p>
        </div>
      </div>
    );
  }

  if (isRoomFull && !allPlayersReady) {
    return (
      <div className="text-center py-8">
        <div className="bg-blue-500/20 border border-blue-500 rounded-2xl p-6 inline-block">
          <p className="text-blue-400 text-lg font-semibold">
            ⏳ Waiting for {totalPlayers - readyPlayers} player(s) to ready up...
          </p>
        </div>
      </div>
    );
  }

  if (allPlayersReady && isRoomFull) {
    return (
      <div className="text-center py-8">
        <div className="bg-green-500/20 border border-green-500 rounded-2xl p-6 inline-block">
          <p className="text-green-400 text-lg font-semibold">
            ✅ All players ready! {isOwner ? 'Start the game!' : 'Waiting for owner to start...'}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default StatusMessages;