import { createNoise2D } from 'simplex-noise';
import { BLOCK } from './blocks.js';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './chunk.js';
import {
  ISLAND_CENTER,
  ISLAND_RADIUS,
  ISLAND_MARGIN,
  ISLAND_HEIGHT,
  POND,
  ZONES,
  GATE,
  STATUE,
  GUARDIAN,
  SEA_LEVEL,
  isOnPath,
  distanceToIsland,
} from './zoo.js';
import { getStatueVoxels, STATUE_HALF_SPAN } from './statue.js';
import { getGuardianVoxels, GUARDIAN_HALF_SPAN } from './guardian.js';

export { ISLAND_CENTER };

// Deterministic PRNG so the same seed always makes the same world. Simplex
// noise from the `simplex-noise` package takes a `() => number` RNG.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedSeed = null;
let noise2D = null;
let noise2DDetail = null;

function getNoiseFns(seed) {
  if (cachedSeed !== seed) {
    noise2D = createNoise2D(mulberry32(seed));
    noise2DDetail = createNoise2D(mulberry32(seed + 99991));
    cachedSeed = seed;
  }
  return { noise2D, noise2DDetail };
}

const BASE_HEIGHT = 28;
const POND_MARGIN = 4;
const POND_FLOOR = SEA_LEVEL - 4;

function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Fills a chunk's block data using layered simplex noise:
 * - large-scale noise shapes hills/valleys
 * - smaller-scale noise adds roughness on top
 * Then layers grass/dirt/stone by depth, adds water up to sea level, and
 * scatters simple trees on dry land. Around spawn, a large flat "zoo
 * island" is carved out instead (see world/zoo.js for the layout): a
 * central pond, paths radiating out to themed exhibit zones, and an
 * entrance gate, all blending smoothly back into the normal terrain at
 * the island's edge.
 */
export function generateChunk(chunk, seed) {
  const { noise2D, noise2DDetail } = getNoiseFns(seed);
  const wx0 = chunk.worldX();
  const wz0 = chunk.worldZ();

  const heights = [];

  for (let x = 0; x < CHUNK_SIZE_X; x++) {
    heights[x] = [];
    for (let z = 0; z < CHUNK_SIZE_Z; z++) {
      const wx = wx0 + x;
      const wz = wz0 + z;

      const large = noise2D(wx * 0.015, wz * 0.015) * 14;
      const detail = noise2DDetail(wx * 0.06, wz * 0.06) * 3;
      let height = Math.floor(BASE_HEIGHT + large + detail);

      // Blend toward the flat zoo island near spawn.
      const distToIsland = distanceToIsland(wx, wz);
      if (distToIsland < ISLAND_RADIUS + ISLAND_MARGIN) {
        const flatness = 1 - smoothstep(ISLAND_RADIUS, ISLAND_RADIUS + ISLAND_MARGIN, distToIsland);
        height = Math.round(height * (1 - flatness) + ISLAND_HEIGHT * flatness);
      }

      // Carve the central pond basin into the (now flat) island.
      const distToPond = Math.hypot(wx - POND.x, wz - POND.z);
      if (distToPond < POND.radius + POND_MARGIN) {
        const pondFactor = 1 - smoothstep(POND.radius, POND.radius + POND_MARGIN, distToPond);
        height = Math.round(height * (1 - pondFactor) + POND_FLOOR * pondFactor);
      }

      heights[x][z] = height;

      const onPath = isOnPath(wx, wz);

      for (let y = 0; y <= Math.min(height, CHUNK_SIZE_Y - 1); y++) {
        let block;
        if (y === height) {
          if (onPath) {
            block = BLOCK.PATH;
          } else {
            block = height <= SEA_LEVEL + 1 ? BLOCK.SAND : BLOCK.GRASS;
            if (height >= BASE_HEIGHT + 11) block = BLOCK.SNOW;
          }
        } else if (y > height - 4) {
          block = height <= SEA_LEVEL + 1 ? BLOCK.SAND : BLOCK.DIRT;
        } else {
          block = BLOCK.STONE;
        }
        chunk.setBlock(x, y, z, block);
      }

      for (let y = height + 1; y <= SEA_LEVEL; y++) {
        chunk.setBlock(x, y, z, BLOCK.WATER);
      }
    }
  }

  scatterTrees(chunk, heights, wx0, wz0);
  plantZooTrees(chunk, heights, wx0, wz0);
  buildGate(chunk, wx0, wz0);
  buildStatue(chunk, wx0, wz0);
  buildGuardian(chunk, wx0, wz0);

  chunk.dirty = true;
}

