const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScore');
const maxComboDisplay = document.getElementById('maxComboDisplay');
const maxComboSpan = document.getElementById('maxCombo');
const newHighScoreDisplay = document.getElementById('newHighScore');

let gameRunning = false;
let gamePaused = false;
let score = 0;
let lives = 3;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let combo = 0;
let maxCombo = 0;
let level = 1;
let animationId;

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
let giftSpeed = 1.5; // Reduced from 2 for better playability
let spawnRate = 0.015; // Reduced from 0.02
const MAX_SPAWN_RATE = 0.03; // Maximum spawn rate cap
let lastSpawnTime = 0;
let minSpawnDelay = 800; // Increased from 500 for better spacing

// Particles for visual effects
let particles = [];

// Score popups
let scorePopups = [];

// Snowflakes array (animated)
const snowflakes = [];
for (let i = 0; i < 100; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
        drift: Math.random() * 0.5 - 0.25
    });
}

// Controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Pause functionality
    if ((e.key === 'p' || e.key === 'P' || e.key === ' ') && gameRunning) {
        e.preventDefault();
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Draw player (Santa)
function drawPlayer() {
    ctx.font = '50px Arial';
    ctx.fillText('🎅', player.x, player.y + player.height);
}

// Create particles
function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: `hsl(${Math.random() * 60 + 330}, 100%, 50%)`
        });
    }
}

// Update and draw particles
function updateParticles() {
    ctx.save();
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();
}

// Create score popup
function createScorePopup(x, y, points) {
    scorePopups.push({
        x: x,
        y: y,
        points: points,
        life: 1.0
    });
}

// Update and draw score popups
function updateScorePopups() {
    ctx.save();
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y -= 1;
        popup.life -= 0.015;
        
        if (popup.life <= 0) {
            scorePopups.splice(i, 1);
        } else {
            ctx.globalAlpha = popup.life;
            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(`+${popup.points}`, popup.x, popup.y);
            ctx.fillText(`+${popup.points}`, popup.x, popup.y);
        }
    }
    ctx.restore();
}

// Toggle pause
function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        // Draw pause screen immediately
        drawHUD();
    } else {
        // Resume game loop
        gameLoop();
    }
}

// Create gift
function createGift() {
    const gift = {
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        type: giftTypes[Math.floor(Math.random() * giftTypes.length)],
        speed: giftSpeed + Math.random() * 2
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
    for (let i = gifts.length - 1; i >= 0; i--) {
        gifts[i].y += gifts[i].speed;
        
        // Check collision with player
        if (checkCollision(player, gifts[i])) {
            // Calculate points (combo bonus)
            let points = 1 + Math.floor(combo / 5);
            score += points;
            combo++;
            if (combo > maxCombo) maxCombo = combo;
            
            scoreDisplay.textContent = score;
            
            // Create visual feedback
            createParticles(gifts[i].x + 20, gifts[i].y + 20);
            createScorePopup(gifts[i].x + 20, gifts[i].y, points);
            
            gifts.splice(i, 1);
            
            // Increase difficulty more gradually
            if (score % 15 === 0 && score > 0) {
                giftSpeed += 0.3; // Reduced from 0.5
                spawnRate = Math.min(spawnRate + 0.001, MAX_SPAWN_RATE);
                level = Math.floor(score / 15) + 1;
            }
        }
        // Remove if off screen and lose life
        else if (gifts[i].y > canvas.height) {
            gifts.splice(i, 1);
            lives--;
            combo = 0; // Reset combo on miss
            livesDisplay.textContent = lives;
            
            if (lives <= 0) {
                endGame();
            }
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
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
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
        
        // Update position
        flake.y += flake.speed;
        flake.x += flake.drift;
        
        // Wrap around
        if (flake.y > canvas.height) {
            flake.y = -10;
            flake.x = Math.random() * canvas.width;
        }
        if (flake.x > canvas.width) flake.x = 0;
        if (flake.x < 0) flake.x = canvas.width;
        
        // Draw snowflake
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw HUD (combo, level, pause indicator)
function drawHUD() {
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'left';
    
    // Combo display
    if (combo > 0) {
        const comboText = `Combo: ${combo}x`;
        ctx.strokeText(comboText, 10, 30);
        ctx.fillText(comboText, 10, 30);
    }
    
    // Level display
    const levelText = `Level: ${level}`;
    ctx.strokeText(levelText, 10, 55);
    ctx.fillText(levelText, 10, 55);
    
    // Pause indicator
    if (gamePaused) {
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const pauseText = 'PAUSED';
        ctx.strokeText(pauseText, canvas.width / 2, canvas.height / 2);
        ctx.fillText(pauseText, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        const resumeText = 'Press SPACE or P to resume';
        ctx.strokeText(resumeText, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText(resumeText, canvas.width / 2, canvas.height / 2 + 40);
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
    if (gamePaused) return;
    
    clear();
    drawBackground();
    drawPlayer();
    drawGifts();
    updateParticles();
    updateScorePopups();
    drawHUD();
    
    movePlayer();
    updateGifts();
    
    // Spawn gifts with timing control
    const currentTime = performance.now();
    const timeSinceLastSpawn = currentTime - lastSpawnTime;
    
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
    combo = 0;
    maxCombo = 0;
    level = 1;
    gifts = [];
    particles = [];
    scorePopups = [];
    giftSpeed = 1.5;
    spawnRate = 0.015;
    lastSpawnTime = 0;
    player.x = canvas.width / 2 - 25;
    
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    gameOverDiv.style.display = 'none';
    
    gameLoop();
}

// End game
function endGame() {
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Update high score
    const isNewHighScore = score > highScore;
    if (isNewHighScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
        newHighScoreDisplay.style.display = 'block';
    } else {
        newHighScoreDisplay.style.display = 'none';
    }
    
    // Display stats
    finalScoreDisplay.textContent = score;
    if (maxCombo > 1) {
        maxComboDisplay.style.display = 'block';
        maxComboSpan.textContent = maxCombo;
    } else {
        maxComboDisplay.style.display = 'none';
    }
    
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

// Display high score on load
highScoreDisplay.textContent = highScore;
