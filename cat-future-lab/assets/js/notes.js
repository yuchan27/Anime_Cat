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
  const zoomInput = deck.querySelector('[data-notes-zoom]');

  if (!viewport || !track || !slides.length || !prev || !next || !counter || !zoomInput) return;

  const gsap = document.documentElement.classList.contains('reduced-performance')
    ? null
    : await loadGsap();
  const state = {
    index: 0,
    width: viewport.clientWidth,
    zoom: Number(zoomInput.value) / 100
  };

  const prefersReduced = () => document.documentElement.classList.contains('reduce-motion');

  const updateCounter = () => {
    counter.textContent = `${state.index + 1} / ${slides.length}`;
  };

  const applyZoom = (scale, animate = true) => {
    slides.forEach((slide, idx) => {
      const target = idx === state.index ? scale : 1;
      if (gsap && animate && !prefersReduced()) {
        gsap.to(slide, { scale: target, duration: 0.32, ease: 'power2.out' });
      } else {
        slide.style.transform = `scale(${target})`;
      }
    });
  };

  const snapTrack = (animate = true) => {
    const x = -state.index * state.width;
    if (gsap && animate && !prefersReduced()) {
      gsap.to(track, { x, duration: 0.55, ease: 'power3.out' });
    } else {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    applyZoom(state.zoom, animate);
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

  zoomInput.addEventListener('input', () => {
    state.zoom = Number(zoomInput.value) / 100;
    applyZoom(state.zoom, true);
  });

  deck.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(state.index - 1);
    if (event.key === 'ArrowRight') goTo(state.index + 1);
  });

  let drag = null;
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = {
      startX: event.clientX,
      startOffset: -state.index * state.width,
      delta: 0
    };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!drag) return;
    drag.delta = event.clientX - drag.startX;
    const x = drag.startOffset + drag.delta;
    if (gsap) {
      gsap.set(track, { x });
    } else {
      track.style.transform = `translate3d(${x}px,0,0)`;
    }
  });

  const endDrag = (event) => {
    if (!drag) return;
    viewport.classList.remove('is-dragging');
    viewport.releasePointerCapture(event.pointerId);
    const threshold = Math.max(70, state.width * 0.12);
    if (drag.delta < -threshold) goTo(state.index + 1);
    else if (drag.delta > threshold) goTo(state.index - 1);
    else snapTrack(true);
    drag = null;
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', (event) => {
    if (drag) endDrag(event);
  });

  let wheelLock = false;
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (wheelLock) return;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (Math.abs(horizontal) < 24) return;
    wheelLock = true;
    goTo(horizontal > 0 ? state.index + 1 : state.index - 1);
    window.setTimeout(() => { wheelLock = false; }, 260);
  }, { passive: false });

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
