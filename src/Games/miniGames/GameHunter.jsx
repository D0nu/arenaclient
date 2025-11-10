import React, { useRef, useEffect, useState } from 'react';

const GemHunter = ({ timeLeft = 180, onScoreSubmit = () => {}, userScore = 0 }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    state: 'idle',
    player: null,
    gems: [],
    cursedGems: [],
    animals: [],
    obstacles: [],
    particles: [],
    map: null,
    currentLevel: 1,
    lastGemSpawnTime: 0,
    lastAnimalSpawnTime: 0,
    score: userScore || 0,
    gemsCollected: 0,
    deaths: 0,
    levelTransition: false,
    transitionTimer: 0,
    door: null,
    gemsCollectedThisLevel: 0,
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

    // Enhanced themed maps with more obstacles for hiding spots
    const maps = [
      {
        level: 1,
        name: '🌲 Mysterious Forest',
        background: '#1b5e20',
        ground: '#2e7d32',
        doorColor: '#8d6e63',
        obstacles: [
          { x: 120, y: 80, width: 80, height: 100, type: 'ancient_tree', color: '#3e2723' },
          { x: 350, y: 150, width: 120, height: 60, type: 'mossy_rock', color: '#5d4037' },
          { x: 600, y: 200, width: 90, height: 70, type: 'fallen_log', color: '#4e342e' },
          { x: 200, y: 300, width: 100, height: 80, type: 'ancient_tree', color: '#3e2723' },
          { x: 450, y: 350, width: 70, height: 90, type: 'mossy_rock', color: '#5d4037' },
          { x: 100, y: 450, width: 130, height: 50, type: 'fallen_log', color: '#4e342e' },
          { x: 550, y: 100, width: 60, height: 60, type: 'bush', color: '#1b5e20' },
          { x: 300, y: 400, width: 80, height: 40, type: 'bush', color: '#1b5e20' },
          { x: 650, y: 320, width: 50, height: 80, type: 'ancient_tree', color: '#3e2723' },
        ],
        animals: ['snake', 'spider'],
        gemColors: ['#4fc3f7', '#81c784', '#fff176'],
      },
      {
        level: 2,
        name: '🏜️ Ancient Desert',
        background: '#ffb74d',
        ground: '#ff9800',
        doorColor: '#8d6e63',
        obstacles: [
          { x: 150, y: 120, width: 100, height: 80, type: 'pyramid_ruins', color: '#795548' },
          { x: 400, y: 200, width: 90, height: 70, type: 'sphinx_statue', color: '#8d6e63' },
          { x: 600, y: 300, width: 120, height: 60, type: 'temple_wall', color: '#a1887f' },
          { x: 250, y: 350, width: 80, height: 90, type: 'pyramid_ruins', color: '#795548' },
          { x: 500, y: 100, width: 70, height: 100, type: 'sphinx_statue', color: '#8d6e63' },
          { x: 100, y: 250, width: 110, height: 50, type: 'temple_wall', color: '#a1887f' },
          { x: 350, y: 450, width: 60, height: 60, type: 'cactus', color: '#388e3c' },
          { x: 650, y: 180, width: 40, height: 120, type: 'cactus', color: '#388e3c' },
          { x: 200, y: 150, width: 90, height: 40, type: 'sand_dune', color: '#ffcc80' },
        ],
        animals: ['scorpion', 'snake'],
        gemColors: ['#ffb300', '#e65100', '#8e24aa'],
      },
      {
        level: 3,
        name: '❄️ Crystal Cavern',
        background: '#4fc3f7',
        ground: '#29b6f6',
        doorColor: '#e1f5fe',
        obstacles: [
          { x: 180, y: 100, width: 100, height: 100, type: 'ice_crystal', color: '#e1f5fe' },
          { x: 420, y: 180, width: 80, height: 120, type: 'frozen_pillar', color: '#b3e5fc' },
          { x: 600, y: 320, width: 110, height: 80, type: 'ice_wall', color: '#81d4fa' },
          { x: 150, y: 350, width: 90, height: 90, type: 'ice_crystal', color: '#e1f5fe' },
          { x: 350, y: 280, width: 70, height: 70, type: 'frozen_pillar', color: '#b3e5fc' },
          { x: 500, y: 400, width: 100, height: 60, type: 'ice_wall', color: '#81d4fa' },
          { x: 250, y: 200, width: 60, height: 60, type: 'snow_mound', color: '#fafafa' },
          { x: 650, y: 120, width: 50, height: 80, type: 'ice_crystal', color: '#e1f5fe' },
          { x: 100, y: 450, width: 80, height: 40, type: 'snow_mound', color: '#fafafa' },
        ],
        animals: ['spider', 'snake'],
        gemColors: ['#4dd0e1', '#7e57c2', '#f06292'],
      },
      {
        level: 4,
        name: '🌋 Volcanic Core',
        background: '#d84315',
        ground: '#bf360c',
        doorColor: '#ff6f00',
        obstacles: [
          { x: 200, y: 120, width: 90, height: 90, type: 'lava_rock', color: '#3e2723' },
          { x: 450, y: 200, width: 110, height: 70, type: 'volcano_vent', color: '#ff6f00' },
          { x: 600, y: 350, width: 100, height: 80, type: 'obsidian_wall', color: '#263238' },
          { x: 150, y: 300, width: 80, height: 100, type: 'lava_rock', color: '#3e2723' },
          { x: 400, y: 400, width: 70, height: 70, type: 'volcano_vent', color: '#ff6f00' },
          { x: 300, y: 150, width: 120, height: 50, type: 'obsidian_wall', color: '#263238' },
          { x: 550, y: 100, width: 60, height: 60, type: 'magma_crystal', color: '#ff3d00' },
          { x: 100, y: 450, width: 50, height: 80, type: 'lava_rock', color: '#3e2723' },
          { x: 650, y: 220, width: 40, height: 100, type: 'magma_crystal', color: '#ff3d00' },
        ],
        animals: ['scorpion', 'bee', 'snake'],
        gemColors: ['#ff5722', '#ff9800', '#ffeb3b'],
      },
      {
        level: 5,
        name: '🏰 Lost Temple',
        background: '#4527a0',
        ground: '#5e35b1',
        doorColor: '#ffd54f',
        obstacles: [
          { x: 170, y: 120, width: 100, height: 90, type: 'ancient_altar', color: '#5d4037' },
          { x: 430, y: 180, width: 90, height: 110, type: 'stone_statue', color: '#78909c' },
          { x: 600, y: 300, width: 120, height: 70, type: 'temple_pillar', color: '#b0bec5' },
          { x: 150, y: 320, width: 80, height: 100, type: 'ancient_altar', color: '#5d4037' },
          { x: 400, y: 400, width: 70, height: 80, type: 'stone_statue', color: '#78909c' },
          { x: 300, y: 200, width: 100, height: 60, type: 'temple_pillar', color: '#b0bec5' },
          { x: 550, y: 100, width: 60, height: 60, type: 'sacred_rune', color: '#ffd54f' },
          { x: 100, y: 450, width: 50, height: 80, type: 'ancient_altar', color: '#5d4037' },
          { x: 650, y: 220, width: 40, height: 100, type: 'sacred_rune', color: '#ffd54f' },
        ],
        animals: ['spider', 'bee', 'scorpion'],
        gemColors: ['#ab47bc', '#ec407a', '#26c6da'],
      },
    ];

    const player = {
      x: 100,
      y: 100,
      width: isMobile ? 20 : 24,
      height: isMobile ? 28 : 32,
      speed: 3.5,
      health: 100,
      maxHealth: 100,
      invulnerable: 0,
      facing: 'down',
      moving: false,
    };

    const animalTypes = {
      snake: {
        emoji: '🐍',
        color: '#15803d',
        speed: 2,
        width: 30,
        height: 15,
        damage: 25,
        patrolRange: 100,
        detectionRange: 120,
      },
      spider: {
        emoji: '🕷️',
        color: '#1f2937',
        speed: 2.5,
        width: 20,
        height: 20,
        damage: 20,
        patrolRange: 80,
        detectionRange: 100,
      },
      scorpion: {
        emoji: '🦂',
        color: '#78350f',
        speed: 1.8,
        width: 25,
        height: 20,
        damage: 30,
        patrolRange: 90,
        detectionRange: 110,
      },
      bee: {
        emoji: '🐝',
        color: '#fbbf24',
        speed: 3,
        width: 18,
        height: 18,
        damage: 15,
        patrolRange: 120,
        detectionRange: 140,
        flying: true,
      },
    };

    const initGame = () => {
      game.state = 'playing';
      game.currentLevel = 1;
      loadLevel(1);
      game.score = userScore || 0;
      game.gemsCollected = 0;
      game.deaths = 0;
      game.gemsCollectedThisLevel = 0;
    };

    const loadLevel = (levelNum) => {
      const mapIndex = (levelNum - 1) % maps.length;
      game.map = maps[mapIndex];
      game.currentLevel = levelNum;
      
      game.player = { ...player };
      game.player.x = 100;
      game.player.y = 100;
      game.player.health = game.player.maxHealth;
      game.player.invulnerable = 60;
      
      game.gems = [];
      game.cursedGems = [];
      game.animals = [];
      game.particles = [];
      game.obstacles = game.map.obstacles;
      game.door = null;
      game.gemsCollectedThisLevel = 0;
      game.lastGemSpawnTime = Date.now();
      game.lastAnimalSpawnTime = Date.now();
      
      // Spawn initial gems
      spawnGems(12); // More gems for hiding
      spawnCursedGems(3);
      spawnAnimals(4);
    };

    const spawnGems = (count) => {
      for (let i = 0; i < count; i++) {
        let validPosition = false;
        let x, y;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
          x = Math.random() * (canvas.width - 100) + 50;
          y = Math.random() * (canvas.height - 100) + 50;
          
          // Check if gem is hidden behind obstacles (good hiding spot)
          const isHidden = game.obstacles.some(obstacle => {
            const distance = Math.sqrt(Math.pow(x - (obstacle.x + obstacle.width/2), 2) + Math.pow(y - (obstacle.y + obstacle.height/2), 2));
            return distance < Math.max(obstacle.width, obstacle.height) * 0.8;
          });
          
          validPosition = !checkCollisionWithObstacles({ x, y, width: 15, height: 15 }) && isHidden;
          attempts++;
        }
        
        if (validPosition) {
          const colorIndex = Math.floor(Math.random() * game.map.gemColors.length);
          
          game.gems.push({
            x,
            y,
            radius: 8,
            color: game.map.gemColors[colorIndex],
            sparkle: Math.random() * Math.PI * 2,
            points: timeLeft > 60 ? 2 : 3,
            hidden: true, // Gems start hidden
            revealTimer: 0,
          });
        }
      }
    };

    const spawnCursedGems = (count) => {
      for (let i = 0; i < count; i++) {
        let validPosition = false;
        let x, y;
        let attempts = 0;
        
        while (!validPosition && attempts < 50) {
          x = Math.random() * (canvas.width - 100) + 50;
          y = Math.random() * (canvas.height - 100) + 50;
          
          // Cursed gems are also hidden
          const isHidden = game.obstacles.some(obstacle => {
            const distance = Math.sqrt(Math.pow(x - (obstacle.x + obstacle.width/2), 2) + Math.pow(y - (obstacle.y + obstacle.height/2), 2));
            return distance < Math.max(obstacle.width, obstacle.height) * 0.8;
          });
          
          validPosition = !checkCollisionWithObstacles({ x, y, width: 15, height: 15 }) && isHidden;
          attempts++;
        }
        
        if (validPosition) {
          game.cursedGems.push({
            x,
            y,
            radius: 8,
            color: '#dc2626',
            sparkle: Math.random() * Math.PI * 2,
            cursed: true,
            hidden: true,
            revealTimer: 0,
          });
        }
      }
    };

    const spawnAnimals = (count) => {
      const availableAnimals = game.map.animals;
      
      for (let i = 0; i < count; i++) {
        const animalType = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
        const config = animalTypes[animalType];
        
        let validPosition = false;
        let x, y;
        
        while (!validPosition) {
          x = Math.random() * (canvas.width - 100) + 50;
          y = Math.random() * (canvas.height - 100) + 50;
          
          validPosition = !checkCollisionWithObstacles({ x, y, width: config.width, height: config.height });
        }
        
        game.animals.push({
          ...config,
          type: animalType,
          x,
          y,
          startX: x,
          startY: y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          state: 'patrol',
          targetX: x,
          targetY: y,
        });
      }
    };

    const spawnDoor = () => {
      let validPosition = false;
      let x, y;
      
      while (!validPosition) {
        x = Math.random() * (canvas.width - 100) + 50;
        y = Math.random() * (canvas.height - 100) + 50;
        
        validPosition = !checkCollisionWithObstacles({ x, y, width: 40, height: 60 });
      }
      
      game.door = {
        x,
        y,
        width: 40,
        height: 60,
        color: game.map.doorColor,
        pulsate: 0,
      };
    };

    const checkCollisionWithObstacles = (entity) => {
      return game.obstacles.some(obstacle => {
        return entity.x < obstacle.x + obstacle.width &&
               entity.x + (entity.width || 0) > obstacle.x &&
               entity.y < obstacle.y + obstacle.height &&
               entity.y + (entity.height || 0) > obstacle.y;
      });
    };

    const drawMap = () => {
        if (!game.map) {
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }
      ctx.fillStyle = game.map.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Ground texture with more detail
      ctx.fillStyle = game.map.ground;
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < canvas.width; i += 30) {
        for (let j = 0; j < canvas.height; j += 30) {
          if ((i + j) % 60 === 0) {
            ctx.fillStyle = game.map.background;
          } else {
            ctx.fillStyle = game.map.ground;
          }
          ctx.fillRect(i, j, 28, 28);
        }
      }
      ctx.globalAlpha = 1;
      
      // Enhanced obstacles with more detail
      game.obstacles.forEach(obstacle => {
        // Main obstacle
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Detailed texture based on type
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < obstacle.width; i += 8) {
          for (let j = 0; j < obstacle.height; j += 8) {
            if (Math.random() > 0.7) {
              ctx.fillRect(obstacle.x + i, obstacle.y + j, 4, 4);
            }
          }
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(obstacle.x + 3, obstacle.y + 3, obstacle.width, obstacle.height);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width - 2, obstacle.height - 2);
      });
      
      // Map name with better styling
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 16px Arial' : 'bold 20px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.textAlign = 'center';
      ctx.fillText(`🏰 Level ${game.currentLevel}: ${game.map.name}`, canvas.width / 2, 30);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    };

    const drawPlayer = () => {
      const p = game.player;
      if (!p) return;
      
      ctx.save();
      
      // Invulnerability flashing
      if (p.invulnerable > 0 && Math.floor(p.invulnerable / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      
      // More human-like character
      const headRadius = p.width / 3;
      const bodyLength = p.height * 0.4;
      
      // Head with skin tone
      ctx.fillStyle = '#f0c8a0'; // Skin color
      ctx.beginPath();
      ctx.arc(p.x, p.y - bodyLength, headRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair
      ctx.fillStyle = '#8b4513'; // Brown hair
      ctx.fillRect(p.x - headRadius - 2, p.y - bodyLength - headRadius, headRadius * 2 + 4, 6);
      
      // Explorer outfit
      ctx.fillStyle = '#4f46e5'; // Blue shirt
      ctx.fillRect(p.x - headRadius, p.y - bodyLength + headRadius, headRadius * 2, bodyLength - headRadius);
      
      // Arms
      ctx.fillStyle = '#f0c8a0'; // Skin tone
      const armAngle = p.moving ? Math.sin(Date.now() / 100) * 0.3 : 0;
      ctx.fillRect(p.x - headRadius - 8, p.y - 5, 8, 15);
      ctx.fillRect(p.x + headRadius, p.y - 5, 8, 15);
      
      // Legs with pants
      ctx.fillStyle = '#78350f'; // Brown pants
      const legAngle = p.moving ? Math.sin(Date.now() / 100) * 0.4 : 0;
      ctx.fillRect(p.x - 4, p.y + bodyLength - 5, 8, 20);
      ctx.fillRect(p.x - 4, p.y + bodyLength + 15, 8, 15);
      
      // Face features
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x - 3, p.y - bodyLength - 2, 2, 0, Math.PI * 2); // Left eye
      ctx.arc(p.x + 3, p.y - bodyLength - 2, 2, 0, Math.PI * 2); // Right eye
      ctx.fill();
      
      // Smile
      ctx.beginPath();
      ctx.arc(p.x, p.y - bodyLength + 3, 4, 0, Math.PI);
      ctx.stroke();
      
      // Health bar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p.x - 15, p.y - p.height - 15, 30, 6);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(p.x - 15, p.y - p.height - 15, 30 * (p.health / p.maxHealth), 6);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(p.x - 15, p.y - p.height - 15, 30, 6);
      
      ctx.restore();
    };

    const drawGems = () => {
      game.gems.forEach(gem => {
        gem.sparkle += 0.1;
        
        // Hidden gems are barely visible
        if (gem.hidden) {
          ctx.globalAlpha = 0.3 + Math.sin(gem.sparkle) * 0.2;
        } else {
          ctx.globalAlpha = 1;
        }
        
        // Outer glow for revealed gems
        if (!gem.hidden) {
          const gradient = ctx.createRadialGradient(gem.x, gem.y, 0, gem.x, gem.y, gem.radius * 2);
          gradient.addColorStop(0, gem.color);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(gem.x, gem.y, gem.radius * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Main gem
        ctx.fillStyle = gem.color;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Sparkle for revealed gems
        if (!gem.hidden) {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.5 + Math.sin(gem.sparkle) * 0.5) + ')';
          ctx.beginPath();
          ctx.arc(gem.x - 3, gem.y - 3, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Points indicator
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`+${gem.points}`, gem.x, gem.y - gem.radius - 5);
          ctx.textAlign = 'left';
        }
        
        ctx.globalAlpha = 1;
      });
      
      // Cursed gems
      game.cursedGems.forEach(gem => {
        gem.sparkle += 0.15;
        
        // Hidden cursed gems
        if (gem.hidden) {
          ctx.globalAlpha = 0.3 + Math.sin(gem.sparkle) * 0.2;
        } else {
          ctx.globalAlpha = 1;
        }
        
        // Dark pulsing aura for revealed cursed gems
        if (!gem.hidden) {
          ctx.fillStyle = `rgba(220, 38, 38, ${0.3 + Math.sin(gem.sparkle) * 0.2})`;
          ctx.beginPath();
          ctx.arc(gem.x, gem.y, gem.radius * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Main cursed gem
        ctx.fillStyle = gem.color;
        ctx.beginPath();
        ctx.arc(gem.x, gem.y, gem.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Skull symbol for revealed cursed gems
        if (!gem.hidden) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('☠', gem.x, gem.y + 4);
          ctx.textAlign = 'left';
        }
        
        ctx.globalAlpha = 1;
      });
    };

    const drawDoor = () => {
      if (!game.door) return;
      
      const door = game.door;
      door.pulsate += 0.05;
      
      // Door frame
      ctx.fillStyle = door.color;
      ctx.fillRect(door.x, door.y, door.width, door.height);
      
      // Door details
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(door.x + 5, door.y + 5, door.width - 10, door.height - 10);
      
      // Door handle
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(door.x + door.width - 10, door.y + door.height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Pulsing glow
      ctx.strokeStyle = `rgba(255, 213, 79, ${0.5 + Math.sin(door.pulsate) * 0.3})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(door.x - 2, door.y - 2, door.width + 4, door.height + 4);
      
      // Door label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🚪 NEXT LEVEL', door.x + door.width / 2, door.y - 10);
      ctx.textAlign = 'left';
    };

    const drawAnimals = () => {
      game.animals.forEach(animal => {
        ctx.save();
        
        // Emoji representation
        ctx.font = `${animal.width}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillText(animal.emoji, animal.x + 2, animal.y + 2);
        
        // Animal
        ctx.fillText(animal.emoji, animal.x, animal.y);
        
        // Aggro indicator
        if (animal.state === 'chase') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(animal.x, animal.y - animal.height, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
    };

    const drawParticles = () => {
      game.particles.forEach(particle => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        
        if (particle.type === 'text') {
          ctx.fillStyle = particle.color;
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(particle.text, particle.x, particle.y);
          ctx.textAlign = 'left';
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 12px Arial' : 'bold 14px Arial';
      ctx.fillText(`💎 Score: ${Math.max(0, game.score)}`, 10, canvas.height - 30);
      ctx.fillText(`Gems: ${game.gemsCollected}`, 10, canvas.height - 12);
      ctx.fillText(`⏱️ Time: ${Math.ceil(timeLeft)}s`, 180, canvas.height - 30);
      ctx.fillText(`☠️ Deaths: ${game.deaths}`, 180, canvas.height - 12);
      ctx.fillText(`📍 Level ${game.currentLevel}`, 350, canvas.height - 21);
      
      // Level progress - now for door
      const gemsNeeded = 8;
      const progress = Math.min(game.gemsCollectedThisLevel, gemsNeeded);
      ctx.fillStyle = '#374151';
      ctx.fillRect(520, canvas.height - 35, 260, 20);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(520, canvas.height - 35, (260 / gemsNeeded) * progress, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(520, canvas.height - 35, 260, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${progress}/${gemsNeeded} gems for door`, 650, canvas.height - 21);
      ctx.textAlign = 'left';
    };

    const drawGameOver = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 32px Arial' : 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 ADVENTURE COMPLETE! 🏆', canvas.width / 2, canvas.height / 2 - 80);
      
      ctx.font = isMobile ? 'bold 18px Arial' : 'bold 24px Arial';
      ctx.fillText(`Final Score: ${Math.max(0, game.score)}`, canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText(`💎 Gems Collected: ${game.gemsCollected}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(`📍 Levels Reached: ${game.currentLevel}`, canvas.width / 2, canvas.height / 2 + 60);
      ctx.fillText(`☠️ Deaths: ${game.deaths}`, canvas.width / 2, canvas.height / 2 + 100);
      
      ctx.textAlign = 'left';
    };

    const drawInstructions = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('💎 GEM HUNTER ADVENTURE 💎', canvas.width / 2, 80);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Search for hidden gems while avoiding dangerous animals!', canvas.width / 2, 130);
      
      ctx.font = '14px Arial';
      ctx.fillText('🎮 CONTROLS', canvas.width / 2, 180);
      ctx.fillText('WASD or Arrow Keys: Move your explorer', canvas.width / 2, 210);
      
      ctx.fillText('💎 GEMS', canvas.width / 2, 260);
      ctx.fillText('Gems are hidden behind obstacles - explore carefully!', canvas.width / 2, 290);
      ctx.fillText('Good Gems: +2 points (>60s) or +3 points (≤60s)', canvas.width / 2, 315);
      ctx.fillText('☠️ Red Cursed Gems: -3 points (AVOID!)', canvas.width / 2, 340);
      
      ctx.fillText('🚪 DOORS', canvas.width / 2, 390);
      ctx.fillText('Collect 8 gems to reveal the door to the next level!', canvas.width / 2, 420);
      ctx.fillText('Entering door: +6 BONUS POINTS!', canvas.width / 2, 445);
      
      ctx.fillText('🐍 DANGERS', canvas.width / 2, 495);
      ctx.fillText('Snakes, Spiders, Scorpions, Bees will attack you!', canvas.width / 2, 525);
      ctx.fillText('Getting hit: -1 point and respawn', canvas.width / 2, 550);
      
      ctx.fillText('📍 LEVELS', canvas.width / 2, 600);
      ctx.fillText('5 unique themed levels with different challenges', canvas.width / 2, 630);
      ctx.fillText('See how many levels you can complete in 3 minutes!', canvas.width / 2, 655);
      
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Press SPACE to start your adventure!', canvas.width / 2, 705);
      
      ctx.textAlign = 'left';
    };

    const draw = () => {
      drawMap();
      
      if (game.state === 'playing') {
        drawGems();
        drawAnimals();
        drawParticles();
        if (game.door) drawDoor();
        drawPlayer();
        drawHUD();
        
        // Level transition overlay
        if (game.levelTransition) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Level ${game.currentLevel}!`, canvas.width / 2, canvas.height / 2);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 24px Arial';
          ctx.fillText(game.map.name, canvas.width / 2, canvas.height / 2 + 50);
          ctx.textAlign = 'left';
        }
      } else if (game.state === 'time-up') {
        drawGameOver();
      } else {
        drawInstructions();
      }
    };

    const updatePlayer = () => {
      if (game.state !== 'playing' || game.levelTransition) return;
      
      const p = game.player;
      if (!p) return;
      
      if (p.invulnerable > 0) p.invulnerable--;
      
      let dx = 0, dy = 0;
      p.moving = false;
      
      if (keys['ArrowUp'] || keys['KeyW']) { dy -= 1; p.moving = true; p.facing = 'up'; }
      if (keys['ArrowDown'] || keys['KeyS']) { dy += 1; p.moving = true; p.facing = 'down'; }
      if (keys['ArrowLeft'] || keys['KeyA']) { dx -= 1; p.moving = true; p.facing = 'left'; }
      if (keys['ArrowRight'] || keys['KeyD']) { dx += 1; p.moving = true; p.facing = 'right'; }
      
      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }
      
      const nextX = p.x + dx * p.speed;
      const nextY = p.y + dy * p.speed;
      
      // Check collision with obstacles
      const nextPlayer = { x: nextX, y: nextY, width: p.width, height: p.height };
      if (!checkCollisionWithObstacles(nextPlayer)) {
        p.x = nextX;
        p.y = nextY;
      }
      
      // Keep player in bounds
      p.x = Math.max(p.width / 2, Math.min(canvas.width - p.width / 2, p.x));
      p.y = Math.max(p.height / 2, Math.min(canvas.height - p.height / 2, p.y));
      
      // Reveal gems when player is close
      game.gems.forEach(gem => {
        if (gem.hidden) {
          const distance = Math.sqrt(Math.pow(p.x - gem.x, 2) + Math.pow(p.y - gem.y, 2));
          if (distance < 60) {
            gem.revealTimer++;
            if (gem.revealTimer > 30) {
              gem.hidden = false;
            }
          } else {
            gem.revealTimer = Math.max(0, gem.revealTimer - 1);
          }
        }
      });
      
      game.cursedGems.forEach(gem => {
        if (gem.hidden) {
          const distance = Math.sqrt(Math.pow(p.x - gem.x, 2) + Math.pow(p.y - gem.y, 2));
          if (distance < 60) {
            gem.revealTimer++;
            if (gem.revealTimer > 30) {
              gem.hidden = false;
            }
          } else {
            gem.revealTimer = Math.max(0, gem.revealTimer - 1);
          }
        }
      });
      
      // Check door collision
      if (game.door) {
        const door = game.door;
        if (p.x > door.x && p.x < door.x + door.width &&
            p.y > door.y && p.y < door.y + door.height) {
          levelUp();
        }
      }
    };

    const updateAnimals = () => {
      if (game.state !== 'playing' || game.levelTransition) return;
      
      game.animals.forEach((animal, index) => {
        const p = game.player;
        if (!p) return;
        
        const dx = p.x - animal.x;
        const dy = p.y - animal.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // State machine: patrol or chase
        if (distance < animal.detectionRange) {
          animal.state = 'chase';
          // Chase player
          const angle = Math.atan2(dy, dx);
          animal.vx = Math.cos(angle) * animal.speed;
          animal.vy = Math.sin(angle) * animal.speed;
        } else {
          animal.state = 'patrol';
          // Random patrol
          if (Math.random() < 0.02) {
            animal.vx = (Math.random() - 0.5) * animal.speed;
            animal.vy = (Math.random() - 0.5) * animal.speed;
          }
        }
        
        // Move animal
        const nextX = animal.x + animal.vx;
        const nextY = animal.y + animal.vy;
        
        const nextAnimal = { x: nextX, y: nextY, width: animal.width, height: animal.height };
        if (!checkCollisionWithObstacles(nextAnimal)) {
          animal.x = nextX;
          animal.y = nextY;
        } else {
          // Bounce off obstacles
          animal.vx *= -1;
          animal.vy *= -1;
        }
        
        // Keep in bounds
        if (animal.x < 20 || animal.x > canvas.width - 20) animal.vx *= -1;
        if (animal.y < 20 || animal.y > canvas.height - 20) animal.vy *= -1;
        
        animal.x = Math.max(20, Math.min(canvas.width - 20, animal.x));
        animal.y = Math.max(20, Math.min(canvas.height - 20, animal.y));
        
        // Check collision with player
        if (p.invulnerable === 0 && distance < (animal.width + p.width) / 2) {
          handlePlayerHit(animal);
        }
      });
    };

    const updateGems = () => {
      if (game.state !== 'playing' || game.levelTransition) return;
      
      const p = game.player;
      if (!p) return;
      
      // Check gem collection
      game.gems.forEach((gem, index) => {
        if (gem.hidden) return;
        
        const dx = p.x - gem.x;
        const dy = p.y - gem.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < p.width / 2 + gem.radius) {
          collectGem(gem, index);
        }
      });
      
      // Check cursed gem collection
      game.cursedGems.forEach((gem, index) => {
        if (gem.hidden) return;
        
        const dx = p.x - gem.x;
        const dy = p.y - gem.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < p.width / 2 + gem.radius) {
          collectCursedGem(gem, index);
        }
      });
      
      // Spawn new gems periodically
      const now = Date.now();
      if (now - game.lastGemSpawnTime > 15000 && game.gems.length < 10) {
        spawnGems(2);
        game.lastGemSpawnTime = now;
      }
      
      // Spawn new animals periodically
      if (now - game.lastAnimalSpawnTime > 20000 && game.animals.length < 5) {
        spawnAnimals(1);
        game.lastAnimalSpawnTime = now;
      }
    };

    const collectGem = (gem, index) => {
      game.score += gem.points;
      game.gemsCollected++;
      game.gemsCollectedThisLevel++;
      onScoreSubmit?.(gem.points);
      
      // Particle explosion
      for (let i = 0; i < 12; i++) {
        game.particles.push({
          x: gem.x,
          y: gem.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 2,
          radius: 3,
          color: gem.color,
          life: 40,
          maxLife: 40,
        });
      }
      
      // Points text
      game.particles.push({
        x: gem.x,
        y: gem.y,
        vx: 0,
        vy: -2,
        type: 'text',
        text: `+${gem.points}`,
        color: '#22c55e',
        life: 60,
        maxLife: 60,
      });
      
      game.gems.splice(index, 1);
      
      // Spawn door when enough gems collected
      if (game.gemsCollectedThisLevel >= 8 && !game.door) {
        spawnDoor();
      }
    };

    const collectCursedGem = (gem, index) => {
      game.score = Math.max(0, game.score - 3);
      onScoreSubmit?.(-3);
      
      // Dark particle explosion
      for (let i = 0; i < 15; i++) {
        game.particles.push({
          x: gem.x,
          y: gem.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          radius: 4,
          color: '#dc2626',
          life: 50,
          maxLife: 50,
        });
      }
      
      // Warning text
      game.particles.push({
        x: gem.x,
        y: gem.y,
        vx: 0,
        vy: -3,
        type: 'text',
        text: 'CURSED! -3',
        color: '#ef4444',
        life: 80,
        maxLife: 80,
      });
      
      game.cursedGems.splice(index, 1);
      
      // Stun player briefly
      game.player.invulnerable = 30;
    };

    const handlePlayerHit = (animal) => {
      const p = game.player;
      
      p.health -= animal.damage;
      p.invulnerable = 90;
      
      // Hit particles
      for (let i = 0; i < 10; i++) {
        game.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5 - 2,
          radius: 3,
          color: '#ef4444',
          life: 40,
          maxLife: 40,
        });
      }
      
      // Damage text
      game.particles.push({
        x: p.x,
        y: p.y - 20,
        vx: 0,
        vy: -2,
        type: 'text',
        text: `${animal.emoji} HIT!`,
        color: '#ef4444',
        life: 60,
        maxLife: 60,
      });
      
      if (p.health <= 0) {
        handlePlayerDeath();
      }
    };

    const handlePlayerDeath = () => {
      // Reduced death penalty from -3 to -1
      game.score = Math.max(0, game.score - 1);
      game.deaths++;
      onScoreSubmit?.(-1);
      
      const p = game.player;
      
      // Death explosion
      for (let i = 0; i < 25; i++) {
        game.particles.push({
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          radius: 4,
          color: Math.random() > 0.5 ? '#fbbf24' : '#4f46e5',
          life: 60,
          maxLife: 60,
        });
      }
      
      // Death text with updated penalty
      game.particles.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: -3,
        type: 'text',
        text: '☠️ -1 POINT',
        color: '#ef4444',
        life: 100,
        maxLife: 100,
      });
      
      // Respawn
      setTimeout(() => {
        p.x = 100;
        p.y = 100;
        p.health = p.maxHealth;
        p.invulnerable = 120;
      }, 500);
    };

    const levelUp = () => {
      // Add +6 bonus for going through door
      game.score += 6;
      onScoreSubmit?.(6);
      
      game.levelTransition = true;
      game.transitionTimer = 120; // 2 seconds at 60fps
      
      // Level up particles with bonus celebration
      for (let i = 0; i < 40; i++) {
        game.particles.push({
          x: game.player.x,
          y: game.player.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 4,
          radius: 6,
          color: '#fbbf24',
          life: 100,
          maxLife: 100,
        });
      }
      
      // Bonus text for door
      game.particles.push({
        x: game.player.x,
        y: game.player.y - 30,
        vx: 0,
        vy: -2,
        type: 'text',
        text: '🚪 LEVEL UP! +6 BONUS!',
        color: '#22c55e',
        life: 120,
        maxLife: 120,
      });
      
      setTimeout(() => {
        game.currentLevel++;
        loadLevel(game.currentLevel);
        game.levelTransition = false;
      }, 2000);
    };

    const updateParticles = () => {
      game.particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.type !== 'text') {
          particle.vy += 0.2; // Gravity
        }
        
        particle.life--;
        
        if (particle.life <= 0) {
          game.particles.splice(index, 1);
        }
      });
    };

    const update = () => {
      if (game.state !== 'playing') return;
      
      if (timeLeft <= 0) {
        game.state = 'time-up';
        return;
      }
      
      if (game.levelTransition) {
        game.transitionTimer--;
        updateParticles();
        return;
      }
      
      updatePlayer();
      updateAnimals();
      updateGems();
      updateParticles();
    };

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

    const gameLoop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [timeLeft, onScoreSubmit, isMobile, userScore]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{
          border: '3px solid #fbbf24',
          borderRadius: '12px',
          cursor: 'crosshair',
          background: 'linear-gradient(135deg, #1f2937, #374151)',
          boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)',
        }}
      />
      <div className="mt-4 text-white text-sm text-center max-w-3xl px-4">
        <p className="font-bold text-xl mb-3 text-yellow-400">💎 GEM HUNTER ADVENTURE 💎</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-gray-800/50 rounded-lg p-4">
          <div className="bg-blue-900/30 rounded p-2">
            <p className="font-bold text-blue-300 mb-1">🎮 Controls</p>
            <p>• WASD / Arrow Keys: Move</p>
            <p>• Explore and find hidden gems!</p>
          </div>
          
          <div className="bg-green-900/30 rounded p-2">
            <p className="font-bold text-green-300 mb-1">💎 Gems & Doors</p>
            <p>• Gems are hidden behind obstacles</p>
            <p>• Collect 8 gems to reveal the door</p>
            <p>• Enter door: +6 BONUS POINTS!</p>
          </div>
          
          <div className="bg-red-900/30 rounded p-2">
            <p className="font-bold text-red-300 mb-1">🐍 Dangers</p>
            <p>• Animals attack: -1 point</p>
            <p>• ☠️ Cursed gems: -3 points</p>
            <p>• Survive 3 minutes!</p>
          </div>
        </div>
        
        <div className="mt-3 text-yellow-300 bg-yellow-900/20 rounded-lg p-3">
          <p className="font-bold mb-1">🗺️ 5 Epic Levels:</p>
          <p className="text-xs">
            Mysterious Forest 🌲 → Ancient Desert 🏜️ → Crystal Cavern ❄️ → Volcanic Core 🌋 → Lost Temple 🏰
          </p>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-purple-900/30 rounded p-2">
            <p className="font-bold text-purple-300">🔍 Exploration</p>
            <p>Gems are hidden - search carefully!</p>
            <p>Get close to reveal hidden gems</p>
          </div>
          <div className="bg-orange-900/30 rounded p-2">
            <p className="font-bold text-orange-300">⚡ Strategy</p>
            <p>Avoid red gems & dangerous animals!</p>
            <p>Find the door for +6 bonus points!</p>
          </div>
        </div>
        
        <p className="mt-3 text-green-400 font-bold">
          Explore all 5 levels in 3 minutes! Complete levels for bonus points! 🏆
        </p>
      </div>
    </div>
  );
};

export default GemHunter;