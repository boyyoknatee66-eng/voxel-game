// On-screen controls for touch devices (phones/tablets, including iPad,
// which has no mouse or keyboard): a virtual joystick for movement, a
// full-screen drag area for looking around, and buttons for jump/break/
// place. Desktop keeps using the mouse + keyboard in player.js untouched.

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

const JOYSTICK_RADIUS = 55; // px the knob can travel from center before clamping

export class TouchControls {
  constructor(player, interaction) {
    this.player = player;
    this.interaction = interaction;

    this.joystick = document.getElementById('joystick');
    this.knob = document.getElementById('joystick-knob');
    this.lookLayer = document.getElementById('look-layer');
    this.btnJump = document.getElementById('btn-jump');
    this.btnPlace = document.getElementById('btn-place');
    this.btnBreak = document.getElementById('btn-break');

    this.joystickTouchId = null;
    this.joystickCenter = { x: 0, y: 0 };

    this.lookTouchId = null;
    this.lookLast = { x: 0, y: 0 };

    this._bindJoystick();
    this._bindLook();
    this._bindButtons();
  }

  _bindJoystick() {
    const updateKnob = (clientX, clientY) => {
      let dx = clientX - this.joystickCenter.x;
      let dy = clientY - this.joystickCenter.y;
      const dist = Math.hypot(dx, dy);
      if (dist > JOYSTICK_RADIUS) {
        dx = (dx / dist) * JOYSTICK_RADIUS;
        dy = (dy / dist) * JOYSTICK_RADIUS;
      }
      this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
      // Dragging the knob down on screen (positive dy) should move the
      // player backward, so the forward axis is inverted.
      this.player.setTouchAxis(dx / JOYSTICK_RADIUS, -dy / JOYSTICK_RADIUS);
    };

    const resetKnob = () => {
      this.knob.style.transform = 'translate(0px, 0px)';
      this.player.setTouchAxis(0, 0);
    };

    this.joystick.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.joystickTouchId = touch.identifier;
        const rect = this.joystick.getBoundingClientRect();
        this.joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        updateKnob(touch.clientX, touch.clientY);
      },
      { passive: false },
    );

    this.joystick.addEventListener(
      'touchmove',
      (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.joystickTouchId) {
            e.preventDefault();
            updateKnob(touch.clientX, touch.clientY);
          }
        }
      },
      { passive: false },
    );

    const end = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.joystickTouchId) {
          this.joystickTouchId = null;
          resetKnob();
        }
      }
    };
    this.joystick.addEventListener('touchend', end, { passive: false });
    this.joystick.addEventListener('touchcancel', end, { passive: false });
  }

  _bindLook() {
    this.lookLayer.addEventListener(
      'touchstart',
      (e) => {
        if (this.lookTouchId !== null) return;
        const touch = e.changedTouches[0];
        this.lookTouchId = touch.identifier;
        this.lookLast.x = touch.clientX;
        this.lookLast.y = touch.clientY;
      },
      { passive: true },
    );

    this.lookLayer.addEventListener(
      'touchmove',
      (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.lookTouchId) {
            e.preventDefault();
            const dx = touch.clientX - this.lookLast.x;
            const dy = touch.clientY - this.lookLast.y;
            this.lookLast.x = touch.clientX;
            this.lookLast.y = touch.clientY;
            this.player.lookDelta(dx, dy);
          }
        }
      },
      { passive: false },
    );

    const end = (e) => {
      for (const touch of e.changedTouches) {
        if (touch.identifier === this.lookTouchId) this.lookTouchId = null;
      }
    };
    this.lookLayer.addEventListener('touchend', end, { passive: true });
    this.lookLayer.addEventListener('touchcancel', end, { passive: true });
  }

  _bindButtons() {
    const bind = (el, onDown, onUp) => {
      el.addEventListener(
        'touchstart',
        (e) => {
          e.preventDefault();
          onDown();
        },
        { passive: false },
      );
      if (onUp) {
        const release = (e) => {
          e.preventDefault();
          onUp();
        };
        el.addEventListener('touchend', release, { passive: false });
        el.addEventListener('touchcancel', release, { passive: false });
      }
    };

    bind(
      this.btnJump,
      () => {
        this.player.keys.jump = true;
      },
      () => {
        this.player.keys.jump = false;
      },
    );
    bind(this.btnBreak, () => this.interaction.breakBlock());
    bind(this.btnPlace, () => this.interaction.placeBlock());
  }
}
