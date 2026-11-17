/** Particles, sparks, puffs and screen shake. */
export function createFx() {
  return { particles: [], shake: 0, flash: 0, hitStop: 0 };
}

export function burst(fx, x, y, count, color, speed, life) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const vel = speed * (0.4 + Math.random());
    fx.particles.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel - 40,
      life,
      max: life,
      size: 2 + Math.random() * 3,
      color,
      gravity: 180,
    });
  }
}

export function puff(fx, x, y, color) {
  burst(fx, x, y, 10, color, 90, 0.4);
}

export function stepFx(fx, dt) {
  if (fx.shake > 0) fx.shake = Math.max(0, fx.shake - dt * 8);
  if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt * 3);
  if (fx.hitStop > 0) fx.hitStop = Math.max(0, fx.hitStop - dt);
  for (let i = fx.particles.length - 1; i >= 0; i -= 1) {
    const p = fx.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    if (p.life <= 0) fx.particles.splice(i, 1);
  }
}

export function shake(fx, amount) {
  fx.shake = Math.max(fx.shake, amount);
}

export function flash(fx, amount) {
  fx.flash = Math.max(fx.flash, amount);
}

export function drawParticles(ctx, fx, cameraX) {
  for (const p of fx.particles) {
    const alpha = Math.max(0, p.life / p.max);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.size * (0.5 + alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
