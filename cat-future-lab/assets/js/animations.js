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

  anime.timeline({ easing: 'easeOutExpo' })
    .add({
      targets: '[data-animate="hero"] .eyebrow',
      translateY: [18, 0],
      opacity: [0, 1],
      duration: 520
    })
    .add({
      targets: '[data-animate="hero"] h1',
      translateY: [46, 0],
      duration: 920
    }, '-=240')
    .add({
      targets: '[data-animate="hero"] .hero__lead, [data-animate="hero"] .button',
      translateY: [26, 0],
      delay: anime.stagger(110),
      duration: 720
    }, '-=560')
    .add({
      targets: signalPath,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 1100
    }, '-=520');

  anime({
    targets: '.signal-panel__node',
    scale: [1, 1.18, 1],
    delay: anime.stagger(240),
    duration: 1800,
    easing: 'easeInOutSine',
    loop: true
  });
}

export async function animateRevealedSection(node) {
  if (reduceMotion() || !node || !node.matches('.module-card')) return;

  const anime = await loadAnime();
  if (!anime) return;

  anime({
    targets: node,
    translateY: [22, 0],
    opacity: [0, 1],
    duration: 540,
    easing: 'easeOutCubic'
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

function prepareSignalPath() {
  const signalPath = document.querySelector('[data-signal-path]');
  if (!signalPath) return;

  const length = signalPath.getTotalLength();
  signalPath.style.strokeDasharray = length;
  signalPath.style.strokeDashoffset = reduceMotion() ? 0 : length;
}

function revealSignalPath() {
  const signalPath = document.querySelector('[data-signal-path]');
  if (signalPath) signalPath.style.strokeDashoffset = 0;
}
