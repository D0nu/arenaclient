import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';

const QuestionRound = ({ topic, timeLeft, roundStarted, onScoreSubmit }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [floatingScores, setFloatingScores] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  
  const questionsLoadedRef = useRef(false);
  const loadingAttemptedRef = useRef(false);

  // ✅ FIX: Improved question loading with retry mechanism
  const loadQuestions = () => {
    return new Promise((resolve) => {
      if (loadingAttemptedRef.current && questionsLoadedRef.current) {
        resolve();
        return;
      }

      try {
        console.log('🔄 Requesting questions for topic:', topic);
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

        // ✅ FIX: Emit with proper structure
        socket.emit('get-questions', { 
          topic, 
          count: 50,
          userId: user?.id 
        });

        // ✅ FIX: Shorter timeout with retry
        setTimeout(() => {
          if (!questionsLoadedRef.current) {
            console.log('⏰ Question load timeout, will retry...');
            setLoadingError('Questions taking longer than expected');
            cleanup();
            resolve();
          }
        }, 3000);

      } catch (error) {
        console.error('❌ Error in loadQuestions:', error);
        setLoadingError('Failed to load questions');
        loadingAttemptedRef.current = true;
        resolve();
      }
    });
  };

  // ✅ FIX: Improved loading with retry logic
  useEffect(() => {
    console.log('🏁 QuestionRound updated:', {
      topic,
      roundStarted,
      questionsLoaded: questionsLoadedRef.current,
      questionsCount: questions.length,
      loadingAttempted: loadingAttemptedRef.current
    });
    
    if (topic && roundStarted && !questionsLoadedRef.current) {
      console.log('🚀 Starting question load process...');
      
      const attemptLoad = async () => {
        await loadQuestions();
        
        // ✅ FIX: If still no questions after first attempt, try once more
        if (questions.length === 0 && !loadingAttemptedRef.current) {
          console.log('🔄 Retrying question load...');
          setTimeout(async () => {
            loadingAttemptedRef.current = false;
            await loadQuestions();
          }, 2000);
        }
      };
      
      attemptLoad();
    }
  }, [topic, roundStarted]);

  // ✅ FIX: Reset questions when topic changes
  useEffect(() => {
    if (topic) {
      console.log('🔄 Topic changed, resetting questions:', topic);
      setQuestions([]);
      setQuestionsLoaded(false);
      setCurrentQuestionIndex(0);
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
    if (showResult || !roundStarted || questions.length === 0) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const currentQuestion = questions[currentQuestionIndex];
    console.log('🎯 Answer selected:', {
      selected: answerIndex,
      correct: currentQuestion.correctAnswer,
      isCorrect: answerIndex === currentQuestion.correctAnswer
    });
    
    const isCorrect = answerIndex === Number(currentQuestion.correctAnswer);
    const points = isCorrect ? getPointsForTime(timeLeft) : 0;
    
    if (isCorrect) {
      setScore(prev => prev + points);
    }

    addFloatingScore(points, isCorrect);

    if (isCorrect) {
      onScoreSubmit(points);
    }

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

  // ✅ FIXED: Correct answer highlighting
  const getOptionColor = (optionIndex) => {
    if (!showResult) {
      return selectedAnswer === optionIndex 
        ? 'bg-purple-600 border-purple-400' 
        : 'bg-gray-700 hover:bg-gray-600 border-gray-600';
    }

    const currentQuestion = questions[currentQuestionIndex];
    
    // ✅ FIX: Always show correct answer in green
    if (optionIndex === Number(currentQuestion.correctAnswer)) {
      return 'bg-green-600 border-green-400';
    } 
    // ✅ FIX: Show selected wrong answer in red
    else if (optionIndex === selectedAnswer) {
      return 'bg-red-600 border-red-400';
    } 
    // ✅ FIX: Dim other options
    else {
      return 'bg-gray-700 border-gray-600 opacity-50';
    }
  };

  // ✅ FIX: Better loading states
  if (!roundStarted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Round starting soon...</p>
        <p className="text-gray-400 text-sm mt-2">Topic: {topic}</p>
      </div>
    );
  }

  if (loadingError && questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-2xl p-6 max-w-md mx-auto">
          <p className="text-yellow-300 text-lg">Questions Loading Soon...</p>
          <p className="text-gray-400 text-sm mt-2">Topic: {topic}</p>
          <p className="text-gray-500 text-sm mt-1">If questions don't appear, the round may end soon.</p>
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

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading questions...</p>
        <p className="text-gray-400 text-sm mt-2">Topic: {topic}</p>
        <p className="text-gray-500 text-sm mt-1">Preparing your quiz experience</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentPoints = getPointsForTime(timeLeft);

  console.log('🎮 Rendering question:', {
    currentIndex: currentQuestionIndex,
    totalQuestions: questions.length,
    currentQuestion: currentQuestion?.question?.substring(0, 50) + '...'
  });

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
    <div className="max-w-4xl mx-auto relative">
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

      {/* Question Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border-2 border-purple-500 shadow-2xl mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-bold text-white">
            Score: <span className="text-green-400">{score}</span>
          </div>
          <div className="text-xl font-bold text-yellow-400">
            Points: <span className="text-green-400">+{currentPoints}</span>
          </div>
          <div className="text-xl font-bold text-blue-400">
            Q: {currentQuestionIndex + 1}
          </div>
        </div>

        {/* Question */}
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8 leading-relaxed">
          {currentQuestion.question}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className={`p-6 rounded-xl border-2 text-left transition-all duration-300 transform ${
                getOptionColor(index)
              } ${!showResult ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                  !showResult 
                    ? 'bg-gray-600 text-white' 
                    : index === Number(currentQuestion.correctAnswer) 
                    ? 'bg-green-500 text-white'
                    : index === selectedAnswer
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-600 text-white opacity-50'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-lg text-white font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Result Feedback */}
        {showResult && (
          <div className={`mt-6 p-4 rounded-xl text-center font-semibold text-lg ${
            selectedAnswer === Number(currentQuestion.correctAnswer)
              ? 'bg-green-500/20 border border-green-500 text-green-400'
              : 'bg-red-500/20 border border-red-500 text-red-400'
          }`}>
            {selectedAnswer === Number(currentQuestion.correctAnswer) ? (
              <div className="flex items-center justify-center space-x-2">
                <span>✅</span>
                <span>Correct! +{currentPoints} points</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>❌</span>
                <span>Incorrect! The answer was: {currentQuestion.options[currentQuestion.correctAnswer]}</span>
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default QuestionRound;