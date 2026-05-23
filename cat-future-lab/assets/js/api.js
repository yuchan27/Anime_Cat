export async function askCatGuide(message) {
  return requestJson('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      context: 'Cat Future Lab 是城市訊號互動觀測台，主軸為城市資料、3D 場域、AI 導覽與動態影像；動畫風貓咪只作為輕量觀測助手。'
    })
  });
}

export async function fetchEnvStatus() {
  return requestJson('/api/env-status');
}

export async function fetchWeather(lat, lng) {
  const url = new URL('/api/weather', window.location.origin);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lng', String(lng));
  return requestJson(url);
}

async function requestJson(input, init) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json();
}
