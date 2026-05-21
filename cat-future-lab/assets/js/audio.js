let audioContext;
let masterGain;
let nodes = [];

export function initSoundToggle() {
  const button = document.querySelector('[data-sound-toggle]');
  if (!button) return;

  button.addEventListener('click', async () => {
    const isActive = button.getAttribute('aria-pressed') === 'true';

    if (isActive) {
      stopSound();
      button.setAttribute('aria-pressed', 'false');
      button.textContent = '啟動音景';
      return;
    }

    await startSound();
    button.setAttribute('aria-pressed', 'true');
    button.textContent = '關閉音景';
  });
}

async function startSound() {
  audioContext ||= new AudioContext();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  stopSound();

  masterGain = audioContext.createGain();
  masterGain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  masterGain.gain.exponentialRampToValueAtTime(0.03, audioContext.currentTime + 0.8);
  masterGain.connect(audioContext.destination);

  nodes = [
    createTone(146.83, 'sine', 0.66),
    createTone(220, 'triangle', 0.4),
    createPulse()
  ];
}

function stopSound() {
  if (!audioContext || !nodes.length) return;

  const stopAt = audioContext.currentTime + 0.08;
  nodes.forEach((node) => node.stop?.(stopAt));
  nodes = [];
  masterGain?.disconnect();
  masterGain = null;
}

function createTone(frequency, type, gainValue) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const lfo = audioContext.createOscillator();
  const lfoGain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.02 * gainValue;
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 4;

  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start();
  lfo.start();

  return {
    stop: (when) => {
      oscillator.stop(when);
      lfo.stop(when);
    }
  };
}

function createPulse() {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.value = 55;
  gain.gain.value = 0.004;
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start();

  return oscillator;
}
