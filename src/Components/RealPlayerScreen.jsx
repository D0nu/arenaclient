import React, { useState, useEffect } from 'react';

const RealPlayerScreen = ({ player, gameState, playerActions }) => {
  const [currentAction, setCurrentAction] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);

  useEffect(() => {
    if (!player || !playerActions[player.id]) return;

    const action = playerActions[player.id];
    setCurrentAction(action);
    
    // Keep last 10 actions for history
    setActionHistory(prev => [...prev.slice(-9), action]);
  }, [playerActions, player]);

  if (!currentAction) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900 rounded-xl">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">👁️</div>
          <p className="text-gray-400 text-lg">Waiting for {player?.name || 'player'} actions...</p>
          <p className="text-gray-500 text-sm mt-2">Player will appear here when they start playing</p>
        </div>
      </div>
    );
  }

  // Render based on action type
  return (
    <div className="w-full h-full bg-gray-900 rounded-xl p-6 min-h-[400px]">
      {/* Live Indicator */}
      <div className="mb-4 flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-400 font-semibold">LIVE</span>
        <span className="text-gray-400 ml-auto text-sm">
          {new Date(currentAction.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Action Display */}
      <div className="bg-gray-800 rounded-xl p-6 mb-4 min-h-[300px]">
        {renderActionContent(currentAction, gameState)}
      </div>

      {/* Action History Timeline */}
      <div className="bg-gray-800/50 rounded-xl p-4">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>📋</span> Recent Actions
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {actionHistory.slice().reverse().map((action, index) => (
            <div 
              key={index}
              className="text-gray-400 text-sm flex items-center gap-2 py-1"
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-purple-400">{formatActionName(action.action)}</span>
              <span className="ml-auto text-xs text-gray-500">
                {new Date(action.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to render action content
function renderActionContent(action, gameState) {
  switch (action.action) {
    // ============================================
    // QUESTION ACTIONS
    // ============================================
    case 'question-shown':
      return (
        <div className="animate-fadeIn">
          <h3 className="text-xl font-bold text-white mb-4">
            Question {action.data.questionIndex + 1} of {action.data.totalQuestions}
          </h3>
          <p className="text-lg text-gray-200 mb-6 leading-relaxed">
            {action.data.question}
          </p>
          <div className="grid grid-cols-1 gap-3">
            {action.data.options.map((option, index) => (
              <div
                key={index}
                className="p-4 bg-gray-700 rounded-lg text-white flex items-center"
              >
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3 font-bold">
                  {String.fromCharCode(65 + index)}
                </div>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'answer-selected':
      return (
        <div className={`p-6 rounded-xl text-center animate-scaleIn ${
          action.data.isCorrect
            ? 'bg-green-500/20 border-2 border-green-500'
            : 'bg-red-500/20 border-2 border-red-500'
        }`}>
          <div className="text-6xl mb-4 animate-bounce">
            {action.data.isCorrect ? '✅' : '❌'}
          </div>
          <div className={`text-2xl font-bold mb-2 ${
            action.data.isCorrect ? 'text-green-300' : 'text-red-300'
          }`}>
            {action.data.isCorrect ? 'Correct Answer!' : 'Wrong Answer!'}
          </div>
          <div className="text-gray-300 mb-2">
            Selected: <span className="font-bold">{action.data.selectedOption}</span>
          </div>
          {!action.data.isCorrect && (
            <div className="text-gray-400 text-sm">
              Correct answer was: <span className="font-bold text-green-400">{action.data.correctOption}</span>
            </div>
          )}
          {action.data.pointsEarned > 0 && (
            <div className="mt-4 text-yellow-400 text-xl font-bold">
              +{action.data.pointsEarned} points!
            </div>
          )}
        </div>
      );

    case 'moving-to-next':
      return (
        <div className="text-center py-12">
          <div className="text-5xl mb-4 animate-spin">⏭️</div>
          <p className="text-white text-xl">Moving to next question...</p>
          <p className="text-gray-400 text-sm mt-2">
            Reason: {action.data.reason.replace('-', ' ')}
          </p>
        </div>
      );

    // ============================================
    // BASKETBALL ACTIONS
    // ============================================
    case 'game-started':
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏀</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {action.data.gameName.toUpperCase()} Game Started!
          </h2>
          <p className="text-gray-400">Player is setting up...</p>
        </div>
      );

    case 'aiming-started':
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-2">Aiming...</h3>
          <p className="text-gray-400">Player is lining up their shot</p>
        </div>
      );

    case 'aiming':
      return (
        <div className="text-center py-8">
          <div className="relative w-64 h-64 mx-auto bg-gray-800 rounded-lg mb-4">
            {/* Simple aiming visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl">🏀</div>
            </div>
            <div 
              className="absolute w-4 h-4 bg-purple-500 rounded-full animate-pulse"
              style={{
                left: `${(action.data.aimPosition.x / 600) * 100}%`,
                top: `${(action.data.aimPosition.y / 400) * 100}%`
              }}
            ></div>
          </div>
          <p className="text-white text-lg">Adjusting aim...</p>
        </div>
      );

    case 'shot-taken':
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="text-6xl mb-4 animate-bounce">🏀</div>
          <h3 className="text-2xl font-bold text-white mb-2">Shot Taken!</h3>
          <div className="mt-4">
            <div className="text-gray-400 mb-2">Shot Power:</div>
            <div className="w-full bg-gray-700 rounded-full h-4 max-w-xs mx-auto">
              <div 
                className="bg-purple-500 h-4 rounded-full transition-all"
                style={{ width: `${Math.min(100, (action.data.power / 15) * 100)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-gray-400 mt-4">Ball in flight...</p>
        </div>
      );

    case 'scored':
      return (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-8 text-center animate-scaleIn">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <div className="text-white text-4xl font-bold mb-2">
            BASKET!
          </div>
          <div className="text-white text-2xl mb-2">
            +{action.data.points} POINTS
          </div>
          <div className="text-white/80 text-xl">
            Total Score: {action.data.totalScore}
          </div>
        </div>
      );

    // ============================================
    // DART ACTIONS
    // ============================================
    case 'charging-started':
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 animate-pulse">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-2">Charging Throw...</h3>
          <p className="text-gray-400">Hold to increase power!</p>
        </div>
      );

    case 'dart-thrown':
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="text-6xl mb-4 animate-ping">🎯</div>
          <h3 className="text-2xl font-bold text-white mb-2">Dart Thrown!</h3>
          <div className="mt-4">
            <div className="text-gray-400 mb-2">Power: {Math.round(action.data.powerPercent * 100)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-4 max-w-xs mx-auto">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${action.data.powerPercent * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-gray-400 mt-4">Dart in flight...</p>
        </div>
      );

    case 'target-hit':
      return (
        <div className={`p-6 rounded-xl text-center animate-scaleIn ${
          action.data.isNegative
            ? 'bg-red-500/20 border-2 border-red-500'
            : 'bg-green-500/20 border-2 border-green-500'
        }`}>
          <div className="text-6xl mb-4 animate-bounce">
            {action.data.isNegative ? '❌' : '🎯'}
          </div>
          <div className={`text-3xl font-bold mb-2 ${
            action.data.isNegative ? 'text-red-300' : 'text-green-300'
          }`}>
            {action.data.isNegative ? 'Hit Penalty Target!' : 'Direct Hit!'}
          </div>
          <div className={`text-2xl font-bold ${
            action.data.isNegative ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {action.data.points > 0 ? '+' : ''}{action.data.points} points
          </div>
          <div className="text-white mt-2">
            Total Score: {action.data.totalScore}
          </div>
        </div>
      );

    // ============================================
    // CONQUEST ACTIONS
    // ============================================
    case 'player-moving':
      return (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">
            {action.data.direction === 'left' ? '←' : '→'}
          </div>
          <p className="text-white text-xl">Moving {action.data.direction}</p>
          <p className="text-gray-400 text-sm mt-2">
            Position: ({Math.round(action.data.position.x)}, {Math.round(action.data.position.y)})
          </p>
        </div>
      );

    case 'player-jumped':
      return (
        <div className="text-center py-8 animate-bounce">
          <div className="text-6xl mb-4">⬆️</div>
          <p className="text-white text-xl font-bold">Jumped!</p>
        </div>
      );

    case 'player-crouching':
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⬇️</div>
          <p className="text-white text-xl font-bold">Crouching</p>
          <p className="text-gray-400 text-sm mt-2">Dodging attacks...</p>
        </div>
      );

    case 'attack-charging':
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4 animate-pulse">⚔️</div>
          <p className="text-white text-xl font-bold">Charging Attack...</p>
          <p className="text-gray-400">Weapon: {action.data.weapon}</p>
        </div>
      );

    case 'attack-released':
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="text-6xl mb-4 animate-ping">💥</div>
          <p className="text-white text-xl font-bold">Attack Released!</p>
          <div className="mt-4">
            <div className="text-gray-400 mb-2">Charge: {Math.round(action.data.chargePower * 100)}%</div>
            <div className="w-full bg-gray-700 rounded-full h-4 max-w-xs mx-auto">
              <div 
                className="bg-red-500 h-4 rounded-full transition-all"
                style={{ width: `${action.data.chargePower * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      );

    case 'enemy-killed':
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-8 text-center animate-scaleIn">
          <div className="text-6xl mb-4 animate-bounce">
            {action.data.isBoss ? '👑' : '💀'}
          </div>
          <div className="text-white text-3xl font-bold mb-2">
            {action.data.isBoss ? 'BOSS DEFEATED!' : 'Enemy Killed!'}
          </div>
          <div className="text-white text-lg mb-2">
            Type: {action.data.enemyType}
          </div>
          <div className="text-yellow-400 text-2xl font-bold">
            +{action.data.points} points
          </div>
          <div className="text-white mt-2">
            Total Score: {action.data.totalScore} | Kills: {action.data.totalKills}
          </div>
        </div>
      );

    case 'player-died':
      return (
        <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-xl p-8 text-center animate-scaleIn">
          <div className="text-6xl mb-4 animate-pulse">💀</div>
          <div className="text-white text-3xl font-bold mb-2">
            Player Died!
          </div>
          <div className="text-red-200 text-xl">
            -6 points penalty
          </div>
          <div className="text-white mt-2">
            New Score: {action.data.newScore}
          </div>
          <div className="text-gray-300 text-sm mt-4">
            Total Deaths: {action.data.totalDeaths}
          </div>
          <p className="text-gray-400 text-sm mt-4">Respawning...</p>
        </div>
      );

    // ============================================
    // SCORE & SOUND ACTIONS
    // ============================================
    case 'score-update':
      return (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-white text-xl">Score Updated</p>
          <div className="text-3xl font-bold text-yellow-400 mt-2">
            {action.data.scoreChange > 0 ? '+' : ''}{action.data.scoreChange}
          </div>
          <p className="text-gray-400 mt-2">
            Total: {action.data.newScore}
          </p>
        </div>
      );

    case 'sound-played':
      return (
        <div className="text-center py-8 animate-ping">
          <div className="text-6xl mb-4">🔊</div>
          <p className="text-white text-xl">Sound Effect</p>
          <p className="text-gray-400 mt-2">{action.data.sound}</p>
        </div>
      );

    default:
      return (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🎮</div>
          <p className="text-white text-xl">{formatActionName(action.action)}</p>
          <pre className="text-gray-400 text-xs mt-4 text-left">
            {JSON.stringify(action.data, null, 2)}
          </pre>
        </div>
      );
  }
}


function formatActionName(action) {
  return action
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default RealPlayerScreen;
