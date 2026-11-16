import { Vector3 } from 'three'
import type { RegionId } from '../store'
import { anchors } from './anchors'

/* Region map in head-local frontal space (undeformed), shared by picking,
   hover glows and the focus brackets. */

/** Classify a head-local hit point into an editable region. */
export function classify(p: Vector3): RegionId {
  const ax = Math.abs(p.x)
  const y = p.y
  if (ax > 0.6 && ax < 0.9 && y > -0.24 && y < 0.14) return 'accessories' // temples / ear line
  if (ax < 0.09 && y > -0.16 && y < 0.07) return 'accessories' // bridge of the nose
  if (ax > 0.09 && ax < 0.7 && y >= 0.055 && y < 0.3) return 'brows'
  if (ax > 0.08 && ax < 0.62 && y > -0.17 && y < 0.055) return 'eyes'
  return 'face'
}

/** Corners (head-local, morphed) of the focus bracket box for a region. */
export function regionCorners(r: RegionId, out: Vector3[]): Vector3[] {
  const p = anchors.morphed
  const set = (i: number, x: number, y: number, z: number) => (out[i] ??= new Vector3()).set(x, y, z)
  switch (r) {
    case 'eyes': {
      const y = (p.pupilL.y + p.pupilR.y) / 2
      const z = Math.max(p.pupilL.z, p.nasion.z)
      set(0, p.exoR.x - 0.07, y + 0.12, z)
      set(1, p.exoL.x + 0.07, y - 0.1, z)
      break
    }
    case 'brows': {
      const top = Math.max(p.browPeakL.y, p.browPeakR.y) + 0.07
      const bot = Math.min(p.browInnerL.y, p.browOuterL.y) - 0.05
      set(0, p.browOuterR.x - 0.05, top, p.browPeakL.z)
      set(1, p.browOuterL.x + 0.05, bot, p.browPeakL.z)
      break
    }
    case 'face': {
      set(0, p.zygionR.x - 0.08, p.trichion.y + 0.06, p.zygionL.z)
      set(1, p.zygionL.x + 0.08, p.menton.y - 0.05, p.zygionL.z)
      break
    }
    case 'accessories': {
      const y = (p.pupilL.y + p.pupilR.y) / 2
      set(0, p.tragusR.x * 0.95, y + 0.17, p.pupilL.z + 0.1)
      set(1, p.tragusL.x * 0.95, y - 0.16, p.pupilL.z + 0.1)
      break
    }
  }
  out.length = 2
  return out
}

/** Glow placements (head-local, morphed): centre + half extents, per region. */
export function glowSpots(r: RegionId): { c: Vector3; rx: number; ry: number; ring?: boolean }[] {
  const p = anchors.morphed
  const lift = 0.03
  switch (r) {
    case 'eyes':
      return [p.pupilR, p.pupilL].map((q) => ({ c: q.clone().setZ(q.z + lift + 0.05), rx: 0.2, ry: 0.11 }))
    case 'brows':
      return [
        { c: p.browPeakR.clone().lerp(p.browInnerR, 0.35).setZ(p.browPeakR.z + lift), rx: 0.27, ry: 0.08 },
        { c: p.browPeakL.clone().lerp(p.browInnerL, 0.35).setZ(p.browPeakL.z + lift), rx: 0.27, ry: 0.08 },
      ]
    case 'accessories': {
      const y = (p.pupilL.y + p.pupilR.y) / 2
      return [{ c: new Vector3(0, y + 0.01, p.nasion.z + 0.06), rx: 0.82, ry: 0.15 }]
    }
    case 'face':
    default:
      return [{ c: new Vector3(0, (p.trichion.y + p.menton.y) / 2, p.nasion.z - 0.05), rx: 0.82, ry: 1.02, ring: true }]
  }
}
