const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('ui-overlay');
const GAME_ID = '01-catching';

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
        html += `<p style="text-align:center;">Chưa có dữ liệu</p>`;
    } else {
        board.forEach((entry, idx) => {
            html += `<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid #ddd;">
                <span><b>#${idx+1}</b> ${entry.name}</span>
                <span style="color:#ff5722; font-weight:bold;">${entry.score}</span>
            </div>`;
        });
    }
    html += `</div>`;
    return html;
}

let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

const CONFIG = {
    timer: 60,
    basketSpeed: 10,
    basketSize: 80,
    itemSize: 60, // Increase item size a bit
    spawnRate: 1000,
    items: [
        { type: 'good', emoji: '🥮', sprite: 'mooncake', score: 10, prob: 40 },
        { type: 'good', emoji: '🏮', sprite: 'lantern', score: 20, prob: 25 },
        { type: 'good', emoji: '⭐', sprite: 'star', score: 50, prob: 5 },
        { type: 'bad', emoji: '💣', sprite: 'bomb', score: -30, prob: 15 },
        { type: 'bad', emoji: '🪨', sprite: 'rock', score: -20, prob: 15 },
    ]
};

let state = {
    status: 'start', // start, playing, gameover
    score: 0,
    combo: 0,
    timeLeft: CONFIG.timer,
    bestScore: localStorage.getItem('catchingBestScore') || 0,
    shakeTime: 0,
    lastTime: 0,
    spawnTimer: 0
};

let basket = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    width: CONFIG.basketSize,
    height: CONFIG.basketSize,
    targetX: GAME_WIDTH / 2
};

let items = [];
let particles = [];
let floatingTexts = [];
let stars = [];
let isDragging = false;
let sprites = {};

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
                    data[i+3] = 0;
                }
            }
            tCtx.putImageData(imgData, 0, 0);
            resolve(tempCanvas); 
        };
        img.onerror = reject;
        img.src = src;
    });
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    GAME_WIDTH = canvas.width;
    GAME_HEIGHT = canvas.height;
    basket.y = GAME_HEIGHT - 100;
}
window.addEventListener('resize', resize);
resize();

for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        speed: Math.random() * 0.05 + 0.01
    });
}

function handleInput(e) {
    if (state.status !== 'playing') return;
    let clientX;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = e.clientX;
    }
    if (clientX !== undefined) {
        basket.targetX = clientX;
    }
}

canvas.style.cursor = 'none'; // Ẩn con trỏ chuột thật để giỏ hứng làm con trỏ
canvas.addEventListener('mousedown', (e) => { handleInput(e); });
canvas.addEventListener('mousemove', (e) => { handleInput(e); });
canvas.addEventListener('touchstart', (e) => { handleInput(e); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleInput(e); }, { passive: false });

function spawnItem() {
    let rand = Math.random() * 100;
    let sum = 0;
    let selectedItem = CONFIG.items[0];
    
    for (let item of CONFIG.items) {
        sum += item.prob;
        if (rand <= sum) {
            selectedItem = item;
            break;
        }
    }
    
    items.push({
        ...selectedItem,
        x: Math.random() * (GAME_WIDTH - CONFIG.itemSize) + CONFIG.itemSize / 2,
        y: -CONFIG.itemSize,
        speed: Math.random() * 2 + 3 + (state.score / 500)
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1,
            color: color || '#FFD700'
        });
    }
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push({
        x, y, text, color, life: 1
    });
}

