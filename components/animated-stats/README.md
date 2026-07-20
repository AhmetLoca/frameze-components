# Animated Stats

A stat/metric row for Framer with count-up number animation and staggered entrance.

## When to use this

You have a row of numbers — users, revenue, satisfaction score, whatever — and a static `<p>340K</p>` feels flat. This counts up from 0 with an `easeOutExpo` curve the moment the row scrolls into view, and staggers each stat in with a configurable delay so they don't all pop at once.

## Preview

Live: https://animatedstatspro.framer.website/ (Free — part of the [Frameze](https://frameze.com) library)

## Install (Framer)

1. Copy `AnimatedStats.tsx` into a new Code Component in your Framer project.
2. Drop it on the canvas — it ships with sensible defaults (4 stats, blur entrance, dark theme).
3. Edit the `stats` array in the property panel to your real numbers.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `stats` | `{ number, suffix, label }[]` | 4 example stats | Up to 6 stat items. `number` is a string so decimals (`"4.9"`) are preserved. |
| `theme` | `"dark" \| "light"` | `"dark"` | Built-in color pair. Ignored if `useCustomColors` is on. |
| `animationType` | `"blur" \| "slide" \| "fade" \| "scale"` | `"blur"` | Entrance style for each stat. |
| `layout` | `"1x4" \| "2x2" \| "4x1"` | `"1x4"` | Grid arrangement. |
| `countDuration` | `number` (ms) | `2700` | How long the count-up takes. |
| `staggerDelay` | `number` (ms) | `250` | Delay between each stat's entrance. |
| `replayOnReenter` | `boolean` | `false` | Replay the animation every time the row scrolls back into view, instead of just once. |
| `useCustomColors` | `boolean` | `false` | Override the theme's background/text/divider colors individually. |
| `demoMode` | `boolean` | `false` | Adds a floating control panel below the component for live-tweaking during a presentation — turn off before shipping. |

See `component.json` for the full machine-readable prop schema.

## Notes

- Uses `useIsStaticRenderer()` from `framer` so Framer's canvas thumbnail and static export render the final numbers immediately, without animating.
- No external dependencies beyond `framer` itself.
