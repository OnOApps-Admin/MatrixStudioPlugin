#!/usr/bin/env node
// Usage: node generate-scale.js
// Outputs: JSON with all scale values + full token map

// ─── Base scale ────────────────────────────────────────────────────────────
// Rule: 4px base unit. Small steps +2, then +4, then +8, then doubles.
// These are pixel values — the variable names match them exactly (e.g. scale/16 = 16).
const SCALE = [
  0,
  2,
  4,
  8,
  12,
  16,
  20,
  24,
  32,
  40,
  48,
  56,
  64,
  80,
  96,
  128,
  160,
  192,
  256,
  320,
  384,
  512,
];

// Special values outside the grid — always needed, never derived
const SPECIAL = {
  1:    1,      // hairline: border-width, dividers, separators
  full: 9999,   // pill: fully rounded radius
};

// ─── Token categories ───────────────────────────────────────────────────────
// Each category maps semantic token names → scale values (numbers).
// "alias" = true means the semantic value is a variable alias to scale/{n}.
// "alias" = false means it's a hardcoded float (for opacity and full/hairline specials).

const CATEGORIES = {

  // Spacing: gaps between elements (auto-layout gap)
  spacing: {
    scope: ['GAP'],
    tokens: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128],
    toName: (v) => `spacing/${v}`,
    toRef:  (v) => `scale/${v}`,
  },

  // Padding: inner padding of containers
  padding: {
    scope: ['HORIZONTAL_PADDING', 'VERTICAL_PADDING'],
    tokens: [0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128],
    toName: (v) => `padding/${v}`,
    toRef:  (v) => `scale/${v}`,
  },

  // Radius: corner radius
  radius: {
    scope: ['CORNER_RADIUS'],
    tokens: [0, 2, 4, 8, 12, 16, 24, 32],
    toName: (v) => `radius/${v}`,
    toRef:  (v) => `scale/${v}`,
    extras: [
      // Hardcoded specials
      { name: 'radius/1',    value: 1,    ref: 'scale/1',    alias: true },
      { name: 'radius/full', value: 9999, ref: 'scale/full', alias: true },
    ],
  },

  // Border width: stroke weight
  border: {
    scope: ['STROKE_WEIGHT'],
    tokens: [2, 4, 8],
    toName: (v) => `border/${v}`,
    toRef:  (v) => `scale/${v}`,
    extras: [
      { name: 'border/1', value: 1, ref: 'scale/1', alias: true },
    ],
  },

  // Size: fixed width/height for components (icons, avatars, controls)
  size: {
    scope: ['WIDTH', 'HEIGHT'],
    tokens: [16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 128, 160, 192, 256, 320, 384, 512],
    toName: (v) => `size/${v}`,
    toRef:  (v) => `scale/${v}`,
  },

  // Opacity: float 0–1, not aliases to scale (different unit)
  // Named by percentage for readability: opacity/50 = 0.5
  opacity: {
    scope: ['OPACITY'],
    tokens: [],  // handled separately below
    hardcoded: [
      { name: 'opacity/0',   value: 0.00 },
      { name: 'opacity/5',   value: 0.05 },
      { name: 'opacity/10',  value: 0.10 },
      { name: 'opacity/20',  value: 0.20 },
      { name: 'opacity/25',  value: 0.25 },
      { name: 'opacity/30',  value: 0.30 },
      { name: 'opacity/40',  value: 0.40 },
      { name: 'opacity/50',  value: 0.50 },
      { name: 'opacity/60',  value: 0.60 },
      { name: 'opacity/70',  value: 0.70 },
      { name: 'opacity/75',  value: 0.75 },
      { name: 'opacity/80',  value: 0.80 },
      { name: 'opacity/90',  value: 0.90 },
      { name: 'opacity/100', value: 1.00 },
    ],
  },
};

// ─── Build output ───────────────────────────────────────────────────────────
const output = {
  primitives: {
    scale: {},
    special: SPECIAL,
  },
  tokens: {},
  meta: {
    totalPrimitives: SCALE.length + Object.keys(SPECIAL).length,
  },
};

// Primitives
for (const v of SCALE) {
  output.primitives.scale[v] = v;
}

// Semantic tokens per category
let totalTokens = 0;
for (const [cat, def] of Object.entries(CATEGORIES)) {
  const entries = [];

  if (def.hardcoded) {
    // Opacity: pure hardcoded floats
    for (const item of def.hardcoded) {
      entries.push({ name: item.name, value: item.value, alias: false, scope: def.scope });
      totalTokens++;
    }
  } else {
    // Grid-aliased tokens
    for (const v of def.tokens) {
      entries.push({ name: def.toName(v), value: v, ref: def.toRef(v), alias: true, scope: def.scope });
      totalTokens++;
    }
    // Extras (specials like hairline and full)
    for (const extra of (def.extras || [])) {
      entries.push({ ...extra, scope: def.scope });
      totalTokens++;
    }
  }

  output.tokens[cat] = entries;
}

output.meta.totalTokens = totalTokens;

console.log(JSON.stringify(output, null, 2));
