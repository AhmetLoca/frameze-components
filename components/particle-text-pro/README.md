# Particle Text Pro FX

An interactive, canvas-rendered particle text component for Framer. Text is sampled pixel-by-pixel and rendered as thousands of animated dots that react to the cursor.

## When to use this

A headline that visitors are meant to *play with* — hero sections, coming-soon pages, agency landing pages, anywhere a static heading would undersell the interaction. Not a fit for body copy or anything that needs to stay perfectly legible while animating (it's decorative-first).

## Preview

Live: https://particletextprofx.framer.website/ ($8 — part of the [Frameze](https://frameze.com) library)

## Install (Framer)

1. Copy `ParticleTextPro.tsx` into a new Code Component in your Framer project.
2. Drop it on the canvas, set `text` to your headline.
3. Pick an `interactionMode` (repel/attract/vortex/none) and an `introStyle` (scatter/fall/rise).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | `"Loca"` | The text rendered as particles. |
| `interactionMode` | `"repel" \| "attract" \| "vortex" \| "none"` | `"repel"` | How particles respond to cursor proximity. |
| `dispersionStrength` / `dispersionRadius` | `number` | `50` / `100` | Force and reach of the cursor interaction. |
| `introStyle` | `"scatter" \| "fall" \| "rise"` | `"scatter"` | How particles enter on first load. |
| `autoFit` | `boolean` | `false` | Scales font size to fill the container width instead of a fixed `fontSize`. |
| `particleColor` / `backgroundColor` | `Color` | `#87FFE3` / `#000000` | Base colors. |
| `useGradient` | `boolean` | `false` | Gradient fill between `particleColor` and `gradientColorTo`. |
| `velocityColor` | `boolean` | `false` | Particles shift toward `velocityColorTo` as they speed up. |
| `clickBurst` | `boolean` | `false` | Click/tap triggers an explosive scatter that auto-returns to form. |
| `idleOscillation` | `boolean` | `false` | Subtle sin-wave breathing motion when the cursor isn't nearby. |
| `demoMode` | `boolean` | `false` | Floating control panel for live-toggling settings during a presentation — turn off before shipping. |

See `component.json` for the full machine-readable prop schema.

## Notes

- Pure Canvas 2D, no external dependencies beyond `framer`.
- Rebuilds the particle field on font-ready, container resize (debounced 150ms), and text/font prop changes — not on every render.
- `demoMode` overrides `interactionMode`/`autoFit`/`idleOscillation` locally via internal state so you can flip through options live without touching the property panel.
