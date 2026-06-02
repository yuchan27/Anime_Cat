export async function initNotesDeck() {
  const deck = document.querySelector('[data-notes-deck]');
  if (!deck) return;

  // 避免重複初始化造成事件被綁多次
  if (deck.dataset.notesInitialized === 'true') return;
  deck.dataset.notesInitialized = 'true';

  const viewport = deck.querySelector('[data-notes-viewport]');
  const track = deck.querySelector('[data-notes-track]');
  const slides = Array.from(deck.querySelectorAll('[data-note-slide]'));
  const prev = deck.querySelector('[data-notes-prev]');
  const next = deck.querySelector('[data-notes-next]');
  const counter = deck.querySelector('[data-notes-counter]');

  if (!viewport || !track || !slides.length || !prev || !next || !counter) return;

  const TURN_MID_MS = 430;
  const TURN_END_MS = 920;
  const SLIDE_SCROLL_STEP = 180;

  const state = {
    index: 0,
    slideWidth: 0,
    spreadSize: 1,
    isTurning: false,
    midTimer: 0,
    endTimer: 0,
    turnId: 0
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
    counter.textContent = start === end
      ? `${start} / ${slides.length}`
      : `${start}-${end} / ${slides.length}`;
  };

  const syncSlideState = () => {
    slides.forEach((slide, idx) => {
      const active = idx >= state.index && idx < state.index + state.spreadSize;
      slide.classList.toggle('is-note-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
  };

  const setButtons = () => {
    prev.disabled = state.isTurning || state.index <= 0;
    next.disabled = state.isTurning || state.index >= getMaxIndex();
  };

  const setTrackPosition = () => {
    const x = -state.index * state.slideWidth;
    track.style.transition = 'none';
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  const snapTrack = () => {
    state.spreadSize = getCurrentSpreadSize();

    deck.classList.toggle('is-two-page-spread', state.spreadSize > 1);
    deck.classList.toggle('is-single-page-spread', state.spreadSize === 1);

    state.index = normalizeIndex(state.index);
    measureSlideWidth();
    setTrackPosition();
    syncSlideState();
    updateCounter();
    setButtons();
  };

  const clearTurnTimers = () => {
    window.clearTimeout(state.midTimer);
    window.clearTimeout(state.endTimer);
    state.midTimer = 0;
    state.endTimer = 0;
  };

  const removeOldTurnSheets = () => {
    viewport.querySelectorAll('.book-turn-sheet').forEach((sheet) => sheet.remove());
  };

  const replaceClonedMedia = (clone) => {
    clone.querySelectorAll('video').forEach((video) => {
      const poster = video.getAttribute('poster');
      const replacement = document.createElement(poster ? 'img' : 'div');

      replacement.className = poster
        ? 'book-turn-media-poster'
        : 'book-turn-media-placeholder';

      if (poster) {
        replacement.src = poster;
        replacement.alt = video.getAttribute('aria-label') ||
          video.getAttribute('title') ||
          '影片預覽圖';
      } else {
        replacement.textContent = '影片預覽';
      }

      video.replaceWith(replacement);
    });
  };

  const cloneSlideForTurn = (index) => {
    const source = slides[clamp(index, 0, slides.length - 1)];
    const clone = source.cloneNode(true);

    clone.removeAttribute('data-note-slide');
    clone.removeAttribute('aria-hidden');
    clone.classList.remove('is-note-active');
    clone.classList.add('book-turn-sheet__content');

    clone.querySelectorAll('[id]').forEach((node) => {
      node.removeAttribute('id');
    });

    clone.querySelectorAll('[tabindex]').forEach((node) => {
      node.setAttribute('tabindex', '-1');
    });

    clone.querySelectorAll('a, button, input, select, textarea').forEach((node) => {
      node.setAttribute('tabindex', '-1');
      node.setAttribute('aria-hidden', 'true');
    });

    replaceClonedMedia(clone);

    return clone;
  };

  const createTurnSheet = (direction, fromIndex, toIndex) => {
    removeOldTurnSheets();

    const sheet = document.createElement('div');
    sheet.className = `book-turn-sheet book-turn-sheet--${direction}`;
    sheet.setAttribute('aria-hidden', 'true');

    const front = document.createElement('div');
    front.className = 'book-turn-sheet__face book-turn-sheet__front';

    const back = document.createElement('div');
    back.className = 'book-turn-sheet__face book-turn-sheet__back';

    if (direction === 'forward') {
      const frontIndex = state.spreadSize > 1 ? fromIndex + state.spreadSize - 1 : fromIndex;
      const backIndex = toIndex;

      front.append(cloneSlideForTurn(frontIndex));
      back.append(cloneSlideForTurn(backIndex));
    } else {
      const frontIndex = fromIndex;
      const backIndex = state.spreadSize > 1 ? toIndex + state.spreadSize - 1 : toIndex;

      front.append(cloneSlideForTurn(frontIndex));
      back.append(cloneSlideForTurn(backIndex));
    }

    sheet.append(front, back);
    viewport.append(sheet);

    return sheet;
  };

  const cleanupTurn = (sheet, turnId = state.turnId) => {
    if (turnId !== state.turnId) return;

    clearTurnTimers();
    sheet?.remove();
    removeOldTurnSheets();

    deck.classList.remove('is-turning-forward', 'is-turning-back', 'is-page-turning');
    document.body.classList.remove('is-notes-page-turning');

    state.isTurning = false;
    track.style.visibility = '';
    setButtons();
  };

  const finishWithoutAnimation = (toIndex) => {
    state.index = toIndex;
    snapTrack();
  };

  const goTo = (nextIndex, animate = true) => {
    if (state.isTurning) return;

    state.spreadSize = getCurrentSpreadSize();

    const fromIndex = state.index;
    const toIndex = normalizeIndex(nextIndex);
    if (toIndex === fromIndex) return;

    slides.slice(fromIndex, fromIndex + state.spreadSize).forEach((slide) => {
      slide.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
    });

    if (!animate || prefersReduced()) {
      finishWithoutAnimation(toIndex);
      return;
    }

    const direction = toIndex > fromIndex ? 'forward' : 'back';
    const sheet = createTurnSheet(direction, fromIndex, toIndex);
    const currentTurnId = state.turnId + 1;

    state.turnId = currentTurnId;
    state.isTurning = true;
    setButtons();

    deck.classList.remove('is-turning-forward', 'is-turning-back');
    deck.classList.add('is-page-turning');
    document.body.classList.add('is-notes-page-turning');

    void deck.offsetWidth;

    deck.classList.add(`is-turning-${direction}`);

    clearTurnTimers();

    requestAnimationFrame(() => {
      if (currentTurnId !== state.turnId) return;
      sheet.classList.add('is-animating');
    });

    state.midTimer = window.setTimeout(() => {
      if (currentTurnId !== state.turnId) return;

      state.index = toIndex;
      snapTrack();

      slides.slice(state.index, state.index + state.spreadSize).forEach((slide) => {
        slide.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
      });
    }, TURN_MID_MS);

    const finishTurn = () => cleanupTurn(sheet, currentTurnId);

    sheet.addEventListener('animationend', (event) => {
      if (event.target === sheet) finishTurn();
    }, { once: true });

    state.endTimer = window.setTimeout(finishTurn, TURN_END_MS);
  };

  const isTypingTarget = (target) => {
    return Boolean(target?.closest?.(
      [
        'input',
        'textarea',
        'select',
        'button',
        'a',
        'video',
        '[contenteditable="true"]',
        '[role="button"]'
      ].join(', ')
    ));
  };

  const hasTextSelection = () => {
    const selection = window.getSelection?.();
    return Boolean(selection && !selection.isCollapsed);
  };

  const isBlankTurnTarget = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return false;

    if (isTypingTarget(target)) return false;
    if (hasTextSelection()) return false;

    /*
      只允許真正空白處翻頁：
      1. 點到 viewport 本身
      2. 點到 track 本身
      3. 點到 note-slide 背景本身

      點到 h3、p、li、ul、figure、figcaption、note-panel、note-kpi、note-media
      都不會翻頁。
    */
    if (target === viewport || target === track) return true;

    const slide = target.closest('[data-note-slide]');
    if (slide && target === slide) return true;

    return false;
  };

  const getActiveSlides = () => {
    return slides.filter((slide, idx) => (
      idx >= state.index && idx < state.index + state.spreadSize
    ));
  };

  const scrollActiveSlides = (deltaY) => {
    getActiveSlides().forEach((slide) => {
      slide.scrollBy?.({
        top: deltaY,
        left: 0,
        behavior: prefersReduced() ? 'auto' : 'smooth'
      });
    });
  };

  const isDeckVisible = () => {
    const panel = deck.closest('.page-panel');
    return !panel || panel.classList.contains('is-page-active');
  };

  const handleDeckKeyboard = (event) => {
    if (!isDeckVisible()) return;
    if (state.isTurning) return;
    if (isTypingTarget(event.target)) return;

    const key = String(event.key || '').toLowerCase();

    if (key === 'arrowleft' || key === 'a') {
      event.preventDefault();
      event.stopPropagation();
      goTo(state.index - state.spreadSize);
      return;
    }

    if (key === 'arrowright' || key === 'd') {
      event.preventDefault();
      event.stopPropagation();
      goTo(state.index + state.spreadSize);
      return;
    }

    if (key === 'arrowup' || key === 'w') {
      event.preventDefault();
      event.stopPropagation();
      scrollActiveSlides(-SLIDE_SCROLL_STEP);
      return;
    }

    if (key === 'arrowdown' || key === 's') {
      event.preventDefault();
      event.stopPropagation();
      scrollActiveSlides(SLIDE_SCROLL_STEP);
    }
  };

  prev.addEventListener('click', () => goTo(state.index - state.spreadSize));
  next.addEventListener('click', () => goTo(state.index + state.spreadSize));

  viewport.addEventListener('click', (event) => {
    if (state.isTurning) return;
    if (!isBlankTurnTarget(event)) return;

    const rect = viewport.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    goTo(state.index + (event.clientX >= midpoint ? state.spreadSize : -state.spreadSize));
  });

  deck.addEventListener('keydown', handleDeckKeyboard);
  window.addEventListener('keydown', handleDeckKeyboard, { capture: true });

  window.addEventListener('resize', () => {
    const nextSpreadSize = getCurrentSpreadSize();

    if (nextSpreadSize !== state.spreadSize) {
      state.spreadSize = nextSpreadSize;
      state.index = normalizeIndex(state.index);
    }

    measureSlideWidth();
    snapTrack();
  }, { passive: true });

  snapTrack();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}