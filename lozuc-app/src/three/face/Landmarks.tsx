import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, InstancedMesh, Matrix4, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import { LANDMARKS, type LandmarkId } from '../../lib/face'
import { anchors } from './anchors'
import { scanY } from './fx'

/* Glowing sage landmark nodes; each pops in when the scan sweep passes its height. */

const IDS = (Object.keys(LANDMARKS) as LandmarkId[]).filter((id) => id !== 'tragusR' && id !== 'tragusL')
const _m = new Matrix4()
const _p = new Vector3()

export function Landmarks({ scan }: { scan?: number }) {
  const core = useRef<InstancedMesh>(null)
  const halo = useRef<InstancedMesh>(null)
  const geo = useMemo(() => new SphereGeometry(1, 12, 10), [])
  const coreMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#ffffff'), toneMapped: false }), [])
  const haloMat = useMemo(() => new MeshBasicMaterial({ color: new Color('#a9c7b6'), transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), [])
  const pop = useMemo(() => new Float32Array(IDS.length), [])

  useFrame((state, dt) => {
    const ys = scan === undefined ? -99 : scanY(scan)
    const t = state.clock.elapsedTime
    for (let i = 0; i < IDS.length; i++) {
      const b = anchors.landmarks[IDS[i]]
      const on = b.y > ys ? 1 : 0
      pop[i] += (on - pop[i]) * (1 - Math.exp(-dt * (on ? 10 : 18)))
      const s = pop[i] * (1 + 0.25 * Math.sin(Math.min(1, pop[i]) * Math.PI))
      _p.set(b.x, b.y, b.z + 0.012)
      const tw = 1 + 0.12 * Math.sin(t * 2.4 + i * 1.7)
      _m.makeScale(0.01 * s, 0.01 * s, 0.01 * s).setPosition(_p)
      core.current?.setMatrixAt(i, _m)
      _m.makeScale(0.028 * s * tw, 0.028 * s * tw, 0.01).setPosition(_p)
      halo.current?.setMatrixAt(i, _m)
    }
    if (core.current) core.current.instanceMatrix.needsUpdate = true
    if (halo.current) halo.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={halo} args={[geo, haloMat, IDS.length]} frustumCulled={false} renderOrder={19} />
      <instancedMesh ref={core} args={[geo, coreMat, IDS.length]} frustumCulled={false} renderOrder={19} />
    </group>
  )
}
