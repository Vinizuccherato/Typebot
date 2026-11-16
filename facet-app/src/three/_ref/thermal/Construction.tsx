import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { easing } from 'maath'
import type { Group } from 'three'
import { useFace } from '../store'
import { frontHit } from './anchors'

const MINT = '#8ff0c0'

/** Square node marker (dotted look via dashed line), facing the viewer. */
function Node({ p, s = 0.045 }: { p: [number, number, number]; s?: number }) {
  const pts = useMemo(
    () =>
      [
        [p[0] - s, p[1] - s, p[2]],
        [p[0] + s, p[1] - s, p[2]],
        [p[0] + s, p[1] + s, p[2]],
        [p[0] - s, p[1] + s, p[2]],
        [p[0] - s, p[1] - s, p[2]],
      ] as [number, number, number][],
    [p, s],
  )
  return <Line points={pts} color={MINT} lineWidth={1} transparent opacity={0.55} dashed dashSize={0.012} gapSize={0.01} />
}

/**
 * Static scan-construction graphics from the reference, in head-local space:
 * forehead triangulation lines, square nodes, corner brackets around the face.
 * They dim while a feature is being inspected so the visagism overlay reads first.
 */
export function Construction() {
  const g = useRef<Group>(null)
  const pts = useMemo(() => {
    const lift = (x: number, y: number, dz = 0.03): [number, number, number] => {
      const v = frontHit(x, y)
      return [v.x, v.y, v.z + dz]
    }
    const fl = lift(-0.4, 0.46)
    const fr = lift(0.4, 0.46)
    const top = lift(0, 0.7)
    const gl = lift(0, 0.06, 0.05)
    const cl = lift(-0.46, -0.36)
    const cr = lift(0.46, -0.36)
    const nose = lift(0, -0.42, 0.03)
    return { fl, fr, top, gl, cl, cr, nose }
  }, [])

  const brackets = useMemo(() => {
    const z = 0.32
    const L = 0.16
    const x0 = -0.92
    const x1 = 0.92
    const y0 = -1.38
    const y1 = 0.98
    const c = (x: number, y: number, dx: number, dy: number): [number, number, number][] => [
      [x + dx * L, y, z],
      [x, y, z],
      [x, y + dy * L, z],
    ]
    return [c(x0, y1, 1, -1), c(x1, y1, -1, -1), c(x0, y0, 1, 1), c(x1, y0, -1, 1)]
  }, [])

  useFrame((_, dt) => {
    if (!g.current) return
    const sel = useFace.getState().selected
    const target = sel ? 0.25 : 1
    g.current.children.forEach((ch) => {
      const m = (ch as unknown as { material?: { opacity: number; userData: { base?: number } } }).material
      if (!m) return
      m.userData.base ??= m.opacity
      easing.damp(m, 'opacity', (m.userData.base ?? 1) * target, 0.3, dt)
    })
  })

  const { fl, fr, top, gl, cl, cr, nose } = pts
  return (
    <group ref={g}>
      <Line points={[fl, gl, fr]} color={MINT} lineWidth={0.9} transparent opacity={0.4} />
      <Line points={[fl, top, fr]} color={MINT} lineWidth={0.8} transparent opacity={0.22} />
      <Line points={[gl, cl]} color={MINT} lineWidth={0.8} transparent opacity={0.18} />
      <Line points={[gl, cr]} color={MINT} lineWidth={0.8} transparent opacity={0.18} />
      <Line points={[cl, nose, cr]} color={MINT} lineWidth={0.8} transparent opacity={0.16} dashed dashSize={0.03} gapSize={0.025} />
      <Node p={fl} />
      <Node p={fr} />
      <Node p={gl} s={0.03} />
      {brackets.map((b, i) => (
        <Line key={i} points={b} color={MINT} lineWidth={1.2} transparent opacity={0.45} />
      ))}
    </group>
  )
}

/** Faint world-space crosshair across the canvas through the face (does not rotate with the head). */
export function Crosshair() {
  return (
    <group>
      <Line points={[[-8, -0.32, 0.4], [8, -0.32, 0.4]]} color={MINT} lineWidth={0.7} transparent opacity={0.12} />
      <Line points={[[0.55, -4, 0.4], [0.55, 3, 0.4]]} color={MINT} lineWidth={0.7} transparent opacity={0.08} />
      <Line points={[[0.5, -0.32, 0.4], [0.6, -0.32, 0.4]]} color={MINT} lineWidth={1.4} transparent opacity={0.5} />
      <Line points={[[0.55, -0.37, 0.4], [0.55, -0.27, 0.4]]} color={MINT} lineWidth={1.4} transparent opacity={0.5} />
    </group>
  )
}
