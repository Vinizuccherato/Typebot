import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Vector3, type Group, type Material } from 'three'
import { easing } from 'maath'
import { useAvatarGeometry } from '../geo/useAvatarGeometry'
import { createHairMaterial, createSkinMaterial } from './materials'
import { createFxEye, createFxUniforms, createHologram, createThermal, scanY, SCAN_BOTTOM } from './fx'
import { Eyes } from './Eyes'
import { Landmarks } from './Landmarks'
import { Overlays } from './Overlays'
import { Brows } from '../acc/Brows'
import { Glasses } from '../acc/Glasses'
import type { FaceViewProps } from '../FaceView'
import type { Look } from '../../store'

/* ──────────────────────────────────────────────────────────────
   The facet. face: our stylized adult avatar (head + eyes + hair + tee)
   in one of three surface treatments, plus brows/glasses, landmark nodes
   and proportion overlays — all in head-local space (1 unit = 10 cm,
   origin = nasion, +Z toward the viewer) so they turn with the head.
   ────────────────────────────────────────────────────────────── */

export interface Pose {
  yaw: number
  pitch: number
  zoom: number
  dragging: boolean
}

const SKIN = '#f0c8b2'
/** rotation pivot ≈ centre of the skull */
const PIVOT = new Vector3(0, -0.25, -0.55)

interface Props extends Omit<FaceViewProps, 'className' | 'subject' | 'framing' | 'interactive'> {
  look: Look
  pose: React.MutableRefObject<Pose>
}

export function FaceModel({ material = 'skin', scan, landmarks, overlays, look, accessories, autoRotate, pose }: Props) {
  const geo = useAvatarGeometry()
  const camera = useThree((s) => s.camera)

  // skin / hair (shared uniforms per canvas)
  const shared = useMemo(() => ({ uMorph: { value: new Vector3() }, uSkin: { value: new Color(SKIN) }, uShirt: { value: new Color('#f4f2ee') } }), [])
  const hairU = useMemo(
    () => ({ uMorph: shared.uMorph, uKeyView: { value: new Vector3() }, uHair: { value: new Color(look.hairColor) }, uBend: { value: new Vector3() }, uPivot: { value: new Vector3(0, -1.3, -0.86) } }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const fxU = useMemo(createFxUniforms, [])
  const mats = useMemo(() => {
    if (material === 'skin') return { head: createSkinMaterial('head', shared), body: createSkinMaterial('body', shared), hair: createHairMaterial(hairU) as Material, eye: null }
    const make = material === 'thermal' ? createThermal : createHologram
    return { head: make(fxU, 0), body: make(fxU, 0.1), hair: make(fxU, 0.65), eye: createFxEye(material, fxU) }
  }, [material, shared, hairU, fxU])
  useEffect(() => () => Object.values(mats).forEach((m) => m?.dispose()), [mats])

  const outer = useRef<Group>(null)
  const gaze = useRef(new Vector3(0, 0, 12))
  const keyWorld = useMemo(() => new Vector3(0.55, 0.5, 1).normalize(), [])
  const hairTarget = useMemo(() => new Color(), [])
  const born = useRef(-1)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (born.current < 0) born.current = t
    const age = t - born.current
    // fx uniforms
    fxU.uTime.value = t
    fxU.uReveal.value = Math.min(1, age / 0.9)
    const target = scan === undefined ? SCAN_BOTTOM - 1 : scanY(scan)
    easing.damp(fxU.uScanY, 'value', target, 0.12, dt)
    easing.damp(fxU.uSweep, 'value', scan !== undefined && scan < 100 ? 1 : 0, 0.25, dt)
    const beat = (t * 62) / 60
    fxU.uPulse.value = Math.exp(-Math.pow((beat - Math.floor(beat) - 0.15) / 0.08, 2))
    // skin/hair
    easing.dampC(hairU.uHair.value, hairTarget.set(look.hairColor), 0.2, dt)
    hairU.uKeyView.value.copy(keyWorld).transformDirection(camera.matrixWorldInverse)

    // pose: user drag + idle life + optional turntable
    const P = pose.current
    const idleYaw = P.dragging ? 0 : Math.sin(t * 0.35) * 0.06 + state.pointer.x * 0.1
    const idlePitch = P.dragging ? 0 : Math.sin(t * 0.27 + 1) * 0.02 - state.pointer.y * 0.05
    const turntable = autoRotate && !P.dragging ? Math.sin(t * 0.32) * 0.62 : 0
    if (outer.current) {
      easing.damp(outer.current.rotation, 'y', P.yaw + idleYaw + turntable, P.dragging ? 0.05 : 0.25, dt)
      easing.damp(outer.current.rotation, 'x', -(P.pitch + idlePitch), P.dragging ? 0.05 : 0.25, dt)
    }
    gaze.current.set(state.pointer.x * 5, state.pointer.y * 3, 12)
  })

  if (!geo) return null
  return (
    <group ref={outer} position={PIVOT}>
      <group position={[-PIVOT.x, -PIVOT.y, -PIVOT.z]}>
        <mesh geometry={geo.body} material={mats.body} renderOrder={1} />
        <mesh geometry={geo.head} material={mats.head} renderOrder={2} />
        <Eyes eyeColor={look.eyeColor} skin={shared.uSkin.value} gaze={gaze} override={mats.eye} />
        <mesh geometry={geo.hair} material={mats.hair} renderOrder={material === 'hologram' ? 0 : 3} />
        {accessories && (
          <>
            <Brows form={look.browForm} color={look.browColor} strength={0.6} faded={material !== 'skin'} />
            <Glasses style={look.glasses} weight={0.5} faded={material !== 'skin'} />
          </>
        )}
        {landmarks && <Landmarks scan={scan} />}
        {overlays && <Overlays overlays={overlays} />}
      </group>
    </group>
  )
}
