// Lantern Lane's street, drawn fresh from code every frame: no image files, no
// network, nothing borrowed. The same street is drawn twice — once plain for
// the left panel, once with the round's differences applied for the right — so
// the two pictures are near-identical by construction and every difference is
// exactly where differences.js says it is.
//
// `mods` is a Set of difference ids to apply. `time` drives the gentle sway
// of the lanterns and the pulse of the bulbs; screenshot scenes pass 0 so the
// frame is the same every time.

import { createRandom } from './random.js';

const SKY_TOP = '#1b1740';
const SKY_BOTTOM = '#3a2a5e';

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

const LANTERN_X = [90, 200, 310, 420, 520];
const LANTERN_COLORS = ['#e5534b', '#f2c94c', '#e5534b', '#2a9d8f', '#e5534b'];
const BULB_X = [60, 130, 200, 270, 340, 410, 480, 550];

function drawSky(ctx, rng, mods) {
  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 360);
  // Stars, seeded so the same round always shows the same sky.
  ctx.fillStyle = '#f5efdd';
  for (let i = 0; i < 42; i += 1) {
    const x = 12 + rng() * 576;
    const y = 10 + rng() * 160;
    const r = 0.8 + rng() * 1.6;
    circle(ctx, x, y, r);
  }
  if (mods.has('star-extra')) circle(ctx, 250, 58, 2.2);
  // Clouds.
  ctx.fillStyle = 'rgba(120, 100, 170, 0.55)';
  ellipse(ctx, 300, 58, 46, 12);
  ellipse(ctx, 322, 52, 30, 10);
  if (mods.has('cloud-extra')) {
    ellipse(ctx, 480, 108, 42, 11);
    ellipse(ctx, 500, 102, 28, 9);
  }
  // The moon: a crescent by default, full when the difference says so.
  ctx.fillStyle = '#f5e9c8';
  circle(ctx, 90, 70, 32);
  if (mods.has('moon-crater')) {
    ctx.fillStyle = '#d9cba4';
    circle(ctx, 96, 62, 5);
    circle(ctx, 80, 78, 4);
    circle(ctx, 102, 80, 3);
  } else {
    ctx.fillStyle = SKY_TOP;
    circle(ctx, 102, 62, 28);
  }
}

function drawStringLights(ctx, mods, time) {
  ctx.strokeStyle = '#241a38';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, 138);
  ctx.quadraticCurveTo(300, 152, 592, 138);
  ctx.stroke();
  for (let i = 0; i < BULB_X.length; i += 1) {
    const x = BULB_X[i];
    const y = 146 + Math.sin((x / 600) * Math.PI) * 4;
    const dark = mods.has('bulb-dark') && i === 2;
    if (!dark) {
      const glow = 0.5 + 0.3 * Math.sin(time * 2 + i);
      ctx.fillStyle = `rgba(242, 201, 76, ${0.25 * glow})`;
      circle(ctx, x, y + 6, 12);
    }
    ctx.fillStyle = dark ? '#3a3355' : '#f2c94c';
    circle(ctx, x, y + 6, 4.5);
  }
}

function drawLantern(ctx, x, color, tall, tasselLong, time, index) {
  const sway = Math.sin(time * 0.9 + index * 1.3) * 2;
  const top = 150;
  const w = 44;
  const h = tall ? 74 : 56;
  ctx.save();
  ctx.translate(x + sway, 0);
  line(ctx, 0, top - 8, 0, top, 2, '#241a38');
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(-7, top - 2, 14, 5);
  // Paper body: vertical ribs over a warm glow.
  const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  grad.addColorStop(0, color);
  grad.addColorStop(0.5, '#ffd98a');
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, top + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60, 20, 20, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, top + h / 2, (w / 2) * Math.abs(i) * 0.55 + 4, h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(-7, top + h - 2, 14, 5);
  // Tassel.
  const tassel = tasselLong ? 26 : 14;
  line(ctx, 0, top + h + 3, 0, top + h + 3 + tassel, 3, '#e5534b');
  ctx.restore();
}

function drawLanterns(ctx, mods, time) {
  for (let i = 0; i < LANTERN_X.length; i += 1) {
    let color = LANTERN_COLORS[i];
    if (mods.has('lantern-green') && i === 2) color = '#2a9d8f';
    drawLantern(ctx, LANTERN_X[i], color, mods.has('lantern-tall') && i === 0, mods.has('lantern-tassel') && i === 3, time, i);
  }
}

function drawBunting(ctx, mods) {
  line(ctx, 16, 204, 584, 204, 2, '#241a38');
  const colors = ['#f2c94c', '#e5534b', '#2a9d8f', '#e5534b', '#f2c94c', '#2a9d8f'];
  for (let i = 0; i < 12; i += 1) {
    const x = 30 + i * 47;
    let color = colors[i % colors.length];
    if (mods.has('bunting-blue') && i === 5) color = '#4a7dd4';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, 206);
    ctx.lineTo(x + 34, 206);
    ctx.lineTo(x + 17, 232);
    ctx.closePath();
    ctx.fill();
    if (mods.has('flag-pattern') && i === 7) {
      // The dotted flag keeps its dot in the plain panel only.
    } else if (i === 7) {
      ctx.fillStyle = '#241a38';
      circle(ctx, x + 17, 214, 3);
    }
  }
}

