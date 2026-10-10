import { BLOCK } from './blocks.js';

// Programmatic voxel-art model of the zoo's second landmark: an original
// "forest guardian" — a tall, slender woodland spirit of dark bark and
// vines, with a smooth faceless head lit only by two glowing eyes and a
// crown of branching antlers, long branch-like arms ending in twig
// fingers, and root tendrils spreading from its feet into the ground.
// Distinct in silhouette and material from the entrance statue (world/
// statue.js): organic bark/vine/antler textures rather than armor, and a
// warm glow instead of cold neon. Placed on its own spoke road one lane
// to the left of the entrance statue's boulevard (see world/zoo.js).
//
// Coordinates are local voxel offsets from the guardian's ground anchor:
// dx is left(-)/right(+), dy is straight up from the ground (dy 0 is the
// first layer), dz is back(-)/front(+) (the guardian faces +z, toward the
// pond, same as the entrance statue).

function buildVoxels() {
  const voxels = [];
  const put = (dx, dy, dz, block) => voxels.push({ dx, dy, dz, block });

  // --- Root mound: an irregular moss-covered base with a few root
  // tendrils splaying outward, instead of a square plinth. ---
  const rootMound = [
    [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1],
  ];
  for (const [dx, dz] of rootMound) put(dx, -1, dz, BLOCK.GUARDIAN_MOSS);
  put(2, -1, 0, BLOCK.GUARDIAN_BARK_DARK);
  put(-2, -1, 0, BLOCK.GUARDIAN_BARK_DARK);
  put(0, -1, 2, BLOCK.GUARDIAN_BARK_DARK);
  put(0, -1, -2, BLOCK.GUARDIAN_BARK_DARK);

  // --- Legs: two slender bark legs with a vine wrapped around each. ---
  for (const side of [-1, 1]) {
    for (let dy = 0; dy <= 3; dy++) {
      put(side, dy, 0, BLOCK.GUARDIAN_BARK_DARK);
    }
    put(side, 1, 0, BLOCK.GUARDIAN_VINE);
  }

  // --- Hips: a mossy band joining the legs into the trunk. ---
  for (const dx of [-1, 0, 1]) put(dx, 4, 0, BLOCK.GUARDIAN_MOSS);

  // --- Torso: slender bark trunk, three rows tall, with a vine climbing
  // one side and a patch of moss on the chest. ---
  for (let dy = 5; dy <= 7; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      put(dx, dy, 0, BLOCK.GUARDIAN_BARK);
    }
  }
  put(-1, 6, 0, BLOCK.GUARDIAN_VINE);
  put(-1, 5, 1, BLOCK.GUARDIAN_MOSS);
  put(0, 5, 1, BLOCK.GUARDIAN_MOSS);

  // --- Shoulder nubs where the branch-arms attach. ---
  put(-2, 8, 0, BLOCK.GUARDIAN_BARK_DARK);
  put(2, 8, 0, BLOCK.GUARDIAN_BARK_DARK);

  // --- Head: a small smooth bark block, faceless but for two glowing
  // amber eyes on the front. ---
  for (let dx = -1; dx <= 1; dx++) put(dx, 9, 0, BLOCK.GUARDIAN_BARK);
  put(-1, 9, 1, BLOCK.GUARDIAN_EYE);
  put(1, 9, 1, BLOCK.GUARDIAN_EYE);
  put(0, 10, 0, BLOCK.GUARDIAN_BARK_DARK);

  // --- Antlers: a branching crown rising from the head, the guardian's
  // most distinctive feature. ---
  for (const side of [-1, 1]) {
    put(side * 1, 10, 0, BLOCK.GUARDIAN_ANTLER);
    put(side * 2, 11, -1, BLOCK.GUARDIAN_ANTLER);
    put(side * 3, 11, -2, BLOCK.GUARDIAN_ANTLER);
    put(side * 2, 11, 0, BLOCK.GUARDIAN_ANTLER); // forward-branching tine
    put(side * 1, 10, 1, BLOCK.GUARDIAN_ANTLER); // small brow tine
  }

  // --- Arms: long, thin branches sweeping down and forward from the
  // shoulders, ending in a small cluster of twig "fingers" rather than a
  // hand. ---
  for (const side of [-1, 1]) {
    put(side * 3, 7, 1, BLOCK.GUARDIAN_BARK_DARK);
    put(side * 4, 6, 2, BLOCK.GUARDIAN_BARK_DARK);
    put(side * 4, 5, 3, BLOCK.GUARDIAN_BARK_DARK);
    put(side * 4, 4, 4, BLOCK.GUARDIAN_BARK_DARK);
    put(side * 5, 4, 5, BLOCK.GUARDIAN_ANTLER);
    put(side * 3, 4, 5, BLOCK.GUARDIAN_ANTLER);
    put(side * 4, 5, 5, BLOCK.GUARDIAN_ANTLER);
  }

  return voxels;
}

let cached = null;
/** The full set of {dx, dy, dz, block} voxels making up the forest
 * guardian, relative to its ground anchor point. Computed once and
 * cached. */
export function getGuardianVoxels() {
  if (!cached) cached = buildVoxels();
  return cached;
}

// Generous half-width/height used by terrain.js to know which chunks could
// possibly contain part of the guardian, without having to scan every
// voxel for every chunk.
export const GUARDIAN_HALF_SPAN = 6;
export const GUARDIAN_MIN_DY = -1;
export const GUARDIAN_MAX_DY = 11;
