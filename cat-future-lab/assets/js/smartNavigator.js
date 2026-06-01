import { askNavigatorIntent } from './api.js';
import { FONT_FAMILY_LABELS } from './config.js';
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
    window.setTimeout(() => closeGlobalModal?.(), 140);
  };

  form.dataset.mode = 'smart-navigator';

  subscribeState((state) => {
    form.dataset.currentPage = state.currentPage;
    form.dataset.theme = state.theme;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    setTextStatus(output, 'loading', '正在詢問模型並整理可執行動作...');
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
        reply: `模型回傳的 action 無法執行：${safeText(validation.reason)}`,
        decisionSummary: parsed.decisionSummary || '已阻擋不符合 schema 的操作。',
        actions,
        model: parsed.model,
        latencyMs: parsed.latencyMs
      });
      return;
    }

    const shouldConfirm = parsed.requiresConfirmation || actions.some((action) => CONFIRM_ACTIONS.has(action.action));
    const unknownOnly = actions.every((action) => action.action === 'unknown');
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
      reply: result.reply || parsed.reply || '已處理完成。',
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
  try {
    const modelDecision = await askNavigatorIntent(message, state);
    return normalizeDecision(modelDecision, message);
  } catch {
    const fallback = parseNavigatorCommand(message, state);
    const fallbackActions = Array.isArray(fallback.actions)
      ? fallback.actions
      : (fallback.action ? [fallback.action] : []);
    const actions = fallbackActions.length
      ? fallbackActions
      : [{ action: 'unknown', message: '模型暫時無法回應，所以改用本機解析。你可以要求切換頁面、背景、字體、形狀或詢問區塊做法。' }];

    return {
      actions: coerceAIActionList(actions, message),
      reply: describePendingAction(actions),
      decisionSummary: 'AI API 無法連線時，系統改用本機 fallback parser，仍會經過 Action Router。',
      requiresConfirmation: actions.some((action) => CONFIRM_ACTIONS.has(action.action)),
      model: 'local-parser-fallback'
    };
  }
}

function normalizeDecision(value, originalMessage) {
  const rawActions = value?.actions || value?.action || value || { action: 'unknown', message: value?.reply || '模型沒有回傳有效 action。' };
  const actionList = coerceAIActionList(rawActions, originalMessage);
  const inferred = inferActionsFromText(originalMessage);
  const actions = mergeActionLists(actionList, inferred);
  const preview = value?.preview && typeof value.preview === 'object' ? { ...value.preview } : {};
  const previewColor = findPreviewColor(actions);
  if (previewColor && !preview.color) preview.color = previewColor;

  return {
    actions,
    reply: safeText(value?.reply) || describePendingAction(actions),
    decisionSummary: safeText(value?.decisionSummary) || `已理解「${originalMessage}」，並轉成安全 JSON Action。`,
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
  title.textContent = '需要確認';

  const reply = document.createElement('p');
  reply.textContent = decision.reply || describePendingAction(decision.actions);

  const summary = document.createElement('p');
  summary.className = 'ai-proposal__summary';
  summary.textContent = decision.decisionSummary || '這個操作會改變頁面狀態，確認後才會套用。';

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
  accept.textContent = '套用';

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
      reply: '已取消這次操作，畫面維持不變。',
      decisionSummary: decision.decisionSummary,
      actions: [{ action: 'unknown', message: '使用者取消操作' }],
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
  replyNode.textContent = safeText(reply) || '已處理完成。';
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
  if (!Array.isArray(actions) || actions.length === 0) return false;
  return actions.some((action) => AUTO_CLOSE_ACTIONS.has(action.action));
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
      actions: [{ action: 'unknown', message: '目前沒有可復原的上一個操作。' }],
      reply: '目前沒有可復原的上一個操作。',
      requiresConfirmation: false
    };
  }

  const inverse = lastRestorableAction.action === 'batch'
    ? buildInverseActions(lastRestorableAction.actions || [], lastRestorableState)
    : buildInverseAction(lastRestorableAction, lastRestorableState);
  const actions = Array.isArray(inverse) ? inverse : (inverse ? [inverse] : []);

  if (!actions.length) {
    return {
      actions: [{ action: 'unknown', message: '上一個操作無法自動復原。' }],
      reply: '上一個操作無法自動復原。',
      requiresConfirmation: false
    };
  }

  actions.forEach((action) => {
    if (action && typeof action === 'object') action.meta = { restore: true };
  });
  return {
    actions,
    reply: '準備復原上一個可回復操作。',
    decisionSummary: '依照上一個 AppState 快照建立反向 action。',
    requiresConfirmation: false
  };
}

