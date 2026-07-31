const GAME_ID = '02-whack';

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
            html += `<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid #ddd; color: #333;">
                <span><b>#${idx+1}</b> ${entry.name}</span>
                <span style="color:var(--color-primary); font-weight:bold;">${entry.score}</span>
            </div>`;
        });
    }
    html += `</div>`;
    return html;
}

// Configuration
const CONFIG = {
  GAME_DURATION: 45, // seconds
  GRID_SIZE: 9,
  INITIAL_MOLE_TIME: 1200,
  MIN_MOLE_TIME: 500,
  SPAWN_INTERVAL_MAX: 1000,
  SPAWN_INTERVAL_MIN: 400,
  TYPES: {
    REGULAR: { emoji: '🐭', sprite: 'mouse', score: 10, prob: 0.75, class: 'regular' },
    GOLDEN: { emoji: '✨', realEmoji: '🐭', sprite: 'mouse_gold', score: 50, prob: 0.10, class: 'golden' }, // golden class handles glow
    BUNNY: { emoji: '🐰', sprite: 'bunny', score: -30, prob: 0.15, class: 'bunny' }
  }
};

// Canvas Particle System
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  emit(x, y, color = '#ffcc00', count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color,
        size: Math.random() * 4 + 2
      });
    }
  }
  
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life -= dt * 0.001 * 1.5;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  draw() {
    for (let p of this.particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }
}

// Background Night Sky
class MoonBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.init();
  }
  
  init() {
    this.resize();
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2,
        blink: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.05 + 0.01
      });
    }
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  draw() {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Moon
    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 80, 80, 40, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#0f172a';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width - 90, 70, 40, 0, Math.PI * 2);
    this.ctx.fill();

    // Stars
    this.ctx.fillStyle = '#ffffff';
    for (let s of this.stars) {
      s.blink += s.speed;
      const alpha = Math.abs(Math.sin(s.blink));
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }
}

class Game {
  constructor() {
    this.score = 0;
    this.misses = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.isPlaying = false;
    this.holes = [];
    this.moles = [];
    
    this.lastTime = 0;
    this.spawnTimer = 0;
    this.currentSpawnInterval = CONFIG.SPAWN_INTERVAL_MAX;
    
    this.ui = document.getElementById('ui-overlay');
    this.grid = document.getElementById('game-grid');
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');
    
    this.bg = new MoonBackground(this.canvas);
    this.particles = new ParticleSystem(this.canvas);
    
    window.addEventListener('resize', () => {
      this.bg.resize();
      this.particles.resize();
    });
    
    this.setupUI();
    this.setupGrid();
    
    // Game loop for canvas
    requestAnimationFrame((t) => this.loop(t));
  }
  
  getBestScore() {
    return parseInt(localStorage.getItem(`best_${GAME_ID}`) || '0');
  }
  
  setBestScore(s) {
    localStorage.setItem(`best_${GAME_ID}`, s);
  }
  
  setupUI() {
    // Top Bar HUD
    this.hud = document.createElement('div');
    this.hud.style.position = 'absolute';
    this.hud.style.top = '16px';
    this.hud.style.left = '16px';
    this.hud.style.right = '16px';
    this.hud.style.display = 'flex';
    this.hud.style.justifyContent = 'space-between';
    this.hud.style.zIndex = '5';
    this.hud.style.pointerEvents = 'none';
    
    this.hudScore = document.createElement('div');
    this.hudScore.className = 'hud-panel';
    this.hudScore.innerHTML = `<span>⭐ Điểm: </span><span id="score-val" style="font-weight:bold;font-size:24px">0</span>`;
    
    this.hudTime = document.createElement('div');
    this.hudTime.className = 'hud-panel';
    this.hudTime.innerHTML = `<span>⏱️ </span><span id="time-val" style="font-weight:bold;font-size:24px">${this.timeLeft}</span>`;
    
    this.hudMisses = document.createElement('div');
    this.hudMisses.className = 'hud-panel';
    this.hudMisses.innerHTML = `<span>💔 </span><span id="miss-val" style="font-weight:bold;font-size:24px">0/5</span>`;
    
    this.hud.appendChild(this.hudScore);
    this.hud.appendChild(this.hudMisses);
    this.hud.appendChild(this.hudTime);
    
    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '🏠';
    backBtn.onclick = () => (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })()
    backBtn.style.pointerEvents = 'auto';
    this.hud.appendChild(backBtn);
    
