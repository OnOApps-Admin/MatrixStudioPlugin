---
name: generate-design-system
description: Runs the color palette, space & scale, and typography generators in the correct order to build a complete design system in one Figma file — Colors first, then Space & Scale, then Typography. Confirms the target file, verifies the Figma MCP connection and write access up front, collects all inputs before generating anything, checks for conflicts with existing collections/styles across all three generators before making any change, and produces one consolidated completion report with exact counts and any warnings. Trigger with phrases like "generate a complete design system", "build my whole design system in Figma", "set up a design system from this brand color and font", or any time the user wants colors, spacing, and typography created together rather than one at a time.
---

# Generate Complete Design System

Orchestrates the three individual generators — Color Palette, Space & Scale, Typography — into one
guided run that produces a full token foundation in a single Figma file.

This skill does not duplicate any generation logic. At each phase it reads and follows the sibling
skill's `SKILL.md` in full:
- `${CLAUDE_PLUGIN_ROOT}/skills/figma-color-palette-generator/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/figma-space-scale-generator/SKILL.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/figma-type-system-generator/SKILL.md`

---

## Step 1 — Confirm the target Figma file

Ask the designer for the Figma file URL, or confirm the file that's already open/selected in their
Figma MCP connection. Do not proceed until there is one unambiguous target file.

---

## Step 2 — Verify the Figma MCP connection and write access

Run the same preflight as every individual generator, once, up front:

1. **Locate the Figma MCP tools.** Run `ToolSearch query="select:use_figma,get_screenshot,get_metadata"`. Accept tools from this plugin's bundled `figma` MCP server, the claude.ai Figma connector, or any other installed Figma MCP server — match by **tool name**, not by server/tool prefix.
2. **If no `use_figma` / `get_screenshot` / `get_metadata` tools are found at all** — stop here. Tell the designer to run `/mcp` and confirm a Figma server is listed and enabled, and point them at `docs/figma-mcp-setup.md` in this plugin. Never attempt partial generation.
3. **If only an `authenticate`-style tool is found** — stop, offer to run it (or point to `/mcp`), and retry step 1 once the designer confirms authorization.
4. **Verify write access — Full seat + edit permission required.** All three generators write Variables, text styles, and frames, which needs a **Full Figma seat** and **edit permission on the target file**. Probe with a harmless, reversible write via `use_figma` (create a small temporary node, then delete it immediately). If the write fails, or the account is view-only/Dev Mode: **stop, do not generate anything**, and tell the designer exactly what's missing and to retry after fixing it with their Figma admin.
5. *(Optional, informational only)* If a `figma-use` or similarly-named Figma usage-guidance skill is confirmed present in this session's available skills, you may read it for extra guidance. It is **never required**.

Only once this passes, continue to Step 3.

---

## Step 3 — Collect all required inputs up front

Ask the designer for everything needed across all three phases in one pass, so the run doesn't stall partway through:

1. **Primary brand color** — hex value (e.g. `#3B6FE8`), for Colors
2. **Primary typeface** — font family name exactly as it appears in Figma, for Typography
3. **Monospace typeface** *(optional)* — for code text styles; auto-resolved if not given

(Space & Scale needs no additional input — it's deterministic.)

Validate the hex is a 6-digit hex string before proceeding.

---

## Step 4 — Check for conflicts across all three generators, before generating anything

Enumerate every target name this run could touch, in one `use_figma` call:

```js
const cols = figma.variables.getLocalVariableCollections();
const targets = ['Primitives', 'Semantic', 'Scale', 'Tokens', 'Type Primitives', 'Type Tokens'];
const existingCollections = targets.filter(name => cols.some(c => c.name === name));

const existingTextStyles = figma.getLocalTextStyles()
  .filter(s => s.name.startsWith('desktop/') || s.name.startsWith('mobile/'));

return { existingCollections, existingTextStyleCount: existingTextStyles.length };
```

If **anything** already exists (any of the six collections, or any `desktop/*`/`mobile/*` text style), stop before running any phase and ask the designer to choose **one policy for the whole run**:

1. **Cancel** — make no changes at all.
2. **Generate only missing items** — across all three phases, reuse existing collections/styles and create only what doesn't already exist; never modify existing values.
3. **Regenerate intentionally** — across all three phases, reuse existing collections and update same-named variables/styles in place, creating anything missing. Only on explicit confirmation.

Pass this single chosen policy into every phase below — each generator's own Step 3/4 "check for existing content" then confirms specifics for its own collections but should not re-prompt for a policy already decided here (skip re-asking; apply the chosen policy directly).

If nothing exists yet, proceed without prompting.

---

## Step 5 — Run the three generators in order

Execute in this order — **Colors → Space & Scale → Typography**. They are independent (no phase depends on another's output), but this order gives the most complete visual picture first (color, then structure, then type).

For each phase: read the sibling skill's `SKILL.md` in full at the path listed above, and follow its steps exactly (script invocation, variable creation, verification, visual frame), using the inputs collected in Step 3 and the conflict policy from Step 4.

1. **Colors** — follow `figma-color-palette-generator/SKILL.md` using the brand color from Step 3.
2. **Space & Scale** — follow `figma-space-scale-generator/SKILL.md` (no extra input needed).
3. **Typography** — follow `figma-type-system-generator/SKILL.md` using the primary/mono typefaces from Step 3.

If any phase's font-not-found check fails (Typography, Step 3 of that skill) or any phase's write probe fails partway through, stop that phase, report exactly what happened, and ask the designer whether to skip it or address the issue and retry — do not silently continue to the next phase as if it succeeded.

---

## Step 6 — Validate exact counts after each phase

Immediately after each phase, run that generator's own verify step and compare against these exact expected totals:

| Phase | Output | Expected count |
|---|---|---|
| Colors | `Primitives` collection (COLOR) | 77 |
| Colors | `Semantic` collection (COLOR, Light+Dark) | 51 |
| Space & Scale | `Scale` collection (FLOAT) | 24 |
| Space & Scale | `Tokens` collection (FLOAT) | 77 |
| Typography | `Type Primitives` collection (FLOAT) | 42 |
| Typography | `Type Tokens` collection (STRING) | 7 |
| Typography | Local text styles (`desktop/*` + `mobile/*`) | 48 (24 + 24) |

An actual count below expected is only correct if Step 4's "missing items only" policy was chosen against a partially-existing setup — otherwise treat any mismatch as a real problem and report it, don't paper over it.

---

## Step 7 — Concise completion report

One consolidated report covering all three phases:

- Per phase: collections/styles created (or reused), exact counts vs. expected, and which policy (missing-only / regenerate) was applied if any
- Any warnings: fonts not found or substituted, mono font auto-resolved to X, any write that failed
- Anything that could not be created, and why
- The three visual reference frame names and their location in the file
- Figma file link

Keep this to what the designer needs to verify the result — do not repeat the full step-by-step process.
