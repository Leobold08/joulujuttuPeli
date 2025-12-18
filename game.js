const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');
const multiplierDisplay = document.getElementById('multiplier');
const pausedOverlay = document.getElementById('paused');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let animationId;
let combo = 0;
let multiplier = 1.0;
let slowTimeActive = false;
let slowTimeEnd = 0;

// Player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 7,
    dx: 0
};

// Gifts array
let gifts = [];
const giftTypes = ['🎁', '🎀', '⭐', '🔔', '🎄'];
const hazardTypes = ['💣']; // coal/bomb hazard
const powerUpTypes = [
    { emoji: '❤️', type: 'heart' },      // life+1
    { emoji: '⏳', type: 'hourglass' }, // slow-time
    { emoji: '✨', type: 'sparkle' }    // score boost
];
let giftSpeed = 2;
let spawnRate = 0.02;
let lastSpawnTime = 0;
let minSpawnDelay = 500; // Minimum milliseconds between spawns
let lastBurstTime = 0;
let burstInterval = 15000; // spawn burst every 15 seconds

// Snowflakes array (animated)
const snowflakes = [];
for (let i = 0; i < 50; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 1 + 0.5,
        radius: Math.random() * 2 + 1
    });
}

// Particles array
let particles = [];

// Screen shake
let shakeAmount = 0;
let shakeDecay = 0.9;

// Controls
const keys = {};
let touchLeft = false;
let touchRight = false;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Pause toggle
    if (e.key === ' ' && gameRunning) {
        e.preventDefault();
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile buttons
btnLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchLeft = true;
});

btnLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchLeft = false;
});

btnLeft.addEventListener('mousedown', (e) => {
    e.preventDefault();
    touchLeft = true;
});

btnLeft.addEventListener('mouseup', (e) => {
    e.preventDefault();
    touchLeft = false;
});

btnRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchRight = true;
});

btnRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchRight = false;
});

btnRight.addEventListener('mousedown', (e) => {
    e.preventDefault();
    touchRight = true;
});

btnRight.addEventListener('mouseup', (e) => {
    e.preventDefault();
    touchRight = false;
});

// Canvas tap controls - tap left/right side to move
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const canvasX = (x / rect.width) * canvas.width;
    
    if (canvasX < canvas.width / 2) {
        touchLeft = true;
        setTimeout(() => { touchLeft = false; }, 200);
    } else {
        touchRight = true;
        setTimeout(() => { touchRight = false; }, 200);
    }
});

canvas.addEventListener('click', (e) => {
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const canvasX = (x / rect.width) * canvas.width;
    
    if (canvasX < canvas.width / 2) {
        touchLeft = true;
        setTimeout(() => { touchLeft = false; }, 200);
    } else {
        touchRight = true;
        setTimeout(() => { touchRight = false; }, 200);
    }
});

// Sound stub
function playSound(soundName) {
    // Stubbed sound function for future audio implementation
    // console.log('Playing sound:', soundName);
}

// Pause/Resume toggle
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pausedOverlay.style.display = 'block';
    } else {
        pausedOverlay.style.display = 'none';
    }
}

// Create particles
function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (Math.random() * 3 + 2),
            vy: Math.sin(angle) * (Math.random() * 3 + 2),
            life: 1.0,
            decay: 0.02,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
}

// Update and draw particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// Screen shake effect
function applyScreenShake() {
    if (shakeAmount > 0) {
        const shakeX = (Math.random() - 0.5) * shakeAmount;
        const shakeY = (Math.random() - 0.5) * shakeAmount;
        ctx.translate(shakeX, shakeY);
        shakeAmount *= shakeDecay;
        if (shakeAmount < 0.1) shakeAmount = 0;
    }
}

function triggerShake(amount = 10) {
    shakeAmount = amount;
}

// Draw player (Santa)
function drawPlayer() {
    ctx.font = '50px Arial';
    ctx.fillText('🎅', player.x, player.y + player.height);
}

// Create gift
function createGift() {
    const rand = Math.random();
    let itemType = null;
    let emoji, category;
    
    // 70% regular gifts, 15% hazards, 15% power-ups
    if (rand < 0.70) {
        emoji = giftTypes[Math.floor(Math.random() * giftTypes.length)];
        category = 'gift';
    } else if (rand < 0.85) {
        emoji = hazardTypes[0];
        category = 'hazard';
    } else {
        const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        emoji = powerUp.emoji;
        category = 'powerup';
        itemType = powerUp.type;
    }
    
    const speedMultiplier = slowTimeActive ? 0.5 : 1.0;
    
    const gift = {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        type: emoji,
        category: category,
        itemType: itemType,
        speed: (giftSpeed + Math.random() * 2) * speedMultiplier,
        wasSlowed: slowTimeActive
    };
    gifts.push(gift);
}

// Draw gifts
function drawGifts() {
    ctx.font = '40px Arial';
    gifts.forEach(gift => {
        ctx.fillText(gift.type, gift.x, gift.y + gift.height);
    });
}

