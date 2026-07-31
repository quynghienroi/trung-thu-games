/**
 * ⏱️ Countdown Timer Component
 * Đồng hồ đếm ngược hiển thị trên HUD
 */
export class CountdownTimer {
  constructor(duration) {
    this.duration = duration;
    this.remaining = duration;
    this.running = false;
    this.onTick = null;
    this.onComplete = null;
  }

  start() {
    this.remaining = this.duration;
    this.running = true;
  }

  update(dt) {
    if (!this.running) return;
    this.remaining -= dt;
    if (this.onTick) this.onTick(this.remaining);
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.running = false;
      if (this.onComplete) this.onComplete();
    }
  }

  get progress() {
    return Math.max(0, this.remaining / this.duration);
  }

  get isWarning() {
    return this.remaining <= 10;
  }

  get isDanger() {
    return this.remaining <= 5;
  }

  get display() {
    const s = Math.ceil(Math.max(0, this.remaining));
    return `${s}`;
  }

  pause() { this.running = false; }
  resume() { this.running = true; }
  reset() { this.remaining = this.duration; this.running = false; }
}
