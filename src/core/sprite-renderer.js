/**
 * 🎭 Sprite Renderer
 * Vẽ emoji/sprite lên canvas với animation
 */

/** Draw an emoji sprite with rotation and scale */
export function drawSprite(ctx, emoji, x, y, size, rotation = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

/** Draw sprite with bounce animation */
export function drawSpriteWithBounce(ctx, emoji, x, y, size, time, bounceHeight = 5) {
  const offsetY = Math.sin(time * 3) * bounceHeight;
  drawSprite(ctx, emoji, x, y + offsetY, size);
}

/** Draw sprite with pulse animation */
export function drawSpriteWithPulse(ctx, emoji, x, y, baseSize, time, pulseAmount = 0.1) {
  const scale = 1 + Math.sin(time * 4) * pulseAmount;
  drawSprite(ctx, emoji, x, y, baseSize * scale);
}

/** Draw sprite with shadow/glow */
export function drawSpriteGlow(ctx, emoji, x, y, size, glowColor = 'rgba(255, 215, 0, 0.5)', glowSize = 20) {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowSize;
  drawSprite(ctx, emoji, x, y, size);
  ctx.restore();
}
