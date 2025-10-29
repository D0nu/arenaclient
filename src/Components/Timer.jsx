import React, { useState, useEffect } from 'react';
import { useSocket } from '../Context/SocketContext';

const Timer = ({ initialTime = 180 }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('timer-update', (time) => {
      setTimeLeft(time);
    });

    socket.on('game-started', () => {
      setTimeLeft(initialTime);
    });

    return () => {
      socket.off('timer-update');
      socket.off('game-started');
    };
  }, [socket, initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up!
          if (socket) {
            socket.emit('time-up');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, socket]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 60) return 'text-green-400';
    if (timeLeft > 30) return 'text-yellow-400';
    return 'text-red-400 pulse-glow';
  };

  const getProgressPercentage = () => {
    return (timeLeft / initialTime) * 100;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Progress Bar */}
      <div className="w-32 h-2 bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-1000"
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>
      
      {/* Timer Display */}
      <div className={`text-3xl font-bold ${getTimerColor()} transition-colors duration-300`}>
        {formatTime(timeLeft)}
      </div>
      
      {/* Difficulty Indicator */}
      <div className="text-sm text-gray-400 mt-1">
        {timeLeft > 120 ? 'Easy' : timeLeft > 60 ? 'Medium' : 'Hard'} Mode
      </div>
    </div>
  );
};

export default Timer;