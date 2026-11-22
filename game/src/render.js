// Midnight Vault — render: everything drawn on one canvas.
// Vision cones are ray-cast so walls cut them: each cone is a fan of short
// rays that stop at the first wall they hit. Safe cover, danger and loot are
// colour-coded at a glance: gold is loot, green is the exit, yellow/red is
// a cone, grey-blue is cover.

import { VIEW_W, VIEW_H, WALLS, WALL, EXIT, VAULT, GEMS, ALARM, TOOLS } from './config.js';
import { pointInRect } from './world.js';

function castRay(x, y, angle, maxDist) {
  const step = 7;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    const px = x + dx * d;
    const py = y + dy * d;
    if (px < 0 || px > VIEW_W || py < 0 || py > VIEW_H) return d;
    for (const w of WALLS) {
      if (pointInRect(px, py, w)) return d;
    }
  }
  return maxDist;
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  const rays = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = castRay(x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawFloor(ctx);
    this.drawRoom(ctx, game);
    if (game.state === 'playing' || game.state === 'won' || game.state === 'caught') {
      this.drawCones(ctx, game);
      this.drawLoot(ctx, game);
      this.drawExit(ctx, game);
      this.drawActors(ctx, game);
      this.drawHud(ctx, game);
    }
    if (game.state === 'title') this.drawTitle(ctx, game);
    if (game.state === 'won') this.drawWin(ctx, game);
    if (game.state === 'caught') this.drawCaught(ctx, game);
  }

  drawFloor(ctx) {
    ctx.fillStyle = '#171a26';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Checkerboard marble tiles.
    const t = 64;
    for (let y = 0; y < VIEW_H / t; y++) {
      for (let x = 0; x < VIEW_W / t; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = '#1b1f2e';
          ctx.fillRect(x * t, y * t, t, t);
        }
      }
    }
    // Crimson carpet runner down the hall.
    ctx.fillStyle = '#3d1620';
    ctx.fillRect(120, 300, 1000, 120);
    ctx.strokeStyle = '#6b2a35';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 300, 1000, 120);
    // Vent shaft shading along the top.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(WALL, WALL, VIEW_W - 2 * WALL, 76);
    ctx.fillStyle = '#8a93a8';
    ctx.font = '11px monospace';
    ctx.fillText('VENT SHAFT — SLOW, BUT OUT OF SIGHT', 40, 62);
  }

  drawRoom(ctx, game) {
    for (const w of WALLS) {
      ctx.fillStyle = '#2c3247';
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    }
    // Vent grates at the two ends of the shaft.
    ctx.fillStyle = '#5a6278';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(36 + i * 22, 102, 12, 20);
      ctx.fillRect(868 + i * 22, 102, 12, 20);
    }
    // Vault door frame.
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(VAULT.x - 48, 26, 96, 10);
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('VAULT', VAULT.x - 22, 62);
  }

  drawCones(ctx, game) {
    for (const g of game.guards) {
      const hot = g.seesPlayer;
      drawCone(ctx, g.x, g.y, g.facing, 0.56, 260, hot ? 'rgba(255,60,50,0.30)' : 'rgba(255,205,60,0.20)');
    }
    for (const c of game.cameras) {
      if (c.frozen > 0) continue;
      drawCone(ctx, c.x, c.y, c.angle, 0.44, c.range, c.seesPlayer ? 'rgba(255,60,50,0.28)' : 'rgba(255,80,80,0.16)');
    }
  }

  drawLoot(ctx, game) {
    // Vault: gold circle, opens when cracked.
    ctx.beginPath();
    ctx.arc(VAULT.x, VAULT.y, VAULT.r, 0, Math.PI * 2);
    ctx.fillStyle = game.vaultCracked ? '#3d2f10' : '#c9a227';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = game.vaultCracked ? '#e8c85a' : '#f5d76e';
    ctx.stroke();
    ctx.fillStyle = game.vaultCracked ? '#e8c85a' : '#171a26';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(game.vaultCracked ? 'OPEN' : '$', VAULT.x, VAULT.y + 7);
    ctx.textAlign = 'left';
    // Lockpick progress ring while cracking.
    if (game.vaultProgress > 0 && !game.vaultCracked) {
      ctx.beginPath();
      ctx.arc(VAULT.x, VAULT.y, VAULT.r + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * game.vaultProgress);
      ctx.strokeStyle = '#7ee2a8';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#7ee2a8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PICKING…', VAULT.x, VAULT.y + VAULT.r + 26);
      ctx.textAlign = 'left';
    }
    // Gems.
    for (const gem of game.gems) {
      if (gem.taken) continue;
      ctx.save();
      ctx.translate(gem.x, gem.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#5ad1e6';
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = '#bff3ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.restore();
      ctx.fillStyle = '#bff3ff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gem.name.toUpperCase(), gem.x, gem.y + 26);
      ctx.textAlign = 'left';
    }
  }

  drawExit(ctx, game) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(EXIT.x, EXIT.y, EXIT.r, 0, Math.PI * 2);
    ctx.fillStyle = game.vaultCracked ? 'rgba(46,160,90,0.35)' : 'rgba(46,160,90,0.14)';
    ctx.fill();
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2ea05a';
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#7ee2a8';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GETAWAY', EXIT.x, EXIT.y - 6);
    ctx.fillText(game.vaultCracked ? 'GO!' : 'LOCKED', EXIT.x, EXIT.y + 12);
    ctx.textAlign = 'left';
  }

  drawActors(ctx, game) {
    // Cameras: wall mounts with a lens that follows the sweep.
    for (const c of game.cameras) {
      ctx.fillStyle = c.frozen > 0 ? '#5a6278' : '#d94f4f';
      ctx.fillRect(c.x - 9, c.y - 9, 18, 18);
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      if (c.frozen > 0) {
        ctx.fillStyle = '#bff3ff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EMP ' + Math.ceil(c.frozen) + 's', c.x, c.y - 16);
        ctx.textAlign = 'left';
      }
    }
    // Guards: uniformed circles with a facing tick and a name tag.
    for (const g of game.guards) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = g.state === 'hunt' ? '#c0392b' : '#2c4a6e';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = g.color;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#dfe6f2';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(g.name.toUpperCase(), g.x, g.y - 22);
      ctx.textAlign = 'left';
    }
    // Smoke cloud hides the thief.
    const p = game.player;
    if (p.hidden) {
      ctx.fillStyle = 'rgba(180,190,205,0.45)';
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * 34, p.y + Math.sin(a) * 34, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // The thief: black coat, red scarf, facing tick.
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0d0f14';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e63946';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.faceAngle) * 20, p.y + Math.sin(p.faceAngle) * 20);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', p.x, p.y - 22);
    ctx.textAlign = 'left';
    // Click-to-move marker.
    if (p.target) {
      ctx.beginPath();
      ctx.arc(p.target.x, p.target.y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#7ee2a8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawHud(ctx, game) {
    const barH = 44;
    ctx.fillStyle = 'rgba(10,12,20,0.92)';
    ctx.fillRect(0, VIEW_H - barH, VIEW_W, barH);
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('LOOT $' + game.loot, 16, VIEW_H - 15);
    // Alarm meter.
    const ax = 220;
    const aw = 300;
    ctx.fillStyle = '#222';
    ctx.fillRect(ax, VIEW_H - 30, aw, 16);
    const frac = game.alarm / 100;
    ctx.fillStyle = game.alarm >= 60 ? '#e63946' : game.alarm >= 30 ? '#e8b13c' : '#2ea05a';
    ctx.fillRect(ax, VIEW_H - 30, aw * frac, 16);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax, VIEW_H - 30, aw, 16);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ALARM ' + game.alarmLabel + ' ' + Math.floor(game.alarm) + '%', ax + aw + 12, VIEW_H - 15);
    // Timer and objective.
    ctx.fillStyle = '#dfe6f2';
    ctx.fillText('TIME ' + game.timeText, 760, VIEW_H - 15);
    ctx.fillText(game.objective, 900, VIEW_H - 15);
    // Tools.
    ctx.fillStyle = '#bff3ff';
    ctx.font = '12px monospace';
    ctx.fillText('[Q] SMOKE x' + game.player.smokeLeft + '   [E] EMP x' + game.player.empLeft, 16, VIEW_H - 34 + 44 - 44);
  }

  drawTitle(ctx, game) {
    ctx.fillStyle = 'rgba(8,10,18,0.78)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MIDNIGHT VAULT', VIEW_W / 2, 220);
    ctx.fillStyle = '#dfe6f2';
    ctx.font = '20px monospace';
    ctx.fillText('One thief. Three guards. Two cameras. One vault.', VIEW_W / 2, 268);
    ctx.font = '16px monospace';
    ctx.fillText('Cross the hall, crack the vault, reach the GETAWAY door.', VIEW_W / 2, 300);
    ctx.fillText('Stay out of the yellow cones. Smoke [Q] hides you, EMP [E] freezes cameras.', VIEW_W / 2, 330);
    ctx.fillText('Move: WASD / arrows or click. Pick the lock by standing at the vault.', VIEW_W / 2, 360);
    ctx.fillStyle = '#7ee2a8';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('PRESS ENTER TO START', VIEW_W / 2, 440);
    ctx.fillStyle = '#8a93a8';
    ctx.font = '13px monospace';
    ctx.fillText('A quiet job for the crew: Wren slips in, the vault pays out, nobody gets hurt.', VIEW_W / 2, 500);
    ctx.textAlign = 'left';
  }

  drawWin(ctx, game) {
    ctx.fillStyle = 'rgba(8,18,12,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#7ee2a8';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', VIEW_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.fillText('Wren walks out with $' + game.loot + ' and the crew never knew she was there.', VIEW_W / 2, 350);
    ctx.fillText('SCORE ' + game.score + '   —   TIME ' + game.timeText, VIEW_W / 2, 390);
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRESS R TO RUN IT AGAIN', VIEW_W / 2, 450);
    ctx.textAlign = 'left';
  }

  drawCaught(ctx, game) {
    ctx.fillStyle = 'rgba(24,8,10,0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED!', VIEW_W / 2, 300);
    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.fillText(game.caughtReason, VIEW_W / 2, 350);
    ctx.fillText('LOOT KEPT $' + game.loot + '   —   TIME ' + game.timeText, VIEW_W / 2, 390);
    ctx.fillStyle = '#e8c85a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRESS R TO TRY AGAIN', VIEW_W / 2, 450);
    ctx.textAlign = 'left';
  }
}
