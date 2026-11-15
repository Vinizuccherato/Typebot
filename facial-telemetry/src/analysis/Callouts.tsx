import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, Object3D, Vector3, type Group, type InstancedMesh } from 'three'
import { ScanFace } from 'lucide-react'
import { headRegistry } from '../lib/face'
import { useFace } from '../store'
import { projectFrontal } from './model'
import { MINT, OVERLAY_ORDER, RevealLine } from './primitives'

/* The reference's on-face callouts: the dotted "Scanned 72%" patch on the cheek and
   the Hemodynamic Index leader. Both live in head space and track scan/vitals. */

const GRID: [number, number][] = []
for (let iy = 0; iy < 10; iy++) for (let ix = 0; ix < 10; ix++) GRID.push([0.27 + ix * 0.032, -0.2 - iy * 0.032])

const dummy = new Object3D()
const c = new Color()

/** Surface points for frontal (x, y) samples; re-projected whenever the head mesh changes. */
function useSurface(space: React.RefObject<Group | null>, xy: [number, number][], lift: number) {
  const [pts, setPts] = useState<Vector3[]>(() => projectFrontal(null, null, xy, lift))
  const key = useRef('')
  useFrame(() => {
    const mesh = headRegistry.mesh
    const k = mesh ? `${mesh.uuid}:${mesh.geometry.uuid}` : 'none'
    if (k !== key.current && space.current) {
      key.current = k
      setPts(projectFrontal(mesh, space.current, xy, lift))
    }
  })
  return pts
}

export function ScanPatch({ space }: { space: React.RefObject<Group | null> }) {
  const inst = useRef<InstancedMesh>(null)
  const pts = useSurface(space, GRID, 0.01)
  const pill = useSurface(space, [[0.42, -0.34]], 0.03)
  const label = useRef<HTMLSpanElement>(null)
  const wrap = useRef<HTMLDivElement>(null)

  useFrame(({ clock }) => {
    const m = inst.current
    if (!m) return
    const st = useFace.getState()
    const prog = st.scan.progress / 100
    const dim = st.selected ? 0.25 : 1
    const t = clock.elapsedTime
    pts.forEach((p, i) => {
      const ix = i % 10
      const iy = Math.floor(i / 10)
      const order = (iy * 10 + ix) / GRID.length
      const on = order <= prog ? 1 : 0.18
      const twinkle = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7)
      dummy.position.copy(p)
      dummy.scale.setScalar((on > 0.5 ? 1 : 0.6) * 0.0065)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      c.set(MINT).multiplyScalar(on * twinkle * dim)
      m.setColorAt(i, c)
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    if (label.current) label.current.textContent = `${Math.floor(st.scan.progress)}%`
    if (wrap.current) wrap.current.style.opacity = String(dim)
  })

  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, GRID.length]} renderOrder={OVERLAY_ORDER} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} transparent depthWrite={false} />
      </instancedMesh>
      <Html position={pill[0]} center zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={wrap}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full py-[5px] pl-[6px] pr-3 text-[11px] text-[var(--text)]"
          style={{
            transform: 'scale(var(--s))',
            background: 'rgb(14 26 23 / 0.62)',
            border: '1px solid rgb(255 255 255 / 0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.1), 0 6px 18px -8px rgb(0 0 0 / 0.6)',
            transition: 'opacity .4s',
          }}
        >
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-white/10">
            <ScanFace size={11} strokeWidth={1.6} />
          </span>
          Scanned <span ref={label} className="tabular text-[var(--mint)]">0%</span>
        </div>
      </Html>
    </group>
  )
}

export function Hemodynamic({ space }: { space: React.RefObject<Group | null> }) {
  const src = useSurface(space, [[0.56, -0.3]], 0.012)
  const value = useRef<HTMLSpanElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const dot = useRef<Group>(null)

  const path = useMemo(() => {
    const s = src[0]
    const elbow = new Vector3(0.86, -0.3, s.z + 0.12)
    const end = new Vector3(1.02, -0.3, s.z + 0.12)
    return { s, elbow, end, line: [s, elbow, end] }
  }, [src])

  useFrame(({ clock }) => {
    const st = useFace.getState()
    if (value.current) value.current.textContent = `${st.vitals.hemodynamic} ms`
    const dim = st.selected ? 0.25 : 1
    if (wrap.current) wrap.current.style.opacity = String(dim)
    if (dot.current) dot.current.scale.setScalar(1 + 0.35 * Math.max(0, Math.sin(clock.elapsedTime * ((st.vitals.heartRate / 60) * Math.PI * 2))))
  })

  return (
    <group>
      <RevealLine points={path.line} opacity={0.75} width={1.1} duration={0.9} delay={0.6} />
      <group ref={dot} position={path.s}>
        <mesh renderOrder={OVERLAY_ORDER}>
          <sphereGeometry args={[0.011, 12, 12]} />
          <meshBasicMaterial color={MINT} toneMapped={false} depthTest={false} transparent />
        </mesh>
        <mesh renderOrder={OVERLAY_ORDER}>
          <ringGeometry args={[0.02, 0.024, 32]} />
          <meshBasicMaterial color={MINT} toneMapped={false} depthTest={false} transparent opacity={0.6} />
        </mesh>
      </group>
      <Html position={path.end} zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={wrap} style={{ transform: 'translate(6px, -50%) scale(var(--s))', transformOrigin: 'left center', transition: 'opacity .4s' }} className="whitespace-nowrap">
          <div className="text-[12px] text-[var(--text)]">Hemodynamic Index</div>
          <div className="text-[10.5px] text-[var(--text-3)]">
            20 – 100+ ms · <span ref={value} className="tabular text-[var(--mint)]">64 ms</span>
          </div>
        </div>
      </Html>
    </group>
  )
}

export function Callouts({ space }: { space: React.RefObject<Group | null> }) {
  return (
    <>
      <ScanPatch space={space} />
      <Hemodynamic space={space} />
    </>
  )
}
