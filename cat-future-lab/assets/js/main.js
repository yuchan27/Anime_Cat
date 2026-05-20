import { animateRevealedSection, initPageAnimations } from './animations.js';
import { initMotionPreference, initRevealObserver } from './a11y.js';
import { initCatScene } from './scene.js';
import { initChatPanel, initHeader, initWeatherPanel } from './ui.js';

initMotionPreference();
initRevealObserver(animateRevealedSection);
initHeader();
initPageAnimations();
initCatScene();
initChatPanel();
initWeatherPanel();
