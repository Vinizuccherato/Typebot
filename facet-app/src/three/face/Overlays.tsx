import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Vector3, type Group } from 'three'
import { anchors } from '../acc/anchors'
import { labelTexture } from './labels'
import type { FaceViewProps } from '../FaceView'

/* Proportion overlays in head-local space (they rotate with the head):
   facial thirds, golden-ratio construction, mid-sagittal symmetry, and
   per-feature dimension lines with mm values (1 unit = 100 mm). */

const LILAC = '#c3b4ff'
const CHAMP = '#e8cba8'
const MM = 100
const FRONT = 0.42 // overlays float in front of the face plane

type V3 = [number, number, number]

function Label({ at, text, value, accent = LILAC, size = 0.2 }: { at: V3; text: string; value?: string; accent?: string; size?: number }) {
  const { tex, aspect } = useMemo(() => labelTexture(text, accent, value), [text, accent, value])
  return (
    <sprite position={at} scale={[size * aspect, size, 1]} renderOrder={21}>
      <spriteMaterial map={tex} transparent depthTest={false} toneMapped={false} />
    </sprite>
  )
}

/** Fades a group in on mount (draw-in feel without per-line dash animation). */
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const g = useRef<Group>(null)
  const t0 = useRef(-1)
  useFrame((s) => {
    if (!g.current) return
    if (t0.current < 0) t0.current = s.clock.elapsedTime
    const k = Math.min(1, Math.max(0, (s.clock.elapsedTime - t0.current - delay) / 0.6))
    const e = 1 - Math.pow(1 - k, 3)
    g.current.scale.set(1, 0.96 + 0.04 * e, 1)
    g.current.traverse((o) => {
      o.renderOrder = 20 // after the (possibly transparent) face
      const m = (o as unknown as { material?: { opacity: number; transparent: boolean; userData: Record<string, number> } }).material
      if (!m) return
      m.transparent = true
      m.userData.base ??= m.opacity
      m.opacity = m.userData.base * e
    })
  })
  return <group ref={g}>{children}</group>
}

/** Re-render once the real landmarks are resolved on the mesh. */
function useAnchorRev() {
  const [rev, setRev] = useState(anchors.baseRev)
  useFrame(() => {
    if (anchors.baseRev !== rev) setRev(anchors.baseRev)
  })
  return rev
}

function Thirds() {
  useAnchorRev()
  const b = anchors.base
  const ys = [b.trichion.y, b.glabella.y, b.subnasale.y, b.menton.y]
  const names = ['Upper third', 'Middle third', 'Lower third']
  const x0 = -0.92
  const x1 = 0.92
  return (
    <FadeIn>
      {ys.map((y, i) => (
        <Line key={i} points={[[x0, y, FRONT], [x1, y, FRONT]]} color={LILAC} lineWidth={1.2} transparent opacity={0.85} dashed={i > 0 && i < 3} dashSize={0.03} gapSize={0.022} depthTest={false} />
      ))}
      {[0, 1, 2].map((i) => {
        const a = ys[i]
        const c = ys[i + 1]
        const mm = Math.round((a - c) * MM)
        return (
          <group key={i}>
            <Line points={[[x1 + 0.06, a, FRONT], [x1 + 0.06, c, FRONT]]} color={CHAMP} lineWidth={1.4} depthTest={false} />
            <Label at={[x1 - 0.42, (a + c) / 2 + 0.02, FRONT + 0.05]} text={names[i]} value={`${mm} mm`} accent={CHAMP} size={0.17} />
          </group>
        )
      })}
    </FadeIn>
  )
}

