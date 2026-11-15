import type { BufferGeometry } from 'three'
import { meshSdf } from './mesher'
import { sdfFigure, sdfHead } from './sdf'

/* Built once per page load and cached. The head mesh (fine, 1.9 mm cells) carries the
   face and the upper neck; the body mesh (coarse) carries lower neck + shoulders.
   They overlap inside the neck, where each one's cut cap is hidden by the other. */

let cache: { head: BufferGeometry; body: BufferGeometry } | null = null

const CUT = -1.5

export function buildGeometry() {
  if (cache) return cache
  const head = meshSdf((x, y, z) => Math.max(sdfHead(x, y, z), -(y - CUT)), { min: [-0.95, CUT - 0.04, -2.0], max: [0.95, 1.18, 0.42] }, 0.019)
  // body sits a hair inside the head surface so the shared neck band never z-fights
  const body = meshSdf((x, y, z) => Math.max(sdfFigure(x, y, z) + 0.004, y - (CUT + 0.04)), { min: [-2.6, -3.7, -2.0], max: [2.6, CUT + 0.08, 0.3] }, 0.036)
  cache = { head, body }
  return cache
}
