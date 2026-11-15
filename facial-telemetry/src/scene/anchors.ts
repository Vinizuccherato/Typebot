import { Vector3 } from 'three'
import { sdfHead } from './sdf'

/** Head-local surface point hit by a ray along −Z at frontal (x, y) — same rule the analysis layer uses. */
export function frontHit(x: number, y: number, out = new Vector3()): Vector3 {
  let z = 2
  for (let i = 0; i < 300; i++) {
    const d = sdfHead(x, y, z)
    if (d < 1e-4) break
    z -= Math.max(d * 0.85, 1e-4)
    if (z < -3) break
  }
  return out.set(x, y, z)
}

/** Head pivot for orbiting (centre of the skull volume, head-local). */
export const PIVOT = new Vector3(0, -0.1, -0.72)
