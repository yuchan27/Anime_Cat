import { handleAIAction, parseNavigatorCommand, validateAIAction } from './aiActions.js';
import { getState, subscribeState } from './state.js';

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

    const parsed = parseNavigatorCommand(message, getState());
    const validation = validateAIAction(parsed.action);
    if (!validation.ok) {
      setStatus(output, 'error', `指令未執行：${validation.reason}`);
      return;
    }

    const result = handleAIAction(parsed.action);
    const reply = result.reply || parsed.reply || '已完成。';
    setStatus(output, result.ok ? 'success' : 'error', reply);
  });
}

function setStatus(node, state, text) {
  node.dataset.state = state;
  node.textContent = text;
}

