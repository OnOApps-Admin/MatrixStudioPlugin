# Changelog

All notable changes to this plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this plugin adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-07-20

### Added
- Initial release: `figma-color-palette-generator`, `figma-space-scale-generator`,
  `figma-type-system-generator`, and the `generate-design-system` orchestrator skill.
- Bundled Figma MCP server (`https://mcp.figma.com/mcp`) so installing the plugin registers the
  connection automatically.
- Preflight checks in every skill for Figma MCP tool availability and for a Full Figma seat +
  edit permission on the target file, with setup instructions when either is missing.
- Conflict detection before any generation: every skill checks for existing same-named
  collections, variables, or text styles and asks whether to cancel, generate only missing
  items, or intentionally regenerate — never silently duplicates or overwrites.
