# Appearance Studio — Build Spec

Reference: `.qa/reference.jpg` (git-ignored). Full-screen app. Design canvas **1440×1020**.
The reference's centre is a photo of a real young person: we do NOT reproduce it. The centre is a procedural,
anonymous ADULT 3D avatar that renders the user's choices live (face form, eyes, iris colour, brows, glasses).

Stack: Vite 6 · React 19 · TypeScript · Tailwind 4 · Motion 12 · three 0.177 + R3F 9 + drei 10 + postprocessing · Zustand 5 · lucide-react · Outfit Variable.

## Contracts (lead-owned — do not edit)
- `src/store.ts` — `useStudio`: nav, region, hovered, look (face form, glasses, eye form/colour, brow form/colour, strength per region, shirt), saved, comparing, zoom, resetNonce, undo/redo history, toasts. `useRenderedLook()` = what the avatar renders.
- `src/lib/face.ts` — head frame + landmarks (1 unit = 10 cm, origin nasion, +Z to viewer).
- `src/lib/avatar.ts` — `avatarRegistry` { mesh, morph(), version } published by the sculptor.
- `src/index.css`, `src/ui/*`, `src/lib/*`, `src/layout/Artboard.tsx`, `src/App.tsx` (`LAYOUT`).

## Ownership
| Agent | Files |
| --- | --- |
| Avatar sculptor (head, skin, eyes, hair, body, camera) | `src/scene/**` — mounts `<AccessoryLayer/>` inside the head group |
| Brows, glasses, region picking & focus overlays | `src/accessories/**` |
| Interface (header, rail, frame, all panels, bottom bar, toasts) | `src/components/**` |
