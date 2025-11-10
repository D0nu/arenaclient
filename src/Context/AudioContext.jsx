// AudioContext.jsx - FIXED (Volume Persistence Issue)
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  
  const [soundVolume, setSoundVolume] = useState(() => {
    const saved = localStorage.getItem('soundVolume');
    return saved !== null ? parseFloat(saved) : 0.7;
  });

  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  
  const currentMusicRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const isFadingRef = useRef(false);
  const currentPlaylistRef = useRef(null);
  const endedListenerRef = useRef(null);
  
  // ✅ NEW: Store current volume/mute state in refs so they're always up-to-date
  const musicVolumeRef = useRef(musicVolume);
  const isMusicMutedRef = useRef(isMusicMuted);

  // ✅ Keep refs synchronized with state
  useEffect(() => {
    musicVolumeRef.current = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    isMusicMutedRef.current = isMusicMuted;
  }, [isMusicMuted]);

  // 🎶 Music playlists
  const musicPlaylists = {
    lobby: [
      '/sounds/music/lobby/in_the_lobby.wav',
    ],
    gameRoom: [
      '/sounds/music/gameroom/game-minecraft-gaming-background-music-402451.mp3',
    ],
    viewGames: [
      '/sounds/music/viewgames/attack.wav',
    ],
  };

  // 🔊 Available sound effects
  const soundEffects = {
    buttonClick: '/sounds/ui/interface-soft-click-131438.mp3',
    basketballBounce: '/sounds/games/basketball/ball_bounce.wav',
    basketballScore: '/sounds/games/basketball/score.wav',
    basketballRim: '/sounds/games/basketball/rim.wav',
    basketballSpawn: '/sounds/games/basketball/spawn.wav',
    basketballNet: '/sounds/games/basketball/net.wav',
    conquestSwing: '/sounds/games/conquest/swing.mp3',
    conquestHit: '/sounds/games/conquest/hit.mp3',
    dartThrow: '/sounds/games/dart/throw.mp3',
    dartHit: '/sounds/games/dart/hit.mp3',
    survivorShoot: '/sounds/games/survivor/shoot.mp3',
    survivorHit: '/sounds/games/survivor/hit.mp3',
    questionCorrect: '/sounds/games/question/correct.mp3',
    questionWrong: '/sounds/games/question/wrong.mp3',
  };

  // 💾 Persist volumes
  useEffect(() => {
    localStorage.setItem('musicVolume', musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    localStorage.setItem('soundVolume', soundVolume);
  }, [soundVolume]);

  // 🎧 Apply volume changes in real-time to current audio
  useEffect(() => {
    if (currentMusicRef.current && !isFadingRef.current) {
      const targetVolume = isMusicMuted ? 0 : musicVolume;
      currentMusicRef.current.volume = targetVolume;
      console.log('🔊 Volume updated in real-time:', targetVolume);
    }
  }, [musicVolume, isMusicMuted]);

  // 🛑 Stop all music
  const stopAllMusic = useCallback(() => {
    console.log('🛑 Stopping ALL audio elements');
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    if (currentMusicRef.current && endedListenerRef.current) {
      currentMusicRef.current.removeEventListener('ended', endedListenerRef.current);
      endedListenerRef.current = null;
    }
    
    if (currentMusicRef.current) {
      currentMusicRef.current.pause();
      currentMusicRef.current.currentTime = 0;
      currentMusicRef.current = null;
    }
    
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      audio.remove();
    });
    
    setCurrentTrack(null);
    currentPlaylistRef.current = null;
    setCurrentPlaylistIndex(0);
    isFadingRef.current = false;
  }, []);

  // 🌇 Fade out music
  const fadeOutMusic = useCallback((fadeDuration = 500) => {
    return new Promise((resolve) => {
      if (!currentMusicRef.current) {
        return resolve();
      }

      isFadingRef.current = true;
      const audio = currentMusicRef.current;
      const startVolume = audio.volume;
      const interval = 50;
      const steps = fadeDuration / interval;
      const volumeStep = startVolume / steps;
      let currentStep = 0;

      console.log('🌇 Starting fade out from volume:', startVolume);

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.max(0, startVolume - (volumeStep * currentStep));
        audio.volume = newVolume;

        if (currentStep >= steps || audio.volume <= 0) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          audio.pause();
          audio.currentTime = 0;
          
          if (endedListenerRef.current) {
            audio.removeEventListener('ended', endedListenerRef.current);
            endedListenerRef.current = null;
          }
          
          currentMusicRef.current = null;
          isFadingRef.current = false;
          console.log('🌇 Fade out complete');
          resolve();
        }
      }, interval);
    });
  }, []);

  // 🌅 Fade in music - ✅ FIXED: Now uses refs for current volume/mute state
  const fadeInMusic = useCallback((audio, fadeDuration) => {
    return new Promise((resolve) => {
      isFadingRef.current = true;
      
      // ✅ FIX: Use refs to get CURRENT volume/mute state, not stale closure values
      const targetVolume = isMusicMutedRef.current ? 0 : musicVolumeRef.current;
      audio.volume = 0;

      console.log('🌅 Starting fade in to volume:', targetVolume, 'muted:', isMusicMutedRef.current);

      const interval = 50;
      const steps = fadeDuration / interval;
      const volumeStep = targetVolume / steps;
      let currentStep = 0;

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      fadeIntervalRef.current = setInterval(() => {
        currentStep++;
        const newVolume = Math.min(targetVolume, volumeStep * currentStep);
        audio.volume = newVolume;

        if (currentStep >= steps || audio.volume >= targetVolume) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          audio.volume = targetVolume;
          isFadingRef.current = false;
          console.log('🌅 Fade in complete at volume:', targetVolume);
          resolve();
        }
      }, interval);
    });
  }, []); // ✅ No dependencies - uses refs instead

  // 🎵 Play next track in playlist
  const playNextInPlaylist = useCallback(() => {
    if (!currentPlaylistRef.current) {
      console.log('🎵 No playlist to continue');
      return;
    }

    const playlist = musicPlaylists[currentPlaylistRef.current];
    if (!playlist || playlist.length === 0) {
      console.log('🎵 Playlist empty or not found');
      return;
    }

    const nextIndex = (currentPlaylistIndex + 1) % playlist.length;
    setCurrentPlaylistIndex(nextIndex);

    console.log(`🎵 Playing next track: ${nextIndex + 1}/${playlist.length}`);
    
    // ✅ Call internal function with next index
    startNewMusicInternal(currentPlaylistRef.current, 1000, nextIndex);
  }, [currentPlaylistIndex]); // Only depends on index

  // 🎵 Start new music - INTERNAL
  const startNewMusicInternal = useCallback((playlistKey, fadeInDuration, trackIndex = 0) => {
    const playlist = musicPlaylists[playlistKey];
    if (!playlist || playlist.length === 0) {
      console.warn(`🎵 Playlist "${playlistKey}" not found`);
      return;
    }

    const src = playlist[trackIndex];
    if (!src) {
      console.error(`🎵 Track ${trackIndex} not found in ${playlistKey}`);
      return;
    }

    console.log(`🎵 Starting track ${trackIndex + 1}/${playlist.length} from ${playlistKey}: ${src}`);

    try {
      // Clean up previous audio first
      if (currentMusicRef.current && endedListenerRef.current) {
        currentMusicRef.current.removeEventListener('ended', endedListenerRef.current);
        endedListenerRef.current = null;
      }

      const audio = new Audio(src);
      audio.loop = false;
      audio.volume = 0;
      audio.preload = 'auto';
      
      currentMusicRef.current = audio;
      setCurrentTrack(playlistKey);
      currentPlaylistRef.current = playlistKey;
      setCurrentPlaylistIndex(trackIndex);

      // ✅ Create event listener
      const endedHandler = () => {
        console.log('🎵 Track ended, playing next...');
        playNextInPlaylist();
      };
      endedListenerRef.current = endedHandler;
      audio.addEventListener('ended', endedHandler);

      audio.addEventListener('error', (e) => {
        console.error('❌ Audio error:', e);
        currentMusicRef.current = null;
        playNextInPlaylist();
      });

      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('▶️ Music playing');
            // ✅ FIX: Check CURRENT mute/volume state using refs
            if (!isMusicMutedRef.current && musicVolumeRef.current > 0) {
              fadeInMusic(audio, fadeInDuration);
            } else {
              console.log('🔇 Music muted or volume 0, not fading in');
            }
          })
          .catch((error) => {
            console.error('❌ Play failed:', error);
            currentMusicRef.current = null;
          });
      }
    } catch (error) {
      console.error('❌ Error creating audio:', error);
      currentMusicRef.current = null;
    }
  }, [fadeInMusic, playNextInPlaylist]); // ✅ Only depends on functions, not state

  // 🕹 Play music with smooth transition
  const playMusic = useCallback(async (playlistKey, fadeInDuration = 1000) => {
    console.log(`🎵 playMusic called: ${playlistKey}, current: ${currentTrack}`);
    
    if (currentTrack === playlistKey && currentMusicRef.current && !currentMusicRef.current.paused) {
      console.log('🎵 Same playlist already playing, skipping');
      return;
    }

    if (currentMusicRef.current) {
      console.log('🌇 Fading out current music (800ms) before starting new playlist');
      await fadeOutMusic(800);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    startNewMusicInternal(playlistKey, fadeInDuration, 0);
  }, [currentTrack, fadeOutMusic, startNewMusicInternal]);

  // 🛑 Stop music
  const stopMusic = useCallback(() => {
    console.log('🛑 Stopping music immediately');
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    if (currentMusicRef.current && endedListenerRef.current) {
      currentMusicRef.current.removeEventListener('ended', endedListenerRef.current);
      endedListenerRef.current = null;
    }
    
    if (currentMusicRef.current) {
      currentMusicRef.current.pause();
      currentMusicRef.current.currentTime = 0;
      currentMusicRef.current = null;
    }
    setCurrentTrack(null);
    currentPlaylistRef.current = null;
    setCurrentPlaylistIndex(0);
    isFadingRef.current = false;
  }, []);

  // 🔊 Play sound effect
  const playSound = useCallback((soundKey, options = {}) => {
    if (isSoundMuted) return null;
    const { volume = 1 } = options;

    const src = soundEffects[soundKey];
    if (!src) {
      console.warn(`🔊 Sound effect "${soundKey}" not found`);
      return null;
    }

    try {
      const audio = new Audio(src);
      audio.volume = soundVolume * volume;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn('🔊 Play failed:', e));
      }
      
      return audio;
    } catch (error) {
      console.error('🔊 Error playing sound:', error);
      return null;
    }
  }, [isSoundMuted, soundVolume]);

  // 🔧 Direct volume setters
  const setMusicVolumeDirect = useCallback((volume) => {
    const newVol = Math.max(0, Math.min(1, volume));
    setMusicVolume(newVol);
  }, []);

  const setSoundVolumeDirect = useCallback((volume) => {
    const newVol = Math.max(0, Math.min(1, volume));
    setSoundVolume(newVol);
  }, []);

  // 🔇 Toggle mute states
  const toggleMusicMute = useCallback(() => {
    const newState = !isMusicMuted;
    setIsMusicMuted(newState);

    if (currentMusicRef.current && !isFadingRef.current) {
      const targetVolume = newState ? 0 : musicVolume;
      currentMusicRef.current.volume = targetVolume;
      console.log('🔇 Music mute toggled:', newState, 'volume:', targetVolume);
    }
  }, [isMusicMuted, musicVolume]);

  const toggleSoundMute = useCallback(() => {
    setIsSoundMuted(prev => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up audio on unmount');
      stopAllMusic();
    };
  }, [stopAllMusic]);

  const value = {
    playMusic,
    stopMusic,
    playSound,
    fadeOutMusic,
    stopAllMusic,
    musicVolume,
    soundVolume,
    isMusicMuted,
    isSoundMuted,
    setMusicVolume: setMusicVolumeDirect,
    setSoundVolume: setSoundVolumeDirect,
    toggleMusicMute,
    toggleSoundMute,
    currentMusicRef,
    currentTrack,
    currentPlaylistIndex,
    getCurrentAudioElement: () => currentMusicRef.current,
    hasCurrentMusic: !!currentMusicRef.current,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioContext;