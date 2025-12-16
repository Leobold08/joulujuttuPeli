const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const gameOverDiv = document.getElementById('gameOver');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');

let gameRunning = false;
let score = 0;
let lives = 3;
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
let giftSpeed = 2;
let spawnRate = 0.02;

// Snowflakes array (static positions)
const snowflakes = [];
for (let i = 0; i < 50; i++) {
    snowflakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    });
}

// Controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Draw player (Santa)
function drawPlayer() {
    ctx.font = '50px Arial';
    ctx.fillText('🎅', player.x, player.y + player.height);
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
            score++;
            scoreDisplay.textContent = score;
            gifts.splice(i, 1);
            
            // Increase difficulty
            if (score % 10 === 0) {
                giftSpeed += 0.5;
                spawnRate += 0.002;
            }
        }
        // Remove if off screen and lose life
        else if (gifts[i].y > canvas.height) {
            gifts.splice(i, 1);
            lives--;
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
    
    // Snowflakes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < snowflakes.length; i++) {
        ctx.beginPath();
        ctx.arc(snowflakes[i].x, snowflakes[i].y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Clear canvas
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    clear();
    drawBackground();
    drawPlayer();
    drawGifts();
    
    movePlayer();
    updateGifts();
    
    // Spawn gifts
    if (Math.random() < spawnRate) {
        createGift();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    score = 0;
    lives = 3;
    gifts = [];
    giftSpeed = 2;
    spawnRate = 0.02;
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
