import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT || 5177);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 16_384) {
      throw new Error('Request body too large');
    }
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const handleChat = async (req, res) => {
  try {
    const startedAt = Date.now();
    const { message, context = '' } = await readBody(req);
    const cleanMessage = String(message || '').trim().slice(0, 800);

    if (!cleanMessage) {
      return sendJson(res, 400, { error: 'Message is required.' });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const model = process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash';

    if (!apiKey) {
      return sendJson(res, 200, {
        reply: '目前伺服器尚未設定 Google AI Studio 金鑰，所以先使用安全示範回覆。這個作品是未來互動動畫實驗室，貓咪元素只作為導覽符號與訊號，不是整體貓咪網站。',
        model: 'local-fallback',
        latencyMs: Date.now() - startedAt
      });
    }

    const prompt = [
      '你是期末網頁動畫作品中的 lab assistant，帶有輕微貓咪導覽語氣。',
      '使用繁體中文，回答要精簡、專業、聚焦於網頁動畫、SEO、無障礙與互動設計。',
      '請強調本作品是未來互動動畫實驗室，貓咪元素是符號與互動提示，不是整體貓咪造型網站。',
      context ? `作品背景：${context}` : '',
      `使用者：${cleanMessage}`
    ].filter(Boolean).join('\n');

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.75, maxOutputTokens: 260 }
        })
      }
    );

    if (!upstream.ok) {
      return sendJson(res, 200, {
        reply: 'AI 服務暫時沒有回應，我先提供備援回答：這個作品展示 Anime.js、Three.js、Server Proxy API、Remotion 素材、SEO 與無障礙設計。',
        model: 'fallback-after-upstream-error',
        latencyMs: Date.now() - startedAt
      });
    }

    const data = await upstream.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('')?.trim();

    return sendJson(res, 200, {
      reply: reply || '我目前沒有生成到內容，但作品互動流程仍可正常展示。',
      model,
      latencyMs: Date.now() - startedAt
    });
  } catch (error) {
    return sendJson(res, 500, { error: 'Chat request failed safely.' });
  }
};

const handleWeather = async (req, res, url) => {
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendJson(res, 400, { error: 'Valid lat and lng are required.' });
  }

  try {
    const api = new URL('https://api.open-meteo.com/v1/forecast');
    api.searchParams.set('latitude', String(lat));
    api.searchParams.set('longitude', String(lng));
    api.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
    api.searchParams.set('timezone', 'auto');

    const upstream = await fetch(api);
    if (!upstream.ok) {
      throw new Error('Weather upstream failed');
    }

    const data = await upstream.json();
    return sendJson(res, 200, {
      temperature: data?.current?.temperature_2m,
      weatherCode: data?.current?.weather_code,
      windSpeed: data?.current?.wind_speed_10m,
      latitude: data?.latitude,
      longitude: data?.longitude,
      source: 'open-meteo'
    });
  } catch (error) {
    return sendJson(res, 200, {
      temperature: 24,
      weatherCode: 'fallback',
      windSpeed: 3,
      latitude: lat,
      longitude: lng,
      source: 'local-fallback'
    });
  }
};

const serveStatic = async (req, res, url) => {
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const safePath = normalize(join(root, requested));

  if (!safePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(safePath);
    res.writeHead(200, {
      'content-type': mimeTypes[extname(safePath)] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/weather') {
    return handleWeather(req, res, url);
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, url);
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(port, () => {
  console.log(`Cat Future Lab running at http://localhost:${port}`);
});
