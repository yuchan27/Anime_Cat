import { askCatGuide, fetchWeather } from './api.js';

export function initHeader() {
  const header = document.querySelector('[data-header]');
  const update = () => {
    header?.classList.toggle('is-compact', window.scrollY > 30);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
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

    setStatus(chatOutput, 'loading', '導覽員正在整理作品重點。');
    input.value = '';

    try {
      const data = await askCatGuide(message);
      setStatus(chatOutput, 'success', `${data.reply} (${data.model}, ${data.latencyMs}ms)`);
    } catch (error) {
      setStatus(chatOutput, 'error', '聊天服務暫時無法使用，但 server proxy 與 fallback 狀態已保留。');
    }
  });
}

export function initWeatherPanel() {
  const weatherButton = document.querySelector('[data-weather-button]');
  const weatherStatus = document.querySelector('[data-weather-status]');
  const weatherTemp = document.querySelector('[data-weather-temp]');
  const weatherWind = document.querySelector('[data-weather-wind]');
  const weatherSource = document.querySelector('[data-weather-source]');

  if (!weatherButton || !weatherStatus || !weatherTemp || !weatherWind || !weatherSource) return;

  weatherButton.addEventListener('click', async () => {
    weatherButton.disabled = true;
    weatherStatus.textContent = '正在取得位置與天氣資料。';

    try {
      const pos = await getPosition();
      const data = await fetchWeather(pos.lat, pos.lng);
      weatherTemp.textContent = formatValue(data.temperature, ' C');
      weatherWind.textContent = formatValue(data.windSpeed, ' km/h');
      weatherSource.textContent = data.source || 'unknown';
      weatherStatus.textContent = pos.fallback ? '使用台北座標作為展示資料。' : '已使用目前位置更新資料。';
    } catch (error) {
      weatherStatus.textContent = '天氣資料暫時無法更新，請稍後再試。';
      weatherSource.textContent = 'error';
    } finally {
      weatherButton.disabled = false;
    }
  });
}

export function initReportDownload() {
  const button = document.querySelector('[data-report-download]');
  const output = document.querySelector('[data-report-output]');
  if (!button || !output) return;

  button.addEventListener('click', () => {
    const sections = Array.from(output.querySelectorAll('.report-item')).map((item) => {
      const title = item.querySelector('summary')?.textContent?.trim() || '報告段落';
      const body = item.querySelector('p')?.textContent?.trim() || '';
      return `## ${title}\n\n${body}`;
    });
    const markdown = [
      '# Cat Future Lab 期末報告',
      '',
      '主題：未來互動動畫實驗室，使用貓咪元素作為導覽訊號與互動記憶點。',
      '',
      ...sections
    ].join('\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cat-future-lab-final-report.md';
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

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 25.033, lng: 121.565, fallback: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false }),
      () => resolve({ lat: 25.033, lng: 121.565, fallback: true }),
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 600000 }
    );
  });
}