function drawAwning(ctx, x, w, colorA, colorB, stripes, scallopMissing) {
  const stripeW = w / stripes;
  for (let i = 0; i < stripes; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? colorA : colorB;
    ctx.fillRect(x + i * stripeW, 250, stripeW + 1, 34);
  }
  ctx.fillStyle = colorA;
  for (let i = 0; i < stripes; i += 1) {
    if (scallopMissing && i === 3) continue;
    ctx.beginPath();
    ctx.arc(x + i * stripeW + stripeW / 2, 284, stripeW / 2, 0, Math.PI);
    ctx.fill();
  }
  line(ctx, x, 250, x + w, 250, 3, '#241a38');
}

function drawLeftStall(ctx, mods) {
  drawAwning(ctx, 40, 240, '#e5534b', '#f5efdd', mods.has('awning-stripes') ? 4 : 5, false);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(48, 284, 10, 100);
  ctx.fillRect(262, 284, 10, 100);
  // Counter and crates.
  ctx.fillStyle = '#7a5638';
  ctx.fillRect(44, 380, 232, 16);
  ctx.fillStyle = '#5d4128';
  ctx.fillRect(44, 396, 232, 74);
  line(ctx, 44, 396, 276, 396, 2, '#3d2a18');
  // Crate of oranges: five in the plain panel, four when one is missing.
  const oranges = mods.has('fruit-count') ? [70, 105, 175, 210] : [70, 105, 140, 175, 210];
  ctx.fillStyle = '#8a6a42';
  ctx.fillRect(58, 356, 168, 24);
  for (const ox of oranges) {
    ctx.fillStyle = '#f08a24';
    circle(ctx, ox, 372, 11);
    if (!mods.has('fruit-stem') || ox !== 200) {
      line(ctx, ox, 361, ox + 3, 354, 2, '#2a9d8f');
    }
  }
}

