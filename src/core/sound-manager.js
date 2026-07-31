/**
 * 🔊 Sound Manager (Placeholder)
 * Quản lý âm thanh - có thể thêm file âm thanh sau
 */
export class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    this.volume = 0.5;
  }

  /** Register a sound */
  register(name, src) {
    try {
      const audio = new Audio(src);
      audio.volume = this.volume;
      this.sounds[name] = audio;
    } catch (e) {
      console.warn(`Could not load sound: ${name}`, e);
    }
  }

  /** Play a sound */
  play(name) {
    if (this.muted) return;
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  }

  /** Toggle mute */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /** Set volume (0-1) */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    Object.values(this.sounds).forEach(s => { s.volume = this.volume; });
  }

  /** Stop all sounds */
  stopAll() {
    Object.values(this.sounds).forEach(s => {
      s.pause();
      s.currentTime = 0;
    });
  }
}
