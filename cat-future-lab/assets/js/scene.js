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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

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
    line: new THREE.MeshBasicMaterial({ color: 0xf7f2e4 })
  };

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 1), materials.core);
  core.scale.set(1.06, 0.92, 1.06);
  lab.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.025, 12, 180), materials.cyan);
  ring.rotation.x = Math.PI / 2;
  lab.add(ring);

  const tiltedRing = new THREE.Mesh(new THREE.TorusGeometry(2.28, 0.018, 12, 180), materials.coral);
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
    new THREE.TorusGeometry(0.62, 0.045, 14, 90, Math.PI * 1.35),
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

  const particles = createParticleOrbit(110, materials.line, THREE);
  scene.add(particles);

  scene.add(new THREE.HemisphereLight(0xf7f2e4, 0x11131f, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(3, 5, 4);
  scene.add(key);
  const accent = new THREE.PointLight(0x51d6d0, 24, 8);
  accent.position.set(-2.4, 1.8, 2.6);
  scene.add(accent);

  const pointer = { x: 0, y: 0 };
  const modes = {
    calm: { speed: 0.72, light: 18 },
    play: { speed: 1.35, light: 32 },
    focus: { speed: 0.46, light: 12 }
  };
  let activeMode = modes.calm;

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const setMode = (mode) => {
    activeMode = modes[mode] ?? modes.calm;
    accent.intensity = activeMode.light;
    updateModeButtons(mode);
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  bindModeButtons(setMode);
  resize();
  setMode('calm');

  const clock = new THREE.Clock();
  const animate = () => {
    const reduce = document.documentElement.classList.contains('reduce-motion');
    const elapsed = clock.getElapsedTime();
    const speed = reduce ? 0 : activeMode.speed;

    lab.rotation.y += ((pointer.x * 0.28) - lab.rotation.y) * 0.045;
    lab.rotation.x += ((-pointer.y * 0.12) - lab.rotation.x) * 0.045;
    core.rotation.y += 0.007 * speed;
    ring.rotation.z += 0.008 * speed;
    tiltedRing.rotation.z -= 0.005 * speed;
    tailSignal.rotation.z = -0.9 + Math.sin(elapsed * 2.2 * activeMode.speed) * 0.22;
    antenna.children.forEach((bar, index) => {
      bar.scale.y = 0.7 + Math.sin(elapsed * activeMode.speed * 2 + index) * 0.18;
    });

    particles.children.forEach((particle) => {
      particle.userData.angle += particle.userData.speed * speed;
      particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
      particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
      particle.position.y = particle.userData.baseY + Math.sin(elapsed + particle.userData.angle) * 0.18;
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

function initCanvasFallback(canvas) {
  const ctx = canvas.getContext('2d');
  const modes = {
    calm: 0.8,
    play: 1.45,
    focus: 0.42
  };
  let speed = modes.calm;
  let frame = 0;

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(320, Math.floor(rect.width * ratio));
    canvas.height = Math.max(360, Math.floor(rect.height * ratio));
    canvas.style.width = `${Math.floor(canvas.width / ratio)}px`;
    canvas.style.height = `${Math.floor(canvas.height / ratio)}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const setMode = (mode) => {
    speed = modes[mode] ?? modes.calm;
    updateModeButtons(mode);
  };

  bindModeButtons(setMode);
  window.addEventListener('resize', resize, { passive: true });
  resize();
  setMode('calm');

  const draw = () => {
    const reduce = document.documentElement.classList.contains('reduce-motion');
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const t = reduce ? 0 : frame * 0.026 * speed;
    frame += 1;

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);
    ctx.rotate(Math.sin(t * 0.7) * 0.035);

    ctx.strokeStyle = '#51d6d0';
    ctx.lineWidth = 8;
    ctx.setLineDash([28, 18]);
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.min(w, h) * 0.3, Math.min(w, h) * 0.18, t * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = '#f36f52';
    ctx.lineWidth = 7;
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
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-86, -8);
    ctx.lineTo(-24, -8);
    ctx.moveTo(24, -8);
    ctx.lineTo(86, -8);
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

function updateModeButtons(mode) {
  document.querySelectorAll('[data-scene-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sceneMode === mode));
  });
}
