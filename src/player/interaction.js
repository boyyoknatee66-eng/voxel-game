import * as THREE from 'three';
import { BLOCK, HOTBAR, BLOCK_DATA } from '../world/blocks.js';

/**
 * Handles pointing at blocks (raycast from camera), the wireframe highlight
 * box, breaking/placing on click, and the hotbar selection UI.
 */
export class Interaction {
  constructor(scene, camera, world, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.domElement = domElement;

    this.selectedIndex = 0;
    this.lookResult = null;

    const highlightGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const highlightEdges = new THREE.EdgesGeometry(highlightGeo);
    this.highlight = new THREE.LineSegments(
      highlightEdges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }),
    );
    this.highlight.visible = false;
    scene.add(this.highlight);

    this._bindEvents();
    this._buildHud();
  }

  _bindEvents() {
    this.domElement.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== this.domElement) return;
      if (e.button === 0) this.breakBlock();
      if (e.button === 2) this.placeBlock();
    });

    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= HOTBAR.length) {
        this.selectedIndex = n - 1;
        this._refreshHud();
      }
    });

    window.addEventListener('wheel', (e) => {
      const dir = Math.sign(e.deltaY);
      this.selectedIndex = (this.selectedIndex + dir + HOTBAR.length) % HOTBAR.length;
      this._refreshHud();
    });
  }

  _buildHud() {
    this.hud = document.getElementById('hud');
    this.hud.innerHTML = '';
    this.slots = HOTBAR.map((blockId, i) => {
      const el = document.createElement('div');
      el.className = 'slot';
      const data = BLOCK_DATA[blockId];
      el.textContent = `${i + 1}`;
      el.title = data.name;
      el.style.background = `#${data.colors.top.toString(16).padStart(6, '0')}`;
      this.hud.appendChild(el);
      return el;
    });
    this._refreshHud();
  }

  _refreshHud() {
    this.slots.forEach((el, i) => {
      el.classList.toggle('active', i === this.selectedIndex);
    });
  }

  get selectedBlock() {
    return HOTBAR[this.selectedIndex];
  }

  update() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.getWorldPosition(new THREE.Vector3());

    this.lookResult = this.world.raycast(origin, dir, 6);

    if (this.lookResult) {
      const { x, y, z } = this.lookResult.block;
      this.highlight.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.highlight.visible = true;
    } else {
      this.highlight.visible = false;
    }
  }

  breakBlock() {
    if (!this.lookResult) return;
    const { x, y, z } = this.lookResult.block;
    this.world.setBlock(x, y, z, BLOCK.AIR);
  }

  placeBlock() {
    if (!this.lookResult) return;
    const { x, y, z } = this.lookResult.placeAt;
    this.world.setBlock(x, y, z, this.selectedBlock);
  }
}
