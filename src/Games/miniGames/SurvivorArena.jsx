import React, { useRef, useEffect, useState } from 'react';

const SurvivorArena = ({ timeLeft, onScoreSubmit, userScore }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    state: 'idle',
    player: null,
    enemies: [],
    bullets: [],
    particles: [],
    powerUps: [],
    lastSpawnTime: 0,
    lastPowerUpTime: 0,
    score: 0,
    kills: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 600;

    // Game variables
    const game = gameRef.current;
    let animationId;
    let keys = {};
    let mouse = { x: 0, y: 0 };

    // Player setup
    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 15,
      speed: 5,
      color: '#4F46E5',
      health: 100,
      invulnerable: 0,
      lastShot: 0,
      shootCooldown: 200
    };

    // Enemy types with increased health
    const enemyTypes = {
      basic: { 
        color: '#DC2626', 
        speed: 2, 
        radius: 12, 
        health: 3,
        maxHealth: 3,
      },
      fast: { 
        color: '#EF4444', 
        speed: 3.5, 
        radius: 8, 
        health: 2,
        maxHealth: 2,
      },
      tank: { 
        color: '#991B1B', 
        speed: 1.2, 
        radius: 20, 
        health: 7,
        maxHealth: 7,
      }
    };

    // Power-up types
    const powerUpTypes = {
      health: { color: '#10B981', radius: 10, type: 'health' },
      rapid: { color: '#F59E0B', radius: 10, type: 'rapid', duration: 5000 },
      shotgun: { color: '#8B5CF6', radius: 10, type: 'shotgun', duration: 7000 }
    };

    // Initialize game
    const initGame = () => {
      game.state = 'playing';
      game.player = { ...player };
      game.enemies = [];
      game.bullets = [];
      game.particles = [];
      game.powerUps = [];
      game.lastSpawnTime = Date.now();
      game.lastPowerUpTime = Date.now();
      game.score = 0;
      game.kills = 0;
      game.startTime = Date.now();
      game.player.rapidFire = false;
      game.player.shotgun = false;
      game.player.rapidEndTime = 0;
      game.player.shotgunEndTime = 0;
    };

    // Calculate points based on time left
    const getKillPoints = () => {
      return timeLeft > 60 ? 1 : 2;
    };

    // Get maximum enemies based on time
    const getMaxEnemies = () => {
      return timeLeft > 60 ? 3 : 5;
    };

    // Get spawn rate based on time
    const getSpawnRate = () => {
      return timeLeft > 60 ? 3000 : 1000;
    };

    const drawPlayer = () => {
      ctx.save();
      
      if (game.player.invulnerable > 0) {
        const pulse = Math.sin(Date.now() * 0.1) * 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#60A5FA';
      }
      
      let playerColor = game.player.color;
      if (game.player.rapidFire) playerColor = '#F59E0B';
      if (game.player.shotgun) playerColor = '#8B5CF6';
      
      ctx.fillStyle = playerColor;
      ctx.beginPath();
      ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
      ctx.fill();
      
      const angle = Math.atan2(mouse.y - game.player.y, mouse.x - game.player.x);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(game.player.x, game.player.y);
      ctx.lineTo(
        game.player.x + Math.cos(angle) * (game.player.radius + 10),
        game.player.y + Math.sin(angle) * (game.player.radius + 10)
      );
      ctx.stroke();
      
      ctx.restore();
    };

    const drawEnemies = () => {
      game.enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        
        const barWidth = enemy.radius * 2;
        const barHeight = 4;
        const barY = enemy.y - enemy.radius - 8;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x - barWidth/2, barY, barWidth, barHeight);
        
        const healthPercent = enemy.health / enemy.maxHealth;
        let healthColor = '#10B981';
        if (healthPercent < 0.6) healthColor = '#F59E0B';
        if (healthPercent < 0.3) healthColor = '#EF4444';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(enemy.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
      });
    };

    const drawBullets = () => {
      game.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawPowerUps = () => {
      game.powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = powerUp.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      });
    };

    const drawParticles = () => {
      game.particles.forEach(particle => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawHUD = () => {
      // Score
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Score: ${Math.floor(game.score)}`, 20, 30);
      ctx.fillText(`Kills: ${game.kills}`, 20, 55);
      
      // Time
      ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 20, 80);
      
      // Kill points info
      ctx.fillText(`Kill Points: +${getKillPoints()}`, 20, 105);
      
      // Death penalty info
      ctx.fillText(`Death Penalty: -5`, 20, 130);
      
      // Health bar
      const barWidth = 200;
      const barHeight = 20;
      const barX = canvas.width - barWidth - 20;
      const barY = 20;
      
      ctx.fillStyle = '#374151';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = game.player.health > 30 ? '#10B981' : '#EF4444';
      ctx.fillRect(barX, barY, barWidth * (game.player.health / 100), barHeight);
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`HP: ${Math.ceil(game.player.health)}`, barX + 10, barY + 14);

      // Power-up indicators
      const powerUpY = 60;
      if (game.player.rapidFire) {
        const timeLeft = Math.max(0, game.player.rapidEndTime - Date.now());
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(`Rapid Fire: ${(timeLeft/1000).toFixed(1)}s`, canvas.width - 200, powerUpY);
      }
      if (game.player.shotgun) {
        const timeLeft = Math.max(0, game.player.shotgunEndTime - Date.now());
        ctx.fillStyle = '#8B5CF6';
        ctx.fillText(`Shotgun: ${(timeLeft/1000).toFixed(1)}s`, canvas.width - 200, powerUpY + 25);
      }

      // Enemy count info
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial';
      ctx.fillText(`Enemies: ${game.enemies.length}/${getMaxEnemies()}`, canvas.width - 200, powerUpY + 60);
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TIME UP!', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${Math.floor(game.score)}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Total Kills: ${game.kills}`, canvas.width / 2, canvas.height / 2 + 30);
      
      ctx.font = '18px Arial';
      ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 80);
      ctx.textAlign = 'left';
    };

    const drawInstructions = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SURVIVOR ARENA', canvas.width / 2, canvas.height / 2 - 80);
      
      ctx.font = '18px Arial';
      ctx.fillText('Use WASD or Arrow Keys to move', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Aim with Mouse • Click to Shoot', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Kill enemies for points!', canvas.width / 2, canvas.height / 2 + 40);
      ctx.fillText('Early kills: +1 point • Late kills: +2 points', canvas.width / 2, canvas.height / 2 + 70);
      ctx.fillText('Death penalty: -5 points', canvas.width / 2, canvas.height / 2 + 100);
      ctx.fillText('Collect power-ups for special abilities', canvas.width / 2, canvas.height / 2 + 130);
      
      ctx.fillText('Press SPACE to start', canvas.width / 2, canvas.height / 2 + 180);
      ctx.textAlign = 'left';
    };

    const draw = () => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (game.state === 'playing') {
        drawPowerUps();
        drawParticles();
        drawBullets();
        drawEnemies();
        drawPlayer();
        drawHUD();
      } else if (game.state === 'time-up') {
        drawParticles();
        drawEnemies();
        drawPlayer();
        drawHUD();
        drawGameOver();
      } else {
        drawInstructions();
      }
    };

    // Game logic
    const spawnEnemy = () => {
      const now = Date.now();
      const spawnRate = getSpawnRate();
      const maxEnemies = getMaxEnemies();
      
      if (now - game.lastSpawnTime < spawnRate || game.enemies.length >= maxEnemies) return;
      
      game.lastSpawnTime = now;
      
      let type;
      const rand = Math.random();
      
      if (timeLeft <= 60 && rand < 0.2) {
        type = 'tank';
      } else if (timeLeft <= 60 && rand < 0.5) {
        type = 'fast';
      } else {
        type = 'basic';
      }
      
      const enemyType = enemyTypes[type];
      
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      switch (side) {
        case 0: // top
          x = Math.random() * canvas.width;
          y = -enemyType.radius;
          break;
        case 1: // right
          x = canvas.width + enemyType.radius;
          y = Math.random() * canvas.height;
          break;
        case 2: // bottom
          x = Math.random() * canvas.width;
          y = canvas.height + enemyType.radius;
          break;
        case 3: // left
          x = -enemyType.radius;
          y = Math.random() * canvas.height;
          break;
      }
      
      game.enemies.push({
        ...enemyType,
        x,
        y,
        type
      });
    };

    const spawnPowerUp = () => {
      const now = Date.now();
      if (now - game.lastPowerUpTime < 10000) return;
      
      game.lastPowerUpTime = now;
      
      const powerUpKeys = Object.keys(powerUpTypes);
      const randomType = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
      const powerUp = powerUpTypes[randomType];
      
      game.powerUps.push({
        ...powerUp,
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50
      });
    };

    const shoot = () => {
      const now = Date.now();
      if (now - game.player.lastShot < game.player.shootCooldown) return;
      
      game.player.lastShot = now;
      
      const angle = Math.atan2(mouse.y - game.player.y, mouse.x - game.player.x);
      
      if (game.player.shotgun) {
        for (let i = -2; i <= 2; i++) {
          const spreadAngle = angle + (i * 0.2);
          game.bullets.push({
            x: game.player.x,
            y: game.player.y,
            vx: Math.cos(spreadAngle) * 12,
            vy: Math.sin(spreadAngle) * 12,
            radius: 3,
            color: '#8B5CF6',
            damage: 1
          });
        }
      } else {
        game.bullets.push({
          x: game.player.x,
          y: game.player.y,
          vx: Math.cos(angle) * 10,
          vy: Math.sin(angle) * 10,
          radius: 4,
          color: game.player.rapidFire ? '#F59E0B' : '#FFFFFF',
          damage: 1
        });
      }
      
      game.player.shootCooldown = game.player.rapidFire ? 100 : 200;
    };

    const updatePlayer = () => {
      if (game.player.invulnerable > 0) {
        game.player.invulnerable--;
      }
      
      const now = Date.now();
      if (game.player.rapidFire && now > game.player.rapidEndTime) {
        game.player.rapidFire = false;
        game.player.shootCooldown = 200;
      }
      if (game.player.shotgun && now > game.player.shotgunEndTime) {
        game.player.shotgun = false;
      }
      
      let dx = 0, dy = 0;
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) dx += 1;
      
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }
      
      game.player.x += dx * game.player.speed;
      game.player.y += dy * game.player.speed;
      
      game.player.x = Math.max(game.player.radius, Math.min(canvas.width - game.player.radius, game.player.x));
      game.player.y = Math.max(game.player.radius, Math.min(canvas.height - game.player.radius, game.player.y));
    };

    const updateBullets = () => {
      game.bullets.forEach((bullet, bulletIndex) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        if (bullet.x < -bullet.radius || bullet.x > canvas.width + bullet.radius ||
            bullet.y < -bullet.radius || bullet.y > canvas.height + bullet.radius) {
          game.bullets.splice(bulletIndex, 1);
          return;
        }
        
        game.enemies.forEach((enemy, enemyIndex) => {
          const dx = bullet.x - enemy.x;
          const dy = bullet.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bullet.radius + enemy.radius) {
            enemy.health -= bullet.damage;
            
            for (let i = 0; i < 3; i++) {
              game.particles.push({
                x: enemy.x,
                y: enemy.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 2 + 1,
                color: enemy.color,
                life: 20,
                maxLife: 20
              });
            }
            
            game.bullets.splice(bulletIndex, 1);
            
            if (enemy.health <= 0) {
              // FIXED: Only add kill points, don't multiply by enemy points
              const killPoints = getKillPoints();
              game.score += killPoints;
              game.kills += 1;
              
              // FIXED: Send only the points earned, not total score
              onScoreSubmit?.(killPoints);
              
              for (let i = 0; i < 12; i++) {
                game.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  radius: Math.random() * 3 + 1,
                  color: enemy.color,
                  life: 30,
                  maxLife: 30
                });
              }
              
              if (Math.random() < 0.2) {
                spawnPowerUp();
              }
              
              game.enemies.splice(enemyIndex, 1);
            }
          }
        });
      });
    };

    const updateEnemies = () => {
      game.enemies.forEach((enemy, index) => {
        const dx = game.player.x - enemy.x;
        const dy = game.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
        
        if (game.player.invulnerable === 0) {
          const playerDx = game.player.x - enemy.x;
          const playerDy = game.player.y - enemy.y;
          const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
          
          if (playerDistance < game.player.radius + enemy.radius) {
            game.player.health -= enemy.type === 'tank' ? 25 : 15;
            game.player.invulnerable = 60;
            
            for (let i = 0; i < 8; i++) {
              game.particles.push({
                x: game.player.x,
                y: game.player.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 3 + 1,
                color: '#EF4444',
                life: 30,
                maxLife: 30
              });
            }
            
            if (game.player.health <= 0) {
              handlePlayerDeath();
            }
          }
        }
      });
    };

    const updatePowerUps = () => {
      game.powerUps.forEach((powerUp, index) => {
        const dx = game.player.x - powerUp.x;
        const dy = game.player.y - powerUp.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < game.player.radius + powerUp.radius) {
          switch (powerUp.type) {
            case 'health':
              game.player.health = Math.min(100, game.player.health + 30);
              break;
            case 'rapid':
              game.player.rapidFire = true;
              game.player.rapidEndTime = Date.now() + powerUp.duration;
              game.player.shootCooldown = 100;
              break;
            case 'shotgun':
              game.player.shotgun = true;
              game.player.shotgunEndTime = Date.now() + powerUp.duration;
              break;
          }
          
          for (let i = 0; i < 10; i++) {
            game.particles.push({
              x: powerUp.x,
              y: powerUp.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              radius: Math.random() * 2 + 1,
              color: powerUp.color,
              life: 40,
              maxLife: 40
            });
          }
          
          game.powerUps.splice(index, 1);
        }
      });
    };

    const updateParticles = () => {
      game.particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        particle.vy += 0.1;
        
        if (particle.life <= 0) {
          game.particles.splice(index, 1);
        }
      });
    };

    const handlePlayerDeath = () => {
      // Apply death penalty (-5 points)
      game.score = Math.max(0, game.score - 5);
      
      // FIXED: Send penalty points, not total score
      onScoreSubmit?.(-5);
      
      // Respawn player immediately (no lives system)
      game.player.x = canvas.width / 2;
      game.player.y = canvas.height / 2;
      game.player.health = 100;
      game.player.invulnerable = 180; // 3 seconds invulnerability
      game.player.rapidFire = false;
      game.player.shotgun = false;
      game.player.shootCooldown = 200;
    };

    const update = () => {
      if (game.state === 'playing') {
        if (timeLeft <= 0) {
          game.state = 'time-up';
          // FIXED: Don't call onScoreSubmit here - parent already has the score
          return;
        }
        
        spawnEnemy();
        spawnPowerUp();
        updatePlayer();
        updateBullets();
        updateEnemies();
        updatePowerUps();
        updateParticles();
        
        game.enemies.forEach(enemy => {
          enemy.speed = enemyTypes[enemy.type].speed * (1 + game.score * 0.0005);
        });
      }
    };

    // Input handling
    const handleKeyDown = (e) => {
      keys[e.code] = true;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (game.state === 'idle' || game.state === 'time-up') {
          initGame();
        }
      }
    };

    const handleKeyUp = (e) => {
      keys[e.code] = false;
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseDown = () => {
      if (game.state === 'playing') {
        shoot();
      }
    };

    // Game loop
    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    // Start game loop
    gameLoop();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationId);
    };
  }, [timeLeft, onScoreSubmit]);

  return (
    <div className="flex flex-col items-center">
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '2px solid #4F46E5',
          borderRadius: '8px',
          cursor: 'crosshair'
        }}
      />
      <div className="mt-4 text-white text-sm text-center">
        <p>WASD/Arrows: Move • Mouse: Aim • Click: Shoot</p>
        <p>Kills: +{timeLeft > 60 ? '1' : '2'} points • Deaths: -5 points • Unlimited Respawns until time ends</p>
      </div>
    </div>
  );
};

export default SurvivorArena;