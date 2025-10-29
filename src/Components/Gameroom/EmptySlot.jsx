import React from 'react';

const EmptySlot = () => (
  <div className="bg-gray-600/30 rounded-xl p-4 text-center w-24 border-2 border-dashed border-gray-500">
    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-2xl text-gray-400 mx-auto mb-2">
      ?
    </div>
    <p className="text-gray-400 text-sm">Waiting...</p>
  </div>
);

export default EmptySlot;