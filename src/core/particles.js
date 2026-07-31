/**
 * ✨ Particle System
 * Confetti, pháo hoa, đom đóm, sparkles
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /** Emit particles at position */
  emit(x, y, options = {}) {
    const {
      count = 20,
      colors = ['#FF6B35', '#FFD700', '#DC143C', '#FF8F5E', '#FFE44D'],
      speed = 200,
      spread = Math.PI * 2,
      angle = -Math.PI / 2,
      life = 1.5,
      size = 6,
      gravity = 300,
      shapes = ['circle', 'square'],
      fadeOut = true,
    } = options;

    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.7 + Math.random() * 0.3),
        maxLife: life,
        size: size * (0.5 + Math.random()),
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        fadeOut,
      });
    }
  }

  /** Confetti burst */
  confetti(x, y) {
    this.emit(x, y, {
      count: 40,
      speed: 400,
      spread: Math.PI * 0.8,
      angle: -Math.PI / 2,
      life: 2,
      size: 8,
      gravity: 400,
      shapes: ['square', 'circle'],
      colors: ['#FF6B35', '#FFD700', '#DC143C', '#10B981', '#3B82F6', '#F472B6'],
    });
  }

  /** Firework burst */
  firework(x, y) {
    this.emit(x, y, {
      count: 60,
      speed: 300,
      spread: Math.PI * 2,
      life: 1.2,
      size: 4,
      gravity: 100,
      colors: ['#FFD700', '#FF6B35', '#FFFACD', '#FFE44D'],
    });
  }

  /** Sparkle effect (score popup) */
  sparkle(x, y, color = '#FFD700') {
    this.emit(x, y, {
      count: 8,
      speed: 100,
      spread: Math.PI * 2,
      life: 0.6,
      size: 4,
      gravity: 0,
      colors: [color, '#FFFFFF'],
      shapes: ['circle'],
    });
  }

  /** Firefly / đom đóm */
  firefly(width, height) {
    this.particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 20,
      life: 3 + Math.random() * 3,
      maxLife: 6,
      size: 2 + Math.random() * 2,
      color: '#FFD700',
      gravity: 0,
      rotation: 0,
      rotationSpeed: 0,
      shape: 'glow',
      fadeOut: true,
      pulse: true,
      pulseSpeed: 2 + Math.random() * 2,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      p.rotation += p.rotationSpeed * dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const alpha = p.fadeOut ? Math.max(0, p.life / p.maxLife) : 1;
      ctx.globalAlpha = p.pulse 
        ? alpha * (0.3 + 0.7 * Math.abs(Math.sin(p.life * p.pulseSpeed)))
        : alpha;

      if (p.shape === 'glow') {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
      } else {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }

  get count() {
    return this.particles.length;
  }
}
