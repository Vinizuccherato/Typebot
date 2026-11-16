import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, DoubleSide, InstancedMesh, Matrix4, MeshStandardMaterial, Vector3 } from 'three'
import type { BrowFormId } from '../store'
import { anchors, browNormal, browZ, morph } from './anchors'

/* ──────────────────────────────────────────────────────────────
   Hair-strand eyebrows: ~300 instanced tapered strands per side laid on
   the skin along inner → peak → outer. A form is a handful of profile
   numbers; switching forms tweens them, so brows reshape smoothly.
   ────────────────────────────────────────────────────────────── */

interface Profile {
  /** arch rise above the inner→outer line (units, 1 = 10 cm) */
  arch: number
  /** where the peak sits along the brow, 0..1 */
  peakT: number
  /** peak sharpness (higher = more angular) */
  sharp: number
  /** inner dip for the S-shape */
  sDip: number
  /** body height at the head / tail */
  headH: number
  tailH: number
  /** tail drop below the landmark line */
  tailDrop: number
  /** strand density multiplier */
  density: number
}

export const BROW_PROFILES: Record<BrowFormId, Profile> = {
  straight: { arch: 0.012, peakT: 0.62, sharp: 1, sDip: 0, headH: 0.07, tailH: 0.03, tailDrop: 0.01, density: 1 },
  'soft-arch': { arch: 0.045, peakT: 0.63, sharp: 1.4, sDip: 0, headH: 0.075, tailH: 0.028, tailDrop: 0.015, density: 1 },
  'high-arch': { arch: 0.078, peakT: 0.67, sharp: 2.6, sDip: 0, headH: 0.065, tailH: 0.024, tailDrop: 0.03, density: 0.95 },
  rounded: { arch: 0.06, peakT: 0.5, sharp: 0.8, sDip: 0, headH: 0.07, tailH: 0.03, tailDrop: 0.03, density: 1 },
  's-shaped': { arch: 0.055, peakT: 0.62, sharp: 1.6, sDip: 0.018, headH: 0.06, tailH: 0.026, tailDrop: 0.025, density: 0.95 },
  'bold-flat': { arch: 0.02, peakT: 0.6, sharp: 1.1, sDip: 0, headH: 0.105, tailH: 0.055, tailDrop: 0.005, density: 1.45 },
}

const KEYS = Object.keys(BROW_PROFILES['straight']) as (keyof Profile)[]
const N = 340 // strands per side (max)

