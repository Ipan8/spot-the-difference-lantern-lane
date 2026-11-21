// The screenshot scenes behind ?shot=start|play|end|round2. Each one sets the
// real game state to a fixed moment — title, mid-hunt, round cleared, second
// round mid-hunt — with fixed scores and timers, so the frame is what a real
// game looks like and the same seed always gives the same frame. The play shot
// is the one the brief describes: rings on the differences found, several
// still unfound, and the counter showing how many remain.

import { SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { ROUNDS } from './differences.js';

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * Any other name is the title scene.
 */
export function stageShot(name, state) {
  if (name === 'play') {
    state.roundIndex = 0;
    state.found = new Set(['moon-full', 'lantern-green', 'cat-tail']);
    state.misses = [];
    state.hint = null;
    state.hintsLeft = 3;
    state.reticle = { x: 430, y: 400 };
    state.timeLeft = 142;
    state.score = 300;
    state.roundScore = 300;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    state.roundIndex = 0;
    state.found = new Set(ROUNDS[0].diffs.map((d) => d.id));
    state.misses = [];
    state.hint = null;
    state.hintsLeft = 2;
    state.reticle = null;
    state.timeLeft = 96;
    state.score = 892;
    state.roundScore = 700;
    return { screen: SCREEN_CLEAR };
  }
  if (name === 'round2') {
    state.roundIndex = 1;
    state.found = new Set(['star-extra', 'bulb-dark']);
    state.misses = [{ panel: 1, x: 300, y: 300, age: 0.2 }];
    state.hint = { id: 'jars-count', until: 2.5 };
    state.hintsLeft = 2;
    state.reticle = { x: 430, y: 400 };
    state.timeLeft = 121;
    state.score = 950;
    state.roundScore = 200;
    return { screen: SCREEN_PLAY };
  }
  state.roundIndex = 0;
  state.found = new Set();
  state.misses = [];
  state.hint = null;
  state.hintsLeft = 3;
  state.reticle = { x: 300, y: 294 };
  state.timeLeft = ROUNDS[0].seconds;
  state.score = 0;
  state.roundScore = 0;
  return { screen: SCREEN_TITLE };
}
