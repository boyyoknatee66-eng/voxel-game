import { BLOCK } from './blocks.js';

// Programmatic voxel-art model of the zoo's entrance guardian statue: a
// stylized dark armored figure with a black body, deep purple blade-like
// wings and clawed hands, a red visor, and red/white chest lights —
// modeled after the reference build photo. Placed as a large (~10m tall)
// landmark in world/statue.js's companion placement in terrain.js.
//
// Coordinates are local voxel offsets from the statue's ground anchor:
// dx is left(-)/right(+), dy is straight up from the ground (dy 0 is the
// first layer), dz is back(-)/front(+) (the statue faces +z, toward the
// pond and the entrance beyond it).

function buildVoxels() {
  const voxels = [];
  const put = (dx, dy, dz, block) => voxels.push({ dx, dy, dz, block });

  // --- Low stone plinth the figure stands on. ---
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (Math.abs(dx) === 3 && Math.abs(dz) === 3) continue;
      put(dx, -1, dz, BLOCK.STATUE_STONE);
    }
  }

  // --- Legs & boots: two separate legs with a gap between them. ---
  for (const side of [-1, 1]) {
    const legX = side; // 1 block in from center
    // Boots flare out a little wider than the leg above them.
    put(legX, 0, -1, BLOCK.STATUE_PURPLE);
    put(legX, 0, 0, BLOCK.STATUE_PURPLE);
    put(legX + side, 0, 0, BLOCK.STATUE_PURPLE);
    // Legs: black armor, four blocks tall.
    for (let dy = 1; dy <= 4; dy++) {
      put(legX, dy, -1, BLOCK.STATUE_BLACK);
      put(legX, dy, 0, BLOCK.STATUE_BLACK);
    }
  }

  // --- Hip band: purple belt joining the legs to the torso. ---
  for (let dx = -2; dx <= 2; dx++) {
    put(dx, 5, 0, BLOCK.STATUE_PURPLE);
    put(dx, 5, -1, BLOCK.STATUE_PURPLE);
  }

  // --- Torso: black armor block, three rows tall. ---
  for (let dy = 6; dy <= 8; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -1; dz <= 0; dz++) {
        put(dx, dy, dz, BLOCK.STATUE_BLACK);
      }
    }
  }

  // --- Chest fascia on the front face: white collar bar above a row of
  // red/white/red button-lights, framed by small purple trim. ---
  for (let dx = -2; dx <= 2; dx++) put(dx, 8, 1, BLOCK.STATUE_WHITE);
  put(-1, 7, 1, BLOCK.STATUE_RED);
  put(0, 7, 1, BLOCK.STATUE_WHITE);
  put(1, 7, 1, BLOCK.STATUE_RED);
  put(-2, 7, 1, BLOCK.STATUE_BLACK);
  put(2, 7, 1, BLOCK.STATUE_BLACK);
  put(-2, 6, 1, BLOCK.STATUE_PURPLE);
  put(2, 6, 1, BLOCK.STATUE_PURPLE);

  // --- Head: black cube with a red visor band on the front. ---
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 0; dz++) {
      put(dx, 9, dz, BLOCK.STATUE_BLACK);
    }
    put(dx, 9, 1, BLOCK.STATUE_RED);
  }
  // A slightly taller crown block at the very top, matching the block-head
  // silhouette in the reference photo.
  put(0, 10, 0, BLOCK.STATUE_BLACK);

  // --- Shoulders, arms, clawed hands & blade wings (mirrored). ---
  for (const side of [-1, 1]) {
    // Shoulder joint and upper arm.
    put(side * 3, 8, 0, BLOCK.STATUE_PURPLE);
    put(side * 3, 7, 0, BLOCK.STATUE_BLACK);
    put(side * 3, 6, 0, BLOCK.STATUE_BLACK);
    // Forearm reaching forward and down, ending in a silver wrist joint
    // and an open purple claw, as in the photo's gesturing hands.
    put(side * 3, 5, 1, BLOCK.STATUE_SILVER);
    put(side * 3, 4, 2, BLOCK.STATUE_PURPLE);
    put(side * 4, 4, 2, BLOCK.STATUE_PURPLE_DARK);
    put(side * 4, 5, 2, BLOCK.STATUE_PURPLE_DARK);

    // Wide blade wings sweeping up and back from the shoulders — two
    // staggered blades per side, like the crossed claw-wings in the photo.
    put(side * 4, 9, -1, BLOCK.STATUE_PURPLE);
    put(side * 5, 9, -2, BLOCK.STATUE_PURPLE);
    put(side * 6, 10, -3, BLOCK.STATUE_PURPLE);
    put(side * 4, 8, -1, BLOCK.STATUE_PURPLE_DARK);
    put(side * 5, 7, -2, BLOCK.STATUE_PURPLE_DARK);
    put(side * 6, 6, -3, BLOCK.STATUE_PURPLE_DARK);
  }

  return voxels;
}

let cached = null;
/** The full set of {dx, dy, dz, block} voxels making up the statue,
 * relative to its ground anchor point. Computed once and cached. */
export function getStatueVoxels() {
  if (!cached) cached = buildVoxels();
  return cached;
}

// Generous half-width/height used by terrain.js to know which chunks could
// possibly contain part of the statue, without having to scan every voxel
// for every chunk.
export const STATUE_HALF_SPAN = 7;
export const STATUE_MIN_DY = -1;
export const STATUE_MAX_DY = 10;
