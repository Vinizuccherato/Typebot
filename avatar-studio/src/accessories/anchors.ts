import { Matrix4, Raycaster, Vector3, type Mesh, type Object3D } from 'three'
import { LANDMARKS, type LandmarkId } from '../lib/face'
import { avatarRegistry } from '../lib/avatar'
import type { FaceForm } from '../store'

/* ──────────────────────────────────────────────────────────────
   Anchors — every accessory hangs off these.
   1. BASE: landmarks raycast along −Z onto the sculptor's undeformed head
      mesh (or a placeholder surface until it exists), in this layer's space.
   2. Brow height-field: a small grid of surface samples over the brow band,
      so ~500 brow strands can sit on the skin without per-strand raycasts.
   3. MORPHED: base points pushed through `avatarRegistry.morph()` with the
      live face form, so brows and glasses follow every slider.
   Module-level singletons: one avatar per page.
   ────────────────────────────────────────────────────────────── */

export type Points = Record<LandmarkId, Vector3>

const IDS = Object.keys(LANDMARKS) as LandmarkId[]

/** Smooth stand-in face until the sculpted head is published. */
export function placeholderZ(x: number, y: number) {
  const e = 1 - (x / 0.86) ** 2 - ((y + 0.3) / 1.12) ** 2
  const base = 0.92 * Math.sqrt(Math.max(0, e)) - 0.36
  const nose = 0.2 * Math.exp(-(x * x) / 0.012 - ((y + 0.3) * (y + 0.3)) / 0.05)
  const sockets = -0.05 * (Math.exp(-((x - 0.32) ** 2) / 0.012 - ((y + 0.04) ** 2) / 0.006) + Math.exp(-((x + 0.32) ** 2) / 0.012 - ((y + 0.04) ** 2) / 0.006))
  return base + nose + sockets
}

/* Brow height-field: x ∈ [−0.8, 0.8], y ∈ [−0.04, 0.38] */
export const HF = { x0: -0.8, x1: 0.8, y0: -0.04, y1: 0.38, nx: 48, ny: 14 }

export const anchors = {
  base: Object.fromEntries(IDS.map((id) => [id, new Vector3(LANDMARKS[id].x, LANDMARKS[id].y, placeholderZ(LANDMARKS[id].x, LANDMARKS[id].y))])) as Points,
  morphed: Object.fromEntries(IDS.map((id) => [id, new Vector3()])) as Points,
  heights: new Float32Array(HF.nx * HF.ny),
  /** bumps whenever base points change (mesh published / rebuilt) */
  baseRev: 0,
  /** bumps whenever morphed points change (base or face form) */
  rev: 0,
  /** mesh-local → layer-space matrix, for the picking proxy */
  meshToLayer: new Matrix4(),
  mesh: null as Mesh | null,
  face: null as FaceForm | null,
}

const ray = new Raycaster()
const o = new Vector3()
const d = new Vector3()
const inv = new Matrix4()

function surfaceZ(mesh: Mesh | null, space: Object3D, x: number, y: number): number {
  if (mesh) {
    o.set(x, y, 2).applyMatrix4(space.matrixWorld)
    d.set(x, y, -2).applyMatrix4(space.matrixWorld).sub(o).normalize()
    ray.set(o, d)
    const hit = ray.intersectObject(mesh, false)[0]
    if (hit) return hit.point.applyMatrix4(inv).z
  }
  return placeholderZ(x, y)
}

let lastMesh: Mesh | null | undefined
let lastVersion = -1

/** Re-resolve base anchors when the sculptor publishes or rebuilds the head. Returns true if they changed. */
export function syncBase(space: Object3D): boolean {
  const mesh = avatarRegistry.mesh
  if (mesh === lastMesh && avatarRegistry.version === lastVersion) return false
  // wait until the mesh actually has geometry
  if (mesh && !mesh.geometry.getAttribute('position')) return false
  lastMesh = mesh
  lastVersion = avatarRegistry.version
  space.updateWorldMatrix(true, false)
  inv.copy(space.matrixWorld).invert()
  if (mesh) {
    mesh.updateWorldMatrix(true, false)
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere()
    anchors.meshToLayer.multiplyMatrices(inv, mesh.matrixWorld)
  }
  anchors.mesh = mesh
  for (const id of IDS) {
    const { x, y } = LANDMARKS[id]
    // ears sit on the side of the head: probe from the side instead of the front
    if (id === 'tragusR' || id === 'tragusL') {
      anchors.base[id].set(x, y, -0.8)
      continue
    }
    anchors.base[id].set(x, y, surfaceZ(mesh, space, x, y))
  }
  for (let j = 0; j < HF.ny; j++)
    for (let i = 0; i < HF.nx; i++) {
      const x = HF.x0 + ((HF.x1 - HF.x0) * i) / (HF.nx - 1)
      const y = HF.y0 + ((HF.y1 - HF.y0) * j) / (HF.ny - 1)
      anchors.heights[j * HF.nx + i] = surfaceZ(mesh, space, x, y)
    }
  anchors.baseRev++
  anchors.face = null // force re-morph
  return true
}

/** Bilinear surface z in the brow band (undeformed). */
export function browZ(x: number, y: number): number {
  const fx = ((Math.min(HF.x1, Math.max(HF.x0, x)) - HF.x0) / (HF.x1 - HF.x0)) * (HF.nx - 1)
  const fy = ((Math.min(HF.y1, Math.max(HF.y0, y)) - HF.y0) / (HF.y1 - HF.y0)) * (HF.ny - 1)
  const i = Math.min(HF.nx - 2, Math.floor(fx))
  const j = Math.min(HF.ny - 2, Math.floor(fy))
  const u = fx - i
  const v = fy - j
  const h = anchors.heights
  const a = h[j * HF.nx + i]
  const b = h[j * HF.nx + i + 1]
  const c = h[(j + 1) * HF.nx + i]
  const e = h[(j + 1) * HF.nx + i + 1]
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v
}

/** Surface normal of the brow band from the height-field gradient (undeformed). */
export function browNormal(x: number, y: number, out: Vector3): Vector3 {
  const e = 0.02
  const dzdx = (browZ(x + e, y) - browZ(x - e, y)) / (2 * e)
  const dzdy = (browZ(x, y + e) - browZ(x, y - e)) / (2 * e)
  return out.set(-dzdx, -dzdy, 1).normalize()
}

const faceEq = (a: FaceForm | null, b: FaceForm) => !!a && a.width === b.width && a.eyes === b.eyes && a.roundness === b.roundness && a.lips === b.lips

/** Push base anchors through the live face-form deformation. Returns true if they changed. */
export function syncMorph(face: FaceForm): boolean {
  if (faceEq(anchors.face, face)) return false
  anchors.face = { ...face }
  for (const id of IDS) avatarRegistry.morph(anchors.base[id], face, anchors.morphed[id])
  anchors.rev++
  return true
}

/** Morph any head-local point with the current face form. */
export const morph = (p: Vector3, out: Vector3) => avatarRegistry.morph(p, anchors.face ?? { width: 0.5, eyes: 0.5, roundness: 0.5, lips: 0.5 }, out)
