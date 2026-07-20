#!/usr/bin/env node
// Usage: node generate-palette.js "#3B6FE8"
// Output: JSON with all palette values

function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return '#' + [r, g, b]
    .map(x => Math.round(x * 255).toString(16).padStart(2, '0'))
    .join('');
}

// Lightness curve per stop — calibrated for readability and contrast
const LIGHTNESS = {
  50: 97, 100: 94, 200: 87, 300: 78,
  400: 66, 500: 54, 600: 43, 700: 35,
  800: 27, 900: 20, 950: 14
};

// Saturation weight per stop (relative to peak)
const SAT_WEIGHT = {
  50: 0.10, 100: 0.20, 200: 0.38, 300: 0.58,
  400: 0.82, 500: 1.00, 600: 1.00, 700: 0.95,
  800: 0.85, 900: 0.70, 950: 0.58
};

function generateScale(hue, peakSaturation) {
  const scale = {};
  for (const stop of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    const s = Math.min(peakSaturation * SAT_WEIGHT[stop], 100);
    scale[stop] = hslToHex(hue, s, LIGHTNESS[stop]);
  }
  return scale;
}

const inputHex = process.argv[2];
if (!inputHex) {
  console.error('Usage: node generate-palette.js "#3B6FE8"');
  process.exit(1);
}

const [h, s] = hexToHsl(inputHex);

// Secondary: split-complementary (+210°) — harmonious but distinct
// Adjust saturation slightly lower to avoid competition with primary
const secondaryHue = (h + 210) % 360;
const secondaryS = Math.min(s * 0.88, 85);

// Neutral: use primary hue with very low saturation for warm/cool neutrals
const neutralS = Math.min(s * 0.12, 8);

// Semantic colors: fixed hues, saturation adapts to primary vibrancy
// This ensures they feel part of the same palette family
const vibrancy = Math.min(s, 80); // cap vibrancy to avoid overly electric semantics

const palette = {
  primary:   generateScale(h,             s),
  secondary: generateScale(secondaryHue,  secondaryS),
  neutral:   generateScale(h,             neutralS),
  success:   generateScale(142,           vibrancy * 0.80),
  warning:   generateScale(38,            vibrancy * 0.90),
  error:     generateScale(4,             vibrancy * 0.92),
  info:      generateScale(214,           vibrancy * 0.82),
};

// Meta: useful for deciding semantic defaults
const meta = {
  inputHex,
  inputHue: Math.round(h),
  inputSaturation: Math.round(s),
  secondaryHue: Math.round(secondaryHue),
  // Recommended 500-stop as "base" reference
  primaryBase: palette.primary[500],
  secondaryBase: palette.secondary[500],
};

console.log(JSON.stringify({ meta, palette }, null, 2));
