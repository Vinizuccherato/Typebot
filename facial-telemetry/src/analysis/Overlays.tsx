import { useMemo } from 'react'
import { DoubleSide, Vector3 } from 'three'
import { useFace } from '../store'
import { useAnalysis } from './analysisStore'
import { MM, PHI, type Points } from './model'
import { MINT, OVERLAY_ORDER, RevealLine, Tag } from './primitives'

/* Whole-face proportion overlays (driven by the tabs / inspector toggles). All in
   head space so they turn with the head. Lines float in front of the face. */

const front = (p: Points) => Math.max(...Object.values(p).map((q) => q.z)) + 0.05

function Thirds({ p }: { p: Points }) {
  const g = useMemo(() => {
    const z = front(p)
    const ys = [p.trichion.y, p.glabella.y, p.subnasale.y, p.menton.y]
    const total = ys[0] - ys[3]
    const names = ['Upper', 'Middle', 'Lower']
    return {
      lines: ys.map((y) => [new Vector3(-0.92, y, z), new Vector3(0.92, y, z)]),
      labels: names.map((n, i) => ({ at: new Vector3(-0.98, (ys[i] + ys[i + 1]) / 2, z), text: n, pct: ((ys[i] - ys[i + 1]) / total) * 100 })),
      bracket: [new Vector3(-0.9, ys[0], z), new Vector3(-0.9, ys[3], z)],
    }
  }, [p])
  return (
    <group>
      {g.lines.map((l, i) => (
        <RevealLine key={i} points={l} opacity={0.55} width={1} delay={i * 0.08} />
      ))}
      <RevealLine points={g.bracket} opacity={0.8} width={1.4} />
      {g.labels.map((l) => (
        <Tag key={l.text} at={l.at} className="!translate-x-[-40%]">
          <span className="text-[var(--text-2)]">{l.text}</span> <span className="text-[var(--mint)]">{l.pct.toFixed(1)}%</span>
        </Tag>
      ))}
    </group>
  )
}

function Fifths({ p }: { p: Points }) {
  const g = useMemo(() => {
    const z = front(p)
    // frontal eye width (x only) so the five segments are directly comparable
    const eye = (Math.abs(p.endoR.x - p.exoR.x) + Math.abs(p.endoL.x - p.exoL.x)) / 2
    const xs = [p.exoR.x - eye, p.exoR.x, p.endoR.x, p.endoL.x, p.exoL.x, p.exoL.x + eye]
    const top = p.glabella.y + 0.18
    const bottom = p.menton.y + 0.02
    return {
      lines: xs.map((x) => [new Vector3(x, top, z), new Vector3(x, bottom, z)]),
      labels: xs.slice(1).map((x, i) => ({ at: new Vector3((xs[i] + x) / 2, top + 0.05, z), mm: Math.abs(x - xs[i]) * MM })),
    }
  }, [p])
  return (
    <group>
      {g.lines.map((l, i) => (
        <RevealLine key={i} points={l} opacity={0.5} width={1} delay={i * 0.06} />
      ))}
      {g.labels.map((l, i) => (
        <Tag key={i} at={l.at}>
          <span className="text-[var(--mint)]">{l.mm.toFixed(0)}</span>
        </Tag>
      ))}
    </group>
  )
}

