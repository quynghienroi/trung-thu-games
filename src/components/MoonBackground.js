/**
 * 🌙 Moon Background Component
 * Animated night sky background for canvas
 */
import { COLORS } from '../core/theme.js';

export class MoonBackground {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.stars = [];
    this.clouds = [];
    this.time = 0;

    this._initStars();
    this._initClouds();
  }

  _initStars() {
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 0.7,
        size: 0.5 + Math.random() * 2,
        twinkleSpeed: 1 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  _initClouds() {
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: 50 + Math.random() * this.height * 0.4,
        width: 150 + Math.random() * 200,
        height: 30 + Math.random() * 40,
        speed: 5 + Math.random() * 10,
        alpha: 0.02 + Math.random() * 0.04,
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update(dt) {
    this.time += dt;

    // Move clouds
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x > this.width + cloud.width) {
        cloud.x = -cloud.width;
      }
    }
  }

  render(ctx) {
    const { width, height } = this;

    // Night sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLORS.nightSky);
    gradient.addColorStop(0.5, COLORS.nightMid);
    gradient.addColorStop(1, COLORS.nightEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Stars
    for (const star of this.stars) {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.star;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Moon
    const moonX = width * 0.8;
    const moonY = height * 0.15;
    const moonR = Math.min(width, height) * 0.06;

    // Moon glow
    ctx.save();
    const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 4);
    glow.addColorStop(0, 'rgba(255, 250, 205, 0.25)');
    glow.addColorStop(0.5, 'rgba(255, 250, 205, 0.08)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(moonX - moonR * 4, moonY - moonR * 4, moonR * 8, moonR * 8);

    // Moon body
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
    moonGrad.addColorStop(0, '#FFFDE7');
    moonGrad.addColorStop(1, '#FFE082');
    ctx.fillStyle = moonGrad;
    ctx.fill();

    // Moon craters
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#D4A574';
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.2, moonY - moonR * 0.1, moonR * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.3, moonY + moonR * 0.25, moonR * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Clouds
    for (const cloud of this.clouds) {
      ctx.save();
      ctx.globalAlpha = cloud.alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      const cx = cloud.x + cloud.width / 2;
      const cy = cloud.y;
      ctx.ellipse(cx, cy, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(cx - cloud.width * 0.25, cy - cloud.height * 0.2, cloud.width * 0.3, cloud.height * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(cx + cloud.width * 0.2, cy - cloud.height * 0.15, cloud.width * 0.25, cloud.height * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
