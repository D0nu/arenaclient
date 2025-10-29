import React from 'react';

const CloseRoomModal = ({ onConfirm, onCancel, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 max-w-md w-full border-2 border-red-500 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-2xl font-bold text-white mb-2">Close Room?</h3>
          <p className="text-gray-300">
            Are you sure you want to close this room? All players will be disconnected.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
          >
            Close Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloseRoomModal;