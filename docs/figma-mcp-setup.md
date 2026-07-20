# Figma MCP setup

All four `matrix-studio` skills write directly into a Figma file through the Figma MCP connection —
there is no separate Figma plugin to install. This doc covers the one-time setup and the most common
problems designers hit.

## Prerequisite: Full Figma seat + edit permission

Every skill in this plugin **writes** to Figma (variables, text styles, and a visual reference
frame) — it never just reads. That requires:

- A **Full seat** on your Figma organization (View-only / Collab-only seats can read but not create
  variables or styles).
- **Edit permission on the specific target file** (not just Can view / Dev Mode access).

If either is missing, every skill's preflight check stops before making any change and tells you
which one is missing — it never attempts a partial generation. If you hit this, ask your Figma
admin to upgrade your seat or your file permission, then retry.

## One-time setup

1. Install the plugin (see the main [README](../README.md#install) if you haven't yet). Installing
   `matrix-studio` also registers its bundled `figma` MCP server (`https://mcp.figma.com/mcp`) —
   you don't need to configure anything separately.
2. In Claude Code, run:
   ```
   /mcp
   ```
3. Find `figma` in the list and authorize it. This opens a browser window for Figma's OAuth login —
   sign in with the Figma account that has the seat/permissions above.
4. Once authorized, `/mcp` should show `figma` as connected. You're done — this is a one-time step
   per machine/account.

## Pointing Claude at a file

You can either:
- Paste the Figma file's URL when a skill asks for it, or
- Have the file already open and selected in your Figma desktop/browser session, and tell Claude
  "use the file I have open."

Either way, confirm with Claude which file it's about to write to before it starts — every skill's
Step 1 asks for this explicitly.

## Troubleshooting

**"No Figma MCP tools found" / a skill stops immediately at its prerequisites step**
Run `/mcp` and check that a Figma server is listed at all. If it's missing entirely, reinstall or
re-enable the plugin (`/plugin`), then retry `/mcp`.

**"Found an `authenticate` tool but no working tools"**
The server is installed but not authorized yet (or the authorization expired). Run `/mcp`,
re-authorize `figma`, and retry the skill.

**A skill stops and says it can't verify write access / mentions a Full seat or edit permission**
This is the seat/permission check working as intended — see the Prerequisite section above. Common
causes:
- Your Figma account only has a View-only or Collab seat → ask your admin for a Full seat.
- You have a Full seat but only Can view / Dev Mode access to *this specific file* → ask the file's
  owner for edit access.
- You authorized with a different Figma account than the one with access → run `/mcp`, remove the
  `figma` connection, and re-authorize with the correct account.

**Authorization worked before but stopped working**
Figma OAuth tokens can expire or be revoked. Run `/mcp`, re-authorize `figma`, and retry.

**A skill reports it created fewer variables/styles than expected**
This is expected, not a bug, if you chose "generate only missing items" during a conflict check and
some of that collection already existed. Compare the reported actual vs. expected counts in the
skill's own report — if you didn't choose that option and still see a mismatch, that's worth
investigating; re-run the skill's own verify step and check the Figma file directly.

**Re-running a skill against a file that already has a design system in it**
Every skill checks for existing `Primitives`/`Semantic`/`Scale`/`Tokens`/`Type Primitives`/
`Type Tokens` collections and `desktop/*`/`mobile/*` text styles before creating anything, and will
stop to ask whether to cancel, generate only what's missing, or intentionally regenerate in place.
It never silently duplicates a collection or overwrites existing values.
