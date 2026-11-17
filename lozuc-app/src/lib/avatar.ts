import type { Mesh, Vector3 } from 'three'
import type { FaceForm } from '../store'

/* ──────────────────────────────────────────────────────────────
   AVATAR CONTRACT — shared by the sculptor (src/scene) and the
   accessories/overlay layer (src/accessories).

   Frame and landmarks: see lib/face.ts (1 unit = 10 cm, origin = nasion,
   +Z toward the viewer). The sculptor deforms the head live on the GPU from
   `FaceForm`; it publishes the undeformed head mesh AND a CPU `morph()` that
   applies the exact same deformation to a head-local point, so brows and glasses
   (placed by raycasting landmarks onto the mesh) follow every slider.
   ────────────────────────────────────────────────────────────── */

export interface AvatarRegistry {
  /** undeformed head mesh (raycast target) */
  mesh: Mesh | null
  /** same deformation as the vertex shader; writes into `out` and returns it */
  morph: (p: Vector3, face: FaceForm, out: Vector3) => Vector3
  /** world-space position of a head-local point is obtained via this group (set by sculptor) */
  version: number
}

export const avatarRegistry: AvatarRegistry = {
  mesh: null,
  morph: (p, _face, out) => out.copy(p),
  version: 0,
}
