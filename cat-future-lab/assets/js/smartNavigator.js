import { askNavigatorIntent } from './api.js';
import { coerceAIActionList, handleVisibleAIAction as handleAIAction, inferActionsFromText, parseNavigatorCommand, validateAIAction } from './aiActions.js';
import { getState, subscribeState } from './state.js';

const RESTORABLE_ACTIONS = new Set([
  'goToPage',
  'nextPage',
  'previousPage',
  'setTheme',
  'setFontSize',
  'setFontFamily',
  'setBackground',
  'setTextColor',
  'setShapeMode',
  'setMarquee',
  'setPresentationMode'
]);

const CONFIRM_ACTIONS = new Set([
  'setTheme',
  'setFontSize',
  'setFontFamily',
  'setBackground',
  'setTextColor',
  'setShapeMode'
]);

const AUTO_CLOSE_ACTIONS = new Set([
  'goToPage',
  'nextPage',
  'previousPage',
  'setTheme',
  'setFontSize',
  'setFontFamily',
  'setBackground',
  'setTextColor',
  'setShapeMode',
  'setPresentationMode'
]);

let lastRestorableAction = null;
let lastRestorableState = null;
let closeGlobalModal = null;

export function initSmartNavigator() {
  initGlobalNavigatorModal();
  document.querySelectorAll('[data-chat-form]').forEach(bindNavigatorForm);
}

function bindNavigatorForm(form) {
  if (!form || form.dataset.mode === 'smart-navigator') return;

  const scope = form.closest('.ai-modal__panel') || form.closest('.assistant-panel') || document;
  const output = scope.querySelector('[data-chat-output]');
  const input = form.querySelector('input[name="message"]');
  if (!output || !input) return;

  const isModalForm = Boolean(form.closest('.ai-modal__panel'));
  const scheduleAutoClose = (actions) => {
    if (!isModalForm || typeof closeGlobalModal !== 'function') return;
    if (!shouldAutoClose(actions)) return;
    window.setTimeout(() => closeGlobalModal?.(), 160);
  };

  form.dataset.mode = 'smart-navigator';

  subscribeState((state) => {
    form.dataset.currentPage = state.currentPage;
    form.dataset.theme = state.theme;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) {
      setTextStatus(output, 'idle', '請輸入想控制或想詢問的內容。');
      return;
    }

    setTextStatus(output, 'loading', '正在判斷安全 action...');
    input.value = '';

    const beforeState = getState();
    const parsed = isRestoreLastCommand(message)
      ? buildRestoreCommand()
      : await getModelDecision(message, beforeState);

    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
    const validation = validateActionList(actions);
    if (!validation.ok) {
      renderDecision(output, {
        state: 'error',
        reply: `這個指令沒有執行：${validation.reason}`,
        decisionSummary: parsed.decisionSummary || 'Action schema 驗證失敗，因此沒有改畫面。',
        actions,
        model: parsed.model,
        latencyMs: parsed.latencyMs
      });
      return;
    }

    const unknownOnly = actions.every((action) => action.action === 'unknown');
    const shouldConfirm = parsed.requiresConfirmation || actions.some((action) => CONFIRM_ACTIONS.has(action.action));
    if (shouldConfirm && !unknownOnly) {
      renderProposal(output, parsed, beforeState, {
        onApplied: () => scheduleAutoClose(parsed.actions)
      });
      return;
    }

    const result = applyActions(actions);
    if (result.ok) rememberRestorableAction(actions, beforeState);
    renderDecision(output, {
      state: result.ok ? 'success' : 'error',
      reply: result.reply || parsed.reply || '已完成。',
      decisionSummary: parsed.decisionSummary,
      actions,
      model: parsed.model,
      latencyMs: parsed.latencyMs
    });

    if (result.ok) scheduleAutoClose(actions);
  });
}

