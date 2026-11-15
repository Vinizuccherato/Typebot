import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, Object3D, Vector3, type Group, type InstancedMesh } from 'three'
import { FEATURES, LANDMARKS, headRegistry, type FeatureId, type LandmarkId } from '../lib/face'
import { useFace } from '../store'
import { useAnalysis } from './analysisStore'
import { Callouts } from './Callouts'
import { Measurements } from './Measurements'
import { FEATURE_ORDER, resolveLandmarks } from './model'
import { Overlays } from './Overlays'
import { RegionPicker } from './picking'
import { MINT, OVERLAY_ORDER, Tag } from './primitives'

/* ──────────────────────────────────────────────────────────────
   Visagism layer — mounted by the scene INSIDE the head group, so
   everything here is head-local (see lib/face.ts) and turns with the head.
   ────────────────────────────────────────────────────────────── */

const IDS = Object.keys(LANDMARKS) as LandmarkId[]
const dummy = new Object3D()
const col = new Color()
const camDir = new Vector3()
const wn = new Vector3()
const wp = new Vector3()

/** Re-resolves landmarks whenever the published head mesh (or its geometry) changes. */
function useResolver(space: React.RefObject<Group | null>) {
  const setResolved = useAnalysis((s) => s.setResolved)
  const key = useRef('')
  useFrame(() => {
    const mesh = headRegistry.mesh
    const k = mesh ? `${mesh.uuid}:${mesh.geometry.uuid}` : 'none'
    if (k === key.current || !space.current) return
    key.current = k
    const r = resolveLandmarks(mesh, space.current)
    setResolved(r.points, r.normals, r.fromMesh)
  })
}

