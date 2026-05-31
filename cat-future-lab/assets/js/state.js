import {
  BACKGROUND_PRESET_MAP,
  FONT_FAMILY_MAP,
  FONT_SCALE_MAP,
  PAGE_MAP,
  SHAPE_MODE_MAP,
  THEME_TOKEN_MAP
} from './config.js';

const listeners = new Set();
const SETTINGS_COOKIE = 'catlab-settings-v2';
const SETTINGS_MAX_AGE = 60 * 60 * 24 * 45;
const initialPage = PAGE_MAP[0]?.id || 'home';

const DEFAULT_STATE = Object.freeze({
  theme: 'cat',
  fontSize: 'md',
  fontFamily: 'default',
  marqueeText: '可用智慧導覽控制頁面、背景、字體、形狀、跑馬燈與簡報模式。',
  backgroundPreset: 'default',
  customBackgroundColor: undefined,
  customTextColor: undefined,
  shapeMode: 'sharp',
  currentPage: initialPage,
  pageIndex: 0,
  totalPages: PAGE_MAP.length,
  progress: 0,
  isCompleted: false,
  presentationMode: 'web',
  performanceMode: 'auto',
  pptStatus: 'idle',
  pptDownloadUrl: undefined
});

const storedSettings = readStoredSettings();
let hasPersistedSettingsFlag = Object.keys(storedSettings).length > 0;

const state = {
  ...DEFAULT_STATE,
  ...storedSettings
};

deriveState();

export function getState() {
  return { ...state };
}

export function updateState(patch, options = {}) {
  Object.assign(state, sanitizePatch(patch));
  deriveState();
  if (options.persist !== false) persistSettings();
  notify();
  return getState();
}

export function resetState(options = {}) {
  const preserved = {};
  if (options.preserveTheme) preserved.theme = state.theme;
  if (options.preservePage) preserved.currentPage = state.currentPage;
  const shouldPersist = options.persist !== false;

  Object.assign(state, DEFAULT_STATE, preserved);
  deriveState();
  if (shouldPersist) persistSettings();
  notify();
  return getState();
}

export function hasPersistedSettings() {
  return hasPersistedSettingsFlag;
}

export function subscribeState(listener) {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}

export function getPageById(pageId) {
  return PAGE_MAP.find((page) => page.id === pageId);
}

export function getPageIndex(pageId) {
  return Math.max(0, PAGE_MAP.findIndex((page) => page.id === pageId));
}

export function isKnownPage(pageId) {
  return PAGE_MAP.some((page) => page.id === pageId);
}

export function isKnownTheme(theme) {
  return Object.hasOwn(THEME_TOKEN_MAP, theme);
}

export function isKnownBackgroundPreset(preset) {
  return Object.hasOwn(BACKGROUND_PRESET_MAP, preset);
}

export function isKnownFontSize(size) {
  return Object.hasOwn(FONT_SCALE_MAP, size);
}

export function isKnownFontFamily(family) {
  return Object.hasOwn(FONT_FAMILY_MAP, family);
}

export function isKnownShapeMode(mode) {
  return Object.hasOwn(SHAPE_MODE_MAP, mode);
}

function deriveState() {
  if (!isKnownTheme(state.theme)) state.theme = DEFAULT_STATE.theme;
  if (!isKnownFontSize(state.fontSize)) state.fontSize = DEFAULT_STATE.fontSize;
  if (!isKnownFontFamily(state.fontFamily)) state.fontFamily = DEFAULT_STATE.fontFamily;
  if (!isKnownBackgroundPreset(state.backgroundPreset)) state.backgroundPreset = DEFAULT_STATE.backgroundPreset;
  if (!isKnownShapeMode(state.shapeMode)) state.shapeMode = DEFAULT_STATE.shapeMode;
  if (!isKnownPage(state.currentPage)) state.currentPage = initialPage;
  if (state.customBackgroundColor && !/^#[0-9a-f]{6}$/i.test(state.customBackgroundColor)) {
    state.customBackgroundColor = undefined;
  }
  if (state.customTextColor && !/^#[0-9a-f]{6}$/i.test(state.customTextColor)) {
    state.customTextColor = undefined;
  }

  state.pageIndex = getPageIndex(state.currentPage);
  state.totalPages = PAGE_MAP.length;
  state.progress = state.totalPages <= 1
    ? 100
    : (state.pageIndex / (state.totalPages - 1)) * 100;
  state.isCompleted = state.pageIndex === state.totalPages - 1;
}

function notify() {
  const snapshot = getState();
  listeners.forEach((listener) => listener(snapshot));
}

function sanitizePatch(patch = {}) {
  const next = { ...patch };
  if (next.customBackgroundColor === null || next.customBackgroundColor === '') {
    next.customBackgroundColor = undefined;
  }
  if (next.customTextColor === null || next.customTextColor === '') {
    next.customTextColor = undefined;
  }
  if (typeof next.marqueeText === 'string') {
    next.marqueeText = next.marqueeText.trim().slice(0, 120);
  }
  return next;
}

function readStoredSettings() {
  if (typeof document === 'undefined') return {};
  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${SETTINGS_COOKIE}=`))
    ?.split('=')[1];
  if (!raw) return {};

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return sanitizeStoredSettings(parsed);
  } catch {
    return {};
  }
}

function sanitizeStoredSettings(value) {
  if (!value || typeof value !== 'object') return {};
  const next = {};
  if (isKnownTheme(value.theme)) next.theme = value.theme;
  if (isKnownFontSize(value.fontSize)) next.fontSize = value.fontSize;
  if (isKnownFontFamily(value.fontFamily)) next.fontFamily = value.fontFamily;
  if (isKnownBackgroundPreset(value.backgroundPreset)) next.backgroundPreset = value.backgroundPreset;
  if (isKnownShapeMode(value.shapeMode)) next.shapeMode = value.shapeMode;
  if (isKnownPage(value.currentPage)) next.currentPage = value.currentPage;
  if (value.presentationMode === 'web' || value.presentationMode === 'ppt') next.presentationMode = value.presentationMode;
  if (typeof value.marqueeText === 'string' && value.marqueeText.trim()) {
    next.marqueeText = value.marqueeText.trim().slice(0, 120);
  }
  if (typeof value.customBackgroundColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.customBackgroundColor)) {
    next.customBackgroundColor = value.customBackgroundColor.toLowerCase();
  }
  if (typeof value.customTextColor === 'string' && /^#[0-9a-f]{6}$/i.test(value.customTextColor)) {
    next.customTextColor = value.customTextColor.toLowerCase();
  }
  return next;
}

function persistSettings() {
  if (typeof document === 'undefined') return;
  const payload = {
    chosen: true,
    theme: state.theme,
    fontSize: state.fontSize,
    fontFamily: state.fontFamily,
    marqueeText: state.marqueeText,
    backgroundPreset: state.backgroundPreset,
    customBackgroundColor: state.customBackgroundColor,
    customTextColor: state.customTextColor,
    shapeMode: state.shapeMode,
    currentPage: state.currentPage,
    presentationMode: state.presentationMode
  };
  document.cookie = `${SETTINGS_COOKIE}=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${SETTINGS_MAX_AGE}; Path=/; SameSite=Lax`;
  hasPersistedSettingsFlag = true;
}
