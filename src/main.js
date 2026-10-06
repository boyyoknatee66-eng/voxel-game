import * as THREE from 'three';
import { World } from './world/world.js';
import { Player } from './player/player.js';
import { Interaction } from './player/interaction.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const statsEl = document.getElementById('stats');

// --- Renderer / scene / camera -------------------------------------------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ff);
scene.fog = new THREE.Fog(0x9fd4ff, 40, 140);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500,
);

// --- Lighting --------------------------------------------------------------

const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(80, 120, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 250;
scene.add(sun);
scene.add(sun.target);

const ambient = new THREE.HemisphereLight(0xbfe0ff, 0x4a3a2a, 0.65);
scene.add(ambient);

// --- World / player ----------------------------------------------------

const world = new World(scene, { viewDistance: 5, seed: 1337 });
const player = new Player(camera, renderer.domElement, world);
scene.add(player.getObject());

// Load the initial ring of chunks before spawning so the player doesn't
// fall through an ungenerated world.
world.streamChunks(0, 0);
world.processBuildQueue();
while (world.buildQueue.length > 0) world.processBuildQueue();
player.spawnAt(8, 8);

const interaction = new Interaction(scene, camera, world, renderer.domElement);

// --- Pointer lock / overlay ----------------------------------------------

overlay.addEventListener('click', () => player.lock());
player.controls.addEventListener('lock', () => overlay.classList.add('hidden'));
player.controls.addEventListener('unlock', () => overlay.classList.remove('hidden'));

// --- Resize ----------------------------------------------------------------

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Main loop ---------------------------------------------------------

const clock = new THREE.Clock();
let frameCount = 0;
let fpsAccum = 0;
let fps = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.1);

  if (player.isLocked()) {
    player.update(dt);
    interaction.update();
  }

  world.update(player.position);

  // Keep the sun's shadow frustum following the player so shadows stay
  // sharp without covering the whole world.
  sun.position.set(player.position.x + 80, 120, player.position.z + 40);
  sun.target.position.copy(player.position);

  renderer.render(scene, camera);

  frameCount++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    fps = Math.round(frameCount / fpsAccum);
    frameCount = 0;
    fpsAccum = 0;
    statsEl.textContent = `FPS: ${fps} | Chunks: ${world.chunks.size} | XYZ: ${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}, ${player.position.z.toFixed(1)}`;
  }
}

animate();