function Golden({ p }: { p: Points }) {
  const g = useMemo(() => {
    const z = front(p) + 0.01
    const left = p.zygionR.x
    const right = p.zygionL.x
    const top = p.trichion.y
    const bottom = p.menton.y
    const h = top - bottom
    const rect = [new Vector3(left, top, z), new Vector3(right, top, z), new Vector3(right, bottom, z), new Vector3(left, bottom, z), new Vector3(left, top, z)]
    // golden cuts of the face length (≈ eye line / nose base / lip line)
    const cuts = [bottom + h / PHI, top - h / PHI, bottom + h / PHI / PHI / PHI].map((y) => [new Vector3(left, y, z), new Vector3(right, y, z)])
    // golden spiral, anchored at the nose tip, sized to the face width
    const spiral: Vector3[] = []
    const c = p.pronasale
    const b = Math.log(PHI) / (Math.PI / 2)
    const a = (right - left) / 2 / Math.exp(b * 3.4 * Math.PI)
    for (let i = 0; i <= 220; i++) {
      const t = (i / 220) * 3.4 * Math.PI
      const r = a * Math.exp(b * t)
      spiral.push(new Vector3(c.x + r * Math.cos(t + Math.PI), c.y + r * Math.sin(t + Math.PI) * 1.15, z))
    }
    return { rect, cuts, spiral, ratio: h / (right - left), labelAt: new Vector3(right, top + 0.06, z) }
  }, [p])
  return (
    <group>
      <RevealLine points={g.rect} opacity={0.7} width={1.2} duration={0.9} />
      {g.cuts.map((l, i) => (
        <RevealLine key={i} points={l} opacity={0.4} width={1} delay={0.3 + i * 0.1} />
      ))}
      <RevealLine points={g.spiral} color="#c8ffe2" opacity={0.55} width={1.2} duration={1.4} delay={0.2} />
      <Tag at={g.labelAt}>
        <span className="text-[var(--text-2)]">φ length : width</span> <span className="text-[var(--mint)]">{g.ratio.toFixed(2)}</span>{' '}
        <span className="text-[var(--text-3)]">/ 1.62</span>
      </Tag>
    </group>
  )
}

function Symmetry({ p }: { p: Points }) {
  const g = useMemo(() => {
    const z = front(p)
    const top = p.trichion.y + 0.08
    const bottom = p.menton.y - 0.08
    const pairs: [keyof Points, keyof Points, string][] = [
      ['exoR', 'exoL', 'Eyes'],
      ['zygionR', 'zygionL', 'Cheeks'],
      ['alarR', 'alarL', 'Nose'],
      ['cheilionR', 'cheilionL', 'Mouth'],
      ['gonionR', 'gonionL', 'Jaw'],
    ]
    return {
      axis: [new Vector3(0, top, z), new Vector3(0, bottom, z)],
      plane: { y: (top + bottom) / 2, h: top - bottom },
      pairs: pairs.map(([r, l, name]) => {
        const R = p[r]
        const L = p[l]
        const delta = Math.hypot(R.x + L.x, R.y - L.y) * MM
        return { line: [R.clone().setZ(z - 0.01), L.clone().setZ(z - 0.01)], at: new Vector3(L.x + 0.12, L.y, z), name, delta }
      }),
    }
  }, [p])
  return (
    <group>
      <mesh position={[0, g.plane.y, -0.1]} rotation={[0, Math.PI / 2, 0]} renderOrder={OVERLAY_ORDER - 1}>
        <planeGeometry args={[1.5, g.plane.h]} />
        <meshBasicMaterial color={MINT} transparent opacity={0.07} side={DoubleSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <RevealLine points={g.axis} dashed opacity={0.8} width={1.2} />
      {g.pairs.map((q, i) => (
        <group key={q.name}>
          <RevealLine points={q.line} opacity={0.35} width={1} delay={0.1 + i * 0.08} />
          <Tag at={q.at}>
            <span className="text-[var(--text-2)]">{q.name}</span>{' '}
            <span className={q.delta > 1.5 ? 'text-[var(--warn)]' : 'text-[var(--mint)]'}>Δ {q.delta.toFixed(1)} mm</span>
          </Tag>
        </group>
      ))}
    </group>
  )
}

export function Overlays() {
  const o = useFace((s) => s.overlays)
  const selected = useFace((s) => s.selected)
  const p = useAnalysis((s) => s.points)
  // when a feature is being inspected its own dimensions take the stage
  if (selected) return null
  return (
    <group>
      {o.thirds && <Thirds p={p} />}
      {o.fifths && <Fifths p={p} />}
      {o.golden && <Golden p={p} />}
      {o.symmetry && <Symmetry p={p} />}
    </group>
  )
}
