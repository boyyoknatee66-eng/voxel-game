import * as THREE from 'three';

// Simple low-poly "voxel style" animal models built from boxes, matching
// the blocky look of the terrain. Each factory returns a THREE.Group plus
// the half-size of its footprint (used for collision/placement) and a
// walking speed.

function box(w, h, d, color, x, y, z) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeLion() {
  const group = new THREE.Group();
  const furColor = 0xcf9a3f;
  const maneColor = 0x7a4a1f;

  const body = box(1.1, 0.7, 0.55, furColor, 0, 0.55, 0);
  const head = box(0.5, 0.5, 0.5, furColor, 0.7, 0.75, 0);
  const mane = box(0.62, 0.62, 0.62, maneColor, 0.7, 0.75, 0);
  mane.scale.set(1, 1, 1);
  const snout = box(0.25, 0.22, 0.25, 0xe8c27a, 1.0, 0.65, 0);
  const tail = box(0.1, 0.1, 0.55, furColor, -0.75, 0.6, 0);

  const legPositions = [
    [0.4, 0.2, 0.22],
    [0.4, 0.2, -0.22],
    [-0.4, 0.2, 0.22],
    [-0.4, 0.2, -0.22],
  ];
  const legs = legPositions.map(([x, y, z]) => box(0.18, 0.4, 0.18, furColor, x, y, z));

  group.add(body, mane, head, snout, tail, ...legs);
  group.userData.legs = legs;
  return group;
}

function makeFrog() {
  const group = new THREE.Group();
  const skin = 0x4caf50;
  const skinDark = 0x2e7d32;

  const body = box(0.45, 0.3, 0.55, skin, 0, 0.22, 0);
  const head = box(0.4, 0.28, 0.3, skin, 0, 0.35, 0.3);
  const eyeL = box(0.08, 0.08, 0.08, 0xffffff, -0.12, 0.5, 0.4);
  const eyeR = box(0.08, 0.08, 0.08, 0xffffff, 0.12, 0.5, 0.4);

  const legPositions = [
    [0.28, 0.1, -0.2],
    [-0.28, 0.1, -0.2],
    [0.22, 0.08, 0.2],
    [-0.22, 0.08, 0.2],
  ];
  const legs = legPositions.map(([x, y, z]) => box(0.16, 0.18, 0.2, skinDark, x, y, z));

  group.add(body, head, eyeL, eyeR, ...legs);
  group.userData.legs = legs;
  return group;
}

export const ANIMAL_TYPES = {
  lion: {
    build: makeLion,
    speed: 1.6,
    scale: 1,
    wanderRadius: 10,
  },
  frog: {
    build: makeFrog,
    speed: 1.1,
    scale: 1,
    wanderRadius: 6,
  },
};

/**
 * A wandering animal: periodically picks a new random point within range of
 * its home position and walks toward it, idling in between. Purely
 * decorative/ambient — no AI beyond simple wander, no combat.
 */
export class Animal {
  constructor(type, world, scene, x, z) {
    const def = ANIMAL_TYPES[type];
    this.type = type;
    this.def = def;
    this.world = world;
    this.scene = scene;

    this.home = new THREE.Vector3(x, 0, z);
    this.position = new THREE.Vector3(x, 0, z);
    this.target = null;
    this.idleTime = Math.random() * 2;
    this.heading = Math.random() * Math.PI * 2;
    this.walkT = Math.random() * 10;

    this.mesh = def.build();
    this.mesh.scale.setScalar(def.scale);
    this._placeOnGround();
    scene.add(this.mesh);
  }

  _placeOnGround() {
    const groundY = this.world.getSurfaceHeight(
      Math.floor(this.position.x),
      Math.floor(this.position.z),
    );
    this.position.y = groundY;
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
  }

  _pickNewTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.def.wanderRadius;
    this.target = new THREE.Vector3(
      this.home.x + Math.cos(angle) * dist,
      0,
      this.home.z + Math.sin(angle) * dist,
    );
  }

  update(dt) {
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

    this._placeOnGround();
    this.mesh.rotation.y = this.heading;

    // Simple leg-swing animation while walking.
    const legs = this.mesh.userData.legs;
    if (legs) {
      const swing = this.target ? Math.sin(this.walkT) * 0.35 : 0;
      legs.forEach((leg, i) => {
        leg.rotation.x = i % 2 === 0 ? swing : -swing;
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

/**
 * Spawns a small fixed group of animals around a center point (the
 * player's starting island) and keeps them wandering each frame.
 */
export class AnimalManager {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;
    this.animals = [];
  }

  spawnAround(centerX, centerZ, config = { lion: 1, frog: 3 }) {
    for (const [type, count] of Object.entries(config)) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 4 + Math.random() * 8;
        const x = centerX + Math.cos(angle) * dist;
        const z = centerZ + Math.sin(angle) * dist;
        this.animals.push(new Animal(type, this.world, this.scene, x, z));
      }
    }
  }

  update(dt) {
    for (const animal of this.animals) animal.update(dt);
  }
}
