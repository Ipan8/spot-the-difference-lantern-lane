// Boot and the one loop: input is read every frame, the timer advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between six screens: title, play, paused, round clear, game over and final.
//
// ?seed=N fixes the scene. ?shot=start|play|end|round2 (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, HINTS_PER_ROUND, HINT_SECONDS, LOW_TIME_SECONDS, MISS_SECONDS, SCORE } from './config.js';
import { ROUNDS, TOTAL_DIFFS } from './differences.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, ACTION_RESTART, createInput, pickDifference } from './input.js';
import { createRenderer, SCREEN_CLEAR, SCREEN_FINAL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const RETICLE_SPEED = 520;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this
    // visit only.
  }
}

function createState() {
  return {
    roundIndex: 0,
    found: new Set(),
    misses: [],
    hint: null,
    hintsLeft: HINTS_PER_ROUND,
    reticle: { x: 300, y: 294 },
    timeLeft: ROUNDS[0].seconds,
    score: 0,
    roundScore: 0,
    best: readBest(),
  };
}

function runShot(name) {
  const state = createState();
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    renderer.draw(state, scene.screen, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const state = createState();
  let screen = SCREEN_TITLE;
  let accumulator = 0;
  let last = performance.now();
  let elapsed = 0;
  let lastWholeSecond = -1;

  // Screen readers (and anyone watching the page's text) hear the screen
  // changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function startRound(index) {
    state.roundIndex = index;
    state.found = new Set();
    state.misses = [];
    state.hint = null;
    state.hintsLeft = HINTS_PER_ROUND;
    state.reticle = { x: 300, y: 294 };
    state.timeLeft = ROUNDS[index].seconds;
    state.roundScore = 0;
    lastWholeSecond = -1;
    screen = SCREEN_PLAY;
    announce(`Playing ${ROUNDS[index].name}. Find ${ROUNDS[index].diffs.length} differences.`);
  }

  function startGame() {
    audio.unlock();
    state.score = 0;
    startRound(0);
  }

  function clearRound() {
    const bonus = Math.max(0, Math.ceil(state.timeLeft)) * SCORE.timeBonusPerSecond;
    state.roundScore += bonus;
    state.score += bonus;
    audio.roundClear();
    if (state.roundIndex >= ROUNDS.length - 1) {
      screen = SCREEN_FINAL;
      if (state.score > state.best) {
        state.best = state.score;
        saveBest(state.best);
      }
      announce(`All ${TOTAL_DIFFS} differences found. Final score ${state.score}.`);
    } else {
      screen = SCREEN_CLEAR;
      announce(`Round clear. Time bonus ${bonus}. Score ${state.score}.`);
    }
  }

  function timeUp() {
    audio.gameOver();
    screen = SCREEN_OVER;
    announce(`Time's up. You found ${state.found.size} of ${ROUNDS[state.roundIndex].diffs.length}.`);
  }

  function markAt(panel, x, y) {
    const round = ROUNDS[state.roundIndex];
    const diff = pickDifference(round.diffs, state.found, x, y);
    if (diff === null) {
      state.misses.push({ panel, x, y, age: 0 });
      state.score = Math.max(0, state.score + SCORE.wrongClick);
      state.roundScore = Math.max(0, state.roundScore + SCORE.wrongClick);
      audio.miss();
      return;
    }
    state.found.add(diff.id);
    state.score += SCORE.find;
    state.roundScore += SCORE.find;
    audio.found();
    const left = round.diffs.length - state.found.size;
    announce(`Found: ${diff.label}. ${left} left.`);
    if (left === 0) clearRound();
  }

  function useHint() {
    const round = ROUNDS[state.roundIndex];
    if (state.hintsLeft <= 0 || state.hint !== null) return;
    const remaining = round.diffs.filter((d) => !state.found.has(d.id));
    if (remaining.length === 0) return;
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    state.hint = { id: pick.id, until: HINT_SECONDS };
    state.hintsLeft -= 1;
    state.score = Math.max(0, state.score + SCORE.hint);
    state.roundScore = Math.max(0, state.roundScore + SCORE.hint);
    audio.hint();
    announce('Hint: look for the pulsing ring.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMuted();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_FINAL) {
      if (actions & ACTION_CONFIRM) startGame();
      else if (actions & ACTION_RESTART) startGame();
      return;
    }
    if (screen === SCREEN_CLEAR) {
      if (actions & (ACTION_CONFIRM | ACTION_NEXT)) {
        if (state.roundIndex < ROUNDS.length - 1) startRound(state.roundIndex + 1);
      } else if (actions & ACTION_RESTART) startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & ACTION_HINT) useHint();
    else if (actions & ACTION_RESTART) startRound(state.roundIndex);
  }

  function handleClicks() {
    const click = input.takeClick();
    if (click !== null && screen === SCREEN_PLAY) {
      audio.unlock();
      markAt(click.panel, click.x, click.y);
    } else if (click !== null && screen === SCREEN_TITLE) {
      startGame();
    }
  }

  function step() {
    const dir = input.direction();
    if (dir.x !== 0 || dir.y !== 0) {
      state.reticle.x = Math.max(0, Math.min(600, state.reticle.x + dir.x * RETICLE_SPEED * STEP));
      state.reticle.y = Math.max(0, Math.min(588, state.reticle.y + dir.y * RETICLE_SPEED * STEP));
    }
    if (screen !== SCREEN_PLAY) return;
    state.timeLeft -= STEP;
    const whole = Math.ceil(state.timeLeft);
    if (whole !== lastWholeSecond) {
      lastWholeSecond = whole;
      if (whole <= LOW_TIME_SECONDS && whole > 0) audio.tick();
    }
    for (const miss of state.misses) miss.age += STEP;
    state.misses = state.misses.filter((miss) => miss.age < MISS_SECONDS);
    if (state.hint !== null) {
      state.hint.until -= STEP;
      if (state.hint.until <= 0) state.hint = null;
    }
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      timeUp();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    elapsed += Math.min((now - last) / 1000, MAX_FRAME);
    handleActions();
    handleClicks();
    while (accumulator >= STEP && screen !== SCREEN_PAUSED) {
      step();
      accumulator -= STEP;
    }
    if (screen === SCREEN_PAUSED) accumulator = 0;
    renderer.draw(state, screen, elapsed);
  }

  // Leaving the tab pauses a running game rather than letting the clock run
  // down unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('resize', () => renderer.resize());
  renderer.resize();
  announce('Lantern Lane. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) {
  renderer.resize();
  runShot(shot);
} else {
  runGame();
}
