#!/usr/bin/env node
// Usage: node generate-type-system.js "Inter" "JetBrains Mono"
// Arg 1: primary typeface name
// Arg 2: monospace typeface (optional, defaults to "JetBrains Mono")
// Output: full type system config JSON

const primaryFont = process.argv[2];
const monoFont    = process.argv[3] || 'JetBrains Mono';

if (!primaryFont) {
  console.error('Usage: node generate-type-system.js "Inter" ["JetBrains Mono"]');
  process.exit(1);
}

// ─── Primitive scale values ─────────────────────────────────────────────────

const SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 60, 64, 72, 96];

const LINE_HEIGHTS = [100, 110, 120, 125, 130, 140, 150, 160];

const LETTER_SPACINGS = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];

const PARAGRAPH_SPACINGS = [0, 4, 8, 12, 16, 24];

// ─── Weights ────────────────────────────────────────────────────────────────
const WEIGHT_CONCEPTS = {
  thin:      { fallback: 'Thin',      numeric: 100 },
  light:     { fallback: 'Light',     numeric: 300 },
  regular:   { fallback: 'Regular',   numeric: 400 },
  medium:    { fallback: 'Medium',    numeric: 500 },
  semibold:  { fallback: 'SemiBold',  numeric: 600 },
  bold:      { fallback: 'Bold',      numeric: 700 },
  extrabold: { fallback: 'ExtraBold', numeric: 800 },
  black:     { fallback: 'Black',     numeric: 900 },
};

const ACTIVE_WEIGHTS = ['light', 'regular', 'medium', 'semibold', 'bold'];

// ─── Text style definitions ──────────────────────────────────────────────────
// Namespaced by platform: desktop/* and mobile/*
// Mobile: display/heading shrink significantly; body/label/code stay close to desktop.
// All sizes are from the SIZES array above — no values outside the scale.

