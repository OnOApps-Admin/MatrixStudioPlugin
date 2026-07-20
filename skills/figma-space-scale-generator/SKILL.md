---
name: figma-space-scale-generator
description: Generates a complete two-tier spacing and scale system in a Figma file. Creates a Scale collection (24 primitive FLOAT values on a 4/8px grid) and a Tokens collection with semantic aliases for spacing, padding, radius, border width, component sizes, and opacity — 77 tokens total, each with correct Figma variable scopes. Then renders a modern dark-themed visual reference frame showing all categories. Trigger with phrases like "generate spacing tokens", "create scale system", "build spacing variables", "create border radius tokens", "set up design system spacing in Figma", or any time the user wants numeric/dimensional variables created in a Figma file.
---

# Figma Space & Scale Generator

Generates a two-tier spacing system from a fixed 4/8px grid.
Outputs: **Figma Variables** (Scale + Tokens collections) + a **visual reference frame**.

No user input needed beyond the Figma file URL — the scale is deterministic.

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

## Step 1 — Collect input

Ask the user for exactly **one thing**:

- **Figma file URL** — where to write the variables and frame

---

## Step 2 — Generate the scale data

Run the bundled script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/figma-space-scale-generator/scripts/generate-scale.js"
```

The script outputs JSON with three keys: `primitives`, `tokens`, `meta`.

- `primitives.scale` — 22 grid values (0 → 512)
- `primitives.special` — `1` (hairline) and `full` (9999, pill radius)
- `tokens` — 6 categories: `spacing`, `padding`, `radius`, `border`, `size`, `opacity`

Save the full JSON — needed for Steps 3 and 4.

---

## Step 3 — Check for existing content (never silently duplicate or overwrite)

Before creating anything, enumerate what already exists:

```js
const cols = figma.variables.getLocalVariableCollections();
const existingScale  = cols.find(c => c.name === 'Scale');
const existingTokens = cols.find(c => c.name === 'Tokens');
```

If **either** collection already exists, stop before creating or modifying anything and ask the designer to choose one:

1. **Cancel** — make no changes.
2. **Generate only missing items** — reuse the existing collection(s); create only the primitives/tokens whose names don't already exist; never modify existing variable values.
3. **Regenerate intentionally** — reuse the existing collection(s); update the values/aliases of same-named variables in place; create any missing ones. Only do this on explicit confirmation, and never create a second `Scale` or `Tokens` collection.

If neither collection exists, proceed without prompting. Carry the designer's choice into Step 4.

---

## Step 4 — Create Figma Variables

All variables are type `FLOAT`. Work in **3 incremental `use_figma` calls**:

### 4a. Create (or reuse) the Scale collection (primitives)

If reused (per Step 3), fetch the existing `Scale` collection. Otherwise create a `VariableCollection` named **`Scale`**, mode named `Value`.

For each value in `primitives.scale` + `primitives.special`:
- Variable name: `scale/{n}` — e.g. `scale/16`, `scale/full`
- Type: `FLOAT`
- Value: the number (raw float)
- Scope: `['ALL_SCOPES']`
- Per Step 3's resolution: skip names that already exist (missing-only) or update their value (regenerate).

```js
const col = figma.variables.createVariableCollection('Scale');
col.renameMode(col.modes[0].modeId, 'Value');
const modeId = col.modes[0].modeId;

for (const [key, val] of Object.entries(scaleData)) {
  const v = figma.variables.createVariable(`scale/${key}`, col, 'FLOAT');
  v.scopes = ['ALL_SCOPES'];
  v.setValueForMode(modeId, val);
}
return { collectionId: col.id, count: col.variableIds.length };
```

Return the collection ID.

### 4b. Create (or reuse) the Tokens collection (semantic aliases)

If reused, fetch the existing `Tokens` collection. Otherwise create a `VariableCollection` named **`Tokens`**, mode named `Value`.

Read `${CLAUDE_PLUGIN_ROOT}/skills/figma-space-scale-generator/references/token-mapping.md` now for the full mapping table (77 tokens).

For each token in `spacing`, `padding`, `radius`, `border`, `size`:
- Variable name: exact token name — e.g. `spacing/16`, `radius/full`
- Type: `FLOAT`
- Value: **alias** to the corresponding `Scale` variable
- Scope: per-category as specified in the reference
- Per Step 3's resolution: skip names that already exist (missing-only) or update their alias (regenerate).

```js
// Find a Scale primitive by name
const scaleVars = figma.variables.getLocalVariables('FLOAT')
  .filter(v => v.variableCollectionId === scaleCollectionId);

function findScale(key) {
  return scaleVars.find(v => v.name === `scale/${key}`);
}

