import { fetchEnvStatus, fetchWeather } from './api.js';

let weatherTimeTimer = null;

export function initHeader() {
  const header = document.querySelector('[data-header]');
  const update = () => header?.classList.toggle('is-compact', window.scrollY > 30);
  update();
  window.addEventListener('scroll', update, { passive: true });
  initMobileMenu(header);
}

function initMobileMenu(header) {
  const toggle = header?.querySelector('[data-menu-toggle]');
  const menu = header?.querySelector('[data-site-menu]');
  const closeButton = header?.querySelector('[data-menu-close]');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle('mobile-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  };

  setOpen(false);
  toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('mobile-menu-open')));
  closeButton?.addEventListener('click', () => setOpen(false));
  menu.querySelectorAll('a, button').forEach((control) => {
    control.addEventListener('click', () => setOpen(false));
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

export async function initApiStatus() {
  const node = document.querySelector('[data-api-status]');
  if (!node) return;

  try {
    const status = await fetchEnvStatus();
    if (!status.hasGoogleAiKey) {
      node.dataset.state = 'error';
      node.textContent = '尚未讀取 Google AI key，目前會使用安全 fallback 回覆。';
      return;
    }

    const chain = Array.isArray(status.chatModels) && status.chatModels.length
      ? status.chatModels.join(' -> ')
      : status.primaryModel || '未知模型';

    node.dataset.state = 'success';
    node.textContent = `已讀取 Google AI key。主模型：${status.primaryModel}；fallback 鏈：${chain}`;
  } catch {
    node.dataset.state = 'error';
    node.textContent = '無法讀取 API 狀態，請確認 server 是否啟動。';
  }
}


export function initWeatherPanelV2() {
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

  let weatherRequestId = 0;

  const updatePlaceAndTime = () => {
    const option = weatherCity.selectedOptions[0];
    const placeName = option?.dataset.name || option?.textContent || '--';
    const timezone = option?.dataset.tz || 'Asia/Taipei';
    weatherPlace.textContent = placeName;
    updateCityTime(weatherTime, timezone);
    if (weatherTimeTimer) window.clearInterval(weatherTimeTimer);
    weatherTimeTimer = window.setInterval(() => updateCityTime(weatherTime, timezone), 1000);
  };

  const loadSelectedWeather = async () => {
    const requestId = ++weatherRequestId;
    const option = weatherCity.selectedOptions[0];
    const [lat, lng] = String(weatherCity.value).split(',').map(Number);
    const cityName = option?.dataset.name || option?.textContent || '未知城市';

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      weatherStatus.textContent = '城市座標格式不正確。';
      return;
    }

    weatherButton.disabled = true;
    weatherStatus.textContent = `正在更新 ${cityName} 的城市訊號...`;
    weatherPlace.textContent = cityName;

    try {
      const data = await fetchWeather(lat, lng);
      if (requestId !== weatherRequestId) return;
      weatherTemp.textContent = formatValue(data.temperature, ' C');
      weatherWind.textContent = formatValue(data.windSpeed, ' km/h');
      weatherSource.textContent = data.source || '未知';
      weatherStatus.textContent = `${cityName} 天氣資料更新完成。`;
    } catch {
      if (requestId !== weatherRequestId) return;
      weatherTemp.textContent = '--';
      weatherWind.textContent = '--';
      weatherSource.textContent = 'fallback';
      weatherStatus.textContent = '天氣資料暫時無法更新，已保留替代狀態。';
    } finally {
      if (requestId === weatherRequestId) weatherButton.disabled = false;
    }
  };

  const selectCurrentLocation = ({ latitude, longitude }) => {
    let option = weatherCity.querySelector('option[data-current-location="true"]');
    if (!option) {
      option = document.createElement('option');
      option.dataset.currentLocation = 'true';
      weatherCity.prepend(option);
    }

    option.value = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    option.dataset.name = '目前位置';
    option.dataset.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
    option.textContent = '目前位置 Current';
    option.selected = true;
  };

  const loadDefaultWeather = () => {
    updatePlaceAndTime();
    loadSelectedWeather();
  };

  weatherCity.addEventListener('change', () => {
    updatePlaceAndTime();
    loadSelectedWeather();
  });

  weatherButton.addEventListener('click', loadSelectedWeather);

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectCurrentLocation(position.coords);
        loadDefaultWeather();
      },
      () => loadDefaultWeather(),
      { enableHighAccuracy: false, timeout: 2600, maximumAge: 600000 }
    );
  } else {
    loadDefaultWeather();
  }
}

