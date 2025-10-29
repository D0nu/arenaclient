// MobileViewerToggle.js
import React from 'react';

const MobileViewerToggle = ({ showViewerPanel, setShowViewerPanel, selectedGame }) => {
  if (window.innerWidth >= 1024) return null; // Only show on mobile

  return (
    <div className="lg:hidden fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setShowViewerPanel(!showViewerPanel)}
        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all ${
          showViewerPanel
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {showViewerPanel ? '✕' : '🎮'}
      </button>
      
      {/* Notification badge if game is selected */}
      {selectedGame && !showViewerPanel && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
};

export default MobileViewerToggle;