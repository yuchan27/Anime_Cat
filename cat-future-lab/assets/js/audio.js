import { getState, subscribeState } from './state.js';

const TRACKS = {
  future: 'assets/music/1.mp3',
  cat: 'assets/music/2.mp3'
};

let audio;
let active = false;
let currentTheme = getState().theme;

export function initSoundToggle() {
  const button = document.querySelector('[data-sound-toggle]');
  if (!button) return;

  audio = new Audio(TRACKS[currentTheme] || TRACKS.cat);
  audio.loop = true;
  audio.volume = 0;

  subscribeState((state) => {
    currentTheme = state.theme;
    if (active) switchTrackForTheme(state.theme);
  });

  button.addEventListener('click', async () => {
    active = button.getAttribute('aria-pressed') !== 'true';
    if (active) {
      await playCurrentTrack();
      button.setAttribute('aria-pressed', 'true');
      button.textContent = '關閉音景';
      return;
    }

    fadeOutAndPause();
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '啟動音景';
  });
}

async function playCurrentTrack() {
  switchTrackForTheme(currentTheme, { keepPaused: true });
  try {
    await audio.play();
    fadeVolumeTo(0.38, 900);
  } catch {
    active = false;
  }
}

function switchTrackForTheme(theme, options = {}) {
  const nextSrc = TRACKS[theme] || TRACKS.cat;
  if (!audio || audio.getAttribute('src') === nextSrc) return;

  const wasPlaying = active && !audio.paused;
  audio.pause();
  audio.setAttribute('src', nextSrc);
  audio.load();
  audio.volume = 0;

  if (wasPlaying && !options.keepPaused) {
    audio.play()
      .then(() => fadeVolumeTo(0.38, 900))
      .catch(() => {
        active = false;
      });
  }
}

function fadeOutAndPause() {
  if (!audio) return;
  const startVolume = audio.volume;
  const startedAt = performance.now();
  const duration = 420;

  const step = (now) => {
    const t = Math.min(1, (now - startedAt) / duration);
    audio.volume = startVolume * (1 - t);
    if (t < 1) requestAnimationFrame(step);
    else audio.pause();
  };
  requestAnimationFrame(step);
}

function fadeVolumeTo(target, duration) {
  if (!audio) return;
  const startVolume = audio.volume;
  const startedAt = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - startedAt) / duration);
    audio.volume = startVolume + (target - startVolume) * t;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
