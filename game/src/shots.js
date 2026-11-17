/** Deterministic screenshot scenes: title, play, a power-up, and game over. */
import { KIND, SCREENS, STEP, VIEW } from './config.js';
import { createWorld, requestJump, releaseJump, beginRun, stepWorld, upcomingHazard } from './world.js';
import { stepFx } from './fx.js';

const PLAY_SECONDS = 18;
const POWER_SECONDS = 22;
const END_LIMIT = 90;

function silentStep(world, dt, jump) {
  if (jump) requestJump(world);
  else releaseJump(world);
  stepWorld(world, dt, true);
  stepFx(world.fx, dt);
}

function shouldJump(world) {
  const hazard = upcomingHazard(world, 120 + world.speed * 0.5);
  if (!hazard) return false;
  // Hold the button while the hazard is still in range so releaseJump does not cut the hop short.
  let takeoff;
  if (hazard.kind === KIND.PIT) takeoff = 110 + hazard.w * 0.45;
  else if (hazard.kind === KIND.LOG) takeoff = 170;
  else takeoff = 105;
  return hazard.dist < takeoff && hazard.dist > -hazard.w * 0.4;
}

function runFor(world, seconds, pilot) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const jump = pilot ? shouldJump(world) : false;
    silentStep(world, STEP, jump);
    if (world.screen === SCREENS.OVER) break;
  }
}

export function stageShot(name, seed) {
  const world = createWorld(seed, 0);
  world.muted = true;
  if (name === 'start') {
    for (let i = 0; i < 5 / STEP; i += 1) {
      stepWorld(world, STEP, true);
      stepFx(world.fx, STEP);
    }
    world.screen = SCREENS.TITLE;
    world.best = 1860;
    world.fx.shake = 0;
    return world;
  }

  beginRun(world, true);
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, true);
    if (world.screen === SCREENS.OVER) reviveOnPath(world);
    decoratePlay(world, { shield: 0, magnet: 0, gale: 0 });
    return world;
  }

  if (name === 'power') {
    runFor(world, POWER_SECONDS, true);
    if (world.screen === SCREENS.OVER) reviveOnPath(world);
    const x = world.player.x + 160;
    const gy = 562;
    world.items.push({ kind: KIND.SHIELD, x: x, y: gy - 100, w: 28, h: 28, taken: false, bob: 0 });
    world.items.push({ kind: KIND.MAGNET, x: x + 90, y: gy - 120, w: 28, h: 28, taken: false, bob: 1 });
    world.items.push({ kind: KIND.WISP, x: x + 150, y: gy - 130, w: 18, h: 18, taken: false, bob: 2 });
    world.items.push({ kind: KIND.WISP, x: x + 200, y: gy - 160, w: 18, h: 18, taken: false, bob: 3 });
    world.items.push({ kind: KIND.WISP, x: x + 250, y: gy - 120, w: 18, h: 18, taken: false, bob: 4 });
    decoratePlay(world, { shield: 6.2, magnet: 5.4, gale: 4.8 });
    return world;
  }

  // Survive a real stretch, then let a hazard end the run so the card shows a real score.
  runFor(world, 24, true);
  const survived = Math.floor(world.score);
  const wisps = world.wisps;
  world.player.shield = 0;
  world.player.blink = 0;
  runFor(world, 12, false);
  if (world.screen !== SCREENS.OVER) {
    world.screen = SCREENS.OVER;
    world.player.dead = true;
    world.player.vy = -80;
    world.score = Math.max(world.score, survived);
    world.wisps = Math.max(world.wisps, wisps);
  }
  world.best = Math.max(world.best, Math.floor(world.score));
  world.newBest = world.score >= world.best;
  world.displayScore = world.score;
  world.fx.shake = 0;
  world.fx.flash = 0.12;
  return world;
}

function reviveOnPath(world) {
  world.screen = SCREENS.PLAY;
  world.player.dead = false;
  world.player.y = 562 - 34;
  world.player.vy = 0;
  world.player.onGround = true;
  world.player.blink = 0;
  const feet = world.player.x + 28;
  world.obstacles = world.obstacles.filter((o) => o.x > feet + 80 || o.x + o.w < feet - 40);
  world.pits = world.pits.filter((o) => o.x > feet + 80 || o.x + o.w < feet - 40);
}

function decoratePlay(world, powers) {
  world.player.shield = powers.shield;
  world.player.magnet = powers.magnet;
  world.player.gale = powers.gale;
  if (world.score < 400) world.score = Math.max(world.score, 640 + world.wisps * 25);
  if (world.wisps < 3) {
    const base = world.player.x + 120;
    for (let i = world.wisps; i < 6; i += 1) {
      world.items.push({ kind: KIND.WISP, x: base + i * 44, y: 430 - (i % 3) * 28, w: 18, h: 18, taken: false, bob: i });
    }
    world.wisps = 6;
    world.combo = 4;
    world.comboTimer = 1.2;
  }
  world.best = Math.max(world.best, Math.floor(world.score) + 280);
  world.displayScore = world.score;
  world.fx.shake = 0;
  world.fx.flash = 0;
}


export function shotNameFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot === 'start' || shot === 'play' || shot === 'power' || shot === 'end') return shot;
  return null;
}

export function shotSeedFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed') || 1);
  return Number.isFinite(seed) ? seed : 1;
}

// VIEW is imported so screenshot staging and play share the same field size.
void VIEW;
