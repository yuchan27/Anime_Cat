export function initMotionPreference() {
  const button = document.querySelector('[data-motion-toggle]');
  const stored = localStorage.getItem('cat-future-reduced-motion');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldReduce = stored ? stored === 'true' : prefersReduced;

  applyMotionPreference(shouldReduce, button);

  button?.addEventListener('click', () => {
    const next = !document.documentElement.classList.contains('reduce-motion');
    localStorage.setItem('cat-future-reduced-motion', String(next));
    applyMotionPreference(next, button);
  });
}

export function initRevealObserver(onReveal = () => {}) {
  const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!nodes.length) return;

  if (document.documentElement.classList.contains('reduce-motion')) {
    nodes.forEach((node) => {
      node.classList.add('is-visible');
      onReveal(node);
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      onReveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  nodes.forEach((node) => observer.observe(node));
}

function applyMotionPreference(shouldReduce, button) {
  document.documentElement.classList.toggle('reduce-motion', shouldReduce);
  button?.setAttribute('aria-pressed', String(shouldReduce));
}
