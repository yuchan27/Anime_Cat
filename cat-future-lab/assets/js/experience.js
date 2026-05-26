import {
  BACKGROUND_PRESET_MAP,
  FONT_SCALE_MAP,
  FONT_SIZE_LABELS,
  PAGE_MAP,
  SHAPE_MODE_MAP,
  THEME_TOKEN_MAP
} from './config.js';
import { getReadableTextColor, handleAIAction, pageIdFromHash } from './aiActions.js';
import { getState, hasPersistedSettings, subscribeState, updateState } from './state.js';

const THEMES = ['future', 'cat'];

export function initExperienceShell() {
  applyVisualState(getState());
  initPerformanceGuard();
  initThemeGate();
  initThemeSwitch();
  initResetSettings();
  initFontSizeSwitcher();
  initPageShell();
  initWheelNavigator();
  initProgressLine();
  initMarqueeBar();
  subscribeState(applyVisualState);
}

function initThemeGate() {
  const gate = document.querySelector('[data-style-gate]');
  if (!gate) return;

  if (hasPersistedSettings()) {
    gate.remove();
    return;
  }

  const buttons = Array.from(gate.querySelectorAll('[data-theme-choice]'));
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const theme = THEMES.includes(button.dataset.themeChoice) ? button.dataset.themeChoice : 'cat';
      buttons.forEach((item) => { item.disabled = true; });
      handleAIAction({ action: 'setTheme', theme });

      if (theme === 'future') {
        await runFutureLoader(gate);
      } else {
        await runCatLoader(gate);
      }

      gate.classList.add('is-hidden');
      window.setTimeout(() => gate.remove(), 420);
    }, { once: true });
  });
}

function initThemeSwitch() {
  const button = document.querySelector('[data-theme-switch]');
  if (!button) return;

  button.addEventListener('click', () => {
    const next = getState().theme === 'future' ? 'cat' : 'future';
    handleAIAction({ action: 'setTheme', theme: next });
    document.body.classList.add('theme-switching');
    window.setTimeout(() => document.body.classList.remove('theme-switching'), 520);
  });
}

function initResetSettings() {
  const button = document.querySelector('[data-reset-settings]');
  if (!button) return;

  button.addEventListener('click', () => {
    handleAIAction({ action: 'resetSettings' });
    document.body.classList.add('theme-switching');
    window.setTimeout(() => document.body.classList.remove('theme-switching'), 520);
  });
}

function initFontSizeSwitcher() {
  const buttons = Array.from(document.querySelectorAll('[data-font-size]'));
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const size = button.dataset.fontSize;
      handleAIAction({ action: 'setFontSize', size });
    });
  });
}

function initPageShell() {
  const shell = document.querySelector('[data-page-shell]');
  if (!shell) return;

  const sectionByPage = getSectionByPage();
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"], .hero__actions a[href^="#"], .site-footer a[href^="#"]'));
  const previous = document.querySelector('[data-page-prev]');
  const next = document.querySelector('[data-page-next]');
  const status = document.querySelector('[data-page-status]');
  const initialPage = pageIdFromHash(window.location.hash);

  document.body.classList.add('page-mode');
  PAGE_MAP.forEach((page, index) => {
    const section = sectionByPage.get(page.id);
    if (!section) return;
    section.classList.add('page-panel');
    section.dataset.pageId = page.id;
    section.dataset.pageIndex = String(index);
  });

  if (initialPage) {
    updateState({ currentPage: initialPage });
  }

  subscribeState((state) => {
    const activePage = PAGE_MAP[state.pageIndex] || PAGE_MAP[0];
    const direction = state.pageIndex >= Number(document.body.dataset.previousPageIndex || 0) ? 'forward' : 'back';
    document.body.dataset.pageDirection = direction;
    document.body.dataset.previousPageIndex = String(state.pageIndex);

    PAGE_MAP.forEach((page) => {
      const section = sectionByPage.get(page.id);
      if (!section) return;
      const active = page.id === state.currentPage;
      section.classList.toggle('is-page-active', active);
      section.setAttribute('aria-hidden', String(!active));
      if (active) {
        section.querySelectorAll('[data-reveal]').forEach((node) => node.classList.add('is-visible'));
        section.scrollTop = 0;
      }
    });

    navLinks.forEach((link) => {
      const pageId = pageIdFromHash(link.getAttribute('href'));
      const active = pageId === state.currentPage;
      link.classList.toggle('is-active', active);
      if (link.closest('.site-nav')) {
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    });

    if (previous) previous.disabled = state.pageIndex === 0;
    if (next) next.disabled = state.pageIndex === PAGE_MAP.length - 1;
    if (status) status.textContent = `${activePage.label} ${state.pageIndex + 1} / ${PAGE_MAP.length}`;

    history.replaceState(null, '', `#${state.currentPage}`);
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const pageId = pageIdFromHash(link.getAttribute('href'));
      if (!pageId) return;
      event.preventDefault();
      handleAIAction({ action: 'goToPage', target: pageId });
    });
  });

  previous?.addEventListener('click', () => handleAIAction({ action: 'previousPage' }));
  next?.addEventListener('click', () => handleAIAction({ action: 'nextPage' }));

  window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target?.closest?.('[data-notes-deck]')) return;
    if (event.key === 'ArrowLeft') handleAIAction({ action: 'previousPage' });
    if (event.key === 'ArrowRight') handleAIAction({ action: 'nextPage' });
  });

  window.addEventListener('hashchange', () => {
    const pageId = pageIdFromHash(window.location.hash);
    if (pageId) handleAIAction({ action: 'goToPage', target: pageId });
  });

  initSwipeNavigation(shell);
}

