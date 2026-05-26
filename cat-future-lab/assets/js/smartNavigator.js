import { handleAIAction, parseNavigatorCommand, validateAIAction } from './aiActions.js';
import { getState, subscribeState } from './state.js';

const RESTORABLE_ACTIONS = new Set([
  'goToPage',
  'nextPage',
  'previousPage',
  'setTheme',
  'setFontSize',
  'setBackground',
  'setShapeMode',
  'setMarquee',
  'setPresentationMode'
]);

let lastRestorableAction = null;
let lastRestorableState = null;

export function initSmartNavigator() {
  const form = document.querySelector('[data-chat-form]');
  const output = document.querySelector('[data-chat-output]');
  const input = form?.querySelector('input[name="message"]');
  if (!form || !output || !input) return;

  form.dataset.mode = 'smart-navigator';

  subscribeState((state) => {
    form.dataset.currentPage = state.currentPage;
    form.dataset.theme = state.theme;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    setStatus(output, 'loading', '網站導覽員正在判斷安全動作...');
    input.value = '';

    const beforeState = getState();
    const parsed = isRestoreLastCommand(message)
      ? buildRestoreCommand(beforeState)
      : parseNavigatorCommand(message, beforeState);
    const validation = validateAIAction(parsed.action);
    if (!validation.ok) {
      setStatus(output, 'error', `指令未執行：${validation.reason}`);
      return;
    }

    const result = handleAIAction(parsed.action);
    const reply = result.reply || parsed.reply || '已完成。';
    if (result.ok) rememberRestorableAction(parsed.action, beforeState);
    setStatus(output, result.ok ? 'success' : 'error', reply);
  });
}

function setStatus(node, state, text) {
  node.dataset.state = state;
  node.textContent = text;
}

function rememberRestorableAction(action, beforeState) {
  if (!RESTORABLE_ACTIONS.has(action.action) || action.meta?.restore === true) return;
  lastRestorableAction = { ...action };
  lastRestorableState = { ...beforeState };
}

function buildRestoreCommand(currentState) {
  if (!lastRestorableAction || !lastRestorableState) {
    return parseNavigatorCommand('還原設定', currentState);
  }

  const action = buildInverseAction(lastRestorableAction, lastRestorableState);
  if (!action) {
    return {
      action: { action: 'unknown', message: '上一個動作沒有可還原的安全設定，所以沒有改動畫面。' },
      reply: '上一個動作沒有可還原的安全設定，所以沒有改動畫面。'
    };
  }

  action.meta = { restore: true };
  return {
    action,
    reply: '已依照上一個操作還原設定。'
  };
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
    default:
      return null;
  }
}

function isRestoreLastCommand(message) {
  const text = String(message || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!text) return false;
  if (text.includes('預設') || text.includes('重置') || text === 'reset' || text === 'resetsettings') return false;
  return ['還原', '復原', '回復', '恢復', '改回去', 'undo'].includes(text);
}
