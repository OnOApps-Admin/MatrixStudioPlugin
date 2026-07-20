# Semantic Token Reference

Full mapping for `Semantic` variable collection — two modes: **Light** and **Dark**.
All values are aliases to primitives from the `Primitives` collection.

## Naming convention
`color/{category}/{role}` — e.g. `color/background/default`

---

## Background

| Token | Light | Dark |
|-------|-------|------|
| `color/background/default` | neutral/50 | neutral/950 |
| `color/background/subtle` | neutral/100 | neutral/900 |
| `color/background/elevated` | white (#ffffff) | neutral/800 |
| `color/background/overlay` | neutral/200 | neutral/700 |
| `color/background/inverse` | neutral/900 | neutral/100 |

---

## Text

| Token | Light | Dark |
|-------|-------|------|
| `color/text/default` | neutral/950 | neutral/50 |
| `color/text/subtle` | neutral/600 | neutral/400 |
| `color/text/disabled` | neutral/400 | neutral/600 |
| `color/text/placeholder` | neutral/400 | neutral/600 |
| `color/text/inverse` | neutral/50 | neutral/950 |
| `color/text/on-primary` | white (#ffffff) | white (#ffffff) |

---

## Border

| Token | Light | Dark |
|-------|-------|------|
| `color/border/default` | neutral/200 | neutral/700 |
| `color/border/subtle` | neutral/100 | neutral/800 |
| `color/border/strong` | neutral/400 | neutral/500 |
| `color/border/focus` | primary/500 | primary/400 |
| `color/border/inverse` | neutral/700 | neutral/200 |

---

## Interactive — Primary

| Token | Light | Dark |
|-------|-------|------|
| `color/interactive/primary/default` | primary/600 | primary/400 |
| `color/interactive/primary/hover` | primary/700 | primary/300 |
| `color/interactive/primary/pressed` | primary/800 | primary/200 |
| `color/interactive/primary/disabled` | neutral/300 | neutral/700 |
| `color/interactive/primary/subtle` | primary/50 | primary/950 |
| `color/interactive/primary/on` | neutral/50 | neutral/50 |

---

## Interactive — Secondary

| Token | Light | Dark |
|-------|-------|------|
| `color/interactive/secondary/default` | secondary/600 | secondary/400 |
| `color/interactive/secondary/hover` | secondary/700 | secondary/300 |
| `color/interactive/secondary/pressed` | secondary/800 | secondary/200 |
| `color/interactive/secondary/subtle` | secondary/50 | secondary/950 |
| `color/interactive/secondary/on` | neutral/50 | neutral/50 |

---

## Status — Success

| Token | Light | Dark |
|-------|-------|------|
| `color/status/success/background` | success/50 | success/950 |
| `color/status/success/default` | success/600 | success/400 |
| `color/status/success/text` | success/700 | success/300 |
| `color/status/success/border` | success/200 | success/800 |
| `color/status/success/on` | white (#ffffff) | white (#ffffff) |

---

## Status — Warning

| Token | Light | Dark |
|-------|-------|------|
| `color/status/warning/background` | warning/50 | warning/950 |
| `color/status/warning/default` | warning/500 | warning/400 |
| `color/status/warning/text` | warning/700 | warning/300 |
| `color/status/warning/border` | warning/200 | warning/700 |
| `color/status/warning/on` | neutral/950 | neutral/950 |

---

## Status — Error

| Token | Light | Dark |
|-------|-------|------|
| `color/status/error/background` | error/50 | error/950 |
| `color/status/error/default` | error/600 | error/400 |
| `color/status/error/text` | error/700 | error/300 |
| `color/status/error/border` | error/200 | error/800 |
| `color/status/error/on` | white (#ffffff) | white (#ffffff) |

---

## Status — Info

| Token | Light | Dark |
|-------|-------|------|
| `color/status/info/background` | info/50 | info/950 |
| `color/status/info/default` | info/600 | info/400 |
| `color/status/info/text` | info/700 | info/300 |
| `color/status/info/border` | info/200 | info/800 |
| `color/status/info/on` | white (#ffffff) | white (#ffffff) |

---

## Brand (shortcut aliases)

| Token | Light | Dark |
|-------|-------|------|
| `color/brand/primary` | primary/600 | primary/400 |
| `color/brand/secondary` | secondary/600 | secondary/400 |
| `color/brand/primary-subtle` | primary/50 | primary/950 |
| `color/brand/secondary-subtle` | secondary/50 | secondary/950 |

---

## Variable Scopes (important — set explicitly)

| Category | Recommended scopes |
|----------|-------------------|
| Background tokens | `FRAME_FILL`, `SHAPE_FILL` |
| Text tokens | `TEXT_FILL` |
| Border tokens | `STROKE_COLOR` |
| Interactive tokens | `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL` |
| Status tokens | `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL` |
| Primitive color stops | `ALL_SCOPES` (intentional — these are the raw values) |
