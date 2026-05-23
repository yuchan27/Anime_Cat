import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
await loadEnvFile(join(root, '.env'));

const requestedPort = Number(process.env.PORT || 5177);
const maxPortRetries = Number(process.env.PORT_RETRY_COUNT || 20);

const fixedModelChain = [
  'gemini-2.5-flash',
  'gemma-4-26b-a4b-it'
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const separator = trimmed.indexOf('=');
      if (separator < 0) return;

      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, '');
      if (key) process.env[key] = value;
    });
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Failed to read .env file:', error.message);
    }
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

function getModelChain() {
  return [...fixedModelChain];
}

async function readBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    chunks.push(chunk);
    size += chunk.length;
    if (size > 16_384) throw new Error('Request body too large');
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function handleEnvStatus(res) {
  const chatModels = getModelChain();
  sendJson(res, 200, {
    hasGoogleAiKey: Boolean(process.env.GOOGLE_AI_API_KEY),
    primaryModel: chatModels[0],
    chatModels
  });
}

async function callGoogleModel({ model, apiKey, prompt }) {
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.72, maxOutputTokens: 280 }
      })
    }
  );

  if (!upstream.ok) return { ok: false, status: upstream.status };

  const data = await upstream.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('').trim();
  if (!reply) return { ok: false, status: 'empty-response' };
  return { ok: true, reply };
}

async function handleChat(req, res) {
  try {
    const startedAt = Date.now();
    const { message, context = '' } = await readBody(req);
    const cleanMessage = String(message || '').trim().slice(0, 800);

    if (!cleanMessage) {
      return sendJson(res, 400, { error: 'Message is required.' });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const modelChain = getModelChain();

    if (!apiKey) {
      return sendJson(res, 200, {
        reply: '目前伺服器尚未設定 Google AI key，因此先使用安全 fallback。你可以詢問城市觀測流程、3D 場域、城市資料面板或影像素材安排。',
        model: 'local-fallback-no-key',
        latencyMs: Date.now() - startedAt
      });
    }

    const prompt = [
      '你是 Cat Future Lab 城市訊號互動觀測台的導覽助理。',
      '請用精簡、產品導向、可理解的方式回答，讓使用者覺得這是一個可用的互動網站。',
      '聚焦城市資料、3D 場域、AI 導覽、動態影像、可用性與輕量貓咪訊號。',
      context ? `補充背景：${context}` : '',
      `使用者提問：${cleanMessage}`
    ].filter(Boolean).join('\n');

    const modelErrors = [];

    for (const model of modelChain) {
      const result = await callGoogleModel({ model, apiKey, prompt });
      if (!result.ok) {
        modelErrors.push(`${model}:${result.status}`);
        continue;
      }

      return sendJson(res, 200, {
        reply: result.reply,
        model,
        latencyMs: Date.now() - startedAt,
        fallbackTried: modelErrors
      });
    }

    return sendJson(res, 200, {
      reply: '已嘗試主模型與 fallback 模型，但上游暫時無法回應，先切回安全示範回覆：本站是一個城市訊號互動觀測台，整合 3D 場域、城市天氣資料、AI 導覽與動態影像素材。',
      model: 'fallback-all-failed',
      latencyMs: Date.now() - startedAt,
      fallbackTried: modelErrors
    });
  } catch {
    return sendJson(res, 500, { error: 'Chat request failed safely.' });
  }
}

async function handleWeather(res, url) {
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
    if (!upstream.ok) throw new Error('Weather upstream failed');

    const data = await upstream.json();
    return sendJson(res, 200, {
      temperature: data?.current?.temperature_2m,
      weatherCode: data?.current?.weather_code,
      windSpeed: data?.current?.wind_speed_10m,
      latitude: data?.latitude,
      longitude: data?.longitude,
      source: 'open-meteo'
    });
  } catch {
    return sendJson(res, 200, {
      temperature: 24,
      weatherCode: 'fallback',
      windSpeed: 3,
      latitude: lat,
      longitude: lng,
      source: 'local-fallback'
    });
  }
}

async function serveStatic(req, res, url) {
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
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/api/env-status') {
    return handleEnvStatus(res);
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/weather') {
    return handleWeather(res, url);
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, url);
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

await startServerWithRetry(server, requestedPort, maxPortRetries);

async function startServerWithRetry(httpServer, basePort, retries) {
  let currentPort = basePort;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await listenOnPort(httpServer, currentPort);
      if (attempt > 0) {
        console.warn(`[startup] Port ${basePort} is busy, switched to ${currentPort}.`);
      }
      console.log(`Cat Future Lab running at http://localhost:${currentPort}`);
      return;
    } catch (error) {
      const noMoreRetries = attempt >= retries;
      if (error?.code === 'EADDRINUSE' && !noMoreRetries) {
        currentPort += 1;
        continue;
      }

      if (error?.code === 'EADDRINUSE') {
        console.error(`[startup] Ports ${basePort}-${currentPort} are all in use.`);
        console.error('[startup] Set PORT manually or stop an existing process.');
      } else {
        console.error(`[startup] Failed to start server: ${error?.message || error}`);
      }
      process.exitCode = 1;
      return;
    }
  }
}

function listenOnPort(httpServer, port) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onListening = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      httpServer.off('error', onError);
      httpServer.off('listening', onListening);
    };

    httpServer.once('error', onError);
    httpServer.once('listening', onListening);
    httpServer.listen(port);
  });
}
