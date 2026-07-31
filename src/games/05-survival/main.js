const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('ui-overlay');
const GAME_ID = '05-survival';

function getLeaderboard() {
    return JSON.parse(localStorage.getItem('leaderboard_' + GAME_ID) || '[]');
}
function saveScore(name, score) {
    let board = getLeaderboard();
    board.push({ name: name || 'Ẩn danh', score: score, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaderboard_' + GAME_ID, JSON.stringify(board));
}
function showLeaderboardUI() {
    const board = getLeaderboard();
    let html = `<div style="max-height: 200px; overflow-y: auto; margin: 15px 0; text-align: left; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">`;
    if (board.length === 0) {
        html += `<p style="text-align:center; color:#333;">Chưa có dữ liệu</p>`;
    } else {
        board.forEach((entry, idx) => {
            html += `<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid #ddd; color:#333;">
                <span><b>#${idx+1}</b> ${entry.name}</span>
                <span style="color:#10B981; font-weight:bold;">${entry.score}</span>
            </div>`;
        });
    }
    html += `</div>`;
    return html;
}
const joystickContainer = document.getElementById('virtual-joystick-container');
const joystickStick = document.getElementById('virtual-joystick-stick');

let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

// Configs
const CONFIG = {
    playerSpeed: 300, // pixels per second
    playerSize: 80,
    snakeSpeedBase: 120,
    snakeSize: 80,
    cakeSize: 60,
    spawnRateBase: 1500, // ms
    cakeSpawnRate: 3000,
};

let state = {
    status: 'start', // start, playing, gameover
    score: 0,
    timeAlive: 0,
    bestScore: localStorage.getItem('survivalBestScore') || 0,
    lastTime: 0,
    snakeTimer: 0,
    cakeTimer: 0,
    currentSpawnRate: CONFIG.spawnRateBase
};

let player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    vx: 0,
    vy: 0
};

let keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

let snakes = [];
let cakes = [];
let particles = [];
let stars = [];
let sprites = {};

// Load and Chroma Key Sprites
function loadSprite(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);
            
            const imgData = tCtx.getImageData(0, 0, img.width, img.height);
            const data = imgData.data;
            const bgR = data[0], bgG = data[1], bgB = data[2];
            const tolerance = 70; 
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const dist = Math.sqrt((r-bgR)*(r-bgR) + (g-bgG)*(g-bgG) + (b-bgB)*(b-bgB));
                if (dist < tolerance) {
                    data[i+3] = 0; // Set alpha to 0 for background
                }
            }
            tCtx.putImageData(imgData, 0, 0);
            resolve(tempCanvas); 
        };
        img.onerror = reject;
        img.src = src;
    });
}

// Joystick state
let joystick = { active: false, dx: 0, dy: 0, originX: 0, originY: 0 };
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) {
    joystickContainer.style.display = 'block';
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
}
window.addEventListener('resize', resize);
resize();

// Init stars background
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        speed: Math.random() * 0.05 + 0.01
    });
}

// Controls logic
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

// Joystick events
if (isTouchDevice) {
    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const rect = joystickContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        joystick.active = true;
        joystick.originX = centerX;
        joystick.originY = centerY;
        updateJoystick(touch.clientX, touch.clientY);
    };
    
    const handleTouchMove = (e) => {
        if (!joystick.active) return;
        e.preventDefault();
        const touch = e.changedTouches[0];
        updateJoystick(touch.clientX, touch.clientY);
    };
    
    const handleTouchEnd = (e) => {
        e.preventDefault();
        joystick.active = false;
        joystick.dx = 0;
        joystick.dy = 0;
        joystickStick.style.transform = `translate(-50%, -50%)`;
    };
    
    joystickContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    joystickContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    joystickContainer.addEventListener('touchend', handleTouchEnd);
    joystickContainer.addEventListener('touchcancel', handleTouchEnd);
}

function updateJoystick(clientX, clientY) {
    let dx = clientX - joystick.originX;
    let dy = clientY - joystick.originY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    const maxDist = 45; // radius of base minus stick
    
    if (distance > maxDist) {
        dx = (dx / distance) * maxDist;
        dy = (dy / distance) * maxDist;
    }
    
    joystickStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    
    // Normalize for movement (-1 to 1)
    joystick.dx = dx / maxDist;
    joystick.dy = dy / maxDist;
}

