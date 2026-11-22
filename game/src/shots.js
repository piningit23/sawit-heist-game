// Midnight Vault — screenshot staging: URL scenes for the maker's shots.
// ?scene=start | play | alert | win, plus &still=1 to freeze time so a shot
// is deterministic. These only rearrange the game's own state; the game
// renders exactly what it would render during real play.

import { VIEW_W, VIEW_H } from './config.js';

export function applyScene(game, search) {
  const params = new URLSearchParams(search);
  const scene = params.get('scene') || 'play';
  game.still = params.has('still');

  if (scene === 'start') {
    game.state = 'title';
    return;
  }

  if (scene === 'win') {
    game.state = 'playing';
    game.vaultCracked = true;
    game.loot = 1450;
    game.alarm = 42;
    game.time = 96;
    game.player.x = 1150;
    game.player.y = 620;
    game.player.faceAngle = Math.PI / 2;
    game.state = 'won';
    game.score = 1450 + 420;
    return;
  }

  if (scene === 'alert') {
    game.state = 'playing';
    game.alarm = 74;
    game.time = 58;
    game.loot = 150;
    game.gems[0].taken = true;
    // Thief caught mid-hall inside Rook's cone, guard closing in.
    game.player.x = 470;
    game.player.y = 250;
    game.player.faceAngle = Math.PI;
    game.guards[0].x = 380;
    game.guards[0].y = 250;
    game.guards[0].facing = 0;
    game.guards[0].state = 'hunt';
    game.guards[0].seesPlayer = true;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    return;
  }

  // Default cover: mid-heist, thief crossing the hall, cones sweeping,
  // vault and getaway both in frame.
  game.state = 'playing';
  game.alarm = 18;
  game.time = 41;
  game.loot = 150;
  game.gems[0].taken = true;
  game.player.x = 640;
  game.player.y = 480;
  game.player.faceAngle = -Math.PI / 2;
  game.guards[0].x = 420;
  game.guards[0].y = 250;
  game.guards[0].facing = Math.PI / 2;
  game.guards[1].x = 1120;
  game.guards[1].y = 420;
  game.guards[1].facing = Math.PI;
  game.guards[2].x = 300;
  game.guards[2].y = 700;
  game.guards[2].facing = 0;
  game.cameras[0].angle = Math.PI / 2 + 0.4;
  game.cameras[1].angle = Math.PI - 0.3;
}
