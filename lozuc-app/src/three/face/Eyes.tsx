import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, SphereGeometry, Vector3, type Group, type Material, type Mesh } from 'three'
import { easing } from 'maath'
import { createEyeMaterial, createLidMaterial, type LidUniforms } from './materials'

/* Two eyes: glossy eyeball inside an eyelid shell (aperture cut in the shader).
   They blink every 3–6 s and track a gaze target. */

const EYE_CENTRE = { x: 0.345, y: -0.035, z: -0.15 }
const EYE_R = 0.132
const SHELL = new Vector3(0.188, 0.142, 0.148)

interface Props {
  skin: Color
  clay: { value: number }
  gaze: React.MutableRefObject<Vector3>
  /** scan material override: both ball and shell use it, lids closed */
  override?: Material | null
}

export function Eyes({ skin, clay, gaze, override = null }: Props) {
  const eyeGeo = useMemo(() => new SphereGeometry(1, 48, 36).rotateX(Math.PI / 2), [])
  const shellGeo = useMemo(() => new SphereGeometry(1, 56, 36).rotateX(Math.PI / 2), [])
  const iris = useMemo(() => ({ uIris: { value: new Color('#5a4232') }, uPupil: { value: 0.22 } }), [])
  const eyeMat = useMemo(() => createEyeMaterial(iris), [iris])
  const lidU = useMemo(() => [-1, 1].map((side): LidUniforms => ({ uSkin: { value: skin }, uClay: clay, uOpen: { value: 1 }, uSide: { value: side } })), []) // eslint-disable-line react-hooks/exhaustive-deps
  const lidMats = useMemo(() => lidU.map(createLidMaterial), [lidU])
  useEffect(() => () => [eyeGeo, shellGeo, eyeMat, ...lidMats].forEach((x) => x.dispose()), [eyeGeo, shellGeo, eyeMat, lidMats])

  const groups = useRef<(Group | null)[]>([])
  const balls = useRef<(Mesh | null)[]>([])
  const blink = useRef({ next: 2.5, t: -1 })
  const d = useMemo(() => new Vector3(), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const b = blink.current
    if (b.t < 0 && t > b.next) b.t = t
    let lid = 1
    if (b.t >= 0) {
      const p = (t - b.t) / 0.24
      lid = Math.max(0.02, p < 0.4 ? 1 - p / 0.4 : Math.min(1, (p - 0.4) / 0.6))
      if (p >= 1) {
        b.t = -1
        b.next = t + (Math.random() < 0.15 ? 0.25 : 3 + Math.random() * 3)
      }
    }
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1
      lidU[i].uOpen.value = 0.95 * lid
      const g = groups.current[i]
      const ball = balls.current[i]
      if (g && ball) {
        d.copy(gaze.current).sub(g.position)
        const yaw = Math.max(-0.35, Math.min(0.35, Math.atan2(d.x, d.z) + side * 0.07))
        const pitch = Math.max(-0.25, Math.min(0.25, Math.atan2(d.y, Math.hypot(d.x, d.z))))
        easing.damp(ball.rotation, 'y', yaw, 0.08, dt)
        easing.damp(ball.rotation, 'x', -pitch, 0.08, dt)
      }
    }
  })

  return (
    <>
      {[-1, 1].map((side, i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)} position={[EYE_CENTRE.x * side, EYE_CENTRE.y, EYE_CENTRE.z]}>
          <mesh ref={(m) => void (balls.current[i] = m)} geometry={eyeGeo} material={override ?? eyeMat} scale={EYE_R} />
          {!override && <mesh geometry={shellGeo} material={lidMats[i]} scale={SHELL} />}
        </group>
      ))}
    </>
  )
}
