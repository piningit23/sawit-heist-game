// Midnight Vault — guards: patrols, vision cones, suspicion and the chase.
// A guard walks its waypoint loop, pauses at each stop to look around, and
// turns toward the thief when the alarm climbs. Its cone only counts when
// the thief is inside the angle, inside the range, and in line of sight.

import { CONE, GUARD_DEFS, PLAYER } from './config.js';
import { lineBlocked, resolveCircle } from './world.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.color = def.color;
    this.waypoints = def.waypoints;
    this.baseSpeed = def.speed;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.wp = 1;
    this.pause = 0;
    this.facing = 0;
    this.state = 'patrol'; // patrol | suspicious | hunt
    this.lastSeenX = this.x;
    this.lastSeenY = this.y;
    this.seesPlayer = false;
  }

  // Cone test: angle, range, then a wall ray-cast.
  canSee(px, py) {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > CONE.guardRange) return false;
    if (Math.abs(angleDiff(Math.atan2(dy, dx), this.facing)) > CONE.guardHalfAngle) return false;
    return !lineBlocked(this.x, this.y, px, py);
  }

  update(dt, player, alarmLevel) {
    const speedMul = this.state === 'hunt' ? 1.65 : this.state === 'suspicious' ? 1.3 : 1;
    const speed = this.baseSpeed * speedMul;

    if (this.state === 'hunt') {
      // Run at the thief's last known spot; give up and resume patrol there.
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 8) {
        this.facing = Math.atan2(dy, dx);
        const step = (speed * dt) / d;
        const nx = this.x + dx * step;
        const ny = this.y + dy * step;
        const r = resolveCircle(nx, ny, 14);
        this.x = r.x;
        this.y = r.y;
      }
      return;
    }

    if (this.pause > 0) {
      this.pause -= dt;
      // Look around while waiting at a waypoint.
      this.facing += dt * 0.9;
      return;
    }

    const target = this.waypoints[this.wp];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.pause = 0.7;
      return;
    }
    this.facing = Math.atan2(dy, dx);
    const step = (speed * dt) / d;
    const nx = this.x + dx * step;
    const ny = this.y + dy * step;
    const r = resolveCircle(nx, ny, 14);
    this.x = r.x;
    this.y = r.y;
  }

  // Called by the game each frame with the current alarm level.
  setAlert(level) {
    this.state = level;
  }

  touchesPlayer(player) {
    return Math.hypot(player.x - this.x, player.y - this.y) < PLAYER.catchDistance;
  }
}

export function makeGuards() {
  return GUARD_DEFS.map((d) => new Guard(d));
}
