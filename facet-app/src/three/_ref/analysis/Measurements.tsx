import { Fragment, useMemo } from 'react'
import { Vector3 } from 'three'
import type { FeatureId } from '../lib/face'
import { useAnalysis } from './analysisStore'
import { type Measure, type Points, type Visual } from './model'
import { RevealLine, Tag, tick } from './primitives'

/* Caliper-style dimension lines, angle arcs and ratio chains for the selected feature.
   Dimension lines float just in front of the face (technical-drawing style) with dashed
   extension lines down to the landmarks, so they read at any rotation. */

const zFront = (p: Points, ...ids: (keyof Points)[]) => Math.max(...ids.map((id) => p[id].z)) + 0.06

/** Measures of the selected feature, by id — every 3D label reads its name and value from here,
    so the face and the inspector always show the same numbers. */
type Lookup = Record<string, Measure | undefined>

export const formatMeasure = (ms: Measure) =>
  ms.unit === 'ratio' ? ms.value.toFixed(2) : ms.unit === '°' ? `${ms.value.toFixed(1)}°` : ms.unit === '%' ? `${Math.round(ms.value)}%` : `${ms.value.toFixed(1)} mm`

function MeasureTag({ at, ms }: { at: Vector3; ms: Measure | undefined }) {
  if (!ms) return null
  return (
    <Tag at={at}>
      <span className="text-[var(--text-2)]">{ms.label}</span> <span className="text-[var(--mint)]">{formatMeasure(ms)}</span>
    </Tag>
  )
}

function Dim({ v, p, delay, ms }: { v: Extract<Visual, { kind: 'dim' }>; p: Points; delay: number; ms: Lookup }) {
  const geo = useMemo(() => {
    const A = p[v.a]
    const B = p[v.b]
    let P: Vector3
    let Q: Vector3
    if (v.axis === 'x') {
      const y = (A.y + B.y) / 2 + v.offset
      const z = zFront(p, v.a, v.b)
      P = new Vector3(A.x, y, z)
      Q = new Vector3(B.x, y, z)
    } else if (v.axis === 'y') {
      const x = (A.x + B.x) / 2 + v.offset
      const z = zFront(p, v.a, v.b)
      P = new Vector3(x, A.y, z)
      Q = new Vector3(x, B.y, z)
    } else {
      P = A.clone().add(new Vector3(0, 0, v.offset))
      Q = B.clone().add(new Vector3(0, 0, v.offset))
    }
    const dir = Q.clone().sub(P).normalize()
    const mid = P.clone().lerp(Q, 0.5)
    const perp = new Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.045)
    if (perp.y < 0 || (Math.abs(perp.y) < 1e-3 && perp.x < 0)) perp.negate()
    return { A, B, P, Q, tA: tick(P, dir), tB: tick(Q, dir), label: mid.add(perp) }
  }, [v, p])
  return (
    <group>
      <RevealLine points={[geo.A, geo.P]} dashed opacity={0.45} width={1} />
      <RevealLine points={[geo.B, geo.Q]} dashed opacity={0.45} width={1} />
      <RevealLine points={[geo.P, geo.Q]} delay={delay} width={1.5} />
      <RevealLine points={geo.tA} delay={delay} width={1.5} />
      <RevealLine points={geo.tB} delay={delay + 0.4} width={1.5} />
      <MeasureTag at={geo.label} ms={ms[v.m]} />
    </group>
  )
}

function Angle({ v, p, delay, ms }: { v: Extract<Visual, { kind: 'angle' }>; p: Points; delay: number; ms: Lookup }) {
  const geo = useMemo(() => {
    const V = p[v.v]
    const u = p[v.a].clone().sub(V).normalize()
    const w = p[v.b].clone().sub(V).normalize()
    const theta = Math.acos(Math.min(1, Math.max(-1, u.dot(w))))
    const axis = u.clone().cross(w).normalize()
    const r = 0.075
    const arc: Vector3[] = []
    for (let i = 0; i <= 28; i++) arc.push(u.clone().applyAxisAngle(axis, (theta * i) / 28).multiplyScalar(r).add(V))
    const bis = u.clone().add(w).normalize()
    const lift = new Vector3(0, 0, 0.02)
    return {
      arc: arc.map((a) => a.add(lift)),
      armA: [V.clone().add(lift), u.clone().multiplyScalar(0.16).add(V).add(lift)],
      armB: [V.clone().add(lift), w.clone().multiplyScalar(0.16).add(V).add(lift)],
      label: bis.multiplyScalar(r + 0.07).add(V).add(lift),
    }
  }, [v, p])
  return (
    <group>
      <RevealLine points={geo.armA} delay={delay} width={1.1} opacity={0.7} />
      <RevealLine points={geo.armB} delay={delay} width={1.1} opacity={0.7} />
      <RevealLine points={geo.arc} delay={delay + 0.2} width={1.6} />
      <MeasureTag at={geo.label} ms={ms[v.m]} />
    </group>
  )
}