function hashToUnit(x, z, salt) {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function scatterTrees(chunk, heights, wx0, wz0) {
  for (let x = 2; x < CHUNK_SIZE_X - 2; x++) {
    for (let z = 2; z < CHUNK_SIZE_Z - 2; z++) {
      const wx = wx0 + x;
      const wz = wz0 + z;

      // No randomly-scattered trees anywhere near the zoo island — its
      // trees are all planted deliberately by zone (see plantZooTrees).
      if (distanceToIsland(wx, wz) < ISLAND_RADIUS + ISLAND_MARGIN) continue;

      const height = heights[x][z];
      if (height <= SEA_LEVEL + 1) continue; // no trees on beaches/underwater
      if (height >= BASE_HEIGHT + 11) continue; // no trees on snow peaks

      const roll = hashToUnit(wx, wz, 0);
      if (roll > 0.015) continue;

      plantTree(chunk, x, height + 1, z, 'oak');
    }
  }
}

// Fixed, hand-placed trees for the zoo island: coconut palms ringing the
// pond, mango trees shading the giraffe/lion/elephant zones, and
// mangosteen trees in the rat & insect garden. Positions are world
// coordinates; each is only planted when it falls inside the chunk
// currently being generated.
function zooTreePositions() {
  const trees = [];

  // Coconut palms around the pond shore.
  const palmCount = 7;
  for (let i = 0; i < palmCount; i++) {
    const angle = (i / palmCount) * Math.PI * 2;
    trees.push({
      x: Math.round(POND.x + Math.cos(angle) * (POND.radius + 5)),
      z: Math.round(POND.z + Math.sin(angle) * (POND.radius + 5)),
      species: 'coconut',
    });
  }

  // Mango trees: a few in the giraffe grove, a couple each in the lion
  // and elephant zones for shade.
  const mangoSpots = [
    { zone: ZONES.giraffe, dx: -9, dz: -6 },
    { zone: ZONES.giraffe, dx: 8, dz: -10 },
    { zone: ZONES.giraffe, dx: 10, dz: 6 },
    { zone: ZONES.lion, dx: -10, dz: 8 },
    { zone: ZONES.lion, dx: 9, dz: -7 },
    { zone: ZONES.elephant, dx: -10, dz: -7 },
    { zone: ZONES.elephant, dx: 9, dz: 9 },
  ];
  for (const { zone, dx, dz } of mangoSpots) {
    trees.push({ x: zone.x + dx, z: zone.z + dz, species: 'mango' });
  }

  // Mangosteen trees in the rat & insect garden.
  const mangosteenSpots = [
    { dx: -9, dz: -6 },
    { dx: 7, dz: -9 },
    { dx: 9, dz: 8 },
  ];
  for (const { dx, dz } of mangosteenSpots) {
    trees.push({ x: ZONES.ratInsect.x + dx, z: ZONES.ratInsect.z + dz, species: 'mangosteen' });
  }

  return trees;
}

let cachedTreePositions = null;
function getZooTreePositions() {
  if (!cachedTreePositions) cachedTreePositions = zooTreePositions();
  return cachedTreePositions;
}

function plantZooTrees(chunk, heights, wx0, wz0) {
  for (const tree of getZooTreePositions()) {
    const lx = tree.x - wx0;
    const lz = tree.z - wz0;
    if (lx < 2 || lx >= CHUNK_SIZE_X - 2 || lz < 2 || lz >= CHUNK_SIZE_Z - 2) continue;
    const height = heights[lx][lz];
    plantTree(chunk, lx, height + 1, lz, tree.species);
  }
}

const TREE_SPECIES = {
  oak: { wood: BLOCK.WOOD, leaves: BLOCK.LEAVES, trunkHeight: [4, 6], canopy: 'round' },
  mango: { wood: BLOCK.WOOD, leaves: BLOCK.MANGO_LEAVES, trunkHeight: [3, 5], canopy: 'round' },
  mangosteen: { wood: BLOCK.WOOD, leaves: BLOCK.MANGOSTEEN_LEAVES, trunkHeight: [3, 4], canopy: 'round' },
  coconut: { wood: BLOCK.PALM_WOOD, leaves: BLOCK.PALM_LEAVES, trunkHeight: [5, 7], canopy: 'palm' },
};

function plantTree(chunk, x, baseY, z, species = 'oak') {
  const def = TREE_SPECIES[species] || TREE_SPECIES.oak;
  const [minH, maxH] = def.trunkHeight;
  const trunkHeight = minH + Math.floor(hashToUnit(x, z, 1) * (maxH - minH + 1));

  for (let i = 0; i < trunkHeight; i++) {
    chunk.setBlock(x, baseY + i, z, def.wood);
  }

  const topY = baseY + trunkHeight;

  if (def.canopy === 'palm') {
    // A small cluster of fronds at the top instead of a round canopy.
    const frondOffsets = [
      [0, 0, 0],
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
      [1, -1, 1],
      [-1, -1, -1],
      [1, -1, -1],
      [-1, -1, 1],
    ];
    for (const [dx, dy, dz] of frondOffsets) {
      const lx = x + dx;
      const ly = topY + dy;
      const lz = z + dz;
      if (!chunk.inBounds(lx, ly, lz)) continue;
      if (chunk.getBlock(lx, ly, lz) !== BLOCK.AIR) continue;
      chunk.setBlock(lx, ly, lz, def.leaves);
    }
    return;
  }

  // Round canopy (oak/mango/mangosteen), scaled down a little for the
  // smaller fruit trees.
  const radius = species === 'oak' ? 2 : 1.6;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = -2; dy <= 1; dy++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > radius + 2) continue;
        const lx = x + dx;
        const ly = topY + dy;
        const lz = z + dz;
        if (!chunk.inBounds(lx, ly, lz)) continue;
        if (chunk.getBlock(lx, ly, lz) !== BLOCK.AIR) continue;
        chunk.setBlock(lx, ly, lz, def.leaves);
      }
    }
  }
}

