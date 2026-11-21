// Keyboard and pointer input. Held keys move the reticle; one-shot presses
// (confirm, hint, pause, restart, next, mute) are queued as bit flags and
// taken once by the loop, so a press between two frames is never lost and
// never counted twice. A click marks the difference under the pointer on
// either panel; the loop reads it the same way it reads the reticle.

import { PANEL, HIT_RADIUS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_HINT = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_NEXT = 16;
export const ACTION_MUTE = 32;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Space', 'Enter']);
const HINT = new Set(['KeyH']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const NEXT = new Set(['KeyN']);
const MUTE = new Set(['KeyM']);

export function createInput(canvas) {
  let left = false;
  let right = false;
  let up = false;
  let down = false;
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (NEXT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_NEXT;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of
  // everything on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    up = false;
    down = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    // Which panel, if any, did the click land on? Panel-local coordinates.
    let panel = -1;
    let px = 0;
    if (x >= PANEL.leftX && x < PANEL.leftX + PANEL.width && y >= PANEL.y && y < PANEL.y + PANEL.height) {
      panel = 0;
      px = x - PANEL.leftX;
    } else if (x >= PANEL.rightX && x < PANEL.rightX + PANEL.width && y >= PANEL.y && y < PANEL.y + PANEL.height) {
      panel = 1;
      px = x - PANEL.rightX;
    }
    if (panel >= 0) click = { panel, x: px, y: y - PANEL.y };
    else actions |= ACTION_CONFIRM;
  });

  return {
    /** -1/0/1 on each axis, from the held arrow/WASD keys. */
    direction() {
      return {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0),
      };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The click since the last call, in panel-local coordinates, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}

/** The nearest unfound difference to a panel-local point, or null. */
export function pickDifference(diffs, found, x, y) {
  let best = null;
  let bestDist = HIT_RADIUS;
  for (const diff of diffs) {
    if (found.has(diff.id)) continue;
    const dist = Math.hypot(diff.x - x, diff.y - y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = diff;
    }
  }
  return best;
}
