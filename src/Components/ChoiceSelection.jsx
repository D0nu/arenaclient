// components/ChoiceSelection.jsx
import React, { useState } from 'react';
import TopicSelection from './TopicSelection';
import GameSelection from './GameSelection';

const ChoiceSelection = ({ winner, user, onMakeChoice }) => {
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleChoiceSelect = (choice) => {
    if (winner?.id !== user?.id) return;
    
    setSelectedChoice(choice);
    
    if (choice === 'questions') {
      // Winner chose questions → winner gets questions, loser gets games
      // So winner needs to choose topic for themselves AND game for loser
      setShowTopicSelection(true);
    } else {
      // Winner chose games → winner gets games, loser gets questions
      // So winner needs to choose game for themselves AND topic for loser
      setShowGameSelection(true);
    }
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    
    if (selectedChoice === 'questions') {
      // Winner chose questions → now they need to choose game for loser
      setShowTopicSelection(false);
      setShowGameSelection(true);
    } else {
      // Winner chose games and already selected game → now complete the choice
      onMakeChoice('games', topic, selectedGame);
      resetSelection();
    }
  };

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    
    if (selectedChoice === 'games') {
      // Winner chose games → now they need to choose topic for loser
      setShowGameSelection(false);
      setShowTopicSelection(true);
    } else {
      // Winner chose questions and already selected topic → now complete the choice
      onMakeChoice('questions', selectedTopic, game);
      resetSelection();
    }
  };

  const handleCancelSelection = () => {
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedChoice(null);
    setShowTopicSelection(false);
    setShowGameSelection(false);
    setSelectedTopic(null);
    setSelectedGame(null);
  };

  if (showTopicSelection) {
    return (
      <TopicSelection 
        winner={winner}
        user={user}
        onTopicSelect={handleTopicSelect}
        onCancel={handleCancelSelection}
        mode={selectedChoice === 'games' ? 'loser-topic' : 'winner-topic'}
      />
    );
  }

  if (showGameSelection) {
    return (
      <GameSelection 
        winner={winner}
        user={user}
        onGameSelect={handleGameSelect}
        onCancel={handleCancelSelection}
        mode={selectedChoice === 'questions' ? 'loser-game' : 'winner-game'}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Round Choice</h2>
        <p className="text-purple-100 text-lg">
          {winner?.id === user?.id 
            ? "🎉 You won the die roll! Choose what you'll play"
            : `Waiting for ${winner?.name} to choose...`
          }
        </p>
        {winner?.id === user?.id && (
          <p className="text-purple-200 text-sm mt-2">
            You'll choose both what you play and what your opponent plays
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Questions Choice */}
        <button
          onClick={() => handleChoiceSelect('questions')}
          disabled={winner?.id !== user?.id}
          className={`p-8 rounded-2xl border-2 transition-all transform ${
            winner?.id === user?.id
              ? 'bg-gradient-to-br from-green-500 to-emerald-500 hover:scale-105 cursor-pointer border-green-400'
              : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-2xl font-bold text-white mb-2">Play Questions</h3>
          <p className="text-gray-200 mb-4">
            You answer questions on a topic you choose
          </p>
          <div className="text-sm text-green-200">
            {winner?.id === user?.id ? "You'll choose topic + opponent's game" : "Winner chooses"}
          </div>
          <div className="text-xs text-gray-300 mt-2">
            Opponent plays mini-games
          </div>
        </button>

        {/* Games Choice */}
        <button
          onClick={() => handleChoiceSelect('games')}
          disabled={winner?.id !== user?.id}
          className={`p-8 rounded-2xl border-2 transition-all transform ${
            winner?.id === user?.id
              ? 'bg-gradient-to-br from-blue-500 to-purple-500 hover:scale-105 cursor-pointer border-blue-400'
              : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-2xl font-bold text-white mb-2">Play Games</h3>
          <p className="text-gray-200 mb-4">
            You play mini-games (currently Basketball)
          </p>
          <div className="text-sm text-blue-200">
            {winner?.id === user?.id ? "You'll choose game + opponent's topic" : "Winner chooses"}
          </div>
          <div className="text-xs text-gray-300 mt-2">
            Opponent answers questions
          </div>
        </button>
      </div>

      {winner?.id === user?.id && (
        <div className="mt-8 p-4 bg-purple-500/20 border border-purple-500 rounded-xl">
          <p className="text-purple-300">
            💡 You'll make two choices: what you play and what your opponent plays!
          </p>
        </div>
      )}
    </div>
  );
};

export default ChoiceSelection;