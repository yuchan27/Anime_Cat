export async function askCatGuide(message) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message,
      context: 'Cat Future Lab combines Anime.js, Three.js, weather API, Remotion material planning, SEO and accessibility.'
    })
  });

  if (!response.ok) {
    throw new Error('Chat request failed');
  }

  return response.json();
}

export async function fetchWeather(lat, lng) {
  const url = new URL('/api/weather', window.location.origin);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lng', String(lng));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Weather request failed');
  }

  return response.json();
}
