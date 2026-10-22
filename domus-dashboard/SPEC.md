# Domus — Build Spec

Reference: `.qa/reference.jpg` (git-ignored copy of the source shot). Design canvas **1600×900**.

## Stack
Vite 6 · React 19 · TypeScript (strict) · Tailwind CSS 4 · Motion 12 (`motion/react`) ·
Three.js 0.177 + @react-three/fiber 9 + drei 10 + postprocessing · Zustand 5 · lucide-react · Outfit Variable.

## Contracts (shared — owned by the lead, do not edit)
| File | Purpose |
| --- | --- |
| `src/store.ts` | `useDomus` — single source of truth (rooms, nodes, door, eco, solar, energy, climate, lamp, led, speaker, assistant, UI focus). |
| `src/index.css` | Tokens + liquid-glass material: `.glass` + `glass-frost / smoke / inset / well / ink / pill / solid`, `.hatch`, `.hairline`, `.tabular`. |
| `src/ui/*` | `Glass`, `IconButton`, `Chip`, `Toggle`, `AnimatedNumber`. |
| `src/lib/*` | `cn`, `clamp`, `mapRange`, `springs`; `useSpecular`; `usePointerDrag` (scale-safe dragging); `SCENES` macros. |
| `src/layout/Artboard.tsx` | Scaled canvas, `useArtboard()` → `{ mode, scale, width, height }`; `--s` CSS var = scale. |
| `src/App.tsx` | Slot map (`LAYOUT`). |

## Slots (design px)
| Slot | Box |
| --- | --- |
| header | left 32 · right 32 · top 26 · h 46 |
| sidebar | left 32 · top 120 · w 52 |
| greeting | left 132 · top 122 · w 300 |
| energy | left 132 · top 272 · 280×258 |
| climate | left 32 · bottom 32 · 392×282 |
| devices | left 436 · bottom 32 · 700×282 |
| room | right 32 · top 98 · w 388 · bottom 208 (≈594 tall at 900) |
| assistant | right 32 · bottom 32 · 388×162 |

Components fill their slot (`h-full w-full`) and must also work in compact mode
(full width 343–720px, heights as in `CompactLayout`).

## Rules
- Drag interactions use `usePointerDrag` (motion `drag` breaks under the scaled artboard).
- Every interactive control: hover, press, focus-visible, keyboard (arrows on sliders), aria.
- Motion: springs from `springs`; respect `prefers-reduced-motion`.
- No external network at runtime (no CDN HDRIs, no remote images) — everything is procedural/SVG.
- Text uses `--text*` opacities; accent `#c6ef8e` (lime glow).

## Ownership
| Agent | Files |
| --- | --- |
| Scene architect | `src/scene/**` |
| Chrome & left column | `src/components/chrome/**`, `src/components/left/**` |
| Smart devices | `src/components/devices/**` |
| Room & assistant | `src/components/room/**`, `src/components/assistant/**` |
| Fidelity QA | read-only + `.qa/**` report |

## Glass gotchas
- An ancestor with `opacity < 1`, `filter`, `mask`, `clip-path` or `backdrop-filter` is a *backdrop root*:
  glass inside it only blurs that ancestor's content. Animate transform on wrappers and fade the
  `Glass` element itself; render floating popovers outside other glass surfaces (portal).
- Nested inset/well/pill/solid surfaces drop their own backdrop blur (invisible there, expensive); nested popovers should use frost/smoke.
