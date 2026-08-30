---
name: figma-color-palette-generator
description: Generates a complete two-tier design system color palette in a Figma file from a single brand color. Creates COLOR-type Figma Variables (NOT paint styles) — a Primitives collection (7 scales × 11 stops = 77 variables) plus a Semantic collection with Light and Dark modes covering backgrounds, text, borders, interactive, and status tokens (51 variables). Then renders a professional dark-themed visual reference frame. Trigger with phrases like "generate color palette", "create color system", "build design system colors", "set up color variables in Figma", or any time the user provides a hex color and wants a Figma color system built from it. Also use when the user wants to start a design system from scratch.
---

# Figma Color Palette Generator

Generates a production-ready, two-tier color design system from one brand color.
Outputs: **Figma Variables** (Primitives + Semantic collections) + a **visual reference frame**.

---

## Prerequisites — Figma MCP connection

Before doing anything else:

1. **Locate the Figma MCP tools.** Run `ToolSearch query="select:use_figma,get_screenshot,get_metadata"`. These tools may come from this plugin's bundled `figma` MCP server, the claude.ai Figma connector, or another installed plugin's Figma server — match by **tool name**, not by server/tool prefix.
2. **If no `use_figma` / `get_screenshot` / `get_metadata` tools are found at all** — stop here. Tell the designer to run `/mcp` and confirm a Figma server is listed and enabled, and point them at `docs/figma-mcp-setup.md` in this plugin if it isn't. Never attempt partial generation without these tools.
3. **If only an `authenticate`-style tool is found** (server installed but not authorized) — stop, offer to run it (or point to `/mcp`), and retry step 1 once the designer confirms authorization.
4. **Confirm the target Figma file** with the designer (file URL, or the file already open/selected) before touching anything.
5. **Verify write access — Full seat + edit permission required.** This skill writes Variables and frames, which needs a **Full Figma seat** and **edit permission on the target file** (view-only access is not enough). Probe with a harmless, reversible write via `use_figma` (create a small temporary node, then delete it immediately). If the write fails, or the account is view-only/Dev Mode: **stop, do not generate anything**, and tell the designer exactly what's missing (Full seat vs. per-file edit access) and to retry after fixing it with their Figma admin.
6. *(Optional, informational only)* If a `figma-use` or similarly-named Figma usage-guidance skill is confirmed present in this session's available skills, you may read it for extra guidance on writing Plugin API code. It is **never required** — proceed on the MCP tools alone if it isn't installed.

Only once steps 1–5 pass, continue to Step 1 below.

---

## Step 1 — Collect inputs

Ask the user for these inputs:

1. **Brand color** (required) — hex value (e.g. `#3B6FE8`)
2. **Figma file URL** (required) — where to write the variables and frame
3. **Secondary color** (optional) — hex value (e.g. `#E83B8A`). If provided, the secondary scale uses this exact color's hue and saturation instead of the auto-generated split-complementary (+210°). This produces a more accurate palette when the brand already has a defined secondary color.

Validate that all provided hex values are 6-digit hex strings before proceeding. If the user doesn't mention a secondary color, don't prompt for it — just proceed with auto-generation.

---

## Step 2 — Generate the full color palette

Run the bundled script:

```bash
# Without secondary color (auto-generates split-complementary):
node "${CLAUDE_PLUGIN_ROOT}/skills/figma-color-palette-generator/scripts/generate-palette.js" "#HEX_FROM_USER"

# With optional secondary color:
node "${CLAUDE_PLUGIN_ROOT}/skills/figma-color-palette-generator/scripts/generate-palette.js" "#HEX_FROM_USER" "#SECONDARY_HEX"
```

`palette` contains 7 scales: `primary`, `secondary`, `neutral`, `success`, `warning`, `error`, `info`.
Each scale has 11 stops: `50 100 200 300 400 500 600 700 800 900 950`.
`meta.secondarySource` indicates whether the secondary was `"user-provided"` or `"auto-generated (+210°)"`.

Save the full JSON — needed in Steps 3 and 4.

---

## Step 3 — Check for existing content (never silently duplicate or overwrite)

Before creating anything, enumerate what already exists:

```js
const cols = figma.variables.getLocalVariableCollections();
const existingPrimitives = cols.find(c => c.name === 'Primitives');
const existingSemantic   = cols.find(c => c.name === 'Semantic');
```

If **either** collection already exists, stop before creating or modifying anything and ask the designer to choose one:

