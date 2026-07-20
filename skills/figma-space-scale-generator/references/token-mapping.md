# Space & Scale Token Reference

Two-tier structure: `Scale` collection (primitives) → `Tokens` collection (semantic aliases).

---

## Collection 1: Scale (Primitives)

Single mode: `Value`. Type: `FLOAT`. Scope: `ALL_SCOPES`.

| Variable | Value |
|----------|-------|
| `scale/0` | 0 |
| `scale/1` | 1 |
| `scale/2` | 2 |
| `scale/4` | 4 |
| `scale/8` | 8 |
| `scale/12` | 12 |
| `scale/16` | 16 |
| `scale/20` | 20 |
| `scale/24` | 24 |
| `scale/32` | 32 |
| `scale/40` | 40 |
| `scale/48` | 48 |
| `scale/56` | 56 |
| `scale/64` | 64 |
| `scale/80` | 80 |
| `scale/96` | 96 |
| `scale/128` | 128 |
| `scale/160` | 160 |
| `scale/192` | 192 |
| `scale/256` | 256 |
| `scale/320` | 320 |
| `scale/384` | 384 |
| `scale/512` | 512 |
| `scale/full` | 9999 |

**Total: 24 primitives** (22 grid values + `scale/1` hairline + `scale/full` pill)

---

## Collection 2: Tokens (Semantic aliases)

Single mode: `Value`. Type: `FLOAT`. Values are aliases to `Scale` collection.

### spacing — scope: `GAP`
Used for: auto-layout gap between elements.

`spacing/0` → `scale/0` | `spacing/2` → `scale/2` | `spacing/4` → `scale/4`
`spacing/8` → `scale/8` | `spacing/12` → `scale/12` | `spacing/16` → `scale/16`
`spacing/20` → `scale/20` | `spacing/24` → `scale/24` | `spacing/32` → `scale/32`
`spacing/40` → `scale/40` | `spacing/48` → `scale/48` | `spacing/56` → `scale/56`
`spacing/64` → `scale/64` | `spacing/80` → `scale/80` | `spacing/96` → `scale/96`
`spacing/128` → `scale/128`

### padding — scope: `HORIZONTAL_PADDING`, `VERTICAL_PADDING`
Used for: inner padding of frames, cards, inputs, buttons.

Same stop set as spacing: `padding/0` through `padding/128`.

### radius — scope: `CORNER_RADIUS`
Used for: corner radius on frames, inputs, buttons, cards, images.

`radius/0` → `scale/0` | `radius/1` → `scale/1` | `radius/2` → `scale/2`
`radius/4` → `scale/4` | `radius/8` → `scale/8` | `radius/12` → `scale/12`
`radius/16` → `scale/16` | `radius/24` → `scale/24` | `radius/32` → `scale/32`
`radius/full` → `scale/full`

### border — scope: `STROKE_WEIGHT`
Used for: stroke weight on all elements.

`border/1` → `scale/1` | `border/2` → `scale/2`
`border/4` → `scale/4` | `border/8` → `scale/8`

### size — scope: `WIDTH`, `HEIGHT`
Used for: fixed dimensions on icons, avatars, buttons, touch targets, thumbnails.

`size/16` through `size/512` — full set from the grid script output.

### opacity — scope: `OPACITY`
**Not aliases** — hardcoded floats (0–1 range). Percentages in names for readability.

| Variable | Value |
|----------|-------|
| `opacity/0` | 0.00 |
| `opacity/5` | 0.05 |
| `opacity/10` | 0.10 |
| `opacity/20` | 0.20 |
| `opacity/25` | 0.25 |
| `opacity/30` | 0.30 |
| `opacity/40` | 0.40 |
| `opacity/50` | 0.50 |
| `opacity/60` | 0.60 |
| `opacity/70` | 0.70 |
| `opacity/75` | 0.75 |
| `opacity/80` | 0.80 |
| `opacity/90` | 0.90 |
| `opacity/100` | 1.00 |

---

## Summary

| Collection | Variables |
|------------|-----------|
| Scale (primitives) | 24 |
| spacing | 16 |
| padding | 16 |
| radius | 10 |
| border | 4 |
| size | 17 |
| opacity | 14 |
| **Total tokens** | **77** |