function spawnSnake() {
    // Spawn from one of 4 edges
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * GAME_WIDTH; y = -50; } // top
    else if (edge === 1) { x = GAME_WIDTH + 50; y = Math.random() * GAME_HEIGHT; } // right
    else if (edge === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + 50; } // bottom
    else { x = -50; y = Math.random() * GAME_HEIGHT; } // left
    
    let speedMult = window.MODIFIER_CHALLENGE === 'speed2x' ? 2 : 1;
    let speed = (CONFIG.snakeSpeedBase + (state.timeAlive * 1.5)) * speedMult;
    
    snakes.push({ x, y, speed });
}

function spawnCake() {
    cakes.push({
        x: 50 + Math.random() * (GAME_WIDTH - 100),
        y: 50 + Math.random() * (GAME_HEIGHT - 100),
        life: 10 // disappears after 10s
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 400,
            vy: (Math.random() - 0.5) * 400,
            life: 1,
            color: color || '#FFD700'
        });
    }
}

function update(dt) {
    if (state.status !== 'playing') return;
    
    state.timeAlive += dt;
    state.score += dt * 10; // 10 points per second alive
    
    // Player Movement
    let moveX = 0;
    let moveY = 0;
    
    if (keys.a || keys.ArrowLeft) moveX -= 1;
    if (keys.d || keys.ArrowRight) moveX += 1;
    if (keys.w || keys.ArrowUp) moveY -= 1;
    if (keys.s || keys.ArrowDown) moveY += 1;
    
    // Apply joystick
    if (joystick.active) {
        moveX = joystick.dx;
        moveY = joystick.dy;
    }
    
    // Normalize diagonal keyboard movement
    if (moveX !== 0 && moveY !== 0 && !joystick.active) {
        const length = Math.sqrt(moveX*moveX + moveY*moveY);
        moveX /= length;
        moveY /= length;
    }
    
    player.x += moveX * CONFIG.playerSpeed * dt;
    player.y += moveY * CONFIG.playerSpeed * dt;
    
    // Bounds
    player.x = Math.max(CONFIG.playerSize/2, Math.min(GAME_WIDTH - CONFIG.playerSize/2, player.x));
    player.y = Math.max(CONFIG.playerSize/2, Math.min(GAME_HEIGHT - CONFIG.playerSize/2, player.y));
    
    // Spawners
    state.snakeTimer += dt * 1000;
    state.currentSpawnRate = Math.max(400, CONFIG.spawnRateBase - (state.timeAlive * 15)); // gets faster
    
    if (state.snakeTimer >= state.currentSpawnRate) {
        spawnSnake();
        state.snakeTimer = 0;
    }
    
    state.cakeTimer += dt * 1000;
    if (state.cakeTimer >= CONFIG.cakeSpawnRate) {
        spawnCake();
        state.cakeTimer = 0;
    }
    
    // Update Cakes
    for (let i = cakes.length - 1; i >= 0; i--) {
        let c = cakes[i];
        c.life -= dt;
        
        let dx = c.x - player.x;
        let dy = c.y - player.y;
        if (Math.sqrt(dx*dx + dy*dy) < (CONFIG.playerSize/2 + CONFIG.cakeSize/2) * 0.6) {
            state.score += 50; // +50 for cake
            createParticles(c.x, c.y, '#FFD700');
            cakes.splice(i, 1);
            continue;
        }
        
        if (c.life <= 0) {
            cakes.splice(i, 1);
        }
    }
    
    // Update Snakes
    for (let i = snakes.length - 1; i >= 0; i--) {
        let s = snakes[i];
        
        // Move towards player
        let dx = player.x - s.x;
        let dy = player.y - s.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            s.x += (dx / dist) * s.speed * dt;
            s.y += (dy / dist) * s.speed * dt;
        }
        
        // Collision
        if (dist < (CONFIG.playerSize/2 + CONFIG.snakeSize/2) * 0.6) { // smaller hitbox
            createParticles(player.x, player.y, '#EF4444');
            endGame();
            break;
        }
    }
    
    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    updateUI();
}