1. **Cancel** — make no changes.
2. **Generate only missing items** — reuse the existing collection(s); create only the primitive/semantic variables whose names don't already exist; never modify existing variable values.
3. **Regenerate intentionally** — reuse the existing collection(s); update the values/aliases of same-named variables in place; create any missing ones. Only do this on explicit confirmation, and never create a second `Primitives` or `Semantic` collection.

If neither collection exists, proceed without prompting. Carry the designer's choice into Step 4.

---

## Step 4 — Create Figma Variables

> ⚠️ **CRITICAL: Use Figma VARIABLES only. Never call `figma.createPaintStyle()`.**
> This entire step uses `figma.variables.createVariable(collectionId, name, 'COLOR')`.
> Paint styles and Variables are different Figma features. This skill creates Variables exclusively.

Work in 3 separate `use_figma` calls:

### 4a. Create (or reuse) the Primitives collection

```js
// CORRECT — creates a COLOR variable
const variable = figma.variables.createVariable('primary/500', collection, 'COLOR');
variable.setValueForMode(modeId, { r: 0.18, g: 0.40, b: 0.90 }); // 0-1 range

// WRONG — never do this
// figma.createPaintStyle(); ← DO NOT USE
```

If reused (per Step 3), fetch the existing `Primitives` collection instead of creating a new one. Otherwise create a `VariableCollection` named **`Primitives`**, one mode named `Value`.

For each of the 7 categories × 11 stops = **77 variables**:
- Name: `{category}/{stop}` — e.g. `primary/500`, `neutral/100`
- Type: `COLOR`
- Value: RGB object from hex (0–1 range, not 0–255)
- Scopes: `['ALL_SCOPES']`
- Per Step 3's resolution: skip names that already exist (missing-only) or update their value (regenerate).

```js
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0,2), 16) / 255,
    g: parseInt(c.slice(2,4), 16) / 255,
    b: parseInt(c.slice(4,6), 16) / 255,
  };
}
```

Return the collection ID.

### 4b. Create (or reuse) the Semantic collection

If reused, fetch the existing `Semantic` collection. Otherwise create a `VariableCollection` named **`Semantic`**. Rename mode 0 to `Light`. Add a second mode named `Dark`.

Read `${CLAUDE_PLUGIN_ROOT}/skills/figma-color-palette-generator/references/semantic-tokens.md` now for the full token mapping table (51 tokens).

For each token:
- Type: `COLOR`
- `Light` mode: alias to the corresponding Primitive variable
- `Dark` mode: alias to the corresponding Primitive variable
- Scopes: per-category as in the reference
- Per Step 3's resolution: skip names that already exist (missing-only) or update their alias (regenerate).

```js
// Setting an alias (correct way to reference a primitive)
const alias = figma.variables.createVariableAlias(primitiveVariable);
semanticVar.setValueForMode(lightModeId, alias);

// Finding a primitive by name
const allVars = figma.variables.getLocalVariables('COLOR');
const prim = allVars.find(v =>
  v.name === 'neutral/50' &&
  v.variableCollectionId === primitivesCollectionId
);
```

For tokens mapped to `white (#ffffff)`: set `{r:1, g:1, b:1}` directly — no alias.

### 4c. Verify

```js
const cols = figma.variables.getLocalVariableCollections();
const primCol = cols.find(c => c.name === 'Primitives');
const semCol  = cols.find(c => c.name === 'Semantic');
return {
  primitives: figma.variables.getLocalVariables('COLOR')
    .filter(v => v.variableCollectionId === primCol.id).length,
  semantic: figma.variables.getLocalVariables('COLOR')
    .filter(v => v.variableCollectionId === semCol.id).length,
  modes: semCol.modes.map(m => m.name),
};
```

