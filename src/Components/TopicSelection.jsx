// components/TopicSelection.jsx
import React from 'react';

const TOPIC_OPTIONS = [
  { value: "solana", label: "Solana & Crypto", icon: "🔗" },
  { value: "music", label: "Music", icon: "🎵" },
  { value: "sports", label: "Sports", icon: "⚽" },
  { value: "movies", label: "Movies", icon: "🎬" },
  { value: "history", label: "History", icon: "📜" },
  { value: "fashion", label: "Fashion", icon: "👗" }
];

const TopicSelection = ({ winner, onTopicSelect, user, mode = 'winner-topic' }) => {
  // Only the winner can select the topic
  const canSelect = winner?.id === user?.id;

  const handleTopicSelect = (topic) => {
    if (canSelect) {
      onTopicSelect(topic);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          {mode === 'loser-topic' 
            ? "📝 Choose Questions for Opponent" 
            : "🎯 Choose Your Topic!"
          }
        </h2>
        <p className="text-purple-100 text-lg">
          {canSelect 
            ? mode === 'loser-topic'
              ? `${winner.name}, choose a topic for your opponent's questions`
              : `${winner.name}, select a topic for your questions`
            : `${winner.name} is choosing a topic...`
          }
        </p>
        {mode === 'loser-topic' && canSelect && (
          <p className="text-yellow-200 text-sm mt-2">
            You'll be playing Basketball while they answer these questions
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TOPIC_OPTIONS.map((topic) => (
          <button
            key={topic.value}
            onClick={() => handleTopicSelect(topic.value)}
            disabled={!canSelect}
            className={`p-6 rounded-xl border-2 transition-all transform ${
              canSelect
                ? 'bg-gray-800 hover:bg-gray-700 border-purple-500 hover:scale-105 cursor-pointer'
                : 'bg-gray-900 border-gray-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="text-4xl mb-2">{topic.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{topic.label}</h3>
            <p className="text-gray-400 text-sm">
              {canSelect ? 'Click to select' : 'Waiting...'}
            </p>
          </button>
        ))}
      </div>

      {canSelect && (
        <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl">
          <p className="text-yellow-300">
            {mode === 'loser-topic' 
              ? "💡 Choose a challenging topic for your opponent!"
              : "💡 Tip: Choose a topic you're confident about!"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TopicSelection;