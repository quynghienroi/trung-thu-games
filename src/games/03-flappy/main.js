// Tự chạy độc lập, không import từ core/ hay components/
const GAME_ID = '03-flappy';
const canvas = document.getElementById('game-canvas');

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
    let html = `<div style="max-height: 200px; overflow-y: auto; margin: 15px 0; text-align: left; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px;">`;
    if (board.length === 0) {
        html += `<p style="text-align:center;">Chưa có dữ liệu</p>`;
    } else {
        board.forEach((entry, idx) => {
            html += `<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                <span><b>#${idx+1}</b> ${entry.name}</span>
                <span style="color:#ffeb3b; font-weight:bold;">${entry.score}</span>
            </div>`;
        });
    }
    html += `</div>`;
    return html;
}
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('ui-overlay');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// Input handling
let jumpRequested = false;
function handleInput(e) {
  if (e.type === 'keydown' && e.code !== 'Space') return;
  if (e.type === 'touchstart' || e.type === 'keydown') e.preventDefault();
  jumpRequested = true;
}
window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', handleInput, {passive: false});
window.addEventListener('keydown', handleInput);

// Game constants
const GRAVITY = 1200;
const JUMP_VELOCITY = -420;
const PIPE_SPEED = 180;
const PIPE_WIDTH = 90;
const PIPE_GAP = 180;
const SPAWN_INTERVAL = 1.8;

// Game state
let state = 'start'; // start, play, over
let score = 0;
let bestScore = parseInt(localStorage.getItem('flappyBestScore') || '0', 10);
let time = 0;

let bunny = { x: 0, y: 0, vy: 0, rotation: 0, radius: 35, hitRadius: 18 };
let pipes = [];
let collectibles = [];
let pipeTimer = 0;
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

let stars = [];
for(let i = 0; i < 50; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random(),
    size: Math.random() * 2 + 1,
    speed: Math.random() * 10 + 5
  });
}

function initGame() {
  bunny = {
    x: width / 3,
    y: height / 2,
    vy: 0,
    rotation: 0,
    radius: 35,
    hitRadius: 18
  };
  pipes = [];
  collectibles = [];
  score = 0;
  pipeTimer = SPAWN_INTERVAL;
  state = 'play';
  jumpRequested = false;
  uiOverlay.innerHTML = '';
  createBackButton();
}

function showStartScreen() {
  state = 'start';
  bunny.y = height / 2;
  uiOverlay.innerHTML = `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; font-family: 'Nunito', sans-serif;">
      <h1 style="font-size: 3rem; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Thỏ Ngọc<br>Bay Lên Trăng</h1>
      <p style="font-size: 1.5rem; margin-bottom: 40px; animation: pulse 1.5s infinite;">Chạm hoặc Space để bay!</p>
      <div style="font-size: 4rem;">🐰</div>
    </div>
  `;
  createBackButton();
}



function showGameOver() {
  state = 'over';
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBestScore', bestScore);
  }
  
  const snapshotHtml = window.playerSnapshot ? `<p style="margin: 5px 0; font-size: 0.9em; color: #ffeb3b;">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="width: 100%; max-width: 400px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffeb3b;" />` : '';
  
  uiOverlay.innerHTML = `
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); color: white; text-align: center; font-family: 'Nunito', sans-serif;">
      <h2 style="font-size: 3rem; margin-bottom: 20px; color: #ffeb3b;">Game Over</h2>
      <div style="background: rgba(255,255,255,0.1); padding: 20px 40px; border-radius: 20px; margin-bottom: 30px; border: 2px solid rgba(255,255,255,0.2);">
        <p style="font-size: 1.5rem; margin: 10px 0;">Điểm: <span style="font-size: 2rem; font-weight: bold;">${score}</span></p>
        ${snapshotHtml}
      </div>
      
      <div id="leaderboard-input-section" style="width: 80%; max-width: 400px; display: flex; flex-direction: column; gap: 10px;">
          <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2rem; border-radius: 8px; border: none; text-align: center; color: #333;">
          <button id="save-score-btn" style="padding: 10px; font-size: 1.2rem; border-radius: 8px; border: none; background: #4caf50; color: white; cursor: pointer; font-weight: bold;">Lưu Điểm</button>
      </div>
      
      <div id="leaderboard-view-section" style="display:none; width: 80%; max-width: 400px;">
          <h3 style="margin-bottom: 5px; color: #ffeb3b;">Bảng Xếp Hạng</h3>
          <div id="leaderboard-list"></div>
          <button id="btn-home" style="padding: 10px; font-size: 1.2rem; border-radius: 8px; border: none; background: #f44336; color: white; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px;">Về Trang Chủ</button>
      </div>
    </div>
  `;
  
  document.getElementById('save-score-btn').addEventListener('click', () => {
      const name = document.getElementById('player-name').value.trim();
      saveScore(name, score);
      
      document.getElementById('leaderboard-input-section').style.display = 'none';
      document.getElementById('leaderboard-list').innerHTML = showLeaderboardUI();
      document.getElementById('leaderboard-view-section').style.display = 'block';
  });
  
  document.getElementById('btn-home')?.addEventListener('click', () => { (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })() });
  createBackButton();
}

