import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { Vector3 } from 'three'
import type { Line2 } from 'three-stdlib'

/* Shared drawing primitives for the visagism overlay (head-local space). */

export const MINT = '#8ff0c0'
export const MINT_SOFT = '#5fd3a0'
export const OVERLAY_ORDER = 20

type V = [number, number, number]
const v3 = (p: Vector3): V => [p.x, p.y, p.z]

/** A line that draws itself in (dash-offset reveal), always on top of the head. */
export function RevealLine({
  points,
  color = MINT,
  width = 1.3,
  opacity = 0.95,
  delay = 0,
  duration = 0.55,
  dashed = false,
  depthTest = false,
}: {
  points: Vector3[]
  color?: string
  width?: number
  opacity?: number
  delay?: number
  duration?: number
  /** static dashed pattern (no reveal) */
  dashed?: boolean
  depthTest?: boolean
}) {
  const ref = useRef<Line2>(null)
  const pts = useMemo(() => points.map(v3), [points])
  const total = useMemo(() => points.reduce((s, p, i) => (i ? s + p.distanceTo(points[i - 1]) : 0), 0) || 0.001, [points])
  const t0 = useRef<number | null>(null)

  useFrame(({ clock }) => {
    const mat = ref.current?.material
    if (!mat || dashed) return
    if (t0.current === null) t0.current = clock.elapsedTime
    const t = Math.min(1, Math.max(0, (clock.elapsedTime - t0.current - delay) / duration))
    const e = 1 - Math.pow(1 - t, 3)
    mat.dashOffset = total * (1 - e)
  })

  return (
    <Line
      ref={ref}
      points={pts}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      depthTest={depthTest}
      depthWrite={false}
      toneMapped={false}
      renderOrder={OVERLAY_ORDER}
      dashed
      dashSize={dashed ? 0.012 : total}
      gapSize={dashed ? 0.012 : total}
      dashOffset={dashed ? 0 : total}
    />
  )
}

/** Billboard label pinned to a head-space point, sized with the artboard scale. */
export function Tag({ at, children, className = '', dim = false }: { at: Vector3 | V; children: ReactNode; className?: string; dim?: boolean }) {
  const pos = Array.isArray(at) ? at : v3(at)
  return (
    <Html position={pos} center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={`whitespace-nowrap rounded-full px-2 py-[3px] text-[10.5px] font-normal tabular leading-none text-[var(--text)] ${className}`}
        style={{
          transform: 'scale(var(--s))',
          background: 'rgb(8 16 14 / 0.72)',
          border: '1px solid rgb(143 240 192 / 0.35)',
          boxShadow: '0 4px 14px -6px rgb(0 0 0 / 0.6)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: dim ? 0.45 : 1,
          transition: 'opacity .4s',
        }}
      >
        {children}
      </div>
    </Html>
  )
}

/** Small cross-tick at a line end, perpendicular to `dir` in the plane facing +Z. */
export function tick(at: Vector3, dir: Vector3, size = 0.018): Vector3[] {
  const n = new Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(size)
  return [at.clone().add(n), at.clone().sub(n)]
}
