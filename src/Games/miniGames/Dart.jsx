import React, { useEffect, useRef, useState } from 'react';

const DartGame = ({ timeLeft = 180, roundStarted = true, onScoreSubmit }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  
  // Game state
  const [score, setScore] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [darts, setDarts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [floatingScores, setFloatingScores] = useState([]);

  // Refs for game objects
  const scaleRef = useRef(1);
  const lastTargetSpawnRef = useRef(0);
  const targetsRef = useRef([]);
  
  // Keyboard controls
  const keysRef = useRef({});
  const dartPositionRef = useRef({ x: 200, y: 550 });
  const isAimingRef = useRef(false);
  const powerRef = useRef(0);

  // Constants
  const BASE_WIDTH = 400;
  const BASE_HEIGHT = 600;
  const GRAVITY = 0;
  const MAX_DART_POWER = 600;
  const DART_SPEED = 35;
  
  // Target properties
  const TARGET_RADIUS = 25;
  const TARGET_SPAWN_Y = 150;
  const BASE_TARGET_SPEED = 80;
  const MAX_TARGETS = 3;

  // Initialize game
  useEffect(() => {
    if (!roundStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight - 120;
      
      const scaleX = containerWidth / BASE_WIDTH;
      const scaleY = containerHeight / BASE_HEIGHT;
      const scale = Math.min(scaleX, scaleY, 1.5);
      
      scaleRef.current = scale;
      
      canvas.width = BASE_WIDTH * scale;
      canvas.height = BASE_HEIGHT * scale;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    setIsRunning(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [roundStarted]);

  // Keep targetsRef updated
  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isAimingRef.current) {
          isAimingRef.current = true;
          powerRef.current = 0;
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
      
      if (e.code === 'Space' && isAimingRef.current) {
        e.preventDefault();
        throwDart();
        isAimingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game timing and target spawning
  useEffect(() => {
    if (!roundStarted || !isRunning) return;

    const gameLoop = () => {
      update();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [roundStarted, isRunning]);

  // Submit score when game ends
  useEffect(() => {
    if (timeLeft <= 0 && isRunning) {
      endGame();
    }
  }, [timeLeft, isRunning]);

  const endGame = () => {
    setIsRunning(false);
    if (onScoreSubmit) {
      console.log('Submitting final score:', score); // Debug log
      onScoreSubmit(score);
    }
  };

  // Calculate target speed based on remaining time
  const getTargetSpeed = () => {
    return timeLeft <= 60 ? BASE_TARGET_SPEED * 2 : BASE_TARGET_SPEED;
  };

  const spawnTarget = () => {
    const now = Date.now();
    
    if (targets.length >= MAX_TARGETS && now - lastTargetSpawnRef.current < 2000) return;
    
    lastTargetSpawnRef.current = now;

    // 25% chance to spawn a negative point target (-1 point)
    const isNegativeTarget = Math.random() < 0.25;
    
    const newTarget = {
      id: Date.now() + Math.random(),
      x: Math.random() > 0.5 ? -TARGET_RADIUS : BASE_WIDTH + TARGET_RADIUS,
      y: TARGET_SPAWN_Y + (Math.random() * 100),
      radius: TARGET_RADIUS,
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: getTargetSpeed(),
      hit: false,
      spawnTime: now,
      isNegative: isNegativeTarget // NEW: Mark if this is a negative point target
    };

    setTargets(prev => [...prev, newTarget].slice(-MAX_TARGETS));
  };

  const throwDart = () => {
    const power = Math.min(powerRef.current, MAX_DART_POWER);
    if (power < 100) return;

    const dx = (keysRef.current['ArrowRight'] ? 1 : keysRef.current['ArrowLeft'] ? -1 : 0) * 0.5;
    const dy = -1;

    const powerFactor = power / MAX_DART_POWER;

    const initialVx = dx * DART_SPEED * powerFactor * 3;
    const initialVy = dy * DART_SPEED * powerFactor * 6;
    
    const initialRotation = Math.atan2(initialVy, initialVx);

    const newDart = {
      id: Date.now() + Math.random(),
      x: dartPositionRef.current.x,
      y: dartPositionRef.current.y,
      vx: initialVx,
      vy: initialVy,
      radius: 8,
      launched: true,
      active: true,
      rotation: initialRotation
    };

    setDarts(prev => [...prev, newDart]);
  };

  const update = () => {
    // Update dart position during aiming
    if (!isAimingRef.current) {
      if (keysRef.current['ArrowLeft']) {
        dartPositionRef.current.x = Math.max(50, dartPositionRef.current.x - 5);
      }
      if (keysRef.current['ArrowRight']) {
        dartPositionRef.current.x = Math.min(BASE_WIDTH - 50, dartPositionRef.current.x + 5);
      }
    } else {
      powerRef.current += 10;
      powerRef.current = Math.min(powerRef.current, MAX_DART_POWER);
    }

    // Spawn targets periodically
    const spawnChance = targets.length === 0 ? 0.02 : 
                       targets.length === 1 ? 0.015 : 
                       targets.length === 2 ? 0.01 : 0.005;
    
    if (Math.random() < spawnChance && targets.length < MAX_TARGETS) {
      spawnTarget();
    }

    // Update targets
    setTargets(prev => 
      prev.map(target => {
        if (target.hit) return target;
        
        const currentSpeed = getTargetSpeed();
        let newX = target.x + (currentSpeed * target.direction * (1/60));
        
        const buffer = TARGET_RADIUS * 4;
        if (newX < -buffer || newX > BASE_WIDTH + buffer) {
          return null;
        }
        
        return { ...target, x: newX, speed: currentSpeed };
      }).filter(Boolean)
    );

    // Update darts with collision detection
    setDarts(prev => {
      const currentTargets = targetsRef.current;
      return prev.map(dart => {
        if (!dart.active || !dart.launched) return dart;

        const newVY = dart.vy;
        const newX = dart.x + (dart.vx / 60);
        const newY = dart.y + (newVY / 60);

        const newRotation = Math.atan2(newVY, dart.vx);

        let hitTarget = false;
        let hitTargetId = null;
        
        currentTargets.forEach(target => {
          if (!target.hit) {
            const distance = Math.sqrt((newX - target.x) ** 2 + (newY - target.y) ** 2);
            if (distance < dart.radius + target.radius) {
              hitTarget = true;
              hitTargetId = target.id;
              handleTargetHit(target, newX, newY);
              setTargets(prevTargets => 
                prevTargets.map(t => 
                  t.id === target.id ? { ...t, hit: true } : t
                )
              );
            }
          }
        });

        if (newX < -50 || newX > BASE_WIDTH + 50 || newY < -50 || newY > BASE_HEIGHT + 50 || hitTarget) {
          return { ...dart, active: false };
        }

        return {
          ...dart,
          x: newX,
          y: newY,
          vy: newVY,
          rotation: newRotation
        };
      }).filter(dart => dart.active);
    });

    // Update floating scores
    setFloatingScores(prev => 
      prev.map(score => ({
        ...score,
        y: score.y - 2,
        opacity: Math.max(0, score.opacity - 0.02)
      })).filter(score => score.opacity > 0)
    );
  };

  const handleTargetHit = (target, hitX, hitY) => {
    // FIXED: -1 penalty points and proper +3 scoring when time < 60
    let points;
    if (target.isNegative) {
      points = -1; // FIXED: Changed from -3 to -1
    } else {
      points = timeLeft <= 60 ? 3 : 2; // FIXED: Properly check time for +3 points
    }
    
    setScore(prev => {
      const newScore = Math.max(0, prev + points); // Prevent negative total score
      return newScore;
    });

    // Add floating score with different color for negative points
    setFloatingScores(prev => [
      ...prev,
      { 
        x: hitX, 
        y: hitY, 
        points, 
        opacity: 1, 
        id: Date.now() + Math.random(),
        isNegative: points < 0
      }
    ]);

    // Remove hit target after a short delay
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== target.id));
    }, 100);
  };

  const getPointsForTime = (time) => {
    // FIXED: Return actual points based on time
    return time <= 60 ? 3 : 2;
  };

  const render = (ctx) => {
    const scale = scaleRef.current;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, BASE_WIDTH * scale, BASE_HEIGHT * scale);

    // Draw dartboard background
    ctx.fillStyle = '#16213e';
    ctx.fillRect(20 * scale, 20 * scale, (BASE_WIDTH - 40) * scale, (BASE_HEIGHT - 40) * scale);

    // Draw center line
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo((BASE_WIDTH / 2) * scale, 0);
    ctx.lineTo((BASE_WIDTH / 2) * scale, BASE_HEIGHT * scale);
    ctx.stroke();

    // Draw throwing line
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(50 * scale, (BASE_HEIGHT - 40) * scale);
    ctx.lineTo((BASE_WIDTH - 50) * scale, (BASE_HEIGHT - 40) * scale);
    ctx.stroke();

    // Draw targets (dartboards) - UPDATED for negative targets
    targets.forEach(target => {
      if (target.hit) {
        // Hit target - show explosion effect
        ctx.fillStyle = target.isNegative ? '#ff0000' : '#e94560'; // Red for negative targets
        ctx.beginPath();
        ctx.arc(target.x * scale, target.y * scale, (target.radius + 8) * scale, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = target.isNegative ? '#ff6666' : '#ff9e00';
        ctx.beginPath();
        ctx.arc(target.x * scale, target.y * scale, (target.radius + 4) * scale, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Regular target - different colors for negative targets
        if (target.isNegative) {
          // Red-themed negative target
          const rings = [
            { radius: target.radius, color: '#ff0000' },
            { radius: target.radius * 0.7, color: '#ff6666' },
            { radius: target.radius * 0.4, color: '#ff0000' },
            { radius: target.radius * 0.2, color: '#ff6666' }
          ];

          rings.forEach(ring => {
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(target.x * scale, target.y * scale, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(target.x * scale, target.y * scale, (target.radius * 0.1) * scale, 0, Math.PI * 2);
          ctx.fill();

          // Draw "X" mark on negative targets
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 * scale;
          ctx.beginPath();
          ctx.moveTo((target.x - target.radius * 0.6) * scale, (target.y - target.radius * 0.6) * scale);
          ctx.lineTo((target.x + target.radius * 0.6) * scale, (target.y + target.radius * 0.6) * scale);
          ctx.moveTo((target.x + target.radius * 0.6) * scale, (target.y - target.radius * 0.6) * scale);
          ctx.lineTo((target.x - target.radius * 0.6) * scale, (target.y + target.radius * 0.6) * scale);
          ctx.stroke();
        } else {
          // Normal positive target
          const rings = [
            { radius: target.radius, color: '#e94560' },
            { radius: target.radius * 0.7, color: '#ffffff' },
            { radius: target.radius * 0.4, color: '#e94560' },
            { radius: target.radius * 0.2, color: '#ffffff' }
          ];

          rings.forEach(ring => {
            ctx.fillStyle = ring.color;
            ctx.beginPath();
            ctx.arc(target.x * scale, target.y * scale, ring.radius * scale, 0, Math.PI * 2);
            ctx.fill();
          });

          ctx.fillStyle = '#e94560';
          ctx.beginPath();
          ctx.arc(target.x * scale, target.y * scale, (target.radius * 0.1) * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Draw aiming dart at bottom
    if (!isAimingRef.current) {
      // Regular dart position
      ctx.fillStyle = '#4F46E5';
      ctx.beginPath();
      ctx.arc(dartPositionRef.current.x * scale, dartPositionRef.current.y * scale, 8 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Dart point (pointing upward)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(dartPositionRef.current.x * scale, (dartPositionRef.current.y - 20) * scale);
      ctx.lineTo((dartPositionRef.current.x - 5) * scale, (dartPositionRef.current.y - 8) * scale);
      ctx.lineTo((dartPositionRef.current.x + 5) * scale, (dartPositionRef.current.y - 8) * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      // Charging dart - pulsing effect
      const pulse = Math.sin(Date.now() * 0.01) * 3;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(dartPositionRef.current.x * scale, dartPositionRef.current.y * scale, (8 + pulse) * scale, 0, Math.PI * 2);
      ctx.fill();
      
      // Power indicator
      const powerPercent = powerRef.current / MAX_DART_POWER;
      ctx.fillStyle = `rgb(255, ${255 * (1 - powerPercent)}, 0)`;
      ctx.fillRect(
        (dartPositionRef.current.x - 20) * scale, 
        (dartPositionRef.current.y + 15) * scale, 
        40 * scale * powerPercent, 
        5 * scale
      );
      
      // Show aiming direction with line
      const dx = (keysRef.current['ArrowRight'] ? 1 : keysRef.current['ArrowLeft'] ? -1 : 0) * 0.5;
      const dy = -1;
      const angle = Math.atan2(dy, dx);
      const length = 40 * powerPercent;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(dartPositionRef.current.x * scale, dartPositionRef.current.y * scale);
      ctx.lineTo(
        dartPositionRef.current.x * scale + Math.cos(angle) * length * scale,
        dartPositionRef.current.y * scale + Math.sin(angle) * length * scale
      );
      ctx.stroke();
    }

    // Draw flying darts
    darts.forEach(dart => {
      if (!dart.active) return;

      ctx.save();
      ctx.translate(dart.x * scale, dart.y * scale);
      ctx.rotate(dart.rotation);
      
      // Dart body
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(-6 * scale, -2 * scale, 12 * scale, 4 * scale);
      
      // Dart tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(6 * scale, 0);
      ctx.lineTo(12 * scale, -3 * scale);
      ctx.lineTo(12 * scale, 3 * scale);
      ctx.closePath();
      ctx.fill();
      
      // Dart fins
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-6 * scale, -2 * scale);
      ctx.lineTo(-10 * scale, -6 * scale);
      ctx.lineTo(-6 * scale, 2 * scale);
      ctx.closePath();
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 2 * scale);
      ctx.lineTo(-10 * scale, 6 * scale);
      ctx.lineTo(-6 * scale, -2 * scale);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });

    // Draw floating scores - UPDATED for negative points
    floatingScores.forEach((fs) => {
      ctx.font = `bold ${20 * scale}px Arial`;
      ctx.fillStyle = fs.isNegative ? `rgba(255, 0, 0, ${fs.opacity})` : `rgba(0, 255, 0, ${fs.opacity})`;
      ctx.textAlign = 'center';
      ctx.fillText(`${fs.points > 0 ? '+' : ''}${fs.points}`, fs.x * scale, fs.y * scale);
      ctx.textAlign = 'left';
    });

    // Draw UI text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20 * scale, 30 * scale);

    // FIXED: Show correct points based on current time
    const currentPoints = timeLeft <= 60 ? 3 : 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText(`Points: +${currentPoints} / -1`, 20 * scale, 55 * scale); // Updated to show -1 penalty

    ctx.fillText(`Target Speed: ${timeLeft <= 60 ? 'FAST' : 'NORMAL'}`, 20 * scale, 80 * scale);
    
    // Draw controls help
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = `bold ${12 * scale}px Arial`;
    ctx.fillText(`←→ Move Dart`, 20 * scale, (BASE_HEIGHT - 20) * scale);
    ctx.fillText(`SPACE: Charge & Throw`, 20 * scale, (BASE_HEIGHT - 5) * scale);

    // UPDATED: Warning about red targets with -1 points
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.fillText(`⚠ Red Targets: -1 point!`, (BASE_WIDTH - 150) * scale, (BASE_HEIGHT - 5) * scale);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render loop
  useEffect(() => {
    if (!roundStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let renderFrame;
    const renderLoop = () => {
      render(ctx);
      renderFrame = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (renderFrame) {
        cancelAnimationFrame(renderFrame);
      }
    };
  }, [roundStarted, targets, darts, floatingScores, score, timeLeft]);

  if (!roundStarted) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-8">Dart Game</h1>
          <p className="text-gray-300">Waiting for round to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full h-screen flex flex-col items-center justify-center bg-gray-900 p-2 sm:p-4"
    >
      {/* Game HUD */}
      <div className="w-full max-w-md flex justify-between items-center mb-2 sm:mb-4 text-white px-2">
        <div className="text-lg sm:text-2xl font-bold">
          🎯 Score: <span className="text-green-400">{score}</span>
        </div>
        <div className="text-lg sm:text-2xl font-bold">
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative bg-gray-800 border-2 border-gray-600 rounded-lg shadow-2xl overflow-hidden w-full max-w-md" style={{ height: '70vh' }}>
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />
        
        {!isRunning && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl sm:text-2xl mb-2">Final Score: {score}</p>
              <p className="text-lg sm:text-xl mb-6">Time: {formatTime(180 - timeLeft)}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 sm:py-2 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-4 text-gray-300 text-center max-w-md w-full px-2">
        <p className="text-xs sm:text-sm">
          <strong>Arrow Keys: Move Dart • SPACE: Charge & Throw</strong> • 
          Hit moving targets • 
          Unlimited darts • 
          Scoring: {timeLeft <= 60 ? '+3' : '+2'} points / <span className="text-red-400">-1 point for red targets</span> •
          {timeLeft <= 60 && ' ⚡ FAST TARGETS!'}
        </p>
      </div>
    </div>
  );
};

export default DartGame;