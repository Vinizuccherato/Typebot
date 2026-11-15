# Soma — Build Spec

Reference: `.qa/reference.jpg` (git-ignored). Built as a full-screen app (no tablet mockup). Design canvas **1440×1000**.

Stack: Vite 6 · React 19 · TypeScript · Tailwind 4 · Motion 12 · three 0.177 + R3F 9 + drei 10 + postprocessing · Zustand 5 · lucide-react · Outfit Variable.

## Contracts (lead-owned — do not edit)
`src/store.ts` (`useSoma`: tab, date, metric, expanded, live CGM series/stats, metrics, score parts, sensor, macros, cholesterol, goals, toasts, tick) ·
`src/lib/glucose.ts` (day generator, `stats`, `slotLabel`, `RANGE_LOW/HIGH`) · `src/index.css` (light `.glass` + `glass-frost | smoke | pill | well | ink`, `.label`, `.hairline`) ·
`src/ui/*` (Glass, IconButton, Toggle, AnimatedNumber) · `src/lib/*` · `src/layout/Artboard.tsx` · `src/App.tsx` (slot map `LAYOUT`).

## Ownership
| Agent | Files |
| --- | --- |
| Scene (figure, sensor, radial metric menu) | `src/scene/**` |
| Chrome & left column | `src/components/chrome/**`, `src/components/left/**` |
| Right & bottom cards | `src/components/right/**` |

## Rules
- Drags via `usePointerDrag` (scale-safe). Every control: hover, press, focus-visible, keyboard, aria. Springs from `springs`.
- No runtime network assets; no photos of real people — everything procedural/SVG/WebGL.
- Backdrop roots: never animate opacity/filter on an ancestor of `.glass`; nested static glass drops its blur.
