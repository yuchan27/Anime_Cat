let animeModule;

export async function initCatCursor() {
  const cursor = document.querySelector('[data-cat-cursor]');
  if (!cursor) return;

  const finePointer = window.matchMedia('(pointer: fine)').matches;
  if (!finePointer) {
    cursor.remove();
    return;
  }

  document.documentElement.classList.add('cat-cursor-enabled');

  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    tx: window.innerWidth / 2,
    ty: window.innerHeight / 2,
    vx: 0
  };

  const updateTarget = (event) => {
    state.tx = event.clientX;
    state.ty = event.clientY;
    cursor.classList.add('is-active');
  };

  window.addEventListener('pointermove', updateTarget, { passive: true });
  window.addEventListener('pointerdown', () => cursor.classList.add('is-click'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-click'));
  window.addEventListener('blur', () => cursor.classList.remove('is-active'));

  // Cursor hotspot: align the real pointer near the waving paw rather than the element center.
  const getHotspot = () => {
    const width = cursor.offsetWidth || 68;
    const height = cursor.offsetHeight || 68;
    return {
      x: width * 0.74,
      y: height * 0.52
    };
  };

  const raf = () => {
    state.x += (state.tx - state.x) * 0.44;
    state.y += (state.ty - state.y) * 0.44;
    state.vx = (state.tx - state.x) * 0.16;
    const rotate = Math.max(-18, Math.min(18, state.vx));
    const hotspot = getHotspot();
    cursor.style.transform = `translate3d(${state.x - hotspot.x}px, ${state.y - hotspot.y}px, 0) rotate(${rotate}deg)`;
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);

  const anime = await loadAnime();
  if (!anime) return;

  anime({
    targets: '.cat-cursor__arm',
    rotate: [-10, 14, -9, 8, -10],
    duration: 950,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '.cat-cursor__forearm',
    rotate: [8, -16, 10, -12, 8],
    duration: 950,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '.cat-cursor__head',
    translateY: [0, -2.4, 0],
    duration: 1250,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '.cat-cursor__eyes',
    scaleY: [1, 0.14, 1],
    duration: 170,
    delay: 1600,
    endDelay: 2200,
    loop: true,
    easing: 'easeInOutSine'
  });
}

async function loadAnime() {
  if (animeModule !== undefined) return animeModule;

  try {
    const mod = await import('animejs');
    animeModule = mod.default;
  } catch (error) {
    animeModule = null;
  }

  return animeModule;
}
