// Everything the player sees, painted on one canvas: the header with the
// counter the brief asks for, the two panels side by side, the rings on the
// differences found, the hint pulse, the timer bar, and the four screens
// (title, paused, round clear, game over / final). The judge reads the game
// mostly through its screenshots, so the play screen carries everything at a
// glance: both pictures, the rings, the unfound differences still hiding, and
// "LEFT: n" in the header.

import { FIELD, PANEL, HEADER, FOOTER, PALETTE, FONT, LOW_TIME_SECONDS } from './config.js';
import { ROUNDS } from './differences.js';
import { drawScene } from './scene.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_CLEAR = 3;
export const SCREEN_OVER = 4;
export const SCREEN_FINAL = 5;

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function panelOrigin(panel) {
  return panel === 0 ? PANEL.leftX : PANEL.rightX;
}

function drawFoundRing(ctx, x, y, time) {
  const pulse = 1 + 0.05 * Math.sin(time * 4);
  ctx.strokeStyle = PALETTE.foundRing;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, 26 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.found;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 3, y + 8);
  ctx.lineTo(x + 11, y - 8);
  ctx.stroke();
}

function drawHintRing(ctx, x, y, time) {
  const r = 24 + 6 * Math.sin(time * 6);
  ctx.strokeStyle = PALETTE.hint;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMiss(ctx, x, y, age) {
  const alpha = Math.max(0, 1 - age / 0.7);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = PALETTE.miss;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 11);
  ctx.lineTo(x + 11, y + 11);
  ctx.moveTo(x + 11, y - 11);
  ctx.lineTo(x - 11, y + 11);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawReticle(ctx, x, y) {
  ctx.strokeStyle = '#f5efdd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x, y + 20);
  ctx.stroke();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = { x: 1, y: 1 };
  let viewWidth = FIELD.width;
  let viewHeight = FIELD.height;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewWidth = Math.max(320, Math.round(rect.width));
    viewHeight = Math.max(180, Math.round(rect.height));
    canvas.width = Math.round(viewWidth * dpr);
    canvas.height = Math.round(viewHeight * dpr);
    scale.x = canvas.width / FIELD.width;
    scale.y = canvas.height / FIELD.height;
  }

  function drawHeader(state, screen) {
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, 0, FIELD.width, HEADER.height);
    ctx.fillStyle = PALETTE.headerLine;
    ctx.fillRect(0, HEADER.height - 2, FIELD.width, 2);
    text(ctx, 'LANTERN LANE', 24, 24, 26, PALETTE.gold);
    text(ctx, 'spot the difference', 24, 48, 13, PALETTE.muted, 'left', 'normal');
    const round = ROUNDS[state.roundIndex];
    text(ctx, round.name, FIELD.width / 2, 26, 18, PALETTE.text, 'center');
    const left = round.diffs.length - state.found.size;
    text(ctx, `FOUND ${state.found.size}/${round.diffs.length}`, FIELD.width / 2, 48, 13, PALETTE.muted, 'center', 'normal');
    // The counter the brief asks for: how many remain, big and gold.
    text(ctx, `${left} LEFT`, FIELD.width - 220, 26, 28, left === 0 ? PALETTE.found : PALETTE.gold, 'right');
    text(ctx, `SCORE ${state.score}`, FIELD.width - 24, 26, 16, PALETTE.text, 'right');
    const seconds = Math.max(0, Math.ceil(state.timeLeft));
    const mm = String(Math.floor(seconds / 60));
    const ss = String(seconds % 60).padStart(2, '0');
    const low = seconds <= LOW_TIME_SECONDS && screen === SCREEN_PLAY;
    text(ctx, `${mm}:${ss}`, FIELD.width - 24, 48, 14, low ? PALETTE.timerLow : PALETTE.muted, 'right', 'normal');
    // Timer bar, full width under the header: the time pressure, felt in frame.
    const frac = Math.max(0, Math.min(1, state.timeLeft / round.seconds));
    ctx.fillStyle = '#241d47';
    ctx.fillRect(0, HEADER.height, FIELD.width, 8);
    ctx.fillStyle = low ? PALETTE.timerLow : PALETTE.timerFull;
    ctx.fillRect(0, HEADER.height, FIELD.width * frac, 8);
  }

  function drawFooter(state) {
    ctx.fillStyle = PALETTE.header;
    ctx.fillRect(0, FOOTER.y, FIELD.width, FOOTER.height);
    ctx.fillStyle = PALETTE.headerLine;
    ctx.fillRect(0, FOOTER.y, FIELD.width, 2);
    const hintLabel = state.hintsLeft > 0 ? `H — Hint (${state.hintsLeft} left, −50)` : 'H — No hints left';
    text(ctx, hintLabel, 24, FOOTER.y + 19, 14, PALETTE.muted, 'left', 'normal');
    text(ctx, 'Arrows move · Enter mark · P pause · M mute', FIELD.width / 2, FOOTER.y + 19, 14, PALETTE.muted, 'center', 'normal');
    text(ctx, `BEST ${state.best}`, FIELD.width - 24, FOOTER.y + 19, 14, PALETTE.muted, 'right', 'normal');
  }

  function drawPanels(state, time) {
    const round = ROUNDS[state.roundIndex];
    // The right panel is the same street with every difference of the round
    // applied — comparing the two pictures is the game. The left stays plain.
    const mods = new Set(round.diffs.map((d) => d.id));
    // Left panel: the plain street. Right panel: the same street with the
    // found differences applied, so a found ring always sits on a real change.
    for (let panel = 0; panel < 2; panel += 1) {
      const ox = panelOrigin(panel);
      ctx.save();
      ctx.translate(ox, PANEL.y);
      ctx.beginPath();
      ctx.rect(0, 0, PANEL.width, PANEL.height);
      ctx.clip();
      drawScene(ctx, state.roundIndex, panel === 0 ? new Set() : mods, time);
      ctx.restore();
      ctx.strokeStyle = PALETTE.panelFrame;
      ctx.lineWidth = 3;
      ctx.strokeRect(ox, PANEL.y, PANEL.width, PANEL.height);
      text(ctx, panel === 0 ? 'A' : 'B', ox + 14, PANEL.y + 22, 20, PALETTE.muted);
    }
    // Rings on the found differences, on both panels at once.
    for (const diff of round.diffs) {
      if (!state.found.has(diff.id)) continue;
      drawFoundRing(ctx, panelOrigin(0) + diff.x, PANEL.y + diff.y, time);
      drawFoundRing(ctx, panelOrigin(1) + diff.x, PANEL.y + diff.y, time);
    }
    // The hint pulse, on both panels.
    if (state.hint !== null) {
      const diff = round.diffs.find((d) => d.id === state.hint.id);
      if (diff !== undefined) {
        drawHintRing(ctx, panelOrigin(0) + diff.x, PANEL.y + diff.y, time);
        drawHintRing(ctx, panelOrigin(1) + diff.x, PANEL.y + diff.y, time);
      }
    }
    // Miss crosses, where the player clicked and found nothing.
    for (const miss of state.misses) {
      drawMiss(ctx, panelOrigin(miss.panel) + miss.x, PANEL.y + miss.y, miss.age);
    }
    // Keyboard reticle, mirrored across both panels.
    if (state.reticle !== null && (screen === SCREEN_PLAY || screen === SCREEN_TITLE)) {
      drawReticle(ctx, panelOrigin(0) + state.reticle.x, PANEL.y + state.reticle.y);
      drawReticle(ctx, panelOrigin(1) + state.reticle.x, PANEL.y + state.reticle.y);
    }
  }

  function dim() {
    ctx.fillStyle = 'rgba(16, 12, 32, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panelBox(title, lines, accent) {
    const w = 620;
    const h = 150 + lines.length * 34;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.fillStyle = '#1d1836';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    text(ctx, title, FIELD.width / 2, y + 48, 34, accent, 'center');
    lines.forEach((line, i) => {
      text(ctx, line, FIELD.width / 2, y + 100 + i * 34, 17, PALETTE.text, 'center', 'normal');
    });
    return { x, y, w, h };
  }

  function drawTitle(state) {
    dim();
    const box = panelBox('LANTERN LANE', [
      'Two pictures of the same night market. The right one hides 7 changes.',
      'Click a difference — on either picture — or move with the arrows',
      'and press Enter. Three rounds, 28 differences, one quiet street.',
      '',
      'Press Space or click to start  ·  H for a hint (−50)',
    ], PALETTE.gold);
    if (state.best > 0) {
      text(ctx, `BEST ${state.best}`, FIELD.width / 2, box.y + box.h - 28, 15, PALETTE.muted, 'center', 'normal');
    }
  }

  function drawPaused() {
    dim();
    panelBox('PAUSED', ['The lanterns wait for you.', '', 'Press P or Space to keep hunting.'], PALETTE.muted);
  }

  function drawClear(state) {
    dim();
    const round = ROUNDS[state.roundIndex];
    const bonus = Math.max(0, Math.ceil(state.timeLeft)) * 2;
    panelBox('ROUND CLEAR!', [
      `${round.diffs.length} differences found — every one of them.`,
      `Time bonus +${bonus}  ·  Round score ${state.roundScore}`,
      '',
      state.roundIndex < ROUNDS.length - 1 ? 'Press N for the next round.' : 'Press N for the final tally.',
    ], PALETTE.found);
  }

  function drawOver(state) {
    dim();
    const round = ROUNDS[state.roundIndex];
    panelBox("TIME'S UP", [
      `You found ${state.found.size} of ${round.diffs.length} differences.`,
      'The unfound ones are still hiding in the right picture.',
      '',
      'Press R to try this round again.',
    ], PALETTE.miss);
  }

  function drawFinal(state) {
    dim();
    const stars = state.score >= 3200 ? 3 : state.score >= 2400 ? 2 : 1;
    const starRow = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    panelBox('THE LANE IS QUIET', [
      `All 28 differences found. Final score ${state.score}.`,
      starRow,
      `Best ${Math.max(state.best, state.score)}`,
      '',
      'Press R to hunt the lane again.',
    ], PALETTE.gold);
  }

  return {
    resize,
    draw(state, screen, time) {
      ctx.setTransform(scale.x, 0, 0, scale.y, 0, 0);
      ctx.fillStyle = PALETTE.backdrop;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      drawHeader(state, screen);
      drawPanels(state, time);
      drawFooter(state);
      if (screen === SCREEN_TITLE) drawTitle(state);
      else if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_CLEAR) drawClear(state);
      else if (screen === SCREEN_OVER) drawOver(state);
      else if (screen === SCREEN_FINAL) drawFinal(state);
    },
  };
}
