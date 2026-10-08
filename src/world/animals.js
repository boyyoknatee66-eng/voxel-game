import * as THREE from 'three';
import { POND, ZONES, SEA_LEVEL } from './zoo.js';

// Simple low-poly "voxel style" animal models built from boxes, matching
// the blocky look of the terrain.

function box(w, h, d, color, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function legsAt(positions, w, h, d, color) {
  return positions.map(([x, y, z]) => box(w, h, d, color, x, y, z));
}

// ---------------------------------------------------------------- Land ---

function makeLion() {
  const group = new THREE.Group();
  const fur = 0xcf9a3f;
  const mane = 0x7a4a1f;

  const body = box(1.1, 0.7, 0.55, fur, 0, 0.55, 0);
  const head = box(0.5, 0.5, 0.5, fur, 0.7, 0.75, 0);
  const maneBox = box(0.62, 0.62, 0.62, mane, 0.7, 0.75, 0);
  const snout = box(0.25, 0.22, 0.25, 0xe8c27a, 1.0, 0.65, 0);
  const tail = box(0.1, 0.1, 0.55, fur, -0.75, 0.6, 0);
  const legs = legsAt(
    [[0.4, 0.2, 0.22], [0.4, 0.2, -0.22], [-0.4, 0.2, 0.22], [-0.4, 0.2, -0.22]],
    0.18, 0.4, 0.18, fur,
  );

  group.add(body, maneBox, head, snout, tail, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeDuck() {
  const group = new THREE.Group();
  const white = 0xf6f3ea;
  const orange = 0xe8923a;

  const body = box(0.42, 0.3, 0.55, white, 0, 0.26, 0);
  const head = box(0.22, 0.22, 0.22, white, 0.18, 0.46, 0.2);
  const beak = box(0.14, 0.08, 0.12, orange, 0.3, 0.43, 0.32);
  const tail = box(0.16, 0.14, 0.18, white, -0.3, 0.3, 0);

  group.add(body, head, beak, tail);
  return group;
}

function makeGiraffe() {
  const group = new THREE.Group();
  const tan = 0xe8b86d;
  const patch = 0xb9793a;

  const body = box(1.0, 0.65, 0.55, tan, 0, 1.75, 0);
  const neck = box(0.28, 1.3, 0.28, tan, 0.4, 2.55, 0);
  const head = box(0.3, 0.3, 0.4, tan, 0.45, 3.25, 0.05);
  const ossicone1 = box(0.07, 0.18, 0.07, patch, 0.35, 3.5, 0.15);
  const ossicone2 = box(0.07, 0.18, 0.07, patch, 0.55, 3.5, 0.15);
  const patch1 = box(0.3, 0.25, 0.05, patch, 0.1, 1.9, 0.28);
  const patch2 = box(0.25, 0.2, 0.05, patch, -0.25, 1.6, -0.28);
  const legs = legsAt(
    [[0.35, 0.8, 0.2], [0.35, 0.8, -0.2], [-0.35, 0.8, 0.2], [-0.35, 0.8, -0.2]],
    0.18, 1.6, 0.18, tan,
  );

  group.add(body, neck, head, ossicone1, ossicone2, patch1, patch2, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeHippo() {
  const group = new THREE.Group();
  const skin = 0x9b8fa0;
  const skinDark = 0x7a6f87;

  const body = box(1.3, 0.75, 0.85, skin, 0, 0.5, 0);
  const head = box(0.6, 0.5, 0.6, skin, 0.85, 0.55, 0);
  const earL = box(0.1, 0.1, 0.1, skinDark, 0.85, 0.85, 0.28);
  const earR = box(0.1, 0.1, 0.1, skinDark, 0.85, 0.85, -0.28);
  const legs = legsAt(
    [[0.45, 0.2, 0.32], [0.45, 0.2, -0.32], [-0.45, 0.2, 0.32], [-0.45, 0.2, -0.32]],
    0.3, 0.35, 0.3, skin,
  );

  group.add(body, head, earL, earR, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeElephant() {
  const group = new THREE.Group();
  const gray = 0x9a9a9a;
  const grayDark = 0x7d7d7d;
  const ivory = 0xf0ead6;

  const body = box(1.5, 1.0, 0.9, gray, 0, 0.9, 0);
  const head = box(0.6, 0.65, 0.55, gray, 0.95, 1.0, 0);
  const earL = box(0.08, 0.5, 0.5, grayDark, 1.05, 1.1, 0.4);
  const earR = box(0.08, 0.5, 0.5, grayDark, 1.05, 1.1, -0.4);
  const trunk1 = box(0.22, 0.22, 0.22, gray, 1.25, 0.8, 0);
  const trunk2 = box(0.2, 0.22, 0.2, gray, 1.3, 0.55, 0);
  const trunk3 = box(0.18, 0.22, 0.18, gray, 1.3, 0.32, 0.05);
  const tuskL = box(0.08, 0.08, 0.3, ivory, 1.1, 0.75, 0.15);
  const tuskR = box(0.08, 0.08, 0.3, ivory, 1.1, 0.75, -0.15);
  const legs = legsAt(
    [[0.5, 0.4, 0.3], [0.5, 0.4, -0.3], [-0.5, 0.4, 0.3], [-0.5, 0.4, -0.3]],
    0.35, 0.8, 0.35, gray,
  );

  group.add(body, head, earL, earR, trunk1, trunk2, trunk3, tuskL, tuskR, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeRat() {
  const group = new THREE.Group();
  const fur = 0x8a7a6a;
  const pink = 0xd98a9a;

  const body = box(0.35, 0.2, 0.5, fur, 0, 0.15, 0);
  const head = box(0.2, 0.18, 0.2, fur, 0.3, 0.2, 0);
  const earL = box(0.08, 0.08, 0.03, pink, 0.32, 0.3, 0.08);
  const earR = box(0.08, 0.08, 0.03, pink, 0.32, 0.3, -0.08);
  const tail = box(0.05, 0.05, 0.5, pink, -0.4, 0.13, 0);
  const legs = legsAt(
    [[0.15, 0.08, 0.18], [0.15, 0.08, -0.18], [-0.15, 0.08, 0.18], [-0.15, 0.08, -0.18]],
    0.08, 0.12, 0.08, fur,
  );

  group.add(body, head, earL, earR, tail, ...legs);
  group.userData.legs = legs;
  return group;
}

// -------------------------------------------------------------- Insects ---

function makeButterfly() {
  const group = new THREE.Group();
  const body = box(0.05, 0.05, 0.25, 0x2a2a2a, 0, 0.1, 0);
  const wingL = box(0.3, 0.02, 0.22, 0xe8923a, 0.15, 0.12, 0);
  const wingR = box(0.3, 0.02, 0.22, 0x4a90d9, -0.15, 0.12, 0);
  group.add(body, wingL, wingR);
  group.userData.wings = [wingL, wingR];
  return group;
}

function makeCentipede() {
  const group = new THREE.Group();
  const color = 0x7a3b2e;
  const segments = [];
  for (let i = 0; i < 5; i++) {
    segments.push(box(0.1, 0.08, 0.1, color, 0, 0.06, -0.12 + i * 0.1));
  }
  group.add(...segments);
  return group;
}

function makeCaterpillar() {
  const group = new THREE.Group();
  const green = 0x9ccc65;
  const greenDark = 0x7cb342;
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const y = 0.05 + (i % 2 === 0 ? 0.02 : 0);
    segments.push(box(0.12, 0.1, 0.12, i % 2 === 0 ? green : greenDark, 0, y, -0.15 + i * 0.11));
  }
  group.add(...segments);
  return group;
}

function makeAnt() {
  const group = new THREE.Group();
  const black = 0x1a1a1a;
  const head = box(0.08, 0.08, 0.08, black, 0, 0.08, 0.1);
  const thorax = box(0.1, 0.08, 0.1, black, 0, 0.08, 0);
  const abdomen = box(0.13, 0.1, 0.14, black, 0, 0.09, -0.14);
  const legs = legsAt(
    [[0.08, 0.04, 0.05], [0.08, 0.04, -0.05], [-0.08, 0.04, 0.05], [-0.08, 0.04, -0.05]],
    0.03, 0.08, 0.03, black,
  );
  group.add(head, thorax, abdomen, ...legs);
  group.userData.legs = legs;
  return group;
}

// -------------------------------------------------------------- Aquatic ---

function makeFrog() {
  const group = new THREE.Group();
  const skin = 0x4caf50;
  const skinDark = 0x2e7d32;

  const body = box(0.45, 0.3, 0.55, skin, 0, 0.22, 0);
  const head = box(0.4, 0.28, 0.3, skin, 0, 0.35, 0.3);
  const eyeL = box(0.08, 0.08, 0.08, 0xffffff, -0.12, 0.5, 0.4);
  const eyeR = box(0.08, 0.08, 0.08, 0xffffff, 0.12, 0.5, 0.4);
  const legs = legsAt(
    [[0.28, 0.1, -0.2], [-0.28, 0.1, -0.2], [0.22, 0.08, 0.2], [-0.22, 0.08, 0.2]],
    0.16, 0.18, 0.2, skinDark,
  );

  group.add(body, head, eyeL, eyeR, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeCrab() {
  const group = new THREE.Group();
  const shell = 0xd9512c;
  const shellDark = 0xb8401f;

  const body = box(0.4, 0.2, 0.35, shell, 0, 0.14, 0);
  const clawL = box(0.16, 0.14, 0.16, shellDark, 0.3, 0.16, 0.2);
  const clawR = box(0.16, 0.14, 0.16, shellDark, 0.3, 0.16, -0.2);
  const legs = legsAt(
    [
      [0.15, 0.08, 0.26], [-0.1, 0.08, 0.3], [-0.3, 0.08, 0.2],
      [0.15, 0.08, -0.26], [-0.1, 0.08, -0.3], [-0.3, 0.08, -0.2],
    ],
    0.07, 0.07, 0.2, shell,
  );

  group.add(body, clawL, clawR, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeWhale() {
  const group = new THREE.Group();
  const skin = 0x4a6b8a;
  const belly = 0xcfd8dc;

  const body = box(2.2, 1.0, 1.0, skin, 0, 0, 0);
  const bellyBox = box(1.8, 0.4, 0.9, belly, 0, -0.35, 0);
  const tail = box(0.12, 0.6, 0.9, skin, -1.3, 0.1, 0);
  const finL = box(0.08, 0.3, 0.4, skin, 0.3, -0.2, 0.6);
  const finR = box(0.08, 0.3, 0.4, skin, 0.3, -0.2, -0.6);

  group.add(body, bellyBox, tail, finL, finR);
  return group;
}

function makeStarfish() {
  const group = new THREE.Group();
  const color = 0xff8c42;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const arm = box(0.12, 0.08, 0.4, color, 0, 0, 0);
    arm.position.set(Math.sin(angle) * 0.2, 0, Math.cos(angle) * 0.2);
    arm.rotation.y = angle;
    group.add(arm);
  }
  const center = box(0.18, 0.1, 0.18, 0xffa05c, 0, 0, 0);
  group.add(center);
  return group;
}

function makeJellyfish() {
  const group = new THREE.Group();
  const dome = box(0.4, 0.22, 0.4, 0xdba0e0, 0, 0.3, 0);
  const tentacles = [];
  const offsets = [[0.12, 0.12], [-0.12, 0.12], [0.12, -0.12], [-0.12, -0.12]];
  for (const [dx, dz] of offsets) {
    tentacles.push(box(0.05, 0.3, 0.05, 0xc985d6, dx, 0.03, dz));
  }
  group.add(dome, ...tentacles);
  return group;
}

// --------------------------------------------------------------- Config ---

// movement: 'ground' follows terrain height; 'surface' floats at the water
// top (ducks, jellyfish near the top); 'underwater' stays submerged
// (whale, starfish); 'flying' hovers above the ground at a bobbing height
// (butterfly). 'water' bounds are an angular ring [minRadius, maxRadius]
// around the pond center instead of a circle around a spawn point.
export const ANIMAL_TYPES = {
  // Land
  lion: { build: makeLion, speed: 1.6, scale: 1, movement: 'ground', wanderRadius: 10 },
  duck: { build: makeDuck, speed: 0.8, scale: 1, movement: 'surface', wanderRadius: 0 },
  giraffe: { build: makeGiraffe, speed: 1.2, scale: 0.8, movement: 'ground', wanderRadius: 9 },
  hippo: { build: makeHippo, speed: 0.9, scale: 1, movement: 'ground', wanderRadius: 4 },
  elephant: { build: makeElephant, speed: 1.0, scale: 0.85, movement: 'ground', wanderRadius: 9 },
  rat: { build: makeRat, speed: 1.8, scale: 1, movement: 'ground', wanderRadius: 6 },
  // Insects
  butterfly: { build: makeButterfly, speed: 1.4, scale: 1, movement: 'flying', wanderRadius: 14, hover: [0.6, 1.4] },
  centipede: { build: makeCentipede, speed: 0.6, scale: 1, movement: 'ground', wanderRadius: 3 },
  caterpillar: { build: makeCaterpillar, speed: 0.25, scale: 1, movement: 'ground', wanderRadius: 2 },
  ant: { build: makeAnt, speed: 1.0, scale: 1, movement: 'ground', wanderRadius: 3 },
  // Aquatic
  frog: { build: makeFrog, speed: 1.1, scale: 1, movement: 'ground', wanderRadius: 5 },
  crab: { build: makeCrab, speed: 0.9, scale: 1, movement: 'ground', wanderRadius: 4 },
  whale: { build: makeWhale, speed: 0.6, scale: 1, movement: 'underwater', depth: 3, minRadius: 0, maxRadius: 9 },
  starfish: { build: makeStarfish, speed: 0.15, scale: 1, movement: 'underwater', depth: 5.5, minRadius: 3, maxRadius: 13 },
  jellyfish: { build: makeJellyfish, speed: 0.5, scale: 1, movement: 'surfaceDeep', minRadius: 2, maxRadius: 14 },
};

/**
 * A single animal/creature. Ground creatures wander within a radius of
 * their spawn point, following terrain height. Water creatures (surface,
 * underwater, surfaceDeep) wander within an angular ring around the pond
 * instead, at a fixed depth. Flying creatures hover above the ground.
 * Purely ambient — no AI beyond wander, no combat.
 */
export class Animal {
  constructor(type, world, scene, x, z) {
    const def = ANIMAL_TYPES[type];
    this.type = type;
    this.def = def;
    this.world = world;
    this.scene = scene;
    this.movement = def.movement;

    this.home = new THREE.Vector3(x, 0, z);
    this.position = new THREE.Vector3(x, 0, z);
    this.target = null;
    this.idleTime = Math.random() * 2;
    this.heading = Math.random() * Math.PI * 2;
    this.walkT = Math.random() * 10;
    this.bobT = Math.random() * 10;

    this.mesh = def.build();
    this.mesh.scale.setScalar(def.scale);
    this._updateY();
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    scene.add(this.mesh);
  }

  _updateY() {
    const def = this.def;
    if (this.movement === 'ground') {
      this.position.y = this.world.getSurfaceHeight(Math.floor(this.position.x), Math.floor(this.position.z));
    } else if (this.movement === 'flying') {
      const ground = this.world.getSurfaceHeight(Math.floor(this.position.x), Math.floor(this.position.z));
      const [minH, maxH] = def.hover || [0.6, 1.2];
      const hover = minH + (Math.sin(this.bobT) * 0.5 + 0.5) * (maxH - minH);
      this.position.y = ground + hover;
    } else if (this.movement === 'underwater') {
      this.position.y = SEA_LEVEL - def.depth + Math.sin(this.bobT) * 0.15;
    } else if (this.movement === 'surface') {
      this.position.y = SEA_LEVEL + 0.1 + Math.sin(this.bobT) * 0.05;
    } else if (this.movement === 'surfaceDeep') {
      this.position.y = SEA_LEVEL - 0.5 + Math.sin(this.bobT) * 0.4;
    }
  }

  _pickNewTarget() {
    if (this.movement === 'underwater' || this.movement === 'surface' || this.movement === 'surfaceDeep') {
      const angle = Math.random() * Math.PI * 2;
      const minR = this.def.minRadius ?? 0;
      const maxR = this.def.maxRadius ?? POND.radius - 2;
      const dist = minR + Math.random() * (maxR - minR);
      this.target = new THREE.Vector3(POND.x + Math.cos(angle) * dist, 0, POND.z + Math.sin(angle) * dist);
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.def.wanderRadius;
      this.target = new THREE.Vector3(this.home.x + Math.cos(angle) * dist, 0, this.home.z + Math.sin(angle) * dist);
    }
  }

  update(dt) {
    this.bobT += dt;

    if (!this.target) {
      this.idleTime -= dt;
      if (this.idleTime <= 0) this._pickNewTarget();
    } else {
      const dx = this.target.x - this.position.x;
      const dz = this.target.z - this.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.2) {
        this.target = null;
        this.idleTime = 1 + Math.random() * 3;
      } else {
        this.heading = Math.atan2(dx, dz);
        const step = Math.min(dist, this.def.speed * dt);
        this.position.x += Math.sin(this.heading) * step;
        this.position.z += Math.cos(this.heading) * step;
        this.walkT += dt * 8;
      }
    }

    this._updateY();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    const legs = this.mesh.userData.legs;
    if (legs) {
      const swing = this.target ? Math.sin(this.walkT) * 0.35 : 0;
      legs.forEach((leg, i) => {
        leg.rotation.x = i % 2 === 0 ? swing : -swing;
      });
    }

    const wings = this.mesh.userData.wings;
    if (wings) {
      const flap = Math.sin(this.walkT * 2) * 0.5 + 0.5;
      wings.forEach((wing, i) => {
        wing.rotation.z = (i === 0 ? 1 : -1) * flap * 0.6;
      });
    }
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}

/** Spawns and updates every creature in the zoo. */
export class AnimalManager {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.animals = [];
  }

  _spawnNear(type, cx, cz, count, radius) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const x = cx + Math.cos(angle) * dist;
      const z = cz + Math.sin(angle) * dist;
      this.animals.push(new Animal(type, this.world, this.scene, x, z));
    }
  }

  /** Spawns one of everything, placed in the zone that matches the
   * reference zoo map: big land animals in their own habitats around the
   * pond, aquatic animals in the pond, and insects in the garden zone. */
  spawnZoo() {
    // Land animals in their themed zones.
    this._spawnNear('lion', ZONES.lion.x, ZONES.lion.z, 1, 8);
    this._spawnNear('giraffe', ZONES.giraffe.x, ZONES.giraffe.z, 2, 10);
    this._spawnNear('elephant', ZONES.elephant.x, ZONES.elephant.z, 2, 10);
    this._spawnNear('rat', ZONES.ratInsect.x, ZONES.ratInsect.z, 4, 10);

    // Hippo and frogs/crabs live right at the pond's edge.
    this._spawnRing('hippo', POND.radius - 4, POND.radius - 1, 2);
    this._spawnRing('frog', POND.radius + 1, POND.radius + 5, 4);
    this._spawnRing('crab', POND.radius + 1, POND.radius + 4, 4);

    // Pure aquatic animals live in the pond itself.
    this._spawnPond('duck', 4);
    this._spawnPond('whale', 1);
    this._spawnPond('starfish', 3);
    this._spawnPond('jellyfish', 3);

    // Insects in the burrow & bug garden.
    this._spawnNear('butterfly', ZONES.ratInsect.x, ZONES.ratInsect.z, 5, 14);
    this._spawnNear('centipede', ZONES.ratInsect.x, ZONES.ratInsect.z, 3, 9);
    this._spawnNear('caterpillar', ZONES.ratInsect.x, ZONES.ratInsect.z, 3, 9);
    this._spawnNear('ant', ZONES.ratInsect.x, ZONES.ratInsect.z, 6, 7);
  }

  _spawnRing(type, minRadius, maxRadius, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minRadius + Math.random() * (maxRadius - minRadius);
      const x = POND.x + Math.cos(angle) * dist;
      const z = POND.z + Math.sin(angle) * dist;
      this.animals.push(new Animal(type, this.world, this.scene, x, z));
    }
  }

  _spawnPond(type, count) {
    const def = ANIMAL_TYPES[type];
    const maxR = def.maxRadius ?? POND.radius - 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * maxR;
      const x = POND.x + Math.cos(angle) * dist;
      const z = POND.z + Math.sin(angle) * dist;
      this.animals.push(new Animal(type, this.world, this.scene, x, z));
    }
  }

  // Kept for backwards compatibility with earlier saves/callers that just
  // want a few animals around a point.
  spawnAround(centerX, centerZ, config = { lion: 1, frog: 3 }) {
    for (const [type, count] of Object.entries(config)) {
      this._spawnNear(type, centerX, centerZ, count, 10);
    }
  }

  update(dt) {
    for (const animal of this.animals) animal.update(dt);
  }
}