function draw() {
    // Background
    let grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a1a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Stars
    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Cakes
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    cakes.forEach(c => {
        ctx.globalAlpha = Math.min(1, c.life);
        if (sprites.mooncake) {
            ctx.drawImage(sprites.mooncake, c.x - CONFIG.cakeSize/2, c.y - CONFIG.cakeSize/2, CONFIG.cakeSize, CONFIG.cakeSize);
        } else {
            ctx.font = `${CONFIG.cakeSize}px sans-serif`;
            ctx.fillText('🥮', c.x, c.y);
        }
        ctx.globalAlpha = 1;
    });
    
    // Snakes
    snakes.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        // Rotate snake towards player
        let angle = Math.atan2(player.y - s.y, player.x - s.x);
        ctx.rotate(angle);
        if (sprites.snake) {
            // Sprites face right usually? We might need to offset angle if the sprite doesn't face right by default, but it's okay.
            ctx.drawImage(sprites.snake, -CONFIG.snakeSize/2, -CONFIG.snakeSize/2, CONFIG.snakeSize, CONFIG.snakeSize);
        } else {
            ctx.font = `${CONFIG.snakeSize}px sans-serif`;
            ctx.fillText('🐍', 0, 0); 
        }
        ctx.restore();
    });
    
    // Player
    if (state.status !== 'gameover') {
        if (sprites.bunny) {
            ctx.drawImage(sprites.bunny, player.x - CONFIG.playerSize/2, player.y - CONFIG.playerSize/2, CONFIG.playerSize, CONFIG.playerSize);
        } else {
            ctx.font = `${CONFIG.playerSize}px sans-serif`;
            ctx.fillText('🐰', player.x, player.y);
        }
    }
    
    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    let dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;
    
    // cap dt to avoid huge jumps
    if (dt > 0.1) dt = 0.1;
    
    update(dt);
    draw();
    
    requestAnimationFrame(loop);
}

function updateUI() {
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) {
        scoreEl.innerText = Math.floor(state.score);
    }
}

function startGame() {
    state.status = 'playing';
    state.score = 0;
    state.timeAlive = 0;
    state.snakeTimer = 0;
    state.cakeTimer = 0;
    state.currentSpawnRate = CONFIG.spawnRateBase;
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    snakes = [];
    cakes = [];
    particles = [];
    
    uiOverlay.innerHTML = '';
    
    const hud = document.createElement('div');
    hud.style.position = 'absolute';
    hud.style.top = '10px';
    hud.style.right = '20px';
    hud.style.textAlign = 'right';
    hud.style.color = 'white';
    hud.style.fontFamily = 'Nunito, sans-serif';
    hud.style.fontSize = '24px';
    hud.style.fontWeight = 'bold';
    hud.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    hud.innerHTML = `<div>Điểm: <span id="score-display">0</span></div>`;
    uiOverlay.appendChild(hud);

    const backBtn = document.createElement('button');
    backBtn.className = 'btn';
    backBtn.style.position = 'absolute';
    backBtn.style.top = '10px';
    backBtn.style.left = '10px';
    backBtn.style.padding = '8px 16px';
    backBtn.style.borderRadius = '20px';
    backBtn.style.border = 'none';
    backBtn.style.background = 'rgba(255,255,255,0.2)';
    backBtn.style.color = 'white';
    backBtn.style.cursor = 'pointer';
    backBtn.style.backdropFilter = 'blur(4px)';
    backBtn.innerText = 'Trở Về';
    backBtn.onclick = () => window.location.href = import.meta.env.BASE_URL;
    uiOverlay.appendChild(backBtn);
}

