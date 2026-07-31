/**
 * 🏠 Hub Page - Main Entry
 * Trang chủ chọn game
 */
import { MoonBackground } from './components/MoonBackground.js';

// ── Game Data ──
const GAMES = [
  {
    id: 'catching',
    emoji: '🥮',
    title: 'Hứng Bánh Trung Thu',
    desc: 'Di chuyển giỏ để hứng bánh nướng, lồng đèn rơi từ trên trời. Né tránh bom và đá!',
    path: import.meta.env.BASE_URL + 'src/games/01-catching/index.html',
    color: '#FF6B35',
  },
  {
    id: 'whack',
    emoji: '🐭',
    title: 'Đập Chuột Cứu Bánh',
    desc: 'Đập nhanh tay vào lũ chuột đang ăn trộm bánh! Cẩn thận đừng đập trúng Thỏ Ngọc!',
    path: import.meta.env.BASE_URL + 'src/games/02-whack/index.html',
    color: '#DC143C',
  },
  {
    id: 'flappy',
    emoji: '🐰',
    title: 'Thỏ Ngọc Bay Lên Trăng',
    desc: 'Giúp Thỏ Ngọc bay vượt qua chướng ngại vật để về cung trăng. Bay cao bay xa!',
    path: import.meta.env.BASE_URL + 'src/games/03-flappy/index.html',
    color: '#FFD700',
  },
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Trí Nhớ Đêm Trăng',
    desc: 'Lật thẻ bài tìm các cặp hình giống nhau. Lật nhanh để đạt điểm cao hơn!',
    path: import.meta.env.BASE_URL + 'src/games/04-memory/index.html',
    color: '#3B82F6',
  },
  {
    id: 'survival',
    emoji: '🏃',
    title: 'Thỏ Ngọc Chạy Trốn',
    desc: 'Dùng WASD để điều khiển Thỏ Ngọc né tránh bầy rắn đang lao đến từ mọi hướng!',
    path: import.meta.env.BASE_URL + 'src/games/05-survival/index.html',
    color: '#10B981',
  },
];

