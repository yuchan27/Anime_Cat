const THEMES = ['classic', 'future'];

export function initExperienceShell() {
  const initialTheme = 'classic';
  applyTheme(initialTheme);
  initThemeGate();
  initThemeSwitch();
  initPageShell();
}

function initThemeGate() {
  const gate = document.querySelector('[data-style-gate]');
  if (!gate) return;

  const buttons = Array.from(gate.querySelectorAll('[data-theme-choice]'));
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const theme = THEMES.includes(button.dataset.themeChoice) ? button.dataset.themeChoice : 'classic';
      buttons.forEach((item) => { item.disabled = true; });
      applyTheme(theme);

      if (theme === 'future') {
        await runFutureLoader(gate);
      } else {
        await runClassicLoader(gate);
      }

      gate.classList.add('is-hidden');
      window.setTimeout(() => gate.remove(), 420);
    }, { once: true });
  });
}

function initThemeSwitch() {
  const button = document.querySelector('[data-theme-switch]');
  if (!button) return;

  const updateLabel = () => {
    const isFuture = document.documentElement.classList.contains('theme-future');
    button.textContent = isFuture ? '原版經典' : '未來科技';
    button.setAttribute('aria-label', isFuture ? '切換為原版經典風格' : '切換為未來科技風格');
  };

  button.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('theme-future') ? 'classic' : 'future';
    applyTheme(next);
    document.body.classList.add('theme-switching');
    window.setTimeout(() => document.body.classList.remove('theme-switching'), 520);
  });

  document.addEventListener('catlab:themechange', updateLabel);
  updateLabel();
}

function applyTheme(theme) {
  const normalized = THEMES.includes(theme) ? theme : 'classic';
  document.documentElement.classList.toggle('theme-future', normalized === 'future');
  document.documentElement.classList.toggle('theme-classic', normalized === 'classic');
  document.body.dataset.theme = normalized;
  document.dispatchEvent(new CustomEvent('catlab:themechange', { detail: { theme: normalized } }));
}

function runClassicLoader(gate) {
  const bar = gate.querySelector('[data-loader-bar]');
  const count = gate.querySelector('[data-loader-count]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 260 : 980;

  return animateProgress({
    duration,
    onUpdate: (progress) => {
      if (bar) bar.style.width = `${progress}%`;
      if (count) count.textContent = `${progress}%`;
    }
  });
}

function runFutureLoader(gate) {
  const canvas = gate.querySelector('[data-tech-loader-canvas]');
  const bar = gate.querySelector('[data-loader-bar]');
  const count = gate.querySelector('[data-loader-count]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gate.classList.add('is-tech-loading');
  if (!canvas || reduced) {
    return animateProgress({
      duration: reduced ? 360 : 960,
      onUpdate: (progress) => {
        if (bar) bar.style.width = `${progress}%`;
        if (count) count.textContent = `${progress}%`;
      }
    });
  }

  return new Promise((resolve) => {
    const ctx = canvas.getContext('2d');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const particles = createLoaderParticles(260);
    const duration = 2850;
    const startedAt = performance.now();

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      const progress = Math.round(t * 100);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const converge = easeInCubic(Math.min(1, t / 0.72));
      const explode = t <= 0.72 ? 0 : easeOutCubic((t - 0.72) / 0.28);

      if (bar) bar.style.width = `${progress}%`;
      if (count) count.textContent = `${progress}%`;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(4, 10, 24, 0.38)';
      ctx.fillRect(0, 0, w, h);

      particles.forEach((particle) => {
        const gatherX = lerp(particle.x, cx + Math.cos(particle.angle) * particle.gatherRadius, converge);
        const gatherY = lerp(particle.y, cy + Math.sin(particle.angle) * particle.gatherRadius, converge);
        const x = lerp(gatherX, cx + Math.cos(particle.angle) * particle.blastRadius, explode);
        const y = lerp(gatherY, cy + Math.sin(particle.angle) * particle.blastRadius, explode);
        const speedGlow = 0.28 + converge * 0.62 + explode * 0.5;
        const size = particle.size * (1 + converge * 0.55 + explode * 1.5);

        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = Math.min(1, speedGlow);
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 0.22 + converge * 0.45;
      ctx.strokeStyle = '#6ff8ff';
      ctx.lineWidth = 1.4 + converge * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 18 + converge * 22 + explode * 260, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (t < 1) requestAnimationFrame(draw);
      else {
        window.removeEventListener('resize', resize);
        resolve();
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  });
}

function initPageShell() {
  const shell = document.querySelector('[data-page-shell]');
  if (!shell) return;

  const sections = Array.from(shell.querySelectorAll(':scope > section'));
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"], .hero__actions a[href^="#"], .site-footer a[href^="#"]'));
  const previous = document.querySelector('[data-page-prev]');
  const next = document.querySelector('[data-page-next]');
  const status = document.querySelector('[data-page-status]');
  let activeIndex = Math.max(0, sections.findIndex((section) => `#${section.id}` === window.location.hash));

  document.body.classList.add('page-mode');
  sections.forEach((section, index) => {
    section.classList.add('page-panel');
    section.dataset.pageIndex = String(index);
  });

  const setActive = (nextIndex, { replaceHash = true } = {}) => {
    const bounded = clamp(nextIndex, 0, sections.length - 1);
    const direction = bounded >= activeIndex ? 'forward' : 'back';
    activeIndex = bounded;

    document.body.dataset.pageDirection = direction;
    sections.forEach((section, index) => {
      const active = index === activeIndex;
      section.classList.toggle('is-page-active', active);
      section.setAttribute('aria-hidden', String(!active));
      if (active) {
        section.querySelectorAll('[data-reveal]').forEach((node) => node.classList.add('is-visible'));
      }
    });

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${sections[activeIndex].id}`;
      link.classList.toggle('is-active', active);
      if (link.closest('.site-nav')) {
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    });

    if (previous) previous.disabled = activeIndex === 0;
    if (next) next.disabled = activeIndex === sections.length - 1;
    if (status) status.textContent = `${activeIndex + 1} / ${sections.length}`;
    if (replaceHash) history.replaceState(null, '', `#${sections[activeIndex].id}`);

    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
  };

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href')?.slice(1);
      const index = sections.findIndex((section) => section.id === id);
      if (index < 0) return;
      event.preventDefault();
      setActive(index);
    });
  });

  previous?.addEventListener('click', () => setActive(activeIndex - 1));
  next?.addEventListener('click', () => setActive(activeIndex + 1));

  window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') setActive(activeIndex - 1);
    if (event.key === 'ArrowRight') setActive(activeIndex + 1);
  });

  window.addEventListener('hashchange', () => {
    const index = sections.findIndex((section) => `#${section.id}` === window.location.hash);
    if (index >= 0) setActive(index, { replaceHash: false });
  });

  setActive(activeIndex, { replaceHash: Boolean(window.location.hash) });
}

function createLoaderParticles(count) {
  const colors = ['#6ff8ff', '#dce86a', '#f36f52', '#a79bff', '#f7f2e4'];
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + Math.random() * 0.4;
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      angle,
      gatherRadius: 8 + Math.random() * 36,
      blastRadius: Math.max(window.innerWidth, window.innerHeight) * (0.35 + Math.random() * 0.62),
      size: 1.2 + Math.random() * 2.8,
      color: colors[index % colors.length]
    };
  });
}

function animateProgress({ duration, onUpdate }) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      onUpdate(Math.round(easeOutCubic(t) * 100));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeInCubic(value) {
  return value * value * value;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
