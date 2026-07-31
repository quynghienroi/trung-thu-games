/**
 * 🎬 Start Screen Component
 * Màn hình bắt đầu game - DOM overlay
 */
export function createStartScreen(container, { title, description, emoji, onStart }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'start-screen';

  overlay.innerHTML = `
    <div class="modal-content" style="text-align: center;">
      <div class="start-emoji">${emoji}</div>
      <h1 class="start-title">${title}</h1>
      <div class="divider"></div>
      <p class="start-desc">${description}</p>
      <button class="btn btn-golden btn-lg" id="btn-start">🎮 Bắt Đầu!</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .start-emoji { font-size: 5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite; display: inline-block; }
    .start-title { 
      font-size: 2rem; font-weight: 900; 
      background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
      background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .start-desc { 
      font-size: 1rem; color: var(--text-secondary); line-height: 1.8; 
      margin-bottom: 2rem; max-width: 350px; margin-left: auto; margin-right: auto;
    }
    #btn-start { animation: pulseGlow 2s ease-in-out infinite; width: 100%; }
  `;
  overlay.appendChild(style);

  container.appendChild(overlay);

  overlay.querySelector('#btn-start').addEventListener('click', () => {
    overlay.classList.add('animate-fadeOut');
    setTimeout(() => {
      overlay.remove();
      if (onStart) onStart();
    }, 200);
  });

  return overlay;
}
