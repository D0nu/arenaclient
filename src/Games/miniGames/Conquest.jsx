import React, { useRef, useEffect, useState } from 'react';

const Conquest = ({ timeLeft, onScoreSubmit, userScore }) => {
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
    score: 0,
    kills: 0,
    deaths: 0,
    combo: 0,
    comboTimer: 0,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
             window.innerWidth <= 768;
    };
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = isMobile ? Math.min(800, window.innerWidth - 20) : 800;
    canvas.height = isMobile ? Math.min(600, window.innerHeight - 200) : 600;

    const game = gameRef.current;
    let animationId;
    let keys = {};
    let mouse = { x: 0, y: 0, pressed: false };

    const maps = [
      {
        name: 'Forest Fortress',
        background: '#2d5a27',
        ground: '#4a7c59',
        obstacles: [
          { x: 200, y: 150, width: 50, height: 50, type: 'tree' },
          { x: 500, y: 300, width: 80, height: 40, type: 'rock' },
          { x: 100, y: 400, width: 60, height: 60, type: 'tree' },
        ],
        enemyTypes: ['swordsman', 'archer', 'knight'],
        boss: 'forest_guardian',
      },
      {
        name: 'Desert Ruins',
        background: '#d4a574',
        ground: '#b38b6d',
        obstacles: [
          { x: 300, y: 200, width: 70, height: 40 },
          { x: 600, y: 100, width: 50, height: 70 },
          { x: 150, y: 350, width: 90, height: 30 },
        ],
        enemyTypes: ['swordsman', 'archer'],
        boss: 'forest_guardian',
      },
      {
        name: 'Ice Citadel',
        background: '#a8d0e6',
        ground: '#c8d6e5',
        obstacles: [
          { x: 400, y: 250, width: 60, height: 60 },
          { x: 200, y: 100, width: 40, height: 80 },
          { x: 650, y: 400, width: 70, height: 50 },
        ],
        enemyTypes: ['swordsman', 'archer'],
        boss: 'forest_guardian',
      },
    ];

    const defaultMap = {
      name: 'Medieval Conquest',
      background: '#1f2937',
      ground: '#374151',
      obstacles: [],
      enemyTypes: ['swordsman'],
      boss: 'forest_guardian',
    };

    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: isMobile ? 25 : 30,
      height: isMobile ? 35 : 40,
      speed: 4,
      health: 100,
      maxHealth: 100,
      weapon: 'fist',
      weaponUses: Infinity,
      shield: false,
      shieldHealth: 50,
      invulnerable: 0,
      lastAttack: 0,
      attackCooldown: 500,
      lastSpell: 0,
      spellCooldown: 3000,
      facing: 'down',
      damageBoost: 1,
      speedBoost: 1,
      boostEndTime: 0,
      invincibilityEndTime: 0,
    };

    const enemyTypes = {
      swordsman: {
        color: '#dc2626',
        speed: 2,
        width: isMobile ? 24 : 28,
        height: isMobile ? 34 : 38,
        health: 4,
        maxHealth: 4,
        attackRange: 40,
        attackDamage: 15,
        attackCooldown: 1000,
        points: 1,
      },
      archer: {
        color: '#ea580c',
        speed: 2.5,
        width: isMobile ? 22 : 26,
        height: isMobile ? 32 : 36,
        health: 3,
        maxHealth: 3,
        attackRange: 200,
        attackDamage: 10,
        attackCooldown: 1500,
        points: 1,
        projectile: true,
      },
      knight: {
        color: '#1e3a8a',
        speed: 1.8,
        width: isMobile ? 30 : 35,
        height: isMobile ? 40 : 45,
        health: 6,
        maxHealth: 6,
        attackRange: 50,
        attackDamage: 20,
        attackCooldown: 1200,
        points: 2,
      },
      forest_guardian: {
        color: '#15803d',
        speed: 1.5,
        width: isMobile ? 50 : 60,
        height: isMobile ? 60 : 70,
        health: 50,
        maxHealth: 50,
        attackRange: 50,
        attackDamage: 25,
        attackCooldown: 1500,
        points: 10,
        isBoss: true,
      },
    };

    const orbTypes = {
      health: { effect: 'health', value: 20 },
      damage: { effect: 'damage', value: 1.5, duration: 5000 },
      shield: { effect: 'shield', value: 50 },
      speed: { effect: 'speed', value: 1.5, duration: 5000 },
      invincibility: { effect: 'invincibility', value: 5000 },
    };

    const weapons = {
      fist: { range: 30, damage: 0.5, cooldown: 400, projectile: false, maxUses: Infinity },
      sword: { range: 50, damage: 1, cooldown: 500, projectile: false, maxUses: 20 },
      bow: { range: 200, damage: 0.8, cooldown: 800, projectile: true, maxUses: 15 },
      spear: { range: 80, damage: 1.2, cooldown: 600, projectile: false, maxUses: 10 },
      flail: { range: 60, damage: 0.9, cooldown: 700, projectile: false, maxUses: 12, aoe: true },
    };

    const spells = {
      fireball: {
        color: '#dc2626',
        damage: 20,
        speed: 8,
        radius: 12,
        cooldown: 3000,
      },
    };

    const initGame = () => {
      game.state = 'playing';
      game.map = maps[Math.floor(Math.random() * maps.length)] || defaultMap;
      game.player = { ...player };
      game.enemies = [];
      game.projectiles = [];
      game.particles = [];
      game.orbs = [];
      game.weapons = [];
      game.lastSpawnTime = Date.now();
      game.lastOrbSpawnTime = Date.now();
      game.lastWeaponSpawnTime = Date.now();
      game.score = 0;
      game.kills = 0;
      game.deaths = 0;
      game.combo = 0;
      game.comboTimer = 0;
      game.player.spell = 'fireball';
    };

    game.map = defaultMap;

    const getKillPoints = (enemyType) => {
      return enemyType?.isBoss ? 10 : timeLeft > 60 ? 1 : 2;
    };

    const getMaxEnemies = () => {
      return timeLeft > 60 ? 3 : 6;
    };

    const getSpawnRate = () => {
      return timeLeft > 60 ? 4000 : 2000;
    };

    const drawMap = () => {
      const currentMap = game.map || defaultMap;
      ctx.fillStyle = currentMap.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = currentMap.ground;
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      ctx.fillStyle = '#8b4513';
      currentMap.obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      });
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 14px Arial' : 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(currentMap.name, canvas.width / 2, isMobile ? 25 : 30);
      ctx.textAlign = 'left';
    };

    const drawHealthBar = (x, y, health, maxHealth, width = 30, height = 5) => {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x - width / 2, y - height, width, height);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x - width / 2, y - height, width * (health / maxHealth), height);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(x - width / 2, y - height, width, height);
    };

    const drawStickman = (ctx, x, y, width, height, color, facing, weapon, isMoving, isAttacking, isBoss = false) => {
      const headRadius = isBoss ? width / 3 : width / 4;
      const bodyLength = isBoss ? height * 0.5 : height / 2;
      const armLength = isBoss ? width * 0.5 : width / 2.5;
      const legLength = isBoss ? height * 0.2 : height / 4; // Shorter legs for standing
      const animationFrame = isMoving ? Math.sin(Date.now() / 100) * 0.2 : 0;

      // Head
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - bodyLength / 2 - headRadius, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Body (vertical, facing down)
      ctx.strokeStyle = color;
      ctx.lineWidth = isBoss ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x, y - bodyLength / 2);
      ctx.lineTo(x, y + bodyLength / 2);
      ctx.stroke();

      // Arms (neutral downward position, slight animation)
      const armAngle = isAttacking ? -0.3 : (animationFrame * 0.2 - 0.5); // Downward facing with attack lift
      ctx.beginPath();
      ctx.moveTo(x, y - bodyLength / 4);
      ctx.lineTo(x + armLength * Math.cos(armAngle), y - bodyLength / 4 + armLength * Math.sin(armAngle));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - bodyLength / 4);
      ctx.lineTo(x - armLength * Math.cos(armAngle), y - bodyLength / 4 + armLength * Math.sin(armAngle));
      ctx.stroke();

      // Legs (vertical, shorter for standing)
      ctx.beginPath();
      ctx.moveTo(x, y + bodyLength / 2);
      ctx.lineTo(x, y + bodyLength / 2 + legLength);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + bodyLength / 2);
      ctx.lineTo(x, y + bodyLength / 2 + legLength);
      ctx.stroke();

      // Weapon (adjusted for downward facing)
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = isBoss ? 5 : 3;
      if (weapon === 'sword' || weapon === 'knight') {
        ctx.beginPath();
        ctx.moveTo(x, y + bodyLength / 4);
        ctx.lineTo(x, y + bodyLength / 4 + (isBoss ? 25 : 15));
        ctx.stroke();
      } else if (weapon === 'bow') {
        ctx.beginPath();
        ctx.moveTo(x - 10, y + bodyLength / 4);
        ctx.lineTo(x, y + bodyLength / 4 + 10);
        ctx.lineTo(x + 10, y + bodyLength / 4);
        ctx.stroke();
      } else if (weapon === 'spear') {
        ctx.beginPath();
        ctx.moveTo(x, y + bodyLength / 4);
        ctx.lineTo(x, y + bodyLength / 4 + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + bodyLength / 4 + 20, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (weapon === 'flail') {
        ctx.beginPath();
        ctx.moveTo(x, y + bodyLength / 4);
        ctx.lineTo(x, y + bodyLength / 4 + 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + bodyLength / 4 + 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawPlayer = () => {
      const p = game.player;
      if (!p) return;
      const isMoving = keys['ArrowUp'] || keys['KeyW'] || keys['ArrowDown'] || keys['KeyS'] || keys['ArrowLeft'] || keys['KeyA'] || keys['ArrowRight'] || keys['KeyD'];
      const isAttacking = mouse.pressed && Date.now() - p.lastAttack < p.attackCooldown;

      drawStickman(
        ctx,
        p.x,
        p.y,
        p.width,
        p.height,
        p.invulnerable > 0 || p.invincibilityEndTime > Date.now() ? '#60a5fa' : '#4f46e5',
        p.facing,
        p.weapon,
        isMoving,
        isAttacking
      );
      drawHealthBar(p.x, p.y - p.height / 2 - 10, p.health, p.maxHealth, p.width);
    };

    const drawEnemies = () => {
      game.enemies.forEach(enemy => {
        const isMoving = true;
        const isAttacking = Date.now() - enemy.lastAttack < enemy.attackCooldown;
        drawStickman(
          ctx,
          enemy.x,
          enemy.y,
          enemy.width,
          enemy.height,
          enemy.color,
          enemy.facing,
          enemy.type === 'archer' ? 'bow' : enemy.type === 'knight' ? 'knight' : enemy.type === 'forest_guardian' ? 'sword' : 'sword',
          isMoving,
          isAttacking,
          enemy.isBoss
        );
        drawHealthBar(enemy.x, enemy.y - height / 2 - 10, enemy.health, enemy.maxHealth, enemy.width);
      });
    };

    const drawWeapons = () => {
      game.weapons.forEach(weapon => {
        ctx.save();
        ctx.translate(weapon.x, weapon.y + 10); // Shift down to ground level
        ctx.strokeStyle = '#a8a29e';
        ctx.fillStyle = '#a8a29e';
        ctx.lineWidth = 3;
        switch (weapon.type) {
          case 'sword':
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            break;
          case 'bow':
            ctx.beginPath();
            ctx.moveTo(-10, 5);
            ctx.lineTo(0, 0);
            ctx.lineTo(-10, -5);
            ctx.stroke();
            break;
          case 'spear':
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(15, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(15, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'flail':
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
        }
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500) * 0.2;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    };

    const drawProjectiles = () => {
      game.projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawOrbs = () => {
      game.orbs.forEach(orb => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawParticles = () => {
      game.particles.forEach(particle => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        if (particle.type === 'damage') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
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

    const drawHUD = () => {
      const displayScore = Math.max(0, game.score); // Cap score at 0
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? 'bold 14px Arial' : 'bold 16px Arial';
      ctx.fillText(`Score: ${displayScore}`, 10, isMobile ? 20 : 30);
      ctx.fillText(`Kills: ${game.kills}`, 10, isMobile ? 35 : 50);
      ctx.fillText(`Combo: ${game.combo}x`, 10, isMobile ? 50 : 70);
      ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 10, isMobile ? 65 : 90);
      ctx.fillText(`Weapon: ${game.player.weapon} (${game.player.weaponUses})`, 10, isMobile ? 80 : 110);
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = isMobile ? 'bold 32px Arial' : 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CONQUEST ENDED!', canvas.width / 2, canvas.height / 2 - 50);
      ctx.textAlign = 'left';
    };

    const drawInstructions = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('MEDIEVAL CONQUEST', canvas.width / 2, canvas.height / 2 - 80);
      ctx.font = '16px Arial';
      ctx.fillText('WASD to move • Q for Spell • Click to attack • Collect weapons', canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText('Press SPACE to begin your conquest', canvas.width / 2, canvas.height / 2 + 80);
      ctx.textAlign = 'left';
    };

    const draw = () => {
      drawMap();
      if (game.state === 'playing') {
        drawOrbs();
        drawWeapons();
        drawParticles();
        drawProjectiles();
        drawEnemies();
        drawPlayer();
        drawHUD();
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
      const rand = Math.random();
      if (timeLeft <= 60 && rand < 0.3 && !game.enemies.some(e => e.isBoss)) {
        enemyType = game.map.boss;
      } else {
        const availableTypes = game.map.enemyTypes;
        enemyType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      }

      const typeConfig = enemyTypes[enemyType] || enemyTypes.swordsman;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      switch (side) {
        case 0: x = Math.random() * canvas.width; y = -typeConfig.height; break;
        case 1: x = canvas.width + typeConfig.width; y = Math.random() * canvas.height; break;
        case 2: x = Math.random() * canvas.width; y = canvas.height + typeConfig.height; break;
        case 3: x = -typeConfig.width; y = Math.random() * canvas.height; break;
      }

      game.enemies.push({
        ...typeConfig,
        x,
        y,
        type: enemyType,
        lastAttack: 0,
        facing: 'down',
      });
    };

    const spawnOrb = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      if (now - game.lastOrbSpawnTime < 8000 || game.orbs.length >= 3) return;

      game.lastOrbSpawnTime = now;
      const orbKeys = Object.keys(orbTypes);
      const randomType = orbKeys[Math.floor(Math.random() * orbKeys.length)];
      const orb = orbTypes[randomType];

      game.orbs.push({
        ...orb,
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        radius: 8,
      });
    };

    const spawnWeapon = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      if (now - game.lastWeaponSpawnTime < 10000 || game.weapons.length >= 3) return;

      game.lastWeaponSpawnTime = now;
      const weaponKeys = ['sword', 'bow', 'spear', 'flail'];
      const randomType = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];

      game.weapons.push({
        type: randomType,
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        radius: 10,
      });
    };

    const playerAttack = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      const p = game.player;
      if (!p) return;
      const weapon = weapons[p.weapon] || weapons.fist;
      if (now - p.lastAttack < weapon.cooldown) return;

      p.lastAttack = now;
      if (p.weapon !== 'fist') {
        p.weaponUses = Math.max(0, p.weaponUses - 1);
        if (p.weaponUses === 0) {
          p.weapon = 'fist';
          p.weaponUses = Infinity;
        }
      }

      if (weapon.projectile) {
        const angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
        game.projectiles.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(angle) * 8,
          vy: Math.sin(angle) * 8,
          radius: 5,
          color: '#ff4500',
          damage: weapon.damage * p.damageBoost,
          fromPlayer: true,
        });
      } else {
        for (let i = game.enemies.length - 1; i >= 0; i--) {
          const enemy = game.enemies[i];
          const dx = enemy.x - p.x;
          const dy = enemy.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < weapon.range) {
            const damage = weapon.damage * p.damageBoost * (weapon.aoe ? 1.5 : 1);
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
            });
            if (enemy.health <= 0) {
              handleEnemyDeath(enemy, i);
            }
            if (weapon.aoe) {
              for (let j = game.enemies.length - 1; j >= 0; j--) {
                if (j !== i) {
                  const otherEnemy = game.enemies[j];
                  const dx2 = otherEnemy.x - p.x;
                  const dy2 = otherEnemy.y - p.y;
                  const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                  if (dist2 < weapon.range * 1.5) {
                    otherEnemy.health -= damage * 0.5;
                    game.particles.push({
                      x: otherEnemy.x,
                      y: otherEnemy.y - 10,
                      life: 60,
                      maxLife: 60,
                      type: 'damage',
                      value: (damage * 0.5).toFixed(1),
                      vx: (Math.random() - 0.5) * 2,
                      vy: -2,
                    });
                    if (otherEnemy.health <= 0) {
                      handleEnemyDeath(otherEnemy, j);
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const castSpell = () => {
      if (game.state !== 'playing') return;
      const now = Date.now();
      const p = game.player;
      if (!p) return;
      if (now - p.lastSpell < p.spellCooldown) return;

      p.lastSpell = now;
      const spell = spells[p.spell];
      const angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

      game.projectiles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * spell.speed,
        vy: Math.sin(angle) * spell.speed,
        radius: spell.radius,
        color: spell.color,
        damage: spell.damage,
        fromPlayer: true,
      });
    };

    const updatePlayer = () => {
      if (game.state !== 'playing') return;
      const p = game.player;
      if (!p) return;

      if (p.invulnerable > 0) {
        p.invulnerable--;
      }

      let dx = 0, dy = 0;
      if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
      if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
      if (keys['ArrowLeft'] || keys['KeyA']) { 
        dx -= 1;
        p.facing = 'down'; // Simplified to always face down
      }
      if (keys['ArrowRight'] || keys['KeyD']) { 
        dx += 1;
        p.facing = 'down'; // Simplified to always face down
      }

      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      p.x += dx * p.speed * p.speedBoost;
      p.y += dy * p.speed * p.speedBoost;

      p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
      p.y = Math.max(p.height / 2, Math.min(canvas.height - p.height / 2, p.y));

      if (mouse.pressed) {
        playerAttack();
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

        enemy.facing = 'down'; // Simplified to always face down
        if (enemy.type === 'archer' && distance < enemy.attackRange * 1.5) {
          enemy.x -= (dx / distance) * enemy.speed;
          enemy.y -= (dy / distance) * enemy.speed;
        } else if (distance > enemy.attackRange) {
          enemy.x += (dx / distance) * enemy.speed;
          enemy.y += (dy / distance) * enemy.speed;
        }
      });
    };

    const updateProjectiles = () => {
      game.projectiles.forEach((projectile, projIndex) => {
        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        if (projectile.x < -projectile.radius || projectile.x > canvas.width + projectile.radius ||
            projectile.y < -projectile.radius || projectile.y > canvas.height + projectile.radius) {
          game.projectiles.splice(projIndex, 1);
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

    const handleWeapons = () => {
      game.weapons.forEach((weapon, index) => {
        const p = game.player;
        if (!p) return;
        const dx = p.x - weapon.x;
        const dy = p.y - weapon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < p.width / 2 + weapon.radius && weapons[weapon.type]) {
          p.weapon = weapon.type;
          p.weaponUses = weapons[weapon.type].maxUses;
          game.weapons.splice(index, 1);
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
      });
    };

    const handleOrbs = () => {
      game.orbs.forEach((orb, index) => {
        const p = game.player;
        if (!p) return;
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < p.width / 2 + orb.radius) {
          switch (orb.effect) {
            case 'health':
              p.health = Math.min(p.maxHealth, p.health + orb.value);
              break;
            case 'damage':
              p.damageBoost = orb.value;
              p.boostEndTime = Date.now() + orb.duration;
              break;
            case 'speed':
              p.speedBoost = orb.value;
              p.boostEndTime = Date.now() + orb.duration;
              break;
            case 'invincibility':
              p.invincibilityEndTime = Date.now() + orb.value;
              break;
            case 'shield':
              p.shield = true;
              p.shieldHealth = orb.value;
              break;
          }
          game.orbs.splice(index, 1);
          game.particles.push({
            x: orb.x,
            y: orb.y,
            radius: 3,
            color: '#ffd700',
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
          });
        }
      });
    };

    const enemyAttack = (enemy, index) => {
      const now = Date.now();
      if (now - enemy.lastAttack < enemy.attackCooldown) return;

      const p = game.player;
      if (!p) return;
      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemy.attackRange) {
        enemy.lastAttack = now;
        if (enemy.projectile) {
          const angle = Math.atan2(p.y - enemy.y, p.x - enemy.x);
          game.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * 6,
            vy: Math.sin(angle) * 6,
            radius: 5,
            color: '#ff0000',
            damage: enemy.attackDamage,
            fromPlayer: false,
          });
        } else {
          if (p.invulnerable === 0 && p.invincibilityEndTime < now) {
            p.health -= enemy.attackDamage;
            p.invulnerable = 60;
            if (p.health <= 0) {
              handlePlayerDeath();
            }
          }
        }
      }
    };

    const handleEnemyDeath = (enemy, index) => {
      const now = Date.now();
      const points = getKillPoints(enemy) * (1 + game.combo * 0.1);
      game.score += points;
      game.kills += 1;
      game.combo = now - game.comboTimer < 5000 ? game.combo + 1 : 1;
      game.comboTimer = now;
      
      for (let i = 0; i < 10; i++) {
        game.particles.push({
          x: enemy.x,
          y: enemy.y,
          radius: 3,
          color: enemy.color,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 30,
          maxLife: 30,
        });
      }
      
      onScoreSubmit?.(points);
      game.enemies.splice(index, 1);
    };

    const handlePlayerDeath = () => {
      game.score = Math.max(0, game.score - 3); // Cap score at 0
      game.deaths += 1;
      game.combo = 0;
      onScoreSubmit?.(-3);
      const p = game.player;
      if (p) {
        p.x = canvas.width / 2;
        p.y = canvas.height / 2;
        p.health = p.maxHealth;
        p.invulnerable = 120;
        p.weapon = 'fist';
        p.weaponUses = Infinity;
      }
    };

    const update = () => {
      if (game.state !== 'playing') return;
      if (timeLeft <= 0) {
        game.state = 'time-up';
        return;
      }

      spawnEnemy();
      spawnOrb();
      spawnWeapon();
      updatePlayer();
      updateProjectiles();
      updateEnemies();
      updateParticles();
      handleOrbs();
      handleWeapons();

      const now = Date.now();
      if (game.player.boostEndTime < now) {
        game.player.damageBoost = 1;
        game.player.speedBoost = 1;
      }

      game.enemies.forEach((enemy, index) => enemyAttack(enemy, index));
    };

    const handleKeyDown = (e) => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (game.state === 'idle' || game.state === 'time-up') {
          initGame();
        }
      }
      if (e.code === 'KeyQ') {
        castSpell();
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
  }, [timeLeft, onScoreSubmit, isMobile]);

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
      <div className="mt-4 text-white text-sm text-center max-w-2xl">
        <p><strong>Medieval Conquest</strong> - Conquer the realms!</p>
        <p>WASD: Move • Q: Spell • Click: Attack • Collect weapons</p>
        <p>Kills: +1 (60s) +2 (≤60s) +10 (boss) • Death: -3 points • Combo: +10% per kill</p>
        <p>Pick up weapons to fight! Weapons have limited uses.</p>
      </div>
    </div>
  );
};

export default Conquest;