let animeModule;

const reduceMotion = () => document.documentElement.classList.contains('reduce-motion');

export async function initPageAnimations() {
  await waitForPageReady();
  prepareSignalPath();
  if (reduceMotion() || document.documentElement.classList.contains('reduced-performance')) {
    revealSignalPath();
    return;
  }

  const anime = await loadAnime();
  if (!anime) {
    revealSignalPath();
    return;
  }

  document.documentElement.classList.add('has-anime');

  const signalPath = document.querySelector('[data-signal-path]');
  const metricNode = document.querySelector('[data-metric-value]');

  const introTimeline = anime.timeline({ easing: 'easeOutExpo' });

  introTimeline
    .add({
      targets: '[data-animate="hero"] .eyebrow',
      translateY: [18, 0],
      opacity: [0, 1],
      duration: 500
    })
    .add({
      targets: '[data-animate="hero"] .hero-title-line',
      translateY: [66, 0],
      opacity: [0, 1],
      delay: anime.stagger(130),
      duration: 900
    }, '-=220')
    .add({
      targets: '[data-animate="hero"] .hero__lead',
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 740
    }, '-=520')
    .add({
      targets: '[data-animate="hero"] .hero__actions .button',
      translateY: [20, 0],
      opacity: [0, 1],
      delay: anime.stagger(110),
      duration: 620
    }, '-=460');

  if (signalPath) {
    introTimeline.add({
      targets: signalPath,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 980
    }, '-=520');
  }

  if (metricNode) {
    const state = { value: 0 };
    anime({
      targets: state,
      value: 60,
      round: 1,
      duration: 1400,
      easing: 'easeOutCubic',
      update: () => {
        metricNode.textContent = String(state.value);
      }
    });
  }

  anime({
    targets: '.signal-panel__image-stack',
    opacity: [1, 0.96, 1],
    duration: 7600,
    easing: 'easeInOutSine',
    loop: true
  });
}

function waitForPageReady() {
  if (document.body.classList.contains('page-ready')) return Promise.resolve();

  return new Promise((resolve) => {
    const onReady = () => resolve();
    window.addEventListener('catlab:pageready', onReady, { once: true });
  });
}

export async function animateRevealedSection(node) {
  if (reduceMotion() || document.documentElement.classList.contains('reduced-performance') || !node) return;
  if (!node.matches('.module-card, .story-card, .note-slide')) return;

  const anime = await loadAnime();
  if (!anime) return;

  anime({
    targets: node,
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 520,
    easing: 'easeOutCubic'
  });
}

async function loadAnime() {
  if (animeModule !== undefined) return animeModule;

  try {
    const mod = await import('animejs');
    animeModule = mod.default;
  } catch {
    animeModule = null;
  }

  return animeModule;
}

function prepareSignalPath() {
  const signalPath = document.querySelector('[data-signal-path]');
  if (!signalPath) return;
  const length = signalPath.getTotalLength();
  signalPath.style.strokeDasharray = `${length}`;
  signalPath.style.strokeDashoffset = reduceMotion() ? '0' : `${length}`;
}

function revealSignalPath() {
  const signalPath = document.querySelector('[data-signal-path]');
  if (signalPath) signalPath.style.strokeDashoffset = '0';
}