function initGlobalNavigatorModal() {
  const modal = document.querySelector('[data-ai-modal]');
  const openers = document.querySelectorAll('[data-ai-open]');
  if (!modal || !openers.length || modal.dataset.bound === 'true') return;

  const input = modal.querySelector('input[name="message"]');
  const closers = modal.querySelectorAll('[data-ai-close]');

  const open = () => {
    modal.hidden = false;
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      input?.focus();
    });
  };

  const close = () => {
    modal.classList.remove('is-open');
    window.setTimeout(() => {
      modal.hidden = true;
    }, 180);
  };

  closeGlobalModal = close;
  openers.forEach((button) => button.addEventListener('click', open));
  closers.forEach((button) => button.addEventListener('click', close));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });

  modal.dataset.bound = 'true';
}

async function getModelDecision(message, state) {
  const localFallback = parseNavigatorCommand(message, state);
  const fallbackActions = Array.isArray(localFallback.actions)
    ? localFallback.actions
    : (localFallback.action ? [localFallback.action] : []);

  try {
    const modelDecision = await askNavigatorIntent(message, state);
    return normalizeDecision(modelDecision, message, fallbackActions);
  } catch {
    const actions = fallbackActions.length
      ? fallbackActions
      : [{ action: 'unknown', message: 'AI API 暫時無法連線，本機 parser 也沒有找到安全 action。' }];
    return {
      actions: coerceAIActionList(actions, message),
      reply: describePendingAction(actions),
      decisionSummary: 'AI API 無法連線時，改用本機 parser，仍會經過 Action Router。',
      requiresConfirmation: actions.some((action) => CONFIRM_ACTIONS.has(action.action)),
      model: 'local-parser-fallback'
    };
  }
}

function normalizeDecision(value, originalMessage, fallbackActions = []) {
  const rawActions = value?.actions || value?.action || value || { action: 'unknown', message: value?.reply || '沒有回傳 action。' };
  const actionList = coerceAIActionList(rawActions, originalMessage);
  const inferred = inferActionsFromText(originalMessage);
  const actions = mergeActionLists(actionList, inferred.length ? inferred : fallbackActions);
  const preview = value?.preview && typeof value.preview === 'object' ? { ...value.preview } : {};
  const previewColor = findPreviewColor(actions);
  if (previewColor && !preview.color) preview.color = previewColor;

  return {
    actions,
    reply: safeText(value?.reply) || describePendingAction(actions),
    decisionSummary: safeText(value?.decisionSummary) || `已把「${originalMessage}」轉成安全 JSON action。`,
    requiresConfirmation: Boolean(value?.requiresConfirmation),
    preview,
    model: value?.model,
    latencyMs: value?.latencyMs
  };
}

function renderProposal(output, decision, beforeState, callbacks = {}) {
  output.dataset.state = 'loading';
  output.replaceChildren();

  const wrap = document.createElement('div');
  wrap.className = 'ai-proposal';

  const title = document.createElement('strong');
  title.textContent = '確認要套用嗎？';

  const reply = document.createElement('p');
  reply.textContent = decision.reply || describePendingAction(decision.actions);

  const summary = document.createElement('p');
  summary.className = 'ai-proposal__summary';
  summary.textContent = decision.decisionSummary || '這是會改變畫面的操作，確認後才會由 Action Router 套用。';

  wrap.append(title, reply, summary);

  const color = decision.preview?.color || findPreviewColor(decision.actions);
  if (color) {
    const swatch = document.createElement('div');
    swatch.className = 'ai-proposal__swatch';
    const chip = document.createElement('span');
    chip.style.background = color;
    const label = document.createElement('em');
    label.textContent = `${decision.preview?.label || '預覽顏色'}：${color}`;
    swatch.append(chip, label);
    wrap.append(swatch);
  }

  const code = document.createElement('code');
  code.className = 'ai-proposal__action';
  code.textContent = JSON.stringify(formatActionsForDisplay(decision.actions));
  wrap.append(code);

  const actions = document.createElement('div');
  actions.className = 'ai-proposal__actions';

  const accept = document.createElement('button');
  accept.type = 'button';
  accept.className = 'button button--primary';
  accept.textContent = '確認套用';

  const reject = document.createElement('button');
  reject.type = 'button';
  reject.className = 'button button--secondary';
  reject.textContent = '取消';

  accept.addEventListener('click', () => {
    const result = applyActions(decision.actions || []);
    if (result.ok) rememberRestorableAction(decision.actions || [], beforeState);
    renderDecision(output, {
      state: result.ok ? 'success' : 'error',
      reply: result.reply,
      decisionSummary: '使用者確認後，已由 Action Router 套用。',
      actions: decision.actions,
      model: decision.model,
      latencyMs: decision.latencyMs
    });
    if (result.ok) callbacks.onApplied?.(decision.actions || []);
  });

  reject.addEventListener('click', () => {
    renderDecision(output, {
      state: 'idle',
      reply: '已取消，畫面沒有變更。',
      decisionSummary: decision.decisionSummary,
      actions: [{ action: 'unknown', message: '使用者取消操作。' }],
      model: decision.model,
      latencyMs: decision.latencyMs
    });
  });

  actions.append(accept, reject);
  wrap.append(actions);
  output.append(wrap);
}

