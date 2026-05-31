const HOTSPOT = { x: 17, y: 17 };

export function initCatCursor() {
  const cursor = document.querySelector('[data-cat-cursor]');
  if (!cursor) return;

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) {
    cursor.remove();
    return;
  }

  document.documentElement.classList.add('cat-cursor-enabled');

  const moveCursor = (event) => {
    cursor.classList.add('is-active');
    cursor.style.transform = `translate3d(${event.clientX - HOTSPOT.x}px, ${event.clientY - HOTSPOT.y}px, 0)`;
  };

  window.addEventListener('pointermove', moveCursor, { passive: true });
  window.addEventListener('pointerover', moveCursor, { passive: true });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-click'), { passive: true });
  window.addEventListener('pointerup', () => cursor.classList.remove('is-click'), { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) cursor.classList.add('is-active');
  });
}
