# lozuc — Build Spec

Product source of truth: `.qa/mapa-de-entregas.pdf` (Mapa de Entregas v1 — git-ignored copy) and `src/store.ts` (encodes it).
Design rules: `PLAYBOOK.md` (research). Language: PT-BR. Audience: men. Mobile iOS first (393×852), same screens power the web app.

## Non-negotiables (Mapa de Entregas)
No beauty score, ranking or percentile · every observation tagged **observado / informado / incerto** ·
simulations only change hair, beard, brows and tones (identity preserved) · skincare = cosmetic education, never
diagnosis/prescription; irritation → simplify + suggest a professional · no surgery, no clinical claims, no "equipe médica" ·
up to 3 directions (never pad) · dates are review milestones, not biological promises.

## Visual language
Liquid glass everywhere: `.glass` + variant (`frost | smoke | pill | well | ink | sage`) and add `.liquid` on floating
controls/sheets/tab bar (SVG refraction on Chromium). Pointer specular (`useSpecular`) and depth tilt (`useTilt` + `.tilt`).
3D: `<FaceView>` (src/three/FaceView.tsx contract) on almost every screen — the client's head is the recurring hero.
Display type: `.display` (Bricolage Grotesque); UI: Geist. Palette: pine / sage / mist / brass / clay (attention).

## Layout
`<ScreenFrame tabs?>` = 393×852 on mobile (safe areas top 59 / bottom 34; floating tab bar needs `TABBAR_SPACE`=112 bottom space),
and a full-pane `@container` in the web app (`mode==='web'`, no tab bar — sidebar instead). Screens MUST be fluid (no hard 393 widths)
and switch to a two-column composition with container queries (`@3xl:` ≈ 768px pane) in web mode.

## Ownership
| Agent | Files |
| --- | --- |
| 3D engine | `src/three/**` (reference: `src/three/_facet/**`, excluded from tsc) |
| Screens A — stages 1–2 | `src/screens/{Welcome,Profile,Consent,Capture,Processing}.tsx` + `src/screens/a/**` |
| Screens B — stages 3–4 | `src/screens/{Reading,Paywall,Directions,Simulation}.tsx` + `src/screens/b/**` |
| Screens C — stages 5–6 | `src/screens/{Guide,Routine,Plan,Home,Personal,Evolution,Settings}.tsx` + `src/screens/c/**` |
| Lead | everything else (store, shell, ui kit, web shell, App) |
