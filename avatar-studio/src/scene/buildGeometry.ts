import type { BufferGeometry } from 'three'
import { meshSdf } from './mesher'
import { sdfBase, sdfFigure, sdfHair, sdfHead } from './sdf'

/* Built once per page load (in a worker) and cached. The head mesh (fine) carries the
   face and upper neck; the body mesh (coarse) carries lower neck + shoulders (the tee);
   the hair is its own shell. Head and body overlap inside the neck. */

let cache: { head: BufferGeometry; body: BufferGeometry; hair: BufferGeometry } | null = null

const CUT = -1.35

export function buildGeometry() {
  if (cache) return cache
  const head = meshSdf((x, y, z) => Math.max(sdfHead(x, y, z), -(y - CUT)), { min: [-0.95, CUT - 0.04, -2.0], max: [0.95, 1.18, 0.42] }, 0.019, sdfBase)
  const body = meshSdf((x, y, z) => Math.max(sdfFigure(x, y, z) + 0.004, y - (CUT + 0.08)), { min: [-2.5, -6.2, -1.6], max: [2.5, CUT + 0.08, 0.2] }, 0.038, sdfBase)
  const hair = meshSdf(sdfHair, { min: [-1.55, -4.4, -2.3], max: [1.55, 1.35, 0.5] }, 0.023)
  cache = { head, body, hair }
  return cache
}
