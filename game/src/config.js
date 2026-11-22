// Midnight Vault — configuration: room size, walls, patrols, loot, tools.
// Every number here is original to this game; the room is one fixed floor
// the thief crosses, with two routes: the open hall and the vent crawl.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const WALL = 24;

// Walls as {x, y, w, h}. The outer shell plus interior partitions that force
// route choices. Gaps between walls are the doors and vent grates.
export const WALLS = [
  // Outer shell
  { x: 0, y: 0, w: 1280, h: WALL },
  { x: 0, y: 776, w: 1280, h: WALL },
  { x: 0, y: 0, w: WALL, h: 800 },
  { x: 1256, y: 0, w: WALL, h: 800 },
  // Vent divider: the crawl space along the top (y 24..100). Gaps at the
  // west vent grate (x 24..160) and the east opening into the vault antechamber.
  { x: 160, y: 100, w: 700, h: WALL },
  // Mid vertical partition: leaves a top gap (y 124..300) and a bottom
  // corridor (y 560..776 is open below its end at y 560).
  { x: 560, y: 300, w: WALL, h: 260 },
  // Lower horizontal partition: blocks the middle, leaves the east corridor open.
  { x: 584, y: 420, w: 416, h: WALL },
  // Vault antechamber wall: the vault sits behind it, entered from below.
  { x: 980, y: 124, w: WALL, h: 196 },
];

export const ENTRY = { x: 90, y: 700 }; // where the thief slips in
export const EXIT = { x: 1180, y: 700, r: 46 }; // getaway door, bottom-right
export const VAULT = { x: 1150, y: 78, r: 34 }; // loot target, top-right
export const VAULT_CRACK_TIME = 3; // seconds standing at the vault

export const GEMS = [
  { x: 330, y: 210, name: 'Sapphire' },
  { x: 760, y: 560, name: 'Emerald' },
  { x: 950, y: 690, name: 'Ruby' },
];

export const GUARD_DEFS = [
  {
    name: 'Rook',
    color: '#e8b13c',
    waypoints: [
      { x: 300, y: 250 },
      { x: 500, y: 250 },
      { x: 500, y: 620 },
      { x: 300, y: 620 },
    ],
    speed: 72,
  },
  {
    name: 'Bishop',
    color: '#d97b2f',
    waypoints: [
      { x: 1080, y: 200 },
      { x: 1180, y: 350 },
      { x: 1080, y: 650 },
      { x: 1180, y: 650 },
    ],
    speed: 66,
  },
  {
    name: 'Knight',
    color: '#c94f4f',
    waypoints: [
      { x: 150, y: 700 },
      { x: 500, y: 700 },
      { x: 500, y: 500 },
      { x: 150, y: 500 },
    ],
    speed: 78,
  },
];

export const CAMERA_DEFS = [
  // Wall-mounted, sweeps down-left across the hall.
  { x: 640, y: 26, baseAngle: Math.PI / 2, sweep: 0.9, period: 5.0, range: 330 },
  // Right wall, sweeps across the east corridor and exit approach.
  { x: 1254, y: 400, baseAngle: Math.PI, sweep: 0.7, period: 6.5, range: 320 },
];

export const CONE = {
  guardRange: 260,
  guardHalfAngle: 0.56, // ~32 degrees each side
  cameraRange: 320,
  cameraHalfAngle: 0.44,
};

export const ALARM = {
  guardRise: 40, // per second while a guard sees the thief
  cameraRise: 30, // per second while a camera sees the thief
  fall: 11, // per second while hidden
  suspiciousAt: 30,
  huntAt: 60,
  caughtAt: 100,
};

export const TOOLS = {
  smoke: { count: 2, duration: 4, cost: 50, radius: 95 },
  emp: { count: 1, duration: 6, cost: 100 },
};

export const SCORES = {
  gem: 150,
  vault: 1000,
  timeBonusPerSecond: 4, // bonus for finishing fast, capped
  maxTimeBonus: 600,
};

export const PLAYER = {
  radius: 15,
  speed: 205,
  ventSpeed: 0.55, // crawling through the vent shaft is slow
  catchDistance: 26, // a guard this close catches the thief
};