function renderDecision(output, { state, reply, decisionSummary, actions, model, latencyMs }) {
  output.dataset.state = state || 'success';
  output.replaceChildren();

  const wrap = document.createElement('div');
  wrap.className = 'ai-decision';

  const replyNode = document.createElement('p');
  replyNode.textContent = safeText(reply) || '已完成。';
  wrap.append(replyNode);

  if (decisionSummary) {
    const summary = document.createElement('p');
    summary.className = 'ai-proposal__summary';
    summary.textContent = `判斷：${decisionSummary}`;
    wrap.append(summary);
  }

  if (actions && actions.length) {
    const actionNode = document.createElement('code');
    actionNode.className = 'ai-proposal__action';
    actionNode.textContent = JSON.stringify(formatActionsForDisplay(actions));
    wrap.append(actionNode);
  }

  const meta = [model, Number.isFinite(Number(latencyMs)) ? `${latencyMs}ms` : ''].filter(Boolean);
  if (meta.length) {
    const metaNode = document.createElement('small');
    metaNode.textContent = meta.join(' / ');
    wrap.append(metaNode);
  }

  output.append(wrap);
}

function setTextStatus(node, state, text) {
  node.dataset.state = state;
  node.textContent = text;
}

function shouldAutoClose(actions) {
  return Array.isArray(actions) && actions.some((action) => AUTO_CLOSE_ACTIONS.has(action.action));
}

function rememberRestorableAction(actions, beforeState) {
  const list = Array.isArray(actions) ? actions : [actions];
  const restorable = list.filter((action) => RESTORABLE_ACTIONS.has(action.action) && action.meta?.restore !== true);
  if (!restorable.length) return;
  lastRestorableAction = restorable.length > 1
    ? { action: 'batch', actions: restorable }
    : { ...restorable[0] };
  lastRestorableState = { ...beforeState };
}

function buildRestoreCommand() {
  if (!lastRestorableAction || !lastRestorableState) {
    return {
      actions: [{ action: 'unknown', message: '目前沒有可以還原的上一個操作。' }],
      reply: '目前沒有可以還原的上一個操作。',
      requiresConfirmation: false
    };
  }

  const inverse = lastRestorableAction.action === 'batch'
    ? buildInverseActions(lastRestorableAction.actions || [], lastRestorableState)
    : buildInverseAction(lastRestorableAction, lastRestorableState);
  const actions = Array.isArray(inverse) ? inverse : (inverse ? [inverse] : []);
  actions.forEach((action) => {
    if (action && typeof action === 'object') action.meta = { restore: true };
  });

  return {
    actions: actions.length ? actions : [{ action: 'unknown', message: '上一個操作無法安全還原。' }],
    reply: actions.length ? '準備還原上一個操作。' : '上一個操作無法安全還原。',
    decisionSummary: '根據上一個 AppState 產生反向 action。',
    requiresConfirmation: false
  };
}

function buildInverseActions(actions, previous) {
  return actions.map((action) => buildInverseAction(action, previous)).filter(Boolean);
}