function initWheelNavigator() {
  const nav = document.querySelector('[data-wheel-nav]');
  if (!nav) return;

  nav.innerHTML = PAGE_MAP.map((page, index) => `
    <button class="wheel-nav__node" type="button" data-wheel-page="${page.id}" aria-label="切換到${page.label}頁">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <strong>${page.label}</strong>
    </button>
  `).join('');

  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wheel-page]');
    if (!button) return;
    handleAIAction({ action: 'goToPage', target: button.dataset.wheelPage });
  });

  subscribeState((state) => {
    nav.querySelectorAll('[data-wheel-page]').forEach((button) => {
      const active = button.dataset.wheelPage === state.currentPage;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  });
}

function initProgressLine() {
  subscribeState((state) => {
    const ratio = state.progress / 100;
    document.documentElement.style.setProperty('--progress-ratio', String(ratio));
    document.documentElement.style.setProperty('--progress-percent', `${state.progress}%`);
    document.body.classList.toggle('is-completed', state.isCompleted);
  });
}

function initMarqueeBar() {
  const textNodes = Array.from(document.querySelectorAll('[data-marquee-text]'));
  if (!textNodes.length) return;

  subscribeState((state) => {
    textNodes.forEach((node) => {
      node.textContent = state.marqueeText;
    });
  });
}

function initSwipeNavigation(shell) {
  let drag = null;

  shell.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || isTypingTarget(event.target)) return;
    drag = {
      startX: event.clientX,
      startY: event.clientY
    };
  });

  shell.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag = null;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    handleAIAction({ action: dx < 0 ? 'nextPage' : 'previousPage' });
  });

  shell.addEventListener('pointercancel', () => {
    drag = null;
  });
}

function applyVisualState(state) {
  const root = document.documentElement;
  const tokens = THEME_TOKEN_MAP[state.theme] || THEME_TOKEN_MAP.cat;
  const preset = BACKGROUND_PRESET_MAP[state.backgroundPreset] || BACKGROUND_PRESET_MAP.default;
  const customColor = state.customBackgroundColor;
  const bgMain = customColor || resolvePresetBg(preset.bgMain, tokens);
  const readableText = customColor ? getReadableTextColor(customColor) : tokens.textMain;
  const fontScale = FONT_SCALE_MAP[state.fontSize] || 1;
  const shape = SHAPE_MODE_MAP[state.shapeMode] || SHAPE_MODE_MAP.sharp;

  root.classList.toggle('theme-future', state.theme === 'future');
  root.classList.toggle('theme-cat', state.theme === 'cat');
  document.body.dataset.theme = state.theme;
  document.body.dataset.backgroundPreset = state.backgroundPreset;
  document.body.dataset.customBackground = state.customBackgroundColor ? 'true' : 'false';
  document.body.dataset.fontSize = state.fontSize;
  document.body.dataset.shapeMode = state.shapeMode;
  document.body.dataset.presentationMode = state.presentationMode;

  setVars({
    '--theme-bg-main': tokens.bgMain,
    '--bg-main': bgMain,
    '--bg-panel': tokens.bgPanel,
    '--bg-overlay': preset.overlay || 'none',
    '--text-main': readableText,
    '--text-muted': customColor ? colorMix(readableText, 0.68) : tokens.textMuted,
    '--accent-main': tokens.accentMain,
    '--accent-secondary': tokens.accentSecondary,
    '--border-subtle': tokens.borderSubtle,
    '--ink': readableText,
    '--paper': bgMain,
    '--moss': tokens.moss,
    '--cyan': tokens.cyan,
    '--coral': tokens.coral,
    '--violet': tokens.violet,
    '--clay': tokens.clay,
    '--line': tokens.line,
    '--line-strong': tokens.lineStrong,
    '--font-scale': String(fontScale),
    '--shadow': shape.shapeShadow,
    '--surface-radius': shape.surfaceRadius,
    '--control-radius': shape.controlRadius,
    '--shape-shadow': shape.shapeShadow,
    '--panel-blur': shape.panelBlur
  });

  document.querySelectorAll('[data-theme-switch]').forEach((button) => {
    button.textContent = state.theme === 'future' ? '可愛貓咪' : '未來科技';
    button.setAttribute('aria-label', state.theme === 'future' ? '切換成可愛動畫貓咪主題' : '切換成未來科技發展主題');
  });

  document.querySelectorAll('[data-font-size]').forEach((button) => {
    const active = button.dataset.fontSize === state.fontSize;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function initPerformanceGuard() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
  const narrowMobile = window.matchMedia('(max-width: 520px)').matches;
  const reduced = prefersReduced || (lowMemory && narrowMobile);
  document.documentElement.classList.toggle('reduced-performance', reduced);
  if (reduced) updateState({ performanceMode: 'reduced' }, { persist: false });
}

function getSectionByPage() {
  const map = new Map();
  PAGE_MAP.forEach((page) => {
    const section = document.getElementById(page.domId);
    if (section) map.set(page.id, section);
  });
  return map;
}

function runCatLoader(gate) {
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
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduced-performance');

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
    if (!ctx) {
      resolve();
      return;
    }
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const particles = createLoaderParticles(220);
    const duration = 2600;
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

function setVars(values) {
  Object.entries(values).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });
}

function resolvePresetBg(value, tokens) {
  return value === 'var(--theme-bg-main)' ? tokens.bgMain : value;
}

function colorMix(color, alpha) {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
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
