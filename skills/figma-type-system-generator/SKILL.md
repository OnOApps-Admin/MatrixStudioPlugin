---
name: figma-type-system-generator
description: Generates a complete two-platform typography system in a Figma file. Asks for a typeface, then creates two variable collections — Type Primitives (FLOAT: 42 sizes/line-heights/letter-spacings/paragraph-spacings) and Type Tokens (STRING: 7 typeface names and weights) — then creates 48 local text styles across desktop/* and mobile/* namespaces, 5 categories each (display, heading, body, label, code), with every property bound to a variable so the entire system refaces by changing one variable. Renders a modern dark type specimen frame showing desktop and mobile side by side. Trigger with phrases like "generate typography system", "create text styles in Figma", "set up type tokens", "build font variables", "create typography variables", or any time the user wants a complete type system in a Figma file.
---

# Figma Type System Generator

Generates a full two-platform, two-tier typography system.
Every text style property — family, weight, size, line-height, letter-spacing — is bound
to a variable. Changing `type/typeface/primary` refaces the entire system in one click.

**Collections created:**
- `Type Primitives` — 42 FLOAT variables (19 sizes, 8 line-heights, 9 letter-spacings, 6 paragraph-spacings)
- `Type Tokens` — 7 STRING variables (2 typeface names + 5 weight style names)

**Text styles created:** 48 styles — 24 desktop + 24 mobile — across display / heading / body / label / code.

**Naming:** `desktop/display/2xl`, `mobile/heading/md`, etc.
Figma groups these into folders automatically: `desktop/` and `mobile/` at the top level.

---

## Prerequisites — Figma MCP connection

Before doing anything else:

1. **Locate the Figma MCP tools.** Run `ToolSearch query="select:use_figma,get_screenshot,get_metadata"`. These tools may come from this plugin's bundled `figma` MCP server, the claude.ai Figma connector, or another installed plugin's Figma server — match by **tool name**, not by server/tool prefix.
2. **If no `use_figma` / `get_screenshot` / `get_metadata` tools are found at all** — stop here. Tell the designer to run `/mcp` and confirm a Figma server is listed and enabled, and point them at `docs/figma-mcp-setup.md` in this plugin if it isn't. Never attempt partial generation without these tools.
3. **If only an `authenticate`-style tool is found** (server installed but not authorized) — stop, offer to run it (or point to `/mcp`), and retry step 1 once the designer confirms authorization.
4. **Confirm the target Figma file** with the designer (file URL, or the file already open/selected) before touching anything.
5. **Verify write access — Full seat + edit permission required.** This skill writes Variables, text styles, and frames, which needs a **Full Figma seat** and **edit permission on the target file** (view-only access is not enough). Probe with a harmless, reversible write via `use_figma` (create a small temporary node, then delete it immediately). If the write fails, or the account is view-only/Dev Mode: **stop, do not generate anything**, and tell the designer exactly what's missing (Full seat vs. per-file edit access) and to retry after fixing it with their Figma admin.
6. *(Optional, informational only)* If a `figma-use` or similarly-named Figma usage-guidance skill is confirmed present in this session's available skills, you may read it for extra guidance on writing Plugin API code. It is **never required** — proceed on the MCP tools alone if it isn't installed.

Only once steps 1–5 pass, continue to Step 1 below.

---

## Step 1 — Collect inputs

Ask the user for:

1. **Primary typeface** — font family name exactly as it appears in Figma (e.g. `Inter`, `Plus Jakarta Sans`)
2. **Monospace typeface** *(optional)* — for code styles. Auto-resolved if not provided.

Do not ask for anything else.

---

## Step 2 — Generate system config

Run the bundled script:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/figma-type-system-generator/scripts/generate-type-system.js" "Primary Font" "Mono Font"
```

Save the full JSON output. Key sections:
- `primitives` — all FLOAT scale values (42 total)
- `strings` — typeface names + weight fallback strings (7 total)
- `styles` — 48 style definitions (24 desktop + 24 mobile) with `refs` pointing to variable names
- `meta.desktop` = 24, `meta.mobile` = 24, `meta.totalPrimitives` = 42, `meta.totalStringVars` = 7, `meta.totalStyles` = 48

---

## Step 3 — Resolve actual font style names in Figma

**Critical — font style strings must exactly match what the font exposes.**
`Inter` uses `"Semi Bold"` (with space) — `"SemiBold"` fails silently.

Run one `use_figma` call:

```js
const primaryFont = '<USER_PRIMARY_FONT>';
const monoFont    = '<USER_MONO_OR_DEFAULT>';

const allFonts = await figma.listAvailableFontsAsync();
const primaryStyles = allFonts
  .filter(f => f.fontName.family === primaryFont)
  .map(f => f.fontName.style);

const monoFallbacks = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Roboto Mono', 'Courier New'];
const availableFamilies = new Set(allFonts.map(f => f.fontName.family));
let resolvedMono = monoFont;
if (!availableFamilies.has(monoFont)) {
  resolvedMono = monoFallbacks.find(f => availableFamilies.has(f)) || 'Courier New';
}

function resolveWeight(concept, available) {
  const map = {
    light:    ['Light', 'Thin'],
    regular:  ['Regular', 'Normal', 'Book', 'Roman', 'Text'],
    medium:   ['Medium', 'Regular'],
    semibold: ['Semi Bold', 'SemiBold', 'Demi Bold', 'DemiBold', 'Medium'],
    bold:     ['Bold', 'Heavy'],
  };
  for (const c of (map[concept] || [])) {
    if (available.includes(c)) return c;
  }
  return 'Regular';
}

const weightMap = {
  light:    resolveWeight('light',    primaryStyles),
  regular:  resolveWeight('regular',  primaryStyles),
  medium:   resolveWeight('medium',   primaryStyles),
  semibold: resolveWeight('semibold', primaryStyles),
  bold:     resolveWeight('bold',     primaryStyles),
};

if (primaryStyles.length === 0) {
  return { error: `Font "${primaryFont}" not found in Figma. Install it first.` };
}

return { primaryFont, resolvedMono, weightMap, primaryStyles };
```

**If primary font not found:** stop and tell the user. Do not proceed.
Read `${CLAUDE_PLUGIN_ROOT}/skills/figma-type-system-generator/references/weight-names.md` for common font style name patterns.

---

## Step 4 — Check for existing content (never silently duplicate or overwrite)

Before creating anything, enumerate what already exists:

```js
const cols = figma.variables.getLocalVariableCollections();
const existingPrimitives = cols.find(c => c.name === 'Type Primitives');
const existingTokens     = cols.find(c => c.name === 'Type Tokens');
const existingStyles     = figma.getLocalTextStyles()
  .filter(s => s.name.startsWith('desktop/') || s.name.startsWith('mobile/'));
```

If **any** of `Type Primitives`, `Type Tokens`, or a `desktop/*`/`mobile/*`-namespaced text style already exists, stop before creating or modifying anything and ask the designer to choose one:

1. **Cancel** — make no changes.
2. **Generate only missing items** — reuse the existing collection(s); create only the primitive/token variables and text styles whose names don't already exist; never modify existing values or bindings.
3. **Regenerate intentionally** — reuse the existing collection(s); update the values/bindings of same-named variables and text styles in place; create any missing ones. Only do this on explicit confirmation, and never create a second `Type Primitives`/`Type Tokens` collection or a duplicate same-named text style.

If nothing exists yet, proceed without prompting. Carry the designer's choice into Steps 5–7.

---

## Step 5 — Create Type Primitives collection (FLOAT)

If reused (per Step 4), fetch the existing `Type Primitives` collection. Otherwise create it with collection name **`Type Primitives`**, mode: `Value`. Type: `FLOAT`. Scope: `ALL_SCOPES`.

Variable name format: `type/{category}/{key}` — e.g. `type/size/16`, `type/lineHeight/160`.

| Category prefix | Source key | Example |
|-----------------|------------|---------|
| `type/size/` | `primitives.size` | `type/size/16` = 16 |
| `type/lineHeight/` | `primitives.lineHeight` | `type/lineHeight/160` = 160 |
| `type/letterSpacing/` | `primitives.letterSpacing` | `type/letterSpacing/neg2` = -2 |
| `type/paragraphSpacing/` | `primitives.paragraphSpacing` | `type/paragraphSpacing/16` = 16 |

Total: 42 variables (19 sizes + 8 line-heights + 9 letter-spacings + 6 paragraph-spacings). Per Step 4's resolution: skip names that already exist (missing-only) or update their value (regenerate).

Return the collection ID.

---

## Step 6 — Create Type Tokens collection (STRING)

If reused (per Step 4), fetch the existing `Type Tokens` collection. Otherwise create it with collection name **`Type Tokens`**, mode: `Value`. Type: `STRING`.

**Typeface variables** — scope: `['FONT_FAMILY']`:
- `type/typeface/primary` = primary font family string
- `type/typeface/mono` = resolved mono font family string

**Weight variables** — scope: `['FONT_STYLE']`:
- `type/weight/light`, `type/weight/regular`, `type/weight/medium`, `type/weight/semibold`, `type/weight/bold`
- Values: exact resolved strings from Step 3 `weightMap` (not the concept name)

Total: 7 variables (2 typeface + 5 weight). Per Step 4's resolution: skip names that already exist (missing-only) or update their value (regenerate).

Return the collection ID.

---

## Step 7 — Create text styles bound to variables

Load all required fonts before creating any style:

```js
const weightsToLoad = Object.values(weightMap);
for (const style of weightsToLoad) {
  await figma.loadFontAsync({ family: primaryFont, style });
}
await figma.loadFontAsync({ family: resolvedMono, style: 'Regular' });
```

Create the 48 local text styles (per Step 4's resolution: skip names that already exist for "missing-only", or update the existing style's values/bindings in place for "regenerate"). Split into **4 `use_figma` calls** to stay incremental:
- Call A: all `desktop/*` display + heading (11 styles)
- Call B: all `desktop/*` body + label + code (13 styles)
- Call C: all `mobile/*` display + heading (11 styles)
- Call D: all `mobile/*` body + label + code (13 styles)

For each style, using its `refs` object:

```js
// Pattern — apply to every style in the batch
const style = figma.createTextStyle();
style.name = 'desktop/display/2xl'; // use exact name from config

// 1. Set concrete values first (required before binding)
style.fontName = { family: primaryFont, style: weightMap['bold'] };
style.fontSize = 96;
style.lineHeight = { unit: 'PERCENT', value: 110 };
style.letterSpacing = { unit: 'PERCENT', value: -2 };
style.paragraphSpacing = 0;

// 2. Bind all properties to variables
const floatVars  = figma.variables.getLocalVariables('FLOAT');
const stringVars = figma.variables.getLocalVariables('STRING');
const ff = (name) => floatVars.find(v => v.name === name);
const fs = (name) => stringVars.find(v => v.name === name);

style.setBoundVariable('fontSize',        ff('type/size/96'));
style.setBoundVariable('lineHeight',      ff('type/lineHeight/110'));
style.setBoundVariable('letterSpacing',   ff('type/letterSpacing/neg2'));
style.setBoundVariable('paragraphSpacing',ff('type/paragraphSpacing/0'));
style.setBoundVariable('fontFamily',      fs('type/typeface/primary')); // ← the global swap point
style.setBoundVariable('fontStyle',       fs('type/weight/bold'));
```

Code styles: bind `fontFamily` to `type/typeface/mono` instead of `type/typeface/primary`.

Return all created style IDs per call.

### Verify

```js
const created = figma.getLocalTextStyles()
  .filter(s => s.name.startsWith('desktop/') || s.name.startsWith('mobile/'));
return {
  total: created.length,
  desktop: created.filter(s => s.name.startsWith('desktop/')).length,
  mobile: created.filter(s => s.name.startsWith('mobile/')).length,
};
```

Expected: `total: 48`, `desktop: 24`, `mobile: 24`. Fewer than these are expected — and fine — if Step 4's "missing items only" was chosen against a partially-existing setup; report the actual vs. expected counts either way. If counts are unexpectedly off, debug before proceeding to Step 8.

---

## Step 8 — Create visual type specimen frame

Frame name: **`✏️ Typography System — {primaryFont}`**

Work in **6 incremental `use_figma` calls**:

### 8a. Outer frame + header

```
Frame: width 3600, auto-layout vertical, gap 80, padding 80, bg #0D0D0D

Header (bg #111111, padding 56, radius 16):
├── Eyebrow: "TYPOGRAPHY SYSTEM" — 12px Medium, #444, letter-spacing 3
├── Title: primary font name — 64px, actual primaryFont, bold, white
├── Subtitle: "48 styles · desktop + mobile · variable-bound" — 16px Regular, #555
└── Weight strip: 5 chips (light / regular / medium / semibold / bold)
    Each: "Ag" in 28px actual font, label in 11px #444, bg #1A1A1A, padding 16, radius 8
```

### 8b. Desktop section (display + heading)

```
Section label: "DESKTOP" — 11px Medium, letter-spacing 3, #3B3B3B
Sub-label: "display + heading"

Table layout — each row:
  Left 200px: style name in 11px mono #333, refs below in 10px #222
  Right: sample text rendered at full style
  1px separator below: #161616
```

### 8c. Desktop section (body + label + code)

Continue the desktop section with body / label / code rows.
Code rows: bg #0A0A0A, monospace font, text color #A8FF78.

### 8d. Divider + Mobile section (display + heading)

```
Divider: full-width 1px line #1A1A1A with label "MOBILE" centered
Platform note below: "390px viewport · scaled for touch readability"

Mobile display + heading rows — same table structure.
Subtle left border on each row: 2px #1E3A5F (blue tint) to visually distinguish from desktop.
```

### 8e. Mobile section (body + label + code)

Continue mobile section with body / label / code rows.

### 8f. Side-by-side comparison strip

At the bottom: a horizontal comparison strip showing the same 5 roles side-by-side:

```
| Role          | Desktop | Mobile | Δ |
| display/2xl   | 96px    | 48px   | -50% |
| heading/md    | 24px    | 18px   | -25% |
| body/md       | 16px    | 16px   | same |
| label/md      | 14px    | 13px   | -1px |
| code/md       | 14px    | 12px   | -2px |
```

Styled as a dark table, bg #111, each cell padded 16px. Font: Inter 13px regular.
Delta column: green for same, amber for small reduction, white for large.

Position the outer frame 200px to the right of the rightmost existing node.
Use `figma.createAutoLayout()` for all containers.

---

## Step 9 — Report to user

- Primitive variable count created vs. expected (42)
- Token variable count created vs. expected (7) + resolved weight strings
- Text style count created vs. expected (48: 24 desktop + 24 mobile) — call out any that were skipped because they already existed, or updated because the designer chose to regenerate
- Which mono font was resolved
- Frame location in Figma
- Anything that could not be created, with the reason

---

## Reference files

- `scripts/generate-type-system.js` — run to get config JSON (Step 2)
- `references/weight-names.md` — font style name resolution for Step 3

---

## Design decisions

| Decision | Reason |
|----------|--------|
| `desktop/*` + `mobile/*` namespace | Figma groups into folders — clean organisation, no naming conflicts |
| Display scales down ~50% on mobile | 96px on a 390px screen fills the viewport — unusable. 48px is still dramatic |
| Heading scales down ~15–25% | Moderate reduction; mobile screens are narrower, hierarchy still needs to read |
| Body 16px floor on mobile | iOS HIG and Android Material both cite 16px as minimum comfortable reading size |
| body/md same on both platforms | 16px is already the mobile floor — reducing it hurts readability |
| label/md: 14px desktop → 13px mobile | Touch targets are larger on mobile but labels inside buttons can go slightly tighter |
| `type/typeface/primary` single swap point | Change one STRING variable → entire system (both desktop and mobile) refaces |
| Concrete values set before binding | Figma requires a valid fontName before variable binding — order is mandatory |
| STRING variables for typeface + weight | Scopes `FONT_FAMILY` + `FONT_STYLE` are the correct binding types in Figma |
| No runtime dependency on a separate Figma-usage skill | Works directly against the Figma MCP tools; a `figma-use` skill (if present) is only ever supplementary guidance |
