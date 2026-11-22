// Midnight Vault — the thief: movement, tools, and the smoke cloud.
// Keyboard (WASD / arrows) or click-to-move. Walls slide, the vent crawl is
// slow, and standing still at the vault is what cracks it.

import { PLAYER, TOOLS, ENTRY } from './config.js';
import { resolveCircle, clampToRoom, inVent } from './world.js';

export class Thief {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = ENTRY.x;
    this.y = ENTRY.y;
    this.radius = PLAYER.radius;
    this.smokeLeft = TOOLS.smoke.count;
    this.empLeft = TOOLS.emp.count;
    this.smokeTimer = 0;
    this.moving = false;
    this.target = null; // click-to-move destination
    this.faceAngle = -Math.PI / 2;
  }

  get hidden() {
    return this.smokeTimer > 0;
  }

  get speed() {
    return inVent(this.x, this.y) ? PLAYER.speed * PLAYER.ventSpeed : PLAYER.speed;
  }

  useSmoke() {
    if (this.smokeLeft <= 0 || this.smokeTimer > 0) return false;
    this.smokeLeft -= 1;
    this.smokeTimer = TOOLS.smoke.duration;
    return true;
  }

  useEmp() {
    if (this.empLeft <= 0) return false;
    this.empLeft -= 1;
    return true;
  }

  update(dt, input) {
    if (this.smokeTimer > 0) this.smokeTimer -= dt;

    let mx = 0;
    let my = 0;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.up) my -= 1;
    if (input.down) my += 1;

    if (mx !== 0 || my !== 0) {
      this.target = null;
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
    } else if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < 8) {
        this.target = null;
      } else {
        mx = dx / d;
        my = dy / d;
      }
    }

    this.moving = mx !== 0 || my !== 0;
    if (this.moving) {
      this.faceAngle = Math.atan2(my, mx);
      const s = this.speed * dt;
      // Move axis by axis so walls slide instead of sticking.
      let r = resolveCircle(this.x + mx * s, this.y, this.radius);
      this.x = r.x;
      r = resolveCircle(this.x, this.y + my * s, this.radius);
      this.y = r.y;
      const c = clampToRoom(this.x, this.y, this.radius);
      this.x = c.x;
      this.y = c.y;
    }
  }
}
