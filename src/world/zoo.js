// Shared layout for the starting "zoo island": where the center pond and
// each themed zone sit, how wide the paths connecting them are, and where
// the entrance gate is. terrain.js uses this to carve the pond/paths and
// plant zone trees; animals.js uses it to spawn each species in the right
// place. Keeping it in one file keeps the two in sync.

// Shared with terrain.js's noise-based terrain so the pond, water
// creatures, and hills all agree on where the waterline sits.
export const SEA_LEVEL = 30;

export const ISLAND_CENTER = { x: 0, z: 0 };
export const ISLAND_RADIUS = 100; // ~200 blocks across
export const ISLAND_MARGIN = 30; // blend distance back into normal terrain
export const ISLAND_HEIGHT = 33; // flat grass height, safely above sea level

// Central lake: home to the hippo, ducks, and all the aquatic animals.
export const POND = { x: 0, z: 0, radius: 16 };

// Themed exhibit zones, arranged in a ring around the pond like spokes on a
// wheel (matching the reference map: big animal habitats around a central
// water feature, all reachable by path).
export const ZONES = {
  lion: { x: -48, z: -40, radius: 20, label: 'Lion Savanna' },
  giraffe: { x: 4, z: -62, radius: 22, label: 'Giraffe Grove' },
  elephant: { x: -50, z: 44, radius: 20, label: 'Elephant Yard' },
  ratInsect: { x: 52, z: 40, radius: 20, label: 'Burrow & Bug Garden' },
};

// South entrance, with a path leading straight up to the pond.
export const GATE = { x: 0, z: 84 };

// Where the player actually spawns: on the path a little south of the
// pond, facing into the zoo, rather than in the water at dead center.
export const SPAWN_POINT = { x: 0, z: 36 };

export const PATH_WIDTH = 4.5;

// Each path runs from the pond out to a zone (or the gate). Drawn as a
// straight line of PATH blocks during terrain generation.
export const PATH_SEGMENTS = [
  [POND, ZONES.lion],
  [POND, ZONES.giraffe],
  [POND, ZONES.elephant],
  [POND, ZONES.ratInsect],
  [POND, GATE],
];

export function distanceToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const lenSq = abx * abx + abz * abz;
  let t = lenSq > 0 ? ((px - ax) * abx + (pz - az) * abz) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}

export function isOnPath(wx, wz) {
  // No path paving inside the pond itself.
  if (Math.hypot(wx - POND.x, wz - POND.z) < POND.radius) return false;
  for (const [a, b] of PATH_SEGMENTS) {
    if (distanceToSegment(wx, wz, a.x, a.z, b.x, b.z) < PATH_WIDTH / 2) return true;
  }
  return false;
}

export function distanceToIsland(wx, wz) {
  return Math.hypot(wx - ISLAND_CENTER.x, wz - ISLAND_CENTER.z);
}
