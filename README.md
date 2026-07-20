# matrix-studio

A [Claude Code](https://code.claude.com) plugin for designers: generates a complete Figma design
system — color palette, spacing/scale tokens, and a two-platform typography system — directly into
a Figma file, using the Figma MCP connection. No standalone Figma plugin, UI, or build step involved;
Claude writes Figma Variables, text styles, and a visual reference frame for each system via the
Figma MCP tools.

## Prerequisites

- Claude Code with plugin support.
- A **Full Figma seat** and **edit permission on the target file**. Every skill here writes to
  Figma (variables, styles, a reference frame) — read-only access is not enough, and each skill
  checks for this before doing anything (see [Troubleshooting](#troubleshooting)).
- A one-time Figma OAuth authorization (below) — installing this plugin registers the connection
  for you; you just need to authorize it once.

## Install

### 1. Add the marketplace (once, if you haven't already)

```
/plugin marketplace add OnOAppsDev/ono-plugin-marketplace
```

### 2. Install the plugin

```
/plugin install matrix-studio@ono-plugin-marketplace
```

Claude Code restarts and the plugin's skills and its bundled Figma MCP server become available.

### 3. Authorize the Figma MCP connection (one-time)

```
/mcp
```

Find `figma` in the list and authorize it — this opens a browser window for Figma's OAuth login.
Sign in with the account that has the Full seat and file access described above. Full walkthrough
and troubleshooting: [`docs/figma-mcp-setup.md`](docs/figma-mcp-setup.md).

### 4. Verify

```
/plugin
```

You should see `matrix-studio` listed and enabled, with four skills available.

## Usage

Either invoke a skill explicitly, or just describe what you want in natural language — every skill's
trigger phrases are built into its description.

| Skill | Slash command | What it creates |
| --- | --- | --- |
| Color palette | `/matrix-studio:figma-color-palette-generator` | `Primitives` collection (77 COLOR variables) + `Semantic` collection (51 COLOR variables, Light/Dark modes) + a visual reference frame |
| Space & scale | `/matrix-studio:figma-space-scale-generator` | `Scale` collection (24 FLOAT primitives) + `Tokens` collection (77 FLOAT semantic aliases) + a visual reference frame |
| Typography | `/matrix-studio:figma-type-system-generator` | `Type Primitives` (42 FLOAT) + `Type Tokens` (7 STRING) collections + 48 variable-bound text styles (`desktop/*` + `mobile/*`) + a visual specimen frame |
| Full design system | `/matrix-studio:generate-design-system` | Runs all three above, in order, with one shared preflight, input pass, conflict check, and completion report |

Natural-language examples:
- "generate a color palette from #3B6FE8 in this Figma file"
- "create spacing and scale tokens in Figma"
- "set up a typography system using Inter"
- "build a complete design system in Figma from this brand color and Inter"

### How each skill works

1. Verify the Figma MCP connection and write access (Full seat + edit permission) — stops with
   setup instructions if either is missing.
2. Ask for the minimum inputs it needs (a hex color, a typeface, or nothing for Space & Scale).
3. Run its bundled Node script locally to generate the exact values.
4. Check the target Figma file for existing same-named collections/styles — if any exist, ask
   whether to cancel, generate only what's missing, or intentionally regenerate in place. Never
   silently duplicates or overwrites.
5. Write the Figma Variables (and, for typography, text styles bound to those variables) via the
   Figma MCP tools.
6. Render a visual reference frame and report exact counts vs. expected, plus any warnings.

### Running order for a new design system

The three individual skills are independent — they don't depend on each other's output — but if
you're starting from scratch, `/matrix-studio:generate-design-system` runs them in the order that
gives the most complete picture first: **Colors → Space & Scale → Typography**.

## Troubleshooting

See [`docs/figma-mcp-setup.md`](docs/figma-mcp-setup.md) for the full guide, including what to do
when:
- No Figma MCP tools are found at all
- The Figma server is installed but not authorized
- A skill stops because of missing seat/file permissions
- Authorization expires or was granted to the wrong Figma account
- A rerun reports fewer variables/styles created than expected (this is expected when you chose
  "generate only missing items" against a partially-existing setup)

## Updating

After a new version is published:

```
/plugin marketplace update ono-plugin-marketplace
```

Then reinstall/update `matrix-studio` from the marketplace as prompted.

## What this plugin does *not* do

- No standalone Figma plugin, `manifest.json`, plugin UI, TypeScript build, or esbuild config —
  Claude executes everything through the Figma MCP connection.
- No partial generation: if the Figma MCP connection or required permissions are missing, every
  skill stops and explains what's needed instead of generating an incomplete result.
- No silent duplication or overwrite: every skill checks for existing collections/variables/text
  styles first and asks before touching anything that already exists.