// ── Roulette Logic ──
function initRoulette() {
  const strip = document.getElementById('roulette-strip');
  const spinBtn = document.getElementById('spin-btn');
  
  // Generate a strip of random games
  const TOTAL_ITEMS = 60;
  let rouletteItems = [];
  
  for (let i = 0; i < TOTAL_ITEMS; i++) {
    const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
    rouletteItems.push(randomGame);
    
    const itemEl = document.createElement('div');
    itemEl.className = 'roulette-item';
    itemEl.innerHTML = `
      <div class="roulette-emoji">${randomGame.emoji}</div>
      <div class="roulette-name">${randomGame.title}</div>
    `;
    itemEl.style.borderColor = randomGame.color;
    strip.appendChild(itemEl);
  }
  
  let isSpinning = false;
  
  spinBtn.addEventListener('click', () => {
    if (isSpinning) return;
    isSpinning = true;
    
    spinBtn.disabled = true;
    spinBtn.innerHTML = 'Đang quay... 🌀';
    spinBtn.classList.add('spinning');
    
    // Reset any previous state
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';
    Array.from(strip.children).forEach(c => {
      c.style.opacity = 1;
      c.style.transform = 'scale(1)';
    });
    
    // Force reflow
    void strip.offsetWidth;
    
    // Pick a winning index near the end (50 to 55)
    const winIndex = 50 + Math.floor(Math.random() * 5);
    const winner = rouletteItems[winIndex];
    
    // Calculate scroll offset
    const itemEl = strip.children[0];
    const itemWidth = itemEl.offsetWidth;
    const gap = 16; // from CSS gap
    const fullItemWidth = itemWidth + gap;
    
    const containerWidth = strip.parentElement.offsetWidth;
    
    // Center the winning item exactly under the pointer
    // Because the strip has padding-left: calc(50% - 75px), the first item is already centered at translateX(0).
    // So we just need to shift by winIndex * fullItemWidth.
    const targetOffset = winIndex * fullItemWidth;
    
    // Add random fuzziness (so it doesn't land perfectly in center every time)
    const fuzzy = (Math.random() - 0.5) * (itemWidth * 0.8);
    const finalOffset = targetOffset + fuzzy;
    
    // Apply animation (CS:GO style easing)
    strip.style.transition = 'transform 6.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
    strip.style.transform = `translateX(-${finalOffset}px)`;
    
    // Wait for animation
    setTimeout(() => {
      // Highlight winner
      Array.from(strip.children).forEach((c, idx) => {
        if (idx !== winIndex) c.style.opacity = 0.3;
      });
      strip.children[winIndex].style.transform = 'scale(1.1)';
      strip.children[winIndex].style.borderColor = '#FFD700'; // Gold border
      strip.children[winIndex].style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
      
      // Define challenges
      const challenges = [
        { id: 'none', name: 'Không Có', emoji: '😌', color: '#10B981' },
        { id: 'speed2x', name: 'Tốc độ x2', emoji: '⚡', color: '#EF4444' },
        { id: 'flashbang', name: 'Bom chói', emoji: '💥', color: '#F59E0B' },
        { id: 'camera', name: 'Quà người', emoji: '📸', color: '#3B82F6' },
        { id: 'quiz', name: 'Trọn bộ câu hỏi', emoji: '❓', color: '#8B5CF6' },
        { id: 'inverted', name: 'Lật ngược', emoji: '🙃', color: '#EC4899' }
      ];
      
      const challengeRoulette = document.getElementById('challenge-roulette');
      const challengeStrip = document.getElementById('challenge-strip');
      challengeRoulette.style.display = 'block';
      challengeRoulette.style.animation = 'fadeInDown 0.5s ease forwards';
      
      spinBtn.innerHTML = 'Đang bốc thử thách... 🎲';
      
      // Generate challenge strip
      challengeStrip.innerHTML = '';
      const TOTAL_CHALLENGES = 40;
      let challengeItems = [];
      
      for (let i = 0; i < TOTAL_CHALLENGES; i++) {
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        challengeItems.push(randomChallenge);
        
        const itemEl = document.createElement('div');
        itemEl.className = 'roulette-item';
        itemEl.innerHTML = `
          <div class="roulette-emoji">${randomChallenge.emoji}</div>
          <div class="roulette-name">${randomChallenge.name}</div>
        `;
        itemEl.style.borderColor = randomChallenge.color;
        challengeStrip.appendChild(itemEl);
      }
      
      // Force reflow
      void challengeStrip.offsetWidth;
      
      const chalWinIndex = 30 + Math.floor(Math.random() * 5);
      const wonChallenge = challengeItems[chalWinIndex];
      
      const chalItemWidth = challengeStrip.children[0].offsetWidth;
      const chalFullWidth = chalItemWidth + 16; // 16 is gap
      const chalTargetOffset = chalWinIndex * chalFullWidth;
      const chalFuzzy = (Math.random() - 0.5) * (chalItemWidth * 0.8);
      const chalFinalOffset = chalTargetOffset + chalFuzzy;
      
      challengeStrip.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)';
      challengeStrip.style.transform = `translateX(-${chalFinalOffset}px)`;
      
      setTimeout(() => {
        // Highlight challenge winner
        Array.from(challengeStrip.children).forEach((c, idx) => {
          if (idx !== chalWinIndex) c.style.opacity = 0.3;
        });
        challengeStrip.children[chalWinIndex].style.transform = 'scale(1.1)';
        challengeStrip.children[chalWinIndex].style.borderColor = '#FFD700';
        challengeStrip.children[chalWinIndex].style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
        
        const gameUrlWithChallenge = `${winner.path}?challenge=${wonChallenge.id}`;
        
        spinBtn.innerHTML = `Chơi: ${winner.title}<br/><span style="font-size: 0.6em; color: #FFD700;">Thử thách: ${wonChallenge.name}</span>`;
        spinBtn.classList.remove('spinning');
        spinBtn.classList.add('ready');
        spinBtn.disabled = false;
        
        // Auto redirect after 4 seconds
        const autoPlayTimeout = setTimeout(() => {
          window.location.href = gameUrlWithChallenge;
        }, 4000);
        
        spinBtn.onclick = () => {
          clearTimeout(autoPlayTimeout);
          window.location.href = gameUrlWithChallenge;
        };
        
      }, 5000);
      
    }, 6500);
  });
}

// ── Animated Background ──
function initBackground() {
  const canvas = document.getElementById('hub-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let bg;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    bg = new MoonBackground(window.innerWidth, window.innerHeight);
  }

  resize();
  window.addEventListener('resize', resize);

  let lastTime = 0;
  function animate(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bg.update(dt);
    bg.render(ctx);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initRoulette();
  initBackground();
});
