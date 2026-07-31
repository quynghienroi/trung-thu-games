/**
 * 🏅 Score Display Component
 * Hiển thị điểm số + combo trên Canvas
 */
import { drawText, drawRoundRect } from '../core/canvas-utils.js';
import { COLORS, FONTS } from '../core/theme.js';

export class ScoreDisplay {
  constructor() {
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.popups = [];
  }

  setScore(score) {
    this.score = score;
  }

  addScore(points, x, y) {
    this.score += points;
    this.popups.push({
      text: points > 0 ? `+${points}` : `${points}`,
      x, y,
      life: 1,
      color: points > 0 ? COLORS.secondary : COLORS.danger,
      vy: -80,
    });
  }

  setCombo(combo) {
    this.combo = combo;
  }

  update(dt) {
    // Smooth score animation
    const diff = this.score - this.displayScore;
    this.displayScore += diff * Math.min(1, dt * 10);
    if (Math.abs(diff) < 1) this.displayScore = this.score;

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  render(ctx, width) {
    // Score panel
    const panelX = width - 160;
    const panelY = 16;
    drawRoundRect(ctx, panelX, panelY, 144, 50, 12, {
      fill: 'rgba(0, 0, 0, 0.5)',
      stroke: 'rgba(255, 255, 255, 0.1)',
    });
    drawText(ctx, '⭐', panelX + 26, panelY + 25, {
      size: 20,
      align: 'center',
    });
    drawText(ctx, Math.round(this.displayScore).toString(), panelX + 90, panelY + 25, {
      size: 24,
      weight: FONTS.weights.extrabold,
      color: COLORS.secondary,
      align: 'center',
    });

    // Combo
    if (this.combo > 1) {
      drawText(ctx, `x${this.combo} COMBO!`, width - 88, panelY + 68, {
        size: 16,
        weight: FONTS.weights.bold,
        color: COLORS.primary,
        align: 'center',
        shadow: { color: 'rgba(255, 107, 53, 0.5)', blur: 8 },
      });
    }

    // Score popups
    for (const p of this.popups) {
      const alpha = Math.max(0, p.life);
      const scale = 1 + (1 - p.life) * 0.5;
      drawText(ctx, p.text, p.x, p.y, {
        size: 22 * scale,
        color: p.color,
        weight: FONTS.weights.extrabold,
        shadow: { color: 'rgba(0,0,0,0.5)', blur: 4 },
      });
    }
  }

  reset() {
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.popups = [];
  }
}
