import type { Mesh } from 'three'

/* ──────────────────────────────────────────────────────────────
   FACE CONTRACT — shared by the head sculptor (src/scene) and the
   visagism analysis layer (src/analysis).

   Head-local frame: +Y up, +X = viewer's right (subject's left), +Z toward the
   viewer. 1 unit = 10 cm. Origin = nasion (bridge of the nose between the eyes).

   Landmarks are given as FRONTAL (x, y) coordinates. The sculptor must place the
   anatomy so each landmark sits on the surface at that (x, y); the analysis layer
   finds the 3D point by raycasting along −Z from z = +2 onto the head mesh.
   Avatar studio: stylized adult proportions (rounder face, shorter midface, larger eyes) set by the sculptor.
   ────────────────────────────────────────────────────────────── */

export type LandmarkId =
  | 'trichion' | 'glabella' | 'nasion'
  | 'browInnerR' | 'browInnerL' | 'browPeakR' | 'browPeakL' | 'browOuterR' | 'browOuterL'
  | 'endoR' | 'endoL' | 'exoR' | 'exoL' | 'pupilR' | 'pupilL'
  | 'zygionR' | 'zygionL'
  | 'pronasale' | 'alarR' | 'alarL' | 'subnasale'
  | 'labraleSup' | 'stomion' | 'labraleInf' | 'cheilionR' | 'cheilionL'
  | 'gonionR' | 'gonionL' | 'pogonion' | 'menton'
  | 'tragusR' | 'tragusL'

/** R = subject's right = viewer's left (−X). */
export const LANDMARKS: Record<LandmarkId, { x: number; y: number; label: string }> = {
  trichion: { x: 0, y: 0.6, label: 'Trichion (hairline)' },
  glabella: { x: 0, y: 0.06, label: 'Glabella' },
  nasion: { x: 0, y: 0, label: 'Nasion' },
  browInnerR: { x: -0.18, y: 0.12, label: 'Brow head R' },
  browInnerL: { x: 0.18, y: 0.12, label: 'Brow head L' },
  browPeakR: { x: -0.42, y: 0.2, label: 'Brow arch R' },
  browPeakL: { x: 0.42, y: 0.2, label: 'Brow arch L' },
  browOuterR: { x: -0.6, y: 0.13, label: 'Brow tail R' },
  browOuterL: { x: 0.6, y: 0.13, label: 'Brow tail L' },
  endoR: { x: -0.17, y: -0.04, label: 'Inner canthus R' },
  endoL: { x: 0.17, y: -0.04, label: 'Inner canthus L' },
  exoR: { x: -0.53, y: -0.02, label: 'Outer canthus R' },
  exoL: { x: 0.53, y: -0.02, label: 'Outer canthus L' },
  pupilR: { x: -0.345, y: -0.035, label: 'Pupil R' },
  pupilL: { x: 0.345, y: -0.035, label: 'Pupil L' },
  zygionR: { x: -0.66, y: -0.15, label: 'Zygion R' },
  zygionL: { x: 0.66, y: -0.15, label: 'Zygion L' },
  pronasale: { x: 0, y: -0.35, label: 'Nose tip' },
  alarR: { x: -0.11, y: -0.41, label: 'Alar R' },
  alarL: { x: 0.11, y: -0.41, label: 'Alar L' },
  subnasale: { x: 0, y: -0.47, label: 'Subnasale' },
  labraleSup: { x: 0, y: -0.6, label: 'Upper lip' },
  stomion: { x: 0, y: -0.655, label: 'Stomion' },
  labraleInf: { x: 0, y: -0.73, label: 'Lower lip' },
  cheilionR: { x: -0.21, y: -0.645, label: 'Mouth corner R' },
  cheilionL: { x: 0.21, y: -0.645, label: 'Mouth corner L' },
  gonionR: { x: -0.55, y: -0.82, label: 'Jaw angle R' },
  gonionL: { x: 0.55, y: -0.82, label: 'Jaw angle L' },
  pogonion: { x: 0, y: -1.06, label: 'Pogonion' },
  menton: { x: 0, y: -1.12, label: 'Menton' },
  tragusR: { x: -0.76, y: -0.15, label: 'Tragus R' },
  tragusL: { x: 0.76, y: -0.15, label: 'Tragus L' },
}

export type FeatureId = 'forehead' | 'brows' | 'eyes' | 'nose' | 'cheekbones' | 'lips' | 'jaw' | 'chin'

/** Clickable facial regions (visagism). `anchor` is where the 3D hotspot sits. */
export const FEATURES: Record<FeatureId, { label: string; anchor: LandmarkId; landmarks: LandmarkId[] }> = {
  forehead: { label: 'Forehead', anchor: 'trichion', landmarks: ['trichion', 'glabella', 'browPeakR', 'browPeakL'] },
  brows: { label: 'Eyebrows', anchor: 'browPeakL', landmarks: ['browInnerR', 'browPeakR', 'browOuterR', 'browInnerL', 'browPeakL', 'browOuterL'] },
  eyes: { label: 'Eyes', anchor: 'pupilR', landmarks: ['endoR', 'exoR', 'pupilR', 'endoL', 'exoL', 'pupilL'] },
  nose: { label: 'Nose', anchor: 'pronasale', landmarks: ['nasion', 'pronasale', 'alarR', 'alarL', 'subnasale'] },
  cheekbones: { label: 'Cheekbones', anchor: 'zygionL', landmarks: ['zygionR', 'zygionL', 'tragusR', 'tragusL'] },
  lips: { label: 'Lips', anchor: 'labraleSup', landmarks: ['labraleSup', 'stomion', 'labraleInf', 'cheilionR', 'cheilionL'] },
  jaw: { label: 'Jawline', anchor: 'gonionR', landmarks: ['gonionR', 'gonionL', 'menton', 'pogonion'] },
  chin: { label: 'Chin', anchor: 'menton', landmarks: ['labraleInf', 'pogonion', 'menton'] },
}

/** The head mesh, published by the sculptor so the analysis layer can raycast onto it. */
export const headRegistry: { mesh: Mesh | null } = { mesh: null }