function buildInverseActions(actions, previous) {
  const inverse = [];
  actions.forEach((action) => {
    const reversed = buildInverseAction(action, previous);
    if (reversed) inverse.push(reversed);
  });
  return inverse;
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
      return previous.customTextColor
        ? { action: 'setTextColor', color: previous.customTextColor }
        : null;
    default:
      return null;
  }
}

function isRestoreLastCommand(message) {
  const text = String(message || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!text) return false;
  if (text.includes('預設') || text.includes('還原') || text === 'reset' || text === 'resetsettings') return false;
  return ['復原', '上一步', '取消上一個', 'undo'].includes(text);
}

function describePendingAction(actionOrActions) {
  const actions = Array.isArray(actionOrActions) ? actionOrActions : [actionOrActions];
  if (!actions.length) return '模型沒有找到適合的安全操作。';
  if (actions.length === 1) return describeSingleAction(actions[0]);
  const parts = actions.map((action) => describeSingleAction(action)).filter(Boolean);
  return `模型建議執行 ${actions.length} 個操作：${parts.join(' ')}`;
}

function describeSingleAction(action) {
  switch (action?.action) {
    case 'setBackground':
      return action.color
        ? `模型建議把背景改成 ${action.color}，確認後套用。`
        : `模型建議套用「${action.preset}」背景 preset，確認後套用。`;
    case 'setTextColor':
      return `模型建議把文字改成 ${action.color}。`;
    case 'setFontSize':
      return `模型建議把字體大小改成 ${action.size}。`;
    case 'setFontFamily':
      return `模型建議把字體切換成 ${FONT_FAMILY_LABELS[action.family] || action.family}。`;
    case 'setShapeMode':
      return `模型建議把方塊形狀改成 ${action.mode}。`;
    case 'setTheme':
      return `模型建議切換成${getThemeLabel(action.theme)}風格。`;
    case 'goToPage':
      return `模型建議切到「${action.target}」頁。`;
    case 'nextPage':
      return '模型建議前往下一頁。';
    case 'previousPage':
      return '模型建議前往上一頁。';
    case 'setMarquee':
      return '模型建議更新跑馬燈文字。';
    case 'unknown':
      return safeText(action.message) || '模型沒有找到適合的安全操作。';
    default:
      return '模型回傳了一個可處理的操作。';
  }
}

function getThemeLabel(theme) {
  return {
    future: '未來',
    cat: '溫暖',
    metal: '金屬'
  }[theme] || theme;
}

function safeText(value) {
  return String(value || '').trim();
}

function validateActionList(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return { ok: false, reason: '沒有可執行的 action。' };
  }
  for (let index = 0; index < actions.length; index += 1) {
    const validation = validateAIAction(actions[index]);
    if (!validation.ok) {
      return { ok: false, reason: `第 ${index + 1} 個 action 無法執行：${validation.reason}` };
    }
  }
  return { ok: true };
}

function applyActions(actions) {
  const replies = [];
  for (const action of actions) {
    const result = handleAIAction(action, { persist: true });
    if (result.reply) replies.push(result.reply);
    if (!result.ok) return { ok: false, reply: result.reply || '部分操作無法完成。' };
  }
  return { ok: true, reply: replies.filter(Boolean).join(' ') };
}

function mergeActionLists(primary, fallback) {
  const base = Array.isArray(primary) && primary.length
    ? primary
    : [{ action: 'unknown', message: '模型沒有回傳有效 action。' }];
  const fallbackList = Array.isArray(fallback) ? fallback : [];

  const fallbackValid = fallbackList.filter((action) => action && action.action && action.action !== 'unknown');
  if (base.length === 1 && base[0].action === 'unknown' && fallbackValid.length) {
    return fallbackValid;
  }

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
  const target = actions.find((action) => (
    (action.action === 'setBackground' || action.action === 'setTextColor') && action.color
  ));
  return target?.color || null;
}

function formatActionsForDisplay(actions) {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  return actions.length === 1 ? actions[0] : actions;
}
