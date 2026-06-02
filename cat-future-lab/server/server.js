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
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg'
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
      if (key && process.env[key] === undefined) process.env[key] = value;
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

async function callGoogleModel({ model, apiKey, prompt, jsonMode = false }) {
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.58,
          maxOutputTokens: jsonMode ? 720 : 320,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      })
    }
  );

  if (!upstream.ok) return { ok: false, status: upstream.status };

  const data = await upstream.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('').trim();
  if (!reply) return { ok: false, status: 'empty-response' };
  return { ok: true, reply };
}


async function handleAiNavigator(req, res) {
  try {
    const startedAt = Date.now();
    const { message, state = {} } = await readBody(req);
    const cleanMessage = String(message || '').trim().slice(0, 800);

    if (!cleanMessage) {
      return sendJson(res, 400, { error: 'Message is required.' });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const modelChain = getModelChain();

    if (!apiKey) {
      return sendJson(res, 200, buildNavigatorFallback(cleanMessage, 'local-fallback-no-key', Date.now() - startedAt));
    }

    const prompt = [
      'You are the intent planner for an interactive website named Cat Future Lab.',
      'Return JSON only. Do not include markdown.',
      'Never output JavaScript, CSS strings, HTML, selectors, or instructions to execute code.',
      'All UI changes must use fixed JSON actions only.',
      'If the user asks how something works, return unknown with a concise Traditional Chinese explanation and do not mutate UI.',
      'If the user asks for multiple changes, return an actions array ordered by intent.',
      'Visual changes require confirmation: set requiresConfirmation to true for theme, font, background, text color, and shape changes.',
      'Supported actions: goToPage, nextPage, previousPage, getCurrentProgress, setTheme, setFontSize, setFontFamily, setBackground, setTextColor, setShapeMode, setMarquee, setPresentationMode, generatePpt, downloadPpt, resetSettings, unknown.',
      'Page ids: home, intro, features, tech, gallery, about, contact, presentation.',
      'Themes: future, cat, metal.',
      'Font sizes: xl, lg, md, sm.',
      'Font families: default, jhenghei, noto, system, serif, mono.',
      'Shape modes: sharp, soft, round, glass, solid. Map 正方形, 方形, 直角, 外框改成正方形 to sharp. Map 卡片變圓 to round. Map 毛玻璃 to glass.',
      'Background may use color hex or preset: default, dark, light, soft, neon, pastel, warm, cool, minimal, lab, catRoom.',
      'Map 背景改成黑色 to {"action":"setBackground","color":"#050505"}. Map 背景改成特殊金色 to {"action":"setBackground","color":"#b88a2a"}.',
      'Map 字改成黑色 or 文字改成黑色 to {"action":"setTextColor","color":"#050505"}.',
      'Canonical example: {"actions":[{"action":"setBackground","color":"#050505"}],"reply":"準備把背景改成黑色。","decisionSummary":"使用安全 action，不執行 CSS。","requiresConfirmation":true,"preview":{"label":"黑色背景","color":"#050505"}}',
      'Response shape: {"action":{...} or "actions":[...],"reply":"Traditional Chinese reply","decisionSummary":"short Traditional Chinese explanation","requiresConfirmation":true|false,"preview":{"label":"optional","color":"optional hex"}}',
      `Current state: ${JSON.stringify(sanitizeNavigatorState(state))}`,
      `User message: ${cleanMessage}`
    ].join('\n');

    const modelErrors = [];

    for (const model of modelChain) {
      const result = await callGoogleModel({ model, apiKey, prompt, jsonMode: true });
      if (!result.ok) {
        modelErrors.push(`${model}:${result.status}`);
        continue;
      }

      const parsed = parseModelJson(result.reply);
      if (!parsed) {
        modelErrors.push(`${model}:invalid-json`);
        continue;
      }

      return sendJson(res, 200, normalizeNavigatorPayload({
        ...parsed,
        model,
        latencyMs: Date.now() - startedAt,
        fallbackTried: modelErrors
      }, cleanMessage));
    }

    return sendJson(res, 200, {
      ...buildNavigatorFallback(cleanMessage, 'fallback-all-failed', Date.now() - startedAt),
      fallbackTried: modelErrors
    });
  } catch {
    return sendJson(res, 200, buildNavigatorFallback('', 'fallback-error', 0));
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

  if (req.method === 'POST' && url.pathname === '/api/ai-navigator') {
    return handleAiNavigator(req, res);
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

function sanitizeNavigatorState(state) {
  if (!state || typeof state !== 'object') return {};
  return {
    theme: state.theme,
    fontSize: state.fontSize,
    fontFamily: state.fontFamily,
    backgroundPreset: state.backgroundPreset,
    customBackgroundColor: state.customBackgroundColor,
    customTextColor: state.customTextColor,
    shapeMode: state.shapeMode,
    currentPage: state.currentPage,
    pageIndex: state.pageIndex,
    totalPages: state.totalPages,
    presentationMode: state.presentationMode
  };
}

function parseModelJson(text) {
  const raw = String(text || '').trim();
  const direct = parseJsonCandidate(raw);
  if (direct) return direct;

  const withoutFence = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const unfenced = parseJsonCandidate(withoutFence);
  if (unfenced) return unfenced;

  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  return parseJsonCandidate(withoutFence.slice(start, end + 1));
}

function parseJsonCandidate(candidate) {
  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return parseJsonCandidate(parsed);
    if (Array.isArray(parsed) && parsed.length && parsed.every((item) => item && typeof item === 'object')) {
      return { actions: parsed };
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeNavigatorPayload(payload, message) {
  let actions = normalizeActionList(payload?.actions ?? payload?.action ?? payload);

  if (!actions.length) {
    actions = [{ action: 'unknown', message: '模型沒有產生可執行的 action，但我已收到你的需求。' }];
  }

  const preview = payload?.preview && typeof payload.preview === 'object' ? { ...payload.preview } : {};
  const repairedVisualAction = actions.length === 1
    ? repairVisualIntent(actions[0], message)
    : null;
  const repairedPayload = repairedVisualAction
    ? buildBackgroundNavigatorPayload(repairedVisualAction.color, payload?.model, payload?.latencyMs)
    : null;

  if (repairedVisualAction) actions = [repairedVisualAction];

  actions = actions.map((action) => {
    if (action.action === 'goToPage') {
      const target = normalizePageTarget(action.target || action.page || action.value) || inferPageTarget(message);
      return target
        ? { action: 'goToPage', target }
        : { action: 'unknown', message: '頁面 action 缺少合法 target，因此沒有切換頁面。' };
    }
    if (action.action === 'setBackground' && action.color) {
      const hex = normalizeHex(action.color);
      preview.color = preview.color || hex || action.color;
      return { ...action, color: hex || action.color };
    }
    if (action.action === 'setTextColor' && action.color) {
      const hex = normalizeHex(action.color);
      preview.color = preview.color || hex || action.color;
      return { ...action, color: hex || action.color };
    }
    return action;
  });

  const visualActions = new Set(['setBackground', 'setTextColor', 'setTheme', 'setFontSize', 'setFontFamily', 'setShapeMode']);
  return {
    actions,
    action: actions[0],
    reply: String(payload?.reply || '模型已判斷這個需求，請確認是否套用。').slice(0, 500),
    decisionSummary: String(payload?.decisionSummary || buildSimpleDecisionSummary(actions[0], message)).slice(0, 360),
    requiresConfirmation: Boolean(payload?.requiresConfirmation ?? actions.some((item) => visualActions.has(item.action))),
    preview,
    model: payload?.model,
    latencyMs: payload?.latencyMs,
    fallbackTried: payload?.fallbackTried || [],
    ...(repairedPayload ? {
      reply: repairedPayload.reply,
      decisionSummary: repairedPayload.decisionSummary,
      requiresConfirmation: true,
      preview: repairedPayload.preview
    } : {})
  };
}

function buildNavigatorFallback(message, model, latencyMs) {
  const inferredPage = inferPageTarget(message);
  if (inferredPage) {
    return {
      action: { action: 'goToPage', target: inferredPage },
      reply: `模型暫時無法回應，所以改用保底判斷：已辨識為切換到「${getPageLabel(inferredPage)}」。`,
      decisionSummary: '保底模式依照頁面關鍵字產生 goToPage action；仍會由前端 Action Router 驗證與執行。',
      requiresConfirmation: false,
      preview: {},
      model,
      latencyMs
    };
  }

  const inferredColor = inferBackgroundColor(message);
  if (inferredColor) {
    return buildBackgroundNavigatorPayload(inferredColor, model, latencyMs);
  }

  const text = String(message || '').toLowerCase();
  let color = null;
  if (text.includes('金')) color = '#b88a2a';
  else if (text.includes('黑')) color = '#050505';
  else if (text.includes('白')) color = '#ffffff';
  else if (text.includes('粉')) color = '#ffd6e8';
  else {
    const match = text.match(/#?[0-9a-f]{6}/i);
    if (match) color = normalizeHex(match[0]);
  }

  if (color) {
    return {
      action: { action: 'setBackground', color },
      reply: `模型暫時無法回應，所以改用保底判斷：我建議先預覽背景色 ${color}，你可以套用或拒絕。`,
      decisionSummary: '保底模式依照顏色描述產生一個合法 hex 色碼；仍需使用者確認才套用。',
      requiresConfirmation: true,
      preview: { label: '背景色預覽', color },
      model,
      latencyMs
    };
  }

  return {
    action: { action: 'unknown', message: '我已收到你的需求，但目前模型無法產生可靠 action。可以換句話描述，或指定頁面、色彩、字體、形狀、跑馬燈。' },
    reply: '我已收到你的需求，但目前模型無法產生可靠 action。可以換句話描述，或指定頁面、色彩、字體、形狀、跑馬燈。',
    decisionSummary: '沒有足夠資訊產生安全 action，因此先不改畫面。',
    requiresConfirmation: false,
    preview: {},
    model,
    latencyMs
  };
}

function normalizeActionShape(action) {
  if (!action || typeof action !== 'object') return { action: 'unknown' };
  if (typeof action.action === 'string') {
    if (action.action === 'goToPage' && action.page && !action.target) {
      return { ...action, target: action.page };
    }
    if (action.action === 'setBackground' && action.value && !action.color && !action.preset) {
      const hex = normalizeHex(action.value);
      return hex ? { ...action, color: hex } : { ...action, preset: String(action.value) };
    }
    return action;
  }

  if (action.goToPage || action.page || action.target) {
    return { action: 'goToPage', target: String(action.goToPage || action.page || action.target) };
  }
  if (action.setBackground || action.background || action.bg || action.color) {
    const value = action.setBackground || action.background || action.bg || action.color;
    const hex = normalizeHex(value);
    return hex ? { action: 'setBackground', color: hex } : { action: 'setBackground', preset: String(value) };
  }
  if (action.setTextColor || action.textColor || action.fontColor) {
    return { action: 'setTextColor', color: String(action.setTextColor || action.textColor || action.fontColor) };
  }
  if (action.setFontSize || action.fontSize) {
    return { action: 'setFontSize', size: String(action.setFontSize || action.fontSize) };
  }
  if (action.setFontFamily || action.fontFamily) {
    return { action: 'setFontFamily', family: String(action.setFontFamily || action.fontFamily) };
  }
  if (action.setShapeMode || action.shapeMode) {
    return { action: 'setShapeMode', mode: String(action.setShapeMode || action.shapeMode) };
  }
  if (action.setTheme || action.theme) {
    return { action: 'setTheme', theme: String(action.setTheme || action.theme) };
  }
  if (action.setMarquee || action.marquee) {
    return { action: 'setMarquee', text: String(action.setMarquee || action.marquee) };
  }
  if (action.setPresentationMode || action.presentationMode) {
    return { action: 'setPresentationMode', mode: String(action.setPresentationMode || action.presentationMode) };
  }

  const entries = Object.entries(action);
  if (entries.length !== 1) return action;

  const [name, value] = entries[0];
  switch (name) {
    case 'goToPage':
      return { action: 'goToPage', target: String(value) };
    case 'setBackground':
      if (typeof value === 'string') {
        const hex = normalizeHex(value);
        return hex ? { action: 'setBackground', color: hex } : { action: 'setBackground', preset: value };
      }
      return { action: 'setBackground', ...(value || {}) };
    case 'setTextColor':
      return typeof value === 'string'
        ? { action: 'setTextColor', color: value }
        : { action: 'setTextColor', ...(value || {}) };
    case 'setFontSize':
      return { action: 'setFontSize', size: String(value) };
    case 'setFontFamily':
      return { action: 'setFontFamily', family: String(value) };
    case 'setShapeMode':
      return { action: 'setShapeMode', mode: String(value) };
    case 'setTheme':
      return { action: 'setTheme', theme: String(value) };
    default:
      return action;
  }
}

function normalizeActionList(rawAction) {
  if (!rawAction) return [];
  if (Array.isArray(rawAction)) return rawAction.map((item) => normalizeActionShape(item)).filter(Boolean);
  if (rawAction.actions && Array.isArray(rawAction.actions)) {
    return rawAction.actions.map((item) => normalizeActionShape(item)).filter(Boolean);
  }
  if (typeof rawAction === 'object' && !rawAction.action) {
    const compound = splitCompoundActions(rawAction);
    if (compound.length) return compound.map((item) => normalizeActionShape(item)).filter(Boolean);
  }
  return [normalizeActionShape(rawAction)];
}

function splitCompoundActions(rawAction) {
  const actions = [];
  if (!rawAction || typeof rawAction !== 'object') return actions;

  if (rawAction.goToPage || rawAction.page || rawAction.target) {
    actions.push({ action: 'goToPage', target: rawAction.goToPage || rawAction.page || rawAction.target });
  }
  if (rawAction.nextPage) actions.push({ action: 'nextPage' });
  if (rawAction.previousPage) actions.push({ action: 'previousPage' });
  if (rawAction.getCurrentProgress) actions.push({ action: 'getCurrentProgress' });
  if (rawAction.generatePpt) actions.push({ action: 'generatePpt' });
  if (rawAction.downloadPpt) actions.push({ action: 'downloadPpt' });
  if (rawAction.resetSettings) actions.push({ action: 'resetSettings' });
  if (rawAction.setTheme || rawAction.theme) actions.push({ action: 'setTheme', theme: rawAction.setTheme || rawAction.theme });
  if (rawAction.setFontSize || rawAction.fontSize) actions.push({ action: 'setFontSize', size: rawAction.setFontSize || rawAction.fontSize });
  if (rawAction.setFontFamily || rawAction.fontFamily) actions.push({ action: 'setFontFamily', family: rawAction.setFontFamily || rawAction.fontFamily });
  if (rawAction.setBackground || rawAction.background || rawAction.bg || rawAction.color) {
    actions.push({ action: 'setBackground', value: rawAction.setBackground || rawAction.background || rawAction.bg || rawAction.color });
  }
  if (rawAction.setTextColor || rawAction.textColor || rawAction.fontColor) {
    actions.push({ action: 'setTextColor', color: rawAction.setTextColor || rawAction.textColor || rawAction.fontColor });
  }
  if (rawAction.setShapeMode || rawAction.shapeMode) {
    actions.push({ action: 'setShapeMode', mode: rawAction.setShapeMode || rawAction.shapeMode });
  }
  if (rawAction.setMarquee || rawAction.marquee) actions.push({ action: 'setMarquee', text: rawAction.setMarquee || rawAction.marquee });
  if (rawAction.setPresentationMode || rawAction.presentationMode) {
    actions.push({ action: 'setPresentationMode', mode: rawAction.setPresentationMode || rawAction.presentationMode });
  }

  return actions;
}

function repairVisualIntent(action, message) {
  const color = inferBackgroundColor(message);
  if (!color || action.action === 'setBackground' || hasTextColorIntent(message)) return null;
  return {
    action: 'setBackground',
    color,
    meta: { repairedFromModelAction: action.action || 'unknown' }
  };
}

function inferBackgroundColor(message) {
  const text = String(message || '').trim().toLowerCase();
  const hasBackgroundIntent = /(背景|底色|頁面色|畫面色|版面色|surface|background|bg)/i.test(text);
  const hasColorIntent = /(顏色|色|color|colour)/i.test(text);
  if (!hasBackgroundIntent && !hasColorIntent) return null;

  const hex = text.match(/#?[0-9a-f]{6}/i)?.[0];
  if (hex) return normalizeHex(hex);

  const colorMap = [
    [/(特殊.*金|金.*特殊|香檳金|金色|金黃|琥珀|奢華|gold|champagne|amber)/i, '#b88a2a'],
    [/(白色|純白|white)/i, '#ffffff'],
    [/(黑色|深黑|black)/i, '#050505'],
    [/(粉紅|粉色|pink)/i, '#ffd6e8'],
    [/(奶油|米色|cream|warm)/i, '#fff8ed'],
    [/(藍色|冷色|blue|cool)/i, '#eff6ff'],
    [/(綠色|green)/i, '#d8f3dc'],
    [/(紫色|purple|violet)/i, '#efe7ff']
  ];

  return colorMap.find(([pattern]) => pattern.test(text))?.[1] || null;
}

function inferPageTarget(message) {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return null;

  const direct = normalizePageTarget(text);
  if (direct) return direct;

  const pageRules = [
    ['presentation', /(最後一頁|簡報頁|技術簡報|看簡報|簡報|報告|ppt|presentation|notes)/i],
    ['contact', /(控制頁|導覽頁|快速導覽|智慧導覽|ai\s*控制|assistant|contact)/i],
    ['about', /(影像頁|影片頁|remotion|影片|影像|about)/i],
    ['gallery', /(展示頁|作品頁|圖片頁|展示|作品|gallery)/i],
    ['tech', /(技術頁|技術|實作|架構|three|gsap|anime|modules)/i],
    ['features', /(特色頁|功能頁|功能介紹|特色|功能|亮點|features|stories)/i],
    ['intro', /(介紹頁|場域頁|3d|模型|介紹|intro|scene)/i],
    ['home', /(首頁|主頁|封面|回首頁|回到首頁|home|hero)/i]
  ];

  return pageRules.find(([, pattern]) => pattern.test(text))?.[0] || null;
}

function normalizePageTarget(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  if (['home', 'intro', 'features', 'tech', 'gallery', 'about', 'contact', 'presentation'].includes(text)) return text;

  const aliasMap = {
    hero: 'home',
    scene: 'intro',
    stories: 'features',
    modules: 'tech',
    remotion: 'about',
    assistant: 'contact',
    notes: 'presentation',
    '首頁': 'home',
    '主頁': 'home',
    '封面': 'home',
    '介紹': 'intro',
    '介紹頁': 'intro',
    '場域': 'intro',
    '特色': 'features',
    '特色頁': 'features',
    '功能': 'features',
    '功能頁': 'features',
    '技術': 'tech',
    '技術頁': 'tech',
    '展示': 'gallery',
    '展示頁': 'gallery',
    '作品': 'gallery',
    '作品頁': 'gallery',
    '影像': 'about',
    '影像頁': 'about',
    '影片': 'about',
    '影片頁': 'about',
    '控制': 'contact',
    '控制頁': 'contact',
    '導覽': 'contact',
    '導覽頁': 'contact',
    '簡報': 'presentation',
    '簡報頁': 'presentation',
    '報告': 'presentation'
  };

  return aliasMap[text] || null;
}

function getPageLabel(pageId) {
  return {
    home: '首頁',
    intro: '介紹',
    features: '特色',
    tech: '技術',
    gallery: '展示',
    about: '影像',
    contact: '控制',
    presentation: '簡報'
  }[pageId] || pageId;
}

function hasTextColorIntent(message) {
  return /(文字|字體|字|text|font)/i.test(String(message || ''));
}

function buildBackgroundNavigatorPayload(color, model, latencyMs) {
  const normalizedColor = normalizeHex(color) || color;
  const label = getBackgroundColorLabel(normalizedColor);
  return {
    action: { action: 'setBackground', color: normalizedColor },
    reply: `我先把這個要求判定為背景色調整，準備套用「${label}」${normalizedColor}。你可以先看預覽，滿意再套用。`,
    decisionSummary: '判斷到背景與顏色意圖，因此產生 setBackground 提案；保留目前主題，只改背景表層。',
    requiresConfirmation: true,
    preview: { label, color: normalizedColor },
    model,
    latencyMs
  };
}

function getBackgroundColorLabel(color) {
  const normalized = normalizeHex(color);
  const labels = {
    '#050505': '黑色背景',
    '#111827': '深色背景',
    '#ffffff': '白色背景',
    '#ffd6e8': '粉紅色背景',
    '#fff8ed': '奶油色背景',
    '#eff6ff': '冷色背景',
    '#d8f3dc': '綠色背景',
    '#efe7ff': '紫色背景',
    '#b88a2a': '特殊金色背景',
    '#d4af37': '金色背景',
    '#d7c27a': '香檳金背景',
    '#d8dde6': '銀色背景'
  };

  return labels[normalized] || '自訂背景色';
}

function buildSimpleDecisionSummary(action, message) {
  if (action.action === 'setBackground') return `根據「${message}」選擇背景色或背景 preset，套用前先讓使用者確認。`;
  if (action.action === 'setTextColor') return `根據「${message}」選擇文字顏色，套用前先讓使用者確認。`;
  if (action.action === 'unknown') return '模型沒有足夠把握改動畫面，因此改成回覆說明。';
  return '模型已將自然語言轉成網站可理解的 action。';
}

function normalizeHex(input) {
  const raw = String(input || '').trim();
  const value = raw.startsWith('#') ? raw.slice(1) : raw;
  return /^[0-9a-f]{6}$/i.test(value) ? `#${value.toLowerCase()}` : null;
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

