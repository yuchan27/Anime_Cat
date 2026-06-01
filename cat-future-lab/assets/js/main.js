import { animateRevealedSection, initPageAnimations } from './animations.js';
import { initMotionPreference, initRevealObserver } from './a11y.js';
import { initSoundToggle } from './audio.js';
import { initCatCursor } from './cursor.js';
import { initGsapEffects } from './effects.js';
import { initExperienceShell } from './experience.js';
import { initNotesDeck } from './notes.js';
import { initSmartNavigator } from './smartNavigator.js';
import { initControlProximityFeedback, initHeader, initHeroFlipCard, initImageGallery, initReportDownload, initReportPptDownload, initWeatherPanelV2 } from './ui.js';

let sceneLoadPromise;

initMotionPreference();
initExperienceShell();
initRevealObserver(animateRevealedSection);
initHeader();
initSoundToggle();
initCatCursor();
initPageAnimations();
initDeferredCatScene();
initSmartNavigator();
initWeatherPanelV2();
initHeroFlipCard();
initControlProximityFeedback();
initImageGallery();
initGsapEffects();
initNotesDeck();
initReportDownload();
initReportPptDownload();

function initDeferredCatScene() {
  const canvas = document.querySelector('#cat-scene');
  if (!canvas) return;

  const loadScene = async () => {
    if (sceneLoadPromise) return sceneLoadPromise;
    sceneLoadPromise = import('./scene.js')
      .then(({ initCatScene }) => initCatScene())
      .catch(() => null);
    return sceneLoadPromise;
  };

  const shouldLoadScene = () => (
    !document.body.classList.contains('page-mode') ||
    document.body.dataset.currentPage === 'intro' ||
    window.location.hash === '#intro'
  );

  if (shouldLoadScene()) {
    loadScene();
    return;
  }

  const observer = new MutationObserver(() => {
    if (!shouldLoadScene()) return;
    observer.disconnect();
    loadScene();
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['data-current-page', 'class'] });
}
