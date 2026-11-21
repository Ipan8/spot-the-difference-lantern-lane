// Every tuning number and colour for Lantern Lane in one place. The playfield
// is a fixed 1280x720 logical area; the renderer scales it to the window, so no
// rule below depends on the screen size. Two panels sit side by side inside it.

export const FIELD = { width: 1280, height: 720 };

// One panel of the pair: the scene is drawn in this space, twice, and the
// right panel is the same scene with the round's differences applied.
export const PANEL = { width: 600, height: 588, leftX: 20, rightX: 660, y: 76 };

export const HEADER = { height: 64 };
export const FOOTER = { y: 676, height: 36 };

export const SCORE = {
  find: 100,
  wrongClick: -25,
  hint: -50,
  timeBonusPerSecond: 2,
};

export const HINTS_PER_ROUND = 3;
export const HINT_SECONDS = 2.5;

/** How close a click must land to a difference anchor to count, in panel px. */
export const HIT_RADIUS = 30;

/** How long a wrong-click cross stays on screen, in seconds. */
export const MISS_SECONDS = 0.7;

/** Seconds under which the timer bar turns red and the clock ticks. */
export const LOW_TIME_SECONDS = 10;

export const PALETTE = {
  backdrop: '#141126',
  skyTop: '#1b1740',
  skyBottom: '#3a2a5e',
  header: '#1d1836',
  headerLine: '#3d3468',
  panelFrame: '#4a3f7d',
  panelGap: '#241d47',
  ground: '#2c2140',
  cobble: '#3a2d55',
  cobbleLine: '#241a38',
  text: '#f5efdd',
  muted: '#b3a8d8',
  gold: '#f2c94c',
  found: '#58d68d',
  foundRing: '#2ecc71',
  miss: '#e5534b',
  hint: '#f2c94c',
  timerFull: '#58d68d',
  timerLow: '#e5534b',
  button: '#2c2450',
  buttonLine: '#5a4d94',
  star1: '#8a7cc0',
  star2: '#c9b458',
  star3: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'lantern-lane.best';