function Chain({ v, p, delay, ms }: { v: Extract<Visual, { kind: 'chain' }>; p: Points; delay: number; ms: Lookup }) {
  const geo = useMemo(() => {
    const pts = v.ids.map((id) => p[id])
    const z = zFront(p, ...v.ids)
    let proj: Vector3[]
    if (v.axis === 'x') {
      const y = pts.reduce((s, q) => s + q.y, 0) / pts.length + v.offset
      proj = pts.map((q) => new Vector3(q.x, y, z))
    } else {
      const x = pts.reduce((s, q) => s + q.x, 0) / pts.length + v.offset
      proj = pts.map((q) => new Vector3(x, q.y, z))
    }
    const dir = proj[proj.length - 1].clone().sub(proj[0]).normalize()
    const perp = new Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.045)
    if (perp.y < 0 || (Math.abs(perp.y) < 1e-3 && perp.x < 0)) perp.negate()
    const segs = proj.slice(1).map((q, i) => ({ mid: proj[i].clone().lerp(q, 0.5).add(perp) }))
    return { pts, proj, dir, segs }
  }, [v, p])
  return (
    <group>
      {geo.pts.map((q, i) => (
        <RevealLine key={`e${i}`} points={[q, geo.proj[i]]} dashed opacity={0.4} width={1} />
      ))}
      <RevealLine points={geo.proj} delay={delay} width={1.5} />
      {geo.proj.map((q, i) => (
        <RevealLine key={`t${i}`} points={tick(q, geo.dir)} delay={delay + i * 0.1} width={1.5} />
      ))}
      {geo.segs.map((s, i) => (
        <MeasureTag key={i} at={s.mid} ms={ms[v.m[i]]} />
      ))}
    </group>
  )
}

/** Baseline a–b with a perpendicular rise to the peak (e.g. brow arch height). */
function Rise({ v, p, delay, ms }: { v: Extract<Visual, { kind: 'rise' }>; p: Points; delay: number; ms: Lookup }) {
  const geo = useMemo(() => {
    const lift = new Vector3(0, 0, 0.03)
    const A = p[v.a].clone().add(lift)
    const B = p[v.b].clone().add(lift)
    const K = p[v.peak].clone().add(lift)
    const ab = B.clone().sub(A)
    const t = Math.min(1, Math.max(0, K.clone().sub(A).dot(ab) / ab.lengthSq()))
    const foot = A.clone().add(ab.multiplyScalar(t))
    const up = K.clone().sub(foot).normalize()
    return { A, B, K, foot, tK: tick(K, up), label: foot.clone().lerp(K, 0.5).add(new Vector3(-0.07, 0, 0)) }
  }, [v, p])
  return (
    <group>
      <RevealLine points={[geo.A, geo.B]} dashed opacity={0.45} width={1} />
      <RevealLine points={[geo.foot, geo.K]} delay={delay} width={1.5} />
      <RevealLine points={geo.tK} delay={delay + 0.3} width={1.5} />
      <MeasureTag at={geo.label} ms={ms[v.m]} />
    </group>
  )
}

/** Segment a→b measured against the horizontal (e.g. brow tail tilt). */
function Slope({ v, p, delay, ms }: { v: Extract<Visual, { kind: 'slope' }>; p: Points; delay: number; ms: Lookup }) {
  const geo = useMemo(() => {
    const lift = new Vector3(0, 0, 0.05)
    const A = p[v.a].clone().add(lift)
    const B = p[v.b].clone().add(lift)
    const H = new Vector3(B.x, A.y, B.z)
    const r = 0.1
    const u = H.clone().sub(A).normalize()
    const w = B.clone().sub(A).normalize()
    const theta = Math.acos(Math.min(1, Math.max(-1, u.dot(w))))
    const axis = u.clone().cross(w)
    const arc: Vector3[] = []
    if (axis.lengthSq() > 1e-8) {
      axis.normalize()
      for (let i = 0; i <= 16; i++) arc.push(u.clone().applyAxisAngle(axis, (theta * i) / 16).multiplyScalar(r).add(A))
    }
    return { A, B, H, arc, label: A.clone().add(u.clone().add(w).normalize().multiplyScalar(r + 0.08)).add(new Vector3(0, -0.04, 0)) }
  }, [v, p])
  return (
    <group>
      <RevealLine points={[geo.A, geo.H]} dashed opacity={0.4} width={1} />
      <RevealLine points={[geo.A, geo.B]} delay={delay} width={1.3} opacity={0.8} />
      {geo.arc.length > 1 && <RevealLine points={geo.arc} delay={delay + 0.2} width={1.5} />}
      <MeasureTag at={geo.label} ms={ms[v.m]} />
    </group>
  )
}

export function Measurements({ feature }: { feature: FeatureId }) {
  const report = useAnalysis((s) => s.reports[feature])
  const points = useAnalysis((s) => s.points)
  const ms = useMemo<Lookup>(() => Object.fromEntries(report.measures.map((x) => [x.id, x])), [report])
  return (
    <group key={feature}>
      {report.visuals.map((v, i) => (
        <Fragment key={i}>
          {v.kind === 'dim' && <Dim v={v} p={points} delay={0.1 + i * 0.14} ms={ms} />}
          {v.kind === 'angle' && <Angle v={v} p={points} delay={0.1 + i * 0.14} ms={ms} />}
          {v.kind === 'chain' && <Chain v={v} p={points} delay={0.1 + i * 0.14} ms={ms} />}
          {v.kind === 'rise' && <Rise v={v} p={points} delay={0.1 + i * 0.14} ms={ms} />}
          {v.kind === 'slope' && <Slope v={v} p={points} delay={0.1 + i * 0.14} ms={ms} />}
        </Fragment>
      ))}
    </group>
  )
}