function update(dt) {
    if (state.status !== 'playing') return;

    if (state.shakeTime > 0) {
        state.shakeTime -= dt;
    }

    basket.x += (basket.targetX - basket.x) * 0.2;
    basket.x = Math.max(basket.width/2, Math.min(GAME_WIDTH - basket.width/2, basket.x));

    state.spawnTimer += dt;
    if (state.spawnTimer >= CONFIG.spawnRate) {
        spawnItem();
        state.spawnTimer = 0;
        if (CONFIG.spawnRate > 400) CONFIG.spawnRate -= 5;
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        let currentSpeed = item.speed * (window.MODIFIER_CHALLENGE === 'speed2x' ? 2 : 1);
        item.y += currentSpeed * (dt / 16);
        
        let dx = item.x - basket.x;
        let dy = item.y - basket.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        
        // Giảm hitbox xuống còn 60%
        if (distance < (basket.width/2 + CONFIG.itemSize/2) * 0.6) {
            if (item.type === 'good') {
                state.combo++;
                let points = item.score * (1 + Math.floor(state.combo / 5) * 0.5);
                state.score += Math.floor(points);
                createParticles(item.x, item.y, '#FFD700');
                createFloatingText(item.x, item.y, `+${points}`, '#00FF00');
            } else {
                state.combo = 0;
                state.score += item.score;
                state.shakeTime = 500;
                createParticles(item.x, item.y, '#FF0000');
                createFloatingText(item.x, item.y, `${item.score}`, '#FF0000');
            }
            items.splice(i, 1);
            updateUI();
        } else if (item.y > GAME_HEIGHT + CONFIG.itemSize) {
            if (item.type === 'good') {
                state.combo = 0;
                updateUI();
            }
            items.splice(i, 1);
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02 * (dt / 16);
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.y -= 2 * (dt / 16);
        ft.life -= 0.02 * (dt / 16);
        if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
}

function draw() {
    ctx.save();
    
    if (state.shakeTime > 0) {
        let dx = (Math.random() - 0.5) * 20;
        let dy = (Math.random() - 0.5) * 20;
        ctx.translate(dx, dy);
    }
    
    let grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#1a1a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) star.speed = -star.speed;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.alpha)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.fillStyle = '#ffeba1';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 80, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 90, 70, 10, 0, Math.PI*2);
    ctx.arc(GAME_WIDTH - 60, 90, 15, 0, Math.PI*2);
    ctx.arc(GAME_WIDTH - 70, 100, 8, 0, Math.PI*2);
    ctx.fill();

    // Basket
    if (sprites.basket) {
        ctx.drawImage(sprites.basket, basket.x - basket.width/2, basket.y - basket.height/2, basket.width, basket.height);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${basket.width}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧺', basket.x, basket.y);
    }
    
    // Items
    items.forEach(item => {
        if (item.sprite && sprites[item.sprite]) {
            ctx.drawImage(sprites[item.sprite], item.x - CONFIG.itemSize/2, item.y - CONFIG.itemSize/2, CONFIG.itemSize, CONFIG.itemSize);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${CONFIG.itemSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.emoji, item.x, item.y);
        }
    });
    
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 24px Nunito, sans-serif';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
    });

    ctx.restore();
}

function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    let dt = timestamp - state.lastTime;
    state.lastTime = timestamp;
    
    update(dt);
    draw();
    
    requestAnimationFrame(loop);
}

