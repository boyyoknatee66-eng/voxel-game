import { createNoise2D } from 'simplex-noise';
import { BLOCK } from './blocks.js';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './chunk.js';

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

const SEA_LEVEL = 30;
const BASE_HEIGHT = 28;

/**
 * Fills a chunk's block data using layered simplex noise:
 * - large-scale noise shapes hills/valleys
 * - smaller-scale noise adds roughness on top
 * Then layers grass/dirt/stone by depth, adds water up to sea level, and
 * scatters simple trees on dry land.
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
      const height = Math.floor(BASE_HEIGHT + large + detail);
      heights[x][z] = height;

      for (let y = 0; y <= Math.min(height, CHUNK_SIZE_Y - 1); y++) {
        let block;
        if (y === height) {
          block = height <= SEA_LEVEL + 1 ? BLOCK.SAND : BLOCK.GRASS;
          if (height >= BASE_HEIGHT + 11) block = BLOCK.SNOW;
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

  chunk.dirty = true;
}

function hashToUnit(x, z, salt) {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function scatterTrees(chunk, heights, wx0, wz0) {
  for (let x = 2; x < CHUNK_SIZE_X - 2; x++) {
    for (let z = 2; z < CHUNK_SIZE_Z - 2; z++) {
      const height = heights[x][z];
      if (height <= SEA_LEVEL + 1) continue; // no trees on beaches/underwater
      if (height >= BASE_HEIGHT + 11) continue; // no trees on snow peaks

      const roll = hashToUnit(wx0 + x, wz0 + z, 0);
      if (roll > 0.015) continue;

      plantTree(chunk, x, height + 1, z);
    }
  }
}

function plantTree(chunk, x, baseY, z) {
  const trunkHeight = 4 + Math.floor(hashToUnit(x, z, 1) * 2);

  for (let i = 0; i < trunkHeight; i++) {
    chunk.setBlock(x, baseY + i, z, BLOCK.WOOD);
  }

  const topY = baseY + trunkHeight;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = -2; dy <= 1; dy++) {
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
        const dist = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
        if (dist > 4) continue;
        const lx = x + dx;
        const ly = topY + dy;
        const lz = z + dz;
        if (!chunk.inBounds(lx, ly, lz)) continue;
        if (chunk.getBlock(lx, ly, lz) !== BLOCK.AIR) continue;
        chunk.setBlock(lx, ly, lz, BLOCK.LEAVES);
      }
    }
  }
}