function endGame() {
    state.status = 'gameover';
    const finalScore = Math.floor(state.score);
    
    if (finalScore > state.bestScore) {
        state.bestScore = finalScore;
        localStorage.setItem('survivalBestScore', state.bestScore);
    }
    
    uiOverlay.innerHTML = '';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const menu = document.createElement('div');
    menu.style.background = 'white';
    menu.style.padding = '30px';
    menu.style.borderRadius = '15px';
    menu.style.textAlign = 'center';
    menu.style.fontFamily = 'Nunito, sans-serif';
    menu.style.color = '#333';
    
    const snapshotHtml = window.playerSnapshot ? `<p style="margin: 5px 0; font-size: 0.9em; color: #10B981;">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="width: 100%; max-width: 400px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #10B981;" />` : '';
    
    menu.innerHTML = `
        <h2 style="font-size: 2em; margin-bottom: 20px; color: #ef4444; margin-top:0;">Bạn Đã Bị Cắn!</h2>
        <p style="font-size: 1.5em; margin: 10px 0;">Điểm sinh tồn: <strong>${finalScore}</strong></p>
        ${snapshotHtml}
        
        <div id="leaderboard-input-section" style="margin-top: 20px;">
            <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2em; border-radius: 8px; border: 1px solid #ccc; width: 80%; margin-bottom: 15px; text-align: center; color: #333;">
            <button id="save-score-btn" class="btn" style="padding: 10px 20px; font-size: 1.2em; border-radius: 8px; border: none; cursor: pointer; background: #10B981; color: white; width: 100%;">Lưu Điểm</button>
        </div>
        
        <div id="leaderboard-view-section" style="display:none; margin-top: 20px;">
            <h3 style="margin-bottom: 5px; color: #333;">Bảng Xếp Hạng</h3>
            <div id="leaderboard-list"></div>
            <button id="home-btn" class="btn" style="padding: 10px 20px; font-size: 1.2em; border-radius: 8px; border: none; cursor: pointer; background: #333; color: white; width: 100%; margin-top: 10px;">Về Trang Chủ</button>
        </div>
    `;
    
    overlay.appendChild(menu);
    uiOverlay.appendChild(overlay);
    
    document.getElementById('save-score-btn').onclick = () => {
        const name = document.getElementById('player-name').value.trim();
        saveScore(name, finalScore);
        
        document.getElementById('leaderboard-input-section').style.display = 'none';
        document.getElementById('leaderboard-list').innerHTML = showLeaderboardUI();
        document.getElementById('leaderboard-view-section').style.display = 'block';
    };
    
    document.getElementById('home-btn')?.addEventListener('click', () => { window.location.href = import.meta.env.BASE_URL; });
}

function showStartScreen() {
    uiOverlay.innerHTML = '';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const menu = document.createElement('div');
    menu.style.background = 'white';
    menu.style.padding = '40px';
    menu.style.borderRadius = '15px';
    menu.style.textAlign = 'center';
    menu.style.fontFamily = 'Nunito, sans-serif';
    menu.style.color = '#333';
    
    menu.innerHTML = `
        <h1 style="font-size: 2.5em; margin-bottom: 10px; color: #10B981; margin-top:0;">Đại Chiến Rắn</h1>
        <div style="font-size: 4em; margin-bottom: 20px;">🐰 🐍 🥮</div>
        <p style="font-size: 1.2em; margin-bottom: 10px;">Dùng WASD hoặc Joystick để di chuyển!</p>
        <p style="font-size: 1em; margin-bottom: 30px; color: #666;">Né rắn cắn và nhặt bánh để tăng điểm.</p>
        <button id="start-btn" class="btn" style="padding: 15px 40px; font-size: 1.5em; border-radius: 12px; border: none; cursor: pointer; background: #10B981; color: white; font-weight: bold; margin-bottom: 15px; display: block; width: 100%;">Vào Chơi</button>
        <button id="back-btn-start" class="btn" style="padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; background: #333; color: white; width: 100%;">Trang Chủ</button>
    `;
    
    overlay.appendChild(menu);
    uiOverlay.appendChild(overlay);
    
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('back-btn-start').onclick = () => window.location.href = import.meta.env.BASE_URL;
}

async function initGame() {
    try {
        sprites.bunny = await loadSprite('../../assets/bunny.jpg');
        sprites.snake = await loadSprite('../../assets/snake.jpg');
        sprites.mooncake = await loadSprite('../../assets/mooncake.jpg');
    } catch(e) {
        console.error('Lỗi khi tải assets:', e);
    }
    
    showStartScreen();
    requestAnimationFrame(loop);
}

initGame();