function buildInverseAction(action, previous) {
  switch (action.action) {
    case 'goToPage':
    case 'nextPage':
    case 'previousPage':
      return { action: 'goToPage', target: previous.currentPage };
    case 'setTheme':
      return { action: 'setTheme', theme: previous.theme };
    case 'setFontSize':
      return { action: 'setFontSize', size: previous.fontSize };
    case 'setFontFamily':
      return { action: 'setFontFamily', family: previous.fontFamily };
    case 'setShapeMode':
      return { action: 'setShapeMode', mode: previous.shapeMode };
    case 'setMarquee':
      return { action: 'setMarquee', text: previous.marqueeText };
    case 'setPresentationMode':
      return { action: 'setPresentationMode', mode: previous.presentationMode };
    case 'setBackground':
      return previous.customBackgroundColor
        ? { action: 'setBackground', color: previous.customBackgroundColor }
        : { action: 'setBackground', preset: previous.backgroundPreset || 'default' };
    case 'setTextColor':
      return previous.customTextColor ? { action: 'setTextColor', color: previous.customTextColor } : null;
    default:
      return null;
  }
}

function isRestoreLastCommand(message) {
  const text = String(message || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!text) return false;
  if (/重設|還原預設|resetsettings/.test(text)) return false;
  return ['還原', '上一步', '復原', 'undo'].includes(text);
}

function describePendingAction(actionOrActions) {
  const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
  if (!actions.length) return '沒有可執行的 action。';
  if (actions.length === 1) return describeSingleAction(actions[0]);
  return `準備執行 ${actions.length} 個安全 action。`;
}

function describeSingleAction(action) {
  switch (action?.action) {
    case 'setBackground':
      return action.color ? `準備把背景改成 ${action.color}。` : `準備套用 ${action.preset} 背景。`;
    case 'setTextColor':
      return `準備把文字改成 ${action.color}。`;
    case 'setFontSize':
      return `準備調整字體大小為 ${action.size}。`;
    case 'setFontFamily':
      return `準備調整字體為 ${action.family}。`;
    case 'setShapeMode':
      return `準備調整形狀為 ${action.mode}。`;
    case 'setTheme':
      return `準備切換主題為 ${action.theme}。`;
    case 'goToPage':
      return `準備切到 ${action.target}。`;
    case 'nextPage':
      return '準備切到下一頁。';
    case 'previousPage':
      return '準備切到上一頁。';
    case 'setMarquee':
      return '準備更新跑馬燈。';
    case 'unknown':
      return safeText(action.message) || '沒有足夠資訊產生安全 action。';
    default:
      return '準備執行安全 action。';
  }
}

function validateActionList(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return { ok: false, reason: '沒有可驗證的 action。' };
  for (let index = 0; index < actions.length; index += 1) {
    const validation = validateAIAction(actions[index]);
    if (!validation.ok) return { ok: false, reason: `第 ${index + 1} 個 action 錯誤：${validation.reason}` };
  }
  return { ok: true };
}

function applyActions(actions) {
  const replies = [];
  for (const action of actions) {
    const result = handleAIAction(action, { persist: true });
    if (result.reply) replies.push(result.reply);
    if (!result.ok) return { ok: false, reply: result.reply || '執行失敗。' };
  }
  return { ok: true, reply: replies.filter(Boolean).join(' ') };
}

function mergeActionLists(primary, fallback) {
  const base = Array.isArray(primary) && primary.length
    ? primary
    : [{ action: 'unknown', message: '沒有回傳 action。' }];
  const fallbackList = Array.isArray(fallback) ? fallback : [];
  const fallbackValid = fallbackList.filter((action) => action && action.action && action.action !== 'unknown');

  if (base.length === 1 && base[0].action === 'unknown' && fallbackValid.length) return fallbackValid;
  if (base.length > 1) return base;

  const used = new Set(base.map((action) => action.action));
  const merged = [...base];
  fallbackValid.forEach((action) => {
    if (!used.has(action.action)) {
      used.add(action.action);
      merged.push(action);
    }
  });
  return merged;
}

function findPreviewColor(actions) {
  if (!Array.isArray(actions)) return null;
  return actions.find((action) => (
    (action.action === 'setBackground' || action.action === 'setTextColor') && action.color
  ))?.color || null;
}

function formatActionsForDisplay(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  return actions.length === 1 ? actions[0] : actions;
}

function safeText(value) {
  return String(value || '').trim();
}
