export async function initCatScene() {
  const canvas = document.querySelector('#cat-scene');
  if (!canvas) return null;

  try {
    const THREE = await import('three');
    return initThreeScene(canvas, THREE);
  } catch (error) {
    return initCanvasFallback(canvas);
  }
}

function initThreeScene(canvas, THREE) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power'
  });
  const getReducedState = () => (
    document.documentElement.classList.contains('reduce-motion') ||
    document.documentElement.classList.contains('reduced-performance')
  );
  const updatePixelRatio = () => {
    const maxRatio = getReducedState() ? 1 : 1.25;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
  };
  updatePixelRatio();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.15, 7.2);

  const lab = new THREE.Group();
  scene.add(lab);

  const materials = {
    core: new THREE.MeshStandardMaterial({ color: 0xdce86a, roughness: 0.34, metalness: 0.18 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x51d6d0, roughness: 0.24, metalness: 0.38 }),
    coral: new THREE.MeshStandardMaterial({ color: 0xf36f52, roughness: 0.38, metalness: 0.18 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x11131f, roughness: 0.52, metalness: 0.18 }),
    line: new THREE.MeshBasicMaterial({ color: 0xf7f2e4 }),
    ribbon: new THREE.MeshStandardMaterial({ color: 0x7766d8, roughness: 0.24, metalness: 0.22 })
  };

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 1), materials.core);
  core.scale.set(1.06, 0.92, 1.06);
  lab.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.025, 10, 108), materials.cyan);
  ring.rotation.x = Math.PI / 2;
  lab.add(ring);

  const tiltedRing = new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.018, 10, 108), materials.coral);
  tiltedRing.rotation.set(Math.PI / 2.4, 0.4, 0.1);
  lab.add(tiltedRing);

  const earGeometry = new THREE.ConeGeometry(0.34, 0.92, 3);
  const leftEar = new THREE.Mesh(earGeometry, materials.cyan);
  leftEar.position.set(-0.72, 1.25, 0.08);
  leftEar.rotation.set(0.12, 0, 0.28);
  lab.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = 0.72;
  rightEar.rotation.z = -0.28;
  lab.add(rightEar);

  const eyeGeometry = new THREE.BoxGeometry(0.46, 0.055, 0.08);
  const leftEye = new THREE.Mesh(eyeGeometry, materials.ink);
  leftEye.position.set(-0.32, 0.3, 0.96);
  lab.add(leftEye);

  const rightEye = leftEye.clone();
  rightEye.position.x = 0.32;
  lab.add(rightEye);

  const tailSignal = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.045, 10, 70, Math.PI * 1.35),
    materials.coral
  );
  tailSignal.position.set(1.32, -0.34, -0.18);
  tailSignal.rotation.set(0.22, 0.2, -0.9);
  lab.add(tailSignal);

  const antenna = new THREE.Group();
  for (let i = 0; i < 7; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.58 + i * 0.04, 0.035), materials.line);
    bar.position.set(-1.6 + i * 0.52, -1.42, -0.4);
    antenna.add(bar);
  }
  lab.add(antenna);

  const reducedScene = document.documentElement.classList.contains('reduced-performance');
  const particles = createParticleOrbit(reducedScene ? 20 : 48, materials.line, THREE);
  scene.add(particles);
  const sparkRings = createSparkRings(THREE);
  lab.add(sparkRings);

  const ribbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.9, -0.4, -1.2),
    new THREE.Vector3(-0.5, 0.9, 0.8),
    new THREE.Vector3(1.4, -0.2, 1.1),
    new THREE.Vector3(2.2, 0.9, -0.4),
    new THREE.Vector3(0.7, 1.35, -1.2),
    new THREE.Vector3(-1.9, -0.4, -1.2)
  ]);
  const ribbon = new THREE.Mesh(
    new THREE.TubeGeometry(ribbonCurve, 84, 0.042, 8, true),
    materials.ribbon
  );
  lab.add(ribbon);

  scene.add(new THREE.HemisphereLight(0xf7f2e4, 0x11131f, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(3, 5, 4);
  scene.add(key);
  const accent = new THREE.PointLight(0x51d6d0, 24, 8);
  accent.position.set(-2.4, 1.8, 2.6);
  scene.add(accent);

  const pointer = { x: 0, y: 0 };
  let pointerInside = false;
  let lureMode = false;
  const modes = {
    calm: {
      speed: 0.52,
      light: 15,
      tint: 0x7766d8,
      pointer: 0.48,
      ring: 0.7,
      pulse: 0.45,
      signal: 0.55,
      camera: 0.55
    },
    play: {
      speed: 2.15,
      light: 46,
      tint: 0xf36f52,
      pointer: 1.35,
      ring: 1.55,
      pulse: 1.45,
      signal: 1.65,
      camera: 1.15
    },
    focus: {
      speed: 0.16,
      light: 8,
      tint: 0x51d6d0,
      pointer: 0.12,
      ring: 0.2,
      pulse: 0.12,
      signal: 0.15,
      camera: 0.22
    }
  };
  let activeMode = modes.calm;
  let sceneInViewport = true;
  let scenePageActive = true;

  const updateScenePageActive = () => {
    scenePageActive = !document.body.classList.contains('page-mode') ||
      document.body.dataset.currentPage === 'intro';
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      sceneInViewport = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05);
    }, { threshold: [0, 0.05, 0.2] });
    observer.observe(canvas);
  }

  updateScenePageActive();
  const pageObserver = new MutationObserver(updateScenePageActive);
  pageObserver.observe(document.body, { attributes: true, attributeFilter: ['data-current-page', 'class'] });
  document.addEventListener('visibilitychange', updateScenePageActive, { passive: true });

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, rect.height);
    updatePixelRatio();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const setMode = (mode) => {
    activeMode = modes[mode] ?? modes.calm;
    accent.intensity = activeMode.light;
    ribbon.material.color.setHex(activeMode.tint);
    document.documentElement.dataset.activeSceneMode = modes[mode] ? mode : 'calm';
    if (canvas.parentElement) {
      canvas.parentElement.dataset.activeSceneMode = modes[mode] ? mode : 'calm';
    }
    updateModeButtons(mode);
  };

  let pointerRaf = null;
  let latestPointer = null;

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    if (!scenePageActive || document.hidden) return;
    latestPointer = { x: event.clientX, y: event.clientY };
    if (pointerRaf) return;
    pointerRaf = requestAnimationFrame(() => {
      pointerRaf = null;
      if (!latestPointer) return;
      const rect = canvas.getBoundingClientRect();
      pointerInside = latestPointer.x >= rect.left && latestPointer.x <= rect.right &&
        latestPointer.y >= rect.top && latestPointer.y <= rect.bottom;
      pointer.x = ((latestPointer.x - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      pointer.y = ((latestPointer.y - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      document.documentElement.classList.toggle('cat-treat-cursor', lureMode && pointerInside);
    });
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => {
    pointerInside = false;
    document.documentElement.classList.remove('cat-treat-cursor');
  }, { passive: true });

  bindModeButtons(setMode);
  bindLureButton((next) => {
    lureMode = next;
    document.documentElement.classList.toggle('cat-lure-enabled', lureMode);
    document.documentElement.classList.toggle('cat-treat-cursor', lureMode && pointerInside);
  });
  resize();
  setMode('calm');

  const clock = new THREE.Clock();
  let lastReducedState = getReducedState();
  let lastFrameAt = 0;
  const animate = (now = 0) => {
    const reducedNow = getReducedState();
    if (reducedNow !== lastReducedState) {
      lastReducedState = reducedNow;
      updatePixelRatio();
    }
    if (document.hidden || !sceneInViewport || !scenePageActive) {
      window.setTimeout(() => requestAnimationFrame(animate), 250);
      return;
    }
    const targetFps = reducedNow ? 20 : 42;
    if (now - lastFrameAt < 1000 / targetFps) {
      requestAnimationFrame(animate);
      return;
    }
    lastFrameAt = now;

    const reduce = reducedNow || document.documentElement.classList.contains('reduce-motion');
    const elapsed = clock.getElapsedTime();
    const speed = reduce ? 0 : activeMode.speed;
    const attraction = lureMode && pointerInside && !reduce ? 1 : 0;
    const pointerPower = reduce ? 0 : activeMode.pointer;
    const cameraPower = reduce ? 0 : activeMode.camera;

    lab.rotation.y += ((pointer.x * 0.28 * pointerPower) - lab.rotation.y) * 0.045;
    lab.rotation.x += ((-pointer.y * 0.12 * pointerPower) - lab.rotation.x) * 0.045;
    lab.position.x += ((pointer.x * 0.34 * attraction * pointerPower) - lab.position.x) * 0.06;
    lab.position.y += ((-pointer.y * 0.18 * attraction * pointerPower) - lab.position.y) * 0.06;
    core.rotation.y += 0.007 * speed;
    core.rotation.x += 0.0032 * speed;
    core.scale.setScalar(1 + Math.sin(elapsed * activeMode.speed * 1.4) * 0.018 * activeMode.pulse);
    ring.rotation.z += 0.008 * speed * activeMode.ring;
    tiltedRing.rotation.z -= 0.005 * speed * activeMode.ring;
    ribbon.rotation.y += 0.004 * speed * activeMode.ring;
    ribbon.rotation.x = Math.sin(elapsed * activeMode.speed * 0.7) * 0.16 * activeMode.pulse;
    tailSignal.rotation.z = -0.9 + Math.sin(elapsed * 2.2 * activeMode.speed) * 0.22 * activeMode.signal;
    leftEar.rotation.z = 0.28 + Math.sin(elapsed * 3.1 * activeMode.speed) * 0.09 * activeMode.signal + pointer.x * 0.035 * attraction * pointerPower;
    rightEar.rotation.z = -0.28 - Math.sin(elapsed * 2.8 * activeMode.speed + 0.7) * 0.09 * activeMode.signal + pointer.x * 0.035 * attraction * pointerPower;
    leftEye.scale.y += (((attraction ? 4.2 : 1) - leftEye.scale.y) * 0.12);
    rightEye.scale.y += (((attraction ? 4.2 : 1) - rightEye.scale.y) * 0.12);
    sparkRings.children.forEach((child, idx) => {
      child.rotation.y += (0.0035 + idx * 0.0012) * speed * activeMode.ring;
      child.rotation.x += (0.002 + idx * 0.0008) * speed * activeMode.ring;
    });

    camera.position.x += ((pointer.x * 0.58 * cameraPower) - camera.position.x) * 0.02;
    camera.position.y += ((1.15 + pointer.y * -0.26 * cameraPower + Math.sin(elapsed * 0.7) * 0.08 * activeMode.pulse) - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    antenna.children.forEach((bar, index) => {
      bar.scale.y = 0.7 + Math.sin(elapsed * activeMode.speed * 2 + index) * 0.18 * activeMode.signal;
    });

    particles.children.forEach((particle) => {
      particle.userData.angle += particle.userData.speed * speed;
      particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
      particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
      particle.position.y = particle.userData.baseY + Math.sin(elapsed + particle.userData.angle) * 0.18 * activeMode.pulse;
      particle.scale.setScalar(0.72 + Math.sin(elapsed * 2 + particle.userData.angle * 2.1) * 0.22 * activeMode.signal);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
  return { setMode };
}

function createParticleOrbit(count, material, THREE) {
  const group = new THREE.Group();
  const geometry = new THREE.OctahedronGeometry(0.035, 0);

  for (let i = 0; i < count; i += 1) {
    const particle = new THREE.Mesh(geometry, material);
    const angle = (i / count) * Math.PI * 2;
    const radius = 2.35 + Math.random() * 1.25;
    const baseY = Math.random() * 3.1 - 1.35;
    particle.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
    particle.userData = {
      angle,
      radius,
      baseY,
      speed: 0.0018 + Math.random() * 0.0042
    };
    group.add(particle);
  }

  return group;
}

function createSparkRings(THREE) {
  const group = new THREE.Group();

  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(2.85, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x51d6d0, transparent: true, opacity: 0.68 })
  );
  ringA.rotation.set(Math.PI / 2.5, 0.1, 0);
  group.add(ringA);

  const ringB = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.008, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0xf36f52, transparent: true, opacity: 0.55 })
  );
  ringB.rotation.set(Math.PI / 2.2, 0.8, 0.5);
  group.add(ringB);

  const ringC = new THREE.Mesh(
    new THREE.TorusGeometry(2.45, 0.006, 8, 84),
    new THREE.MeshBasicMaterial({ color: 0xdce86a, transparent: true, opacity: 0.64 })
  );
  ringC.rotation.set(Math.PI / 2.8, -0.5, 0.2);
  group.add(ringC);

  return group;
}

function initCanvasFallback(canvas) {
  const ctx = canvas.getContext('2d');
  const modes = {
    calm: {
      speed: 0.52,
      lineWidth: 7,
      dash: [22, 28],
      alpha: 0.68,
      wobble: 0.55
    },
    play: {
      speed: 2.05,
      lineWidth: 11,
      dash: [36, 10],
      alpha: 1,
      wobble: 1.35
    },
    focus: {
      speed: 0.16,
      lineWidth: 5,
      dash: [10, 44],
      alpha: 0.42,
      wobble: 0.18
    }
  };
  let activeMode = modes.calm;
  let frame = 0;
  let lureMode = false;
  let sceneInViewport = true;
  let scenePageActive = true;
  let lastFrameAt = 0;

  const updateScenePageActive = () => {
    scenePageActive = !document.body.classList.contains('page-mode') ||
      document.body.dataset.currentPage === 'intro';
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      sceneInViewport = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.05);
    }, { threshold: [0, 0.05, 0.2] });
    observer.observe(canvas);
  }

  updateScenePageActive();
  const pageObserver = new MutationObserver(updateScenePageActive);
  pageObserver.observe(document.body, { attributes: true, attributeFilter: ['data-current-page', 'class'] });
  document.addEventListener('visibilitychange', updateScenePageActive, { passive: true });

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const reduced = document.documentElement.classList.contains('reduce-motion') ||
      document.documentElement.classList.contains('reduced-performance');
    const ratio = Math.min(window.devicePixelRatio || 1, reduced ? 1 : 2);
    canvas.width = Math.max(320, Math.floor(rect.width * ratio));
    canvas.height = Math.max(360, Math.floor(rect.height * ratio));
    canvas.style.width = `${Math.floor(canvas.width / ratio)}px`;
    canvas.style.height = `${Math.floor(canvas.height / ratio)}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const setMode = (mode) => {
    activeMode = modes[mode] ?? modes.calm;
    document.documentElement.dataset.activeSceneMode = modes[mode] ? mode : 'calm';
    if (canvas.parentElement) {
      canvas.parentElement.dataset.activeSceneMode = modes[mode] ? mode : 'calm';
    }
    updateModeButtons(mode);
  };

  bindModeButtons(setMode);
  bindLureButton((next) => {
    lureMode = next;
    document.documentElement.classList.toggle('cat-lure-enabled', lureMode);
    document.documentElement.classList.toggle('cat-treat-cursor', lureMode);
  });
  window.addEventListener('resize', resize, { passive: true });
  resize();
  setMode('calm');

  const draw = (now = 0) => {
    const reduced = document.documentElement.classList.contains('reduce-motion') ||
      document.documentElement.classList.contains('reduced-performance');
    if (document.hidden || !sceneInViewport || !scenePageActive) {
      window.setTimeout(() => requestAnimationFrame(draw), 250);
      return;
    }
    const targetFps = reduced ? 18 : 36;
    if (now - lastFrameAt < 1000 / targetFps) {
      requestAnimationFrame(draw);
      return;
    }
    lastFrameAt = now;

    const reduce = reduced;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const t = reduce ? 0 : frame * 0.026 * activeMode.speed;
    frame += 1;

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);
    ctx.rotate(Math.sin(t * 0.7) * 0.035 * activeMode.wobble);

    ctx.strokeStyle = '#51d6d0';
    ctx.globalAlpha = activeMode.alpha;
    ctx.lineWidth = activeMode.lineWidth;
    ctx.setLineDash(activeMode.dash);
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.min(w, h) * 0.3, Math.min(w, h) * 0.18, t * 0.25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.setLineDash([]);
    ctx.strokeStyle = '#f36f52';
    ctx.lineWidth = Math.max(4, activeMode.lineWidth - 1);
    ctx.beginPath();
    ctx.arc(92, 56, 48, Math.PI * 0.35, Math.PI * 1.68);
    ctx.stroke();

    ctx.strokeStyle = '#f7f2e4';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-118, -82);
    ctx.lineTo(-166, -190);
    ctx.lineTo(-54, -112);
    ctx.moveTo(118, -82);
    ctx.lineTo(166, -190);
    ctx.lineTo(54, -112);
    ctx.stroke();

    ctx.fillStyle = '#dce86a';
    ctx.strokeStyle = '#f7f2e4';
    ctx.lineWidth = 8;
    roundRect(ctx, -142, -72, 284, 126, 24);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#11131f';
    ctx.lineWidth = lureMode ? Math.max(5, activeMode.lineWidth - 2) : activeMode.lineWidth + 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (lureMode) {
      ctx.ellipse(-54, -8, 28, 14, 0, 0, Math.PI * 2);
      ctx.moveTo(82, -8);
      ctx.ellipse(54, -8, 28, 14, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-86, -8);
      ctx.lineTo(-24, -8);
      ctx.moveTo(24, -8);
      ctx.lineTo(86, -8);
    }
    ctx.stroke();

    ctx.restore();
    requestAnimationFrame(draw);
  };

  draw();
  return { setMode };
}

function drawGrid(ctx, width, height) {
  ctx.fillStyle = '#151827';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(247, 242, 228, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function bindModeButtons(setMode) {
  document.querySelectorAll('[data-scene-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.sceneMode));
  });
}

function bindLureButton(setLureMode) {
  const button = document.querySelector('[data-cat-lure-toggle]');
  if (!button) return;
  button.addEventListener('click', () => {
    const next = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(next));
    button.classList.toggle('is-active', next);
    setLureMode(next);
  });
}

function updateModeButtons(mode) {
  document.querySelectorAll('[data-scene-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sceneMode === mode));
  });
}
