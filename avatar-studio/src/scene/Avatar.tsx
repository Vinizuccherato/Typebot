import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Vector3, type Group, type Mesh } from 'three'
import { easing } from 'maath'
import { useRenderedLook, useStudio } from '../store'
import { avatarRegistry } from '../lib/avatar'
import { AccessoryLayer } from '../accessories/AccessoryLayer'
import { useAvatarGeometry } from './useAvatarGeometry'
import { createHairMaterial, createSkinMaterial } from './materials'
import { morphParams, morphPoint } from './morph'
import { Eyes } from './Eyes'
import { headTurn } from './interaction'

/* The avatar: head (live-morphed), eyes, hair, neck + tee. The head group pivots at the
   neck so drags, pointer-follow and idle sway turn the head naturally; accessories live
   inside the same head-local group. */

const SKIN = '#ecc3ad'
const HAIR = '#7b5639'
const PIVOT = new Vector3(0, -1.15, -0.85)
const MP = { width: 0, round: 0, lips: 0 }

export function Avatar() {
  const geo = useAvatarGeometry()
  const look = useRenderedLook()
  const camera = useThree((s) => s.camera)

  const shared = useMemo(
    () => ({
      uMorph: { value: new Vector3() },
      uSkin: { value: new Color(SKIN) },
      uShirt: { value: new Color(look.shirt) },
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const hairU = useMemo(() => ({ uMorph: shared.uMorph, uKeyView: { value: new Vector3() }, uHair: { value: new Color(HAIR) } }), [shared])
  const mats = useMemo(
    () => ({ head: createSkinMaterial('head', shared), body: createSkinMaterial('body', shared), hair: createHairMaterial(hairU) }),
    [shared, hairU],
  )
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  const headMesh = useRef<Mesh>(null)
  // publish the undeformed head + the CPU morph for the accessories layer
  useEffect(() => {
    if (!geo || !headMesh.current) return
    avatarRegistry.mesh = headMesh.current
    avatarRegistry.morph = (p, face, out) => {
      const s = useStudio.getState()
      const strength = (s.comparing ? s.saved : s.look).strength.face
      return morphPoint(p, morphParams(face, strength), out)
    }
    avatarRegistry.version++
    return () => {
      avatarRegistry.mesh = null
      avatarRegistry.version++
    }
  }, [geo])

  const pivot = useRef<Group>(null)
  const body = useRef<Group>(null)
  const gaze = useRef(new Vector3(0, 0, 3))
  const shirt = useMemo(() => new Color(), [])
  const morphTarget = useMemo(() => new Vector3(), [])
  const keyWorld = useMemo(() => new Vector3(-0.55, 0.55, 1).normalize(), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    // live face form (damped so slider drags feel physical)
    const m = morphParams(look.face, look.strength.face, MP)
    morphTarget.set(m.width, m.round, m.lips)
    easing.damp3(shared.uMorph.value, morphTarget, 0.08, dt)
    easing.dampC(shared.uShirt.value, shirt.set(look.shirt), 0.15, dt)
    hairU.uKeyView.value.copy(keyWorld).transformDirection(camera.matrixWorldInverse)

    // head turn = user drag + pointer follow + idle sway
    const p = state.pointer
    const h = headTurn
    const yaw = h.yaw + (h.dragging ? 0 : p.x * 0.12) + Math.sin(t * 0.37) * 0.025
    const pitch = h.pitch + (h.dragging ? 0 : -p.y * 0.06) + Math.sin(t * 0.29 + 1) * 0.015
    if (pivot.current) {
      easing.damp(pivot.current.rotation, 'y', yaw, 0.18, dt)
      easing.damp(pivot.current.rotation, 'x', -pitch, 0.18, dt)
      pivot.current.rotation.z = Math.sin(t * 0.23) * 0.008
    }
    // breathing
    if (body.current) body.current.scale.set(1 + Math.sin(t * 1.3) * 0.004, 1 + Math.sin(t * 1.3) * 0.006, 1)
    // eyes follow the pointer, a little ahead of the head
    gaze.current.set(p.x * 1.6, p.y * 0.9 - 0.04, 3)
  })

  if (!geo) return null
  return (
    <group>
      <group ref={body}>
        <mesh geometry={geo.body} material={mats.body} />
      </group>
      <group ref={pivot} position={PIVOT}>
        <group position={[-PIVOT.x, -PIVOT.y, -PIVOT.z]}>
          <mesh ref={headMesh} geometry={geo.head} material={mats.head} />
          <Eyes look={look} skin={shared.uSkin.value} gaze={gaze} />
          <mesh geometry={geo.hair} material={mats.hair} />
          <AccessoryLayer />
        </group>
      </group>
    </group>
  )
}
