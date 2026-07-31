/**
 * 🖌️ Canvas Utilities
 * Hàm vẽ tiện ích cho Canvas 2D
 */

import { COLORS, FONTS } from './theme.js';

/** Resize canvas to fill container at device pixel ratio */
export function resizeCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { width: rect.width, height: rect.height, dpr };
}

/** Get logical dimensions */
export function getCanvasSize(canvas) {
  const dpr = window.devicePixelRatio || 1;
  return {
    width: canvas.width / dpr,
    height: canvas.height / dpr,
  };
}

/** Clear entire canvas */
export function clearCanvas(ctx, canvas) {
  const { width, height } = getCanvasSize(canvas);
  ctx.clearRect(0, 0, width, height);
}

/** Draw emoji as sprite */
export function drawEmoji(ctx, emoji, x, y, size) {
  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  ctx.restore();
}

/** Draw text with options */
export function drawText(ctx, text, x, y, options = {}) {
  const {
    size = FONTS.sizes.base,
    color = COLORS.textPrimary,
    align = 'center',
    baseline = 'middle',
    weight = FONTS.weights.bold,
    font = FONTS.primary,
    shadow = null,
    maxWidth = undefined,
  } = options;

  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (shadow) {
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = shadow.blur || 4;
    ctx.shadowOffsetX = shadow.x || 0;
    ctx.shadowOffsetY = shadow.y || 2;
  }

  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}

/** Draw rounded rectangle */
export function drawRoundRect(ctx, x, y, w, h, r, options = {}) {
  const {
    fill = null,
    stroke = null,
    lineWidth = 1,
    shadow = null,
  } = options;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);

  if (shadow) {
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = shadow.blur || 8;
    ctx.shadowOffsetX = shadow.x || 0;
    ctx.shadowOffsetY = shadow.y || 4;
  }

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw circle */
export function drawCircle(ctx, x, y, radius, options = {}) {
  const { fill = null, stroke = null, lineWidth = 1 } = options;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw gradient background (night sky) */
export function drawNightSky(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.nightSky);
  gradient.addColorStop(0.5, COLORS.nightMid);
  gradient.addColorStop(1, COLORS.nightEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/** Draw moon */
export function drawMoon(ctx, x, y, radius) {
  ctx.save();
  // Glow
  const glow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 3);
  glow.addColorStop(0, 'rgba(255, 250, 205, 0.3)');
  glow.addColorStop(0.5, 'rgba(255, 250, 205, 0.1)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius * 3, y - radius * 3, radius * 6, radius * 6);
  
  // Moon body
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const moonGrad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
  moonGrad.addColorStop(0, '#FFFDE7');
  moonGrad.addColorStop(1, '#FFE082');
  ctx.fillStyle = moonGrad;
  ctx.fill();
  
  // Craters
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, y - radius * 0.1, radius * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#D4A574';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + radius * 0.3, y + radius * 0.2, radius * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - radius * 0.1, y + radius * 0.35, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