function Symmetry() {
  useAnchorRev()
  const b = anchors.base
  const pairs: [keyof typeof b, keyof typeof b][] = [
    ['browPeakR', 'browPeakL'],
    ['pupilR', 'pupilL'],
    ['alarR', 'alarL'],
    ['cheilionR', 'cheilionL'],
    ['gonionR', 'gonionL'],
  ]
  return (
    <FadeIn>
      <Line points={[[0, b.trichion.y + 0.25, FRONT], [0, b.menton.y - 0.18, FRONT]]} color={LILAC} lineWidth={1.4} dashed dashSize={0.04} gapSize={0.025} depthTest={false} />
      {pairs.map(([r, l], i) => {
        const R = b[r]
        const L = b[l]
        return (
          <group key={i}>
            <Line points={[[R.x, R.y, R.z + 0.02], [L.x, L.y, L.z + 0.02]]} color={LILAC} lineWidth={0.9} transparent opacity={0.55} depthTest={false} />
            <mesh position={[R.x, R.y, R.z + 0.02]} renderOrder={11}>
              <circleGeometry args={[0.011, 16]} />
              <meshBasicMaterial color={CHAMP} depthTest={false} toneMapped={false} />
            </mesh>
            <mesh position={[L.x, L.y, L.z + 0.02]} renderOrder={11}>
              <circleGeometry args={[0.011, 16]} />
              <meshBasicMaterial color={CHAMP} depthTest={false} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
      <Label at={[0, b.trichion.y + 0.36, FRONT]} text="Mid-sagittal axis" size={0.16} />
    </FadeIn>
  )
}

const PHI = 1.618

function Golden() {
  useAnchorRev()
  const b = anchors.base
  const top = b.trichion.y
  const bottom = b.menton.y
  const w = Math.abs(b.zygionL.x - b.zygionR.x)
  const h = top - bottom
  const x0 = -w / 2
  const x1 = w / 2
  const cut = bottom + h / PHI // golden section from the chin
  const cutX = x0 + w / PHI
  // logarithmic golden spiral (growth φ per quarter turn) centred on the golden point
  const spiral = useMemo(() => {
    const pts: V3[] = []
    const B = Math.log(PHI) / (Math.PI / 2)
    const rMax = Math.min(w, h) * 0.62
    const tMax = 3.2 * Math.PI
    const a = rMax / Math.exp(B * tMax)
    for (let i = 0; i <= 220; i++) {
      const th = (i / 220) * tMax
      const r = a * Math.exp(B * th)
      pts.push([cutX + r * Math.cos(th + Math.PI), cut + r * Math.sin(th + Math.PI), FRONT])
    }
    return pts
  }, [w, h, cutX, cut])
  return (
    <FadeIn>
      <Line points={[[x0, top, FRONT], [x1, top, FRONT], [x1, bottom, FRONT], [x0, bottom, FRONT], [x0, top, FRONT]]} color={CHAMP} lineWidth={1.1} transparent opacity={0.8} depthTest={false} />
      <Line points={[[x0, cut, FRONT], [x1, cut, FRONT]]} color={CHAMP} lineWidth={1} dashed dashSize={0.03} gapSize={0.02} depthTest={false} />
      <Line points={[[cutX, top, FRONT], [cutX, bottom, FRONT]]} color={CHAMP} lineWidth={1} dashed dashSize={0.03} gapSize={0.02} depthTest={false} />
      <Line points={spiral} color={LILAC} lineWidth={1.4} transparent opacity={0.9} depthTest={false} />
      <Label at={[x1 - 0.12, top + 0.1, FRONT]} text="φ ratio" value={(h / w).toFixed(2)} accent={CHAMP} size={0.17} />
    </FadeIn>
  )
}

/* ── per-feature dimension lines ─────────────────────────────── */

type Dim = { a: keyof typeof anchors.base; b: keyof typeof anchors.base; label: string; offset: V3; axis?: 'x' | 'y' }

const MEASURES: Record<NonNullable<NonNullable<FaceViewProps['overlays']>['measure']>, Dim[]> = {
  brows: [
    { a: 'browInnerL', b: 'browOuterL', label: 'Brow length', offset: [0, 0.16, 0.05] },
    { a: 'browInnerR', b: 'browInnerL', label: 'Brow gap', offset: [0, 0.12, 0.08], axis: 'x' },
  ],
  eyes: [
    { a: 'endoL', b: 'exoL', label: 'Eye width', offset: [0, -0.15, 0.06], axis: 'x' },
    { a: 'endoR', b: 'endoL', label: 'Intercanthal', offset: [0, 0.14, 0.1], axis: 'x' },
    { a: 'pupilR', b: 'pupilL', label: 'IPD', offset: [0, -0.3, 0.1], axis: 'x' },
  ],
  nose: [
    { a: 'nasion', b: 'subnasale', label: 'Nose length', offset: [0.34, 0, 0.12], axis: 'y' },
    { a: 'alarR', b: 'alarL', label: 'Alar width', offset: [0, -0.13, 0.08], axis: 'x' },
  ],
  lips: [
    { a: 'cheilionR', b: 'cheilionL', label: 'Mouth width', offset: [0, -0.2, 0.08], axis: 'x' },
    { a: 'labraleSup', b: 'labraleInf', label: 'Lip height', offset: [0.32, 0, 0.1], axis: 'y' },
  ],
  jaw: [
    { a: 'gonionR', b: 'gonionL', label: 'Jaw width', offset: [0, -0.06, 0.25], axis: 'x' },
    { a: 'subnasale', b: 'menton', label: 'Lower third', offset: [0.5, 0, 0.18], axis: 'y' },
  ],
}

const _a = new Vector3()
const _b = new Vector3()

function DimLine({ d }: { d: Dim }) {
  const A = anchors.base[d.a]
  const B = anchors.base[d.b]
  _a.copy(A)
  _b.copy(B)
  if (d.axis === 'x') _b.y = _a.y = (A.y + B.y) / 2
  if (d.axis === 'y') _b.x = _a.x = (A.x + B.x) / 2
  const z = Math.max(A.z, B.z)
  const P: V3 = [_a.x + d.offset[0], _a.y + d.offset[1], z + d.offset[2]]
  const Q: V3 = [_b.x + d.offset[0], _b.y + d.offset[1], z + d.offset[2]]
  const mm = (d.axis === 'x' ? Math.abs(A.x - B.x) : d.axis === 'y' ? Math.abs(A.y - B.y) : A.distanceTo(B)) * MM
  const tick = 0.02
  const horiz = d.axis !== 'y'
  const t1: V3[] = horiz ? [[P[0], P[1] - tick, P[2]], [P[0], P[1] + tick, P[2]]] : [[P[0] - tick, P[1], P[2]], [P[0] + tick, P[1], P[2]]]
  const t2: V3[] = horiz ? [[Q[0], Q[1] - tick, Q[2]], [Q[0], Q[1] + tick, Q[2]]] : [[Q[0] - tick, Q[1], Q[2]], [Q[0] + tick, Q[1], Q[2]]]
  const mid: V3 = [(P[0] + Q[0]) / 2 + (horiz ? 0 : 0.25), (P[1] + Q[1]) / 2 + (horiz ? 0.085 : 0), P[2]]
  return (
    <group>
      <Line points={[[A.x, A.y, A.z + 0.01], P]} color={LILAC} lineWidth={0.8} dashed dashSize={0.012} gapSize={0.012} transparent opacity={0.6} depthTest={false} />
      <Line points={[[B.x, B.y, B.z + 0.01], Q]} color={LILAC} lineWidth={0.8} dashed dashSize={0.012} gapSize={0.012} transparent opacity={0.6} depthTest={false} />
      <Line points={[P, Q]} color={CHAMP} lineWidth={1.6} depthTest={false} />
      <Line points={t1} color={CHAMP} lineWidth={1.6} depthTest={false} />
      <Line points={t2} color={CHAMP} lineWidth={1.6} depthTest={false} />
      <Label at={mid} text={d.label} value={`${mm.toFixed(1)} mm`} accent={CHAMP} size={0.14} />
    </group>
  )
}

function Measure({ feature }: { feature: keyof typeof MEASURES }) {
  useAnchorRev()
  return (
    <FadeIn key={feature}>
      {MEASURES[feature].map((d, i) => (
        <DimLine key={i} d={d} />
      ))}
    </FadeIn>
  )
}

export function Overlays({ overlays }: { overlays: NonNullable<FaceViewProps['overlays']> }) {
  return (
    <group renderOrder={10}>
      {overlays.thirds && <Thirds />}
      {overlays.golden && <Golden />}
      {overlays.symmetry && <Symmetry />}
      {overlays.measure && <Measure feature={overlays.measure} />}
    </group>
  )
}
