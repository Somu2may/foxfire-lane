/** Playfield, physics, scoring and spawn rates for Foxfire Lane. */
export const VIEW = { width: 1280, height: 720 };
export const GROUND_Y = 562;
export const PLAYER = {
  width: 52,
  height: 34,
  hitPad: 8,
  startX: 268,
  gravity: 2650,
  jump: -860,
  cutJump: 0.48,
  coyote: 0.1,
  buffer: 0.1,
  maxFall: 1400,
};

export const SPEED = {
  start: 340,
  max: 760,
  ramp: 7.4,
};

export const SCORE = {
  perMetre: 1,
  wisp: 25,
  comboStep: 5,
  comboWindow: 1.6,
  galeMult: 2,
};

export const POWER = {
  shield: 8,
  magnet: 7,
  gale: 6,
  magnetRadius: 150,
};

export const STEP = 1 / 120;

export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  OVER: 'over',
};

export const KIND = {
  ROOT: 'root',
  LOG: 'log',
  CAIRN: 'cairn',
  PIT: 'pit',
  WISP: 'wisp',
  SHIELD: 'shield',
  MAGNET: 'magnet',
  GALE: 'gale',
};