function startGame() {
    state.status = 'playing';
    state.score = 0;
    state.combo = 0;
    state.timeLeft = CONFIG.timer;
    state.spawnTimer = 0;
    CONFIG.spawnRate = 1000;
    items = [];
    particles = [];
    floatingTexts = [];
    basket.x = GAME_WIDTH / 2;
    basket.targetX = GAME_WIDTH / 2;
    
    uiOverlay.innerHTML = '';
    
    const hud = document.createElement('div');
    hud.className = 'game-hud';
    hud.style.position = 'absolute';
    hud.style.top = '10px';
    hud.style.right = '20px';
    hud.style.textAlign = 'right';
    hud.style.color = 'white';
    hud.style.fontFamily = 'Nunito, sans-serif';
    hud.style.fontSize = '20px';
    hud.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    hud.innerHTML = `
        <div class="score-container">
            <div>Điểm: <span id="score-display">0</span></div>
            <div id="combo-display" style="color: #FFD700; font-size: 0.8em; min-height: 1.2em;"></div>
        </div>
        <div class="timer-container" style="margin-top: 10px;">
            Thời gian: <span id="time-display">${CONFIG.timer}</span>s
        </div>
    `;
    uiOverlay.appendChild(hud);

    const backBtn = document.createElement('button');
    backBtn.className = 'back-button btn';
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
    backBtn.onclick = () => { if(window.parent !== window) { window.parent.postMessage('close-game', '*'); } else { (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })() } };
    uiOverlay.appendChild(backBtn);
    
    let timerInterval = setInterval(() => {
        if (state.status !== 'playing') {
            clearInterval(timerInterval);
            return;
        }
        state.timeLeft--;
        updateUI();
        
        if (state.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateUI() {
    const scoreEl = document.getElementById('score-display');
    const timeEl = document.getElementById('time-display');
    const comboEl = document.getElementById('combo-display');
    
    if (scoreEl) scoreEl.innerText = state.score;
    if (timeEl) timeEl.innerText = state.timeLeft;
    if (comboEl) {
        if (state.combo > 1) {
            comboEl.innerText = `Combo x${state.combo}`;
        } else {
            comboEl.innerText = '';
        }
    }
}

function endGame() {
    state.status = 'gameover';
    
    if (state.score > state.bestScore) {
        state.bestScore = state.score;
        localStorage.setItem('catchingBestScore', state.bestScore);
    }
    
    uiOverlay.innerHTML = '';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const menu = document.createElement('div');
    menu.className = 'modal-content';
    menu.style.background = 'white';
    menu.style.padding = '30px';
    menu.style.borderRadius = '15px';
    menu.style.textAlign = 'center';
    menu.style.fontFamily = 'Nunito, sans-serif';
    menu.style.color = '#333'; // FIX: Explicitly set dark color for text
    
    const snapshotHtml = window.playerSnapshot ? `<p style="margin: 5px 0; font-size: 0.9em; color: #FF6B35;">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="width: 100%; max-width: 400px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ff5722;" />` : '';
    
    menu.innerHTML = `
        <h2 style="font-size: 2em; margin-bottom: 10px; color: #ff5722; margin-top:0;">Hết Giờ!</h2>
        <p style="font-size: 1.5em; margin: 10px 0;">Điểm của bạn: <strong>${state.score}</strong></p>
        ${snapshotHtml}
        
        <div id="leaderboard-input-section">
            <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2em; border-radius: 8px; border: 1px solid #ccc; width: 80%; margin-bottom: 15px;">
            <button id="save-score-btn" class="btn primary-btn" style="padding: 10px 20px; font-size: 1.2em; border-radius: 8px; border: none; cursor: pointer; background: #ff5722; color: white; display: block; width: 100%;">Lưu Điểm</button>
        </div>
        <div id="leaderboard-view-section" style="display:none;">
            <h3 style="margin-bottom: 5px;">Bảng Xếp Hạng</h3>
            <div id="leaderboard-list"></div>
            <button id="home-btn" class="btn secondary-btn" style="padding: 10px 20px; font-size: 1.2em; border-radius: 8px; border: none; cursor: pointer; background: #333; color: white; width: 100%; margin-top: 10px;">Về Trang Chủ</button>
        </div>
    `;
    
    overlay.appendChild(menu);
    uiOverlay.appendChild(overlay);
    
    document.getElementById('save-score-btn').onclick = () => {
        const name = document.getElementById('player-name').value.trim();
        saveScore(name, state.score);
        
        document.getElementById('leaderboard-input-section').style.display = 'none';
        document.getElementById('leaderboard-list').innerHTML = showLeaderboardUI();
        document.getElementById('leaderboard-view-section').style.display = 'block';
    };
    
    document.getElementById('home-btn')?.addEventListener('click', () => { if(window.parent !== window) { window.parent.postMessage('close-game', '*'); } else { (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })() } };);
}

function showStartScreen() {
    uiOverlay.innerHTML = '';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.7)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const menu = document.createElement('div');
    menu.className = 'modal-content';
    menu.style.background = 'white';
    menu.style.padding = '40px';
    menu.style.borderRadius = '15px';
    menu.style.textAlign = 'center';
    menu.style.fontFamily = 'Nunito, sans-serif';
    menu.style.color = '#333'; // FIX: Explicitly set dark color for text
    
    menu.innerHTML = `
        <h1 style="font-size: 2.5em; margin-bottom: 10px; color: #ff5722; margin-top:0;">Hứng Bánh</h1>
        <div style="font-size: 4em; margin-bottom: 20px;">🥮 🧺 🏮</div>
        <p style="font-size: 1.2em; margin-bottom: 30px;">Hứng bánh Trung Thu và lồng đèn,<br/>tránh bom và đá!</p>
        <button id="start-btn" class="btn primary-btn" style="padding: 15px 40px; font-size: 1.5em; border-radius: 12px; border: none; cursor: pointer; background: #ff5722; color: white; font-weight: bold; margin-bottom: 15px; display: block; width: 100%;">Bắt Đầu</button>
        <button id="back-btn-start" class="btn secondary-btn" style="padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; background: #333; color: white; width: 100%;">Trang Chủ</button>
    `;
    
    overlay.appendChild(menu);
    uiOverlay.appendChild(overlay);
    
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('back-btn-start').onclick = () => { if(window.parent !== window) { window.parent.postMessage('close-game', '*'); } else { (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })() } };
}

async function initGame() {
    try {
        sprites.basket = await loadSprite('../../assets/basket.jpg');
        sprites.mooncake = await loadSprite('../../assets/mooncake.jpg');
        sprites.lantern = await loadSprite('../../assets/lantern.jpg');
        sprites.star = await loadSprite('../../assets/star.jpg');
        sprites.bomb = await loadSprite('../../assets/bomb.jpg');
        sprites.rock = await loadSprite('../../assets/rock.jpg');
    } catch(e) {
        console.error('Lỗi tải ảnh:', e);
    }
    
    showStartScreen();
    requestAnimationFrame(loop);
}

initGame();
