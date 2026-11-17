import { Mesh, MeshBasicMaterial, Raycaster, Vector3, type BufferGeometry } from 'three'
import { LANDMARKS, type LandmarkId } from '../../lib/face'
import { avatarRegistry } from '../../lib/avatar'
import type { RegionId } from '../../store'

/* ──────────────────────────────────────────────────────────────
   Anchors in HEAD-LOCAL space, resolved once on the shared head mesh:
   - landmarks (lib/face.ts) — raycast along −Z at their frontal (x, y);
   - region hotspots (LZ-01 map) — raycast along a per-region direction,
     pushed out along the surface normal (hair/beard sit above the skin).
   ────────────────────────────────────────────────────────────── */

const IDS = Object.keys(LANDMARKS) as LandmarkId[]

/** Smooth stand-in face until the sculpted head is ready. */
const placeholderZ = (x: number, y: number) => 0.92 * Math.sqrt(Math.max(0, 1 - (x / 0.86) ** 2 - ((y + 0.3) / 1.12) ** 2)) - 0.36

/** Region probe: ray origin (head-local) + direction + outward lift (units). */
const REGION_PROBES: Record<RegionId, { o: [number, number, number]; d: [number, number, number]; lift: number }> = {
  composition: { o: [0, 0.36, 2], d: [0, 0, -1], lift: 0.03 },
  hair: { o: [0.3, 0.86, 2], d: [0, -0.22, -1], lift: 0.16 },
  brows: { o: [0.4, 0.15, 2], d: [0, 0, -1], lift: 0.03 },
  eyes: { o: [-0.36, -0.2, 2], d: [0, 0, -1], lift: 0.02 },
  contrast: { o: [0.5, -0.28, 2], d: [0, 0, -1], lift: 0.02 },
  skin: { o: [-0.36, 0.34, 2], d: [0, 0, -1], lift: 0.02 },
  noseEars: { o: [0, -0.33, 2], d: [0, 0, -1], lift: 0.03 },
  lips: { o: [0, -0.7, 2], d: [0, 0, -1], lift: 0.03 },
  beard: { o: [-0.36, -0.9, 2], d: [0, 0, -1], lift: 0.08 },
  jaw: { o: [1.1, -0.84, 2], d: [-0.3, 0, -1], lift: 0.05 },
  neck: { o: [0, -1.62, 2], d: [0, 0, -1], lift: 0.03 },
}

export const anchors = {
  landmarks: Object.fromEntries(IDS.map((id) => [id, new Vector3(LANDMARKS[id].x, LANDMARKS[id].y, placeholderZ(LANDMARKS[id].x, LANDMARKS[id].y))])) as Record<LandmarkId, Vector3>,
  regions: Object.fromEntries((Object.keys(REGION_PROBES) as RegionId[]).map((id) => [id, { p: new Vector3(...REGION_PROBES[id].o).setZ(0), n: new Vector3(0, 0, 1) }])) as Record<RegionId, { p: Vector3; n: Vector3 }>,
  resolved: false,
}

const ray = new Raycaster()
const o = new Vector3()
const d = new Vector3()

/** Resolve landmarks and region anchors on the real head. Idempotent. */
export function resolveAnchors(head: BufferGeometry) {
  if (anchors.resolved) return
  const mesh = new Mesh(head, new MeshBasicMaterial())
  mesh.updateMatrixWorld(true)
  for (const id of IDS) {
    const { x, y } = LANDMARKS[id]
    if (id === 'tragusR' || id === 'tragusL') {
      anchors.landmarks[id].set(x, y, -0.86)
      continue
    }
    ray.set(o.set(x, y, 2), d.set(0, 0, -1))
    const hit = ray.intersectObject(mesh, false)[0]
    if (hit) anchors.landmarks[id].copy(hit.point)
  }
  for (const id of Object.keys(REGION_PROBES) as RegionId[]) {
    const pr = REGION_PROBES[id]
    ray.set(o.set(...pr.o), d.set(...pr.d).normalize())
    const hit = ray.intersectObject(mesh, false)[0]
    if (hit) {
      const n = hit.face ? hit.face.normal.clone() : d.clone().negate()
      anchors.regions[id].n.copy(n)
      anchors.regions[id].p.copy(hit.point).addScaledVector(n, pr.lift)
    }
  }
  ;(mesh.material as MeshBasicMaterial).dispose()
  anchors.resolved = true
  avatarRegistry.mesh = mesh
  avatarRegistry.version++
}
