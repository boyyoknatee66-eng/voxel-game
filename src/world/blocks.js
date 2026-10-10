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
  PATH: 9,
  PALM_WOOD: 10,
  PALM_LEAVES: 11,
  MANGO_LEAVES: 12,
  MANGOSTEEN_LEAVES: 13,
  // Materials for the entrance guardian statue (see world/statue.js). Kept
  // separate from the natural-terrain palette above.
  STATUE_BLACK: 14,
  STATUE_PURPLE: 15,
  STATUE_PURPLE_DARK: 16,
  STATUE_RED: 17,
  STATUE_WHITE: 18,
  STATUE_SILVER: 19,
  STATUE_STONE: 20,
  // Materials for the second landmark, the forest guardian (see
  // world/guardian.js). An original tall woodland-spirit design, kept
  // separate from the entrance statue's palette above.
  GUARDIAN_BARK: 21,
  GUARDIAN_BARK_DARK: 22,
  GUARDIAN_VINE: 23,
  GUARDIAN_EYE: 24,
  GUARDIAN_ANTLER: 25,
  GUARDIAN_MOSS: 26,
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
  [BLOCK.PATH]: {
    name: 'Path',
    colors: colorSet(0xd9c08f, 0xc9ad78, 0xcfb482),
    solid: true,
    transparent: false,
  },
  [BLOCK.PALM_WOOD]: {
    name: 'Palm Wood',
    colors: colorSet(0x9c7a4a, 0x9c7a4a, 0x8a6a3e),
    solid: true,
    transparent: false,
  },
  [BLOCK.PALM_LEAVES]: {
    name: 'Palm Leaves',
    colors: colorSet(0x5cb33e, 0x5cb33e, 0x5cb33e),
    solid: true,
    transparent: true,
  },
  [BLOCK.MANGO_LEAVES]: {
    name: 'Mango Leaves',
    colors: colorSet(0x2f6b2a, 0x2f6b2a, 0x2f6b2a),
    solid: true,
    transparent: true,
  },
  [BLOCK.MANGOSTEEN_LEAVES]: {
    name: 'Mangosteen Leaves',
    colors: colorSet(0x1f4d33, 0x1f4d33, 0x1f4d33),
    solid: true,
    transparent: true,
  },
  [BLOCK.STATUE_BLACK]: {
    name: 'Statue Armor',
    colors: colorSet(0x18181d, 0x18181d, 0x121216),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_PURPLE]: {
    name: 'Statue Purple',
    colors: colorSet(0x7a35c9, 0x7a35c9, 0x6a2cb0),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_PURPLE_DARK]: {
    name: 'Statue Purple (shade)',
    colors: colorSet(0x4a1f80, 0x4a1f80, 0x3d1a6b),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_RED]: {
    name: 'Statue Red',
    colors: colorSet(0xc92a35, 0xc92a35, 0xa8222c),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_WHITE]: {
    name: 'Statue White',
    colors: colorSet(0xdcdcdc, 0xdcdcdc, 0xc9c9c9),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_SILVER]: {
    name: 'Statue Silver',
    colors: colorSet(0x9aa0a6, 0x9aa0a6, 0x82878d),
    solid: true,
    transparent: false,
  },
  [BLOCK.STATUE_STONE]: {
    name: 'Statue Plinth',
    colors: colorSet(0x6e6e76, 0x5a5a60, 0x63636a),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_BARK]: {
    name: 'Guardian Bark',
    colors: colorSet(0x4a3626, 0x4a3626, 0x3e2c1e),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_BARK_DARK]: {
    name: 'Guardian Bark (shade)',
    colors: colorSet(0x2e2117, 0x2e2117, 0x241a12),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_VINE]: {
    name: 'Guardian Vine',
    colors: colorSet(0x4f7a2e, 0x4f7a2e, 0x426924),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_EYE]: {
    name: 'Guardian Eye',
    colors: colorSet(0xe8c04a, 0xe8c04a, 0xd6ab32),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_ANTLER]: {
    name: 'Guardian Antler',
    colors: colorSet(0xcbb896, 0xcbb896, 0xb8a37e),
    solid: true,
    transparent: false,
  },
  [BLOCK.GUARDIAN_MOSS]: {
    name: 'Guardian Moss',
    colors: colorSet(0x6f8f3e, 0x6f8f3e, 0x5e7a34),
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
