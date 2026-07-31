// main.js
const SPRITE_KEYS = ['mooncake', 'lantern', 'bunny', 'moon', 'bamboo', 'dragon', 'mouse', 'star'];
const FALLBACK_EMOJIS = { mooncake: '🥮', lantern: '🏮', bunny: '🐰', moon: '🌕', bamboo: '🎋', dragon: '🐉', mouse: '🐭', star: '⭐' };
const TIME_LIMIT = 90;
const GAME_ID = '04-memory';

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
        html += `<p style="text-align:center; color: #fff;">Chưa có dữ liệu</p>`;
    } else {
        board.forEach((entry, idx) => {
            html += `<div style="display:flex; justify-content:space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.2); color: #fff;">
                <span><b>#${idx+1}</b> ${entry.name}</span>
                <span style="color:#fef08a; font-weight:bold;">${entry.score}</span>
            </div>`;
        });
    }
    html += `</div>`;
    return html;
}

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let score = 0;
let streak = 0;
let wrongFlips = 0;
let timeRemaining = TIME_LIMIT;
let gameInterval;
let isPlaying = false;
let canFlip = false;
let bestScore = localStorage.getItem('memory_best_score') || 0;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiOverlay = document.getElementById('ui-overlay');

// Resize canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Draw background
let stars = Array.from({length: 100}, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 2,
  alpha: Math.random()
}));

function drawBackground() {
  if (!ctx) return;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Moon
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(canvas.width - 100, 100, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#fef08a';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Stars
  stars.forEach(star => {
    star.alpha += (Math.random() - 0.5) * 0.1;
    star.alpha = Math.max(0, Math.min(1, star.alpha));
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  
  requestAnimationFrame(drawBackground);
}

function initGame() {
  score = 0;
  streak = 0;
  wrongFlips = 0;
  matchedPairs = 0;
  timeRemaining = TIME_LIMIT;
  flippedCards = [];
  canFlip = true;
  isPlaying = true;
  
  uiOverlay.innerHTML = `
    <div class="game-hud" style="font-family: 'Nunito', sans-serif;">
      <div class="hud-left">
        <button id="back-btn" style="padding: 10px 15px; border-radius: 8px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); cursor: pointer; backdrop-filter: blur(5px); font-size: 1rem; font-weight: bold;">← Trở về</button>
      </div>
      <div class="hud-right" style="color: white; font-size: 1.5rem; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); text-align: right;">
        <div id="time-display" style="color: #fca5a5;">⏰ ${timeRemaining}s</div>
        <div id="score-display" style="color: #fef08a;">⭐ ${score}</div>
        <div id="wrong-display" style="color: #f87171;">💔 0/7</div>
        <div id="streak-display" style="color: #fb923c; font-size: 1.2rem; height: 1.5rem;"></div>
      </div>
    </div>
    <div class="memory-board" id="board"></div>
  `;
  
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = '/';
  });

  const board = document.getElementById('board');
  
  // Create deck
  cards = [...SPRITE_KEYS, ...SPRITE_KEYS]
    .sort(() => Math.random() - 0.5)
    .map((spriteKey, index) => ({ id: index, spriteKey, isFlipped: false, isMatched: false }));
    
  cards.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'memory-card';
    cardEl.dataset.index = index;
    
    let frontContent = '';
    if (window.gameSprites && window.gameSprites[card.spriteKey]) {
        frontContent = '<img src="'+window.gameSprites[card.spriteKey].toDataURL()+'" style="width:70%;height:70%;object-fit:contain;margin-top:15%;">';
    } else {
        frontContent = FALLBACK_EMOJIS[card.spriteKey];
    }
    
    cardEl.innerHTML = `
      <div class="memory-card-face memory-card-front">${frontContent}</div>
      <div class="memory-card-face memory-card-back"></div>
    `;
    cardEl.addEventListener('click', () => flipCard(index, cardEl));
    board.appendChild(cardEl);
  });
  
  clearInterval(gameInterval);
  gameInterval = setInterval(() => {
    timeRemaining--;
    document.getElementById('time-display').textContent = `⏰ ${timeRemaining}s`;
    if (timeRemaining <= 0) {
      endGame(false);
    }
  }, window.MODIFIER_CHALLENGE === 'speed2x' ? 500 : 1000);
}

