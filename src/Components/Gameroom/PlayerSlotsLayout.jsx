import React from 'react';
import PlayerSlot from './PlayerSlot';
import EmptySlot from './EmptySlot';

const PlayerSlotsLayout = ({ room, user }) => {
  if (!room?.settings) return null;
  const totalSlots = room.settings.playerCount;
  const filled = room.players.length;
  const empty = totalSlots - filled;

  return (
    <div className="text-center">
      <h3 className="text-purple-400 text-lg mb-4">
        Players ({filled}/{totalSlots})
      </h3>
      <div className="flex flex-wrap justify-center gap-4">
        {room.players.map(p => (
          <PlayerSlot key={p.id} player={p} currentUser={user} />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <EmptySlot key={i} />
        ))}
      </div>
    </div>
  );
};

export default PlayerSlotsLayout;
