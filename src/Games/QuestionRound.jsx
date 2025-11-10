import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useParams } from 'react-router-dom';
import { useAudio } from '../Context/AudioContext';

const QuestionRound = ({ 
  topic, 
  timeLeft, 
  roundStarted, 
  onScoreSubmit, 
  isSpectator = false 
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { id: roomCode } = useParams(); 
  const { playSound } = useAudio();
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [floatingScores, setFloatingScores] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  
  // Track ALL player answers with details
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [playerScores, setPlayerScores] = useState({});
  
  // ✅ NEW: Track individual player states for true POV
  const [playerAnswerStates, setPlayerAnswerStates] = useState({});
  
  const questionsLoadedRef = useRef(false);
  const loadingAttemptedRef = useRef(false);

  const emitPlayerAction = (action, data) => {
    if (!socket || !roomCode || !user || isSpectator) return;
    
    socket.emit('player-action', {
      roomCode,
      playerId: user._id || user.id,
      playerName: user.name,
      action,
      data,
      timestamp: Date.now()
    });
  };

  // ✅ FIXED: Proper POV tracking for spectators
  useEffect(() => {
    if (!socket) return;

    const handlePlayerScreenUpdate = (data) => {
      console.log('🖥️ Player screen update received:', data);
      
      if (data.action === 'answer-selected') {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return;

        // ✅ Store the player's exact POV state
        setPlayerAnswerStates(prev => ({
          ...prev,
          [data.playerId]: {
            selectedAnswer: data.data.answerIndex,
            showResult: true,
            isCorrect: data.data.isCorrect,
            correctAnswerIndex: Number(currentQuestion.correctAnswer) // ✅ Store correct answer for spectators only
          }
        }));

        // Also update the collective answers display
        setPlayerAnswers(prev => ({
          ...prev,
          [data.playerId]: {
            playerName: data.playerName || data.data.playerName,
            answerIndex: data.data.answerIndex,
            answerText: currentQuestion.options[data.data.answerIndex],
            isCorrect: data.data.isCorrect,
            timestamp: data.timestamp,
          }
        }));

        // Auto-clear individual POV state after result is shown
        setTimeout(() => {
          setPlayerAnswerStates(prev => {
            const newStates = { ...prev };
            delete newStates[data.playerId];
            return newStates;
          });
        }, 2000);

      } else if (data.action === 'score-update') {
        setPlayerScores(prev => ({
          ...prev,
          [data.playerId]: data.data.newScore
        }));
      }
    };

    const handlePlayerAnswered = (data) => {
      console.log('👥 Player answered (broadcast):', data);
      
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const isCorrect = data.answerIndex === Number(currentQuestion.correctAnswer);
      
      setPlayerAnswers(prev => ({
        ...prev,
        [data.playerId]: {
          playerName: data.playerName,
          answerIndex: data.answerIndex,
          answerText: currentQuestion.options[data.answerIndex],
          isCorrect: isCorrect,
          timestamp: data.timestamp || Date.now(),
        }
      }));

      // Auto-clear after 5 seconds to prevent clutter
      setTimeout(() => {
        setPlayerAnswers(prev => {
          const newAnswers = { ...prev };
          delete newAnswers[data.playerId];
          return newAnswers;
        });
      }, 5000);
    };

    const handleScoreUpdated = (data) => {
      console.log('📊 Score updated:', data);
      if (data.playerId) {
        setPlayerScores(prev => ({
          ...prev,
          [data.playerId]: data.playerScores?.[data.playerId] || prev[data.playerId] || 0
        }));
      }
    };

    // ✅ FIXED: Listen for question changes from game
    const handleQuestionSelected = (data) => {
      console.log('❓ Question selected from game:', data.question?.question.substring(0, 50));
      if (data.question) {
        // Find the matching question in our list
        const questionIndex = questions.findIndex(q => 
          q.question === data.question.question
        );
        if (questionIndex !== -1) {
          setCurrentQuestionIndex(questionIndex);
          // Clear all player states when question changes
          setPlayerAnswerStates({});
          setPlayerAnswers({});
        }
      }
    };

    socket.on('player-screen-update', handlePlayerScreenUpdate);
    socket.on('player-answered', handlePlayerAnswered);
    socket.on('score-updated', handleScoreUpdated);
    socket.on('question-selected', handleQuestionSelected);

    return () => {
      socket.off('player-screen-update', handlePlayerScreenUpdate);
      socket.off('player-answered', handlePlayerAnswered);
      socket.off('score-updated', handleScoreUpdated);
      socket.off('question-selected', handleQuestionSelected);
    };
  }, [socket, questions, currentQuestionIndex, timeLeft]);

  // ✅ FIXED: Load questions when topic changes or round starts
  useEffect(() => {
    if (topic && roundStarted && !questionsLoadedRef.current) {
      console.log('🎯 Loading questions for topic:', topic);
      loadQuestions();
    }
  }, [topic, roundStarted]);

  // Reset when question changes
  useEffect(() => {
    if (questions.length > 0) {
      setPlayerAnswers({});
      setPlayerAnswerStates({});
      
      if (!isSpectator) {
        emitPlayerAction('question-shown', {
          question: questions[currentQuestionIndex]?.question,
          options: questions[currentQuestionIndex]?.options,
          questionIndex: currentQuestionIndex,
          totalQuestions: questions.length,
          topic: topic
        });
      }
    }
  }, [currentQuestionIndex, questions]);

  const loadQuestions = () => {
    return new Promise((resolve) => {
      if (loadingAttemptedRef.current && questionsLoadedRef.current) {
        resolve();
        return;
      }

      try {
        console.log('📚 Requesting questions for topic:', topic);
        loadingAttemptedRef.current = true;
        setLoadingError(null);

        const handleQuestionsLoaded = (data) => {
          console.log('✅ Questions received:', data.questions?.length || 0);
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            setQuestionsLoaded(true);
            questionsLoadedRef.current = true;
            setLoadingError(null);
          } else {
            setLoadingError('No questions received from server');
          }
          cleanup();
          resolve();
        };

        const handleQuestionsError = (error) => {
          console.error('❌ Questions error:', error);
          setLoadingError(error.message || 'Failed to load questions');
          cleanup();
          resolve();
        };

        const cleanup = () => {
          socket.off('questions-loaded', handleQuestionsLoaded);
          socket.off('questions-error', handleQuestionsError);
        };

        socket.on('questions-loaded', handleQuestionsLoaded);
        socket.on('questions-error', handleQuestionsError);

        socket.emit('get-questions', { 
          topic, 
          count: 50,
          userId: user?.id 
        });

        setTimeout(() => {
          if (!questionsLoadedRef.current) {
            console.log('⏰ Question load timeout');
            setLoadingError('Questions taking longer than expected');
            cleanup();
            resolve();
          }
        }, 3000);

      } catch (error) {
        console.error('❌ Error in loadQuestions:', error);
        setLoadingError('Failed to load questions');
        resolve();
      }
    });
  };

  // Reset when topic changes
  useEffect(() => {
    if (topic) {
      setQuestions([]);
      setQuestionsLoaded(false);
      setCurrentQuestionIndex(0);
      setPlayerAnswers({});
      setPlayerAnswerStates({});
      setPlayerScores({});
      questionsLoadedRef.current = false;
      loadingAttemptedRef.current = false;
      setLoadingError(null);
    }
  }, [topic]);

  const getPointsForTime = (timeLeft) => {
    if (timeLeft > 120) return 2;
    if (timeLeft > 60) return 3;
    return 5;
  };

  const addFloatingScore = (points, isCorrect) => {
    const id = Date.now();
    const newScore = {
      id,
      points: isCorrect ? `+${points}` : '+0',
      color: isCorrect ? 'text-green-400' : 'text-red-400',
      top: Math.random() * 50 + 25,
      left: Math.random() * 50 + 25
    };
    
    setFloatingScores(prev => [...prev, newScore]);
    
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(score => score.id !== id));
    }, 2000);
  };

  const handleAnswerSelect = (answerIndex) => {
    if (isSpectator) return;
    if (showResult || !roundStarted || questions.length === 0) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const currentQuestion = questions[currentQuestionIndex];
    
    // ✅ FIXED: Ensure correct answer comparison works properly
    const correctAnswerIndex = Number(currentQuestion.correctAnswer);
    const isCorrect = answerIndex === correctAnswerIndex;
    const points = isCorrect ? getPointsForTime(timeLeft) : 0;
    
    console.log('🎯 Answer selected:', {
      selected: answerIndex,
      correct: correctAnswerIndex,
      isCorrect: isCorrect,
      points: points
    });

    // ✅ FIXED: Emit answer with full details including correct answer
    emitPlayerAction('answer-selected', {
      answerIndex,
      isCorrect,
      questionId: currentQuestion.id || currentQuestionIndex,
      selectedOption: currentQuestion.options[answerIndex],
      correctOption: currentQuestion.options[correctAnswerIndex],
      correctAnswerIndex: correctAnswerIndex, // ✅ ADDED: Send correct index for spectators
      pointsEarned: points
    });

    // Emit to game state
    if (socket && roomCode && user) {
      socket.emit('submit-answer', {
        roomCode,
        answerIndex,
        questionId: currentQuestion.id || currentQuestionIndex
      });
    }

    // Play sounds
    if (isCorrect) {
      playSound('questionCorrect');
    } else {
      playSound('questionWrong');
    }

    if (isCorrect) {
      const newScore = score + points;
      setScore(newScore);
      onScoreSubmit(points);

      // Emit score update
      emitPlayerAction('score-update', {
        newScore: newScore,
        scoreChange: points
      });

      // Submit score to game state
      if (socket && roomCode && user) {
        socket.emit('submit-score', {
          roomCode,
          score: points,
          roundType: 'questions',
          userId: user._id || user.id
        });
      }
    }

    addFloatingScore(points, isCorrect);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setCurrentQuestionIndex(0);
      }
      setSelectedAnswer(null);
      setShowResult(false);
    }, 1500);
  };

  // ✅ FIXED: Player option coloring - NO CORRECT ANSWER REVEALED TO PLAYERS
  const getOptionColor = (optionIndex) => {
    if (!showResult) {
      return selectedAnswer === optionIndex 
        ? 'bg-purple-600 border-purple-400' 
        : 'bg-gray-700 hover:bg-gray-600 border-gray-600';
    }

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswerIndex = Number(currentQuestion.correctAnswer);
    
    // ✅ FIXED: Players only see if THEIR answer was correct/incorrect
    // They DON'T see the actual correct answer
    if (optionIndex === selectedAnswer) {
      return optionIndex === correctAnswerIndex 
        ? 'bg-green-600 border-green-400' 
        : 'bg-red-600 border-red-400';
    } else {
      return 'bg-gray-700 border-gray-600 opacity-50';
    }
  };

  // ✅ FIXED: True POV spectator option coloring
  const getSpectatorOptionColor = (playerId, optionIndex) => {
    const playerState = playerAnswerStates[playerId];
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!playerState || !playerState.showResult) {
      return 'bg-gray-700 border-gray-600';
    }

    const correctAnswerIndex = Number(currentQuestion.correctAnswer);
    
    // Show the exact same view the player sees
    if (optionIndex === correctAnswerIndex) {
      return 'bg-green-600 border-green-400';
    } else if (optionIndex === playerState.selectedAnswer) {
      return 'bg-red-600 border-red-400';
    } else {
      return 'bg-gray-700 border-gray-600 opacity-50';
    }
  };

  // ✅ FIXED: Render individual player POV for spectators
  const renderPlayerPOV = (playerId, playerName) => {
    const playerState = playerAnswerStates[playerId];
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!playerState || !currentQuestion) return null;

    return (
      <div key={playerId} className="mb-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border-2 border-purple-500 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-purple-400">
              {playerName}'s Screen
            </h3>
            <div className="text-sm text-green-400">
              Score: {playerScores[playerId] || 0}
            </div>
          </div>
          
          <h4 className="text-white text-lg mb-4 font-medium">
            {currentQuestion.question}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                  getSpectatorOptionColor(playerId, index)
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 font-bold ${
                    !playerState.showResult 
                      ? 'bg-gray-600 text-white' 
                      : index === Number(currentQuestion.correctAnswer) 
                      ? 'bg-green-500 text-white'
                      : index === playerState.selectedAnswer
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-600 text-white opacity-50'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-white font-medium">{option}</span>
                </div>
              </div>
            ))}
          </div>

          {playerState.showResult && (
            <div className={`mt-4 p-3 rounded-xl text-center font-semibold ${
              playerState.isCorrect
                ? 'bg-green-500/20 border border-green-500 text-green-400'
                : 'bg-red-500/20 border border-red-500 text-red-400'
            }`}>
              {playerState.isCorrect ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>Correct!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>❌</span>
                  <span>Incorrect! The answer was: {currentQuestion.options[playerState.correctAnswerIndex]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnswerOption = (option, index) => {
    const currentQuestion = questions[currentQuestionIndex];
    const playersWhoChoseThis = Object.values(playerAnswers).filter(
      answer => answer.answerIndex === index
    );

    const isCorrectOption = index === Number(currentQuestion.correctAnswer);
    const hasPlayers = playersWhoChoseThis.length > 0;

    const optionColorClass = isSpectator ? 'bg-gray-700 border-gray-600' : getOptionColor(index);

    return (
      <button
        key={index}
        onClick={() => !isSpectator && handleAnswerSelect(index)}
        disabled={showResult || isSpectator}
        className={`p-6 rounded-xl border-2 text-left transition-all duration-300 transform ${
          optionColorClass
        } ${!showResult && !isSpectator ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} relative overflow-hidden`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
              isSpectator 
                ? 'bg-gray-600 text-white'
                : (!showResult 
                    ? 'bg-gray-600 text-white' 
                    : index === selectedAnswer
                      ? (index === Number(currentQuestion.correctAnswer) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-red-500 text-white')
                      : 'bg-gray-600 text-white opacity-50')
            }`}>
              {String.fromCharCode(65 + index)}
            </div>
            <span className="text-lg text-white font-medium">{option}</span>
          </div>
          
          {playersWhoChoseThis.length > 0 && (
            <div className="flex items-center space-x-2 ml-4">
              <div className="flex -space-x-2">
                {playersWhoChoseThis.slice(0, 3).map((answer, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-gray-800 ${
                      answer.isCorrect 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}
                    title={`${answer.playerName}: ${answer.isCorrect ? 'Correct ✅' : 'Wrong ❌'}`}
                  >
                    {answer.playerName.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </button>
    );
  };

  // Loading state component
  const QuestionLoadingState = ({ topic, isPreloading = false }) => (
    <div className="text-center py-12">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 border-purple-500 shadow-2xl max-w-2xl mx-auto">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg mb-2">
          {isPreloading ? 'Pre-loading questions...' : 'Loading questions...'}
        </p>
        <p className="text-gray-400 text-sm mb-4">Topic: {topic}</p>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="bg-purple-500 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (!roundStarted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Round starting soon...</p>
        <p className="text-gray-400 text-sm mt-2">Topic: {topic}</p>
      </div>
    );
  }

  if ((!questionsLoaded && !loadingError) || questions.length === 0) {
    return <QuestionLoadingState topic={topic} isPreloading={!roundStarted} />;
  }

  if (loadingError && questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-6 max-w-md mx-auto">
          <p className="text-yellow-300 text-lg">Questions Loading Soon...</p>
          <p className="text-gray-400 text-sm mt-2">Topic: {topic}</p>
          <button 
            onClick={loadQuestions}
            className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentPoints = getPointsForTime(timeLeft);

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-white text-lg">No question available</p>
        <button 
          onClick={() => setCurrentQuestionIndex(0)}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
        >
          Restart Questions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Floating Scores */}
      {floatingScores.map(score => (
        <div
          key={score.id}
          className={`absolute text-2xl font-bold animate-float ${score.color} pointer-events-none`}
          style={{
            top: `${score.top}%`,
            left: `${score.left}%`,
            animation: 'floatUp 2s ease-out forwards'
          }}
        >
          {score.points}
        </div>
      ))}

      {/* Player View */}
      {!isSpectator && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 border-purple-500 shadow-2xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-xl font-bold text-white">
              Score: <span className="text-green-400">{score}</span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              Q: {currentQuestionIndex + 1}/{questions.length}
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => 
              renderAnswerOption(option, index)
            )}
          </div>

          {showResult && (
            <div className={`mt-6 p-4 rounded-xl text-center font-semibold text-lg ${
              selectedAnswer === Number(currentQuestion.correctAnswer)
                ? 'bg-green-500/20 border border-green-500 text-green-400'
                : 'bg-red-500/20 border border-red-500 text-red-400'
            }`}>
              {selectedAnswer === Number(currentQuestion.correctAnswer) ? (
                <div className="flex items-center justify-center space-x-2">
                  <span>✅</span>
                  <span>Correct!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>❌</span>
                  <span>Incorrect!</span> {/* ✅ FIXED: No correct answer revealed to players */}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Spectator View - Show individual player POVs */}
      {isSpectator && (
        <div>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">👥 Spectator View</h2>
            <p className="text-gray-400">Watching players answer in real-time</p>
          </div>

          {/* Show individual player screens */}
          {Object.keys(playerAnswerStates).length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(playerAnswerStates).map(([playerId, state]) => {
                const playerAnswer = playerAnswers[playerId];
                return renderPlayerPOV(playerId, playerAnswer?.playerName || 'Player');
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 border-purple-500 shadow-2xl">
                <p className="text-white text-lg mb-4">Waiting for players to answer...</p>
                <p className="text-gray-400">Players' screens will appear here when they start answering questions</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div className="text-center">
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100}%` }}
          ></div>
        </div>
        <p className="text-gray-400 text-sm">
          Question: {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-50px);
          }
        }
      `}</style>
    </div>
  );
};

export default QuestionRound;