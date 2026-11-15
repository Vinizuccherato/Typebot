import { Matrix4, Raycaster, Vector3, type Mesh, type Object3D } from 'three'
import { FEATURES, LANDMARKS, type FeatureId, type LandmarkId } from '../lib/face'

/* ──────────────────────────────────────────────────────────────
   Visagism model: landmark resolution on the scanned head, facial
   measurements (mm / ° / ratios), face-shape classification and
   per-feature insights. Pure (no React) so the 3D layer and the
   inspector share one source.
   ────────────────────────────────────────────────────────────── */

export const MM = 100 // 1 head unit = 10 cm
export const PHI = 1.618

export type Points = Record<LandmarkId, Vector3>
export type Normals = Record<LandmarkId, Vector3>

const IDS = Object.keys(LANDMARKS) as LandmarkId[]

/** Placeholder surface before the sculpted head exists (soft ellipsoid, nose bump). */
export function placeholderZ(x: number, y: number) {
  const e = 1 - (x / 0.86) ** 2 - ((y + 0.3) / 1.12) ** 2
  const base = 0.92 * Math.sqrt(Math.max(0, e)) - 0.36
  const nose = 0.2 * Math.exp(-(x * x) / 0.012 - ((y + 0.3) * (y + 0.3)) / 0.05)
  return base + nose
}

/** Deterministic scan noise (±0.35 mm) so symmetry deltas read like a real capture. */
const jitter = (id: string, axis: number) => {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (axis + 7), 2246822519)
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.007
}

const ray = new Raycaster()
const tmpO = new Vector3()
const tmpD = new Vector3()
const inv = new Matrix4()

/**
 * Resolve every landmark onto the head surface by casting along −Z (head-local)
 * from z = +2. `space` is the object whose local frame is head-local (the analysis
 * layer's group). Falls back to the placeholder surface for misses / no mesh.
 */
export function resolveLandmarks(mesh: Mesh | null, space: Object3D | null): { points: Points; normals: Normals; fromMesh: boolean } {
  const points = {} as Points
  const normals = {} as Normals
  let hits = 0
  if (mesh && space) {
    mesh.updateWorldMatrix(true, false)
    space.updateWorldMatrix(true, false)
    inv.copy(space.matrixWorld).invert()
  }
  for (const id of IDS) {
    const { x, y } = LANDMARKS[id]
    let p: Vector3 | null = null
    let n: Vector3 | null = null
    if (mesh && space) {
      tmpO.set(x, y, 2).applyMatrix4(space.matrixWorld)
      tmpD.set(x, y, -2).applyMatrix4(space.matrixWorld).sub(tmpO).normalize()
      ray.set(tmpO, tmpD)
      const hit = ray.intersectObject(mesh, false)[0]
      if (hit) {
        p = hit.point.clone().applyMatrix4(inv)
        if (hit.face) {
          n = hit.face.normal.clone().transformDirection(mesh.matrixWorld).transformDirection(inv)
        }
        hits++
      }
    }
    if (!p) p = new Vector3(x, y, placeholderZ(x, y))
    if (!n) {
      const dz = 0.01
      const zx = (placeholderZ(x + dz, y) - placeholderZ(x - dz, y)) / (2 * dz)
      const zy = (placeholderZ(x, y + dz) - placeholderZ(x, y - dz)) / (2 * dz)
      n = new Vector3(-zx, -zy, 1).normalize()
    }
    p.x += jitter(id, 0)
    p.y += jitter(id, 1)
    points[id] = p
    normals[id] = n
  }
  return { points, normals, fromMesh: hits > IDS.length / 2 }
}

export function placeholderPoints() {
  return resolveLandmarks(null, null)
}

/* ── region classification (mirrored in the highlight shader) ── */

export const FEATURE_ORDER: FeatureId[] = ['forehead', 'brows', 'eyes', 'nose', 'cheekbones', 'lips', 'jaw', 'chin']

