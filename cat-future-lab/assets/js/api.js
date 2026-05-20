export async function askCatGuide(message) {
  return requestJson('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      context: 'Cat Future Lab is a future interactive animation lab with cat elements as signals, built with Anime.js 3.2.2, Three.js, server proxy APIs, Remotion material planning, SEO and accessibility.'
    })
  });
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
