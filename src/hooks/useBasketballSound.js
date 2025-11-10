// useBasketballSounds.js
import { useCallback } from 'react';
import { useAudio } from '../Context/AudioContext';

export const useBasketballSounds = () => {
  const { playSound } = useAudio();

  const playBounceSound = useCallback((velocity = 1) => {
    playSound('basketballBounce', { 
      volume: Math.min(1, velocity * 0.5) // Scale volume with bounce intensity
    });
  }, [playSound]);

  const playScoreSound = useCallback(() => {
    playSound('basketballScore', { volume: 0.8 });
  }, [playSound]);

  const playRimSound = useCallback((impactForce = 1) => {
    playSound('basketballRim', { 
      volume: Math.min(1, impactForce * 0.6) 
    });
  }, [playSound]);

  const playSpawnSound = useCallback(() => {
    playSound('basketballSpawn', { volume: 0.5 });
  }, [playSound]);

  const playNetSound = useCallback(() => {
    playSound('basketballNet', { volume: 0.4 });
  }, [playSound]);

  return {
    playBounceSound,
    playScoreSound,
    playRimSound,
    playSpawnSound,
    playNetSound
  };
};

export default useBasketballSounds;