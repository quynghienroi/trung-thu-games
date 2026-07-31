/**
 * 🎮 Game Loop
 * Chuẩn hóa game loop với deltaTime và FPS tracking
 */
export function createGameLoop(updateFn, renderFn) {
  let lastTime = 0;
  let animId = null;
  let running = false;
  let paused = false;
  let fps = 0;
  let frameCount = 0;
  let fpsTime = 0;

  function loop(timestamp) {
    if (!running) return;
    animId = requestAnimationFrame(loop);

    if (paused) return;

    const deltaTime = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = timestamp;

    // FPS counter
    frameCount++;
    fpsTime += deltaTime;
    if (fpsTime >= 1) {
      fps = frameCount;
      frameCount = 0;
      fpsTime = 0;
    }

    updateFn(deltaTime);
    renderFn(deltaTime);
  }

  return {
    start() {
      if (running) return;
      running = true;
      paused = false;
      lastTime = 0;
      animId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    },
    pause() { paused = true; },
    resume() { paused = false; lastTime = 0; },
    get isPaused() { return paused; },
    get isRunning() { return running; },
    get FPS() { return fps; },
  };
}
