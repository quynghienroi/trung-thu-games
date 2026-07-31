/**
 * 🏆 Leaderboard Modal Component
 */
import { Leaderboard } from '../core/leaderboard.js';

export class LeaderboardModal {
  constructor(gameId) {
    this.gameId = gameId;
    this.leaderboard = new Leaderboard();
  }

  show(container, currentScore = null) {
    const entries = this.leaderboard.getTop(this.gameId, 10);
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'leaderboard-modal';

    let rowsHtml = '';
    if (entries.length === 0) {
      rowsHtml = '<div class="lb-empty">Chưa có điểm nào. Hãy chơi nào! 🎮</div>';
    } else {
      const medals = ['🥇', '🥈', '🥉'];
      rowsHtml = entries.map((e, i) => `
        <div class="lb-row ${currentScore === e.score ? 'lb-row-highlight' : ''}">
          <span class="lb-rank">${medals[i] || (i + 1)}</span>
          <span class="lb-name">${e.name}</span>
          <span class="lb-score">${e.score}</span>
        </div>
      `).join('');
    }

    overlay.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="lb-close">✕</button>
        <h2 style="text-align:center; margin-bottom: 0.5rem;">🏆 Bảng Xếp Hạng</h2>
        <div class="divider"></div>
        <div class="lb-list">${rowsHtml}</div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .lb-list { margin-top: 1rem; }
      .lb-row { display: flex; align-items: center; padding: 0.6rem 0.75rem; border-radius: 0.5rem; margin-bottom: 0.25rem; background: var(--bg-surface); }
      .lb-row-highlight { background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.3); }
      .lb-rank { width: 36px; font-size: 1.25rem; text-align: center; }
      .lb-name { flex: 1; font-weight: 600; }
      .lb-score { font-weight: 800; color: var(--color-secondary); font-size: 1.1rem; }
      .lb-empty { text-align: center; color: var(--text-secondary); padding: 2rem 0; }
    `;
    overlay.appendChild(style);

    container.appendChild(overlay);

    overlay.querySelector('#lb-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  /** Prompt for name and save */
  saveWithPrompt(container, score, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'name-prompt';

    overlay.innerHTML = `
      <div class="modal-content" style="text-align: center;">
        <h3 style="margin-bottom: 1rem;">🎉 Nhập tên của bạn</h3>
        <input type="text" id="player-name" 
          placeholder="Tên người chơi..." 
          maxlength="15"
          style="width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid var(--bg-glass-border); 
          background: var(--bg-surface); color: var(--text-primary); font-size: 1.1rem; font-family: var(--font-primary);
          outline: none; text-align: center; margin-bottom: 1rem;"
        />
        <button class="btn btn-golden" id="btn-save-score" style="width: 100%;">💾 Lưu Điểm</button>
      </div>
    `;

    container.appendChild(overlay);

    const input = overlay.querySelector('#player-name');
    input.focus();

    const save = () => {
      const name = input.value.trim() || 'Người chơi';
      this.leaderboard.save(this.gameId, name, score);
      overlay.remove();
      if (callback) callback(name);
    };

    overlay.querySelector('#btn-save-score').addEventListener('click', save);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
  }
}
