// Midnight Vault — world geometry: walls, collision, line of sight.
// Vision cones are cut by walls: a guard or camera only sees the thief when
// the straight segment between them clears every wall rectangle.

import { WALLS, WALL, VIEW_W, VIEW_H } from './config.js';

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Push a circle out of every wall it overlaps. Returns true if it touched one.
export function resolveCircle(px, py, radius) {
  let hit = false;
  for (const w of WALLS) {
    const cx = Math.max(w.x, Math.min(px, w.x + w.w));
    const cy = Math.max(w.y, Math.min(py, w.y + w.h));
    const dx = px - cx;
    const dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      hit = true;
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        px = cx + (dx / d) * radius;
        py = cy + (dy / d) * radius;
      } else {
        // Centre inside the wall: push out along the smallest penetration.
        const left = px - w.x;
        const right = w.x + w.w - px;
        const top = py - w.y;
        const bottom = w.y + w.h - py;
        const m = Math.min(left, right, top, bottom);
        if (m === left) px = w.x - radius;
        else if (m === right) px = w.x + w.w + radius;
        else if (m === top) py = w.y - radius;
        else py = w.y + w.h + radius;
      }
    }
  }
  return { x: px, y: py, hit };
}

function orient(ax, ay, bx, by, cx, cy) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  return ((o1 > 0) !== (o2 > 0) || o1 === 0 || o2 === 0) &&
    ((o3 > 0) !== (o4 > 0) || o3 === 0 || o4 === 0);
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const rx = r.x;
  const ry = r.y;
  const rx2 = r.x + r.w;
  const ry2 = r.y + r.h;
  return (
    segmentsCross(x1, y1, x2, y2, rx, ry, rx2, ry) ||
    segmentsCross(x1, y1, x2, y2, rx2, ry, rx2, ry2) ||
    segmentsCross(x1, y1, x2, y2, rx2, ry2, rx, ry2) ||
    segmentsCross(x1, y1, x2, y2, rx, ry2, rx, ry)
  );
}

// True when any wall blocks the straight line from (x1,y1) to (x2,y2).
export function lineBlocked(x1, y1, x2, y2) {
  for (const w of WALLS) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return true;
  }
  return false;
}

// The vent crawl: the narrow shaft along the top of the room. Moving here is
// slow, but the divider wall hides the thief from the hall below.
export function inVent(x, y) {
  return y > WALL && y < 100 && x > WALL && x < 1256;
}

export function clampToRoom(x, y, radius) {
  return {
    x: Math.max(WALL + radius, Math.min(VIEW_W - WALL - radius, x)),
    y: Math.max(WALL + radius, Math.min(VIEW_H - WALL - radius, y)),
  };
}