const TEXT_STYLES = [

  // ════ DESKTOP ════════════════════════════════════════════════════════════

  // Display
  { name: 'desktop/display/2xl', platform: 'desktop', category: 'display', size: 96, lineHeight: 110, letterSpacing: -2,   paragraphSpacing: 0,  weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'desktop/display/xl',  platform: 'desktop', category: 'display', size: 72, lineHeight: 110, letterSpacing: -2,   paragraphSpacing: 0,  weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'desktop/display/lg',  platform: 'desktop', category: 'display', size: 60, lineHeight: 110, letterSpacing: -1.5, paragraphSpacing: 0,  weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'desktop/display/md',  platform: 'desktop', category: 'display', size: 48, lineHeight: 120, letterSpacing: -1,   paragraphSpacing: 0,  weight: 'semibold', typeface: 'primary', sample: 'Building something great' },
  { name: 'desktop/display/sm',  platform: 'desktop', category: 'display', size: 40, lineHeight: 120, letterSpacing: -0.5, paragraphSpacing: 0,  weight: 'semibold', typeface: 'primary', sample: 'Building something great' },

  // Heading
  { name: 'desktop/heading/2xl', platform: 'desktop', category: 'heading', size: 36, lineHeight: 125, letterSpacing: -0.5, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'desktop/heading/xl',  platform: 'desktop', category: 'heading', size: 32, lineHeight: 125, letterSpacing: -0.5, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'desktop/heading/lg',  platform: 'desktop', category: 'heading', size: 28, lineHeight: 130, letterSpacing: 0,    paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'desktop/heading/md',  platform: 'desktop', category: 'heading', size: 24, lineHeight: 130, letterSpacing: 0,    paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'desktop/heading/sm',  platform: 'desktop', category: 'heading', size: 20, lineHeight: 140, letterSpacing: 0,    paragraphSpacing: 0, weight: 'medium',   typeface: 'primary', sample: 'Section title goes here' },
  { name: 'desktop/heading/xs',  platform: 'desktop', category: 'heading', size: 18, lineHeight: 140, letterSpacing: 0,    paragraphSpacing: 0, weight: 'medium',   typeface: 'primary', sample: 'Section title goes here' },

  // Body
  { name: 'desktop/body/xl', platform: 'desktop', category: 'body', size: 20, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog. Clear, readable text.' },
  { name: 'desktop/body/lg', platform: 'desktop', category: 'body', size: 18, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog. Clear, readable text.' },
  { name: 'desktop/body/md', platform: 'desktop', category: 'body', size: 16, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog. Default body text.' },
  { name: 'desktop/body/sm', platform: 'desktop', category: 'body', size: 14, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 12, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'desktop/body/xs', platform: 'desktop', category: 'body', size: 12, lineHeight: 160, letterSpacing: 0.5, paragraphSpacing: 8,  weight: 'regular', typeface: 'primary', sample: 'Small body text. Captions and footnotes.' },

  // Label
  { name: 'desktop/label/xl', platform: 'desktop', category: 'label', size: 18, lineHeight: 140, letterSpacing: 0,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'desktop/label/lg', platform: 'desktop', category: 'label', size: 16, lineHeight: 140, letterSpacing: 0,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'desktop/label/md', platform: 'desktop', category: 'label', size: 14, lineHeight: 140, letterSpacing: 0.5, paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'desktop/label/sm', platform: 'desktop', category: 'label', size: 12, lineHeight: 140, letterSpacing: 1,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Badge · Tag · Caption' },
  { name: 'desktop/label/xs', platform: 'desktop', category: 'label', size: 11, lineHeight: 140, letterSpacing: 1.5, paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Overline · Micro label' },

  // Code
  { name: 'desktop/code/lg', platform: 'desktop', category: 'code', size: 16, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },
  { name: 'desktop/code/md', platform: 'desktop', category: 'code', size: 14, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },
  { name: 'desktop/code/sm', platform: 'desktop', category: 'code', size: 12, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },

  // ════ MOBILE ═════════════════════════════════════════════════════════════
  // Display: scaled down ~50% — screens are narrow, large type overwhelms
  // Heading: scaled down ~15–25%
  // Body/Label/Code: minimal change — readability floor stays the same

  // Display
  { name: 'mobile/display/2xl', platform: 'mobile', category: 'display', size: 48, lineHeight: 110, letterSpacing: -1,   paragraphSpacing: 0, weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'mobile/display/xl',  platform: 'mobile', category: 'display', size: 40, lineHeight: 110, letterSpacing: -1,   paragraphSpacing: 0, weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'mobile/display/lg',  platform: 'mobile', category: 'display', size: 36, lineHeight: 110, letterSpacing: -0.5, paragraphSpacing: 0, weight: 'bold',     typeface: 'primary', sample: 'Building something great' },
  { name: 'mobile/display/md',  platform: 'mobile', category: 'display', size: 32, lineHeight: 120, letterSpacing: -0.5, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Building something great' },
  { name: 'mobile/display/sm',  platform: 'mobile', category: 'display', size: 28, lineHeight: 120, letterSpacing: 0,    paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Building something great' },

  // Heading
  { name: 'mobile/heading/2xl', platform: 'mobile', category: 'heading', size: 28, lineHeight: 125, letterSpacing: 0, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'mobile/heading/xl',  platform: 'mobile', category: 'heading', size: 24, lineHeight: 125, letterSpacing: 0, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'mobile/heading/lg',  platform: 'mobile', category: 'heading', size: 20, lineHeight: 130, letterSpacing: 0, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'mobile/heading/md',  platform: 'mobile', category: 'heading', size: 18, lineHeight: 130, letterSpacing: 0, paragraphSpacing: 0, weight: 'semibold', typeface: 'primary', sample: 'Section title goes here' },
  { name: 'mobile/heading/sm',  platform: 'mobile', category: 'heading', size: 16, lineHeight: 140, letterSpacing: 0, paragraphSpacing: 0, weight: 'medium',   typeface: 'primary', sample: 'Section title goes here' },
  { name: 'mobile/heading/xs',  platform: 'mobile', category: 'heading', size: 14, lineHeight: 140, letterSpacing: 0, paragraphSpacing: 0, weight: 'medium',   typeface: 'primary', sample: 'Section title goes here' },

  // Body — 16px floor on mobile (16 is the iOS/Android minimum comfortable size)
  { name: 'mobile/body/xl', platform: 'mobile', category: 'body', size: 18, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'mobile/body/lg', platform: 'mobile', category: 'body', size: 16, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'mobile/body/md', platform: 'mobile', category: 'body', size: 16, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 16, weight: 'regular', typeface: 'primary', sample: 'Default body text.' },
  { name: 'mobile/body/sm', platform: 'mobile', category: 'body', size: 14, lineHeight: 160, letterSpacing: 0,   paragraphSpacing: 12, weight: 'regular', typeface: 'primary', sample: 'The quick brown fox jumps over the lazy dog.' },
  { name: 'mobile/body/xs', platform: 'mobile', category: 'body', size: 12, lineHeight: 160, letterSpacing: 0.5, paragraphSpacing: 8,  weight: 'regular', typeface: 'primary', sample: 'Captions and footnotes.' },

  // Label
  { name: 'mobile/label/xl', platform: 'mobile', category: 'label', size: 16, lineHeight: 140, letterSpacing: 0,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'mobile/label/lg', platform: 'mobile', category: 'label', size: 14, lineHeight: 140, letterSpacing: 0,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'mobile/label/md', platform: 'mobile', category: 'label', size: 13, lineHeight: 140, letterSpacing: 0.5, paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Button Label' },
  { name: 'mobile/label/sm', platform: 'mobile', category: 'label', size: 12, lineHeight: 140, letterSpacing: 1,   paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Badge · Tag · Caption' },
  { name: 'mobile/label/xs', platform: 'mobile', category: 'label', size: 11, lineHeight: 140, letterSpacing: 1.5, paragraphSpacing: 0, weight: 'medium', typeface: 'primary', sample: 'Overline · Micro label' },

  // Code
  { name: 'mobile/code/lg', platform: 'mobile', category: 'code', size: 14, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },
  { name: 'mobile/code/md', platform: 'mobile', category: 'code', size: 12, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },
  { name: 'mobile/code/sm', platform: 'mobile', category: 'code', size: 11, lineHeight: 160, letterSpacing: 0, paragraphSpacing: 0, weight: 'regular', typeface: 'mono', sample: 'const value = tokens.spacing[16];' },
];

// ─── Build output ────────────────────────────────────────────────────────────
const output = {
  config: { primaryFont, monoFont },
  primitives: {
    size:             Object.fromEntries(SIZES.map(v => [v, v])),
    lineHeight:       Object.fromEntries(LINE_HEIGHTS.map(v => [v, v])),
    letterSpacing:    Object.fromEntries(LETTER_SPACINGS.map(v => {
      const key = v < 0
        ? `neg${Math.abs(v).toString().replace('.', '_')}`
        : v.toString().replace('.', '_');
      return [key, v];
    })),
    paragraphSpacing: Object.fromEntries(PARAGRAPH_SPACINGS.map(v => [v, v])),
  },
  strings: {
    typeface: { primary: primaryFont, mono: monoFont },
    weights: Object.fromEntries(ACTIVE_WEIGHTS.map(w => [w, WEIGHT_CONCEPTS[w].fallback])),
  },
  styles: TEXT_STYLES.map(s => {
    const lsKey = s.letterSpacing < 0
      ? `neg${Math.abs(s.letterSpacing).toString().replace('.', '_')}`
      : s.letterSpacing.toString().replace('.', '_');
    return {
      ...s,
      refs: {
        size:             `type/size/${s.size}`,
        lineHeight:       `type/lineHeight/${s.lineHeight}`,
        letterSpacing:    `type/letterSpacing/${lsKey}`,
        paragraphSpacing: `type/paragraphSpacing/${s.paragraphSpacing}`,
        weight:           `type/weight/${s.weight}`,
        typeface:         `type/typeface/${s.typeface}`,
      },
    };
  }),
  meta: {
    totalPrimitives: SIZES.length + LINE_HEIGHTS.length + LETTER_SPACINGS.length + PARAGRAPH_SPACINGS.length,
    totalStringVars: 2 + ACTIVE_WEIGHTS.length,
    totalStyles: TEXT_STYLES.length,
    desktop: TEXT_STYLES.filter(s => s.platform === 'desktop').length,
    mobile:  TEXT_STYLES.filter(s => s.platform === 'mobile').length,
    categories: [...new Set(TEXT_STYLES.map(s => s.category))],
  },
};

console.log(JSON.stringify(output, null, 2));