    this.ui.appendChild(this.hud);
    this.showStartScreen();
  }
  
  setupGrid() {
    this.grid.innerHTML = '';
    for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
      const hole = document.createElement('div');
      hole.className = 'hole';
      
      const mole = document.createElement('div');
      mole.className = 'mole-container';
      
      const mask = document.createElement('div');
      mask.className = 'hole-mask';
      
      hole.appendChild(mole);
      hole.appendChild(mask);
      this.grid.appendChild(hole);
      
      this.holes.push(hole);
      this.moles.push({ el: mole, active: false, timeout: null, type: null });
      
      // Hit handler
      hole.addEventListener('pointerdown', (e) => this.hit(i, e));
    }
  }
  
  showStartScreen() {
    const screen = document.createElement('div');
    screen.className = 'modal-overlay';
    screen.innerHTML = `
      <div class="modal-content" style="text-align: center;">
        <h1 style="font-size: 32px; margin-bottom: 16px; color: var(--color-primary);">Đập Chuột Cứu Bánh</h1>
        <p style="margin-bottom: 24px;">Bảo vệ bánh trung thu khỏi lũ chuột tham ăn!</p>
        <div style="display:flex; justify-content:center; gap: 16px; margin-bottom: 24px;">
          <div><div style="width: 50px; height: 50px; margin: 0 auto;">${window.gameSprites && window.gameSprites.mouse ? '<img src="'+window.gameSprites.mouse.toDataURL()+'" style="width:100%;height:100%;object-fit:contain;">' : '<span style="font-size: 24px">🐭</span>'}</div><br>+10</div>
          <div><div style="width: 50px; height: 50px; margin: 0 auto;">${window.gameSprites && window.gameSprites.mouse_gold ? '<img src="'+window.gameSprites.mouse_gold.toDataURL()+'" style="width:100%;height:100%;object-fit:contain;">' : '<span style="font-size: 24px">✨</span>'}</div><br>+50</div>
          <div><div style="width: 50px; height: 50px; margin: 0 auto;">${window.gameSprites && window.gameSprites.bunny ? '<img src="'+window.gameSprites.bunny.toDataURL()+'" style="width:100%;height:100%;object-fit:contain;">' : '<span style="font-size: 24px">🐰</span>'}</div><br>-30</div>
        </div>
        <button class="btn btn-primary btn-lg" id="start-btn">Bắt Đầu</button>
      </div>
    `;
    this.ui.appendChild(screen);
    screen.querySelector('#start-btn').onclick = () => {
      screen.remove();
      this.start();
    };
  }
  
  showGameOverScreen() {
    const screen = document.createElement('div');
    screen.className = 'modal-overlay';
    const snapshotHtml = window.playerSnapshot ? `<p style="margin: 5px 0; font-size: 0.9em; color: var(--color-primary);">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="width: 100%; max-width: 400px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid var(--color-primary);" />` : '';
    
    screen.innerHTML = `
      <div class="modal-content" style="text-align: center; color: #333;">
        <h1 style="font-size: 32px; margin-bottom: 16px;">Game Over!</h1>
        <div style="font-size: 48px; margin-bottom: 16px; color: var(--color-primary);">⭐ ${this.score}</div>
        ${snapshotHtml}
        
        <div id="leaderboard-input-section">
            <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2em; border-radius: 8px; border: 1px solid #ccc; width: 80%; margin-bottom: 15px; color: #333;">
            <button id="save-score-btn" class="btn btn-primary" style="padding: 10px 20px; font-size: 1.2em; display: block; width: 100%;">Lưu Điểm</button>
        </div>
        <div id="leaderboard-view-section" style="display:none;">
            <h3 style="margin-bottom: 5px;">Bảng Xếp Hạng</h3>
            <div id="leaderboard-list"></div>
            <button id="home-btn" class="btn btn-secondary" style="padding: 10px 20px; font-size: 1.2em; display: block; width: 100%; margin-top: 10px; background: #666;">Về Trang Chủ</button>
        </div>
      </div>
    `;
    this.ui.appendChild(screen);
    
    screen.querySelector('#save-score-btn').onclick = () => {
        const name = screen.querySelector('#player-name').value.trim();
        saveScore(name, this.score);
        
        screen.querySelector('#leaderboard-input-section').style.display = 'none';
        screen.querySelector('#leaderboard-list').innerHTML = showLeaderboardUI();
        screen.querySelector('#leaderboard-view-section').style.display = 'block';
    };
    
    const homeBtn = screen.querySelector('#home-btn');
    if (homeBtn) {
        homeBtn.onclick = () => (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })()
    }
  }
  
  start() {
    this.score = 0;
    this.misses = 0;
    this.timeLeft = CONFIG.GAME_DURATION;
    this.isPlaying = true;
    this.updateHUD();
    
    this.grid.classList.add('active');
    
    // Clear any existing moles
    this.moles.forEach(m => this.hideMole(m));
    
    this.gameInterval = setInterval(() => {
      this.timeLeft--;
      this.updateHUD();
      if (this.timeLeft <= 0) {
        this.end();
      }
    }, 1000);
  }
  
  end() {
    this.isPlaying = false;
    clearInterval(this.gameInterval);
    this.grid.classList.remove('active');
    this.moles.forEach(m => this.hideMole(m));
    this.showGameOverScreen();
  }
  
  updateHUD() {
    const scoreVal = document.getElementById('score-val');
    const timeVal = document.getElementById('time-val');
    const missVal = document.getElementById('miss-val');
    if (scoreVal) scoreVal.innerText = this.score;
    if (timeVal) timeVal.innerText = this.timeLeft;
    if (missVal) missVal.innerText = `${this.misses}/5`;
  }
  
  getRandomType() {
    const r = Math.random();
    let acc = 0;
    for (let key in CONFIG.TYPES) {
      acc += CONFIG.TYPES[key].prob;
      if (r <= acc) return CONFIG.TYPES[key];
    }
    return CONFIG.TYPES.REGULAR;
  }
  
  spawnMole() {
    const inactiveHoles = this.moles.map((m, i) => m.active ? -1 : i).filter(i => i !== -1);
    if (inactiveHoles.length === 0) return;
    
    const idx = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];
    const moleData = this.moles[idx];
    const type = this.getRandomType();
    
    moleData.active = true;
    moleData.type = type;
    moleData.el.innerHTML = '';
    
    if (type.sprite && window.gameSprites && window.gameSprites[type.sprite]) {
        const c = document.createElement('canvas');
        c.width = 100;
        c.height = 100;
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.objectFit = 'contain';
        c.getContext('2d').drawImage(window.gameSprites[type.sprite], 0, 0, 100, 100);
        moleData.el.appendChild(c);
    } else {
        moleData.el.innerHTML = type.realEmoji || type.emoji;
    }
    
    moleData.el.className = `mole-container up ${type.class}`;
    
    // Calculate duration based on time left (gets faster)
    const progress = 1 - (this.timeLeft / CONFIG.GAME_DURATION);
    let duration = CONFIG.INITIAL_MOLE_TIME - (CONFIG.INITIAL_MOLE_TIME - CONFIG.MIN_MOLE_TIME) * progress;
    if (window.MODIFIER_CHALLENGE === 'speed2x') duration /= 2;
    
    moleData.timeout = setTimeout(() => {
      this.hideMole(moleData);
    }, duration);
  }
  
  hideMole(moleData) {
    if (!moleData.active) return;
    moleData.active = false;
    moleData.el.classList.remove('up');
    
    // Check if missed
    if (!moleData.el.classList.contains('hit') && (moleData.type.class === 'regular' || moleData.type.class === 'golden')) {
      this.misses++;
      this.updateHUD();
      if (this.misses >= 5) {
         this.end();
      }
    }
    
    clearTimeout(moleData.timeout);
    setTimeout(() => {
      moleData.el.className = 'mole-container';
      moleData.el.classList.remove('hit'); // Reset hit state when fully hidden
    }, 150);
  }
  
  hit(idx, e) {
    if (!this.isPlaying) return;
    
    // Hammer animation
    this.container.classList.add('whacking');
    setTimeout(() => this.container.classList.remove('whacking'), 100);
    
    const moleData = this.moles[idx];
    if (!moleData.active || moleData.el.classList.contains('hit')) return;
    
    const type = moleData.type;
    this.score += type.score;
    this.updateHUD();
    
    // Hit visual
    moleData.el.classList.add('hit');
    clearTimeout(moleData.timeout);
    setTimeout(() => this.hideMole(moleData), 300);
    
    // Score popup
    this.showPopup(e.clientX, e.clientY, type);
    
    // Effects
    if (type.score > 0) {
      const rect = this.holes[idx].getBoundingClientRect();
      this.particles.emit(rect.left + rect.width/2, rect.top + rect.height/2, type.class === 'golden' ? '#ffcc00' : '#ffffff');
    }
    
    if (type.class === 'bunny') {
      this.grid.classList.add('shake');
      setTimeout(() => this.grid.classList.remove('shake'), 400);
    }
  }
  
  showPopup(x, y, type) {
    const popup = document.createElement('div');
    popup.className = `score-popup ${type.class}`;
    popup.innerText = type.score > 0 ? `+${type.score}` : type.score;
    popup.style.left = `${x - 20}px`;
    popup.style.top = `${y - 20}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
  }
  
  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.bg.draw();
    this.particles.update(dt);
    this.particles.draw();
    
    if (this.isPlaying) {
      this.spawnTimer += dt;
      // Adjust spawn rate based on time left
      const progress = 1 - (this.timeLeft / CONFIG.GAME_DURATION);
      let interval = CONFIG.SPAWN_INTERVAL_MAX - (CONFIG.SPAWN_INTERVAL_MAX - CONFIG.SPAWN_INTERVAL_MIN) * progress;
      if (window.MODIFIER_CHALLENGE === 'speed2x') interval /= 2;
      
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawnMole();
      }
    }
    
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Init game
document.addEventListener('DOMContentLoaded', async () => {
  window.gameSprites = {};
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
  
  try {
      window.gameSprites.mouse = await loadSprite(import.meta.env.BASE_URL + 'assets/mouse.jpg');
      window.gameSprites.mouse_gold = await loadSprite(import.meta.env.BASE_URL + 'assets/mouse_gold.jpg');
      window.gameSprites.bunny = await loadSprite(import.meta.env.BASE_URL + 'assets/bunny.jpg');
  } catch(e) { console.error('Lỗi tải ảnh:', e); }
  
  new Game();
});
