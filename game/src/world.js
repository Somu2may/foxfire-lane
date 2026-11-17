/** Simulation: running, jumping, obstacles, power-ups, score and game over. */
import { GROUND_Y, KIND, PLAYER, POWER, SCORE, SCREENS, SPEED, VIEW } from './config.js';
import { makeRng, range } from './random.js';
import { burst, puff, shake, flash } from './fx.js';
import { playCrash, playJump, playLand, playPower, playStart, playWisp, unlockAudio } from './audio.js';

function hitbox(player) {
  return {
    x: player.x + PLAYER.hitPad,
    y: player.y + 4,
    w: PLAYER.width - PLAYER.hitPad * 2,
    h: PLAYER.height - 6,
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function difficulty(distance) {
  return Math.min(1, distance / 2400);
}

export function createWorld(seed, best) {
  const world = {
    seed,
    best: best || 0,
    fx: { particles: [], shake: 0, flash: 0, hitStop: 0 },
  };
  resetWorld(world, seed, world.best);
  return world;
}

export function resetWorld(world, seed, best) {
  world.seed = seed;
  world.rng = makeRng(seed);
  world.time = 0;
  world.cameraX = 0;
  world.speed = SPEED.start;
  world.distance = 0;
  world.score = 0;
  world.displayScore = 0;
  world.wisps = 0;
  world.combo = 0;
  world.comboTimer = 0;
  world.best = best || 0;
  world.newBest = false;
  world.screen = SCREENS.TITLE;
  world.spawnX = 900;
  world.obstacles = [];
  world.items = [];
  world.pits = [];
  world.jumpHeld = false;
  world.muted = false;
  world.player = {
    x: PLAYER.startX,
    y: GROUND_Y - PLAYER.height,
    vy: 0,
    onGround: true,
    coyote: 0,
    buffer: 0,
    runPhase: 0,
    squish: 1,
    dead: false,
    shield: 0,
    magnet: 0,
    gale: 0,
    blink: 0,
  };
  world.fx.particles.length = 0;
  world.fx.shake = 0;
  world.fx.flash = 0;
  world.fx.hitStop = 0;
  seedOpening(world);
}

function seedOpening(world) {
  // A readable first stretch: a few wisps, then a root, so the start of play looks like a game.
  world.items.push(makeWisp(620, GROUND_Y - 52));
  world.items.push(makeWisp(720, GROUND_Y - 110));
  world.items.push(makeWisp(820, GROUND_Y - 70));
  world.obstacles.push(makeObstacle(KIND.ROOT, 1280));
  world.spawnX = 1600;
}

function makeObstacle(kind, x) {
  if (kind === KIND.ROOT) return { kind, x, y: GROUND_Y - 28, w: 46, h: 28 };
  if (kind === KIND.LOG) return { kind, x, y: GROUND_Y - 62, w: 92, h: 62 };
  return { kind: KIND.CAIRN, x, y: GROUND_Y - 50, w: 40, h: 50 };
}

function makePit(x, w) {
  return { kind: KIND.PIT, x, y: GROUND_Y, w, h: 160 };
}

function makeWisp(x, y) {
  return { kind: KIND.WISP, x, y, w: 18, h: 18, taken: false, bob: x * 0.01 };
}

function makePower(kind, x) {
  return { kind, x, y: GROUND_Y - 86, w: 28, h: 28, taken: false, bob: x * 0.02 };
}

function spawnAhead(world) {
  const diff = difficulty(world.distance);
  while (world.spawnX < world.cameraX + VIEW.width + 500) {
    const gap = range(world.rng, 280 - diff * 80, 460 - diff * 110);
    world.spawnX += gap;
    const roll = world.rng();
    if (roll < 0.16 + diff * 0.08) {
      const width = range(world.rng, 88 + diff * 20, 150 + diff * 60);
      world.pits.push(makePit(world.spawnX, width));
      world.spawnX += width + 40;
      if (world.rng() < 0.7) world.items.push(makeWisp(world.spawnX - width / 2, GROUND_Y - 150 - diff * 30));
    } else if (roll < 0.34 + diff * 0.12) {
      const kind = world.rng() < 0.45 ? KIND.ROOT : world.rng() < 0.7 ? KIND.CAIRN : KIND.LOG;
      world.obstacles.push(makeObstacle(kind, world.spawnX));
      if (world.rng() < 0.55) {
        world.items.push(makeWisp(world.spawnX + 20, GROUND_Y - 120 - (kind === KIND.LOG ? 40 : 0)));
      }
    } else if (roll < 0.78) {
      const count = 1 + Math.floor(world.rng() * (2 + diff * 2));
      for (let i = 0; i < count; i += 1) {
        world.items.push(makeWisp(world.spawnX + i * 46, GROUND_Y - 80 - world.rng() * 90));
      }
    } else if (roll < 0.9) {
      const kind = world.rng() < 0.4 ? KIND.SHIELD : world.rng() < 0.7 ? KIND.MAGNET : KIND.GALE;
      world.items.push(makePower(kind, world.spawnX));
    } else {
      world.obstacles.push(makeObstacle(KIND.ROOT, world.spawnX));
      world.items.push(makeWisp(world.spawnX + 90, GROUND_Y - 140));
    }
  }
}

function groundAt(world, x) {
  for (const pit of world.pits) {
    if (x > pit.x + 8 && x < pit.x + pit.w - 8) return false;
  }
  return true;
}

function tryJump(world, silent) {
  const player = world.player;
  if (world.screen !== SCREENS.PLAY || player.dead) return false;
  if (player.onGround || player.coyote > 0) {
    player.vy = PLAYER.jump;
    player.onGround = false;
    player.coyote = 0;
    player.buffer = 0;
    player.squish = 0.72;
    if (!silent && !world.muted) playJump();
    puff(world.fx, player.x + PLAYER.width * 0.5, GROUND_Y - 4, '#c9a16a');
    return true;
  }
  player.buffer = PLAYER.buffer;
  return false;
}

export function requestJump(world) {
  world.jumpHeld = true;
  return tryJump(world, false);
}

export function releaseJump(world) {
  world.jumpHeld = false;
  const player = world.player;
  if (!player.onGround && player.vy < 0) player.vy *= PLAYER.cutJump;
}

export function beginRun(world, silent) {
  if (world.screen === SCREENS.PLAY && !world.player.dead) return;
  if (world.screen === SCREENS.OVER) resetWorld(world, (world.seed + 17) >>> 0, world.best);
  world.screen = SCREENS.PLAY;
  if (!silent && !world.muted) {
    unlockAudio();
    playStart();
  }
}

export function stepWorld(world, dt, silent) {
  if (world.screen === SCREENS.TITLE) {
    world.time += dt;
    world.cameraX += 40 * dt;
    spawnAhead(world);
    return;
  }

  const player = world.player;
  if (world.screen === SCREENS.OVER) {
    world.time += dt;
    if (!player.dead) return;
    player.vy += PLAYER.gravity * dt;
    player.y += player.vy * dt;
    return;
  }

  world.time += dt;
  world.speed = Math.min(SPEED.max, SPEED.start + world.distance * (SPEED.ramp / 100));
  const scroll = world.speed * dt;
  world.cameraX += scroll;
  world.distance += scroll * 0.1;
  const multiplier = player.gale > 0 ? SCORE.galeMult : 1;
  world.score += scroll * 0.1 * SCORE.perMetre * multiplier;
  if (world.comboTimer > 0) world.comboTimer -= dt;
  else world.combo = 0;
  if (player.shield > 0) player.shield = Math.max(0, player.shield - dt);
  if (player.magnet > 0) player.magnet = Math.max(0, player.magnet - dt);
  if (player.gale > 0) player.gale = Math.max(0, player.gale - dt);
  if (player.blink > 0) player.blink = Math.max(0, player.blink - dt);
  player.runPhase += dt * (8 + world.speed * 0.012);
  player.squish += (1 - player.squish) * Math.min(1, dt * 12);

  if (!player.onGround) player.coyote = Math.max(0, player.coyote - dt);
  if (player.buffer > 0) {
    player.buffer -= dt;
    if (player.buffer > 0) tryJump(world, silent);
  }

  player.vy += PLAYER.gravity * dt;
  if (player.vy > PLAYER.maxFall) player.vy = PLAYER.maxFall;
  player.y += player.vy * dt;
  player.x = world.cameraX + PLAYER.startX;

  const feet = player.x + PLAYER.width * 0.55;
  const onFloor = groundAt(world, feet) && player.y >= GROUND_Y - PLAYER.height;
  if (onFloor && player.vy >= 0) {
    if (!player.onGround) {
      player.squish = 1.18;
      if (!silent && !world.muted) playLand();
      puff(world.fx, player.x + 20, GROUND_Y, '#8a6a45');
    }
    player.y = GROUND_Y - PLAYER.height;
    player.vy = 0;
    player.onGround = true;
    player.coyote = PLAYER.coyote;
  } else {
    if (player.onGround && !groundAt(world, feet)) player.coyote = PLAYER.coyote;
    player.onGround = false;
  }

  if (player.y > VIEW.height + 80) {
    finishRun(world, silent);
    return;
  }

  spawnAhead(world);
  collectItems(world, dt, silent);
  collideObstacles(world, silent);

  const cut = world.cameraX - 200;
  world.obstacles = world.obstacles.filter((o) => o.x + o.w > cut);
  world.items = world.items.filter((o) => o.x + o.w > cut && !o.taken);
  world.pits = world.pits.filter((o) => o.x + o.w > cut);
  world.displayScore += (world.score - world.displayScore) * Math.min(1, dt * 8);
}

function collectItems(world, dt, silent) {
  const player = world.player;
  const box = hitbox(player);
  const magnet = player.magnet > 0 ? POWER.magnetRadius : 0;
  for (const item of world.items) {
    if (item.taken) continue;
    if (magnet && item.kind === KIND.WISP) {
      const cx = item.x + item.w / 2;
      const cy = item.y + item.h / 2;
      const px = player.x + PLAYER.width / 2;
      const py = player.y + PLAYER.height / 2;
      const dx = px - cx;
      const dy = py - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < magnet && dist > 1) {
        item.x += (dx / dist) * 420 * dt;
        item.y += (dy / dist) * 420 * dt;
      }
    }
    const ibox = { x: item.x, y: item.y + Math.sin(world.time * 4 + item.bob) * 6, w: item.w, h: item.h };
    if (!overlaps(box, ibox)) continue;
    item.taken = true;
    if (item.kind === KIND.WISP) {
      world.combo += 1;
      world.comboTimer = SCORE.comboWindow;
      const gain = (SCORE.wisp + (world.combo - 1) * SCORE.comboStep) * (player.gale > 0 ? SCORE.galeMult : 1);
      world.score += gain;
      world.wisps += 1;
      burst(world.fx, ibox.x, ibox.y, 12, '#b8ff7a', 160, 0.45);
      if (!silent && !world.muted) playWisp();
    } else {
      if (item.kind === KIND.SHIELD) player.shield = POWER.shield;
      if (item.kind === KIND.MAGNET) player.magnet = POWER.magnet;
      if (item.kind === KIND.GALE) player.gale = POWER.gale;
      burst(world.fx, ibox.x, ibox.y, 16, item.kind === KIND.SHIELD ? '#ffb347' : item.kind === KIND.MAGNET ? '#8ecbff' : '#ffe27a', 200, 0.5);
      if (!silent && !world.muted) playPower(item.kind);
    }
  }
}

function collideObstacles(world, silent) {
  const player = world.player;
  if (player.dead || player.blink > 0) return;
  const box = hitbox(player);
  for (const obstacle of world.obstacles) {
    const obox = { x: obstacle.x + 4, y: obstacle.y + 2, w: obstacle.w - 8, h: obstacle.h - 2 };
    if (!overlaps(box, obox)) continue;
    if (player.shield > 0) {
      player.shield = 0;
      player.blink = 0.8;
      shake(world.fx, 8);
      flash(world.fx, 0.35);
      burst(world.fx, player.x + 20, player.y + 10, 18, '#ffd27a', 220, 0.5);
      return;
    }
    finishRun(world, silent);
    return;
  }
}

function finishRun(world, silent) {
  const player = world.player;
  if (player.dead) return;
  player.dead = true;
  world.screen = SCREENS.OVER;
  player.vy = -320;
  world.displayScore = world.score;
  if (world.score > world.best) {
    world.best = Math.floor(world.score);
    world.newBest = true;
  }
  shake(world.fx, 14);
  flash(world.fx, 0.7);
  burst(world.fx, player.x + 20, player.y + 10, 24, '#ff8a5b', 280, 0.7);
  if (!silent && !world.muted) playCrash();
}

export function upcomingHazard(world, ahead) {
  const feet = world.player.x + PLAYER.width * 0.55;
  let soonest = null;
  const consider = (x, w, kind) => {
    if (x + w < feet) return;
    const dist = x - feet;
    if (dist > ahead) return;
    if (!soonest || dist < soonest.dist) soonest = { kind, x, w, dist };
  };
  for (const obstacle of world.obstacles) consider(obstacle.x, obstacle.w, obstacle.kind);
  for (const pit of world.pits) consider(pit.x, pit.w, KIND.PIT);
  return soonest;
}

export function loadBest() {
  try {
    const value = Number(localStorage.getItem('foxfire-lane-best') || 0);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score) {
  try {
    localStorage.setItem('foxfire-lane-best', String(Math.floor(score)));
  } catch {
    // Running as a file or in a blocked shot context; best score is optional.
  }
}
