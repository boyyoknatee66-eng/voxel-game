import * as THREE from 'three';
import { BLOCK, BLOCK_DATA } from './blocks.js';

// The forest guardian: an original tall, slender woodland spirit of dark
// bark and vines, with a smooth faceless head lit only by two glowing
// eyes and a crown of branching antlers, long branch-like arms ending in
// twig fingers, and root tendrils spreading from its feet into the
// ground. Distinct in silhouette and material from the entrance statue
// (world/statue.js): organic bark/vine/antler textures rather than armor.
//
// Unlike the entrance statue, the guardian isn't baked into the terrain —
// it's built here as an animated THREE.Group of unit-cube "voxels" (one
// box per block, same palette as the BLOCK.GUARDIAN_* colors) and spawned
// as a slow-wandering creature by world/animals.js, so it can walk around
// its plaza instead of standing fixed. The legs are each their own
// sub-group pivoting at the hip, tagged in `group.userData.legs`, which
// is exactly what the Animal class (world/animals.js) looks for to swing
// them while it walks.
//
// Offsets below are in block units from the guardian's ground anchor: dx
// is left(-)/right(+), dy is up from the ground, dz is back(-)/front(+)
// (it faces +z, the same way the entrance statue does).

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

export function makeGuardianMesh() {
  const group = new THREE.Group();
  const add = (dx, dy, dz, blockId) => {
    const mesh = makeBoxMesh(blockId);
    mesh.position.set(dx + 0.5, dy + 0.5, dz + 0.5);
    group.add(mesh);
  };

  // --- Root mound: an irregular moss-covered base with a few root
  // tendrils splaying outward, instead of a square plinth. ---
  const rootMound = [
    [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1],
  ];
  for (const [dx, dz] of rootMound) add(dx, -1, dz, BLOCK.GUARDIAN_MOSS);
  add(2, -1, 0, BLOCK.GUARDIAN_BARK_DARK);
  add(-2, -1, 0, BLOCK.GUARDIAN_BARK_DARK);
  add(0, -1, 2, BLOCK.GUARDIAN_BARK_DARK);
  add(0, -1, -2, BLOCK.GUARDIAN_BARK_DARK);

  // --- Legs: each leg is its own sub-group pivoting at the hip (dy=4),
  // so the whole leg swings as one piece while walking rather than each
  // stacked segment rotating independently. ---
  const legs = [];
  for (const side of [-1, 1]) {
    const legGroup = new THREE.Group();
    legGroup.position.set(side + 0.5, HIP_Y, 0.5);
    const segments = [
      [0, BLOCK.GUARDIAN_BARK_DARK],
      [1, BLOCK.GUARDIAN_VINE],
      [2, BLOCK.GUARDIAN_BARK_DARK],
      [3, BLOCK.GUARDIAN_BARK_DARK],
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

  // --- Hips: a mossy band joining the legs into the trunk. ---
  for (const dx of [-1, 0, 1]) add(dx, 4, 0, BLOCK.GUARDIAN_MOSS);

  // --- Torso: slender bark trunk, three rows tall, with a vine climbing
  // one side and a patch of moss on the chest. ---
  for (let dy = 5; dy <= 7; dy++) {
    for (let dx = -1; dx <= 1; dx++) add(dx, dy, 0, BLOCK.GUARDIAN_BARK);
  }
  add(-1, 6, 0, BLOCK.GUARDIAN_VINE);
  add(-1, 5, 1, BLOCK.GUARDIAN_MOSS);
  add(0, 5, 1, BLOCK.GUARDIAN_MOSS);

  // --- Shoulder nubs where the branch-arms attach. ---
  add(-2, 8, 0, BLOCK.GUARDIAN_BARK_DARK);
  add(2, 8, 0, BLOCK.GUARDIAN_BARK_DARK);

  // --- Head: a small smooth bark block, faceless but for two glowing
  // amber eyes on the front. ---
  for (let dx = -1; dx <= 1; dx++) add(dx, 9, 0, BLOCK.GUARDIAN_BARK);
  add(-1, 9, 1, BLOCK.GUARDIAN_EYE);
  add(1, 9, 1, BLOCK.GUARDIAN_EYE);
  add(0, 10, 0, BLOCK.GUARDIAN_BARK_DARK);

  // --- Antlers: a branching crown rising from the head. ---
  for (const side of [-1, 1]) {
    add(side * 1, 10, 0, BLOCK.GUARDIAN_ANTLER);
    add(side * 2, 11, -1, BLOCK.GUARDIAN_ANTLER);
    add(side * 3, 11, -2, BLOCK.GUARDIAN_ANTLER);
    add(side * 2, 11, 0, BLOCK.GUARDIAN_ANTLER);
    add(side * 1, 10, 1, BLOCK.GUARDIAN_ANTLER);
  }

  // --- Arms: long, thin branches sweeping down and forward from the
  // shoulders, ending in a small cluster of twig "fingers". ---
  for (const side of [-1, 1]) {
    add(side * 3, 7, 1, BLOCK.GUARDIAN_BARK_DARK);
    add(side * 4, 6, 2, BLOCK.GUARDIAN_BARK_DARK);
    add(side * 4, 5, 3, BLOCK.GUARDIAN_BARK_DARK);
    add(side * 4, 4, 4, BLOCK.GUARDIAN_BARK_DARK);
    add(side * 5, 4, 5, BLOCK.GUARDIAN_ANTLER);
    add(side * 3, 4, 5, BLOCK.GUARDIAN_ANTLER);
    add(side * 4, 5, 5, BLOCK.GUARDIAN_ANTLER);
  }

  return group;
}
