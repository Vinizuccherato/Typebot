import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, InstancedMesh, Matrix4, SphereGeometry, MeshBasicMaterial, Vector3 } from 'three'
import { LANDMARKS, type LandmarkId } from '../../lib/face'
import { anchors } from '../acc/anchors'
import { scanY } from './fx'

/* Glowing lilac landmark nodes. Each pops in (spring overshoot) when the scan sweep
   passes its height; with no scan running they are all shown. */

const IDS = (Object.keys(LANDMARKS) as LandmarkId[]).filter((id) => id !== 'tragusR' && id !== 'tragusL')
const _m = new Matrix4()
const _p = new Vector3()

export function Landmarks({ scan, color = '#c3b4ff' }: { scan?: number; color?: string }) {
  const core = useRef<InstancedMesh>(null)
  const halo = useRef<InstancedMesh>(null)
  const geo = useMemo(() => new SphereGeometry(1, 12, 10), [])
  const coreMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#ffffff'), toneMapped: false }), [])
  const haloMat = useMemo(() => new MeshBasicMaterial({ color: new Color(color), transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), [color])
  const pop = useMemo(() => new Float32Array(IDS.length), [])

  useFrame((state, dt) => {
    const ys = scan === undefined ? -99 : scanY(scan)
    const t = state.clock.elapsedTime
    for (let i = 0; i < IDS.length; i++) {
      const b = anchors.base[IDS[i]]
      const on = b.y > ys ? 1 : 0
      // critically-damped-ish spring with a little overshoot
      pop[i] += (on - pop[i]) * (1 - Math.exp(-dt * (on ? 10 : 18)))
      const s = pop[i] * (1 + 0.25 * Math.sin(Math.min(1, pop[i]) * Math.PI))
      _p.set(b.x, b.y, b.z + 0.012)
      const twinkle = 1 + 0.12 * Math.sin(t * 2.4 + i * 1.7)
      _m.makeScale(0.0105 * s, 0.0105 * s, 0.0105 * s).setPosition(_p)
      core.current?.setMatrixAt(i, _m)
      _m.makeScale(0.03 * s * twinkle, 0.03 * s * twinkle, 0.01).setPosition(_p)
      halo.current?.setMatrixAt(i, _m)
    }
    if (core.current) core.current.instanceMatrix.needsUpdate = true
    if (halo.current) halo.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group renderOrder={8}>
      <instancedMesh ref={halo} args={[geo, haloMat, IDS.length]} frustumCulled={false} />
      <instancedMesh ref={core} args={[geo, coreMat, IDS.length]} frustumCulled={false} />
    </group>
  )
}