export function initHeroFlipCard() {
  const card = document.querySelector('[data-hero-flip-card]');
  if (!card) return;

  const toggle = () => {
    const next = !card.classList.contains('is-flipped');
    card.classList.toggle('is-flipped', next);
    card.setAttribute('aria-pressed', String(next));
  };

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggle();
  });
}

export function initControlProximityFeedback() {
  const controls = Array.from(document.querySelectorAll('button, .button, [role="button"], select'));
  if (!controls.length || window.matchMedia('(pointer: coarse)').matches) return;

  let frame = 0;
  window.addEventListener('pointermove', (event) => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      controls.forEach((control) => {
        const rect = control.getBoundingClientRect();
        const dx = event.clientX < rect.left
          ? rect.left - event.clientX
          : event.clientX > rect.right
            ? event.clientX - rect.right
            : 0;
        const dy = event.clientY < rect.top
          ? rect.top - event.clientY
          : event.clientY > rect.bottom
            ? event.clientY - rect.bottom
            : 0;
        const distance = Math.hypot(dx, dy);
        if (distance < nearestDistance) {
          nearest = control;
          nearestDistance = distance;
        }
      });

      controls.forEach((control) => {
        control.classList.toggle('is-pointer-near', control === nearest && nearestDistance < 14);
      });
    });
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    controls.forEach((control) => control.classList.remove('is-pointer-near'));
  }, { passive: true });
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
      const title = slide.dataset.title || '未命名章節';
      const paragraph = slide.querySelector('p')?.textContent?.trim() || '';
      const points = Array.from(slide.querySelectorAll('li'))
        .map((li) => li.textContent?.trim())
        .filter(Boolean)
        .map((text) => `- ${text}`)
        .join('\n');
      return `## ${title}\n\n${paragraph}\n\n${points}`;
    });

    const markdown = [
      '# Cat Future Lab - 智慧導覽互動網站技術摘要',
      '',
      `匯出時間：${new Date().toLocaleString('zh-TW')}`,
      '',
      ...sections
    ].join('\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cat-future-lab-guide-notes.md';
    link.click();
    URL.revokeObjectURL(url);
  });
}

