const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');
const multiplierDisplay = document.getElementById('multiplier');
const pausedDiv = document.getElementById('paused');
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
let screenShake = 0;

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
const goodItemTypes = ['🎁', '🎀', '⭐', '🔔', '🎄'];
const badItemTypes = ['🪨']; // coal as bad item
const powerUpTypes = [
    { emoji: '❤️', type: 'heart' },
    { emoji: '⏳', type: 'hourglass' },
    { emoji: '✨', type: 'sparkle' }
];
let giftSpeed = 2;
let spawnRate = 0.02;
let lastSpawnTime = 0;
let minSpawnDelay = 500;
let difficultyTimer = 0;
let burstMode = false;
let burstEnd = 0;

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

// Controls
const keys = {};

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

// Mobile touch controls
let touchLeft = false;
let touchRight = false;

btnLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchLeft = true;
});

btnLeft.addEventListener('touchend', (e) => {
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

// Canvas touch controls - tap left or right half
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const canvasMiddle = rect.width / 2;
    
    if (x < canvasMiddle) {
        touchLeft = true;
    } else {
        touchRight = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchLeft = false;
    touchRight = false;
});

// Sound stub
function playSound(name) {
    // Stub for sound effects
    // Could be implemented with Web Audio API or HTML5 Audio
    console.log(`Sound: ${name}`);
}

// Pause toggle
function togglePause() {
    gamePaused = !gamePaused;
    pausedDiv.style.display = gamePaused ? 'block' : 'none';
}

// Draw player (Santa)
function drawPlayer() {
    ctx.font = '50px Arial';
    ctx.fillText('🎅', player.x, player.y + player.height);
}

// Create gift
function createGift() {
    const rand = Math.random();
    let item;
    
    // 70% good items, 15% bad items, 15% power-ups
    if (rand < 0.7) {
        item = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            type: goodItemTypes[Math.floor(Math.random() * goodItemTypes.length)],
            speed: giftSpeed + Math.random() * 2,
            category: 'good'
        };
    } else if (rand < 0.85) {
        item = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            type: badItemTypes[Math.floor(Math.random() * badItemTypes.length)],
            speed: giftSpeed + Math.random() * 2,
            category: 'bad'
        };
    } else {
        const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        item = {
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            type: powerUp.emoji,
            speed: giftSpeed + Math.random() * 1,
            category: 'powerup',
            powerType: powerUp.type
        };
    }
    
    gifts.push(item);
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
    const currentTime = performance.now();
    const speedMultiplier = (slowTimeActive && currentTime < slowTimeEnd) ? 0.5 : 1.0;
    
    for (let i = gifts.length - 1; i >= 0; i--) {
        gifts[i].y += gifts[i].speed * speedMultiplier;
        
        // Check collision with player
        if (checkCollision(player, gifts[i])) {
            const item = gifts[i];
            
            if (item.category === 'good') {
                // Good item - increase score and combo
                combo++;
                multiplier = Math.min(1.0 + (combo * 0.1), 3.0);
                score += Math.floor(1 * multiplier);
                scoreDisplay.textContent = score;
                multiplierDisplay.textContent = multiplier.toFixed(1);
                
                createParticles(item.x + item.width / 2, item.y + item.height / 2, '#ffd700');
                playSound('collect');
                
            } else if (item.category === 'bad') {
                // Bad item - take damage
                lives--;
                livesDisplay.textContent = lives;
                combo = 0;
                multiplier = 1.0;
                multiplierDisplay.textContent = multiplier.toFixed(1);
                
                screenShake = 10;
                createParticles(item.x + item.width / 2, item.y + item.height / 2, '#ff0000');
                playSound('hit');
                
                if (lives <= 0) {
                    endGame();
                }
                
            } else if (item.category === 'powerup') {
                // Power-up
                if (item.powerType === 'heart') {
                    lives = Math.min(lives + 1, 5);
                    livesDisplay.textContent = lives;
                    playSound('powerup');
                } else if (item.powerType === 'hourglass') {
                    slowTimeActive = true;
                    slowTimeEnd = currentTime + 5000; // 5 seconds
                    playSound('powerup');
                } else if (item.powerType === 'sparkle') {
                    score += Math.floor(5 * multiplier);
                    scoreDisplay.textContent = score;
                    playSound('powerup');
                }
                
                createParticles(item.x + item.width / 2, item.y + item.height / 2, '#00ffff');
            }
            
            gifts.splice(i, 1);
            
            // Increase difficulty
            if (score % 10 === 0 && score > 0) {
                giftSpeed += 0.3;
                spawnRate = Math.min(spawnRate + 0.002, 0.05);
            }
        }
        // Remove if off screen
        else if (gifts[i].y > canvas.height) {
            // Lose combo if good item falls
            if (gifts[i].category === 'good') {
                combo = 0;
                multiplier = 1.0;
                multiplierDisplay.textContent = multiplier.toFixed(1);
            }
            gifts.splice(i, 1);
        }
    }
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

// Create particles
function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: color
        });
    }
}

// Update and draw particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
            ctx.globalAlpha = 1.0;
        }
    }
}

// Update animated snow
function updateSnow() {
    for (let i = 0; i < snowflakes.length; i++) {
        snowflakes[i].y += snowflakes[i].speed;
        
        if (snowflakes[i].y > canvas.height) {
            snowflakes[i].y = -10;
            snowflakes[i].x = Math.random() * canvas.width;
        }
    }
}

// Draw background with snow
function drawBackground() {
    // Apply screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake--;
    }
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
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
        ctx.beginPath();
        ctx.arc(snowflakes[i].x, snowflakes[i].y, snowflakes[i].radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
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
    drawBackground();
    updateSnow();
    drawPlayer();
    drawGifts();
    updateParticles();
    
    movePlayer();
    updateGifts();
    
    // Difficulty ramp with occasional bursts
    difficultyTimer++;
    const currentTime = performance.now();
    
    // Occasional burst mode
    if (difficultyTimer % 600 === 0) { // Every ~10 seconds at 60fps
        burstMode = true;
        burstEnd = currentTime + 3000; // 3 second burst
    }
    
    if (burstMode && currentTime > burstEnd) {
        burstMode = false;
    }
    
    // Spawn gifts with timing control
    const timeSinceLastSpawn = currentTime - lastSpawnTime;
    const burstMultiplier = burstMode ? 3 : 1;
    
    // Only spawn if enough time has passed AND random check passes
    if (timeSinceLastSpawn >= minSpawnDelay && Math.random() < spawnRate * burstMultiplier) {
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
    combo = 0;
    multiplier = 1.0;
    gifts = [];
    particles = [];
    giftSpeed = 2;
    spawnRate = 0.02;
    lastSpawnTime = 0;
    difficultyTimer = 0;
    burstMode = false;
    slowTimeActive = false;
    screenShake = 0;
    player.x = canvas.width / 2 - 25;
    
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    multiplierDisplay.textContent = multiplier.toFixed(1);
    
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    gameOverDiv.style.display = 'none';
    pausedDiv.style.display = 'none';
    
    gameLoop();
}

// End game
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    finalScoreDisplay.textContent = score;
    gameOverDiv.style.display = 'block';
    restartBtn.style.display = 'inline-block';
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Initial draw
drawBackground();
ctx.font = '50px Arial';
ctx.fillText('🎅', player.x, player.y + player.height);
