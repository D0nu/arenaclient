import React from 'react';

const NotificationBanner = ({ notification }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
      <div className="flex items-center space-x-2">
        <span>🚫</span>
        <p>{notification}</p>
      </div>
    </div>
  );
};

export default NotificationBanner;