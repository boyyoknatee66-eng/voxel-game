import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { isSolid } from '../world/blocks.js';

const GRAVITY = -28;
const WALK_SPEED = 5.2;
const SPRINT_SPEED = 8.2;
const JUMP_SPEED = 9.2;
const PLAYER_WIDTH = 0.6; // horizontal collision box half-extent is half of this
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.62;

// Matches the rotation math PointerLockControls uses internally (see
// three/examples/jsm/controls/PointerLockControls.js onMouseMove), so touch
// dragging feels the same as mouse look.
const LOOK_SENSITIVITY = 0.002;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

/**
 * First-person player controller: pointer-lock look, WASD movement with
 * simple AABB-vs-voxel collision, and gravity/jumping. The camera is the
 * player's "body" — position.y is the eye height above the feet.
 */
export class Player {
  constructor(camera, domElement, world) {
    this.world = world;
    this.camera = camera;
    this.controls = new PointerLockControls(camera, domElement);

    this.velocity = new THREE.Vector3();
    this.position = new THREE.Vector3(0, 40, 0);

    this.keys = {
      forward: false,
      back: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
    };

    // Analog movement input from an on-screen joystick (touch devices).
    // x: -1 (left) .. 1 (right), y: -1 (back) .. 1 (forward).
    this.touchAxis = { x: 0, y: 0 };
    // True once a touch player has tapped the start overlay. Desktop uses
    // controls.isLocked instead, since there's no pointer lock on touch.
    this.touchActive = false;

    this.onGround = false;

    this._bindKeys();
  }

  _bindKeys() {
    const keyMap = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'back',
      ArrowDown: 'back',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      Space: 'jump',
      ShiftLeft: 'sprint',
      ShiftRight: 'sprint',
    };

    window.addEventListener('keydown', (e) => {
      const action = keyMap[e.code];
      if (action) this.keys[action] = true;
    });

    window.addEventListener('keyup', (e) => {
      const action = keyMap[e.code];
      if (action) this.keys[action] = false;
    });
  }

  spawnAt(x, z) {
    const surfaceY = this.world.getSurfaceHeight(Math.floor(x), Math.floor(z));
    this.position.set(x, surfaceY + EYE_HEIGHT + 0.5, z);
    this.velocity.set(0, 0, 0);
  }

  // Kept for callers that just want the camera to add to the scene. Avoid
  // calling this every frame — PointerLockControls.getObject() is
  // deprecated and logs a console warning on every call.
  getObject() {
    return this.camera;
  }

  lock() {
    this.controls.lock();
  }

  isLocked() {
    return this.controls.isLocked;
  }

  /** True while the player should move/look/interact: mouse pointer-lock on
   * desktop, or a tapped "play" overlay on touch devices. */
  isActive() {
    return this.controls.isLocked || this.touchActive;
  }

  activateTouch() {
    this.touchActive = true;
  }

  deactivateTouch() {
    this.touchActive = false;
  }

  setTouchAxis(x, y) {
    this.touchAxis.x = x;
    this.touchAxis.y = y;
  }

  /** Rotates the camera the same way PointerLockControls does for mouse
   * movement, so a touch drag feels identical. Used for touch look since
   * the real Pointer Lock API doesn't apply to touch input. */
  lookDelta(movementX, movementY) {
    _euler.setFromQuaternion(this.camera.quaternion);
    _euler.y -= movementX * LOOK_SENSITIVITY;
    _euler.x -= movementY * LOOK_SENSITIVITY;
    const maxPitch = Math.PI / 2 - 0.01;
    _euler.x = Math.max(-maxPitch, Math.min(maxPitch, _euler.x));
    this.camera.quaternion.setFromEuler(_euler);
  }

  // Checks whether an axis-aligned box centered at (x, z) spanning
  // [feetY, feetY + PLAYER_HEIGHT] overlaps any solid voxel.
  _collides(x, feetY, z) {
    const half = PLAYER_WIDTH / 2;
    const minX = Math.floor(x - half);
    const maxX = Math.floor(x + half);
    const minZ = Math.floor(z - half);
    const maxZ = Math.floor(z + half);
    const minY = Math.floor(feetY);
    const maxY = Math.floor(feetY + PLAYER_HEIGHT - 0.01);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          if (isSolid(this.world.getBlock(bx, by, bz))) return true;
        }
      }
    }
    return false;
  }

  update(dt) {
    const speed = this.keys.sprint ? SPRINT_SPEED : WALK_SPEED;

    // Build a movement direction from input, relative to where the camera
    // is facing (flattened onto the XZ plane so looking up/down doesn't
    // change ground speed).
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();

    const move = new THREE.Vector3();
    if (this.keys.forward) move.add(forward);
    if (this.keys.back) move.sub(forward);
    if (this.keys.right) move.add(right);
    if (this.keys.left) move.sub(right);

    // Analog joystick input (touch). Added rather than replacing keyboard
    // input so the same code path works if both happen to be active.
    if (this.touchAxis.x !== 0 || this.touchAxis.y !== 0) {
      move.addScaledVector(forward, this.touchAxis.y);
      move.addScaledVector(right, this.touchAxis.x);
    }

    if (move.lengthSq() > 1) move.normalize();
    move.multiplyScalar(speed);

    this.velocity.x = move.x;
    this.velocity.z = move.z;

    // Gravity
    this.velocity.y += GRAVITY * dt;
    if (this.velocity.y < -40) this.velocity.y = -40;

    if (this.keys.jump && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    const feetY = this.position.y - EYE_HEIGHT;

    // Resolve collisions per-axis so sliding along walls/ground works.
    let newFeetY = feetY + this.velocity.y * dt;
    if (this.velocity.y <= 0) {
      if (this._collides(this.position.x, newFeetY, this.position.z)) {
        newFeetY = Math.ceil(newFeetY);
        this.velocity.y = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
    } else if (this._collides(this.position.x, newFeetY + PLAYER_HEIGHT, this.position.z)) {
      this.velocity.y = 0;
      newFeetY = feetY;
    }

    let newX = this.position.x + this.velocity.x * dt;
    if (this._collides(newX, newFeetY, this.position.z)) newX = this.position.x;

    let newZ = this.position.z + this.velocity.z * dt;
    if (this._collides(newX, newFeetY, newZ)) newZ = this.position.z;

    this.position.set(newX, newFeetY + EYE_HEIGHT, newZ);
    this.camera.position.copy(this.position);
  }
}
