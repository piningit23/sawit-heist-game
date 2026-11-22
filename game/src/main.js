// Midnight Vault — game loop and rules: alarm levels, vault cracking,
// tools, win and caught. One thief ("Wren") crosses the hall, cracks the
// vault, and slips out the getaway door before the alarm hits 100.

import { VIEW_W, VIEW_H, EXIT, VAULT, VAULT_CRACK_TIME, ALARM, SCORES, TOOLS, GEMS } from './config.js';
import { makeGuards } from './guards.js';
import { makeCameras } from './cameras.js';
import { Thief } from './player.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { AudioSys } from './audio.js';
import { applyScene } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.input = new Input(canvas);
    this.renderer = new Renderer(canvas);
    this.audio = new AudioSys();
    this.state = 'title';
    this.still = false;
    this.time = 0;
    this.alarm = 0;
    this.loot = 0;
    this.score = 0;
    this.toolCost = 0;
    this.vaultProgress = 0;
    this.vaultCracked = false;
    this.caughtReason = '';
    this.player = new Thief();
    this.guards = makeGuards();
    this.cameras = makeCameras();
    this.gems = GEMS.map((g) => ({ ...g, taken: false }));
    this.lastTime = 0;
    this.stepSound = 0;
  }

  get alarmLabel() {
    if (this.alarm >= ALARM.huntAt) return 'HUNT';
    if (this.alarm >= ALARM.suspiciousAt) return 'SUSPICIOUS';
    return 'CALM';
  }

  get objective() {
    return this.vaultCracked ? 'Reach the GETAWAY door!' : 'Crack the vault — then run!';
  }

  get timeText() {
    const m = Math.floor(this.time / 60);
    const s = Math.floor(this.time % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  reset() {
    this.time = 0;
    this.alarm = 0;
    this.loot = 0;
    this.score = 0;
    this.toolCost = 0;
    this.vaultProgress = 0;
    this.vaultCracked = false;
    this.caughtReason = '';
    this.player.reset();
    this.guards = makeGuards();
    this.cameras = makeCameras();
    this.gems = GEMS.map((g) => ({ ...g, taken: false }));
  }

  start() {
    this.reset();
    this.state = 'playing';
    this.audio.ensure();
  }

  update(dt) {
    if (this.state === 'title') {
      if (this.input.pressed('enter') || this.input.pressed(' ')) this.start();
      return;
    }
    if (this.state === 'won' || this.state === 'caught') {
      if (this.input.pressed('r')) this.start();
      return;
    }

    this.time += dt;
    const click = this.input.takeClick();
    if (click) this.player.target = click;

    // Tools.
    if (this.input.pressed('q')) {
      if (this.player.useSmoke()) {
        this.toolCost += TOOLS.smoke.cost;
        this.audio.smokePuff();
      }
    }
    if (this.input.pressed('e')) {
      if (this.player.useEmp()) {
        this.toolCost += TOOLS.emp.cost;
        for (const c of this.cameras) c.freeze(TOOLS.emp.duration);
        this.audio.empZap();
      }
    }

    this.player.update(dt, this.input);
    if (this.player.moving) {
      this.stepSound -= dt;
      if (this.stepSound <= 0) {
        this.stepSound = 0.32;
        this.audio.step();
      }
    }

    // Cameras sweep; guards patrol, or hunt when the alarm is high.
    const level = this.alarm >= ALARM.huntAt ? 'hunt' : this.alarm >= ALARM.suspiciousAt ? 'suspicious' : 'patrol';
    for (const c of this.cameras) c.update(dt, this.time);
    for (const g of this.guards) {
      g.setAlert(level);
      g.update(dt, this.player, level);
    }

    // Detection: anyone with a clear cone on the thief raises the alarm.
    const hidden = this.player.hidden;
    let seenByGuard = false;
    let seenByCamera = false;
    if (!hidden) {
      for (const g of this.guards) {
        g.seesPlayer = g.canSee(this.player.x, this.player.y);
        if (g.seesPlayer) seenByGuard = true;
      }
      for (const c of this.cameras) {
        c.seesPlayer = c.canSee(this.player.x, this.player.y);
        if (c.seesPlayer) seenByCamera = true;
      }
    } else {
      for (const g of this.guards) g.seesPlayer = false;
      for (const c of this.cameras) c.seesPlayer = false;
    }
    if (seenByGuard) this.alarm += ALARM.guardRise * dt;
    if (seenByCamera) this.alarm += ALARM.cameraRise * dt;
    if (!seenByGuard && !seenByCamera) this.alarm = Math.max(0, this.alarm - ALARM.fall * dt);
    this.audio.alarmBlip(dt, this.alarm);

    // Gems: optional loot on the way.
    for (const gem of this.gems) {
      if (!gem.taken && Math.hypot(this.player.x - gem.x, this.player.y - gem.y) < 30) {
        gem.taken = true;
        this.loot += SCORES.gem;
        this.audio.pickup();
      }
    }

    // Vault: stand close and the lockpick works; moving away stalls it.
    const vaultDist = Math.hypot(this.player.x - VAULT.x, this.player.y - VAULT.y);
    if (!this.vaultCracked && vaultDist < VAULT.r + 46) {
      this.vaultProgress += dt / VAULT_CRACK_TIME;
      if (Math.floor(this.vaultProgress * 10) !== Math.floor((this.vaultProgress - dt / VAULT_CRACK_TIME) * 10)) {
        this.audio.vaultTick();
      }
      if (this.vaultProgress >= 1) {
        this.vaultCracked = true;
        this.loot += SCORES.vault;
        this.audio.vaultOpen();
      }
    } else if (!this.vaultCracked) {
      this.vaultProgress = Math.max(0, this.vaultProgress - dt * 0.4);
    }

    // Caught: alarm maxed, or a guard grabs the thief.
    for (const g of this.guards) {
      if (g.touchesPlayer(this.player)) {
        this.caught('Grabbed by ' + g.name + ' — the crew knows your face now.');
        return;
      }
    }
    if (this.alarm >= ALARM.caughtAt) {
      this.caught('The alarm hit 100% — the hall locked down around you.');
      return;
    }

    // Getaway: vault cracked and the thief reaches the exit.
    if (this.vaultCracked && Math.hypot(this.player.x - EXIT.x, this.player.y - EXIT.y) < EXIT.r) {
      this.win();
    }
  }

  win() {
    this.state = 'won';
    const timeBonus = Math.max(0, SCORES.maxTimeBonus - Math.floor(this.time) * SCORES.timeBonusPerSecond);
    this.score = this.loot + timeBonus - this.toolCost;
    this.audio.winFanfare();
  }

  caught(reason) {
    this.state = 'caught';
    this.caughtReason = reason;
    this.alarm = 100;
    this.audio.caughtSting();
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000 || 0);
    this.lastTime = now;
    if (!this.still) this.update(dt);
    this.renderer.draw(this);
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  run() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('scene')) {
      applyScene(this, window.location.search);
    }
    requestAnimationFrame((t) => {
      this.lastTime = t;
      this.frame(t);
    });
  }
}

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const game = new Game(canvas);
// Exposed for local play-testing and screenshots only.
window.__midnightVault = game;
game.run();
