import anime from 'animejs';
import { initMotionPreference, initRevealObserver } from './a11y.js';
import { askCatGuide, fetchWeather } from './api.js';
import { initCatScene } from './scene.js';

initMotionPreference();
initRevealObserver();
initCatScene();

const reduceMotion = () => document.documentElement.classList.contains('reduce-motion');

if (!reduceMotion()) {
  anime.timeline({ easing: 'easeOutExpo' })
    .add({
      targets: '[data-animate="hero"] h1',
      translateY: [42, 0],
      opacity: [0, 1],
      duration: 900
    })
    .add({
      targets: '[data-animate="hero"] p, .hero-actions a',
      translateY: [24, 0],
      opacity: [0, 1],
      delay: anime.stagger(110),
      duration: 720
    }, '-=520')
    .add({
      targets: '[data-kinetic]',
      letterSpacing: ['0.34em', '0.08em'],
      opacity: [0, 1],
      duration: 900
    }, '-=460');
}

const header = document.querySelector('[data-header]');
window.addEventListener('scroll', () => {
  header?.classList.toggle('is-compact', window.scrollY > 30);
}, { passive: true });

const chatForm = document.querySelector('[data-chat-form]');
const chatOutput = document.querySelector('[data-chat-output]');

chatForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = chatForm.querySelector('input[name="message"]');
  const message = input.value.trim();
  if (!message) return;

  chatOutput.textContent = '導覽員正在回覆。';
  input.value = '';

  try {
    const data = await askCatGuide(message);
    chatOutput.textContent = `${data.reply} (${data.model}, ${data.latencyMs}ms)`;
  } catch (error) {
    chatOutput.textContent = '聊天服務暫時無法使用，但作品仍可展示 API fallback 設計。';
  }
});

const weatherButton = document.querySelector('[data-weather-button]');
const weatherStatus = document.querySelector('[data-weather-status]');
const weatherTemp = document.querySelector('[data-weather-temp]');
const weatherWind = document.querySelector('[data-weather-wind]');
const weatherSource = document.querySelector('[data-weather-source]');

const getPosition = () => new Promise((resolve) => {
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

weatherButton?.addEventListener('click', async () => {
  weatherStatus.textContent = '正在取得位置與天氣資料。';
  try {
    const pos = await getPosition();
    const data = await fetchWeather(pos.lat, pos.lng);
    weatherTemp.textContent = `${data.temperature} C`;
    weatherWind.textContent = `${data.windSpeed} km/h`;
    weatherSource.textContent = data.source;
    weatherStatus.textContent = pos.fallback ? '使用台北座標作為展示資料。' : '已使用目前位置更新資料。';
  } catch (error) {
    weatherStatus.textContent = '天氣資料暫時無法更新。';
  }
});