function flipCard(index, el) {
  if (!canFlip || cards[index].isFlipped || cards[index].isMatched || flippedCards.length >= 2) return;
  
  cards[index].isFlipped = true;
  el.classList.add('flipped');
  flippedCards.push({ index, el, spriteKey: cards[index].spriteKey });
  
  if (flippedCards.length === 2) {
    canFlip = false;
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;
  if (card1.spriteKey === card2.spriteKey) {
    // Match
    cards[card1.index].isMatched = true;
    cards[card2.index].isMatched = true;
    card1.el.classList.add('matched');
    card2.el.classList.add('matched');
    
    streak++;
    const points = 100 + (timeRemaining * 2) + (streak * 10);
    score += points;
    matchedPairs++;
    
    updateHUD();
    flippedCards = [];
    canFlip = true;
    
    if (matchedPairs === SPRITE_KEYS.length) {
      setTimeout(() => endGame(true), 800);
    }
  } else {
    // No match
    streak = 0;
    wrongFlips++;
    updateHUD();
    
    if (wrongFlips >= 7) {
        setTimeout(() => endGame(false, 'Sai quá nhiều!'), 800);
        return;
    }
    
    setTimeout(() => {
      cards[card1.index].isFlipped = false;
      cards[card2.index].isFlipped = false;
      card1.el.classList.remove('flipped');
      card2.el.classList.remove('flipped');
      flippedCards = [];
      canFlip = true;
    }, 800);
  }
}

function updateHUD() {
  const scoreEl = document.getElementById('score-display');
  const streakEl = document.getElementById('streak-display');
  const wrongEl = document.getElementById('wrong-display');
  if(scoreEl) scoreEl.textContent = `⭐ ${score}`;
  if(streakEl) streakEl.textContent = streak > 1 ? `🔥 x${streak}` : '';
  if(wrongEl) wrongEl.textContent = `💔 ${wrongFlips}/7`;
}

function showStartScreen() {
  isPlaying = false;
  
  uiOverlay.innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.9); padding: 40px; border-radius: 24px; text-align: center; color: white; border: 2px solid #fef08a; box-shadow: 0 0 30px rgba(254, 240, 138, 0.3); max-width: 90%; font-family: 'Nunito', sans-serif;">
      <div style="font-size: 4rem; margin-bottom: 10px;">🎴</div>
      <h1 style="font-size: 2.5rem; margin-bottom: 15px; color: #fef08a; text-shadow: 0 2px 10px rgba(254, 240, 138, 0.5);">Trí Nhớ Đêm Trăng</h1>
      <p style="font-size: 1.2rem; margin-bottom: 30px; line-height: 1.5;">Tìm các cặp hình giống nhau trước khi hết giờ!<br>Ghép liên tiếp để nhận thêm điểm thưởng.</p>
      <button id="start-btn" style="padding: 15px 50px; font-size: 1.5rem; background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; border: none; border-radius: 50px; cursor: pointer; font-weight: 900; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5); font-family: 'Nunito', sans-serif; transition: transform 0.2s;">Bắt Đầu</button>
      <div style="margin-top: 20px;">
        <a href="/" style="color: #9ca3af; text-decoration: none; font-size: 1rem; border-bottom: 1px solid #9ca3af; padding-bottom: 2px;">← Trở về sảnh</a>
      </div>
    </div>
  `;
  
  document.getElementById('start-btn').addEventListener('click', initGame);
  document.getElementById('start-btn').addEventListener('mouseover', (e) => e.target.style.transform = 'scale(1.05)');
  document.getElementById('start-btn').addEventListener('mouseout', (e) => e.target.style.transform = 'scale(1)');
}

function endGame(win, reason = '') {
  clearInterval(gameInterval);
  isPlaying = false;
  
  if (win) {
    score += timeRemaining * 10;
  }
  
  const snapshotHtml = window.playerSnapshot ? `<br/><p style="margin: 5px 0; font-size: 0.9em; color: #ffeb3b;">Phần quà bất ngờ!</p><img src="${window.playerSnapshot}" style="max-width: 200px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffeb3b;" />` : '';
  
  const titleText = win ? 'Chiến Thắng!' : (reason || 'Hết Giờ!');
  
  uiOverlay.innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.95); padding: 40px; border-radius: 24px; text-align: center; color: white; border: 2px solid ${win ? '#4ade80' : '#f87171'}; min-width: 320px; box-shadow: 0 0 30px ${win ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}; font-family: 'Nunito', sans-serif;">
      <div style="font-size: 4rem; margin-bottom: 10px;">${win ? '🏆' : '💔'}</div>
      <h2 style="font-size: 2.5rem; margin-bottom: 20px; color: ${win ? '#4ade80' : '#f87171'}; text-shadow: 0 2px 10px ${win ? 'rgba(74, 222, 128, 0.5)' : 'rgba(248, 113, 113, 0.5)'};">${titleText}</h2>
      <div style="font-size: 1.5rem; margin-bottom: 10px; display: flex; flex-direction: column; align-items: center; gap: 5px;">
        <span style="color: #e5e7eb;">Điểm số:</span>
        <span style="color: #fef08a; font-size: 3rem; font-weight: 900; line-height: 1;">${score}</span>
      </div>
      ${snapshotHtml}
      
      <div id="leaderboard-input-section" style="margin-top: 20px;">
          <input type="text" id="player-name" placeholder="Nhập tên của bạn" style="padding: 10px; font-size: 1.2rem; border-radius: 8px; border: 1px solid #ccc; width: 80%; margin-bottom: 15px; text-align: center; color: #333;">
          <button id="save-score-btn" style="padding: 10px 25px; font-size: 1.2rem; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 900; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); width: 100%;">Lưu Điểm</button>
      </div>
      
      <div id="leaderboard-view-section" style="display:none; margin-top: 20px;">
          <h3 style="margin-bottom: 5px; color: #fef08a;">Bảng Xếp Hạng</h3>
          <div id="leaderboard-list"></div>
          <button id="home-btn" style="padding: 10px 25px; font-size: 1.2rem; background: #374151; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 10px;">Về Sảnh</button>
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
  
  document.getElementById('home-btn')?.addEventListener('click', () => {
    window.location.href = '/';
  });
}

// Start
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

window.gameSprites = {};
async function preload() {
    try {
        window.gameSprites.mooncake = await loadSprite('../../assets/mooncake.jpg');
        window.gameSprites.lantern = await loadSprite('../../assets/lantern.jpg');
        window.gameSprites.bunny = await loadSprite('../../assets/bunny.jpg');
        window.gameSprites.moon = await loadSprite('../../assets/moon.jpg');
        window.gameSprites.bamboo = await loadSprite('../../assets/bamboo.jpg');
        window.gameSprites.dragon = await loadSprite('../../assets/dragon.jpg');
        window.gameSprites.mouse = await loadSprite('../../assets/mouse.jpg');
        window.gameSprites.star = await loadSprite('../../assets/star.jpg');
    } catch(e) {
        console.error('Lỗi tải ảnh:', e);
    }
    
    requestAnimationFrame(drawBackground);
    showStartScreen();
}

preload();
