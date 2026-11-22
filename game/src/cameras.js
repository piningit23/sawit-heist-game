// Midnight Vault — security cameras: wall-mounted, sweeping cones.
// A camera sweeps back and forth on a fixed pivot. An EMP freezes it in
// place for a few seconds; while frozen it cannot raise the alarm.

import { CONE, CAMERA_DEFS } from './config.js';
import { lineBlocked } from './world.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.period = def.period;
    this.range = def.range;
    this.phase = Math.random() * Math.PI * 2;
    this.angle = def.baseAngle;
    this.frozen = 0;
    this.seesPlayer = false;
  }

  update(dt, time) {
    if (this.frozen > 0) {
      this.frozen -= dt;
      return;
    }
    this.angle = this.baseAngle + Math.sin((time / this.period) * Math.PI * 2 + this.phase) * this.sweep;
  }

  canSee(px, py) {
    if (this.frozen > 0) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.range) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), this.angle)) > CONE.cameraHalfAngle) return false;
    return !lineBlocked(this.x, this.y, px, py);
  }

  freeze(seconds) {
    this.frozen = seconds;
  }
}

export function makeCameras() {
  return CAMERA_DEFS.map((d) => new Camera(d));
}