// A simple wooden arch at the south entrance gate: two pillars and a
// lintel straddling the path into the zoo. The gate sits well inside the
// flat part of the island (not near the pond or the island's blended
// edge), so its base height is always exactly ISLAND_HEIGHT — no need to
// look up per-column terrain height. Each block is placed using its own
// world-to-local conversion, so the arch renders correctly even though it
// straddles a chunk boundary.
function buildGate(chunk, wx0, wz0) {
  const half = 3;
  const pillarHeight = 5;
  const lz = GATE.z - wz0;
  if (lz < 0 || lz >= CHUNK_SIZE_Z) return;

  for (const wx of [GATE.x - half, GATE.x + half]) {
    const lx = wx - wx0;
    if (lx < 0 || lx >= CHUNK_SIZE_X) continue;
    for (let i = 0; i < pillarHeight; i++) {
      chunk.setBlock(lx, ISLAND_HEIGHT + 1 + i, lz, BLOCK.PALM_WOOD);
    }
  }

  for (let wx = GATE.x - half; wx <= GATE.x + half; wx++) {
    const lx = wx - wx0;
    if (lx < 0 || lx >= CHUNK_SIZE_X) continue;
    chunk.setBlock(lx, ISLAND_HEIGHT + 1 + pillarHeight, lz, BLOCK.PALM_WOOD);
  }
}

// The ~10m-tall guardian statue standing in its plaza directly across the
// pond from the entrance gate (see world/zoo.js for the layout and
// world/statue.js for the voxel model). Like buildGate, it sits on the
// flat part of the island so its anchor height is always exactly
// ISLAND_HEIGHT, and each voxel is placed via its own world-to-local
// conversion so the statue renders correctly even though it straddles
// chunk boundaries.
function buildStatue(chunk, wx0, wz0) {
  // Cheap reject: skip chunks nowhere near the statue's footprint.
  const chunkCenterX = wx0 + CHUNK_SIZE_X / 2;
  const chunkCenterZ = wz0 + CHUNK_SIZE_Z / 2;
  const reach = STATUE_HALF_SPAN + CHUNK_SIZE_X; // generous margin
  if (Math.hypot(chunkCenterX - STATUE.x, chunkCenterZ - STATUE.z) > reach) return;

  const baseY = ISLAND_HEIGHT + 1;
  for (const { dx, dy, dz, block } of getStatueVoxels()) {
    const lx = STATUE.x + dx - wx0;
    const lz = STATUE.z + dz - wz0;
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z) continue;
    const ly = baseY + dy;
    if (ly < 0 || ly >= CHUNK_SIZE_Y) continue;
    chunk.setBlock(lx, ly, lz, block);
  }
}

// The second landmark, an original ~10m-tall forest guardian standing in
// its own plaza one spoke road to the left of the entrance statue (see
// world/zoo.js for the layout and world/guardian.js for the voxel model).
// Same placement approach as buildStatue above.
function buildGuardian(chunk, wx0, wz0) {
  const chunkCenterX = wx0 + CHUNK_SIZE_X / 2;
  const chunkCenterZ = wz0 + CHUNK_SIZE_Z / 2;
  const reach = GUARDIAN_HALF_SPAN + CHUNK_SIZE_X;
  if (Math.hypot(chunkCenterX - GUARDIAN.x, chunkCenterZ - GUARDIAN.z) > reach) return;

  const baseY = ISLAND_HEIGHT + 1;
  for (const { dx, dy, dz, block } of getGuardianVoxels()) {
    const lx = GUARDIAN.x + dx - wx0;
    const lz = GUARDIAN.z + dz - wz0;
    if (lx < 0 || lx >= CHUNK_SIZE_X || lz < 0 || lz >= CHUNK_SIZE_Z) continue;
    const ly = baseY + dy;
    if (ly < 0 || ly >= CHUNK_SIZE_Y) continue;
    chunk.setBlock(lx, ly, lz, block);
  }
}
