import { Mesh, MeshBasicMaterial, Raycaster, Vector3, type BufferGeometry } from 'three'
import { LANDMARKS, type LandmarkId } from '../../lib/face'
import { avatarRegistry } from '../../lib/avatar'

/* ──────────────────────────────────────────────────────────────
   Anchors — landmarks raycast along −Z onto the shared head geometry,
   in HEAD-LOCAL space (no scene, no world matrices). facet. renders the
   same head in several canvases at once with a neutral face form, so one
   module-level set serves every instance (morph is the identity).
   ────────────────────────────────────────────────────────────── */

export type Points = Record<LandmarkId, Vector3>

const IDS = Object.keys(LANDMARKS) as LandmarkId[]

/** Smooth stand-in face until the sculpted head is ready. */
export function placeholderZ(x: number, y: number) {
  const e = 1 - (x / 0.86) ** 2 - ((y + 0.3) / 1.12) ** 2
  const base = 0.92 * Math.sqrt(Math.max(0, e)) - 0.36
  const nose = 0.2 * Math.exp(-(x * x) / 0.012 - ((y + 0.3) * (y + 0.3)) / 0.05)
  return base + nose
}

/* Brow height-field: x ∈ [−0.8, 0.8], y ∈ [−0.04, 0.38] */
export const HF = { x0: -0.8, x1: 0.8, y0: -0.04, y1: 0.38, nx: 48, ny: 14 }

export const anchors = {
  base: Object.fromEntries(IDS.map((id) => [id, new Vector3(LANDMARKS[id].x, LANDMARKS[id].y, placeholderZ(LANDMARKS[id].x, LANDMARKS[id].y))])) as Points,
  /** identical to base (neutral face form) — kept for the accessory code that reads it */
  morphed: {} as Points,
  heights: new Float32Array(HF.nx * HF.ny),
  baseRev: 0,
  rev: 0,
  resolved: false,
}
anchors.morphed = anchors.base

const ray = new Raycaster()
const o = new Vector3()
const d = new Vector3(0, 0, -1)

function surfaceZ(mesh: Mesh, x: number, y: number): number {
  ray.set(o.set(x, y, 2), d)
  const hit = ray.intersectObject(mesh, false)[0]
  return hit ? hit.point.z : placeholderZ(x, y)
}

/** Resolve every landmark (and the brow band) on the real head. Idempotent. */
export function resolveAnchors(head: BufferGeometry) {
  if (anchors.resolved) return
  if (!head.boundingSphere) head.computeBoundingSphere()
  const mesh = new Mesh(head, new MeshBasicMaterial())
  mesh.updateMatrixWorld(true)
  for (const id of IDS) {
    const { x, y } = LANDMARKS[id]
    // ears sit on the side of the head: no frontal probe
    if (id === 'tragusR' || id === 'tragusL') anchors.base[id].set(x, y, -0.8)
    else anchors.base[id].set(x, y, surfaceZ(mesh, x, y))
  }
  for (let j = 0; j < HF.ny; j++)
    for (let i = 0; i < HF.nx; i++) {
      const x = HF.x0 + ((HF.x1 - HF.x0) * i) / (HF.nx - 1)
      const y = HF.y0 + ((HF.y1 - HF.y0) * j) / (HF.ny - 1)
      anchors.heights[j * HF.nx + i] = surfaceZ(mesh, x, y)
    }
  ;(mesh.material as MeshBasicMaterial).dispose()
  anchors.resolved = true
  anchors.baseRev++
  anchors.rev++
  avatarRegistry.version++
}

/** Bilinear surface z in the brow band. */
export function browZ(x: number, y: number): number {
  const fx = ((Math.min(HF.x1, Math.max(HF.x0, x)) - HF.x0) / (HF.x1 - HF.x0)) * (HF.nx - 1)
  const fy = ((Math.min(HF.y1, Math.max(HF.y0, y)) - HF.y0) / (HF.y1 - HF.y0)) * (HF.ny - 1)
  const i = Math.min(HF.nx - 2, Math.floor(fx))
  const j = Math.min(HF.ny - 2, Math.floor(fy))
  const u = fx - i
  const v = fy - j
  const h = anchors.heights
  if (!anchors.resolved) return placeholderZ(x, y)
  const a = h[j * HF.nx + i]
  const b = h[j * HF.nx + i + 1]
  const c = h[(j + 1) * HF.nx + i]
  const e = h[(j + 1) * HF.nx + i + 1]
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v
}

export function browNormal(x: number, y: number, out: Vector3): Vector3 {
  const e = 0.02
  const dzdx = (browZ(x + e, y) - browZ(x - e, y)) / (2 * e)
  const dzdy = (browZ(x, y + e) - browZ(x, y - e)) / (2 * e)
  return out.set(-dzdx, -dzdy, 1).normalize()
}

/** Neutral face form: the morph is the identity. */
export const morph = (p: Vector3, out: Vector3) => out.copy(p)