function createBackButton() {
  let backBtn = document.getElementById('back-btn');
  if (!backBtn) {
    backBtn = document.createElement('div');
    backBtn.id = 'back-btn';
    backBtn.innerHTML = '🔙';
    backBtn.style.cssText = 'position: absolute; top: 20px; left: 20px; font-size: 2rem; cursor: pointer; z-index: 100; background: rgba(0,0,0,0.3); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 50%; padding-bottom: 5px;';
    backBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      (function(){ if(window.parent !== window) window.parent.postMessage('close-game', '*'); else window.location.href = import.meta.env.BASE_URL; })()
    });
    uiOverlay.appendChild(backBtn);
  }
}

function update(dt) {
  time += dt;

  if (state === 'start') {
    bunny.y = height / 2 + Math.sin(time * 3) * 15;
    if (jumpRequested) {
      initGame();
      jumpRequested = false;
      bunny.vy = JUMP_VELOCITY;
    }
  } else if (state === 'play') {
    if (jumpRequested) {
      bunny.vy = JUMP_VELOCITY;
      jumpRequested = false;
    }

    bunny.vy += GRAVITY * dt;
    bunny.y += bunny.vy * dt;
    
    // Rotation based on velocity
    bunny.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bunny.vy * 0.002));

    // Ground and ceiling collision
    if (bunny.y > height - bunny.radius || bunny.y < bunny.radius) {
      showGameOver();
    }

    // Pipes
    pipeTimer -= dt * (window.MODIFIER_CHALLENGE === 'speed2x' ? 2 : 1);
    if (pipeTimer <= 0) {
      pipeTimer = SPAWN_INTERVAL;
      const minHeight = 50;
      const maxHeight = height - PIPE_GAP - minHeight;
      const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      
      pipes.push({
        x: width,
        topHeight: topHeight,
        passed: false
      });
      
      // Spawn collectible
      if (Math.random() > 0.3) {
        const type = Math.random() > 0.8 ? '🥮' : '⭐';
        const value = type === '🥮' ? 5 : 1;
        collectibles.push({
          x: width + PIPE_WIDTH / 2,
          y: topHeight + PIPE_GAP / 2,
          type: type,
          value: value,
          active: true,
          radius: 15
        });
      }
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED * dt * (window.MODIFIER_CHALLENGE === 'speed2x' ? 2 : 1);

      // Check passing
      if (!p.passed && p.x + PIPE_WIDTH < bunny.x) {
        p.passed = true;
        score++;
      }

      // Check collision
      if (bunny.x + bunny.hitRadius > p.x && bunny.x - bunny.hitRadius < p.x + PIPE_WIDTH) {
        if (bunny.y - bunny.hitRadius < p.topHeight || bunny.y + bunny.hitRadius > p.topHeight + PIPE_GAP) {
          showGameOver();
        }
      }

      if (p.x + PIPE_WIDTH < 0) {
        pipes.splice(i, 1);
      }
    }

    // Update collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      if (!c.active) continue;
      c.x -= PIPE_SPEED * dt * (window.MODIFIER_CHALLENGE === 'speed2x' ? 2 : 1);
      
      // Collision with bunny
      const dx = bunny.x - c.x;
      const dy = bunny.y - c.y;
      if (dx*dx + dy*dy < (bunny.radius + c.radius) * (bunny.radius + c.radius)) {
        c.active = false;
        score += c.value;
      }
      
      if (c.x < -30) {
        collectibles.splice(i, 1);
      }
    }
  }
}