export function initReportPptDownload() {
  const button = document.querySelector('[data-report-ppt]');
  const slides = Array.from(document.querySelectorAll('[data-note-slide]'));
  if (!button || slides.length === 0) return;

  let exporting = false;

  const exportPpt = async () => {
    if (exporting) return;
    exporting = true;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = '產生簡報中...';

    try {
      const module = await import('pptxgenjs');
      const PptxGenJS = module.default || module;
      const pptx = new PptxGenJS();

      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'yuchan';
      pptx.company = 'Cat Future Lab';
      pptx.subject = 'Cat Future Lab 智慧導覽互動網站';
      pptx.title = 'Cat Future Lab 智慧導覽互動網站技術簡報';
      pptx.lang = 'zh-TW';

      const cover = pptx.addSlide();
      cover.background = { color: '11131F' };
      cover.addText('Cat Future Lab', {
        x: 0.8,
        y: 0.8,
        w: 11.8,
        h: 0.9,
        color: 'DCE86A',
        bold: true,
        fontSize: 34
      });
      cover.addText('智慧導覽互動網站技術簡報', {
        x: 0.8,
        y: 2.05,
        w: 11.2,
        h: 0.7,
        color: 'F7F2E4',
        bold: true,
        fontSize: 26
      });
      cover.addText('核心理念：未來網頁可以由 AI 理解自然語言後安全控制，但視覺仍維持成熟、乾淨、可閱讀的產品感。', {
        x: 0.8,
        y: 3.0,
        w: 11.4,
        h: 1.4,
        color: 'F7F2E4',
        fontSize: 16,
        breakLine: true
      });
      cover.addText(`匯出時間：${new Date().toLocaleString('zh-TW')}`, {
        x: 0.8,
        y: 6.35,
        w: 11.5,
        h: 0.5,
        color: '51D6D0',
        fontSize: 13
      });

      for (const slideNode of slides) {
        const title = slideNode.dataset.title || '技術章節';
        const summary = slideNode.querySelector('p')?.textContent?.trim() || '';
        const points = Array.from(slideNode.querySelectorAll('li'))
          .map((li) => li.textContent?.trim())
          .filter(Boolean);

        const slide = pptx.addSlide();
        slide.background = { color: '142E55' };

        slide.addShape(pptx.ShapeType.rect, {
          x: 0.45,
          y: 0.45,
          w: 12.4,
          h: 6.2,
          line: { color: 'F7F2E4', pt: 1.6 },
          fill: { color: '173A66', transparency: 10 }
        });

        slide.addText(title, {
          x: 0.85,
          y: 0.75,
          w: 7.4,
          h: 0.7,
          color: 'DCE86A',
          bold: true,
          fontSize: 22
        });

        slide.addText(summary, {
          x: 0.85,
          y: 1.55,
          w: 7.25,
          h: 1.3,
          color: 'F7F2E4',
          fontSize: 15,
          breakLine: true
        });

        if (points.length) {
          slide.addText(points.map((text) => `• ${text}`).join('\n'), {
            x: 0.85,
            y: 3.05,
            w: 7.15,
            h: 2.7,
            color: 'F7F2E4',
            fontSize: 13,
            breakLine: true
          });
        }

        const imageData = await getSlideImageData(slideNode);
        if (imageData) {
          slide.addImage({
            data: imageData,
            x: 8.25,
            y: 1.15,
            w: 4.3,
            h: 3.0
          });
          slide.addShape(pptx.ShapeType.rect, {
            x: 8.18,
            y: 1.08,
            w: 4.45,
            h: 3.15,
            line: { color: '51D6D0', pt: 1.5 },
            fill: { color: '173A66', transparency: 100 }
          });
        }
      }

      const fileName = `cat-future-lab-guide-${formatDateForFilename(new Date())}.pptx`;
      await pptx.writeFile({ fileName });
    } catch (error) {
      console.error('[ppt-export] failed', error);
      window.alert('簡報匯出失敗，請稍後再試。');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
      exporting = false;
    }
  };

  button.addEventListener('click', exportPpt);
  window.addEventListener('catlab:pptrequest', exportPpt);
}

function formatValue(value, suffix) {
  return Number.isFinite(Number(value)) ? `${value}${suffix}` : '--';
}

function updateCityTime(target, timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('zh-TW', {
      timeZone: timezone,
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    target.textContent = formatter.format(new Date());
  } catch {
    target.textContent = '--';
  }
}

function formatDateForFilename(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes())
  ].join('');
}

async function getSlideImageData(slideNode) {
  const image = slideNode.querySelector('.note-media img');
  if (image?.getAttribute('src')) {
    return toDataUrl(image.getAttribute('src'));
  }

  const video = slideNode.querySelector('.note-media video');
  const poster = video?.getAttribute('poster');
  if (poster) {
    return toDataUrl(poster);
  }

  return null;
}

async function toDataUrl(src) {
  try {
    const url = new URL(src, window.location.href);
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return blobToDataURL(blob);
  } catch {
    return null;
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}
