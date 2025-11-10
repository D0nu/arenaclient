import React, { useRef, useEffect, useState } from 'react';

const EnhancedConquest = ({ timeLeft = 180, onScoreSubmit = () => {}, userScore = 0 }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    state: 'idle',
    player: null,
    enemies: [],
    projectiles: [],
    particles: [],
    orbs: [],
    weapons: [],
    map: null,
    lastSpawnTime: 0,
    lastOrbSpawnTime: 0,
    lastWeaponSpawnTime: 0,
    score: userScore || 0,
    kills: 0,
    deaths: 0,
    combo: 0,
    comboTimer: 0,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = isMobile ? Math.min(800, window.innerWidth - 20) : 800;
    canvas.height = isMobile ? Math.min(600, window.innerHeight - 250) : 600;

    const game = gameRef.current;
    let animationId;
    let keys = {};
    let mouse = { x: 0, y: 0, pressed: false };
    let spacePressed = false;
    let spacePressTime = 0;
    let isCharging = false;
    let chargePower = 0;

    const maps = [
      {
        name: 'Forest Fortress',
        background: '#2d5a27',
        ground: '#4a7c59',
        groundY: canvas.height - 80,
        obstacles: [
          { x: 200, y: canvas.height - 130, width: 50, height: 50, type: 'tree' },
          { x: 500, y: canvas.height - 120, width: 80, height: 40, type: 'rock' },
        ],
        enemyTypes: ['swordsman', 'archer', 'bat', 'worm'],
        boss: 'forest_guardian',
      },
      {
        name: 'Desert Wasteland',
        background: '#d4a574',
        ground: '#b38b6d',
        groundY: canvas.height - 80,
        obstacles: [
          { x: 300, y: canvas.height - 120, width: 70, height: 40 },
          { x: 600, y: canvas.height - 150, width: 50, height: 70 },
        ],
        enemyTypes: ['swordsman', 'archer', 'bat', 'worm'],
        boss: 'desert_titan',
      },
      {
        name: 'Ice Kingdom',
        background: '#a8d0e6',
        ground: '#c8d6e5',
        groundY: canvas.height - 80,
        obstacles: [
          { x: 400, y: canvas.height - 140, width: 60, height: 60 },
          { x: 200, y: canvas.height - 160, width: 40, height: 80 },
        ],
        enemyTypes: ['swordsman', 'archer', 'bat', 'worm'],
        boss: 'ice_colossus',
      },
      {
        name: 'Volcanic Inferno',
        background: '#8b0000',
        ground: '#a0522d',
        groundY: canvas.height - 80,
        obstacles: [
          { x: 350, y: canvas.height - 130, width: 60, height: 50 },
          { x: 550, y: canvas.height - 110, width: 50, height: 30 },
        ],
        enemyTypes: ['swordsman', 'archer', 'bat', 'worm'],
        boss: 'lava_beast',
      },
    ];

    const player = {
      x: 100,
      y: canvas.height - 140,
      width: isMobile ? 25 : 30,
      height: isMobile ? 35 : 40,
      speed: 4,
      health: 100,
      maxHealth: 100,
      weapon: 'fist',
      weaponUses: Infinity,
      shield: false,
      shieldActive: false,
      shieldHealth: 50,
      invulnerable: 0,
      lastAttack: 0,
      attackCooldown: 500,
      lastSpell: 0,
      spellCooldown: 3000,
      facing: 'right',
      damageBoost: 1,
      speedBoost: 1,
      boostEndTime: 0,
      invincibilityEndTime: 0,
      // Rapid fire properties
      rapidFire: false,
      rapidFireEndTime: 0,
      rapidFireCooldown: 100,
      // Jump/Crouch mechanics
      velocityY: 0,
      isJumping: false,
      isCrouching: false,
      groundY: canvas.height - 140,
      jumpPower: -12,
      gravity: 0.5,
      // Attack animation states
      attackFrame: 0,
      isAttacking: false,
      attackType: 'melee',
    };

    const enemyTypes = {
      swordsman: {
        color: '#dc2626',
        speed: 2,
        width: isMobile ? 28 : 32,
        height: isMobile ? 38 : 42,
        health: 4,
        maxHealth: 4,
        attackRange: 40,
        attackDamage: 15,
        attackCooldown: 1000,
        points: timeLeft > 60 ? 2 : 3,
        flying: false,
        underground: false,
      },
      archer: {
        color: '#ea580c',
        speed: 2.5,
        width: isMobile ? 26 : 30,
        height: isMobile ? 36 : 40,
        health: 3,
        maxHealth: 3,
        attackRange: 250,
        attackDamage: 10,
        attackCooldown: 1500,
        points: timeLeft > 60 ? 2 : 3,
        projectile: true,
        flying: false,
        underground: false,
      },
      // CHANGED: Bat enemy instead of bird
      bat: {
        color: '#4c1d95',
        speed: 3,
        width: isMobile ? 32 : 38,
        height: isMobile ? 18 : 22,
        health: 3,
        maxHealth: 3,
        attackRange: 200,
        attackDamage: 12,
        attackCooldown: 2000,
        points: timeLeft > 60 ? 2 : 3,
        projectile: true,
        flying: true,
        underground: false,
        beam: true,
      },
      // CHANGED: Worm enemy with better design
      worm: {
        color: '#78350f',
        speed: 1.5,
        width: isMobile ? 40 : 50,
        height: isMobile ? 15 : 20,
        health: 5,
        maxHealth: 5,
        attackRange: 150,
        attackDamage: 18,
        attackCooldown: 2500,
        points: timeLeft > 60 ? 2 : 3,
        projectile: true,
        flying: false,
        underground: true,
      },
      // BOSSES
      forest_guardian: {
        color: '#15803d',
        speed: 1.5,
        width: isMobile ? 55 : 65,
        height: isMobile ? 65 : 75,
        health: 50,
        maxHealth: 50,
        attackRange: 60,
        attackDamage: 25,
        attackCooldown: 1500,
        points: 5,
        isBoss: true,
        flying: false,
        underground: false,
      },
      desert_titan: {
        color: '#b45309',
        speed: 1.8,
        width: isMobile ? 60 : 70,
        height: isMobile ? 70 : 80,
        health: 60,
        maxHealth: 60,
        attackRange: 70,
        attackDamage: 28,
        attackCooldown: 1400,
        points: 5,
        isBoss: true,
        flying: false,
        underground: false,
      },
      ice_colossus: {
        color: '#1e40af',
        speed: 1.3,
        width: isMobile ? 65 : 75,
        height: isMobile ? 75 : 85,
        health: 70,
        maxHealth: 70,
        attackRange: 75,
        attackDamage: 30,
        attackCooldown: 1600,
        points: 5,
        isBoss: true,
        flying: false,
        underground: false,
      },
      lava_beast: {
        color: '#991b1b',
        speed: 1.6,
        width: isMobile ? 63 : 73,
        height: isMobile ? 73 : 83,
        health: 65,
        maxHealth: 65,
        attackRange: 65,
        attackDamage: 32,
        attackCooldown: 1300,
        points: 5,
        isBoss: true,
        flying: false,
        underground: false,
      },
    };

    const weapons = {
      fist: { range: 30, damage: 0.5, cooldown: 400, projectile: false, maxUses: Infinity, type: 'melee' },
      sword: { range: 50, damage: 1.5, cooldown: 500, projectile: false, maxUses: 25, type: 'melee' },
      bow: { range: 250, damage: 1.2, cooldown: 800, projectile: true, maxUses: 20, type: 'ranged', chargeTime: 500 },
      spear: { range: 80, damage: 1.8, cooldown: 600, projectile: false, maxUses: 15, type: 'melee' },
      shield_pickup: { range: 0, damage: 0, cooldown: 0, projectile: false, maxUses: 100, isShield: true, type: 'defense' },
    };

    const initGame = () => {
      game.state = 'playing';
      game.map = maps[Math.floor(Math.random() * maps.length)];
      game.player = { ...player, groundY: game.map.groundY };
      game.player.y = game.map.groundY;
      game.enemies = [];
      game.projectiles = [];
      game.particles = [];
      game.orbs = [];
      game.weapons = [];
      game.lastSpawnTime = Date.now();
      game.lastOrbSpawnTime = Date.now();
      game.lastWeaponSpawnTime = Date.now();
      game.score = userScore || 0;
      game.kills = 0;
      game.deaths = 0;
      game.combo = 0;
      game.comboTimer = 0;
    };

    game.map = maps[0];

    const getMaxEnemies = () => {
      return timeLeft > 60 ? 3 : 4;
    };

    const getSpawnRate = () => {
      return timeLeft > 60 ? 3500 : 2000;
    };

    const drawMap = () => {
      const currentMap = game.map;
      ctx.fillStyle = currentMap.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = currentMap.ground;
      ctx.fillRect(0, currentMap.groundY, canvas.width, canvas.height - currentMap.groundY);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, currentMap.groundY);
      ctx.lineTo(canvas.width, currentMap.groundY);
      ctx.stroke();
      
      currentMap.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#654321';
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });
      
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 14px Arial' : 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(currentMap.name, canvas.width / 2, isMobile ? 20 : 25);
      ctx.textAlign = 'left';
    };

    const drawHealthBar = (x, y, health, maxHealth, width = 30, height = 5) => {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x - width / 2, y - height - 10, width, height);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x - width / 2, y - height - 10, width * (health / maxHealth), height);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(x - width / 2, y - height - 10, width, height);
    };

    // NEW: Draw scary bat enemy
    const drawBat = (ctx, x, y, width, height, color, facing, isMoving, isAttacking) => {
      ctx.save();
      
      // Bat bobbing motion
      y += Math.sin(Date.now() / 300) * 4;
      
      // Body - dark and menacing
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(x, y, width / 3, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Head with ears
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(x, y - height / 4, width / 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Pointy ears
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(x - width / 8, y - height / 3);
      ctx.lineTo(x - width / 4, y - height / 2);
      ctx.lineTo(x, y - height / 3);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x + width / 8, y - height / 3);
      ctx.lineTo(x + width / 4, y - height / 2);
      ctx.lineTo(x, y - height / 3);
      ctx.fill();
      
      // Red eyes
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x - width / 10, y - height / 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + width / 10, y - height / 4, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings - animated and menacing
      const wingFlap = Math.sin(Date.now() / 120) * 0.8;
      ctx.fillStyle = '#312e81';
      
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x - width, 
        y - height * (0.5 + wingFlap * 0.3), 
        x - width / 2, 
        y + height / 3
      );
      ctx.quadraticCurveTo(
        x - width * 0.7, 
        y - height * 0.2, 
        x, 
        y
      );
      ctx.fill();
      
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + width, 
        y - height * (0.5 - wingFlap * 0.3), 
        x + width / 2, 
        y + height / 3
      );
      ctx.quadraticCurveTo(
        x + width * 0.7, 
        y - height * 0.2, 
        x, 
        y
      );
      ctx.fill();
      
      // Sharp teeth
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - width / 12, y - height / 6);
      ctx.lineTo(x - width / 8, y);
      ctx.lineTo(x, y - height / 8);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x + width / 12, y - height / 6);
      ctx.lineTo(x + width / 8, y);
      ctx.lineTo(x, y - height / 8);
      ctx.fill();
      
      ctx.restore();
    };

    // NEW: Draw worm enemy
    const drawWorm = (ctx, x, y, width, height, color, facing, isMoving, isAttacking) => {
      ctx.save();
      
      // Worm moves underground, partially visible
      ctx.globalAlpha = 0.8;
      y = game.map.groundY - height / 2;
      
      // Segmented body
      const segments = 4;
      const segmentWidth = width / segments;
      
      for (let i = 0; i < segments; i++) {
        const segmentX = x - width / 2 + i * segmentWidth + segmentWidth / 2;
        const segmentY = y + Math.sin(Date.now() / 300 + i) * 3; // Wavy motion
        
        ctx.fillStyle = i === 0 ? '#92400e' : color; // Head is darker
        ctx.beginPath();
        ctx.ellipse(segmentX, segmentY, segmentWidth / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Segment outlines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Head with menacing features
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(x - width / 2 + segmentWidth / 2, y, height / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - width / 2 + segmentWidth / 3, y - height / 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - width / 2 + segmentWidth / 3, y + height / 4, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - width / 2 + segmentWidth / 2, y, height / 3, 0.2, Math.PI - 0.2);
      ctx.stroke();
      
      ctx.restore();
    };

    // IMPROVED: More human-like character drawing
    const drawHuman = (ctx, x, y, width, height, color, facing, weapon, isMoving, isAttacking, isBoss = false, isCrouching = false) => {
      const crouchFactor = isCrouching ? 0.7 : 1;
      const headRadius = isBoss ? width / 3 : width / 4;
      const bodyLength = (isBoss ? height * 0.4 : height * 0.35) * crouchFactor;
      const legLength = (isBoss ? height * 0.25 : height * 0.3) * crouchFactor;
      const animationFrame = isMoving ? Math.sin(Date.now() / 100) * 0.3 : 0;

      ctx.save();
      
      // Body with more human-like proportions
      ctx.fillStyle = color;
      
      // Head
      ctx.beginPath();
      ctx.arc(x, y - bodyLength - headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Torso - more defined shape
      ctx.fillRect(x - width / 4, y - bodyLength, width / 2, bodyLength);
      
      // Arms with shoulder definition
      const armAngle = isMoving ? animationFrame * 0.5 - 0.5 : -0.5;
      const direction = facing === 'right' ? 1 : -1;
      
      // Shoulders
      ctx.fillRect(x - width / 3, y - bodyLength * 0.8, width / 6, width / 6);
      ctx.fillRect(x + width / 6, y - bodyLength * 0.8, width / 6, width / 6);
      
      // Arms
      ctx.beginPath();
      ctx.moveTo(x - width / 4, y - bodyLength * 0.7);
      ctx.lineTo(x - width / 2, y - bodyLength * 0.3 + armAngle * 10);
      ctx.lineWidth = width / 6;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + width / 4, y - bodyLength * 0.7);
      ctx.lineTo(x + width / 2, y - bodyLength * 0.3 - armAngle * 10);
      ctx.lineWidth = width / 6;
      ctx.stroke();
      
      // Legs with walking animation
      if (!isCrouching) {
        ctx.beginPath();
        ctx.moveTo(x - width / 8, y);
        ctx.lineTo(x - width / 4 + animationFrame * 10, y + legLength);
        ctx.lineWidth = width / 5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + width / 8, y);
        ctx.lineTo(x + width / 4 - animationFrame * 10, y + legLength);
        ctx.lineWidth = width / 5;
        ctx.stroke();
      }
      
      // Attack animation for arms
      if (isAttacking) {
        const attackProgress = Math.sin(Date.now() / 100) * 0.5;
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = isBoss ? 5 : 3;
        
        if (weapon === 'sword') {
          ctx.beginPath();
          ctx.moveTo(x + direction * width / 2, y - bodyLength * 0.5);
          ctx.lineTo(x + direction * (width / 2 + 25 + attackProgress * 10), y - bodyLength * 0.5);
          ctx.stroke();
        } else if (weapon === 'bow') {
          ctx.beginPath();
          ctx.arc(x + direction * width / 2, y - bodyLength * 0.5, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Shield
      if (weapon === 'shield' || (game.player && game.player.shieldActive && x === game.player.x)) {
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        ctx.strokeStyle = '#4169e1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + direction * 25, y - bodyLength * 0.3, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    };

    // IMPROVED: Player drawing with better human appearance
    const drawPlayer = () => {
      const p = game.player;
      if (!p) return;
      
      const isMoving = keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
      
      // Rapid fire visual effect
      let playerColor = p.invulnerable > 0 || p.invincibilityEndTime > Date.now() ? '#60a5fa' : '#4f46e5';
      if (p.rapidFire) {
        const pulse = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        playerColor = `rgb(255, ${Math.floor(255 * pulse)}, 0)`;
      }
      
      drawHuman(
        ctx, p.x, p.y, p.width, p.height,
        playerColor,
        p.facing,
        p.shieldActive ? 'shield' : p.weapon,
        isMoving,
        p.isAttacking,
        false,
        p.isCrouching
      );
      
      drawHealthBar(p.x, p.y - p.height / 2 - 15, p.health, p.maxHealth, p.width);
      
      if (p.shield) {
        ctx.fillStyle = '#4169e1';
        ctx.fillRect(p.x - 15, p.y - p.height / 2 - 25, 30 * (p.shieldHealth / 50), 3);
      }
      
      // Rapid fire indicator
      if (p.rapidFire) {
        const timeLeft = Math.max(0, p.rapidFireEndTime - Date.now());
        const progress = timeLeft / 8000;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(p.x - 20, p.y - 60, 40, 4);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(p.x - 20, p.y - 60, 40 * progress, 4);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(p.x - 20, p.y - 60, 40, 4);
      }
      
      // Draw charge indicator for bow
      if (isCharging && p.weapon === 'bow') {
        const chargeWidth = 40;
        const chargeHeight = 6;
        const chargeX = p.x - chargeWidth / 2;
        const chargeY = p.y - 50;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(chargeX, chargeY, chargeWidth, chargeHeight);
        ctx.fillStyle = chargePower > 0.7 ? '#ef4444' : chargePower > 0.4 ? '#f59e0b' : '#10b981';
        ctx.fillRect(chargeX, chargeY, chargeWidth * chargePower, chargeHeight);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(chargeX, chargeY, chargeWidth, chargeHeight);
      }
    };

    // UPDATED: Enemy drawing with new designs
    const drawEnemies = () => {
      game.enemies.forEach(enemy => {
        const isMoving = true;
        const isAttacking = Date.now() - enemy.lastAttack < enemy.attackCooldown;
        
        if (enemy.type === 'bat') {
          drawBat(
            ctx, enemy.x, enemy.y, enemy.width, enemy.height,
            enemy.color, enemy.facing, isMoving, isAttacking
          );
        } else if (enemy.type === 'worm') {
          drawWorm(
            ctx, enemy.x, enemy.y, enemy.width, enemy.height,
            enemy.color, enemy.facing, isMoving, isAttacking
          );
        } else {
          // Humanoid enemies (swordsman, archer, bosses)
          drawHuman(
            ctx, enemy.x, enemy.y, enemy.width, enemy.height,
            enemy.color, enemy.facing,
            enemy.type === 'archer' ? 'bow' : 'sword',
            isMoving, isAttacking, enemy.isBoss
          );
        }
        
        drawHealthBar(enemy.x, enemy.y - enemy.height / 2 - 15, enemy.health, enemy.maxHealth, enemy.width);
      });
    };

    const drawProjectiles = () => {
      game.projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        
        if (projectile.beam) {
          ctx.fillRect(projectile.x - 2, projectile.y - 2, 4, 20);
        } else {
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const drawWeapons = () => {
      game.weapons.forEach(weapon => {
        ctx.save();
        ctx.translate(weapon.x, weapon.y);
        
        const floatOffset = Math.sin(Date.now() / 500) * 5;
        ctx.translate(0, floatOffset);
        
        const glowAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.3;
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#a8a29e';
        ctx.fillStyle = '#a8a29e';
        ctx.lineWidth = 2;
        
        switch (weapon.type) {
          case 'sword':
            ctx.beginPath();
            ctx.moveTo(-8, -8);
            ctx.lineTo(8, 8);
            ctx.stroke();
            
            ctx.fillStyle = '#8b5cf6';
            ctx.fillRect(-3, -3, 6, 6);
            break;
          case 'bow':
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
            break;
          case 'spear':
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(12, -3);
            ctx.lineTo(12, 3);
            ctx.fill();
            break;
          case 'shield_pickup':
            ctx.fillStyle = 'rgba(100, 150, 255, 0.7)';
            ctx.strokeStyle = '#4169e1';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        }
        
        ctx.restore();
      });
    };

    const drawOrbs = () => {
      game.orbs.forEach(orb => {
        ctx.save();
        ctx.translate(orb.x, orb.y);
        
        const floatOffset = Math.sin(Date.now() / 400 + orb.x) * 3;
        ctx.translate(0, floatOffset);
        
        const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
        ctx.globalAlpha = pulse;
        
        switch (orb.type) {
          case 'health':
            ctx.fillStyle = '#ef4444';
            break;
          case 'rapid_fire':
            ctx.fillStyle = '#f59e0b';
            break;
          case 'damage':
            ctx.fillStyle = '#dc2626';
            break;
          case 'speed':
            ctx.fillStyle = '#3b82f6';
            break;
          default:
            ctx.fillStyle = '#10b981';
        }
        
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = pulse * 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });
    };

    const drawHUD = () => {
      const displayScore = Math.max(0, game.score);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? 'bold 12px Arial' : 'bold 14px Arial';
      ctx.fillText(`Score: ${displayScore}`, 10, isMobile ? 45 : 50);
      ctx.fillText(`Kills: ${game.kills}`, 10, isMobile ? 60 : 70);
      ctx.fillText(`Deaths: ${game.deaths}`, 10, isMobile ? 75 : 90);
      ctx.fillText(`Combo: ${game.combo}x`, 10, isMobile ? 90 : 110);
      ctx.fillText(`Time: ${Math.ceil(timeLeft)}s`, 10, isMobile ? 105 : 130);
      ctx.fillText(`Weapon: ${game.player.weapon} (${game.player.weaponUses === Infinity ? '∞' : game.player.weaponUses})`, 10, isMobile ? 120 : 150);
      
      if (game.player.shield) {
        ctx.fillStyle = '#4169e1';
        ctx.fillText(`Shield: ${Math.ceil(game.player.shieldHealth)}`, 10, isMobile ? 135 : 170);
      }
      
      if (game.player.rapidFire) {
        const timeLeft = Math.max(0, game.player.rapidFireEndTime - Date.now());
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Rapid Fire: ${(timeLeft / 1000).toFixed(1)}s`, 10, isMobile ? 150 : 190);
      }
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? 'bold 28px Arial' : 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CONQUEST ENDED!', canvas.width / 2, canvas.height / 2 - 50);
      ctx.font = isMobile ? 'bold 18px Arial' : 'bold 24px Arial';
      ctx.fillText(`Final Score: ${Math.max(0, game.score)}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Kills: ${game.kills} | Deaths: ${game.deaths}`, canvas.width / 2, canvas.height / 2 + 40);
      ctx.textAlign = 'left';
    };

    const drawInstructions = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('ENHANCED MEDIEVAL CONQUEST', canvas.width / 2, canvas.height / 2 - 120);
      
      ctx.font = '14px Arial';
      ctx.fillText('AD/Arrows: Move | W: Jump | S: Crouch', canvas.width / 2, canvas.height / 2 - 70);
      ctx.fillText('Hold Shift: Block | Tap Space: Melee | Hold Space: Ranged', canvas.width / 2, canvas.height / 2 - 50);
      ctx.fillText('Collect weapons and orbs from defeated enemies!', canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.font = '12px Arial';
      ctx.fillText('Enemies: Swordsmen, Archers, Bats, Worms', canvas.width / 2, canvas.height / 2);
      ctx.fillText('>60s: 3 enemies, +2 points | ≤60s: 4 enemies + BOSS, +3 points', canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('Boss Kill: +5 points | Death: -6 points', canvas.width / 2, canvas.height / 2 + 40);
      
      ctx.fillText('Red Orbs: +10 Health | Yellow Orbs: Rapid Fire! | Blue Orbs: Speed Boost', canvas.width / 2, canvas.height / 2 + 60);
      ctx.fillText('Dark Red Orbs: Damage Boost', canvas.width / 2, canvas.height / 2 + 80);
      
      ctx.font = 'bold 18px Arial';
      ctx.fillText('Press SPACE to begin!', canvas.width / 2, canvas.height / 2 + 120);
      ctx.textAlign = 'left';
    };

    const draw = () => {
      drawMap();
      if (game.state === 'playing') {
        drawWeapons();
        drawOrbs();
        drawProjectiles();
        drawEnemies();
        drawPlayer();
        drawHUD();
        drawParticles();
      } else if (game.state === 'time-up') {
        drawGameOver();
      } else {
        drawInstructions();
      }
    };

    const spawnEnemy = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      const spawnRate = getSpawnRate();
      const maxEnemies = getMaxEnemies();
      
      if (now - game.lastSpawnTime < spawnRate || game.enemies.length >= maxEnemies) return;
      
      game.lastSpawnTime = now;
      
      let enemyType;
      if (timeLeft <= 60 && Math.random() < 0.3 && !game.enemies.some(e => e.isBoss)) {
        enemyType = game.map.boss;
      } else {
        const availableTypes = game.map.enemyTypes;
        enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      }
      
      const typeConfig = { ...enemyTypes[enemyType] };
      typeConfig.points = typeConfig.isBoss ? 5 : (timeLeft > 60 ? 2 : 3);
      
      let spawnX = canvas.width + typeConfig.width;
      let spawnY;
      
      if (typeConfig.flying) {
        spawnY = Math.random() * (game.map.groundY - 100) + 50;
      } else if (typeConfig.underground) {
        spawnY = game.map.groundY;
      } else {
        spawnY = game.map.groundY;
      }
      
      game.enemies.push({
        ...typeConfig,
        x: spawnX,
        y: spawnY,
        type: enemyType,
        lastAttack: 0,
        facing: 'left',
      });
    };

    const spawnWeapon = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      if (now - game.lastWeaponSpawnTime < 12000 || game.weapons.length >= 2) return;
      
      game.lastWeaponSpawnTime = now;
      const weaponKeys = ['sword', 'bow', 'spear', 'shield_pickup'];
      const randomType = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      
      game.weapons.push({
        type: randomType,
        x: Math.random() * (canvas.width - 100) + 50,
        y: game.map.groundY - 10,
        radius: 12,
      });
    };

    const spawnOrbs = (x, y, enemyType) => {
      const orbCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < orbCount; i++) {
        const orbTypes = ['health', 'rapid_fire', 'damage', 'speed'];
        const randomType = orbTypes[Math.floor(Math.random() * orbTypes.length)];
        
        game.orbs.push({
          type: randomType,
          x: x + (Math.random() - 0.5) * 40,
          y: y - 20,
          radius: 6,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3 - 1,
        });
      }
    };

    // UPDATED: Player attack with rapid fire support
    const playerAttack = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      const p = game.player;
      if (!p || p.shieldActive) return;
      
      const weapon = weapons[p.weapon] || weapons.fist;
      
      // Use rapid fire cooldown if active
      const currentCooldown = p.rapidFire ? p.rapidFireCooldown : weapon.cooldown;
      
      // Handle charging for ranged weapons
      if (weapon.type === 'ranged' && isCharging) {
        const chargeTime = now - spacePressTime;
        chargePower = Math.min(1, chargeTime / weapon.chargeTime);
        
        if (chargePower >= 0.2) {
          p.attackType = 'ranged';
          p.isAttacking = true;
        }
        return;
      }
      
      // Melee attack
      if (weapon.type === 'melee' && now - p.lastAttack >= currentCooldown) {
        p.lastAttack = now;
        p.attackType = 'melee';
        p.isAttacking = true;
        p.attackFrame = 0;
        
        if (p.weapon !== 'fist') {
          p.weaponUses = Math.max(0, p.weaponUses - 1);
          if (p.weaponUses === 0) {
            p.weapon = 'fist';
            p.weaponUses = Infinity;
          }
        }
        
        for (let i = game.enemies.length - 1; i >= 0; i--) {
          const enemy = game.enemies[i];
          const dx = enemy.x - p.x;
          const dy = enemy.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < weapon.range) {
            const damage = weapon.damage * p.damageBoost;
            enemy.health -= damage;
            
            game.particles.push({
              x: enemy.x,
              y: enemy.y - 10,
              life: 60,
              maxLife: 60,
              type: 'damage',
              value: damage.toFixed(1),
              vx: (Math.random() - 0.5) * 2,
              vy: -2,
              color: '#ffffff',
              radius: 2,
            });
            
            if (enemy.health <= 0) {
              handleEnemyDeath(enemy, i);
            }
          }
        }
      }
    };

    const releaseChargedAttack = () => {
      if (game.state !== 'playing') return;
      const p = game.player;
      if (!p || p.shieldActive) return;
      
      const weapon = weapons[p.weapon] || weapons.fist;
      
      if (weapon.type === 'ranged' && chargePower >= 0.2) {
        p.lastAttack = Date.now();
        
        if (p.weapon !== 'fist') {
          p.weaponUses = Math.max(0, p.weaponUses - 1);
          if (p.weaponUses === 0) {
            p.weapon = 'fist';
            p.weaponUses = Infinity;
          }
        }
        
        let angle;
        if (mouse.x !== 0 && mouse.y !== 0) {
          angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
        } else {
          angle = p.facing === 'right' ? 0 : Math.PI;
        }
        
        const speed = 8 + chargePower * 4;
        const damage = weapon.damage * p.damageBoost * (0.5 + chargePower * 0.5);
        
        game.projectiles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 4 + chargePower * 2,
          color: '#ff4500',
          damage: damage,
          fromPlayer: true,
          beam: false,
        });
        
        chargePower = 0;
        isCharging = false;
      }
    };

    // UPDATED: Remove space bar from jumping
    const updatePlayer = () => {
      if (game.state !== 'playing') return;
      const p = game.player;
      if (!p) return;
      
      if (p.invulnerable > 0) p.invulnerable--;
      if (p.invincibilityEndTime > Date.now()) p.invulnerable = 60;
      
      // Check if rapid fire has expired
      if (p.rapidFire && Date.now() > p.rapidFireEndTime) {
        p.rapidFire = false;
      }
      
      p.shieldActive = keys['ShiftLeft'] || keys['ShiftRight'];
      if (p.shieldActive && !p.shield) {
        p.shieldActive = false;
      }
      
      if (p.isAttacking) {
        p.attackFrame++;
        if (p.attackFrame > 10) {
          p.isAttacking = false;
          p.attackFrame = 0;
        }
      }
      
      let dx = 0;
      if (keys['ArrowLeft'] || keys['KeyA']) {
        dx -= 1;
        p.facing = 'left';
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
        dx += 1;
        p.facing = 'right';
      }
      
      p.x += dx * p.speed * p.speedBoost;
      p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
      
      p.isCrouching = keys['ArrowDown'] || keys['KeyS'];
      
      // CHANGED: Removed space bar from jumping - now only W and Up Arrow
      if ((keys['ArrowUp'] || keys['KeyW']) && !p.isJumping && !p.isCrouching) {
        p.velocityY = p.jumpPower;
        p.isJumping = true;
      }
      
      p.velocityY += p.gravity;
      p.y += p.velocityY;
      
      if (p.y >= p.groundY) {
        p.y = p.groundY;
        p.velocityY = 0;
        p.isJumping = false;
      }
      
      if (spacePressed && !p.shieldActive) {
        playerAttack();
      }
      
      if (p.boostEndTime < Date.now()) {
        p.damageBoost = 1;
        p.speedBoost = 1;
      }
    };

    const updateEnemies = () => {
      if (game.state !== 'playing') return;
      
      game.enemies.forEach((enemy, index) => {
        const p = game.player;
        if (!p) return;
        
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.facing = dx > 0 ? 'right' : 'left';
        
        if (distance > enemy.attackRange) {
          if (enemy.flying) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed * 0.5;
          } else if (enemy.underground) {
            enemy.x += (dx / distance) * enemy.speed;
          } else {
            enemy.x += (dx / distance) * enemy.speed;
          }
        } else {
          enemyAttack(enemy, index);
        }
      });
    };

    const enemyAttack = (enemy, index) => {
      const now = Date.now();
      if (now - enemy.lastAttack < enemy.attackCooldown) return;
      
      const p = game.player;
      if (!p) return;
      
      enemy.lastAttack = now;
      
      if (enemy.projectile) {
        const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
        
        if (enemy.beam) {
          game.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 7,
            vy: Math.sin(angle) * 7,
            radius: 8,
            color: '#9333ea',
            damage: enemy.attackDamage,
            fromPlayer: false,
            beam: true,
          });
        } else {
          game.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            radius: 5,
            color: enemy.underground ? '#78350f' : '#ff0000',
            damage: enemy.attackDamage,
            fromPlayer: false,
            beam: false,
          });
        }
      } else {
        const dx = p.x - enemy.x;
        const dy = p.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < enemy.attackRange) {
          if (p.shieldActive && p.shield) {
            p.shieldHealth -= enemy.attackDamage * 0.5;
            if (p.shieldHealth <= 0) {
              p.shield = false;
              p.shieldActive = false;
              p.shieldHealth = 0;
            }
            
            game.particles.push({
              x: p.x,
              y: p.y - 20,
              life: 40,
              maxLife: 40,
              type: 'damage',
              value: 'BLOCKED!',
              vx: 0,
              vy: -1,
              color: '#4169e1',
              radius: 2,
            });
          } else if (p.invulnerable === 0 && p.invincibilityEndTime < now) {
            const canDodge = (p.isCrouching && !enemy.underground) || 
                            (p.isJumping && p.y < p.groundY - 30 && !enemy.flying);
            
            if (!canDodge) {
              p.health -= enemy.attackDamage;
              p.invulnerable = 60;
              if (p.health <= 0) {
                handlePlayerDeath();
              }
            } else {
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: 'DODGED!',
                vx: 0,
                vy: -1,
                color: '#fbbf24',
                radius: 2,
              });
            }
          }
        }
      }
    };

    const updateProjectiles = () => {
      game.projectiles.forEach((projectile, projIndex) => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        
        if (projectile.x < -20 || projectile.x > canvas.width + 20 ||
            projectile.y < -20 || projectile.y > canvas.height + 20) {
          game.projectiles.splice(projIndex, 1);
          return;
        }
        
        if (projectile.fromPlayer) {
          for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            const dx = enemy.x - projectile.x;
            const dy = enemy.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < enemy.width / 2 + projectile.radius) {
              enemy.health -= projectile.damage;
              
              game.particles.push({
                x: enemy.x,
                y: enemy.y - 10,
                life: 60,
                maxLife: 60,
                type: 'damage',
                value: projectile.damage.toFixed(1),
                vx: (Math.random() - 0.5) * 2,
                vy: -2,
                color: '#ffffff',
                radius: 2,
              });
              
              if (enemy.health <= 0) {
                handleEnemyDeath(enemy, i);
              }
              
              game.projectiles.splice(projIndex, 1);
              break;
            }
          }
        } else {
          const p = game.player;
          const dx = p.x - projectile.x;
          const dy = p.y - projectile.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < p.width / 2 + projectile.radius) {
            const now = Date.now();
            
            if (p.shieldActive && p.shield) {
              p.shieldHealth -= projectile.damage * 0.5;
              if (p.shieldHealth <= 0) {
                p.shield = false;
                p.shieldActive = false;
                p.shieldHealth = 0;
              }
              
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: 'BLOCKED!',
                vx: 0,
                vy: -1,
                color: '#4169e1',
                radius: 2,
              });
            } else if (p.invulnerable === 0 && p.invincibilityEndTime < now) {
              const canDodge = (p.isCrouching && projectile.y < p.groundY - 20) || 
                              (p.isJumping && p.y < p.groundY - 40 && projectile.y > p.y + 20);
              
              if (!canDodge) {
                p.health -= projectile.damage;
                p.invulnerable = 60;
                if (p.health <= 0) {
                  handlePlayerDeath();
                }
              } else {
                game.particles.push({
                  x: p.x,
                  y: p.y - 20,
                  life: 40,
                  maxLife: 40,
                  type: 'damage',
                  value: 'DODGED!',
                  vx: 0,
                  vy: -1,
                  color: '#fbbf24',
                  radius: 2,
                });
              }
            }
            
            game.projectiles.splice(projIndex, 1);
          }
        }
      });
    };

    const updateParticles = () => {
      game.particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        if (particle.life <= 0) {
          game.particles.splice(index, 1);
        }
      });
    };

    const drawParticles = () => {
      game.particles.forEach(particle => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        
        if (particle.type === 'damage') {
          ctx.fillStyle = particle.color || '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.fillText(particle.value, particle.x, particle.y);
        } else {
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 1;
      });
    };

    const handleWeapons = () => {
      game.weapons.forEach((weapon, index) => {
        const p = game.player;
        if (!p) return;
        
        const dx = p.x - weapon.x;
        const dy = p.y - weapon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < p.width / 2 + weapon.radius) {
          if (weapon.type === 'shield_pickup') {
            p.shield = true;
            p.shieldHealth = 50;
          } else {
            p.weapon = weapon.type;
            p.weaponUses = weapons[weapon.type].maxUses;
          }
          
          game.weapons.splice(index, 1);
          
          for (let i = 0; i < 8; i++) {
            game.particles.push({
              x: weapon.x,
              y: weapon.y,
              radius: 3,
              color: '#ffd700',
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 30,
              maxLife: 30,
            });
          }
        }
      });
    };

    const handleOrbs = () => {
      game.orbs.forEach((orb, index) => {
        const p = game.player;
        if (!p) return;
        
        orb.vy += 0.1;
        orb.x += orb.vx;
        orb.y += orb.vy;
        
        if (orb.y > game.map.groundY - orb.radius) {
          orb.y = game.map.groundY - orb.radius;
          orb.vy = -orb.vy * 0.6;
          orb.vx *= 0.8;
        }
        
        if (orb.x < orb.radius) {
          orb.x = orb.radius;
          orb.vx = -orb.vx * 0.5;
        }
        if (orb.x > canvas.width - orb.radius) {
          orb.x = canvas.width - orb.radius;
          orb.vx = -orb.vx * 0.5;
        }
        
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < p.width / 2 + orb.radius) {
          switch (orb.type) {
            case 'health':
              p.health = Math.min(p.maxHealth, p.health + 10);
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: '+10 HP',
                vx: 0,
                vy: -1,
                color: '#ef4444',
                radius: 2,
              });
              break;
            case 'rapid_fire':
              p.rapidFire = true;
              p.rapidFireEndTime = Date.now() + 8000;
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: 'RAPID FIRE!',
                vx: 0,
                vy: -1,
                color: '#f59e0b',
                radius: 2,
              });
              break;
            case 'damage':
              p.damageBoost = 2;
              p.boostEndTime = Date.now() + 5000;
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: 'DAMAGE BOOST!',
                vx: 0,
                vy: -1,
                color: '#dc2626',
                radius: 2,
              });
              break;
            case 'speed':
              p.speedBoost = 1.5;
              p.boostEndTime = Date.now() + 5000;
              game.particles.push({
                x: p.x,
                y: p.y - 20,
                life: 40,
                maxLife: 40,
                type: 'damage',
                value: 'SPEED BOOST!',
                vx: 0,
                vy: -1,
                color: '#3b82f6',
                radius: 2,
              });
              break;
          }
          
          game.orbs.splice(index, 1);
          
          for (let i = 0; i < 5; i++) {
            game.particles.push({
              x: orb.x,
              y: orb.y,
              radius: 2,
              color: orb.type === 'health' ? '#ef4444' : 
                     orb.type === 'rapid_fire' ? '#f59e0b' :
                     orb.type === 'damage' ? '#dc2626' : '#3b82f6',
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 20,
              maxLife: 20,
            });
          }
        }
      });
    };

    const handleEnemyDeath = (enemy, index) => {
      const now = Date.now();
      const points = enemy.points;
      
      game.score += points;
      game.kills += 1;
      game.combo = now - game.comboTimer < 5000 ? game.combo + 1 : 1;
      game.comboTimer = now;
      
      spawnOrbs(enemy.x, enemy.y, enemy.type);
      
      for (let i = 0; i < 15; i++) {
        game.particles.push({
          x: enemy.x,
          y: enemy.y,
          radius: 3,
          color: enemy.color,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 40,
          maxLife: 40,
        });
      }
      
      onScoreSubmit?.(points);
      game.enemies.splice(index, 1);
    };

    const handlePlayerDeath = () => {
      game.score = Math.max(0, game.score - 6);
      game.deaths += 1;
      game.combo = 0;
      
      onScoreSubmit?.(-6);
      
      const p = game.player;
      if (p) {
        p.x = 100;
        p.y = p.groundY;
        p.health = p.maxHealth;
        p.invulnerable = 120;
        p.weapon = 'fist';
        p.weaponUses = Infinity;
        p.velocityY = 0;
        p.isJumping = false;
        p.isCrouching = false;
        p.rapidFire = false;
        
        for (let i = 0; i < 20; i++) {
          game.particles.push({
            x: p.x,
            y: p.y,
            radius: 4,
            color: '#4f46e5',
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 50,
            maxLife: 50,
          });
        }
      }
    };

    const update = () => {
      if (game.state !== 'playing') return;
      if (timeLeft <= 0) {
        game.state = 'time-up';
        return;
      }
      
      spawnEnemy();
      spawnWeapon();
      updatePlayer();
      updateEnemies();
      updateProjectiles();
      updateParticles();
      handleWeapons();
      handleOrbs();
    };

    const handleKeyDown = (e) => {
      keys[e.code] = true;
      
      if (e.code === 'Space') {
        e.preventDefault();
        
        if (game.state === 'idle' || game.state === 'time-up') {
          initGame();
        } else if (game.state === 'playing') {
          spacePressed = true;
          spacePressTime = Date.now();
          isCharging = true;
          chargePower = 0;
        }
      }
    };

    const handleKeyUp = (e) => {
      keys[e.code] = false;
      
      if (e.code === 'Space') {
        spacePressed = false;
        if (isCharging) {
          releaseChargedAttack();
        }
        isCharging = false;
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      mouse.pressed = true;
    };

    const handleMouseUp = () => {
      mouse.pressed = false;
    };

    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
    };
  }, [timeLeft, onScoreSubmit, isMobile, userScore]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{
          border: '2px solid #8b5cf6',
          borderRadius: '8px',
          cursor: 'crosshair',
          background: 'linear-gradient(45deg, #1f2937, #374151)',
        }}
      />
      <div className="mt-4 text-white text-sm text-center max-w-3xl px-4">
        <p className="font-bold text-lg mb-2">🗡️ Enhanced Medieval Conquest 🗡️</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <p><strong>Controls:</strong></p>
            <p>• A/D or ←/→: Move</p>
            <p>• W/↑: Jump</p>
            <p>• S: Crouch/Dodge</p>
            <p>• Hold Shift: Block (with shield)</p>
            <p>• Tap Space: Melee Attack</p>
            <p>• Hold Space: Charge Ranged</p>
          </div>
          <div>
            <p><strong>Scoring & Power-ups:</strong></p>
            <p>• Kill (60s): +2 points</p>
            <p>• Kill (≤60s): +3 points</p>
            <p>• Boss Kill: +5 points</p>
            <p>• Death: -6 points</p>
            <p>• Red Orbs: +10 Health</p>
            <p>• <span className="text-yellow-300">Yellow Orbs: Rapid Fire!</span></p>
          </div>
        </div>
        <p className="mt-2 text-yellow-300">
          <strong>Enemies:</strong> Swordsmen • Archers • <span className="text-purple-300">Bats</span> • <span className="text-orange-300">Worms</span>
        </p>
        <p className="text-green-300">
          <strong>Power-ups:</strong> Red=Health | Yellow=Rapid Fire | Blue=Speed | Dark Red=Damage
        </p>
        <p className="mt-1 text-blue-300">
          <span className="text-yellow-300">Rapid Fire</span> makes you attack much faster for 8 seconds!
        </p>
      </div>
    </div>
  );
};

export default EnhancedConquest;