function draw() {
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f2027');
  gradient.addColorStop(0.5, '#203a43');
  gradient.addColorStop(1, '#2c5364');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Stars
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    let sx = (s.x * width - (state === 'play' ? time * s.speed : 0)) % width;
    if (sx < 0) sx += width;
    ctx.globalAlpha = Math.abs(Math.sin(time * 2 + s.x * 10));
    ctx.beginPath();
    ctx.arc(sx, s.y * height, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // Moon
  if (sprites.moon) {
    ctx.drawImage(sprites.moon, width * 0.8 - 50, height * 0.2 - 50, 100, 100);
  } else {
    ctx.font = '80px Arial';
    ctx.fillText('🌕', width * 0.8, height * 0.2);
  }

  // Pipes
  pipes.forEach(p => {
    if (sprites.bamboo) {
        for (let y = p.topHeight - PIPE_WIDTH; y >= -PIPE_WIDTH; y -= PIPE_WIDTH) {
            ctx.drawImage(sprites.bamboo, p.x, y, PIPE_WIDTH, PIPE_WIDTH);
        }
        for (let y = p.topHeight + PIPE_GAP; y <= height; y += PIPE_WIDTH) {
            ctx.drawImage(sprites.bamboo, p.x, y, PIPE_WIDTH, PIPE_WIDTH);
        }
    } else {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.fillRect(p.x, p.topHeight + PIPE_GAP, PIPE_WIDTH, height - p.topHeight - PIPE_GAP);
        ctx.strokeRect(p.x, p.topHeight + PIPE_GAP, PIPE_WIDTH, height - p.topHeight - PIPE_GAP);
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(p.x - 5, p.topHeight - 20, PIPE_WIDTH + 10, 20);
        ctx.fillRect(p.x - 5, p.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
    }
  });

  // Collectibles
  collectibles.forEach(c => {
    if (c.active) {
      ctx.save();
      ctx.translate(c.x, c.y + Math.sin(time * 5 + c.x) * 5);
      const sprite = c.type === '🥮' ? sprites.mooncake : sprites.star;
      if (sprite) {
        ctx.drawImage(sprite, -15, -15, 30, 30);
      } else {
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(c.type, 0, 0);
      }
      ctx.restore();
    }
  });

  // Bunny
  if (state !== 'over') {
    ctx.save();
    ctx.translate(bunny.x, bunny.y);
    ctx.rotate(bunny.rotation);
    if (sprites.bunny) {
      ctx.drawImage(sprites.bunny, -bunny.radius, -bunny.radius, bunny.radius*2, bunny.radius*2);
    } else {
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐰', 0, 0);
    }
    ctx.restore();
  }

  // UI (Score)
  if (state === 'play') {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(score.toString(), width / 2, 80);
    ctx.shadowColor = 'transparent';
  }
}

let lastTime = 0;
function loop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1; // Cap delta time
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

async function start() {
    try {
        sprites.bunny = await loadSprite(import.meta.env.BASE_URL + 'assets/');
        sprites.moon = await loadSprite(import.meta.env.BASE_URL + 'assets/');
        sprites.bamboo = await loadSprite(import.meta.env.BASE_URL + 'assets/');
        sprites.star = await loadSprite(import.meta.env.BASE_URL + 'assets/');
        sprites.mooncake = await loadSprite(import.meta.env.BASE_URL + 'assets/');
    } catch(e) { console.error('Lỗi tải ảnh:', e); }

    showStartScreen();
    requestAnimationFrame((timestamp) => {
      lastTime = timestamp;
      loop(timestamp);
    });
}

start();
