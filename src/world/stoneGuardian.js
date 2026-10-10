import * as THREE from 'three';
import { BLOCK, BLOCK_DATA } from './blocks.js';

// The stone guardian: an original hulking golem for the elephant zone —
// a bulky, broad-shouldered body of dark granite blocks with patches of
// lighter stone, veined with glowing teal-green crystal cracks across its
// chest and back, small crystal eyes, and oversized fists. Built the same
// way as the forest guardian (world/guardian.js): an animated THREE.Group
// of unit-cube "voxels" with its own palette (BLOCK.STONEG_*), spawned as
// a slow-wandering creature by world/animals.js so it patrols the
// elephant habitat instead of standing fixed. Each leg is its own
// sub-group pivoting at the hip, tagged in `group.userData.legs`, which
// is what the Animal class looks for to swing them while it walks.
//
// Offsets below are in block units from the guardian's ground anchor: dx
// is left(-)/right(+), dy is up from the ground, dz is back(-)/front(+)
// (it faces +z).

function colorOf(blockId) {
  return BLOCK_DATA[blockId].colors.top;
}

function makeBoxMesh(blockId) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshLambertMaterial({ color: colorOf(blockId) });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const HIP_Y = 4;

export function makeStoneGuardianMesh() {
  const group = new THREE.Group();
  const add = (dx, dy, dz, blockId) => {
    const mesh = makeBoxMesh(blockId);
    mesh.position.set(dx + 0.5, dy + 0.5, dz + 0.5);
    group.add(mesh);
  };

  // --- Legs: thick, wide-set granite legs, each its own sub-group
  // pivoting at the hip so the whole leg swings while walking. ---
  const legs = [];
  for (const side of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(side * 2 + 0.5, HIP_Y, 0.5);
    const segments = [
      [0, BLOCK.STONEG_BODY],
      [1, BLOCK.STONEG_BODY],
      [2, BLOCK.STONEG_BODY_LIGHT],
      [3, BLOCK.STONEG_BODY],
    ];
    for (const [dy, blockId] of segments) {
      const seg = makeBoxMesh(blockId);
      seg.position.set(0, dy - HIP_Y + 0.5, 0);
      legGroup.add(seg);
    }
    group.add(legGroup);
    legs.push(legGroup);
  }
  group.userData.legs = legs;

  // --- Hips: a wide granite band joining the legs into the torso. ---
  for (let dx = -2; dx <= 2; dx++) add(dx, 4, 0, BLOCK.STONEG_BODY);

  // --- Torso: broad, blocky chest, four rows tall and two deep, with
  // lighter stone patches and a glowing crystal crack running up the
  // middle. ---
  for (let dy = 5; dy <= 8; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -1; dz <= 0; dz++) {
        add(dx, dy, dz, BLOCK.STONEG_BODY);
      }
    }
  }
  // Lighter stone patches.
  add(-2, 6, 1, BLOCK.STONEG_BODY_LIGHT);
  add(2, 7, 1, BLOCK.STONEG_BODY_LIGHT);
  add(-1, 8, 1, BLOCK.STONEG_BODY_LIGHT);
  // Glowing crystal crack up the chest.
  add(0, 5, 1, BLOCK.STONEG_CRYSTAL);
  add(0, 6, 1, BLOCK.STONEG_CRYSTAL_DARK);
  add(1, 7, 1, BLOCK.STONEG_CRYSTAL);
  add(0, 8, 1, BLOCK.STONEG_CRYSTAL_DARK);

  // --- Shoulders: a wide block of stone each side, where the arms
  // attach. ---
  for (const side of [-1, 1]) {
    add(side * 4, 8, 0, BLOCK.STONEG_BODY_LIGHT);
    add(side * 4, 8, -1, BLOCK.STONEG_BODY);
  }

  // --- Head: small relative to the body (golem proportions), with two
  // glowing crystal eyes. ---
  for (let dx = -1; dx <= 1; dx++) add(dx, 9, 0, BLOCK.STONEG_BODY_LIGHT);
  add(-1, 9, 1, BLOCK.STONEG_CRYSTAL);
  add(1, 9, 1, BLOCK.STONEG_CRYSTAL);
  add(0, 10, 0, BLOCK.STONEG_BODY);

  // --- Back crystal spikes: a cluster of glowing crystal shards jutting
  // from each shoulder, the guardian's most distinctive feature. ---
  for (const side of [-1, 1]) {
    add(side * 4, 9, -1, BLOCK.STONEG_CRYSTAL);
    add(side * 4, 10, -1, BLOCK.STONEG_CRYSTAL_DARK);
    add(side * 3, 9, -2, BLOCK.STONEG_CRYSTAL);
    add(side * 5, 9, -1, BLOCK.STONEG_CRYSTAL_DARK);
  }

  // --- Arms: thick and heavy, hanging down from the shoulders with
  // oversized blocky fists. ---
  for (const side of [-1, 1]) {
    add(side * 4, 7, 1, BLOCK.STONEG_BODY);
    add(side * 5, 6, 1, BLOCK.STONEG_BODY);
    add(side * 5, 5, 2, BLOCK.STONEG_BODY);
    add(side * 5, 4, 2, BLOCK.STONEG_BODY);
    // Fist cluster.
    add(side * 5, 3, 2, BLOCK.STONEG_BODY_LIGHT);
    add(side * 6, 3, 2, BLOCK.STONEG_BODY);
    add(side * 5, 3, 3, BLOCK.STONEG_BODY);
    add(side * 6, 3, 3, BLOCK.STONEG_BODY_LIGHT);
  }

  return group;
}
