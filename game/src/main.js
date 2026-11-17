/** Boot Foxfire Lane, run the game loop, and stage screenshot scenes. */
import { STEP, VIEW } from './config.js';
import { attachInput } from './input.js';
import { unlockAudio } from './audio.js';
import { stepFx } from './fx.js';
import {
  beginRun,
  createWorld,
  loadBest,
  releaseJump,
  requestJump,
  resetWorld,
  saveBest,
  stepWorld,
} from './world.js';
import { drawWorld, fitCanvas } from './render.js';
import { shotNameFromQuery, shotSeedFromQuery, stageShot } from './shots.js';
import { SCREENS } from './config.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const context = canvas.getContext('2d', { alpha: false });

const shot = shotNameFromQuery();
const seed = shotSeedFromQuery();
const world = shot ? stageShot(shot, seed) : createWorld(1, loadBest());
if (shot) world.muted = true;

let view = fitCanvas(canvas, context);
let last = 0;
let acc = 0;
let frozen = Boolean(shot);

function announce() {
  if (!status) return;
  if (world.screen === SCREENS.TITLE) {
    status.textContent = 'Foxfire Lane. Press Space or click to run. Jump over roots, logs and cairns, leap the pits, and gather wisps.';
  } else if (world.screen === SCREENS.OVER) {
    status.textContent = `The light went out. Score ${Math.floor(world.score)}. Best ${Math.floor(world.best)}. Press Space or click to run again.`;
  } else {
    status.textContent = `Score ${Math.floor(world.score)}. Wisps ${world.wisps}. Jump with Space, click, or the up arrow.`;
  }
}

attachInput(canvas, () => {
  if (frozen) return;
  unlockAudio();
  if (world.screen === SCREENS.PLAY) requestJump(world);
}, () => {
  if (frozen) return;
  unlockAudio();
  if (world.screen !== SCREENS.PLAY) beginRun(world, false);
});

window.addEventListener('keyup', (event) => {
  if (frozen) return;
  if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') releaseJump(world);
});
window.addEventListener('pointerup', () => {
  if (frozen) return;
  releaseJump(world);
});
window.addEventListener('resize', () => {
  view = fitCanvas(canvas, context);
  if (frozen) drawWorld(context, world, view);
});

function frame(now) {
  if (!last) last = now;
  const raw = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) {
    acc += raw;
    while (acc >= STEP) {
      stepWorld(world, STEP, false);
      stepFx(world.fx, STEP);
      acc -= STEP;
    }
    if (world.screen === SCREENS.OVER && world.newBest) saveBest(world.best);
  }
  drawWorld(context, world, view);
  announce();
  requestAnimationFrame(frame);
}

announce();
drawWorld(context, world, view);
requestAnimationFrame(frame);

void VIEW;
void resetWorld;
