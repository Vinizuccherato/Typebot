import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, SphereGeometry, Vector3, type Group, type Mesh } from 'three'
import { easing } from 'maath'
import type { EyeFormId, Look } from '../store'
import { createEyeMaterial, createLidMaterial, type LidUniforms } from './materials'
import { morphParams, morphPoint, type MorphParams } from './morph'

/* Two eyes: a glossy eyeball (sclera / iris / pupil) inside an eyelid shell whose
   palpebral aperture is cut in the shader from the selected eye form.
   Eye centres follow the live face morph; eyes blink and track the gaze target. */

/** Aperture recipes on the unit shell: half-width, upper/lower height (rad), canthal tilt, cornerness, hood. */
export const EYE_SHAPES: Record<EyeFormId, { w: number; up: number; lo: number; tilt: number; pow: number; hood: number }> = {
  almond: { w: 1.0, up: 0.31, lo: 0.25, tilt: 0.07, pow: 1.55, hood: 0 },
  round: { w: 0.96, up: 0.38, lo: 0.29, tilt: 0.0, pow: 2.4, hood: 0 },
  hooded: { w: 1.0, up: 0.27, lo: 0.25, tilt: 0.02, pow: 1.8, hood: 1 },
  monolid: { w: 1.02, up: 0.25, lo: 0.2, tilt: 0.1, pow: 1.5, hood: 2 },
  upturned: { w: 1.0, up: 0.33, lo: 0.24, tilt: 0.22, pow: 1.7, hood: 0 },
  downturned: { w: 1.0, up: 0.33, lo: 0.26, tilt: -0.17, pow: 1.7, hood: 0 },
}

/** Eye centre in head-local units (behind the pupil landmark, inside the socket). */
export const EYE_CENTRE = { x: 0.32, y: -0.035, z: -0.205 }
const EYE_R = 0.118
const SHELL = new Vector3(0.168, 0.126, 0.132)

interface Props {
  look: Look
  skin: Color
  /** shared gaze target in head-local space (written by the parent each frame) */
  gaze: React.MutableRefObject<Vector3>
}

export function Eyes({ look, skin, gaze }: Props) {
  const eyeGeo = useMemo(() => new SphereGeometry(1, 64, 48).rotateX(Math.PI / 2), [])
  const shellGeo = useMemo(() => new SphereGeometry(1, 72, 48).rotateX(Math.PI / 2), [])
  const iris = useMemo(() => ({ uIris: { value: new Color(look.eyeColor) }, uPupil: { value: 0.22 } }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const eyeMat = useMemo(() => createEyeMaterial(iris), [iris])

  const shape = EYE_SHAPES[look.eyeForm]
  const lidU = useMemo(() => {
    const mk = (side: number): LidUniforms => ({
      uSkin: { value: skin },
      uShape: { value: new Vector3(shape.w, shape.up, shape.lo) },
      uShape2: { value: new Vector3(shape.tilt, shape.pow, shape.hood) },
      uOpen: { value: 1 },
      uSide: { value: side },
    })
    return [mk(-1), mk(1)]
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const lidMats = useMemo(() => lidU.map(createLidMaterial), [lidU])

  useEffect(
    () => () => {
      eyeGeo.dispose()
      shellGeo.dispose()
      eyeMat.dispose()
      lidMats.forEach((m) => m.dispose())
    },
    [eyeGeo, shellGeo, eyeMat, lidMats],
  )

  const groups = useRef<(Group | null)[]>([])
  const balls = useRef<(Mesh | null)[]>([])
  const target = useMemo(() => ({ color: new Color(look.eyeColor), shape: new Vector3(), shape2: new Vector3() }), []) // eslint-disable-line react-hooks/exhaustive-deps
  const blink = useRef({ next: 2.5, t: -1 })
  const tmp = useMemo(() => ({ p: new Vector3(), q: new Vector3(), m: { width: 0, round: 0, lips: 0 } as MorphParams, d: new Vector3() }), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    // iris colour + eye form crossfade
    target.color.set(look.eyeColor)
    iris.uIris.value.lerp(target.color, 1 - Math.exp(-dt * 7))
    const sh = EYE_SHAPES[look.eyeForm]
    target.shape.set(sh.w, sh.up, sh.lo)
    target.shape2.set(sh.tilt, sh.pow, sh.hood)

    // blink: quick close, slower open, every 3–6 s (sometimes a double blink)
    const b = blink.current
    if (b.t < 0 && t > b.next) b.t = t
    let lid = 1
    if (b.t >= 0) {
      const p = (t - b.t) / 0.24
      lid = p < 0.4 ? 1 - p / 0.4 : Math.min(1, (p - 0.4) / 0.6)
      lid = Math.max(0.02, lid)
      if (p >= 1) {
        b.t = -1
        b.next = t + (Math.random() < 0.15 ? 0.25 : 3 + Math.random() * 3)
      }
    }
    const open = (0.7 + 0.38 * look.strength.eyes) * lid
    const size = 0.9 + 0.22 * look.face.eyes

    morphParams(look.face, look.strength.face, tmp.m)
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1
      const u = lidU[i]
      easing.damp3(u.uShape.value, target.shape, 0.12, dt)
      easing.damp3(u.uShape2.value, target.shape2, 0.12, dt)
      u.uOpen.value = open
      const g = groups.current[i]
      if (g) {
        morphPoint(tmp.p.set(EYE_CENTRE.x * side, EYE_CENTRE.y, EYE_CENTRE.z), tmp.m, tmp.q)
        g.position.copy(tmp.q)
        g.scale.setScalar(size)
      }
      const ball = balls.current[i]
      if (ball && g) {
        // look at the gaze target (clamped)
        tmp.d.copy(gaze.current).sub(g.position)
        const yaw = Math.max(-0.35, Math.min(0.35, Math.atan2(tmp.d.x, tmp.d.z)))
        const pitch = Math.max(-0.25, Math.min(0.25, Math.atan2(tmp.d.y, Math.hypot(tmp.d.x, tmp.d.z))))
        easing.damp(ball.rotation, 'y', yaw, 0.08, dt)
        easing.damp(ball.rotation, 'x', -pitch, 0.08, dt)
      }
    }
  })

  return (
    <>
      {[0, 1].map((i) => (
        <group key={i} ref={(g) => void (groups.current[i] = g)}>
          <mesh ref={(m) => void (balls.current[i] = m)} geometry={eyeGeo} material={eyeMat} scale={EYE_R} />
          <mesh geometry={shellGeo} material={lidMats[i]} scale={SHELL} />
        </group>
      ))}
    </>
  )
}
