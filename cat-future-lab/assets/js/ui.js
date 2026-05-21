import { askCatGuide, fetchEnvStatus, fetchWeather } from './api.js';

let weatherTimeTimer = null;

export function initLoader() {
  const loader = document.querySelector('[data-loader]');
  const bar = document.querySelector('[data-loader-bar]');
  const count = document.querySelector('[data-loader-count]');
  if (!loader || !bar || !count) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  const minimum = reducedMotion ? 220 : 1100;

  const tick = (now) => {
    const progress = Math.min(99, Math.round(((now - start) / minimum) * 100));
    bar.style.width = `${progress}%`;
    count.textContent = `${progress}%`;
    if (progress < 99) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);

  const finish = () => {
    const elapsed = performance.now() - start;
    const delay = Math.max(0, minimum - elapsed);
    window.setTimeout(() => {
      bar.style.width = '100%';
      count.textContent = '100%';
      loader.classList.add('is-hidden');
      window.setTimeout(() => loader.remove(), reducedMotion ? 0 : 360);
    }, delay);
  };

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
}

export function initHeader() {
  const header = document.querySelector('[data-header]');
  const update = () => header?.classList.toggle('is-compact', window.scrollY > 30);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

export async function initApiStatus() {
  const node = document.querySelector('[data-api-status]');
  if (!node) return;

  try {
    const status = await fetchEnvStatus();
    if (!status.hasGoogleAiKey) {
      node.dataset.state = 'error';
      node.textContent = 'Server key is missing. Safe fallback mode is active.';
      return;
    }

    const chain = Array.isArray(status.chatModels) && status.chatModels.length
      ? status.chatModels.join(' -> ')
      : status.primaryModel || 'unknown';
    node.dataset.state = 'success';
    node.textContent = `Server key is loaded. Primary model: ${status.primaryModel}; fallback chain: ${chain}`;
  } catch {
    node.dataset.state = 'error';
    node.textContent = 'Cannot read API status. Check whether the server is running.';
  }
}

export function initChatPanel() {
  const chatForm = document.querySelector('[data-chat-form]');
  const chatOutput = document.querySelector('[data-chat-output]');
  if (!chatForm || !chatOutput) return;

  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = chatForm.querySelector('input[name="message"]');
    const message = input?.value.trim();
    if (!message) return;

    setStatus(chatOutput, 'loading', 'Guide is preparing a response...');
    input.value = '';

    try {
      const data = await askCatGuide(message);
      const meta = [];
      if (data.model) meta.push(data.model);
      if (Number.isFinite(Number(data.latencyMs))) meta.push(`${data.latencyMs}ms`);
      const metaText = meta.length ? ` (${meta.join(', ')})` : '';
      setStatus(chatOutput, 'success', `${data.reply}${metaText}`);
    } catch {
      setStatus(chatOutput, 'error', 'Chat request failed. Please retry.');
    }
  });
}

export function initWeatherPanel() {
  const weatherButton = document.querySelector('[data-weather-button]');
  const weatherCity = document.querySelector('[data-weather-city]');
  const weatherStatus = document.querySelector('[data-weather-status]');
  const weatherPlace = document.querySelector('[data-weather-place]');
  const weatherTime = document.querySelector('[data-weather-time]');
  const weatherTemp = document.querySelector('[data-weather-temp]');
  const weatherWind = document.querySelector('[data-weather-wind]');
  const weatherSource = document.querySelector('[data-weather-source]');

  if (
    !weatherButton || !weatherCity || !weatherStatus || !weatherPlace ||
    !weatherTime || !weatherTemp || !weatherWind || !weatherSource
  ) return;

  const updatePlaceAndTime = () => {
    const option = weatherCity.selectedOptions[0];
    const placeName = option?.dataset.name || option?.textContent || '--';
    const timezone = option?.dataset.tz || 'Asia/Taipei';
    weatherPlace.textContent = placeName;
    updateCityTime(weatherTime, timezone);
    if (weatherTimeTimer) window.clearInterval(weatherTimeTimer);
    weatherTimeTimer = window.setInterval(() => updateCityTime(weatherTime, timezone), 1000);
  };

  weatherCity.addEventListener('change', updatePlaceAndTime);
  updatePlaceAndTime();

  weatherButton.addEventListener('click', async () => {
    const option = weatherCity.selectedOptions[0];
    const [lat, lng] = String(weatherCity.value).split(',').map(Number);
    const cityName = option?.dataset.name || option?.textContent || 'Unknown city';

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      weatherStatus.textContent = 'Invalid city coordinates.';
      return;
    }

    weatherButton.disabled = true;
    weatherStatus.textContent = `Loading weather for ${cityName}...`;
    weatherPlace.textContent = cityName;

    try {
      const data = await fetchWeather(lat, lng);
      weatherTemp.textContent = formatValue(data.temperature, ' C');
      weatherWind.textContent = formatValue(data.windSpeed, ' km/h');
      weatherSource.textContent = data.source || 'unknown';
      weatherStatus.textContent = `Weather updated for ${cityName}.`;
    } catch {
      weatherTemp.textContent = '--';
      weatherWind.textContent = '--';
      weatherSource.textContent = 'error';
      weatherStatus.textContent = 'Weather request failed. Try again.';
    } finally {
      weatherButton.disabled = false;
    }
  });
}

export function initImageGallery() {
  const gallery = document.querySelector('[data-gallery]');
  const image = document.querySelector('[data-gallery-image]');
  const caption = document.querySelector('[data-gallery-caption]');
  const cards = Array.from(document.querySelectorAll('[data-gallery-card]'));
  if (!gallery || !image || !caption || cards.length === 0) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((item) => {
        const active = item === card;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });

      const nextImage = card.dataset.image;
      const nextCaption = card.dataset.caption || '';
      if (nextImage) image.src = nextImage;
      caption.textContent = nextCaption;
      gallery.classList.remove('is-switching');
      void gallery.offsetWidth;
      gallery.classList.add('is-switching');
    });
  });
}

export function initReportDownload() {
  const button = document.querySelector('[data-report-download]');
  const slides = Array.from(document.querySelectorAll('[data-note-slide]'));
  if (!button || slides.length === 0) return;

  button.addEventListener('click', () => {
    const sections = slides.map((slide) => {
      const title = slide.dataset.title || 'Untitled';
      const paragraph = slide.querySelector('p')?.textContent?.trim() || '';
      const points = Array.from(slide.querySelectorAll('li'))
        .map((li) => li.textContent?.trim())
        .filter(Boolean)
        .map((text) => `- ${text}`)
        .join('\n');
      return `## ${title}\n\n${paragraph}\n\n${points}`;
    });

    const markdown = [
      '# Cat Future Lab - Lab Notes',
      '',
      `Updated: ${new Date().toLocaleString('en-US')}`,
      '',
      ...sections
    ].join('\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cat-future-lab-notes.md';
    link.click();
    URL.revokeObjectURL(url);
  });
}

function setStatus(node, state, text) {
  node.dataset.state = state;
  node.textContent = text;
}

function formatValue(value, suffix) {
  return Number.isFinite(Number(value)) ? `${value}${suffix}` : '--';
}

function updateCityTime(target, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    target.textContent = formatter.format(new Date());
  } catch {
    target.textContent = '--';
  }
}
