# Font Weight Names Reference

Figma's `fontStyle` must exactly match the style string the font exposes.
**Always resolve via `figma.listAvailableFontsAsync()` at runtime** — use this table only as a fallback guide.

## Runtime resolution (required in skill Step 3b)

```js
const allFonts = await figma.listAvailableFontsAsync();
const fontStyles = allFonts
  .filter(f => f.fontName.family === primaryFont)
  .map(f => f.fontName.style);

// Map our weight concepts to available styles
function resolveWeight(concept, availableStyles) {
  const candidates = {
    light:    ['Light', 'Thin'],
    regular:  ['Regular', 'Normal', 'Book', 'Roman', 'Text'],
    medium:   ['Medium', 'Regular'],      // fallback to Regular if no Medium
    semibold: ['Semi Bold', 'SemiBold', 'Demi Bold', 'DemiBold', 'Medium'],
    bold:     ['Bold', 'Heavy'],
  };
  for (const candidate of (candidates[concept] || [])) {
    if (availableStyles.includes(candidate)) return candidate;
  }
  return 'Regular'; // last resort
}
```

## Common font families — known style strings

| Font | Regular | Medium | SemiBold | Bold | Notes |
|------|---------|--------|----------|------|-------|
| Inter | Regular | Medium | Semi Bold | Bold | Space in "Semi Bold" — common gotcha |
| Roboto | Regular | Medium | — | Bold | No SemiBold; use Medium for 600 |
| Roboto Flex | Regular | Medium | SemiBold | Bold | Variable font variant |
| SF Pro Text | Regular | Medium | Semibold | Bold | Apple system font |
| SF Pro Display | Regular | Medium | Semibold | Bold | Apple system font |
| Plus Jakarta Sans | Regular | Medium | SemiBold | Bold | |
| IBM Plex Sans | Regular | Medium | SemiBold | Bold | |
| DM Sans | Regular | Medium | SemiBold | Bold | |
| Geist | Regular | Medium | SemiBold | Bold | Vercel's typeface |
| Manrope | Regular | Medium | SemiBold | Bold | |
| Nunito | Regular | Medium | SemiBold | Bold | |
| Poppins | Regular | Medium | SemiBold | Bold | |
| Outfit | Regular | Medium | SemiBold | Bold | |
| Raleway | Regular | Medium | SemiBold | Bold | |
| Work Sans | Regular | Medium | SemiBold | Bold | |
| Figtree | Regular | Medium | SemiBold | Bold | |
| Bricolage Grotesque | Regular | Medium | SemiBold | Bold | |
| JetBrains Mono | Regular | Medium | SemiBold | Bold | Mono |
| Fira Code | Regular | Medium | — | Bold | No SemiBold |
| Source Code Pro | Regular | Medium | SemiBold | Bold | Mono |
| Roboto Mono | Regular | Medium | — | Bold | No SemiBold |
| Courier New | Regular | — | — | Bold | Limited weights |

## If the font is not in Figma

If `fontStyles` is empty after querying, the font isn't installed.
Report to the user: "Font `{name}` is not available in this Figma file. Please install it via the Figma Fonts panel or use a Google Font."
Do NOT create text styles for unavailable fonts — they will error on render.

## Monospace fonts

For `typeface/mono`, use the same resolution approach.
If the user didn't provide a mono font, default to whichever is available in order:
`JetBrains Mono` → `Fira Code` → `Source Code Pro` → `Roboto Mono` → `Courier New`

Check availability with:
```js
const monoFallbacks = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Roboto Mono', 'Courier New'];
const availableFamilies = new Set(allFonts.map(f => f.fontName.family));
const resolvedMono = monoFallbacks.find(f => availableFamilies.has(f)) || 'Courier New';
```
