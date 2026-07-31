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
  btn.addEventListener('click', () => {
    window.location.href = '/';
  });
  container.appendChild(btn);
  return btn;
}