function LandmarkNodes() {
  const inst = useRef<InstancedMesh>(null)
  const scales = useRef<number[]>(IDS.map(() => 0))
  useFrame(({ clock }, dt) => {
    const m = inst.current
    if (!m) return
    const { points, normals } = useAnalysis.getState()
    const st = useFace.getState()
    const active = new Set<LandmarkId>()
    if (st.selected) FEATURES[st.selected].landmarks.forEach((id) => active.add(id))
    if (st.hovered) FEATURES[st.hovered].landmarks.forEach((id) => active.add(id))
    const all = st.overlays.landmarks && !st.selected
    const k = 1 - Math.exp(-dt * 10)
    const t = clock.elapsedTime
    IDS.forEach((id, i) => {
      const on = active.has(id) ? 1 : all ? 0.6 : 0
      scales.current[i] += (on - scales.current[i]) * k
      const s = scales.current[i]
      dummy.position.copy(points[id]).addScaledVector(normals[id], 0.008)
      dummy.scale.setScalar(Math.max(0.0001, s) * (active.has(id) ? 0.0105 + 0.002 * Math.sin(t * 4 + i) : 0.0075))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      col.set(MINT).multiplyScalar(active.has(id) ? 1.4 : 0.85)
      m.setColorAt(i, col)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={inst} args={[undefined, undefined, IDS.length]} renderOrder={OVERLAY_ORDER} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial toneMapped={false} transparent depthWrite={false} />
    </instancedMesh>
  )
}

function LandmarkLabels({ feature }: { feature: FeatureId }) {
  const points = useAnalysis((s) => s.points)
  return (
    <>
      {FEATURES[feature].landmarks.map((id) => (
        <Html key={id} position={points[id]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="whitespace-nowrap text-[9px] text-[var(--text-3)]"
            style={{ transform: 'translate(7px, -50%) scale(var(--s))', transformOrigin: 'left center' }}
          >
            {LANDMARKS[id].label}
          </div>
        </Html>
      ))}
    </>
  )
}

/** Pulsing feature hotspots; hidden when their surface faces away from the camera. */
function Hotspots({ space }: { space: React.RefObject<Group | null> }) {
  const points = useAnalysis((s) => s.points)
  const normals = useAnalysis((s) => s.normals)
  const select = useFace((s) => s.select)
  const hover = useFace((s) => s.hover)
  const selected = useFace((s) => s.selected)
  const tool = useFace((s) => s.tool)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const anchors = useMemo(
    () =>
      FEATURE_ORDER.map((f) => {
        const id = FEATURES[f].anchor
        // hotspots sit just off the surface, nudged outward along the normal
        return { f, pos: points[id].clone().addScaledVector(normals[id], 0.045), normal: normals[id] }
      }),
    [points, normals],
  )
  const enabled = tool === 'inspect' || tool === 'measure'

  useFrame(({ camera }) => {
    const g = space.current
    if (!g) return
    for (const a of anchors) {
      const el = refs.current[a.f]
      if (!el) continue
      wp.copy(a.pos).applyMatrix4(g.matrixWorld)
      wn.copy(a.normal).transformDirection(g.matrixWorld)
      camDir.copy(camera.position).sub(wp).normalize()
      const facing = wn.dot(camDir)
      const vis = enabled ? Math.min(1, Math.max(0, (facing - 0.05) * 4)) : 0
      const sel = useFace.getState().selected
      const o = sel && sel !== a.f ? vis * 0.35 : vis
      el.style.opacity = o.toFixed(3)
      el.style.pointerEvents = o > 0.3 ? 'auto' : 'none'
    }
  })

  return (
    <>
      {anchors.map((a) => (
        <Html key={a.f} position={a.pos} center zIndexRange={[45, 0]}>
          <button
            ref={(el) => void (refs.current[a.f] = el)}
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => select(selected === a.f ? null : a.f)}
            onPointerEnter={() => hover(a.f)}
            onPointerLeave={() => hover(null)}
            className="group relative grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full outline-none"
            style={{ transform: 'scale(var(--s))', transition: 'opacity .25s' }}
          >
            <span
              className="absolute inset-0 rounded-full border border-[var(--mint)]/60"
              style={{ animation: 'hotspot-pulse 2.4s cubic-bezier(.22,1,.36,1) infinite' }}
            />
            <span
              className={`relative h-[8px] w-[8px] rounded-full transition-transform duration-300 group-hover:scale-125 ${selected === a.f ? 'bg-white' : 'bg-[var(--mint)]'}`}
              style={{ boxShadow: '0 0 10px rgb(143 240 192 / .9)' }}
            />
            <span className="pointer-events-none absolute left-[26px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/55 px-2 py-[2px] text-[10px] text-[var(--text)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {FEATURES[a.f].label}
            </span>
          </button>
        </Html>
      ))}
    </>
  )
}

/** Small floating label that follows the hovered region. */
function HoverTag() {
  const hovered = useFace((s) => s.hovered)
  const selected = useFace((s) => s.selected)
  const points = useAnalysis((s) => s.points)
  if (!hovered || hovered === selected) return null
  const at = points[FEATURES[hovered].anchor].clone().add(new Vector3(0, 0.07, 0.06))
  return (
    <Tag at={at}>
      <span className="text-[var(--mint)]">{FEATURES[hovered].label}</span> <span className="text-[var(--text-3)]">· click to analyse</span>
    </Tag>
  )
}

export function AnalysisLayer() {
  const space = useRef<Group>(null)
  const selected = useFace((s) => s.selected)
  useResolver(space)
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = '@keyframes hotspot-pulse{0%{transform:scale(.55);opacity:.9}100%{transform:scale(1.35);opacity:0}}'
    document.head.appendChild(el)
    return () => el.remove()
  }, [])
  return (
    <group ref={space} name="visagism">
      <RegionPicker space={space} />
      <LandmarkNodes />
      <Hotspots space={space} />
      <HoverTag />
      <Overlays />
      {selected && <Measurements feature={selected} />}
      {selected && <LandmarkLabels feature={selected} />}
      <Callouts space={space} />
    </group>
  )
}
