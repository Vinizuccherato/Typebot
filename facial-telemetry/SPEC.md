# Facial Data Telemetry — Build Spec

Reference: `.qa/reference.jpg` (git-ignored). Full-screen app (no monitor mockup). Design canvas **1600×1000**.
Goes beyond the shot: click a facial feature (brows, eyes, nose, cheekbones, lips, jaw, chin, forehead) to see
visagism proportions and measurements in 3D; rotate and zoom the head.

Stack: Vite 6 · React 19 · TypeScript · Tailwind 4 · Motion 12 · three 0.177 + R3F 9 + drei 10 + postprocessing · Zustand 5 · lucide-react · Outfit Variable.

## Contracts (lead-owned — do not edit)
- `src/store.ts` — `useFace`: tab, tool, selected/hovered feature, overlays, view nonces (reset/zoom), autoRotate, scan, live vitals (+rPPG samples), timeline, toasts, tick.
- `src/lib/face.ts` — head-local frame (1 unit = 10 cm, origin = nasion, +Z toward viewer), `LANDMARKS` (frontal x,y), `FEATURES`, `headRegistry.mesh`.
- `src/index.css` (dark `.glass` + `frost | smoke | pill | well | ink`), `src/ui/*`, `src/lib/*`, `src/layout/Artboard.tsx`, `src/App.tsx` (`LAYOUT`).

## Ownership
| Agent | Files |
| --- | --- |
| Head sculpture, thermal shader, camera | `src/scene/**` (mounts `<AnalysisLayer/>` inside the head group) |
| Visagism analysis (3D overlays + inspector) | `src/analysis/**` |
| Chrome & left column | `src/components/chrome/**`, `src/components/left/**` |
| Right & bottom cards | `src/components/right/**` |

## Rules
- Drags via `usePointerDrag`; every control has hover, press, focus-visible, keyboard, aria; springs from `springs`.
- No runtime network assets, no real person's likeness — the head is procedural and anonymous.
- Never animate opacity/filter on an ancestor of `.glass` (backdrop root); nested static glass drops its blur.