/** Which facial feature a head-local surface point belongs to (null = off-face). */
export function classify(x: number, y: number, z: number): FeatureId | null {
  if (z < -0.32 || y > 0.78 || y < -1.32 || Math.abs(x) > 0.84) return null
  const ax = Math.abs(x)
  if (y > 0.26) return 'forehead'
  if (y > 0.05) return ax < 0.1 ? 'forehead' : 'brows'
  if (y > -0.14) return ax < 0.11 ? 'nose' : ax < 0.6 ? 'eyes' : 'cheekbones'
  if (y > -0.62) return ax < 0.22 ? 'nose' : 'cheekbones'
  if (y > -0.95) return ax < 0.34 ? 'lips' : 'jaw'
  return ax < 0.3 ? 'chin' : 'jaw'
}

/* ── measurements ── */

export type Unit = 'mm' | '°' | 'ratio' | '%'

export interface Measure {
  id: string
  label: string
  value: number
  unit: Unit
  /** ideal value (same unit) */
  ideal?: number
  /** tolerance for a 0-score drift (same unit) */
  tol?: number
  /** 0–100 closeness to ideal (100 when no ideal) */
  score: number
}

/** 3D visual primitives for the measurement overlay (head-local landmark ids). */
export type Visual =
  | { kind: 'dim'; a: LandmarkId; b: LandmarkId; axis: 'x' | 'y' | 'free'; offset: number; label: string }
  | { kind: 'angle'; a: LandmarkId; v: LandmarkId; b: LandmarkId; label: string }
  | { kind: 'chain'; ids: LandmarkId[]; axis: 'x' | 'y'; offset: number; labels: string[] }

export interface FeatureReport {
  id: FeatureId
  label: string
  measures: Measure[]
  visuals: Visual[]
  score: number
  insight: string
  /** headline ratio for the inspector's ratio visual */
  ratio?: { label: string; a: number; b: number; ideal: [number, number] }
}

const d = (p: Points, a: LandmarkId, b: LandmarkId) => p[a].distanceTo(p[b]) * MM
const dx = (p: Points, a: LandmarkId, b: LandmarkId) => Math.abs(p[a].x - p[b].x) * MM
const dy = (p: Points, a: LandmarkId, b: LandmarkId) => Math.abs(p[a].y - p[b].y) * MM
const r1 = (v: number) => Math.round(v * 10) / 10
const r2 = (v: number) => Math.round(v * 100) / 100

/** Angle at v between va and vb, degrees. */
export function angleAt(p: Points, a: LandmarkId, v: LandmarkId, b: LandmarkId) {
  const u = p[a].clone().sub(p[v]).normalize()
  const w = p[b].clone().sub(p[v]).normalize()
  return (Math.acos(Math.min(1, Math.max(-1, u.dot(w)))) * 180) / Math.PI
}

const scoreOf = (value: number, ideal?: number, tol?: number) => (ideal === undefined || !tol ? 100 : Math.max(0, Math.round(100 - (Math.abs(value - ideal) / tol) * 100)))

const m = (id: string, label: string, value: number, unit: Unit, ideal?: number, tol?: number): Measure => ({
  id,
  label,
  value: unit === 'ratio' ? r2(value) : r1(value),
  unit,
  ideal,
  tol,
  score: scoreOf(value, ideal, tol),
})

const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / Math.max(1, xs.length)

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond' | 'Oblong'

export interface FaceSummary {
  shape: FaceShape
  shapeNote: string
  /** length / bizygomatic width */
  lengthRatio: number
  thirds: [number, number, number] // % of trichion→menton
  harmony: number // 0–100
  symmetry: number // 0–100
  asymmetryMm: number // mean L/R delta
}

