---
name: figma-design-system-configurator
description: Opens a visual, interactive configurator (color pickers, typography controls, dark-mode toggle, live preview) so the designer can dial in their whole design system by hand instead of answering questions in chat, then generates it in their Figma file with the exact values they chose. When the designer submits, this skill runs the color palette, typography, and space & scale generators directly against the pasted Figma file — no re-asking for inputs. Trigger with phrases like "open the design system configurator", "let me pick my colors and fonts visually", "give me a UI to set up my design system", or any time the designer wants a form/preview rather than a chat Q&A to build tokens in Figma.
---

# Figma Design System Configurator

Renders an interactive configurator widget where the designer sets colors, typography, and dark
mode with live preview, then hands those exact values to the three generators. This skill does not
duplicate any generation logic — it collects inputs visually and then follows the sibling skills'
`SKILL.md` files in full:

- `${CLAUDE_PLUGIN_ROOT}/skills/figma-color-palette-generator/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/figma-type-system-generator/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/figma-space-scale-generator/SKILL.md`

---

## Step 1 — Render the configurator

Display the bundled configurator as an interactive widget so the designer can fill it in directly.

1. Read the widget markup from `${CLAUDE_PLUGIN_ROOT}/skills/figma-design-system-configurator/assets/configurator.html`.
2. Render it with the **`show_widget`** tool (from the `visualize` MCP server). The widget's
   "Create in Figma" button calls the global `sendPrompt()` — this is available only when the page
   is rendered through `show_widget`, so use that tool, not a static artifact/file preview.
   - `title`: `design_system_configurator`
   - `widget_code`: the full contents of `configurator.html`, verbatim.
3. Tell the designer, in one short line, to set their colors, typeface, and platforms, paste their
   Figma file URL, and click **Create in Figma** (or **Download JSON** to just export the config).

Do **not** ask the configurator's questions in chat — the widget collects everything. Only fall back
to a chat Q&A if the `show_widget` tool is unavailable in this session.

---

## Step 2 — Receive the handoff

When the designer clicks **Create in Figma**, the widget sends a message (via `sendPrompt`) that
contains every value: the Figma file URL, all colors (primary, secondary + its source, accent,
neutral, semantic), the dark-mode flag, the typeface, the selected type categories, and the
platforms.

Treat that message as the complete, authoritative input set. **Do not re-ask for any of it.** Parse:

- `Figma file` → target file for all generators
- `Primary`, `Secondary` → pass straight to the color palette generator (secondary is the optional
  second argument to `generate-palette.js`)
- `Typeface` → primary typeface for the type system generator
- `Dark mode`, `Categories`, `Platforms` → apply as described below

If the message is missing the Figma URL or a valid primary hex, ask only for the one missing piece.

---

## Step 3 — Verify the Figma MCP connection and write access

Run the standard preflight once, up front (identical to the other generators):

1. **Locate the Figma MCP tools.** `ToolSearch query="select:use_figma,get_screenshot,get_metadata"`.
   Match by tool name, from any installed Figma MCP server or the claude.ai Figma connector.
2. **If none are found** — stop. Tell the designer to run `/mcp` and confirm a Figma server is
   enabled; point them at `docs/figma-mcp-setup.md`. Never attempt partial generation.
3. **If only an `authenticate`-style tool is found** — stop, offer to run it (or point to `/mcp`),
   retry step 1 once authorized.
4. **Verify write access — Full seat + edit permission.** Probe with a harmless, reversible write
   (create a tiny temporary node, delete it immediately). If it fails or the account is
   view-only/Dev Mode, stop and tell the designer exactly what's missing.

Only once this passes, continue.

---

## Step 4 — Generate, in order

Run the generators in the same order as `generate-design-system`, against the file from the handoff,
using the exact values — Colors → Space & Scale → Typography:

1. **Colors** — follow `figma-color-palette-generator/SKILL.md`. Pass the primary hex, and the
   secondary hex as the optional second argument to `generate-palette.js`. Honor the dark-mode flag:
   if dark mode is off, the Semantic collection still builds Light + Dark (modes are cheap and
   reversible) — note in the report that the designer selected Light only, so they can delete the
   Dark mode if unwanted. Do not silently drop it.
2. **Space & Scale** — follow `figma-space-scale-generator/SKILL.md` (deterministic, no extra input).
3. **Typography** — follow `figma-type-system-generator/SKILL.md`. Use the chosen typeface. The
   generator builds all 24 desktop + 24 mobile styles; if the designer deselected platforms or
   categories in the configurator, still generate the full set but call out in the report which
   subset they asked to focus on, rather than partially generating and leaving gaps.

Check for existing-collection conflicts before each phase exactly as each sibling skill instructs —
never silently duplicate or overwrite.

---

## Step 5 — One consolidated report

After all three phases, give the designer a single completion report:

- Colors: primitive + semantic counts, modes, secondary source (user-provided vs auto +210°)
- Space & Scale: token counts per category
- Typography: style counts, typeface used, platforms/categories they focused on
- The Figma file link and canvas location of any reference frames
- Anything skipped (already existed) or that couldn't be created, with the reason

---

## Design decisions

| Decision | Reason |
|----------|--------|
| Visual configurator over chat Q&A | Color pickers + live preview let designers judge the palette before committing; fewer round-trips than typing hexes in chat |
| `show_widget`, not a static artifact | The "Create in Figma" handoff needs the `sendPrompt()` global, which only exists in `show_widget`-rendered pages |
| Handoff message carries every value | Lets generation run start-to-finish with zero re-asking, even across the color/type/space skills |
| Reuses sibling skills, no forked logic | One source of truth for token generation; the configurator only changes how inputs are collected |
| Secondary color optional | Auto-derives a +210° split-complementary when left blank, matching `generate-palette.js` |
