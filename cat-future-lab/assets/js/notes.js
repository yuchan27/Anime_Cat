let gsapModule;

export async function initNotesDeck() {
  const deck = document.querySelector('[data-notes-deck]');
  if (!deck) return;

  const viewport = deck.querySelector('[data-notes-viewport]');
  const track = deck.querySelector('[data-notes-track]');
  const slides = Array.from(deck.querySelectorAll('[data-note-slide]'));
  const prev = deck.querySelector('[data-notes-prev]');
  const next = deck.querySelector('[data-notes-next]');
  const counter = deck.querySelector('[data-notes-counter]');

  if (!viewport || !track || !slides.length || !prev || !next || !counter) return;

  const gsap = document.documentElement.classList.contains('reduced-performance')
    ? null
    : await loadGsap();
  const state = {
    index: 0,
    width: viewport.clientWidth
  };

  const prefersReduced = () => document.documentElement.classList.contains('reduce-motion');

  const updateCounter = () => {
    counter.textContent = `${state.index + 1} / ${slides.length}`;
  };

  const syncSlideState = () => {
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-note-active', idx === state.index);
      slide.setAttribute('aria-hidden', String(idx !== state.index));
    });
  };

  const snapTrack = (animate = true) => {
    const x = -state.index * state.width;
    if (gsap && animate && !prefersReduced()) {
      gsap.to(track, { x, duration: 0.55, ease: 'power3.out', force3D: true });
    } else {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    syncSlideState();
    updateCounter();
    prev.disabled = state.index <= 0;
    next.disabled = state.index >= slides.length - 1;
  };

  const goTo = (nextIndex, animate = true) => {
    state.index = clamp(nextIndex, 0, slides.length - 1);
    snapTrack(animate);
  };

  prev.addEventListener('click', () => goTo(state.index - 1));
  next.addEventListener('click', () => goTo(state.index + 1));

  deck.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(state.index - 1);
    if (event.key === 'ArrowRight') goTo(state.index + 1);
  });

  window.addEventListener('resize', () => {
    state.width = viewport.clientWidth;
    snapTrack(false);
  }, { passive: true });

  snapTrack(false);
}

async function loadGsap() {
  if (gsapModule !== undefined) return gsapModule;
  try {
    const mod = await import('gsap');
    gsapModule = mod.gsap || mod.default || null;
  } catch {
    gsapModule = null;
  }
  return gsapModule;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
