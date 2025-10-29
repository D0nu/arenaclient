import React, { useRef, useEffect } from 'react';

const BasketballGame = ({timeLeft, onScoreSubmit, userScore}) =>  {
  const canvasRef = useRef(null);
  const scoreRef = useRef(0);
  const gameStateRef = useRef({ state: 'idle' });
  const [score, setScore] = React.useState(0);
  let hasScored = false;



  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    // Load images
    const ballImg = new Image();
    ballImg.src = '/basketball.png'; // Side view basketball image
    const netImg = new Image();
    netImg.src = '/net.png'; // Flexible net image

    let imagesLoaded = 0;
    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === 2) {
        initGame();
      }
    };
    ballImg.onload = onImageLoad;
    netImg.onload = onImageLoad;

    const minX = 150;
    const maxX = 250;
    // Game variables
    let ball = { x: Math.random() * (maxX - minX) + minX, y: 200, radius: 20, vx: 0, vy: 0, visible: true };
    let hoop = { x: 450, y: 100, width: 60, height: 60 }; // Hoop position/size
    const gravity = 0.5;
    const elasticity = 0.6; // Bounce factor
   
    let isAiming = false;
    let aimX = 0;
    let aimY = 0;
    let state = 'idle'; // idle, aiming, shooting, netAnimation, over
    let animationFrame = 0;
    let ballFallSpeed = 4; // Speed for downward animation after net entry
    let shakeOffsetX = 1; // For net shake effect

    // Draw function
    const draw = () => {
       ctx.fillStyle = '#2E8B57'; // Forest green color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw net/hoop with shake if animating
      if (state === 'netAnimation' && animationFrame < 30) { // 30 frames for ~0.5-second shake
        const shakeAmplitude = 5; // Pixel amplitude for shake
        shakeOffsetX = Math.sin(animationFrame * Math.PI / 15) * shakeAmplitude; // Left-right wobble
        ctx.save();
        ctx.translate(hoop.x + shakeOffsetX, hoop.y);
        ctx.drawImage(netImg, 0, 0, hoop.width, hoop.height);
        ctx.restore();

        // Animate ball falling down the net
        if (ball.visible) {
          ball.y += ballFallSpeed;
          ctx.drawImage(ballImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
          if (ball.y > canvas.height) {
            ball.visible = false; // Disappear after hitting ground
            resetBall();
          }
        }
        animationFrame++;
      } else {
        ctx.drawImage(netImg, hoop.x, hoop.y, hoop.width, hoop.height);
      }

      // Draw basketball if visible
      if (ball.visible && state !== 'netAnimation') {
        ctx.drawImage(ballImg, ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2);
      }

      // Draw score and time
      ctx.font = '20px Arial font-bold';
      ctx.fillStyle = 'white';
      ctx.fillText(`Score: ${userScore}`, 10, 30)
      ctx.fillText(`Time: ${timeLeft}`, 500, 30);
      setInterval(() => {
        ctx.clearRect(500, 30, 100, 40);
        ctx.fillText(`Time: ${timeLeft}`, 500, 30);
      }, 1000);

      // Draw dotted trajectory if aiming
      if (isAiming) {
        drawDottedTrajectory();
      }
    };
     const getPointsForTime = (timeLeft) => {
      if (timeLeft > 60) return 1;
      return 2;
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

    // Draw dotted white parabolic trajectory
    const drawDottedTrajectory = () => {
      const dx = aimX - ball.x;
      const dy = aimY - ball.y;
      const scale = 10;
      const previewVx = dx / scale;
      const previewVy = -dy / scale;

      let tx = ball.x;
      let ty = ball.y;
      ctx.fillStyle = 'white';
      for (let t = 0; t < 100; t += 2) {
        const px = tx + previewVx * t;
        const py = ty + previewVy * t + 0.5 * gravity * t * t;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
        if (py > canvas.height || px > canvas.width || px < 0) break;
      }
    };

    // Update physics and logic
    const update = () => {
      if (state === 'shooting' && ball.visible) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += gravity;

        // Ground collision/bounce if missed
        if (ball.y + ball.radius > canvas.height) {
          ball.y = canvas.height - ball.radius;
          ball.vy = -ball.vy * elasticity;
          ball.vx *= 0.8;
        }

        // Hoop interactions
          if (checkScore() && !hasScored) {
            hasScored = true;
            const points = getPointsForTime(timeLeft); // Use time-based scoring
            state = 'netAnimation';
            animationFrame = 0;
            ball.x = hoop.x + hoop.width / 2; // Center ball at hoop
            ball.vx = 0;
            ball.vy = 0;

            // Update score correctly
            setScore(prev => {
              const newScore = prev + points;
              userScore = newScore;
              onScoreSubmit?.(points); // optional live update
              return newScore;
            });

          scoreRef.current = score;
        } else if (checkRimBounce()) {
          if (ball.vy < 0) ball.vy = -ball.vy * elasticity;
          if (Math.abs(ball.x - (hoop.x + hoop.width / 2)) > hoop.width / 2 - ball.radius) {
            ball.vx = -ball.vx * elasticity;
          }

        }

        // Out of bounds reset if missed
        // if (ball.x > canvas.width + 100 || ball.x < -100) {
        // }
        ball.visible = false;
        resetBall();
      }

      // Update timer
      if (gameStateRef.current.state !== 'over') {
        const newTime = timeLeft - 1/60;
        if (newTime <= 0) {
          gameStateRef.current.state = 'over';
          // Submit the actual score (one point per basket)
          onScoreSubmit(scoreRef.current);
        }
      }
    };

    // Check rim bounce
    const checkRimBounce = () => {
      const hitTop = ball.y + ball.radius > hoop.y && ball.y - ball.radius < hoop.y + 10 && ball.vy > 0;
      const hitBottom = ball.y - ball.radius < hoop.y + hoop.height && ball.y + ball.radius > hoop.y + hoop.height - 10 && ball.vy < 0;
      const hitLeft = ball.x + ball.radius > hoop.x && ball.x - ball.radius < hoop.x + 10;
      const hitRight = ball.x - ball.radius < hoop.x + hoop.width && ball.x + ball.radius > hoop.x + hoop.width - 10;
      return (hitTop || hitBottom || hitLeft || hitRight) &&
        ball.x > hoop.x - ball.radius && ball.x < hoop.x + hoop.width + ball.radius &&
        ball.y > hoop.y - ball.radius && ball.y < hoop.y + hoop.height + ball.radius;
    };

    // Reset ball position with new random x
    const resetBall = () => {
      hasScored = false;
      ball.x = Math.random() * (maxX - minX) + minX;
      ball.y = 200;
      ball.vx = 0;
      ball.vy = 0;
      ball.visible = true;
      state = 'idle';
    };

    // Check if ball enters net
    const checkScore = () => {
      return (
        ball.x > hoop.x && ball.x < hoop.x + hoop.width &&
        ball.y > hoop.y && ball.y < hoop.y + hoop.height &&
        ball.vy > 0
      );
    };

    // Mouse events
    const handleMouseDown = (e) => {
      if (state === 'over') return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.hypot(mx - ball.x, my - ball.y) < ball.radius && ball.visible) {
        isAiming = true;
        aimX = mx;
        aimY = my;
        state = 'aiming';
      }
    };

    const handleMouseMove = (e) => {
      if (isAiming) {
        const rect = canvas.getBoundingClientRect();
        aimX = e.clientX - rect.left;
        aimY = e.clientY - rect.top;
      }
    };

    const handleMouseUp = () => {
      if (isAiming) {
        isAiming = false;
        const dx = aimX - ball.x;
        const dy = aimY - ball.y;
        const scale = 10;
        ball.vx = dx / scale;
        ball.vy = -dy / scale;
        state = 'shooting';
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Game loop
    const gameLoop = () => {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    const initGame = () => {
      gameLoop();
    };

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ border: '1px solid black' }} />;
};

export default BasketballGame;