import React from 'react';
import { useAudio } from '../Context/AudioContext';

const SettingsPage = () => {
  const {
    musicVolume,
    soundVolume,
    isMusicMuted,
    isSoundMuted,
    setMusicVolume,
    setSoundVolume,
    toggleMusicMute,
    toggleSoundMute,
    playSound,
    currentMusicRef, // Now this comes from context
    getCurrentMusicState,
    getCurrentAudioElement // Alternative method
  } = useAudio();

  const handleVolumeTest = () => {
    console.log('🔊 Settings: Testing sound effect');
    playSound('buttonClick');
  };

  const handleMusicTest = () => {
    console.log('🔊 Settings: Testing notification');
    playSound('notification');
  };

  const handleMusicVolumeChange = (value) => {
    const newVolume = parseInt(value) / 100;
    console.log('🎵 Settings: Setting music volume to:', newVolume);
    setMusicVolume(newVolume);
    
    // Use the ref from context
    if (currentMusicRef?.current) {
      const targetVolume = isMusicMuted ? 0 : newVolume;
      currentMusicRef.current.volume = targetVolume;
      console.log('🎵 Settings: Immediate volume update:', targetVolume);
    }
  };

  const handleSoundVolumeChange = (value) => {
    const newVolume = parseInt(value) / 100;
    console.log('🔊 Settings: Setting sound volume to:', newVolume);
    setSoundVolume(newVolume);
  };

  const handleToggleMusicMute = () => {
    console.log('🎵 Settings: Toggling music mute');
    toggleMusicMute();
    
    setTimeout(() => {
      if (currentMusicRef?.current) {
        console.log('🎵 Settings: Current audio volume:', currentMusicRef.current.volume);
      }
    }, 100);
  };

  const handleToggleSoundMute = () => {
    console.log('🔊 Settings: Toggling sound mute');
    toggleSoundMute();
  };

  // Get current music state for debugging
  const musicState = getCurrentMusicState ? getCurrentMusicState() : { playing: false, volume: 0 };

  console.log('🎵 Settings Debug:', {
    musicVolume,
    soundVolume,
    isMusicMuted,
    isSoundMuted,
    currentMusicRef: currentMusicRef?.current ? 'Exists' : 'Null',
    musicState
  });

  // Add this function to your SettingsPage component
  const stopExternalMusic = () => {
    console.log('🛑 Stopping all external audio elements');
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      console.log('Stopping audio:', audio.src);
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const getDetailedAudioState = () => {
    if (currentMusicRef?.current) {
      return {
        volume: currentMusicRef.current.volume,
        paused: currentMusicRef.current.paused,
        muted: currentMusicRef.current.muted,
        readyState: currentMusicRef.current.readyState,
        src: currentMusicRef.current.src
      };
    }
    return { error: 'No audio element' };
  };

  const refreshAudioContext = () => {
    console.log('🔄 Refreshing audio context');
    if (currentMusicRef?.current) {
      const currentTime = currentMusicRef.current.currentTime;
      const wasPlaying = !currentMusicRef.current.paused;
      const currentSrc = currentMusicRef.current.src;
      
      // Recreate the audio element
      const newAudio = new Audio(currentSrc);
      newAudio.loop = true;
      newAudio.volume = isMusicMuted ? 0 : musicVolume;
      newAudio.currentTime = currentTime;
      
      if (wasPlaying) {
        newAudio.play().catch(console.error);
      }
      
      currentMusicRef.current = newAudio;
      console.log('🔄 Audio context refreshed');
    }
  };

  // Get the detailed audio state for display
  const detailedState = getDetailedAudioState();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300">Customize your audio experience</p>
        </div>

        {/* Audio Settings Card */}
        <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">🎵</span>
            Audio Settings
          </h2>

          {/* Music Volume */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-white font-semibold text-lg mr-3">
                  {isMusicMuted ? '🔇' : '🎵'} Background Music
                </span>
                {isMusicMuted && (
                  <span className="text-red-400 text-sm bg-red-400/20 px-2 py-1 rounded">Muted</span>
                )}
              </div>
              <button
                onClick={handleToggleMusicMute}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isMusicMuted 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isMusicMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm w-12">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={musicVolume * 100}
                onChange={(e) => handleMusicVolumeChange(e.target.value)}
                disabled={isMusicMuted}
                className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
              />
              <span className="text-gray-400 text-sm w-12">100%</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-purple-400 font-semibold">
                {Math.round(musicVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Sound Effects Volume */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-white font-semibold text-lg mr-3">
                  {isSoundMuted ? '🔇' : '🔊'} Sound Effects
                </span>
                {isSoundMuted && (
                  <span className="text-red-400 text-sm bg-red-400/20 px-2 py-1 rounded">Muted</span>
                )}
              </div>
              <button
                onClick={handleToggleSoundMute}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  isSoundMuted 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isSoundMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm w-12">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={soundVolume * 100}
                onChange={(e) => handleSoundVolumeChange(e.target.value)}
                disabled={isSoundMuted}
                className="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />
              <span className="text-gray-400 text-sm w-12">100%</span>
            </div>
            <div className="text-center mt-2">
              <span className="text-blue-400 font-semibold">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleVolumeTest}
              disabled={isSoundMuted}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                isSoundMuted
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Test Sound Effects
            </button>
            <button
              onClick={handleMusicTest}
              disabled={isSoundMuted}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                isSoundMuted
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }`}
            >
              Test Notification
            </button>
          </div>
        </div>

        {/* Debug Information Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500 mt-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">🐛 Debug Information</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>Music Volume Setting:</strong> {musicVolume} ({Math.round(musicVolume * 100)}%)</p>
            <p><strong>Sound Volume Setting:</strong> {soundVolume} ({Math.round(soundVolume * 100)}%)</p>
            <p><strong>Music Muted:</strong> {isMusicMuted ? 'Yes' : 'No'}</p>
            <p><strong>Sound Muted:</strong> {isSoundMuted ? 'Yes' : 'No'}</p>
            <p><strong>Current Music Element:</strong> {currentMusicRef?.current ? 'Exists' : 'Null'}</p>
            <p><strong>Actual Audio Volume:</strong> {detailedState.volume || 'N/A'}</p>
            <p><strong>Audio Paused:</strong> {detailedState.paused ? 'Yes' : 'No'}</p>
            {detailedState.src && (
              <p><strong>Music Source:</strong> {detailedState.src.split('/').pop()}</p>
            )}
            {detailedState.error && (
              <p><strong>Error:</strong> {detailedState.error}</p>
            )}
          </div>
        </div>

        <button
          onClick={refreshAudioContext}
          className="w-full mt-4 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-all"
        >
          🔄 Refresh Audio Context
        </button>

        <button
          onClick={stopExternalMusic}
          className="w-full mt-4 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all mb-4"
        >
          🛑 Stop All Music (Emergency)
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;