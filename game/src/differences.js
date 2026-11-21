// The three rounds of Lantern Lane. Each round is one night at the market, drawn
// from the same street with a different seed, and a set of differences the right
// panel hides from the left. A difference is an id (what changes), a label (what
// the end screen names), and an anchor in panel coordinates where a click counts
// and where the found ring is drawn. Anchors inside a round sit at least 60 px
// apart so a click can only ever mean one difference.
//
// Difficulty climbs the way the brief asks: round 1 hides 7 plain changes with
// 180 seconds, round 2 hides 9 smaller ones with 150, round 3 hides 12, several
// of them a single brushstroke, with 120. Twenty-eight finds in all, so the hunt
// is still going after the tenth find.

export const ROUNDS = [
  {
    name: 'Round 1 · Dusk Market',
    seed: 11,
    seconds: 180,
    diffs: [
      { id: 'moon-full', label: 'The moon turned full', x: 90, y: 70 },
      { id: 'lantern-green', label: 'A lantern changed colour', x: 310, y: 178 },
      { id: 'cat-tail', label: "The cat's tail dropped", x: 186, y: 448 },
      { id: 'awning-stripes', label: 'An awning lost a stripe', x: 160, y: 276 },
      { id: 'fruit-count', label: 'An orange went missing', x: 148, y: 402 },
      { id: 'sign-glyph', label: 'The shop sign changed', x: 360, y: 340 },
      { id: 'bike-bell', label: 'The bicycle lost its bell', x: 502, y: 478 },
    ],
  },
  {
    name: 'Round 2 · Lantern Parade',
    seed: 23,
    seconds: 150,
    diffs: [
      { id: 'star-extra', label: 'A new star appeared', x: 250, y: 58 },
      { id: 'lantern-tall', label: 'A lantern grew taller', x: 90, y: 178 },
      { id: 'bunting-blue', label: 'A flag turned blue', x: 250, y: 214 },
      { id: 'cat-eyes', label: 'The cat closed its eyes', x: 150, y: 424 },
      { id: 'jars-count', label: 'A jar went missing', x: 430, y: 400 },
      { id: 'puddle-gone', label: 'The puddle dried up', x: 420, y: 542 },
      { id: 'plant-leaves', label: 'The plant grew a leaf', x: 552, y: 502 },
      { id: 'bulb-dark', label: 'A bulb went dark', x: 200, y: 148 },
      { id: 'sign-letter', label: 'The sign letter changed', x: 360, y: 340 },
    ],
  },
  {
    name: 'Round 3 · Festival Dawn',
    seed: 37,
    seconds: 120,
    diffs: [
      { id: 'cloud-extra', label: 'A cloud drifted in', x: 480, y: 108 },
      { id: 'moon-crater', label: 'A crater appeared on the moon', x: 96, y: 62 },
      { id: 'lantern-tassel', label: 'A tassel grew longer', x: 420, y: 206 },
      { id: 'awning-scallop', label: 'An awning scallop vanished', x: 452, y: 300 },
      { id: 'fruit-stem', label: 'An orange lost its stem', x: 200, y: 392 },
      { id: 'cat-whiskers', label: "The cat's whiskers vanished", x: 132, y: 430 },
      { id: 'bike-spokes', label: 'A wheel lost a spoke', x: 532, y: 520 },
      { id: 'cobble-stone', label: 'A cobble changed colour', x: 300, y: 562 },
      { id: 'flag-pattern', label: 'A flag lost its dot', x: 352, y: 214 },
      { id: 'jar-lid', label: 'A jar lost its lid', x: 482, y: 384 },
      { id: 'puddle-moon', label: 'The moon left the puddle', x: 420, y: 556 },
      { id: 'sign-border', label: 'The sign lost its border', x: 388, y: 318 },
    ],
  },
];

export const TOTAL_DIFFS = ROUNDS.reduce((sum, round) => sum + round.diffs.length, 0);
