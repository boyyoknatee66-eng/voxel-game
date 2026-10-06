// Central registry of block types. Each block has an id (used in the chunk
// data array), a display name, and a color per face (or a single color for
// all faces). Colors are plain hex ints so we can render blocks with
// MeshLambertMaterial + vertex colors instead of needing texture images.

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  WOOD: 5,
  LEAVES: 6,
  WATER: 7,
  SNOW: 8,
};

// top, bottom, side
const colorSet = (top, bottom, side) => ({ top, bottom, side: side ?? top });

export const BLOCK_DATA = {
  [BLOCK.GRASS]: {
    name: 'Grass',
    colors: colorSet(0x5c9e3f, 0x7a5230, 0x6b8f3a),
    solid: true,
    transparent: false,
  },
  [BLOCK.DIRT]: {
    name: 'Dirt',
    colors: colorSet(0x7a5230, 0x7a5230, 0x7a5230),
    solid: true,
    transparent: false,
  },
  [BLOCK.STONE]: {
    name: 'Stone',
    colors: colorSet(0x8a8a8a, 0x8a8a8a, 0x8a8a8a),
    solid: true,
    transparent: false,
  },
  [BLOCK.SAND]: {
    name: 'Sand',
    colors: colorSet(0xdccd8f, 0xdccd8f, 0xdccd8f),
    solid: true,
    transparent: false,
  },
  [BLOCK.WOOD]: {
    name: 'Wood',
    colors: colorSet(0x8a6642, 0x8a6642, 0x6b4a2b),
    solid: true,
    transparent: false,
  },
  [BLOCK.LEAVES]: {
    name: 'Leaves',
    colors: colorSet(0x3e7a2d, 0x3e7a2d, 0x3e7a2d),
    solid: true,
    transparent: true,
  },
  [BLOCK.WATER]: {
    name: 'Water',
    colors: colorSet(0x3a6fd8, 0x3a6fd8, 0x3a6fd8),
    solid: false,
    transparent: true,
  },
  [BLOCK.SNOW]: {
    name: 'Snow',
    colors: colorSet(0xf0f4f8, 0xf0f4f8, 0xf0f4f8),
    solid: true,
    transparent: false,
  },
};

export function isSolid(blockId) {
  if (blockId === BLOCK.AIR) return false;
  const data = BLOCK_DATA[blockId];
  return data ? data.solid : false;
}

export function isTransparent(blockId) {
  if (blockId === BLOCK.AIR) return true;
  const data = BLOCK_DATA[blockId];
  return data ? data.transparent : false;
}

// Blocks the hotbar lets the player place, in order.
export const HOTBAR = [
  BLOCK.GRASS,
  BLOCK.DIRT,
  BLOCK.STONE,
  BLOCK.WOOD,
  BLOCK.LEAVES,
  BLOCK.SAND,
  BLOCK.SNOW,
];
