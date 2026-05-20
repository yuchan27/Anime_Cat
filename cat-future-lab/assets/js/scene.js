import * as THREE from 'three';

export function initCatScene() {
  const canvas = document.querySelector('#cat-scene');
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1.2, 7);

  const group = new THREE.Group();
  scene.add(group);

  const materialBody = new THREE.MeshStandardMaterial({ color: 0xdce86a, roughness: 0.42, metalness: 0.12 });
  const materialAccent = new THREE.MeshStandardMaterial({ color: 0x51d6d0, roughness: 0.25, metalness: 0.35 });
  const materialDark = new THREE.MeshStandardMaterial({ color: 0x10140f, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 48, 32), materialBody);
  body.scale.set(1.1, 0.92, 0.8);
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.82, 48, 32), materialBody);
  head.position.set(0, 1.05, 0.1);
  group.add(head);

  const earGeometry = new THREE.ConeGeometry(0.34, 0.78, 4);
  const leftEar = new THREE.Mesh(earGeometry, materialBody);
  leftEar.position.set(-0.52, 1.78, 0.04);
  leftEar.rotation.z = 0.38;
  group.add(leftEar);

  const rightEar = leftEar.clone();
  rightEar.position.x = 0.52;
  rightEar.rotation.z = -0.38;
  group.add(rightEar);

  const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  const leftEye = new THREE.Mesh(eyeGeometry, materialDark);
  leftEye.position.set(-0.27, 1.12, 0.78);
  group.add(leftEye);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.27;
  group.add(rightEye);

  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 16, 64, Math.PI * 1.25), materialAccent);
  tail.position.set(1.12, 0.18, -0.12);
  tail.rotation.set(0.3, 0.15, -0.8);
  group.add(tail);

  const floor = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.018, 8, 160),
    new THREE.MeshBasicMaterial({ color: 0xf36f52 })
  );
  floor.rotation.x = Math.PI / 2;
  floor.position.y = -1.1;
  group.add(floor);

  const particles = new THREE.Group();
  const particleGeometry = new THREE.IcosahedronGeometry(0.035, 0);
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f0df });
  for (let i = 0; i < 80; i += 1) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    const angle = (i / 80) * Math.PI * 2;
    const radius = 2.3 + Math.random() * 1.4;
    particle.position.set(Math.cos(angle) * radius, Math.random() * 3 - 1.2, Math.sin(angle) * radius);
    particle.userData = { angle, radius, speed: 0.002 + Math.random() * 0.004 };
    particles.add(particle);
  }
  scene.add(particles);

  scene.add(new THREE.HemisphereLight(0xf4f0df, 0x10140f, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);

  const pointer = { x: 0, y: 0 };
  const modes = { calm: 0.8, play: 1.35, focus: 0.45 };
  let speed = modes.calm;

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(360, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const setMode = (mode) => {
    speed = modes[mode] ?? modes.calm;
    document.querySelectorAll('[data-scene-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.sceneMode === mode));
    });
  };

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  document.querySelectorAll('[data-scene-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.sceneMode));
  });

  resize();

  let frame = 0;
  const animate = () => {
    frame += 1;
    const reduce = document.documentElement.classList.contains('reduce-motion');
    const t = reduce ? 0 : frame * 0.016 * speed;

    group.rotation.y += ((pointer.x * 0.35) - group.rotation.y) * 0.04;
    group.rotation.x += ((-pointer.y * 0.12) - group.rotation.x) * 0.04;
    head.position.y = 1.05 + Math.sin(t * 1.5) * 0.04;
    tail.rotation.z = -0.8 + Math.sin(t * 2.4) * 0.22;
    floor.rotation.z += reduce ? 0 : 0.006 * speed;

    particles.children.forEach((particle) => {
      particle.userData.angle += reduce ? 0 : particle.userData.speed * speed;
      particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
      particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
  return { setMode };
}