// Update gifts
function updateGifts() {
    const currentTime = Date.now();
    
    // Check if slow-time effect expired
    if (slowTimeActive && currentTime > slowTimeEnd) {
        slowTimeActive = false;
        // Update existing gift speeds that were slowed
        gifts.forEach(g => {
            if (g.wasSlowed) {
                g.speed *= 2.0; // restore speed
                g.wasSlowed = false;
            }
        });
    }
    
    for (let i = gifts.length - 1; i >= 0; i--) {
        gifts[i].y += gifts[i].speed;
        
        // Check collision with player
        if (checkCollision(player, gifts[i])) {
            const item = gifts[i];
            
            if (item.category === 'gift') {
                // Good gift caught
                const points = Math.floor(10 * multiplier);
                score += points;
                scoreDisplay.textContent = score;
                combo++;
                updateMultiplier();
                createParticles(item.x + 20, item.y + 20, '#ffd700', 10);
                playSound('catch');
            } else if (item.category === 'hazard') {
                // Hazard hit
                lives--;
                livesDisplay.textContent = lives;
                combo = 0;
                updateMultiplier();
                createParticles(item.x + 20, item.y + 20, '#ff0000', 12);
                triggerShake(15);
                playSound('hit');
                
                if (lives <= 0) {
                    endGame();
                }
            } else if (item.category === 'powerup') {
                // Power-up collected
                handlePowerUp(item.itemType);
                createParticles(item.x + 20, item.y + 20, '#00ffff', 15);
                playSound('powerup');
            }
            
            gifts.splice(i, 1);
            
            // Increase difficulty every 50 points (approximate, may vary with multipliers)
            const difficultyThreshold = Math.floor(score / 50);
            const previousThreshold = Math.floor((score - points) / 50);
            if (difficultyThreshold > previousThreshold) {
                giftSpeed += 0.3;
                spawnRate = Math.min(spawnRate + 0.002, 0.05);
            }
        }
        // Remove if off screen and lose life (only for good gifts)
        else if (gifts[i].y > canvas.height) {
            if (gifts[i].category === 'gift') {
                lives--;
                livesDisplay.textContent = lives;
                combo = 0;
                updateMultiplier();
                playSound('miss');
                
                if (lives <= 0) {
                    endGame();
                }
            }
            gifts.splice(i, 1);
        }
    }
}

// Handle power-ups
function handlePowerUp(type) {
    if (type === 'heart') {
        lives++;
        livesDisplay.textContent = lives;
    } else if (type === 'hourglass') {
        slowTimeActive = true;
        slowTimeEnd = Date.now() + 5000; // 5 seconds
        // Slow down existing gifts
        gifts.forEach(g => {
            if (!g.wasSlowed) {
                g.speed *= 0.5;
                g.wasSlowed = true;
            }
        });
    } else if (type === 'sparkle') {
        score += 50;
        scoreDisplay.textContent = score;
    }
}

// Update multiplier based on combo
function updateMultiplier() {
    if (combo >= 10) {
        multiplier = 3.0;
    } else if (combo >= 5) {
        multiplier = 2.0;
    } else if (combo >= 3) {
        multiplier = 1.5;
    } else {
        multiplier = 1.0;
    }
    multiplierDisplay.textContent = multiplier.toFixed(1);
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Move player
function movePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || touchLeft) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D'] || touchRight) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }
    
    player.x += player.dx;
    
    // Boundary detection
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// Draw background with snow
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a5f');
    gradient.addColorStop(0.5, '#2d5f8f');
    gradient.addColorStop(1, '#1e3a5f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Snow ground
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    
    // Animated snowflakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Update snowflake position
        flake.y += flake.speed;
        flake.x += Math.sin(flake.y / 30) * 0.5;
        
        // Reset snowflake if it goes off screen
        if (flake.y > canvas.height) {
            flake.y = -10;
            flake.x = Math.random() * canvas.width;
        }
    }
}

// Clear canvas
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    if (gamePaused) {
        animationId = requestAnimationFrame(gameLoop);
        return;
    }
    
    clear();
    
    ctx.save();
    applyScreenShake();
    
    drawBackground();
    drawPlayer();
    drawGifts();
    drawParticles();
    
    ctx.restore();
    
    movePlayer();
    updateGifts();
    updateParticles();
    
    const currentTime = performance.now();
    const timeSinceLastSpawn = currentTime - lastSpawnTime;
    const timeSinceLastBurst = currentTime - lastBurstTime;
    
    // Spawn burst every interval
    if (timeSinceLastBurst >= burstInterval) {
        for (let i = 0; i < 5; i++) {
            createGift();
        }
        lastBurstTime = currentTime;
    }
    
    // Only spawn if enough time has passed AND random check passes
    if (timeSinceLastSpawn >= minSpawnDelay && Math.random() < spawnRate) {
        createGift();
        lastSpawnTime = currentTime;
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    gamePaused = false;
    score = 0;
    lives = 3;
    gifts = [];
    particles = [];
    giftSpeed = 2;
    spawnRate = 0.02;
    lastSpawnTime = 0;
    lastBurstTime = performance.now();
    player.x = canvas.width / 2 - 25;
    combo = 0;
    multiplier = 1.0;
    slowTimeActive = false;
    shakeAmount = 0;
    
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    multiplierDisplay.textContent = multiplier.toFixed(1);
    
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    gameOverDiv.style.display = 'none';
    pausedOverlay.style.display = 'none';
    
    gameLoop();
}

// End game
function endGame() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    finalScoreDisplay.textContent = score;
    gameOverDiv.style.display = 'block';
    restartBtn.style.display = 'inline-block';
    pausedOverlay.style.display = 'none';
    
    playSound('gameover');
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw
drawBackground();
ctx.font = '50px Arial';
ctx.fillText('🎅', player.x, player.y + player.height);
