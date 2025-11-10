// useAudioManager.js - COMPLETE FIX
import { useEffect, useRef } from 'react';
import { useAudio } from '../Context/AudioContext';
import { useLocation } from 'react-router-dom';

export const useAudioManager = (currentView = null) => {
  const { playMusic, stopAllMusic, currentTrack } = useAudio();
  const location = useLocation();
  const lastContextRef = useRef(null);

  useEffect(() => {
    const context = currentView || location.pathname;
    
    if (lastContextRef.current === context) {
      console.log('🎵 Audio Manager: Context unchanged, skipping:', context);
      return;
    }
    
    lastContextRef.current = context;
    console.log('🎵 Audio Manager: Context changed to:', context);

    // ✅ FIX: Better game detection
    const isGamePage = context === 'game' || 
                       (typeof context === 'string' && (
                         context.includes('/gameroom/') && context.includes('/game')
                       ));
    
    const isSpectatorPage = typeof context === 'string' && context.includes('/spectate');

    // ✅ STOP music for gameplay and spectator
    if (isGamePage || isSpectatorPage) {
      console.log('🎵 Audio Manager: Stopping music for', isGamePage ? 'gameplay' : 'spectator');
      stopAllMusic();
      return;
    }

    // ✅ Helper to start music with fade
    const startMusicDelayed = (trackKey, delay = 200) => {
      setTimeout(() => {
        playMusic(trackKey, 1000); // 1 second fade in
      }, delay);
    };

    // View-based routing
    if (currentView) {
      console.log('🎵 Audio Manager: Using view-based routing:', currentView);
      
      switch (currentView) {
        case 'lobby':
          if (currentTrack !== 'lobby') {
            console.log('🎵 Audio Manager: Starting lobby music');
            startMusicDelayed('lobby');
          }
          break;
          
        case 'game':
          console.log('🎵 Audio Manager: Stopping music for game view');
          stopAllMusic();
          break;
          
        default:
          console.log('🎵 Audio Manager: No music for view:', currentView);
      }
      return;
    }

    // Router-based routing
    const path = context;
    console.log('🎵 Audio Manager: Using router-based routing:', path);
    
    switch (true) {
      case path === '/':
        if (currentTrack !== 'lobby') {
          console.log('🎵 Audio Manager: Starting lobby music');
          startMusicDelayed('lobby');
        }
        break;
        
      case path.includes('/room/') && !path.includes('/game'):
        if (currentTrack !== 'gameRoom') {
          console.log('🎵 Audio Manager: Starting game room music');
          startMusicDelayed('gameRoom');
        }
        break;
        
      case path === '/view-games':
        if (currentTrack !== 'viewGames') {
          console.log('🎵 Audio Manager: Starting view games music');
          startMusicDelayed('viewGames');
        }
        break;
        
      case path === '/settings':
        console.log('🎵 Audio Manager: Settings page - keeping current music');
        break;
        
      default:
        console.log('🎵 Audio Manager: No specific music for route:', path);
    }
    
  }, [location.pathname, currentView, playMusic, stopAllMusic, currentTrack]);
};