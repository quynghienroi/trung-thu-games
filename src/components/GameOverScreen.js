/**
 * 💀 Game Over Screen Component
 * Màn hình kết thúc game - DOM overlay
 */
export function createGameOverScreen(container, { score, bestScore, isNewBest, onRestart, onHome }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'game-over-screen';

  const newBestHtml = isNewBest
    ? `<div class="game-over-newbest">🎉 Kỷ lục mới! 🎉</div>`
    : '';

  overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div class="game-over-emoji">🏮</div>
      <h2 class="game-over-title">Hết Giờ!</h2>
      <div class="divider"></div>
      ${newBestHtml}
      <div class="game-over-score">
        <div class="game-over-score-label">Điểm số</div>
        <div class="game-over-score-value">${score}</div>
      </div>
      <div class="game-over-best">
        <span>Kỷ lục: </span>
        <span class="game-over-best-value">${bestScore}</span>
      </div>
      <div class="game-over-actions">
        <button class="btn btn-primary btn-lg" id="btn-restart">🔄 Chơi Lại</button>
        <button class="btn btn-secondary" id="btn-home">🏠 Trang Chủ</button>
      </div>
    </div>
  `;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .game-over-emoji { font-size: 4rem; margin-bottom: 0.5rem; animation: float 3s ease-in-out infinite; }
    .game-over-title { font-size: 2rem; font-weight: 900; color: var(--text-primary); margin-bottom: 0.5rem; }
    .game-over-newbest { 
      font-size: 1.25rem; font-weight: 800; 
      background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
      background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: pulse 1s ease-in-out infinite; margin-bottom: 1rem;
    }
    .game-over-score { margin: 1.5rem 0 0.5rem; }
    .game-over-score-label { font-size: 0.875rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 2px; }
    .game-over-score-value { font-size: 3.5rem; font-weight: 900; color: var(--color-secondary); text-shadow: 0 0 20px rgba(255,215,0,0.4); }
    .game-over-best { font-size: 1rem; color: var(--text-secondary); margin-bottom: 2rem; }
    .game-over-best-value { color: var(--color-primary); font-weight: 700; }
    .game-over-actions { display: flex; flex-direction: column; gap: 0.75rem; }
  `;
  overlay.appendChild(style);

  container.appendChild(overlay);

  overlay.querySelector('#btn-restart').addEventListener('click', () => {
    overlay.remove();
    if (onRestart) onRestart();
  });

  overlay.querySelector('#btn-home').addEventListener('click', () => {
    if (onHome) onHome();
    else if(window.parent !== window) { window.parent.postMessage('close-game', '*'); } else { window.location.href = import.meta.env.BASE_URL; }
  });

  return overlay;
}

/** Remove game over screen if exists */
export function removeGameOverScreen() {
  const el = document.getElementById('game-over-screen');
  if (el) el.remove();
}
