import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Box3 } from './layout'

/** [x0, x1, y0, y1, z0, z1] */
export type BoxSpec = [number, number, number, number, number, number]

export const fromBox = (b: Box3): BoxSpec => [b.x0, b.x1, b.y0, b.y1, b.z0, b.z1]

/** Merge many axis-aligned boxes into one geometry → one draw call. */
export function mergeBoxes(boxes: BoxSpec[]) {
  const parts = boxes.map(([x0, x1, y0, y1, z0, z1]) => {
    const g = new THREE.BoxGeometry(Math.max(1e-3, x1 - x0), Math.max(1e-3, y1 - y0), Math.max(1e-3, z1 - z0))
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    return g
  })
  const merged = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  merged.computeBoundingSphere()
  return merged
}

/** Vertical planes (glass panes) facing ±z or ±x, merged. */
export function mergePlanes(planes: Array<{ axis: 'z' | 'x'; at: number; a0: number; a1: number; y0: number; y1: number; flip?: boolean }>) {
  const parts = planes.map(({ axis, at, a0, a1, y0, y1, flip }) => {
    const g = new THREE.PlaneGeometry(a1 - a0, y1 - y0)
    if (axis === 'x') g.rotateY(flip ? -Math.PI / 2 : Math.PI / 2)
    else if (flip) g.rotateY(Math.PI)
    if (axis === 'z') g.translate((a0 + a1) / 2, (y0 + y1) / 2, at)
    else g.translate(at, (y0 + y1) / 2, (a0 + a1) / 2)
    return g
  })
  const merged = mergeGeometries(parts, false)!
  parts.forEach((p) => p.dispose())
  return merged
}
