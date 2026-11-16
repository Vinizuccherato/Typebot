import type { BufferGeometry } from 'three'
import { meshSdf } from './mesher'
import { sdfBase, sdfFigure, sdfHair, sdfHead } from './sdf'

/* Built once per page load (in a worker) and cached. The head mesh (fine) carries the
   face and upper neck; the body mesh (coarse) carries lower neck + shoulders (the tee);
   the hair is its own shell. Head and body overlap inside the neck. */

let cache: { head: BufferGeometry; body: BufferGeometry; hair: BufferGeometry } | null = null

const CUT = -1.5

export function buildGeometry() {
  if (cache) return cache
  const head = meshSdf((x, y, z) => Math.max(sdfHead(x, y, z), -(y - CUT)), { min: [-0.95, CUT - 0.04, -2.0], max: [0.95, 1.18, 0.42] }, 0.019, sdfBase)
  const body = meshSdf((x, y, z) => Math.max(sdfFigure(x, y, z) + 0.004, y - (CUT + 0.04)), { min: [-2.6, -4.0, -2.0], max: [2.6, CUT + 0.08, 0.6] }, 0.036, sdfBase)
  const hair = meshSdf(sdfHair, { min: [-1.35, -3.75, -2.25], max: [1.35, 1.32, 0.45] }, 0.03)
  cache = { head, body, hair }
  return cache
}
