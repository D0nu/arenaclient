// useGlobalButtonSound.js
import { useEffect } from 'react';
import { useAudio } from '../Context/AudioContext';

export const useGlobalButtonSound = () => {
  const { playSound, isSoundMuted } = useAudio();

  useEffect(() => {
    const handleButtonClick = (event) => {
  
      const button = event.target.closest('button');
      
      if (button && !button.disabled && !isSoundMuted) {
      
        if (button.closest('[data-no-sound]')) return;
        
        console.log('🔊 Global button click sound');
        playSound('buttonClick');
      }
    };


    document.addEventListener('click', handleButtonClick);

    return () => {
      document.removeEventListener('click', handleButtonClick);
    };
  }, [playSound, isSoundMuted]);
};