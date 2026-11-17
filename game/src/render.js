/** Canvas drawing: night forest, fox, hazards, HUD, title and game-over screens. */
import { GROUND_Y, KIND, PLAYER, SCREENS, VIEW } from './config.js';
import { drawParticles } from './fx.js';

const SKY_TOP = '#0a0c1c';
const SKY_HORIZON = '#2a1a2c';
const MOON = '#f4e4c1';
const PATH = '#3a2a1c';
const PATH_LIT = '#5a4030';
const MOSS = '#2e4a32';

export function fitCanvas(canvas, context) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const scale = Math.min(width / VIEW.width, height / VIEW.height);
  const ox = (width - VIEW.width * scale) / 2;
  const oy = (height - VIEW.height * scale) / 2;
  return { scale, ox, oy, width, height };
}

export function drawWorld(context, world, view) {
  const { scale, ox, oy, width, height } = view;
  context.fillStyle = '#05060d';
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(ox, oy);
  context.scale(scale, scale);
  context.beginPath();
  context.rect(0, 0, VIEW.width, VIEW.height);
  context.clip();

  const cam = world.cameraX;
  const shakeX = (world.fx.shake ? (Math.random() - 0.5) * world.fx.shake : 0);
  const shakeY = (world.fx.shake ? (Math.random() - 0.5) * world.fx.shake : 0);
  context.save();
  context.translate(shakeX, shakeY);

  drawSky(context, world);
  drawMoon(context, world);
  drawStars(context, cam);
  drawRidge(context, cam, 0.15, 0.62, '#12141f', 9);
  drawRidge(context, cam, 0.28, 0.7, '#171a28', 7);
  drawLanternTrees(context, cam, world.time);
  drawGround(context, world, cam);
  drawPits(context, world, cam);
  drawObstacles(context, world, cam);
  drawItems(context, world, cam);
  drawFox(context, world, cam);
  drawParticles(context, world.fx, cam);
  drawForeground(context, cam, world.time);
  context.restore();

  if (world.fx.flash > 0) {
    context.fillStyle = `rgba(255, 210, 150, ${world.fx.flash * 0.35})`;
    context.fillRect(0, 0, VIEW.width, VIEW.height);
  }
  drawVignette(context);
  if (world.screen === SCREENS.TITLE) drawTitle(context, world);
  else if (world.screen === SCREENS.OVER) drawOver(context, world);
  else drawHud(context, world);

  context.restore();
}

function drawSky(context, world) {
  const sky = context.createLinearGradient(0, 0, 0, VIEW.height);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(0.55, '#16122a');
  sky.addColorStop(1, SKY_HORIZON);
  context.fillStyle = sky;
  context.fillRect(0, 0, VIEW.width, VIEW.height);
  // Warm wash near the path, stronger with gale.
  const wash = context.createRadialGradient(VIEW.width * 0.35, GROUND_Y, 40, VIEW.width * 0.35, GROUND_Y, 520);
  const heat = world.player.gale > 0 ? 0.2 : 0.12;
  wash.addColorStop(0, `rgba(255, 170, 80, ${heat})`);
  wash.addColorStop(1, 'rgba(255, 170, 80, 0)');
  context.fillStyle = wash;
  context.fillRect(0, 0, VIEW.width, VIEW.height);
}

