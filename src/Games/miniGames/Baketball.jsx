import React, { useRef, useEffect, useState } from 'react';
// import { useBasketballSounds } from './../../hooks/useBasketballSound';

const BasketballGame = ({ timeLeft: propTimeLeft = 180, userScore: initialScore = 0, onScoreSubmit }) => {
  const canvasRef = useRef(null);
  const ballImgRef = useRef(null);
  const [score, setScore] = useState(initialScore);
  const [timeLeft, setTimeLeft] = useState(propTimeLeft);
  const [imageLoaded, setImageLoaded] = useState(false);

  //   const { 
  //   playBounceSound, 
  //   playScoreSound, 
  //   playRimSound, 
  //   playSpawnSound,
  //   playNetSound 
  // } = useBasketballSounds();
  
  const gameStateRef = useRef({
  ball: null,
  net: null,
 
  hoop: { x: 445, y: 120, width: 70, height: 60 },
  
  backboard: { x: 535, y: 60, width: 15, height: 135 },
    gravity: 0.5,
    elasticity: 0.7,
    isAiming: false,
    aimX: 0,
    aimY: 0,
    state: 'idle',
    animationFrame: 0,
    ballFallSpeed: 5,
    ballState: "below",
    canBounceBack: true,
    scored: false,
      prevBallY: null,
    minX: 50,
    maxX: 350,
    hasEnteredNet: false,
    soundCooldown: 0,
  });

  // Load basketball image
  useEffect(() => {
    const img = new Image();
    img.src = '/basketball.png';
    img.onload = () => {
      ballImgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load basketball.png');
      setImageLoaded(true);
    };
  }, []);

  // Physics Net Classes
  class Point {
    constructor(x, y, pinned = false) {
      this.x = x;
      this.y = y;
      this.oldX = x;
      this.oldY = y;
      this.pinned = pinned;
      this.pinnedX = x;
      this.pinnedY = y;
      this.circleInteract = true;
      this.mass = pinned ? 1000 : 1.5;
      this.isEdge = false;
    }

    pin(x, y) {
      this.pinned = true;
      this.pinnedX = x;
      this.pinnedY = y;
      this.mass = 1000;
    }

    update(friction = 0.98, gravity = 0.3) {
      if (this.pinned) {
        this.x = this.pinnedX;
        this.y = this.pinnedY;
        return;
      }

      const vx = (this.x - this.oldX) * friction;
      const vy = (this.y - this.oldY) * friction;

      this.oldX = this.x;
      this.oldY = this.y;
      this.x += vx;
      this.y += vy + (gravity / this.mass);
    }

    constrain(ball, hasEnteredNet) {
      if (!this.circleInteract) return;
      
      const dx = this.x - ball.x;
      const dy = this.y - ball.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const influence = ball.radius + 12;
      
      if (dist < influence) {
        const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        
        // Only interact if ball is inside the net (has entered)
        if (!hasEnteredNet) return;
        
        // Only interact if ball is moving with some speed
        if (ballSpeed < 0.3) return;
        
        const angle = Math.atan2(dy, dx);
        const force = Math.min(ballSpeed * 0.2, 1.5);
        const pushDistance = (influence - dist) * force;
        
        // ONLY push the net point away, don't affect the ball
        const targetX = ball.x + Math.cos(angle) * (influence + pushDistance);
        const targetY = ball.y + Math.sin(angle) * (influence + pushDistance);
        
        // Slight slowdown effect when passing through net
        ball.vx *= 0.98;
        ball.vy *= 0.98;
        
        // Move the net point (not the ball)
        this.x += (targetX - this.x) * 0.5;
        this.y += (targetY - this.y) * 0.5;
      }
    }
  }

  class Stick {
    constructor(p1, p2, stiffness = 0.6) {
      this.p1 = p1;
      this.p2 = p2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      this.length = Math.sqrt(dx * dx + dy * dy);
      this.stiffness = stiffness;
    }

    update() {
      const dx = this.p2.x - this.p1.x;
      const dy = this.p2.y - this.p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const diff = (this.length - dist) / dist;
      const percent = diff / 2 * this.stiffness;
      const offsetX = dx * percent;
      const offsetY = dy * percent;

      const totalMass = this.p1.mass + this.p2.mass;
      const ratio1 = this.p2.mass / totalMass;
      const ratio2 = this.p1.mass / totalMass;

      if (!this.p1.pinned) {
        this.p1.x -= offsetX * ratio1 * 0.7;
        this.p1.y -= offsetY * ratio1 * 0.7;
      }
      if (!this.p2.pinned) {
        this.p2.x += offsetX * ratio2 * 0.7;
        this.p2.y += offsetY * ratio2 * 0.7;
      }
    }
  }

  class Cloth {
    constructor() {
      this.points = [];
      this.sticks = [];
    }

    attachPoints(i1, i2, stiffness = 0.6) {
      this.sticks.push(new Stick(this.points[i1], this.points[i2], stiffness));
    }

    update(ball, hasEnteredNet) {
      for (let i = 0; i < 3; i++) {
        for (let stick of this.sticks) {
          stick.update();
        }
      }
      
      for (let point of this.points) {
        point.update();
        point.constrain(ball, hasEnteredNet);
      }
    }

    draw(ctx) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      
      for (let stick of this.sticks) {
        const dist = Math.sqrt(
          Math.pow(stick.p2.x - stick.p1.x, 2) + 
          Math.pow(stick.p2.y - stick.p1.y, 2)
        );
        
        ctx.lineWidth = 1.5 + (dist / stick.length) * 0.5;
        
        ctx.beginPath();
        ctx.moveTo(stick.p1.x, stick.p1.y);
        ctx.lineTo(stick.p2.x, stick.p2.y);
        ctx.stroke();
      }
      
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 2;
    }
  }

  // Create net
  const createNet = (hoopX, hoopY, hoopWidth) => {
    const net = new Cloth();
    const scale = 0.05;
    const offsetX = hoopX - 1044 * scale + hoopWidth / 2;
    const offsetY = hoopY;

    const addPoint = (x, y, pinned = false, mass = 1.5) => {
      const p = new Point(x * scale + offsetX, y * scale + offsetY, pinned);
      if (pinned) p.pin(p.x, p.y);
      p.mass = mass;
      net.points.push(p);
    };

    // Top row (pinned to rim)
    addPoint(102, 130, true, 3);
    addPoint(244, 130, true, 3);
    addPoint(584, 130, true, 3);
    addPoint(1044, 130, true, 3);
    addPoint(1504, 130, true, 3);
    addPoint(1844, 130, true, 3);
    addPoint(1986, 130, true, 3);
    
    net.points[0].isEdge = true;
    net.points[1].isEdge = true;
    net.points[5].isEdge = true;
    net.points[6].isEdge = true;

    addPoint(580, 500, false, 2.0);
    addPoint(706, 500, false, 2.0);
    addPoint(918, 500, false, 2.0);
    addPoint(1166, 500, false, 2.0);
    addPoint(1380, 500, false, 2.0);
    addPoint(1500, 500, false, 2.0);
    
    net.points[7].isEdge = true;
    net.points[8].isEdge = true;
    net.points[11].isEdge = true;
    net.points[12].isEdge = true;

    addPoint(642, 700, false, 1.8);
    addPoint(808, 700, false, 1.8);
    addPoint(1040, 700, false, 1.8);
    addPoint(1270, 700, false, 1.8);
    addPoint(1440, 700, false, 1.8);
    
    net.points[13].isEdge = true;
    net.points[14].isEdge = true;
    net.points[16].isEdge = true;
    net.points[17].isEdge = true;

    addPoint(580, 900, false, 1.5);
    addPoint(706, 900, false, 1.5);
    addPoint(918, 900, false, 1.5);
    addPoint(1166, 900, false, 1.5);
    addPoint(1380, 900, false, 1.5);
    addPoint(1500, 900, false, 1.5);

    addPoint(642, 1100, false, 1.3);
    addPoint(808, 1100, false, 1.3);
    addPoint(1040, 1100, false, 1.3);
    addPoint(1270, 1100, false, 1.3);
    addPoint(1440, 1100, false, 1.3);

    addPoint(580, 1300, false, 1.1);
    addPoint(706, 1300, false, 1.1);
    addPoint(918, 1300, false, 1.1);
    addPoint(1166, 1300, false, 1.1);
    addPoint(1380, 1300, false, 1.1);
    addPoint(1500, 1300, false, 1.1);

    addPoint(642, 1500, false, 0.9);
    addPoint(808, 1500, false, 0.9);
    addPoint(1040, 1500, false, 0.9);
    addPoint(1270, 1500, false, 0.9);
    addPoint(1440, 1500, false, 0.9);

    addPoint(580, 1700, false, 0.7);
    addPoint(706, 1700, false, 0.7);
    addPoint(918, 1700, false, 0.7);
    addPoint(1166, 1700, false, 0.7);
    addPoint(1380, 1700, false, 0.7);
    addPoint(1500, 1700, false, 0.7);

    // Connections
    net.attachPoints(0, 1, 0.7);
    net.attachPoints(1, 2, 0.7);
    net.attachPoints(2, 3, 0.7);
    net.attachPoints(3, 4, 0.7);
    net.attachPoints(4, 5, 0.7);
    net.attachPoints(5, 6, 0.7);

    net.attachPoints(7, 0, 0.5);
    net.attachPoints(7, 1, 0.5);
    net.attachPoints(8, 1, 0.5);
    net.attachPoints(8, 2, 0.5);
    net.attachPoints(9, 2, 0.5);
    net.attachPoints(9, 3, 0.5);
    net.attachPoints(10, 3, 0.5);
    net.attachPoints(10, 4, 0.5);
    net.attachPoints(11, 4, 0.5);
    net.attachPoints(11, 5, 0.5);
    net.attachPoints(12, 5, 0.5);
    net.attachPoints(12, 6, 0.5);

    net.attachPoints(13, 7, 0.4);
    net.attachPoints(13, 8, 0.4);
    net.attachPoints(14, 8, 0.4);
    net.attachPoints(14, 9, 0.4);
    net.attachPoints(15, 9, 0.4);
    net.attachPoints(15, 10, 0.4);
    net.attachPoints(16, 10, 0.4);
    net.attachPoints(16, 11, 0.4);
    net.attachPoints(17, 11, 0.4);
    net.attachPoints(17, 12, 0.4);

    net.attachPoints(18, 13, 0.3);
    net.attachPoints(18, 14, 0.3);
    net.attachPoints(19, 14, 0.3);
    net.attachPoints(19, 15, 0.3);
    net.attachPoints(20, 15, 0.3);
    net.attachPoints(20, 16, 0.3);
    net.attachPoints(21, 16, 0.3);
    net.attachPoints(21, 17, 0.3);
    net.attachPoints(22, 17, 0.3);
    net.attachPoints(23, 17, 0.3);

    net.attachPoints(24, 18, 0.25);
    net.attachPoints(24, 19, 0.25);
    net.attachPoints(25, 19, 0.25);
    net.attachPoints(25, 20, 0.25);
    net.attachPoints(26, 20, 0.25);
    net.attachPoints(26, 21, 0.25);
    net.attachPoints(27, 21, 0.25);
    net.attachPoints(27, 22, 0.25);
    net.attachPoints(28, 22, 0.25);
    net.attachPoints(28, 23, 0.25);

    net.attachPoints(29, 24, 0.25);
    net.attachPoints(29, 25, 0.25);
    net.attachPoints(30, 25, 0.25);
    net.attachPoints(30, 26, 0.25);
    net.attachPoints(31, 26, 0.25);
    net.attachPoints(31, 27, 0.25);
    net.attachPoints(32, 27, 0.25);
    net.attachPoints(32, 28, 0.25);
    net.attachPoints(33, 28, 0.25);
    net.attachPoints(34, 28, 0.25);

    net.attachPoints(35, 29, 0.2);
    net.attachPoints(35, 30, 0.2);
    net.attachPoints(36, 30, 0.2);
    net.attachPoints(36, 31, 0.2);
    net.attachPoints(37, 31, 0.2);
    net.attachPoints(37, 32, 0.2);
    net.attachPoints(38, 32, 0.2);
    net.attachPoints(38, 33, 0.2);
    net.attachPoints(39, 33, 0.2);
    net.attachPoints(39, 34, 0.2);

    net.attachPoints(40, 35, 0.2);
    net.attachPoints(40, 36, 0.2);
    net.attachPoints(41, 36, 0.2);
    net.attachPoints(41, 37, 0.2);
    net.attachPoints(42, 37, 0.2);
    net.attachPoints(42, 38, 0.2);
    net.attachPoints(43, 38, 0.2);
    net.attachPoints(43, 39, 0.2);
    net.attachPoints(44, 39, 0.2);
    net.attachPoints(45, 39, 0.2);

    // Disable interaction for all top row points (let ball pass through from above)
    net.points[0].circleInteract = false;
    net.points[1].circleInteract = false;
    net.points[2].circleInteract = false;
    net.points[3].circleInteract = false;
    net.points[4].circleInteract = false;
    net.points[5].circleInteract = false;
    net.points[6].circleInteract = false;

    return net;
  };

  useEffect(() => {
    if (!imageLoaded) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;

    const gs = gameStateRef.current;
    
    // move initial ball down by same offset as hoop so shots line up visually
    gs.ball = {
      x: Math.random() * (gs.maxX - gs.minX) + gs.minX,
      y: 220,
      radius: 20,
      vx: 0,
      vy: 0,
      visible: true
    };

    gs.net = createNet(gs.hoop.x, gs.hoop.y, gs.hoop.width);

    const drawBackboard = () => {
      const bb = gs.backboard;
      
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(bb.x + 2, bb.y + 2, bb.width, bb.height);
      
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(bb.x, bb.y, bb.width, bb.height);
      
      ctx.strokeStyle = "#654321";
      ctx.lineWidth = 2;
      ctx.strokeRect(bb.x, bb.y, bb.width, bb.height);
      
      ctx.strokeStyle = "rgba(101, 67, 33, 0.3)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(bb.x, bb.y + (i * bb.height / 5));
        ctx.lineTo(bb.x + bb.width, bb.y + (i * bb.height / 5));
        ctx.stroke();
      }
    };

    const drawBall = () => {
      if (!gs.ball.visible) return;

      const radius = gs.ball.radius;
      
      ctx.beginPath();
      ctx.arc(gs.ball.x + 2, gs.ball.y + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fill();

      if (ballImgRef.current) {
        ctx.drawImage(
          ballImgRef.current,
          gs.ball.x - radius,
          gs.ball.y - radius,
          radius * 2,
          radius * 2
        );
      } else {
        const gradient = ctx.createRadialGradient(
          gs.ball.x - radius * 0.3, gs.ball.y - radius * 0.3, radius * 0.1,
          gs.ball.x, gs.ball.y, radius
        );
        gradient.addColorStop(0, '#ffa500');
        gradient.addColorStop(1, '#e67300');
        
        ctx.beginPath();
        ctx.arc(gs.ball.x, gs.ball.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const drawDottedTrajectory = () => {
      const dx = gs.aimX - gs.ball.x;
      const dy = gs.aimY - gs.ball.y;
      const scale = 10;
      const previewVx = dx / scale;
      const previewVy = -dy / scale;

      let tx = gs.ball.x;
      let ty = gs.ball.y;
      ctx.fillStyle = 'white';
      // Only draw the ascending portion up to the apex so the descent is hidden
      // Compute time to apex: vy(t) = previewVy + gravity * t => apex at t = -previewVy / gravity
      const g = gs.gravity || 0.5;
      let tApex = null;
      if (g !== 0) {
        tApex = -previewVy / g;
      }

      // If apex is negative or zero (no upward motion), show a short preview instead
      const maxT = (tApex && tApex > 0) ? Math.min(tApex, 100) : 20;

      for (let t = 0; t <= maxT; t += 2) {
        const px = tx + previewVx * t;
        const py = ty + previewVy * t + 0.5 * g * t * t;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
        if (py > canvas.height || px > canvas.width || px < 0) break;
      }
    };

const checkScore = () => {
  // Use hoop center (hoop.x/hoop.y are top-left in this setup)
  const ballX = gs.ball.x;
  const ballY = gs.ball.y;
  const rimCenterX = gs.hoop.x + gs.hoop.width / 2;
  const rimCenterY = gs.hoop.y + gs.hoop.height / 2;

  // Narrow horizontal tolerance so glancing passes in front of the rim don't count
  const scoreWidth = Math.max(gs.hoop.width * 0.75, gs.ball.radius * 1.2);

  // Previous-frame Y must be above the rim, current Y at/below -> true downward crossing
  const prevY = (typeof gs.prevBallY === 'number') ? gs.prevBallY : (ballY - 1);
  const crossedDownward = (prevY < rimCenterY) && (ballY >= rimCenterY) && (gs.ball.vy > 0);

  const inScoreAreaX = ballX > rimCenterX - scoreWidth / 2 && ballX < rimCenterX + scoreWidth / 2;

  return crossedDownward && inScoreAreaX;
};
      
    const resetBall = () => {
      gs.scored = false;
      gs.canBounceBack = true;
      gs.ballState = "below";
      gs.hasEnteredNet = false;
      gs.ball.x = Math.random() * (gs.maxX - gs.minX) + gs.minX;
      gs.ball.y = 200;
      gs.ball.vx = 0;
      gs.ball.vy = 0;
      gs.ball.visible = true;
      gs.state = 'idle';

      
    };

    const update = () => {
      if ((gs.state === 'shooting' || gs.state === "netAnimation") && gs.ball.visible) {
        // capture previous Y (position at start of this frame) so we can detect downward
        // crossings through the rim plane after physics update
        const prevY = gs.ball.y;

        gs.ball.x += gs.ball.vx;
        gs.ball.y += gs.ball.vy;
        gs.ball.vy += gs.gravity;

        // Backboard collision (circle-rectangle). Use closest-point test and reflect
        const bb = gs.backboard;
        const closestX = Math.max(bb.x, Math.min(gs.ball.x, bb.x + bb.width));
        const closestY = Math.max(bb.y, Math.min(gs.ball.y, bb.y + bb.height));
        const dxBB = gs.ball.x - closestX;
        const dyBB = gs.ball.y - closestY;
        const distBB = Math.sqrt(dxBB * dxBB + dyBB * dyBB);

        if (distBB < gs.ball.radius) {
          let nx = 0, ny = 0;
          if (distBB === 0) {
            nx = -1; ny = 0;
          } else {
            nx = dxBB / distBB; ny = dyBB / distBB;
          }
          const penetration = gs.ball.radius - distBB;
          gs.ball.x += nx * penetration;
          gs.ball.y += ny * penetration;
          const vDotN = gs.ball.vx * nx + gs.ball.vy * ny;
          gs.ball.vx = gs.ball.vx - (1 + gs.elasticity) * vDotN * nx;
          gs.ball.vy = gs.ball.vy - (1 + gs.elasticity) * vDotN * ny;
          gs.ball.vx *= 0.98;
          gs.ball.vy *= 0.98;
        }

        // Invisible rim bounce zones (2px wide) at left/right top of net
        const rimZoneHeight = 8; // thickness of rim zone
        const rimZoneWidth = 2;
        const hoopTopY = gs.hoop.y;
        const hoopLeftX = gs.hoop.x;
        const hoopRightX = gs.hoop.x + gs.hoop.width;

        // Left rim zone
        const closestXLeft = Math.max(hoopLeftX, Math.min(gs.ball.x, hoopLeftX + rimZoneWidth));
        const closestYLeft = Math.max(hoopTopY, Math.min(gs.ball.y, hoopTopY + rimZoneHeight));
        const dxLeft = gs.ball.x - closestXLeft;
        const dyLeft = gs.ball.y - closestYLeft;
        const distLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);
        if (distLeft < gs.ball.radius) {
          let nx = 0, ny = 0;
          if (distLeft === 0) { nx = -1; ny = 0; } else { nx = dxLeft / distLeft; ny = dyLeft / distLeft; }
          const penetration = gs.ball.radius - distLeft;
          gs.ball.x += nx * penetration;
          gs.ball.y += ny * penetration;
          const vDotN = gs.ball.vx * nx + gs.ball.vy * ny;
          gs.ball.vx = gs.ball.vx - (1 + gs.elasticity) * vDotN * nx;
          gs.ball.vy = gs.ball.vy - (1 + gs.elasticity) * vDotN * ny;
          gs.ball.vx *= 0.98;
          gs.ball.vy *= 0.98;
        }

        // Right rim zone
        const closestXRight = Math.max(hoopRightX - rimZoneWidth, Math.min(gs.ball.x, hoopRightX));
        const closestYRight = Math.max(hoopTopY, Math.min(gs.ball.y, hoopTopY + rimZoneHeight));
        const dxRight = gs.ball.x - closestXRight;
        const dyRight = gs.ball.y - closestYRight;
        const distRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);
        if (distRight < gs.ball.radius) {
          let nx = 0, ny = 0;
          if (distRight === 0) { nx = 1; ny = 0; } else { nx = dxRight / distRight; ny = dyRight / distRight; }
          const penetration = gs.ball.radius - distRight;
          gs.ball.x += nx * penetration;
          gs.ball.y += ny * penetration;
          const vDotN = gs.ball.vx * nx + gs.ball.vy * ny;
          gs.ball.vx = gs.ball.vx - (1 + gs.elasticity) * vDotN * nx;
          gs.ball.vy = gs.ball.vy - (1 + gs.elasticity) * vDotN * ny;
          gs.ball.vx *= 0.98;
          gs.ball.vy *= 0.98;
        }

        // Ground collision
        if (gs.ball.y + gs.ball.radius > canvas.height) {
          gs.ball.y = canvas.height - gs.ball.radius;
          gs.ball.vy = -gs.ball.vy * gs.elasticity;
          gs.ball.vx *= 0.8;
          if (Math.abs(gs.ball.vy) < 3) {
            gs.ball.visible = false;
            resetBall();
          }
        }

  // remember previous Y for scoring checks (set before calling checkScore)
  gs.prevBallY = prevY;

  // Check if ball has entered the net area
// Check if ball has entered the net area (improved)
        if (!gs.hasEnteredNet) {
          const inHoopX = gs.ball.x > gs.hoop.x - gs.hoop.width/2 && 
                        gs.ball.x < gs.hoop.x + gs.hoop.width/2;
          const inHoopY = gs.ball.y > gs.hoop.y && 
                        gs.ball.y < gs.hoop.y + gs.hoop.height;
          
          if (inHoopX && inHoopY) {
            gs.hasEnteredNet = true;
          }
        }

        // Check for scoring
        if (checkScore() && !gs.scored) {
          gs.animationFrame = 0;
          gs.state = 'netAnimation';
          const points = timeLeft < 60 ? 3 : 2;
          setScore(prev => prev + points);
          if (onScoreSubmit) onScoreSubmit(points);
          gs.scored = true;
        }

        // Out of bounds
        if (gs.ball.x > canvas.width + 100 || gs.ball.x < -100 || gs.ball.y > canvas.height + 50) {
          gs.ball.visible = false;
          resetBall();
        }
      }

      // Update net physics
      if (gs.net && gs.ball.visible) {
        gs.net.update(gs.ball, gs.hasEnteredNet);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawBackboard();

      if (gs.net) {
        gs.net.draw(ctx);
      }

      drawBall();

      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = 'black';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Time: ${Math.max(0, Math.floor(timeLeft))}`, 480, 30);

      if (gs.isAiming) {
        drawDottedTrajectory();
      }

      if (gs.state === 'over') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.textAlign = 'left';
      }
    };

    const handleMouseDown = (e) => {
      if (gs.state === 'over') return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.hypot(mx - gs.ball.x, my - gs.ball.y) < gs.ball.radius && gs.ball.visible) {
        gs.isAiming = true;
        gs.aimX = mx;
        gs.aimY = my;
        gs.state = 'aiming';
      }
    };

    const handleMouseMove = (e) => {
      if (gs.isAiming) {
        const rect = canvas.getBoundingClientRect();
        gs.aimX = e.clientX - rect.left;
        gs.aimY = e.clientY - rect.top;
      }
    };

    const handleMouseUp = () => {
      if (gs.isAiming) {
        gs.isAiming = false;
        const dx = gs.aimX - gs.ball.x;
        const dy = gs.aimY - gs.ball.y;
        const scale = 10;
        gs.ball.vx = dx / scale;
        gs.ball.vy = -dy / scale;
        gs.state = 'shooting';
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    let lastTime = Date.now();
    const gameLoop = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (gs.state !== 'over') {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - delta);
          if (newTime <= 0) {
            gs.state = 'over';
          }
          return newTime;
        });
      }

      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [imageLoaded]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="mb-4 text-white text-xl">
        <span className="mr-8">🏀 Score: {score}</span>
        <span>⏱️ Time: {Math.floor(timeLeft)}s</span>
      </div>
      <canvas 
        ref={canvasRef} 
        className="border-4 border-gray-700 rounded-lg shadow-2xl"
      />
      <div className="mt-4 text-gray-300 text-center max-w-md">
        <p className="text-sm">
          Click and drag the ball to aim and shoot
        </p>
      </div>
    </div>
  )
}

export default BasketballGame;