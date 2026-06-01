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
    slideWidth: 0,
    spreadSize: 1
  };

  const prefersReduced = () => document.documentElement.classList.contains('reduce-motion');
  const getCurrentSpreadSize = () => {
    const width = viewport.getBoundingClientRect().width || viewport.clientWidth || window.innerWidth;
    return width >= 860 ? 2 : 1;
  };

  const getMaxIndex = () => Math.max(0, slides.length - state.spreadSize);

  const normalizeIndex = (index) => {
    const maxIndex = getMaxIndex();
    const clamped = clamp(index, 0, maxIndex);
    return state.spreadSize > 1 ? clamped - (clamped % state.spreadSize) : clamped;
  };

  const measureSlideWidth = () => {
    const rect = viewport.getBoundingClientRect();
    const measured = (rect.width || viewport.clientWidth || track.clientWidth) / state.spreadSize;
    state.slideWidth = measured || 0;
  };

  const updateCounter = () => {
    const start = state.index + 1;
    const end = Math.min(slides.length, state.index + state.spreadSize);
    counter.textContent = start === end ? `${start} / ${slides.length}` : `${start}-${end} / ${slides.length}`;
  };

  const syncSlideState = () => {
    slides.forEach((slide, idx) => {
      const active = idx >= state.index && idx < state.index + state.spreadSize;
      slide.classList.toggle('is-note-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
  };

  const snapTrack = (animate = true) => {
    state.spreadSize = getCurrentSpreadSize();
    state.index = normalizeIndex(state.index);
    measureSlideWidth();
    const x = -state.index * state.slideWidth;
    if (gsap && animate && !prefersReduced()) {
      gsap.to(track, {
        x,
        duration: 0.55,
        ease: 'power3.out',
        force3D: true,
        overwrite: true,
        onComplete: () => {
          track.style.transform = `translate3d(${x}px, 0, 0)`;
        }
      });
    } else {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    syncSlideState();
    updateCounter();
    prev.disabled = state.index <= 0;
    next.disabled = state.index >= getMaxIndex();
  };

  const goTo = (nextIndex, animate = true) => {
    state.index = normalizeIndex(nextIndex);
    slides.slice(state.index, state.index + state.spreadSize).forEach((slide) => {
      slide.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
    });
    snapTrack(animate);
  };

  prev.addEventListener('click', () => goTo(state.index - state.spreadSize));
  next.addEventListener('click', () => goTo(state.index + state.spreadSize));

  viewport.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input, select, textarea, video')) return;
    const rect = viewport.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    goTo(state.index + (event.clientX >= midpoint ? state.spreadSize : -state.spreadSize));
  });

  deck.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(state.index - state.spreadSize);
    if (event.key === 'ArrowRight') goTo(state.index + state.spreadSize);
  });

  window.addEventListener('resize', () => {
    const nextSpreadSize = getCurrentSpreadSize();
    if (nextSpreadSize !== state.spreadSize) {
      state.spreadSize = nextSpreadSize;
      state.index = normalizeIndex(state.index);
    }
    measureSlideWidth();
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
