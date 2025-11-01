import React, { useRef, useEffect } from 'react';

const BasketballGame = () => {
  const canvasRef = useRef(null);

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

    const minX = 50;
    const maxX = 350;
    // Game variables
    let ball = { x: Math.random() * (maxX - minX) + minX, y: 200, radius: 20, vx: 0, vy: 0, visible: true };
    let hoop = { x: 450, y: 100, width: 60, height: 60 }; // Hoop position/size
    const gravity = 0.5;
    const elasticity = 0.7; // Bounce factor
    let score = 0;
    let timeLeft = 180; // 3-minute timer
    let isAiming = false;
    let aimX = 0;
    let aimY = 0;
    let state = 'idle'; // idle, aiming, shooting, netAnimation, over
    let animationFrame = 0;
    let ballFallSpeed = 5; // Speed for downward animation after net entry

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw net/hoop with distortion if animating
      if (state === 'netAnimation' && animationFrame < 60) { // 60 frames for 1-second animation
        const stretchFactor = 1 + (Math.sin(animationFrame * Math.PI / 30) * 0.3); // Sin wave for distortion
        ctx.save();
        ctx.translate(hoop.x, hoop.y);
        ctx.scale(stretchFactor, 1); // Stretch horizontally
        ctx.drawImage(netImg, 0, 0, hoop.width / stretchFactor, hoop.height);
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
      ctx.font = '20px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Time: ${Math.max(0, Math.floor(timeLeft))}`, 500, 30);

      // Draw dotted trajectory if aiming
      if (isAiming) {
        drawDottedTrajectory();
      }
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
          if (Math.abs(ball.vy) < 1) {
            ball.visible = false; // Disappear after small bounce
            resetBall();
          }
        }

        // Hoop interactions
        if (checkScore()) {
          state = 'netAnimation';
          animationFrame = 0;
          ball.x = hoop.x + hoop.width / 2; // Center ball at hoop
          ball.vx = 0; // Stop horizontal movement
          ball.vy = ballFallSpeed; // Start falling down
          score++;
        } else if (checkRimBounce()) {
          if (ball.vy < 0) ball.vy = -ball.vy * elasticity;
          if (Math.abs(ball.x - (hoop.x + hoop.width / 2)) > hoop.width / 2 - ball.radius) {
            ball.vx = -ball.vx * elasticity;
          }
        }

        // Out of bounds reset if missed
        if (ball.x > canvas.width + 100 || ball.x < -100) {
          ball.visible = false; // Disappear if out of screen
          resetBall();
        }
      }

      // Update timer
      if (state !== 'over') {
        timeLeft -= 1 / 60;
        if (timeLeft <= 0) {
          state = 'over';
        }
      }
    };

const checkScore = () => {
  return (
    ball.x > hoop.x + 8 && ball.x < hoop.x + hoop.width - 8 && // Increased from +5 to +8 (wider net area)
    ball.y > hoop.y + 5 && ball.y < hoop.y + hoop.height - 5 && // Added vertical padding
    ball.vy > 0
  );
};

// Check rim bounce
const checkRimBounce = () => {
  // Increased rim collision areas for more realistic bounces
  const hitTop = ball.y + ball.radius > hoop.y - 8 && ball.y - ball.radius < hoop.y + 15 && ball.vy > 0; // Increased top area
  const hitBottom = ball.y - ball.radius < hoop.y + hoop.height + 8 && ball.y + ball.radius > hoop.y + hoop.height - 15 && ball.vy < 0; // Increased bottom area
  const hitLeft = ball.x + ball.radius > hoop.x - 12 && ball.x - ball.radius < hoop.x + 12; // Increased left area
  const hitRight = ball.x - ball.radius < hoop.x + hoop.width + 12 && ball.x + ball.radius > hoop.x + hoop.width - 12; // Increased right area
  
  return (hitTop || hitBottom || hitLeft || hitRight) &&
    ball.x > hoop.x - ball.radius - 15 && ball.x < hoop.x + hoop.width + ball.radius + 15 &&
    ball.y > hoop.y - ball.radius - 15 && ball.y < hoop.y + hoop.height + ball.radius + 15;
};

    // Reset ball position with new random x
    const resetBall = () => {
      ball.x = Math.random() * (maxX - minX) + minX;
      ball.y = 200;
      ball.vx = 0;
      ball.vy = 0;
      ball.visible = true;
      state = 'idle';
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