function drawSign(ctx, mods) {
  line(ctx, 360, 300, 360, 316, 3, '#241a38');
  ctx.fillStyle = '#7a5638';
  rr(ctx, 322, 316, 76, 48, 6);
  if (!mods.has('sign-border')) {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 2;
    ctx.strokeRect(326, 320, 68, 40);
  }
  ctx.fillStyle = '#f5efdd';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (mods.has('sign-letter')) {
    ctx.fillText('B', 360, 341);
  } else if (mods.has('sign-glyph')) {
    circle(ctx, 360, 340, 10);
  } else {
    // A five-point star.
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const r = i % 2 === 0 ? 12 : 5;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = 360 + r * Math.cos(a);
      const py = 340 + r * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawCat(ctx, mods) {
  const x = 150;
  const y = 428;
  // Tail: curled up in the plain panel, drooping when the difference says so.
  ctx.strokeStyle = '#3a3345';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mods.has('cat-tail')) {
    ctx.moveTo(x + 26, y + 18);
    ctx.quadraticCurveTo(x + 44, y + 22, x + 40, y + 42);
  } else {
    ctx.moveTo(x + 26, y + 18);
    ctx.quadraticCurveTo(x + 46, y + 8, x + 42, y - 14);
  }
  ctx.stroke();
  // Body and head.
  ctx.fillStyle = '#3a3345';
  ellipse(ctx, x, y + 16, 26, 20);
  circle(ctx, x - 6, y - 8, 16);
  ctx.beginPath();
  ctx.moveTo(x - 18, y - 18);
  ctx.lineTo(x - 14, y - 32);
  ctx.lineTo(x - 6, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 20);
  ctx.lineTo(x + 8, y - 32);
  ctx.lineTo(x + 12, y - 18);
  ctx.closePath();
  ctx.fill();
  // Eyes: open dots, or closed curves.
  if (mods.has('cat-eyes')) {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x - 12, y - 10, 4, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 1, y - 10, 4, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#f2c94c';
    circle(ctx, x - 12, y - 10, 2.5);
    circle(ctx, x - 1, y - 10, 2.5);
  }
  // Whiskers, unless the difference took them.
  if (!mods.has('cat-whiskers')) {
    ctx.strokeStyle = 'rgba(245, 239, 221, 0.8)';
    ctx.lineWidth = 1;
    line(ctx, x - 20, y - 4, x - 34, y - 8, 1, 'rgba(245, 239, 221, 0.8)');
    line(ctx, x - 20, y - 1, x - 34, y + 1, 1, 'rgba(245, 239, 221, 0.8)');
  }
}

function drawRightStall(ctx, mods) {
  drawAwning(ctx, 330, 240, '#2a9d8f', '#f5efdd', 5, mods.has('awning-scallop'));
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(338, 284, 10, 100);
  ctx.fillRect(552, 284, 10, 100);
  ctx.fillStyle = '#7a5638';
  ctx.fillRect(334, 380, 232, 16);
  ctx.fillStyle = '#5d4128';
  ctx.fillRect(334, 396, 232, 74);
  line(ctx, 334, 396, 566, 396, 2, '#3d2a18');
  // Jars: three in the plain panel, two when one is missing.
  const jars = mods.has('jars-count') ? [400, 460] : [400, 440, 480];
  for (const jx of jars) {
    ctx.fillStyle = '#c9d6e8';
    rr(ctx, jx - 13, 356, 26, 26, 5);
    ctx.fillStyle = '#8a9db5';
    ctx.fillRect(jx - 13, 368, 26, 6);
    if (!mods.has('jar-lid') || jx !== 480) {
      ctx.fillStyle = '#e5534b';
      ctx.fillRect(jx - 14, 350, 28, 7);
    }
  }
  // Bicycle leaning on the right stall: pale lavender frame and wheels, so it
  // reads against the dark cobbles instead of vanishing into them.
  const bike = '#c9b8f0';
  ctx.strokeStyle = bike;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(500, 522, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(556, 522, 26, 0, Math.PI * 2);
  ctx.stroke();
  if (!mods.has('bike-spokes')) {
    line(ctx, 500, 496, 500, 548, 2, bike);
    line(ctx, 474, 522, 526, 522, 2, bike);
  }
  line(ctx, 500, 522, 528, 486, 3, bike);
  line(ctx, 556, 522, 528, 486, 3, bike);
  line(ctx, 528, 486, 512, 470, 3, bike);
  line(ctx, 512, 470, 492, 470, 3, bike);
  if (!mods.has('bike-bell')) {
    ctx.fillStyle = '#f2c94c';
    circle(ctx, 502, 466, 5);
  }
}

function drawGround(ctx, rng, mods, time) {
  ctx.fillStyle = '#2c2140';
  ctx.fillRect(0, 470, 600, 118);
  ctx.fillStyle = '#3a2d55';
  for (let row = 0; row < 4; row += 1) {
    for (let col = -1; col < 9; col += 1) {
      const x = col * 72 + (row % 2 === 0 ? 0 : 36) + rng() * 6;
      const y = 482 + row * 26 + rng() * 4;
      const dark = mods.has('cobble-stone') && row === 2 && col === 3;
      ctx.fillStyle = dark ? '#241a38' : '#3a2d55';
      ellipse(ctx, x + 30, y + 8, 30, 10);
    }
  }
  // Puddle with the moon's reflection — unless the difference dried it up
  // or took the moon out of it.
  if (!mods.has('puddle-gone')) {
    ctx.fillStyle = 'rgba(120, 140, 200, 0.35)';
    ellipse(ctx, 420, 542, 70, 13);
    if (!mods.has('puddle-moon')) {
      ctx.fillStyle = 'rgba(245, 233, 200, 0.5)';
      ellipse(ctx, 408, 541, 12, 4);
    }
  }
  // Potted plant.
  ctx.fillStyle = '#b5563c';
  ctx.beginPath();
  ctx.moveTo(534, 522);
  ctx.lineTo(566, 522);
  ctx.lineTo(560, 552);
  ctx.lineTo(540, 552);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a9d8f';
  ctx.lineWidth = 4;
  const leaves = mods.has('plant-leaves') ? 4 : 3;
  for (let i = 0; i < leaves; i += 1) {
    const a = -Math.PI / 2 + (i - (leaves - 1) / 2) * 0.5;
    line(ctx, 550, 524, 550 + Math.cos(a) * 22, 524 + Math.sin(a) * 22, 4, '#2a9d8f');
  }
}

/** Draw the whole street for one panel. `roundIndex` picks the seed. */
export function drawScene(ctx, roundIndex, mods, time) {
  const seeds = [11, 23, 37];
  const rng = createRandom(seeds[roundIndex] * 7919 + 5);
  ctx.save();
  drawSky(ctx, rng, mods);
  // Rooftops behind the stalls.
  ctx.fillStyle = '#241d47';
  ctx.beginPath();
  ctx.moveTo(0, 340);
  ctx.lineTo(0, 250);
  ctx.lineTo(120, 250);
  ctx.lineTo(120, 290);
  ctx.lineTo(300, 290);
  ctx.lineTo(300, 240);
  ctx.lineTo(470, 240);
  ctx.lineTo(470, 300);
  ctx.lineTo(600, 300);
  ctx.lineTo(600, 340);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2c94c';
  for (const wx of [60, 200, 340, 500]) {
    ctx.fillRect(wx, 268, 14, 18);
  }
  drawStringLights(ctx, mods, time);
  drawLanterns(ctx, mods, time);
  drawBunting(ctx, mods);
  drawLeftStall(ctx, mods);
  drawRightStall(ctx, mods);
  drawSign(ctx, mods);
  drawCat(ctx, mods);
  drawGround(ctx, rng, mods, time);
  ctx.restore();
}
