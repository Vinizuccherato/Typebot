import type { BufferGeometry } from 'three'
import { meshSdf } from './mesher'
import { sdfBase, sdfBeard, sdfFigure, sdfHair, sdfHead, type BeardShape, type HairShape } from './sdf'

/* Built in a worker, in two phases so the first view appears fast:
   1) base — head (fine), body (coarse) and the client's current hair;
   2) styles — the other hair shells and the beard shells.
   Head and body overlap inside the neck; the head shader hides its cut cap. */

const CUT = -1.35
const HEAD_BOUNDS = { min: [-1.02, CUT - 0.04, -2.05] as [number, number, number], max: [1.02, 1.18, 0.45] as [number, number, number] }
const HAIR_BOUNDS = { min: [-1.05, -1.05, -2.2] as [number, number, number], max: [1.05, 1.42, 0.4] as [number, number, number] }
const BEARD_BOUNDS = { min: [-0.92, -1.62, -1.1] as [number, number, number], max: [0.92, -0.05, 0.36] as [number, number, number] }

export const HAIR_SHAPES: HairShape[] = ['current', 'textured-crop', 'side-part', 'slick-back', 'medium-flow']
export const BEARD_SHAPES: BeardShape[] = ['short-boxed', 'full', 'goatee']

export function buildBase() {
  const head = meshSdf((x, y, z) => Math.max(sdfHead(x, y, z), -(y - CUT)), HEAD_BOUNDS, 0.018, sdfBase)
  const body = meshSdf((x, y, z) => Math.max(sdfFigure(x, y, z) + 0.004, y - (CUT + 0.08)), { min: [-2.6, -6.2, -1.7], max: [2.6, CUT + 0.08, 0.25] }, 0.038, sdfBase)
  const current = meshSdf(sdfHair('current'), HAIR_BOUNDS, 0.021)
  return { head, body, current }
}

export function buildStyles() {
  const hair: Partial<Record<HairShape, BufferGeometry>> = {}
  for (const s of HAIR_SHAPES) if (s !== 'current') hair[s] = meshSdf(sdfHair(s), HAIR_BOUNDS, 0.021)
  const beard: Partial<Record<BeardShape, BufferGeometry>> = {}
  for (const b of BEARD_SHAPES) beard[b] = meshSdf(sdfBeard(b), BEARD_BOUNDS, 0.014)
  return { hair, beard }
}
