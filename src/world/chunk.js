import * as THREE from 'three';
import { BLOCK, BLOCK_DATA, isSolid, isTransparent } from './blocks.js';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_SIZE_Y = 64;

// Reused face definitions for culled-face meshing. Each face has:
// - dir: the neighbor offset to check for occlusion
// - corners: the 4 vertex offsets (counter-clockwise) for the face
// - normal: face normal
// - uvFace: which color ('top' | 'bottom' | 'side') to use from BLOCK_DATA
const FACES = [
  {
    // +X (right)
    dir: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    normal: [1, 0, 0],
    uvFace: 'side',
  },
  {
    // -X (left)
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    normal: [-1, 0, 0],
    uvFace: 'side',
  },
  {
    // +Y (top)
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    normal: [0, 1, 0],
    uvFace: 'top',
  },
  {
    // -Y (bottom)
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    normal: [0, -1, 0],
    uvFace: 'bottom',
  },
  {
    // +Z (front)
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    normal: [0, 0, 1],
    uvFace: 'side',
  },
  {
    // -Z (back)
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    normal: [0, 0, -1],
    uvFace: 'side',
  },
];

const _color = new THREE.Color();

/**
 * A single chunk of voxel data plus the logic to turn that data into a
 * renderable mesh. World access for neighbor lookups (so faces at chunk
 * borders are culled correctly) is provided by the `world` reference.
 */
export class Chunk {
  constructor(world, cx, cz) {
    this.world = world;
    this.cx = cx;
    this.cz = cz;
    this.sizeX = CHUNK_SIZE_X;
    this.sizeY = CHUNK_SIZE_Y;
    this.sizeZ = CHUNK_SIZE_Z;
    this.blocks = new Uint8Array(this.sizeX * this.sizeY * this.sizeZ);

    this.solidMesh = null;
    this.waterMesh = null;
    this.dirty = true;
  }

  index(x, y, z) {
    return (y * this.sizeZ + z) * this.sizeX + x;
  }

  inBounds(x, y, z) {
    return (
      x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY && z >= 0 && z < this.sizeZ
    );
  }

  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) return BLOCK.AIR;
    return this.blocks[this.index(x, y, z)];
  }

  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.blocks[this.index(x, y, z)] = id;
    this.dirty = true;
  }

  worldX() {
    return this.cx * this.sizeX;
  }

  worldZ() {
    return this.cz * this.sizeZ;
  }

  // Looks up a block that may be outside this chunk by delegating to the
  // world, which knows how to find the neighboring chunk.
  getBlockWorld(x, y, z) {
    if (this.inBounds(x, y, z)) return this.blocks[this.index(x, y, z)];
    return this.world.getBlock(this.worldX() + x, y, this.worldZ() + z);
  }

  /**
   * Rebuilds the mesh geometry for this chunk using simple culled-face
   * meshing: for every solid block, emit a quad for each face that is next
   * to air/transparent block. This is much cheaper than greedy meshing to
   * implement, and fast enough for chunk sizes like 16x64x16.
   */
  buildMesh() {
    const solid = createMeshBuilder();
    const water = createMeshBuilder();

    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        for (let z = 0; z < this.sizeZ; z++) {
          const id = this.getBlock(x, y, z);
          if (id === BLOCK.AIR) continue;

          const data = BLOCK_DATA[id];
          const builder = id === BLOCK.WATER ? water : solid;
          const thisTransparent = isTransparent(id);

          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const neighbor = this.getBlockWorld(nx, ny, nz);

            // Skip the face if the neighbor is the same transparent type
            // (e.g. water next to water) so we don't render internal faces.
            if (neighbor === id && thisTransparent) continue;

            const neighborSolid = isSolid(neighbor);
            const neighborTransparent = isTransparent(neighbor);

            // Only draw this face if the neighbor doesn't fully occlude it.
            const visible = !neighborSolid || (thisTransparent && neighborTransparent && neighbor !== id);
            if (!visible) continue;

            builder.addFace(x, y, z, face, data.colors[face.uvFace]);
          }
        }
      }
    }

    this.solidMesh = solid.toMesh(false);
    this.waterMesh = water.toMesh(true);

    const wx = this.worldX();
    const wz = this.worldZ();
    if (this.solidMesh) this.solidMesh.position.set(wx, 0, wz);
    if (this.waterMesh) this.waterMesh.position.set(wx, 0, wz);

    this.dirty = false;
  }

  dispose() {
    for (const mesh of [this.solidMesh, this.waterMesh]) {
      if (!mesh) continue;
      mesh.geometry.dispose();
      if (mesh.parent) mesh.parent.remove(mesh);
    }
    this.solidMesh = null;
    this.waterMesh = null;
  }
}

// Small helper that accumulates vertex/index/color data for one mesh and
// turns it into a THREE.Mesh at the end.
function createMeshBuilder() {
  const positions = [];
  const normals = [];
  const colors = [];
  const indices = [];
  let vertexCount = 0;

  return {
    addFace(x, y, z, face, hexColor) {
      _color.setHex(hexColor);
      for (const corner of face.corners) {
        positions.push(x + corner[0], y + corner[1], z + corner[2]);
        normals.push(face.normal[0], face.normal[1], face.normal[2]);
        colors.push(_color.r, _color.g, _color.b);
      }
      indices.push(
        vertexCount, vertexCount + 1, vertexCount + 2,
        vertexCount, vertexCount + 2, vertexCount + 3,
      );
      vertexCount += 4;
    },
    toMesh(transparent) {
      if (positions.length === 0) return null;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);

      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent,
        opacity: transparent ? 0.75 : 1,
        side: transparent ? THREE.DoubleSide : THREE.FrontSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = !transparent;
      mesh.receiveShadow = true;
      return mesh;
    },
  };
}
