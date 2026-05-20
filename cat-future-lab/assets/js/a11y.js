export function initMotionPreference() {
  const button = document.querySelector('[data-motion-toggle]');
  const stored = localStorage.getItem('cat-future-reduced-motion');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldReduce = stored ? stored === 'true' : prefersReduced;

  document.documentElement.classList.toggle('reduce-motion', shouldReduce);
  button?.setAttribute('aria-pressed', String(shouldReduce));

  button?.addEventListener('click', () => {
    const next = !document.documentElement.classList.contains('reduce-motion');
    document.documentElement.classList.toggle('reduce-motion', next);
    localStorage.setItem('cat-future-reduced-motion', String(next));
    button.setAttribute('aria-pressed', String(next));
  });
}

export function initRevealObserver() {
  const nodes = document.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;

  if (document.documentElement.classList.contains('reduce-motion')) {
    nodes.forEach((node) => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  nodes.forEach((node) => observer.observe(node));
}