Expected: `primitives: 77`, `semantic: 51`, `modes: ["Light", "Dark"]` (fewer than these are expected — and fine — if Step 3's "missing items only" was chosen against a partially-existing setup; report the actual vs. expected counts either way). If counts are unexpectedly off, debug before proceeding to Step 5.

---

## Step 5 — Create visual reference frame

Frame name: **`🎨 Color System — {brandHex}`**
Work in **6 incremental `use_figma` calls** — one per section.

Load fonts before any text work:
```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
```

### Text contrast helper
```js
// Use with palette JSON lightness value (0–100)
function contrastText(lightnessPercent) {
  return lightnessPercent > 55
    ? { r: 0.05, g: 0.05, b: 0.05 }  // dark text for light swatches
    : { r: 1, g: 1, b: 1 };           // white text for dark swatches
}
```

---

### Call 1 — Outer frame + Hero header

Create the outer wrapper frame:
```
outerFrame:
  width: 3600, auto-layout VERTICAL, gap: 0, padding: 0
  fills: [{ type: 'SOLID', color: { r:0.04, g:0.04, b:0.04 } }]  // #0A0A0A
  name: "🎨 Color System — {brandHex}"
```

Create the hero header as a child:
```
heroFrame:
  width: 3600, height: 300, auto-layout HORIZONTAL, gap: 0, padding: 0

  LEFT PANEL (width: 1200, height: 300, padding: 64, auto-layout VERTICAL, gap: 12):
    fills: [{ type: 'SOLID', color: { r:0.04, g:0.04, b:0.04 } }]

    eyebrow (TEXT):
      content: "COLOR SYSTEM"
      font: Inter Medium 10px
      fill: primary/400 hex value (from palette)
      letter-spacing: { unit: 'PERCENT', value: 40 }

    brandHexLabel (TEXT):
      content: brandHex.toUpperCase()
      font: Inter Bold 80px
      fill: white

    metaLabel (TEXT):
      content: "7 scales  ·  77 primitives  ·  51 semantic tokens  ·  Light & Dark"
      font: Inter Regular 13px
      fill: { r:0.22, g:0.22, b:0.22 }  // #383838

  RIGHT PANEL (width: 2400, height: 300, auto-layout HORIZONTAL, gap: 0, padding: 0):
    11 strip children — one per stop (50 → 950):
      Each strip:
        width: 218, height: 300
        fill: hexToRgb(palette.primary[stop])
        auto-layout VERTICAL, justify: END, padding: 12

        Bottom text block (auto-layout VERTICAL, gap: 2):
          stopLabel: stop number (e.g. "500"), Inter Medium 10px
          hexLabel: hex value (e.g. "#2d65e6"), Inter Regular 9px
          Both fills: contrastText(lightnessForStop)
```

### Call 2 — Primitive palette section

```
primitivesSection:
  width: 3600, auto-layout VERTICAL, gap: 24, padding: 80 64
  fills: [{ type: 'SOLID', color: { r:0.04, g:0.04, b:0.04 } }]

  sectionEyebrow (TEXT):
    content: "PRIMITIVE TOKENS"
    font: Inter Medium 9px, letter-spacing 40%, fill: #252525

  7 category rows — one per palette category:
    categoryRow (auto-layout HORIZONTAL, gap: 0, align: CENTER):

      categoryLabel (TEXT, width: 100, fixed):
        content: category name (e.g. "primary")
        font: Inter Medium 12px
        fill: { r:0.27, g:0.27, b:0.27 }  // #444

      11 swatches (auto-layout HORIZONTAL, gap: 0):
        Each swatch (width: 303, height: 88):
          BACKGROUND rect: full size, fill: hexToRgb(palette[category][stop])
          Corner radii:
            - First swatch in row: topLeft: 6, bottomLeft: 6
            - Last swatch in row: topRight: 6, bottomRight: 6
            - Others: 0

          Bottom info bar (height: 26, width: 303, auto-layout HORIZONTAL):
            Positioned at bottom via padding trick:
            swatch frame is VERTICAL auto-layout, justify: END

            stopText (TEXT):
              content: stop number string (e.g. "500")
              font: Inter Medium 10px
              fill: contrastText(lightnessForStop)

            hexText (TEXT, margin-left: auto):
              content: hexValue (e.g. "#2d65e6")
              font: Inter Regular 10px
              fill: contrastText(lightnessForStop) with 0.6 opacity effect

          For the 500 stop: add a small 4×4 white circle at top-right (base color indicator)
```

### Call 3 — Semantic section container + headers

```
semanticSection:
  width: 3600, auto-layout HORIZONTAL, gap: 0, padding: 0

  lightPanel (width: 1800, auto-layout VERTICAL, gap: 0, padding: 64):
    fills: [{ type: 'SOLID', color: { r:1, g:1, b:1 } }]  // pure white

    lightHeader (auto-layout HORIZONTAL, gap: 8, align: CENTER):
      dot: 8×8 circle, fill: { r:0.7, g:0.7, b:0.7 }
      label TEXT: "LIGHT MODE", Inter Medium 10px, letter-spacing 40%
        fill: { r:0.75, g:0.75, b:0.75 }

  darkPanel (width: 1800, auto-layout VERTICAL, gap: 0, padding: 64):
    fills: [{ type: 'SOLID', color: hexToRgb(palette.neutral[950]) }]

    darkHeader (auto-layout HORIZONTAL, gap: 8, align: CENTER):
      dot: 8×8 circle, fill: { r:0.2, g:0.2, b:0.2 }
      label TEXT: "DARK MODE", Inter Medium 10px, letter-spacing 40%
        fill: { r:0.2, g:0.2, b:0.2 }
```

### Call 4 — Semantic token rows (Light panel)

For each token group (Background, Text, Border, Interactive/Primary, Interactive/Secondary, Status):

```
groupContainer (auto-layout VERTICAL, gap: 4, top-padding: 24):

  groupLabel (TEXT):
    content: group name uppercase (e.g. "BACKGROUND")
    font: Inter Medium 9px, letter-spacing 40%
    fill: { r:0.75, g:0.75, b:0.75 }  // muted on white

  For each token in the group:
    tokenRow (width: 1672, height: 40, auto-layout HORIZONTAL, gap: 12, align: CENTER,
              padding: 0 8, radius: 6):
      fills: [{ type: 'SOLID', color: { r:0.97, g:0.97, b:0.97 } }]  // #F7F7F7

      colorSwatch (28×28 rect, radius: 4):
        fill: hexToRgb(lightHexForToken)

      tokenName (TEXT):
        content: token path (e.g. "color/background/default")
        font: Inter Regular 11px
        fill: { r:0.2, g:0.2, b:0.2 }

      hexValue (TEXT, margin-left: auto):
        content: lightHexForToken
        font: Inter Regular 10px
        fill: { r:0.6, g:0.6, b:0.6 }
```

Resolve each token's Light hex value from the palette JSON using semantic-tokens.md mapping.

### Call 5 — Semantic token rows (Dark panel)

Same structure as Call 4 but:
- `tokenRow` fill: `{ r:0.08, g:0.08, b:0.08 }` — #141414
- `tokenName` fill: `{ r:0.75, g:0.75, b:0.75 }`
- `hexValue` fill: `{ r:0.35, g:0.35, b:0.35 }`
- `groupLabel` fill: `{ r:0.2, g:0.2, b:0.2 }`
- Use Dark hex values from the semantic mapping

### Call 6 — Scale overview strip (bottom)

```
scaleStrip:
  width: 3600, auto-layout HORIZONTAL, gap: 0, padding: 48 64
  fills: [{ type: 'SOLID', color: { r:0.04, g:0.04, b:0.04 } }]

  For each of the 7 categories, show the 500 base swatch:
    baseChip (auto-layout VERTICAL, gap: 8, align: CENTER):
      circle (width: 56, height: 56, radius: 28):
        fill: hexToRgb(palette[category][500])
      label (TEXT):
        content: category name
        font: Inter Regular 11px
        fill: { r:0.35, g:0.35, b:0.35 }
```

Space the 7 chips evenly across 3600px. Use `primaryAxisAlignItems: 'SPACE_BETWEEN'` on the strip container.

Position the outer frame 200px to the right of the rightmost existing node.
Use `figma.createAutoLayout()` for all containers. No absolute `x`/`y` inside containers.

---

## Step 6 — Report to user

- Variable counts created vs. expected (primitives: 77, semantic: 51) — call out any that were skipped because they already existed, or updated because the designer chose to regenerate
- Modes: Light + Dark
- Frame name and canvas location
- Figma file link
- Anything that could not be created, with the reason

---

## Reference files

- `scripts/generate-palette.js` — run this to generate all hex values (Step 2)
- `references/semantic-tokens.md` — full token mapping table for Step 4b (51 tokens)

---

## Design decisions

| Decision | Reason |
|----------|--------|
| Variables only — no paint styles | Variables support modes (Light/Dark), aliases, and dev token export. Paint styles don't. |
| 11-stop scale (50–950) | Matches Tailwind/Radix convention — enough range for accessible contrast |
| Secondary at +210° (default) | Split-complementary: harmonious but distinct, avoids red/green conflict |
| Optional secondary hex input | When the brand has a defined secondary color, using it directly produces a more accurate palette than the auto-generated hue shift |
| Warm/cool neutrals | Slightly tinted (from primary hue) feels intentional vs off-the-shelf gray |
| Semantic saturation adapts to primary | Prevents semantic colors feeling disconnected from brand |
| Scopes set explicitly | Prevents polluting every property picker — keeps Figma usable |
| Visual: 303px swatches | Wide enough to read hex clearly at Figma's default zoom |
| Visual: adaptive text contrast | Automatic dark/light label based on lightness — no hardcoded text colors |
| No runtime dependency on a separate Figma-usage skill | Works directly against the Figma MCP tools; a `figma-use` skill (if present) is only ever supplementary guidance |
