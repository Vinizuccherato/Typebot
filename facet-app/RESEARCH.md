# facet. — mini research & design decisions

## Flow (market pattern for face-analysis / visagism apps)
Short and value-first: brand → promise → personalise → capture → report → act.
1. **Splash** — brand mark, ≤ 2.5 s, no interaction.
2. **Onboarding** — 3 swipeable value slides max, skip, single pinned CTA, privacy promise up front
   (state whether images leave the device and how to delete them).
3. **Goals** — one question per step, multi-select cards, visible progress; answers editable later.
4. **Scan** — camera priming before the system prompt, oval guide, live feedback (light, distance,
   centring, hold still), progress; "upload a photo instead" fallback for privacy-sensitive users.
5. **Results** — summary first (face shape + harmony score), then ratios (thirds, L:W), symmetry,
   plain-language meaning; avoid absolute/authoritative claims; never use age/ethnicity/celebrity shortcuts.
6. **Try-on / recommendations** — eyewear, brows, hair tuned to the result, live preview, save/compare.

## Dimensions (iPhone 15/16 logical canvas 393×852)
- Safe areas: top 59 pt (status bar + Dynamic Island), bottom 34 pt (home indicator).
- Side margins 20 pt (16 min); 8-pt spacing grid (4 for hairlines/micro gaps).
- Touch targets ≥ 44×44 pt; primary CTA 56 pt tall, capsule; pinned 16 pt above the home indicator.
- Type scale (pt): display 40/44, large title 32, title 24, headline 17 semibold, body 16, callout 15,
  footnote 13, caption 12, micro label 11 (uppercase +0.12em).
- Radii: screen-level cards 28, inner cards 20, chips 14–999, thumbnails 16.
- Motion: springs (stiffness 260–520), 180–320 ms UI transitions, reduced-motion respected.

## Identity — "facet." (Midnight Orchid)
- Ink #0E0C12 → #19141F background, porcelain text #F4EFEA, lilac accent #C3B4FF, champagne #E8CBA8,
  mint for success #9FE3C4. Thermal ramp: plum → lilac → champagne → white.
- Display: Fraunces (variable, soft serif, italics for emphasis). UI: Manrope.
- Materials carried over from the previous builds: liquid glass with refraction edge + pointer specular
  (Domus), light frost sheets and metaball CTAs (ring app), metric cards & semicircular gauges (Soma),
  thermal 3D head, landmarks & proportion overlays (Facial telemetry), live 3D avatar with brows/glasses (Appearance).
