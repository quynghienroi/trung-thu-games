/**
 * ⬅️ Back Button Component
 * Nút quay lại trang Hub
 */
export function createBackButton(container) {
  const btn = document.createElement('button');
  btn.className = 'back-btn';
  btn.id = 'back-btn';
  btn.innerHTML = '←';
  btn.title = 'Về trang chủ';
  btn.addEventListener('click', () => { if(window.parent !== window) { window.parent.postMessage('close-game', '*'); } else { window.location.href = import.meta.env.BASE_URL; } };);
  container.appendChild(btn);
  return btn;
}