function drawMoon(context, world) {
  const x = 980;
  const y = 118;
  const glow = context.createRadialGradient(x, y, 20, x, y, 160);
  glow.addColorStop(0, 'rgba(244, 228, 193, 0.35)');
  glow.addColorStop(1, 'rgba(244, 228, 193, 0)');
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y, 160, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = MOON;
  context.beginPath();
  context.arc(x, y, 54, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = 'rgba(10, 12, 28, 0.18)';
  context.beginPath();
  context.arc(x - 18, y - 8, 12, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(x + 14, y + 16, 8, 0, Math.PI * 2);
  context.fill();
}

function drawStars(context, cam) {
  context.fillStyle = '#f0e6c8';
  for (let i = 0; i < 80; i += 1) {
    const x = ((i * 163 + cam * 0.04) % (VIEW.width + 40)) - 20;
    const y = (i * 37) % 280 + 10;
    const r = i % 7 === 0 ? 1.6 : 0.8;
    context.globalAlpha = 0.35 + (i % 5) * 0.12;
    context.fillRect(x, y, r, r);
  }
  context.globalAlpha = 1;
}

function drawRidge(context, cam, parallax, heightFactor, color, count) {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(-40, VIEW.height);
  const base = GROUND_Y * heightFactor;
  context.lineTo(-40, base);
  const period = 220;
  const shift = (cam * parallax) % period;
  for (let i = -1; i < count + 2; i += 1) {
    const x = i * period - shift;
    const peak = base - 80 - ((i * 13) % 70);
    context.lineTo(x + period * 0.5, peak);
  }
  context.lineTo(VIEW.width + 40, base);
  context.lineTo(VIEW.width + 40, VIEW.height);
  context.closePath();
  context.fill();
}

function drawLanternTrees(context, cam, time) {
  const period = 260;
  const shift = (cam * 0.55) % period;
  for (let i = -1; i < 8; i += 1) {
    const x = i * period - shift + 40;
    const trunk = 16 + (i % 3) * 4;
    context.fillStyle = '#0d1018';
    context.fillRect(x, 250, trunk, GROUND_Y - 250);
    context.beginPath();
    context.moveTo(x - 40, 320);
    context.lineTo(x + trunk / 2, 140 - (i % 4) * 20);
    context.lineTo(x + trunk + 48, 320);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(x - 28, 250);
    context.lineTo(x + trunk / 2 + 10, 180);
    context.lineTo(x + trunk + 36, 250);
    context.closePath();
    context.fill();
    if (i % 2 === 0) drawLantern(context, x + trunk + 18, 300, time + i);
  }
}

function drawLantern(context, x, y, time) {
  const pulse = 0.55 + Math.sin(time * 3) * 0.15;
  const glow = context.createRadialGradient(x, y + 10, 2, x, y + 10, 36);
  glow.addColorStop(0, `rgba(255, 190, 80, ${0.8 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 190, 80, 0)');
  context.fillStyle = glow;
  context.beginPath();
  context.arc(x, y + 10, 36, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#c9a053';
  context.fillRect(x - 6, y, 12, 16);
  context.fillStyle = '#ffd27a';
  context.fillRect(x - 4, y + 3, 8, 10);
  context.fillStyle = '#5a3a1a';
  context.fillRect(x - 7, y - 3, 14, 3);
  context.strokeStyle = '#3a2412';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(x, y - 3);
  context.lineTo(x, y - 12);
  context.stroke();
}

function drawGround(context, world, cam) {
  context.fillStyle = '#1a1410';
  context.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
  const path = context.createLinearGradient(0, GROUND_Y, 0, VIEW.height);
  path.addColorStop(0, PATH_LIT);
  path.addColorStop(0.18, PATH);
  path.addColorStop(1, '#1b120c');
  context.fillStyle = path;
  context.fillRect(0, GROUND_Y, VIEW.width, 90);

  context.fillStyle = MOSS;
  const mossShift = cam % 48;
  for (let x = -48; x < VIEW.width + 48; x += 16) {
    const wx = x + mossShift;
    const h = 4 + ((Math.floor((cam + x) / 16) * 7) % 7);
    context.fillRect(x - mossShift, GROUND_Y - h, 12, h);
  }

  context.strokeStyle = 'rgba(0,0,0,0.25)';
  context.lineWidth = 2;
  const rut = (cam * 0.9) % 80;
  context.beginPath();
  for (let x = -80; x < VIEW.width + 80; x += 20) {
    const y = GROUND_Y + 18 + Math.sin((x + cam) * 0.03) * 3;
    if (x === -80) context.moveTo(x - rut, y);
    else context.lineTo(x - rut, y);
  }
  context.stroke();
}

function drawPits(context, world, cam) {
  for (const pit of world.pits) {
    const x = pit.x - cam;
    context.fillStyle = '#07040a';
    context.fillRect(x, GROUND_Y - 2, pit.w, 200);
    const depth = context.createLinearGradient(0, GROUND_Y, 0, VIEW.height);
    depth.addColorStop(0, '#12080c');
    depth.addColorStop(1, '#050308');
    context.fillStyle = depth;
    context.fillRect(x, GROUND_Y, pit.w, VIEW.height - GROUND_Y);
    context.fillStyle = '#2a1a12';
    context.fillRect(x - 8, GROUND_Y - 14, 12, 18);
    context.fillRect(x + pit.w - 4, GROUND_Y - 14, 12, 18);
    context.fillStyle = 'rgba(255, 160, 60, 0.15)';
    context.fillRect(x, GROUND_Y - 2, pit.w, 3);
  }
}

function drawObstacles(context, world, cam) {
  for (const obstacle of world.obstacles) {
    const x = obstacle.x - cam;
    const y = obstacle.y;
    if (obstacle.kind === KIND.ROOT) {
      context.fillStyle = '#3a2416';
      context.beginPath();
      context.moveTo(x, GROUND_Y);
      context.quadraticCurveTo(x + 10, y - 10, x + 18, y + 8);
      context.quadraticCurveTo(x + 28, y - 16, x + obstacle.w, GROUND_Y);
      context.lineTo(x, GROUND_Y);
      context.fill();
      context.strokeStyle = '#1a1008';
      context.stroke();
    } else if (obstacle.kind === KIND.LOG) {
      context.fillStyle = '#4a2e1a';
      rounded(context, x, y, obstacle.w, obstacle.h, 10);
      context.fill();
      context.strokeStyle = '#2a180c';
      context.stroke();
      context.strokeStyle = 'rgba(20,10,4,0.45)';
      for (let i = 1; i < 4; i += 1) {
        context.beginPath();
        context.moveTo(x + 10, y + i * 14);
        context.quadraticCurveTo(x + 40, y + i * 14 + 4, x + obstacle.w - 10, y + i * 14);
        context.stroke();
      }
      context.fillStyle = '#c9a16a';
      context.beginPath();
      context.ellipse(x + 8, y + 20, 7, 16, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillStyle = '#5b5a62';
      context.beginPath();
      context.moveTo(x + 4, GROUND_Y);
      context.lineTo(x + obstacle.w / 2, y);
      context.lineTo(x + obstacle.w - 4, GROUND_Y);
      context.closePath();
      context.fill();
      context.fillStyle = '#7a7982';
      context.fillRect(x + 8, y + 18, 10, 8);
      context.fillRect(x + 22, y + 28, 12, 9);
    }
  }
}

function rounded(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawItems(context, world, cam) {
  for (const item of world.items) {
    if (item.taken) continue;
    const bob = Math.sin(world.time * 4 + item.bob) * 6;
    const x = item.x - cam + item.w / 2;
    const y = item.y + bob + item.h / 2;
    if (item.kind === KIND.WISP) {
      const glow = context.createRadialGradient(x, y, 1, x, y, 22);
      glow.addColorStop(0, 'rgba(200, 255, 120, 0.95)');
      glow.addColorStop(0.4, 'rgba(140, 255, 90, 0.45)');
      glow.addColorStop(1, 'rgba(140, 255, 90, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, 22, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f4ffe6';
      context.beginPath();
      context.arc(x, y, 4.5, 0, Math.PI * 2);
      context.fill();
    } else {
      const color = item.kind === KIND.SHIELD ? '#ffb347' : item.kind === KIND.MAGNET ? '#7ecbff' : '#ffe27a';
      const glow = context.createRadialGradient(x, y, 2, x, y, 26);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, 26, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = color;
      rounded(context, x - 12, y - 12, 24, 24, 6);
      context.fill();
      context.fillStyle = '#1a1208';
      context.font = 'bold 13px system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const glyph = item.kind === KIND.SHIELD ? 'S' : item.kind === KIND.MAGNET ? 'M' : 'G';
      context.fillText(glyph, x, y + 1);
    }
  }
}

function drawFox(context, world, cam) {
  const player = world.player;
  if (player.blink > 0 && Math.floor(world.time * 20) % 2 === 0) return;
  const x = player.x - cam;
  const y = player.y;
  const phase = player.runPhase;
  const squish = player.squish;
  context.save();
  context.translate(x + PLAYER.width * 0.45, y + PLAYER.height);
  context.scale(1, squish);

  if (player.shield > 0) {
    const pulse = 0.35 + Math.sin(world.time * 8) * 0.1;
    context.strokeStyle = `rgba(255, 200, 90, ${0.5 + pulse})`;
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(0, -20, 34, 28, 0, 0, Math.PI * 2);
    context.stroke();
  }
  if (player.gale > 0) {
    context.strokeStyle = 'rgba(255, 230, 140, 0.45)';
    context.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      context.beginPath();
      context.moveTo(-40 - i * 10, -10 - i * 6);
      context.quadraticCurveTo(-20, -16, -8, -8);
      context.stroke();
    }
  }

  // Tail with foxfire.
  const wag = Math.sin(phase * 0.9) * 10;
  context.beginPath();
  context.moveTo(-8, -16);
  context.quadraticCurveTo(-36, -40 + wag, -58, -22 + wag);
  context.quadraticCurveTo(-36, -8 + wag, -10, -8);
  const tail = context.createLinearGradient(-8, -16, -58, -22);
  tail.addColorStop(0, '#c45a22');
  tail.addColorStop(0.6, '#ff8a3a');
  tail.addColorStop(1, '#b8ff7a');
  context.fillStyle = tail;
  context.fill();
  const tglow = context.createRadialGradient(-50, -24 + wag, 2, -50, -24 + wag, 22);
  tglow.addColorStop(0, 'rgba(180, 255, 120, 0.7)');
  tglow.addColorStop(1, 'rgba(180, 255, 120, 0)');
  context.fillStyle = tglow;
  context.beginPath();
  context.arc(-50, -24 + wag, 22, 0, Math.PI * 2);
  context.fill();

  // Legs.
  if (player.onGround && world.screen !== SCREENS.OVER) {
    const lift = Math.sin(phase) * 7;
    const lift2 = Math.sin(phase + Math.PI) * 7;
    context.strokeStyle = '#8a3a18';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-8, -8);
    context.lineTo(-12, lift);
    context.moveTo(8, -8);
    context.lineTo(10, lift2);
    context.moveTo(-2, -8);
    context.lineTo(-4, lift2 * 0.7);
    context.moveTo(4, -8);
    context.lineTo(6, lift * 0.7);
    context.stroke();
  } else {
    context.strokeStyle = '#8a3a18';
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-6, -8);
    context.lineTo(-14, -2);
    context.moveTo(8, -8);
    context.lineTo(16, -4);
    context.stroke();
  }

  // Body and head.
  context.fillStyle = '#d2662a';
  context.beginPath();
  context.ellipse(2, -18, 18, 13, -0.15, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#f3d2a8';
  context.beginPath();
  context.ellipse(4, -14, 10, 7, -0.15, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#d2662a';
  context.beginPath();
  context.ellipse(16, -26, 12, 10, -0.2, 0, Math.PI * 2);
  context.fill();
  // Ears.
  context.fillStyle = '#c45a22';
  context.beginPath();
  context.moveTo(10, -34);
  context.lineTo(14, -48);
  context.lineTo(20, -32);
  context.fill();
  context.beginPath();
  context.moveTo(20, -32);
  context.lineTo(28, -46);
  context.lineTo(30, -28);
  context.fill();
  context.fillStyle = '#f3d2a8';
  context.beginPath();
  context.moveTo(13, -35);
  context.lineTo(15, -43);
  context.lineTo(18, -33);
  context.fill();
  // Snout and eye.
  context.fillStyle = '#f3d2a8';
  context.beginPath();
  context.ellipse(24, -22, 7, 5, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#1a1208';
  context.beginPath();
  context.arc(28, -22, 1.8, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#1c120c';
  context.beginPath();
  context.ellipse(18, -28, 2.4, 2.8, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#fff6d8';
  context.beginPath();
  context.arc(18.8, -28.8, 0.8, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

function drawForeground(context, cam, time) {
  context.fillStyle = '#0b0d12';
  const period = 90;
  const shift = (cam * 1.15) % period;
  context.beginPath();
  context.moveTo(-20, VIEW.height);
  for (let x = -20; x < VIEW.width + 40; x += 20) {
    const h = 28 + Math.sin((x + cam) * 0.04) * 10;
    context.lineTo(x - shift, VIEW.height - h);
  }
  context.lineTo(VIEW.width + 20, VIEW.height);
  context.closePath();
  context.fill();
}

function drawVignette(context) {
  const vg = context.createRadialGradient(VIEW.width / 2, VIEW.height / 2, 220, VIEW.width / 2, VIEW.height / 2, 720);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  context.fillStyle = vg;
  context.fillRect(0, 0, VIEW.width, VIEW.height);
}

function panel(context, x, y, w, h) {
  context.fillStyle = 'rgba(8, 10, 20, 0.72)';
  rounded(context, x, y, w, h, 14);
  context.fill();
  context.strokeStyle = 'rgba(255, 210, 120, 0.25)';
  context.lineWidth = 2;
  context.stroke();
}

function drawTitle(context, world) {
  panel(context, 160, 78, 960, 430);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffd27a';
  context.shadowColor = 'rgba(255, 180, 60, 0.8)';
  context.shadowBlur = 24;
  context.font = 'bold 92px system-ui, Segoe UI, sans-serif';
  context.fillText('FOXFIRE LANE', VIEW.width / 2, 180);
  context.shadowBlur = 0;
  context.fillStyle = '#d8c7a2';
  context.font = '28px system-ui, sans-serif';
  context.fillText('Run the night path. Leap the roots. Gather the wisps.', VIEW.width / 2, 250);
  context.fillStyle = '#f4e4c1';
  context.font = '22px system-ui, sans-serif';
  context.fillText('Space, click, or ↑ to jump    ·    one hit ends the run', VIEW.width / 2, 310);
  context.fillText('Catch an Ember Shield, Moon Magnet, or Gale Burst when they glow', VIEW.width / 2, 344);
  const pulse = 0.7 + Math.sin(world.time * 4) * 0.3;
  context.fillStyle = `rgba(255, 210, 122, ${pulse})`;
  context.font = 'bold 32px system-ui, sans-serif';
  context.fillText('Press Space or click to run', VIEW.width / 2, 430);
  if (world.best > 0) {
    context.fillStyle = '#b8ff7a';
    context.font = '20px system-ui, sans-serif';
    context.fillText(`Best ${Math.floor(world.best)}`, VIEW.width / 2, 474);
  }
}

function drawHud(context, world) {
  panel(context, 24, 18, 420, 108);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillStyle = '#ffd27a';
  context.font = 'bold 22px system-ui, sans-serif';
  context.fillText('FOXFIRE LANE', 44, 48);
  context.fillStyle = '#f7f0dc';
  context.font = 'bold 36px system-ui, sans-serif';
  context.fillText(String(Math.floor(world.displayScore)), 44, 96);
  context.fillStyle = '#d8c7a2';
  context.font = '18px system-ui, sans-serif';
  context.fillText(`Best ${Math.floor(world.best)}`, 230, 62);
  context.fillText(`Wisps ${world.wisps}`, 230, 90);

  if (world.combo >= 2 && world.comboTimer > 0) {
    context.fillStyle = '#b8ff7a';
    context.font = 'bold 24px system-ui, sans-serif';
    context.textAlign = 'right';
    context.fillText(`x${world.combo} combo`, VIEW.width - 36, 56);
  }

  const powers = [];
  if (world.player.shield > 0) powers.push({ name: 'SHIELD', t: world.player.shield, c: '#ffb347' });
  if (world.player.magnet > 0) powers.push({ name: 'MAGNET', t: world.player.magnet, c: '#7ecbff' });
  if (world.player.gale > 0) powers.push({ name: 'GALE x2', t: world.player.gale, c: '#ffe27a' });
  powers.forEach((power, index) => {
    const x = VIEW.width - 248;
    const y = 78 + index * 36;
    context.fillStyle = 'rgba(8,10,20,0.7)';
    rounded(context, x, y, 224, 30, 8);
    context.fill();
    context.fillStyle = power.c;
    context.fillRect(x + 8, y + 12, 80 * (power.t / 8), 8);
    context.font = 'bold 16px system-ui, sans-serif';
    context.textAlign = 'left';
    context.fillText(`${power.name} ${power.t.toFixed(1)}s`, x + 96, y + 21);
  });
}

function drawOver(context, world) {
  panel(context, 210, 120, 860, 430);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffb08a';
  context.font = 'bold 64px system-ui, sans-serif';
  context.fillText('The light went out', VIEW.width / 2, 200);
  context.fillStyle = '#f7f0dc';
  context.font = 'bold 80px system-ui, sans-serif';
  context.fillText(String(Math.floor(world.score)), VIEW.width / 2, 300);
  context.fillStyle = '#d8c7a2';
  context.font = '26px system-ui, sans-serif';
  const bestLine = world.newBest ? `New best ${Math.floor(world.best)}` : `Best ${Math.floor(world.best)}`;
  context.fillText(`${bestLine}    ·    ${world.wisps} wisps`, VIEW.width / 2, 372);
  const pulse = 0.7 + Math.sin(world.time * 4) * 0.3;
  context.fillStyle = `rgba(255, 210, 122, ${pulse})`;
  context.font = 'bold 30px system-ui, sans-serif';
  context.fillText('Press Space or click to run again', VIEW.width / 2, 460);
}
