import { Fragment, useMemo } from 'react'
import { Vector3 } from 'three'
import type { FeatureId } from '../lib/face'
import { useAnalysis } from './analysisStore'
import { MM, type Points, type Visual } from './model'
import { RevealLine, Tag, tick } from './primitives'

/* Caliper-style dimension lines, angle arcs and ratio chains for the selected feature.
   Dimension lines float just in front of the face (technical-drawing style) with dashed
   extension lines down to the landmarks, so they read at any rotation. */

const zFront = (p: Points, ...ids: (keyof Points)[]) => Math.max(...ids.map((id) => p[id].z)) + 0.06

function Dim({ v, p, delay }: { v: Extract<Visual, { kind: 'dim' }>; p: Points; delay: number }) {
  const geo = useMemo(() => {
    const A = p[v.a]
    const B = p[v.b]
    let P: Vector3
    let Q: Vector3
    let value: number
    if (v.axis === 'x') {
      const y = (A.y + B.y) / 2 + v.offset
      const z = zFront(p, v.a, v.b)
      P = new Vector3(A.x, y, z)
      Q = new Vector3(B.x, y, z)
      value = Math.abs(A.x - B.x) * MM
    } else if (v.axis === 'y') {
      const x = (A.x + B.x) / 2 + v.offset
      const z = zFront(p, v.a, v.b)
      P = new Vector3(x, A.y, z)
      Q = new Vector3(x, B.y, z)
      value = Math.abs(A.y - B.y) * MM
    } else {
      P = A.clone().add(new Vector3(0, 0, v.offset))
      Q = B.clone().add(new Vector3(0, 0, v.offset))
      value = A.distanceTo(B) * MM
    }
    const dir = Q.clone().sub(P).normalize()
    const mid = P.clone().lerp(Q, 0.5)
    const perp = new Vector3(-dir.y, dir.x, 0).normalize().multiplyScalar(0.045)
    if (perp.y < 0 || (Math.abs(perp.y) < 1e-3 && perp.x < 0)) perp.negate()
    return { A, B, P, Q, value, tA: tick(P, dir), tB: tick(Q, dir), label: mid.add(perp) }
  }, [v, p])
  return (
    <group>
      <RevealLine points={[geo.A, geo.P]} dashed opacity={0.45} width={1} />
      <RevealLine points={[geo.B, geo.Q]} dashed opacity={0.45} width={1} />
      <RevealLine points={[geo.P, geo.Q]} delay={delay} width={1.5} />
      <RevealLine points={geo.tA} delay={delay} width={1.5} />
      <RevealLine points={geo.tB} delay={delay + 0.4} width={1.5} />
      <Tag at={geo.label}>
        <span className="text-[var(--text-2)]">{v.label}</span> <span className="text-[var(--mint)]">{geo.value.toFixed(1)} mm</span>
      </Tag>
    </group>
  )
}

function Angle({ v, p, delay }: { v: Extract<Visual, { kind: 'angle' }>; p: Points; delay: number }) {
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
      deg: (theta * 180) / Math.PI,
    }
  }, [v, p])
  return (
    <group>
      <RevealLine points={geo.armA} delay={delay} width={1.1} opacity={0.7} />
      <RevealLine points={geo.armB} delay={delay} width={1.1} opacity={0.7} />
      <RevealLine points={geo.arc} delay={delay + 0.2} width={1.6} />
      <Tag at={geo.label}>
        <span className="text-[var(--text-2)]">{v.label}</span> <span className="text-[var(--mint)]">{geo.deg.toFixed(1)}°</span>
      </Tag>
    </group>
  )
}

function Chain({ v, p, delay }: { v: Extract<Visual, { kind: 'chain' }>; p: Points; delay: number }) {
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
    const segs = proj.slice(1).map((q, i) => ({
      mid: proj[i].clone().lerp(q, 0.5).add(perp),
      value: (v.axis === 'x' ? Math.abs(q.x - proj[i].x) : Math.abs(q.y - proj[i].y)) * MM,
    }))
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
        <Tag key={i} at={s.mid}>
          <span className="text-[var(--text-2)]">{v.labels[i]}</span> <span className="text-[var(--mint)]">{s.value.toFixed(1)} mm</span>
        </Tag>
      ))}
    </group>
  )
}

export function Measurements({ feature }: { feature: FeatureId }) {
  const report = useAnalysis((s) => s.reports[feature])
  const points = useAnalysis((s) => s.points)
  return (
    <group key={feature}>
      {report.visuals.map((v, i) => (
        <Fragment key={i}>
          {v.kind === 'dim' && <Dim v={v} p={points} delay={0.1 + i * 0.14} />}
          {v.kind === 'angle' && <Angle v={v} p={points} delay={0.1 + i * 0.14} />}
          {v.kind === 'chain' && <Chain v={v} p={points} delay={0.1 + i * 0.14} />}
        </Fragment>
      ))}
    </group>
  )
}