// Set alias value
const alias = figma.variables.createVariableAlias(findScale('16'));
tokenVar.setValueForMode(modeId, alias);
```

For `opacity` tokens: **do not alias** — set raw float value directly (e.g. `opacity/50 = 0.50`).

Scope assignments:
| Category | Scopes |
|----------|--------|
| spacing  | `['GAP']` |
| padding  | `['HORIZONTAL_PADDING', 'VERTICAL_PADDING']` |
| radius   | `['CORNER_RADIUS']` |
| border   | `['STROKE_WEIGHT']` |
| size     | `['WIDTH', 'HEIGHT']` |
| opacity  | `['OPACITY']` |

### 4c. Verify

```js
const cols = figma.variables.getLocalVariableCollections();
const scaleCol  = cols.find(c => c.name === 'Scale');
const tokenCol  = cols.find(c => c.name === 'Tokens');
const allFloats = figma.variables.getLocalVariables('FLOAT');
return {
  scalePrimitives: allFloats.filter(v => v.variableCollectionId === scaleCol.id).length,
  tokens: allFloats.filter(v => v.variableCollectionId === tokenCol.id).length,
};
```

Expected: `scalePrimitives: 24`, `tokens: 77` (spacing 16, padding 16, radius 10, border 4, size 17, opacity 14). Fewer than these are expected — and fine — if Step 3's "missing items only" was chosen against a partially-existing setup; report the actual vs. expected counts either way. If counts are unexpectedly off, debug before proceeding to Step 5.

---

## Step 5 — Create visual reference frame

Create a frame named **`📐 Space & Scale System`**.

Work in **5 incremental `use_figma` calls**:

### 5a. Outer frame + header

```
Frame (width: 3200, padding: 80, gap: 80, auto-layout vertical, dark bg: #0D0D0D)
└── Header
    ├── Background: #1A1A1A, corner-radius: 16, padding: 48
    ├── Title: "Space & Scale System" — Inter Bold 52pt, white
    ├── Subtitle: "4px base grid · 6 categories · 24 primitives · 77 tokens"
    │    — Inter Regular 18pt, #666666
    └── Scale strip: row of all 22 scale dots
        Each dot: square of size min(value, 48), filled #3B82F6 (static blue)
        Value label below: Inter Medium 11pt, #555555
        (for 0: show a 2×2 dot so it's visible)
```

### 5b. Spacing + Padding section

```
Section label: "SPACING & PADDING" — Inter Medium 12pt, letter-spacing 2, #444444

Two subsections side by side:
  Left: Spacing — show 8 representative values (0, 4, 8, 16, 24, 32, 48, 64)
    Each item: two rectangles (32×32, filled #1E1E1E, radius 4) with the gap value between them
    Gap visualised as a blue (#3B82F6) line or shaded region
    Token name + px value below in Inter Regular 12pt #555555

  Right: Padding — show 6 values (4, 8, 12, 16, 24, 32)
    Outer rect (#1A1A1A) containing inner rect (#2A2A2A), gap = padding value
    Token name + px value below
```

### 5c. Radius section

```
Section label: "RADIUS" — same style as above

Row of 9 rectangles (72×72, filled #1E293B, stroke #334155 1px):
  radius/0, radius/2, radius/4, radius/8, radius/12, radius/16, radius/24, radius/32, radius/full
  Corner radius applied = token value (cap at 36 for visual, full = 36 here)
  Token name below in Inter Regular 11pt #555555
  Value below that: "{n}px" in Inter Regular 10pt #3B3B3B
```

### 5d. Border + Size section

```
Two subsections:

Border (4 items — border/1, border/2, border/4, border/8):
  Rectangle 80×80, no fill, stroke = token value, stroke color #3B82F6
  Token name + "{n}px" below

Size (show 8 values — size/16, size/24, size/32, size/40, size/48, size/64, size/96, size/128):
  Filled square, dimension = size value (cap at 128 for display)
  Fill: #1E293B, show actual px × px label below in Inter Regular 11pt #555555
```

### 5e. Opacity section

```
Section label: "OPACITY"

Row of 14 squares (64×64), filled #3B82F6, opacity = token value
Each labeled: token name + value below
Show on a slightly lighter background (#141414) so opacity is visible
```

After all sections are created, position the outer frame 200px to the right of the rightmost existing node.

Load Inter before all text operations:
```js
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
```

Use `figma.createAutoLayout()` for all containers. No absolute `x`/`y` inside containers.

---

## Step 6 — Report to user

- Primitive count, token count per category, created vs. expected (24 primitives, 77 tokens) — call out any that were skipped because they already existed, or updated because the designer chose to regenerate
- Frame name and position
- Link to the Figma file
- Anything that could not be created, with the reason

---

## Reference files

- `scripts/generate-scale.js` — run this to get the full scale JSON (Step 2)
- `references/token-mapping.md` — full token table with scopes (Step 4b, 77 tokens)

---

## Design decisions

| Decision | Reason |
|----------|--------|
| 4px base unit | Standard grid — aligns to 8px grid at larger values, compatible with iOS/Android HIG |
| `scale/1` hairline outside grid | Real need: dividers, input borders, table lines — can't be 0 or 4 |
| `scale/full = 9999` | Pill shape convention — not 50% because that changes with size |
| Opacity not aliased to Scale | Different unit (0–1 float) — aliasing to scale/50 would imply 50px, not 50% |
| Spacing and Padding separate | Different Figma scopes — keeps property pickers clean and intentional |
| Size goes to 512 | Covers icon (16–64), avatar (32–96), thumbnail (128–256), card (320–512) |
| Scopes set explicitly | `ALL_SCOPES` on tokens pollutes every number picker — defeats the purpose of tokens |
| No runtime dependency on a separate Figma-usage skill | Works directly against the Figma MCP tools; a `figma-use` skill (if present) is only ever supplementary guidance |
