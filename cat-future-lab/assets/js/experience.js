import {
  BACKGROUND_PRESET_MAP,
  FONT_FAMILY_MAP,
  FONT_SCALE_MAP,
  PAGE_MAP,
  SHAPE_MODE_MAP,
  THEME_TOKEN_MAP
} from './config.js';
import { getReadableTextColor, handleAIAction, pageIdFromHash } from './aiActions.js';
import { getState, subscribeState, updateState } from './state.js';

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
  const markPageReady = () => {
    document.body.classList.add('page-ready', 'initial-reveal');
    window.dispatchEvent(new CustomEvent('catlab:pageready'));
    window.setTimeout(() => {
      document.body.classList.remove('initial-reveal');
    }, 1600);
  };

  if (!gate) {
    markPageReady();
    return;
  }

  document.body.classList.add('gate-open');
  document.body.classList.remove('gate-exiting');

  const buttons = Array.from(gate.querySelectorAll('[data-theme-choice]'));
  buttons.forEach((button) => {
    button.addEventListener('click', async () => {
      const theme = THEMES.includes(button.dataset.themeChoice) ? button.dataset.themeChoice : 'cat';
      buttons.forEach((item) => { item.disabled = true; });
      button.classList.add('is-selected');
      handleAIAction({ action: 'setTheme', theme });

      if (theme === 'future') {
        await runFutureLoader(gate);
      } else {
        await runCatLoader(gate);
      }

      document.body.classList.add('gate-exiting');
      gate.classList.add('is-hidden');
      window.setTimeout(() => {
        gate.remove();
        document.body.classList.remove('gate-open', 'gate-exiting');
        markPageReady();
      }, 820);
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
    window.setTimeout(() => document.body.classList.remove('theme-switching'), 1600);
  });
}

function initResetSettings() {
  const button = document.querySelector('[data-reset-settings]');
  if (!button) return;

  button.addEventListener('click', () => {
    handleAIAction({ action: 'resetSettings' });
    document.body.classList.add('theme-switching');
    window.setTimeout(() => document.body.classList.remove('theme-switching'), 1600);
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

  if (initialPage) updateState({ currentPage: initialPage }, { persist: false });

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
    <button class="wheel-nav__node" type="button" data-wheel-page="${page.id}" aria-label="切換到${page.label}">
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
    if (event.button !== 0 || isTypingTarget(event.target) || isGlobalGestureIgnored(event.target)) return;
    const activePanel = shell.querySelector('.page-panel.is-page-active');
    const panel = event.target.closest('.page-panel');
    if (!panel || panel !== activePanel) return;
    if (event.target !== panel) return;
    drag = {
      startX: event.clientX,
      startY: event.clientY
    };
  });

  shell.addEventListener('pointerup', (event) => {
    if (!drag) return;
    const selection = window.getSelection?.();
    if (selection && !selection.isCollapsed) {
      drag = null;
      return;
    }
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
  const adjustedBackground = customColor || state.backgroundPreset !== 'default';
  const readableText = state.customTextColor ||
    (adjustedBackground ? getReadableTextColor(bgMain) || tokens.textMain : tokens.textMain);
  const surface = getSurfacePalette(adjustedBackground ? bgMain : null, readableText, bgMain, tokens);
  const fontScale = FONT_SCALE_MAP[state.fontSize] || 1;
  const fontFamily = FONT_FAMILY_MAP[state.fontFamily] || FONT_FAMILY_MAP.default;
  const shape = SHAPE_MODE_MAP[state.shapeMode] || SHAPE_MODE_MAP.sharp;

  root.classList.toggle('theme-future', state.theme === 'future');
  root.classList.toggle('theme-cat', state.theme === 'cat');
  document.body.dataset.theme = state.theme;
  document.body.dataset.backgroundPreset = state.backgroundPreset;
  document.body.dataset.customBackground = state.customBackgroundColor ? 'true' : 'false';
  document.body.dataset.fontSize = state.fontSize;
  document.body.dataset.shapeMode = state.shapeMode;
  document.body.dataset.presentationMode = state.presentationMode;
  document.body.dataset.currentPage = state.currentPage;

  setVars({
    '--theme-bg-main': tokens.bgMain,
    '--bg-main': bgMain,
    '--bg-panel': surface.bgPanel,
    '--bg-overlay': preset.overlay || 'none',
    '--text-main': readableText,
    '--text-muted': customColor ? colorMix(readableText, 0.68) : tokens.textMuted,
    '--accent-main': tokens.accentMain,
    '--accent-secondary': tokens.accentSecondary,
    '--border-subtle': tokens.borderSubtle,
    '--ink': readableText,
    '--paper': surface.paper,
    '--white': surface.white,
    '--moss': tokens.moss,
    '--cyan': tokens.cyan,
    '--coral': tokens.coral,
    '--violet': tokens.violet,
    '--clay': tokens.clay,
    '--line': surface.line,
    '--line-strong': surface.lineStrong,
    '--font-scale': String(fontScale),
    '--font-family': fontFamily,
    '--shadow': shape.shapeShadow,
    '--surface-radius': shape.surfaceRadius,
    '--control-radius': shape.controlRadius,
    '--shape-shadow': shape.shapeShadow,
    '--panel-blur': shape.panelBlur
  });

  document.querySelectorAll('[data-theme-switch]').forEach((button) => {
    button.textContent = state.theme === 'future' ? '溫暖' : '未來科技';
    button.setAttribute('aria-label', state.theme === 'future' ? '切換成溫暖主題' : '切換成未來科技主題');
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
  const cat = gate.querySelector('.loader-cat');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 260 : 980;

  gate.classList.add('is-cat-loading');
  return animateProgress({
    duration,
    onUpdate: (progress) => {
      if (bar) bar.style.width = `${progress}%`;
      if (count) count.textContent = `${progress}%`;
      if (cat) cat.style.left = `calc(${progress}% - ${Math.min(progress, 92) * 0.9}px)`;
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
    const duration = 2200;
    const startedAt = performance.now();
    let particles = [];
    const textBlock = ensureFutureLoaderText(gate);
    let textBounds = null;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const targetCount = Math.min(260, Math.max(160, Math.round(width * 0.14)));
      particles = createLoaderParticles(targetCount, width, height);
      textBounds = getFutureTextBounds(textBlock);
    };

    const draw = (now) => {
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      const progress = Math.round(t * 100);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const converge = easeInOutCubic(Math.min(1, t / 0.68));
      const explode = t <= 0.68 ? 0 : easeOutCubic((t - 0.68) / 0.32);
      const textAlpha = Math.min(1, explode * 1.15);
      const pop = explode > 0 ? Math.sin(Math.min(1, explode) * Math.PI) * 0.18 : 0;

      setFutureLoaderTextState(textBlock, textAlpha);

      if (bar) bar.style.width = `${progress}%`;
      if (count) count.textContent = `${progress}%`;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(4, 10, 24, 0.52)';
      ctx.fillRect(0, 0, w, h);

      particles.forEach((particle) => {
        const gatherX = lerp(particle.x, cx + Math.cos(particle.angle) * particle.gatherRadius, converge);
        const gatherY = lerp(particle.y, cy + Math.sin(particle.angle) * particle.gatherRadius, converge);
        let x = lerp(gatherX, cx + Math.cos(particle.angle) * particle.blastRadius, explode);
        let y = lerp(gatherY, cy + Math.sin(particle.angle) * particle.blastRadius, explode);
        if (textBounds && isPointInsideBounds(x, y, textBounds)) {
          const dx = x - cx;
          const dy = y - cy;
          const len = Math.max(1, Math.hypot(dx, dy));
          const radius = Math.max(textBounds.width, textBounds.height) * 0.55 + textBounds.pad + particle.size * 6;
          x = cx + (dx / len) * radius;
          y = cy + (dy / len) * radius;
        }
        const speedGlow = 0.26 + converge * 0.58 + explode * 0.6;
        const size = particle.size * (1 + converge * 0.5 + explode * 1.2 + pop);

        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = Math.min(1, speedGlow);
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 243, 220, 0.85)';
        ctx.globalAlpha = Math.min(1, speedGlow * 0.5);
        ctx.arc(x - size * 0.2, y - size * 0.2, Math.max(0.6, size * 0.35), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 0.1 + converge * 0.4;
      ctx.strokeStyle = '#6ff8ff';
      ctx.lineWidth = 1.2 + converge * 3.2 + pop * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 + converge * 26 + explode * 140, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (t < 1) requestAnimationFrame(draw);
      else {
        window.removeEventListener('resize', resize);
        resolve();
      }
    };

    resize();
    setFutureLoaderTextState(textBlock, 0);
    requestAnimationFrame(() => {
      textBounds = getFutureTextBounds(textBlock);
    });
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  });
}

function createLoaderParticles(count, width, height) {
  const colors = ['#fff3dc', '#d7c27a', '#c7b08a', '#b89b6b', '#89d7c0'];
  const maxRadius = Math.max(width, height);
  const gatherBase = Math.min(width, height) * 0.08;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + Math.random() * 0.4;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      angle,
      gatherRadius: gatherBase + Math.random() * 48,
      blastRadius: maxRadius * (0.3 + Math.random() * 0.5),
      size: 0.9 + Math.random() * 2.1,
      color: colors[index % colors.length]
    };
  });
}

function ensureFutureLoaderText(gate) {
  let node = gate.querySelector('[data-future-loader-text]');
  if (node) return node;

  node = document.createElement('div');
  node.className = 'future-loader-text';
  node.dataset.futureLoaderText = 'true';
  node.innerHTML = `
    <div class="future-loader-text__inner">
      <span class="future-loader-text__title">CAT FUTURE LAB</span>
      <span class="future-loader-text__subtitle">城市訊號互動觀測台</span>
    </div>
  `;
  gate.append(node);
  return node;
}

function setFutureLoaderTextState(node, progress) {
  if (!node) return;
  const value = Math.min(1, Math.max(0, progress));
  const scale = 0.96 + value * 0.06;
  node.style.setProperty('--future-text-opacity', String(value));
  node.style.setProperty('--future-text-scale', String(scale));
}

function getFutureTextBounds(node) {
  if (!node) return null;
  const inner = node.querySelector('.future-loader-text__inner') || node;
  const rect = inner.getBoundingClientRect();
  const pad = Math.max(24, rect.width * 0.08);
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    pad
  };
}

function isPointInsideBounds(x, y, bounds) {
  if (!bounds) return false;
  return (
    x > bounds.left - bounds.pad &&
    x < bounds.right + bounds.pad &&
    y > bounds.top - bounds.pad &&
    y < bounds.bottom + bounds.pad
  );
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

function getSurfacePalette(customColor, readableText, bgMain, tokens) {
  if (!customColor) {
    return {
      bgPanel: tokens.bgPanel,
      paper: bgMain,
      white: tokens.paper || bgMain,
      line: tokens.line,
      lineStrong: tokens.lineStrong
    };
  }

  const isLightSurface = readableText === '#11131f';
  const panelAlpha = isLightSurface ? 0.86 : 0.78;
  const solidPanel = isLightSurface ? '#ffffff' : '#071426';

  return {
    bgPanel: isLightSurface
      ? `rgba(255, 255, 255, ${panelAlpha})`
      : `rgba(7, 20, 38, ${panelAlpha})`,
    paper: solidPanel,
    white: solidPanel,
    line: colorMix(readableText, 0.18),
    lineStrong: colorMix(readableText, 0.72)
  };
}

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable;
}

function isGlobalGestureIgnored(target) {
  return Boolean(target?.closest?.('[data-notes-deck], [data-page-controls], [data-wheel-nav], [data-chat-form], .scene-controls, .gallery-controls'));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeInCubic(value) {
  return value * value * value;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}
