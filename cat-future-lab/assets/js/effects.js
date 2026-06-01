let gsapInstance;
let scrollTriggerInstance;

const reduceMotion = () => document.documentElement.classList.contains('reduce-motion');
const coarsePointer = () => window.matchMedia('(pointer: coarse)').matches;
const narrowViewport = () => window.matchMedia('(max-width: 900px)').matches;
const reducedPerformance = () => document.documentElement.classList.contains('reduced-performance');
const skipDecorativeEffects = () => (
  reduceMotion() ||
  reducedPerformance() ||
  coarsePointer() ||
  narrowViewport()
);

export async function initGsapEffects() {
  if (skipDecorativeEffects()) return;
  if (document.body.classList.contains('page-mode')) return;

  const gsap = await loadGsap();
  if (!gsap) return;

  initScrollPanels(gsap);
  initParallax(gsap);
  initModuleEntrance(gsap);
  initHoverTilt(gsap);
  initHeroPointerDrift(gsap);
  initTickerPulse(gsap);
}

async function loadGsap() {
  if (gsapInstance !== undefined) return gsapInstance;

  try {
    const gsapMod = await import('gsap');
    const stMod = await import('gsap/ScrollTrigger');
    const gsap = gsapMod.gsap || gsapMod.default;
    const ScrollTrigger = stMod.ScrollTrigger || stMod.default;
    if (gsap && ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      scrollTriggerInstance = ScrollTrigger;
      gsapInstance = gsap;
      return gsapInstance;
    }
  } catch {
    // no-op, fallback to no gsap effects
  }

  gsapInstance = null;
  return gsapInstance;
}

function initParallax(gsap) {
  gsap.to('.signal-panel__image', {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

}

function initScrollPanels(gsap) {
  const targets = [
    '.section-heading',
    '.assistant-panel',
    '.weather-panel',
    '.video-placeholder',
    '.gallery-preview'
  ];

  targets.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      gsap.fromTo(
        node,
        { y: 24, opacity: 0.42 },
        {
          y: 0,
          opacity: 1,
          duration: 0.74,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: node,
            start: 'top 86%',
            once: true
          }
        }
      );
    });
  });
}

function initModuleEntrance(gsap) {
  const cards = Array.from(document.querySelectorAll('.module-card'));
  if (!cards.length) return;

  gsap.fromTo(
    cards,
    { y: 22, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.62,
      ease: 'power2.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '#modules',
        start: 'top 74%',
        once: true
      }
    }
  );
}

function initHoverTilt(gsap) {
  const targets = document.querySelectorAll('.photo-card, .story-card');
  targets.forEach((node) => {
    node.addEventListener('pointermove', (event) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(node, {
        rotateY: x * 4,
        rotateX: -y * 4,
        transformPerspective: 700,
        transformOrigin: 'center',
        duration: 0.26,
        ease: 'power2.out'
      });
    });
    node.addEventListener('pointerleave', () => {
      gsap.to(node, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
    });
  });
}

function initHeroPointerDrift(gsap) {
  const hero = document.querySelector('#hero');
  const panel = document.querySelector('.signal-panel');
  if (!hero || !panel) return;

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    gsap.to(panel, {
      rotateY: x * 2.8,
      rotateX: -y * 1.8,
      transformPerspective: 1000,
      transformOrigin: 'center',
      duration: 0.25,
      ease: 'power2.out'
    });
  });

  hero.addEventListener('pointerleave', () => {
    gsap.to(panel, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.35,
      ease: 'power2.out'
    });
  });
}

function initTickerPulse(gsap) {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  gsap.to('.hero', {
    '--ticker-shift': 1,
    duration: 4.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
}
