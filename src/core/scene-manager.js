/**
 * 🎬 Scene Manager
 * Quản lý chuyển cảnh: start → playing → gameover → leaderboard
 */
export class SceneManager {
  constructor() {
    this.scenes = {};
    this.current = null;
    this.previous = null;
  }

  /** Register a scene */
  add(name, scene) {
    this.scenes[name] = scene;
  }

  /** Switch to a scene */
  switchTo(name, data = {}) {
    if (this.current && this.scenes[this.current]) {
      const prev = this.scenes[this.current];
      if (prev.exit) prev.exit();
    }
    this.previous = this.current;
    this.current = name;
    const next = this.scenes[name];
    if (next && next.enter) next.enter(data);
  }

  /** Update current scene */
  update(dt) {
    const scene = this.scenes[this.current];
    if (scene && scene.update) scene.update(dt);
  }

  /** Render current scene */
  render(ctx, dt) {
    const scene = this.scenes[this.current];
    if (scene && scene.render) scene.render(ctx, dt);
  }

  /** Get current scene object */
  getScene(name) {
    return this.scenes[name] || null;
  }
}