export function analyse(p: Points): { reports: Record<FeatureId, FeatureReport>; summary: FaceSummary } {
  const faceLen = dy(p, 'trichion', 'menton')
  const cheek = dx(p, 'zygionR', 'zygionL')
  const jaw = dx(p, 'gonionR', 'gonionL')
  const brow = dx(p, 'browOuterR', 'browOuterL')
  const upper = dy(p, 'trichion', 'glabella')
  const middle = dy(p, 'glabella', 'subnasale')
  const lower = dy(p, 'subnasale', 'menton')
  const icd = dx(p, 'endoR', 'endoL')
  const ipd = dx(p, 'pupilR', 'pupilL')
  const eyeR = d(p, 'endoR', 'exoR')
  const eyeL = d(p, 'endoL', 'exoL')
  const eyeW = (eyeR + eyeL) / 2

  // brows
  const browLenR = d(p, 'browInnerR', 'browOuterR')
  const browLenL = d(p, 'browInnerL', 'browOuterL')
  const archH = avg([p.browPeakR.y - (p.browInnerR.y + p.browOuterR.y) / 2, p.browPeakL.y - (p.browInnerL.y + p.browOuterL.y) / 2]) * MM
  const tilt = avg([
    (Math.atan2(p.browOuterR.y - p.browInnerR.y, Math.abs(p.browOuterR.x - p.browInnerR.x)) * 180) / Math.PI,
    (Math.atan2(p.browOuterL.y - p.browInnerL.y, Math.abs(p.browOuterL.x - p.browInnerL.x)) * 180) / Math.PI,
  ])
  // ideal arch sits above the outer iris (≈ pupil + 0.4 eye width laterally)
  const archPos = avg([Math.abs(p.browPeakR.x - p.pupilR.x), Math.abs(p.browPeakL.x - p.pupilL.x)]) * MM
  const archIdeal = eyeW * 0.32

  // nose
  const noseLen = dy(p, 'nasion', 'subnasale')
  const alar = dx(p, 'alarR', 'alarL')
  const tipProj = (p.pronasale.z - (p.alarR.z + p.alarL.z) / 2) * MM
  const nasofrontal = angleAt(p, 'glabella', 'nasion', 'pronasale')
  const nasolabial = angleAt(p, 'pronasale', 'subnasale', 'labraleSup')

  // lips
  const mouthW = dx(p, 'cheilionR', 'cheilionL')
  const upperLip = dy(p, 'labraleSup', 'stomion')
  const lowerLip = dy(p, 'stomion', 'labraleInf')

  // jaw / chin
  const gonial = avg([angleAt(p, 'tragusR', 'gonionR', 'menton'), angleAt(p, 'tragusL', 'gonionL', 'menton')])
  const chinH = dy(p, 'labraleInf', 'menton')
  const subStom = dy(p, 'subnasale', 'stomion')
  const stomMent = dy(p, 'stomion', 'menton')

  // symmetry: mirrored pairs, |xR + xL| and |yR − yL|
  const pairs: [LandmarkId, LandmarkId][] = [
    ['browPeakR', 'browPeakL'], ['exoR', 'exoL'], ['endoR', 'endoL'], ['pupilR', 'pupilL'], ['zygionR', 'zygionL'],
    ['alarR', 'alarL'], ['cheilionR', 'cheilionL'], ['gonionR', 'gonionL'],
  ]
  const asym = avg(pairs.map(([r, l]) => Math.hypot(p[r].x + p[l].x, p[r].y - p[l].y) * MM))

  const reports: Record<FeatureId, FeatureReport> = {
    forehead: {
      id: 'forehead',
      label: FEATURES.forehead.label,
      measures: [
        m('upper', 'Upper third', upper, 'mm', faceLen / 3, faceLen * 0.08),
        m('upperPct', 'Share of face length', (upper / faceLen) * 100, '%', 33.3, 6),
        m('browSpan', 'Forehead width (temples)', brow, 'mm', cheek * 0.88, cheek * 0.12),
      ],
      visuals: [
        { kind: 'dim', a: 'trichion', b: 'glabella', axis: 'y', offset: -0.95, label: 'Upper third' },
        { kind: 'dim', a: 'browOuterR', b: 'browOuterL', axis: 'x', offset: 0.36, label: 'Temple width' },
      ],
      score: 0,
      insight: upper > faceLen * 0.36 ? 'Tall upper third — a soft fringe or side part rebalances the thirds.' : upper < faceLen * 0.3 ? 'Compact forehead — swept-back styling opens the upper third.' : 'Upper third in balance with the mid and lower face.',
      ratio: { label: 'Upper : face length', a: upper, b: faceLen, ideal: [1, 3] },
    },
    brows: {
      id: 'brows',
      label: FEATURES.brows.label,
      measures: [
        m('len', 'Brow length', (browLenR + browLenL) / 2, 'mm', eyeW * 1.55, eyeW * 0.35),
        m('arch', 'Arch height', archH, 'mm', 6, 4),
        m('archPos', 'Arch vs. outer iris', archPos, 'mm', archIdeal, 6),
        m('tilt', 'Tail tilt', tilt, '°', -4, 10),
        m('sym', 'L/R length Δ', Math.abs(browLenR - browLenL), 'mm', 0, 3),
      ],
      visuals: [
        { kind: 'dim', a: 'browInnerL', b: 'browOuterL', axis: 'free', offset: 0.06, label: 'Length' },
        { kind: 'angle', a: 'browInnerR', v: 'browPeakR', b: 'browOuterR', label: 'Arch' },
        { kind: 'dim', a: 'browPeakL', b: 'pupilL', axis: 'y', offset: 0.2, label: 'Arch rise' },
      ],
      score: 0,
      insight: archPos < archIdeal - 4 ? 'Arch sits inward — shift the peak toward the outer iris to open the eye.' : archPos > archIdeal + 4 ? 'Arch sits late — move the peak inward over the outer iris.' : 'Arch peak aligns with the outer iris — keep the tail on the nose–canthus line.',
      ratio: { label: 'Brow : eye width', a: (browLenR + browLenL) / 2, b: eyeW, ideal: [1.55, 1] },
    },
    eyes: {
      id: 'eyes',
      label: FEATURES.eyes.label,
      measures: [
        m('width', 'Palpebral width', eyeW, 'mm', 30, 5),
        m('icd', 'Intercanthal distance', icd, 'mm', eyeW, 5),
        m('ipd', 'Interpupillary distance', ipd, 'mm', 63, 6),
        m('fifths', 'Rule of fifths (ICD : eye)', icd / eyeW, 'ratio', 1, 0.25),
      ],
      visuals: [
        { kind: 'chain', ids: ['exoR', 'endoR', 'endoL', 'exoL'], axis: 'x', offset: -0.16, labels: ['Eye', 'Intercanthal', 'Eye'] },
        { kind: 'dim', a: 'pupilR', b: 'pupilL', axis: 'x', offset: 0.13, label: 'IPD' },
      ],
      score: 0,
      insight: icd > eyeW * 1.12 ? 'Wide-set eyes — darker inner-corner definition draws them together.' : icd < eyeW * 0.9 ? 'Close-set eyes — lighten the inner corners and extend the outer liner.' : 'Eye spacing matches one eye width — classic rule of fifths.',
      ratio: { label: 'Intercanthal : eye', a: icd, b: eyeW, ideal: [1, 1] },
    },
    nose: {
      id: 'nose',
      label: FEATURES.nose.label,
      measures: [
        m('len', 'Nasal length', noseLen, 'mm', middle * 0.9, 8),
        m('alar', 'Alar width', alar, 'mm', icd, 5),
        m('proj', 'Tip projection', tipProj, 'mm', 14, 8),
        m('nf', 'Nasofrontal angle', nasofrontal, '°', 125, 20),
        m('nl', 'Nasolabial angle', nasolabial, '°', 100, 20),
      ],
      visuals: [
        { kind: 'dim', a: 'nasion', b: 'subnasale', axis: 'y', offset: 0.3, label: 'Length' },
        { kind: 'dim', a: 'alarR', b: 'alarL', axis: 'x', offset: -0.16, label: 'Alar width' },
        { kind: 'dim', a: 'endoR', b: 'endoL', axis: 'x', offset: 0.12, label: 'Intercanthal' },
        { kind: 'angle', a: 'pronasale', v: 'subnasale', b: 'labraleSup', label: 'Nasolabial' },
      ],
      score: 0,
      insight: alar > icd * 1.1 ? 'Alar base wider than the intercanthal line — subtle side contour narrows it visually.' : 'Alar width matches the intercanthal distance — balanced 1:1 nasal base.',
      ratio: { label: 'Alar : intercanthal', a: alar, b: icd, ideal: [1, 1] },
    },
    cheekbones: {
      id: 'cheekbones',
      label: FEATURES.cheekbones.label,
      measures: [
        m('bizyg', 'Bizygomatic width', cheek, 'mm', 140, 14),
        m('lw', 'Face length : width', faceLen / cheek, 'ratio', 1.35, 0.25),
        m('jc', 'Jaw : cheek width', jaw / cheek, 'ratio', 0.86, 0.12),
      ],
      visuals: [
        { kind: 'dim', a: 'zygionR', b: 'zygionL', axis: 'x', offset: -0.04, label: 'Bizygomatic' },
        { kind: 'dim', a: 'trichion', b: 'menton', axis: 'y', offset: 1.0, label: 'Face length' },
      ],
      score: 0,
      insight: jaw / cheek < 0.78 ? 'Cheekbones dominate the width — highlight high on the zygion, soften the jaw.' : 'Cheekbone width carries the face — contour just under the zygion to sculpt.',
      ratio: { label: 'Length : width', a: faceLen, b: cheek, ideal: [1.35, 1] },
    },
    lips: {
      id: 'lips',
      label: FEATURES.lips.label,
      measures: [
        m('width', 'Mouth width', mouthW, 'mm', ipd * 0.82, 6),
        m('ratio', 'Upper : lower lip', lowerLip / Math.max(0.1, upperLip), 'ratio', 1.6, 0.5),
        m('upper', 'Upper vermilion', upperLip, 'mm', 8, 4),
        m('lower', 'Lower vermilion', lowerLip, 'mm', 12, 5),
      ],
      visuals: [
        { kind: 'dim', a: 'cheilionR', b: 'cheilionL', axis: 'x', offset: -0.17, label: 'Mouth width' },
        { kind: 'chain', ids: ['labraleSup', 'stomion', 'labraleInf'], axis: 'y', offset: 0.42, labels: ['Upper', 'Lower'] },
        { kind: 'dim', a: 'pupilR', b: 'pupilL', axis: 'x', offset: 0.14, label: 'IPD reference' },
      ],
      score: 0,
      insight: lowerLip / Math.max(0.1, upperLip) < 1.3 ? 'Full upper lip — define the lower lip centre for a 1:1.6 balance.' : 'Lip balance close to the 1:1.6 golden ratio.',
      ratio: { label: 'Upper : lower lip', a: upperLip, b: lowerLip, ideal: [1, 1.6] },
    },
    jaw: {
      id: 'jaw',
      label: FEATURES.jaw.label,
      measures: [
        m('bigonial', 'Bigonial width', jaw, 'mm', cheek * 0.86, 12),
        m('gonial', 'Gonial angle', gonial, '°', 122, 12),
        m('jc', 'Jaw : cheek ratio', jaw / cheek, 'ratio', 0.86, 0.12),
      ],
      visuals: [
        { kind: 'dim', a: 'gonionR', b: 'gonionL', axis: 'x', offset: -0.12, label: 'Bigonial' },
        { kind: 'angle', a: 'tragusR', v: 'gonionR', b: 'menton', label: 'Gonial' },
        { kind: 'angle', a: 'tragusL', v: 'gonionL', b: 'menton', label: 'Gonial' },
      ],
      score: 0,
      insight: gonial < 115 ? 'Square, defined angle — rounded collars and soft layers balance the line.' : gonial > 130 ? 'Soft, oblique jaw — contour below the gonion to sharpen the angle.' : 'Jaw angle in the classic 115–130° band.',
      ratio: { label: 'Jaw : cheek width', a: jaw, b: cheek, ideal: [0.86, 1] },
    },
    chin: {
      id: 'chin',
      label: FEATURES.chin.label,
      measures: [
        m('h', 'Chin height', chinH, 'mm', lower * 0.55, 8),
        m('split', 'Subnasale→stomion : stomion→menton', stomMent / Math.max(0.1, subStom), 'ratio', 2, 0.5),
        m('lower', 'Lower third', lower, 'mm', faceLen / 3, faceLen * 0.08),
      ],
      visuals: [
        { kind: 'chain', ids: ['subnasale', 'stomion', 'menton'], axis: 'y', offset: 0.5, labels: ['1', '2'] },
        { kind: 'dim', a: 'labraleInf', b: 'menton', axis: 'y', offset: -0.34, label: 'Chin' },
      ],
      score: 0,
      insight: stomMent / Math.max(0.1, subStom) < 1.7 ? 'Short chin segment — a defined pogonion lengthens the lower third.' : 'Lower third follows the classic 1:2 split.',
      ratio: { label: 'Upper lip : chin segment', a: subStom, b: stomMent, ideal: [1, 2] },
    },
  }

  for (const r of Object.values(reports)) {
    const scored = r.measures.filter((x) => x.ideal !== undefined)
    r.score = Math.round(avg(scored.map((x) => x.score)))
  }

  const lengthRatio = faceLen / cheek
  const jc = jaw / cheek
  const fc = brow / cheek
  let shape: FaceShape = 'Oval'
  if (lengthRatio > 1.5) shape = 'Oblong'
  else if (fc > jc + 0.12 && jc < 0.8) shape = 'Heart'
  else if (fc < 0.82 && jc < 0.82) shape = 'Diamond'
  else if (lengthRatio < 1.18) shape = jc > 0.9 ? 'Square' : 'Round'
  else if (jc > 0.93) shape = 'Square'
  const SHAPE_NOTE: Record<FaceShape, string> = {
    Oval: 'Balanced length and width with a softly tapering jaw — most styles suit it.',
    Round: 'Width close to length with soft angles — add height and vertical lines.',
    Square: 'Strong, wide jaw — soften with curves and texture at the cheek line.',
    Heart: 'Wider temples tapering to a narrow chin — add volume at the jaw.',
    Diamond: 'Cheekbones lead, narrow forehead and jaw — keep fullness at the temples.',
    Oblong: 'Long face — horizontal lines and side volume shorten it visually.',
  }

  const harmony = Math.round(avg(Object.values(reports).map((r) => r.score)))
  return {
    reports,
    summary: {
      shape,
      shapeNote: SHAPE_NOTE[shape],
      lengthRatio: r2(lengthRatio),
      thirds: [upper, middle, lower].map((v) => Math.round((v / faceLen) * 1000) / 10) as [number, number, number],
      harmony,
      symmetry: Math.max(0, Math.round(100 - asym * 12)),
      asymmetryMm: r1(asym),
    },
  }
}

export const fmt = (v: number, unit: Unit) => (unit === 'ratio' ? v.toFixed(2) : unit === '°' ? `${v.toFixed(1)}°` : unit === '%' ? `${v.toFixed(1)}%` : `${v.toFixed(1)} mm`)
