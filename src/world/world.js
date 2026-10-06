import * as THREE from 'three';
import { Chunk, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './chunk.js';
import { BLOCK } from './blocks.js';
import { generateChunk } from './terrain.js';

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

/**
 * Owns all loaded chunks, streams them in/out around the player, and is the
 * single place other systems (player physics, raycasting, UI) go through to
 * read or write individual blocks regardless of which chunk they live in.
 */
export class World {
  constructor(scene, { viewDistance = 4, seed = 1337 } = {}) {
    this.scene = scene;
    this.viewDistance = viewDistance;
    this.seed = seed;
    this.chunks = new Map();
    this.lastPlayerChunk = { cx: null, cz: null };
    // Limits how many chunk (re)builds happen per frame to avoid hitches.
    this.maxBuildsPerFrame = 2;
    this.buildQueue = [];
  }

  getOrCreateChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(this, cx, cz);
      generateChunk(chunk, this.seed);
      this.chunks.set(key, chunk);
      this.buildQueue.push(chunk);
    }
    return chunk;
  }

  getChunkAt(worldX, worldZ) {
    const cx = Math.floor(worldX / CHUNK_SIZE_X);
    const cz = Math.floor(worldZ / CHUNK_SIZE_Z);
    return this.chunks.get(chunkKey(cx, cz)) ?? null;
  }

  worldToLocal(worldX, worldZ) {
    const cx = Math.floor(worldX / CHUNK_SIZE_X);
    const cz = Math.floor(worldZ / CHUNK_SIZE_Z);
    const lx = worldX - cx * CHUNK_SIZE_X;
    const lz = worldZ - cz * CHUNK_SIZE_Z;
    return { cx, cz, lx, lz };
  }

  getBlock(worldX, worldY, worldZ) {
    if (worldY < 0 || worldY >= CHUNK_SIZE_Y) return BLOCK.AIR;
    const { cx, cz, lx, lz } = this.worldToLocal(worldX, worldZ);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) return BLOCK.AIR;
    return chunk.getBlock(lx, worldY, lz);
  }

  setBlock(worldX, worldY, worldZ, id) {
    if (worldY < 0 || worldY >= CHUNK_SIZE_Y) return;
    const { cx, cz, lx, lz } = this.worldToLocal(worldX, worldZ);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) return;
    chunk.setBlock(lx, worldY, lz, id);
    this.queueRebuild(chunk);

    // If the edited block is on a chunk border, the neighboring chunk's
    // mesh also needs rebuilding since its culled faces may now differ.
    if (lx === 0) this.queueRebuildAt(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.queueRebuildAt(cx + 1, cz);
    if (lz === 0) this.queueRebuildAt(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.queueRebuildAt(cx, cz + 1);
  }

  queueRebuildAt(cx, cz) {
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (chunk) this.queueRebuild(chunk);
  }

  queueRebuild(chunk) {
    chunk.dirty = true;
    if (!this.buildQueue.includes(chunk)) this.buildQueue.push(chunk);
  }

  /** Call every frame: streams chunks in/out around the player and builds
   * a few pending meshes. */
  update(playerPosition) {
    const pcx = Math.floor(playerPosition.x / CHUNK_SIZE_X);
    const pcz = Math.floor(playerPosition.z / CHUNK_SIZE_Z);

    if (pcx !== this.lastPlayerChunk.cx || pcz !== this.lastPlayerChunk.cz) {
      this.lastPlayerChunk = { cx: pcx, cz: pcz };
      this.streamChunks(pcx, pcz);
    }

    this.processBuildQueue();
  }

  streamChunks(pcx, pcz) {
    const vd = this.viewDistance;
    const needed = new Set();

    for (let dx = -vd; dx <= vd; dx++) {
      for (let dz = -vd; dz <= vd; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        needed.add(chunkKey(cx, cz));
        this.getOrCreateChunk(cx, cz);
      }
    }

    // Unload chunks that fell outside the view distance.
    for (const [key, chunk] of this.chunks) {
      if (!needed.has(key)) {
        chunk.dispose();
        this.chunks.delete(key);
        const idx = this.buildQueue.indexOf(chunk);
        if (idx !== -1) this.buildQueue.splice(idx, 1);
      }
    }
  }

  processBuildQueue() {
    let builds = 0;
    while (this.buildQueue.length > 0 && builds < this.maxBuildsPerFrame) {
      const chunk = this.buildQueue.shift();
      if (!this.chunks.has(chunkKey(chunk.cx, chunk.cz))) continue;
      if (chunk.solidMesh) this.scene.remove(chunk.solidMesh);
      if (chunk.waterMesh) this.scene.remove(chunk.waterMesh);

      chunk.buildMesh();

      if (chunk.solidMesh) this.scene.add(chunk.solidMesh);
      if (chunk.waterMesh) this.scene.add(chunk.waterMesh);
      builds++;
    }
  }

  /** Height of the highest solid block at a given world x/z, used to spawn
   * the player safely above the terrain. */
  getSurfaceHeight(worldX, worldZ) {
    for (let y = CHUNK_SIZE_Y - 1; y >= 0; y--) {
      if (this.getBlock(worldX, y, worldZ) !== BLOCK.AIR) return y + 1;
    }
    return 0;
  }

  /**
   * Voxel raycast (DDA) from an origin along a direction, up to maxDistance.
   * Returns the first solid block hit, the block just before it (for
   * placement), and the face normal, or null if nothing was hit.
   */
  raycast(origin, direction, maxDistance = 6) {
    const pos = origin.clone();
    const dir = direction.clone().normalize();
    const step = 0.05;
    let lastEmpty = {
      x: Math.floor(pos.x),
      y: Math.floor(pos.y),
      z: Math.floor(pos.z),
    };

    for (let t = 0; t < maxDistance; t += step) {
      const px = origin.x + dir.x * t;
      const py = origin.y + dir.y * t;
      const pz = origin.z + dir.z * t;
      const bx = Math.floor(px);
      const by = Math.floor(py);
      const bz = Math.floor(pz);

      const id = this.getBlock(bx, by, bz);
      if (id !== BLOCK.AIR && id !== BLOCK.WATER) {
        return {
          block: { x: bx, y: by, z: bz },
          placeAt: lastEmpty,
          id,
        };
      }
      lastEmpty = { x: bx, y: by, z: bz };
    }
    return null;
  }
}