/** Tapered, slightly curved strand: base at y=0, tip at y=1, width 1 at the base. */
function strandGeometry() {
  const seg = 4
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    const w = 0.5 * (1 - t) ** 0.8
    const bend = 0.18 * t * t // curls toward +x (the growth direction's side)
    pos.push(-w + bend, t, 0, w + bend, t, 0)
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/* deterministic per-strand randoms */
const rand = (() => {
  const a = new Float32Array(N * 4)
  let s = 1234567
  for (let i = 0; i < a.length; i++) {
    s = (s * 1664525 + 1013904223) % 4294967296
    a[i] = s / 4294967296
  }
  return a
})()

const _p = new Vector3()
const _q = new Vector3()
const _n = new Vector3()
const _dir = new Vector3()
const _side = new Vector3()
const _root = new Vector3()
const _tip = new Vector3()
const _m = new Matrix4()
const _c = new Color()

function writeSide(mesh: InstancedMesh, side: 1 | -1, P: Profile, thick: number) {
  const b = anchors.base
  const I = side > 0 ? b.browInnerL : b.browInnerR
  const O = side > 0 ? b.browOuterL : b.browOuterR
  const count = Math.round(N * Math.min(1, 0.55 + 0.32 * P.density * (0.6 + thick * 0.8)))
  for (let k = 0; k < count; k++) {
    // bias strands toward the head (denser), sprinkle along the tail
    const t = Math.pow(rand[k * 4], 0.85)
    const v = rand[k * 4 + 1] * 2 - 1 // across the body
    const jitter = rand[k * 4 + 2]
    // centre line in frontal space
    const x = I.x + (O.x - I.x) * t
    const base = I.y + (O.y - I.y) * t
    const peak = Math.exp(-Math.pow(Math.abs(t - P.peakT) / (0.42 / P.sharp), 1.6))
    const dip = -P.sDip * Math.exp(-(((t - 0.12) / 0.11) ** 2))
    const y0 = base + P.arch * peak + dip - P.tailDrop * t * t
    const h = (P.headH + (P.tailH - P.headH) * Math.pow(t, 0.9)) * (0.75 + thick * 0.5)
    const y = y0 + v * h * 0.5 * (1 - 0.15 * Math.abs(v))
    // growth direction: steep upward at the head, flattening outward along the tail
    const up = (1 - Math.min(1, t / 0.35)) * 1.1 + 0.18
    _dir.set(side * (0.4 + t * 1.6), up + 0.25 * v, 0).normalize()
    // lie on the skin: surface normal from the height-field
    browNormal(x, y, _n)
    _dir.addScaledVector(_n, -_dir.dot(_n)).normalize()
    _side.crossVectors(_n, _dir).normalize()
    const len = (0.048 + 0.03 * jitter) * (t < 0.2 ? 0.8 : 1) * (0.85 + thick * 0.3)
    _p.set(x, y, browZ(x, y) + 0.002)
    _q.copy(_p).addScaledVector(_dir, len).addScaledVector(_n, 0.004)
    morph(_p, _root)
    morph(_q, _tip)
    // rebuild the basis from the morphed root→tip so strands follow the face form
    _dir.subVectors(_tip, _root)
    const L = _dir.length()
    _dir.divideScalar(L || 1)
    const w = 0.0056 * (0.8 + 0.4 * jitter) * (t < 0.15 ? 1.15 : 1)
    _m.makeBasis(_side.multiplyScalar(w), _dir.multiplyScalar(L), _n)
    _m.setPosition(_root)
    mesh.setMatrixAt(k, _m)
    // per-strand tone: roots darker, a few lighter strays
    const tone = 0.72 + 0.4 * rand[k * 4 + 3]
    mesh.setColorAt(k, _c.setScalar(tone))
  }
  mesh.count = count
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

export function Brows({ form, color, strength, faded }: { form: BrowFormId; color: string; strength: number; faded: boolean }) {
  const geometry = useMemo(strandGeometry, [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        roughness: 0.62,
        metalness: 0,
        side: DoubleSide,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    // colour is animated below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const left = useRef<InstancedMesh>(null)
  const right = useRef<InstancedMesh>(null)
  const cur = useRef<Profile>({ ...BROW_PROFILES[form] })
  const curThick = useRef(strength)
  const target = useRef(new Color(color))
  const seen = useRef({ rev: -1, base: -1 })

  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material])
  useEffect(() => void target.current.set(color), [color])

  useFrame((_, dt) => {
    const goal = BROW_PROFILES[form]
    const k = 1 - Math.exp(-dt * 9)
    let moving = false
    for (const key of KEYS) {
      const d = goal[key] - cur.current[key]
      if (Math.abs(d) > 1e-5) {
        cur.current[key] += d * k
        moving = true
      }
    }
    const dThick = strength - curThick.current
    if (Math.abs(dThick) > 1e-4) {
      curThick.current += dThick * k
      moving = true
    }
    material.color.lerp(target.current, k)
    material.opacity += ((faded ? 0.5 : 0.94) - material.opacity) * k
    const changed = seen.current.rev !== anchors.rev || seen.current.base !== anchors.baseRev
    if (!moving && !changed) return
    seen.current = { rev: anchors.rev, base: anchors.baseRev }
    if (left.current) writeSide(left.current, 1, cur.current, curThick.current)
    if (right.current) writeSide(right.current, -1, cur.current, curThick.current)
  })

  return (
    <group>
      <instancedMesh ref={left} args={[geometry, material, N]} frustumCulled={false} renderOrder={3} />
      <instancedMesh ref={right} args={[geometry, material, N]} frustumCulled={false} renderOrder={3} />
    </group>
  )
}
