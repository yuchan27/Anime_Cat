let animeModule;

const reduceMotion = () => document.documentElement.classList.contains('reduce-motion');

export async function initPageAnimations() {
  prepareSignalPath();
  if (reduceMotion()) return;

  const anime = await loadAnime();
  if (!anime) {
    revealSignalPath();
    return;
  }

  const signalPath = document.querySelector('[data-signal-path]');
  const metricNode = document.querySelector('[data-metric-value]');

  anime.timeline({ easing: 'easeOutExpo' })
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
    }, '-=520')
    .add({
      targets: '.hero-signal-widget',
      translateY: [22, 0],
      opacity: [0, 1],
      duration: 620
    }, '-=460')
    .add({
      targets: signalPath,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 980
    }, '-=520');

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
    targets: '.hero-signal-node',
    scale: [1, 1.15, 1],
    delay: anime.stagger(220),
    duration: 1700,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '.hero-signal-eye',
    strokeDashoffset: [34, 0, 34],
    duration: 2200,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '[data-hero-arm]',
    rotate: [-8, 14, -10, 12, -8],
    duration: 1100,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '[data-hero-forearm]',
    rotate: [14, -20, 15, -16, 14],
    duration: 1100,
    easing: 'easeInOutSine',
    loop: true
  });

  anime({
    targets: '.signal-panel__image',
    scale: [1.01, 1.04, 1.01],
    duration: 6200,
    easing: 'easeInOutSine',
    loop: true
  });
}

export async function animateRevealedSection(node) {
  if (reduceMotion() || !node) return;
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
