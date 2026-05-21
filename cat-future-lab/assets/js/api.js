export async function askCatGuide(message) {
  return requestJson('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      context: 'Cat Future Lab is an animated cat-style interactive website with Anime.js 3.2.2, Three.js, server proxy APIs, Remotion loop material, SEO, and accessibility.'
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
