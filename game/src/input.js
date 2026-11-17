/** Keyboard, mouse and pointer input: jump / start / restart. */
export function attachInput(target, onJump, onStart) {
  const held = { jump: false };

  function down(event) {
    if (event.type === 'keydown') {
      const code = event.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter') {
        event.preventDefault();
        if (!held.jump) {
          held.jump = true;
          onJump();
          onStart();
        }
      }
      return;
    }
    event.preventDefault();
    if (!held.jump) {
      held.jump = true;
      onJump();
      onStart();
    }
  }

  function up(event) {
    if (event.type === 'keyup') {
      const code = event.code;
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || code === 'Enter') held.jump = false;
      return;
    }
    held.jump = false;
  }

  target.addEventListener('keydown', down);
  target.addEventListener('keyup', up);
  target.addEventListener('pointerdown', down);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
  target.tabIndex = 0;
  target.focus();
  return held;
}
