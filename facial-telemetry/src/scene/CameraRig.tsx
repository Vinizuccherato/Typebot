import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { easing } from 'maath'
import { MathUtils, Raycaster, Vector2, Vector3, type Group, type PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useFace } from '../store'
import { FEATURES, LANDMARKS, headRegistry, type FeatureId } from '../lib/face'
import { useArtboard, type ArtboardInfo } from '../layout/Artboard'
import { frontHit, PIVOT } from './anchors'

export const FOV = 28
const TAN = Math.tan(MathUtils.degToRad(FOV / 2))
const FACE_DEPTH = 0.72 // pivot → face plane

/** Where the head sits on screen and how big it is, per layout mode (CSS px). */
export function computeFraming(w: number, h: number, art: ArtboardInfo) {
  if (art.mode === 'desktop') {
    const s = art.scale
    const p = 345 * s // face ≈ 490 design px wide (1.42 units); crown ≈ y 90, chin ≈ y 900
    return { d0: h / (p * 2 * TAN) + FACE_DEPTH, ox: 30 * s, oy: 6 * s, shift: -120 * s }
  }
  const p = Math.min((0.8 * w) / 1.42, (0.56 * h) / 2.55)
  const cy = Math.min(230 + 0.28 * h, h * 0.62)
  return { d0: h / (p * 2 * TAN) + FACE_DEPTH, ox: 0, oy: cy - h / 2, shift: 0 }
}

/* Feature close-ups: azimuth / elevation (deg, in head space) and distance as a fraction of overview. */
const SHOTS: Record<FeatureId, { az: number; el: number; k: number }> = {
  forehead: { az: 10, el: 12, k: 0.78 },
  brows: { az: 16, el: 6, k: 0.7 },
  eyes: { az: 0, el: 2, k: 0.66 },
  nose: { az: 32, el: 2, k: 0.7 },
  cheekbones: { az: 42, el: 4, k: 0.78 },
  lips: { az: 14, el: -6, k: 0.66 },
  jaw: { az: 58, el: -10, k: 0.85 },
  chin: { az: 24, el: -14, k: 0.72 },
}

const AZ = MathUtils.degToRad(80)
const EL = MathUtils.degToRad(35)

/**
 * Damped orbit around the skull centre with clamped yaw/pitch/zoom, a principal-point
 * offset so the head sits in the free centre of the artboard, cinematic fly-to on
 * feature selection, and the store's reset/zoom requests.
 */
export function CameraRig({ head }: { head: RefObject<Group | null> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const controls = useRef<OrbitControlsImpl>(null)
  const art = useArtboard()
  const frame = useMemo(() => computeFraming(size.width, size.height, art), [size.width, size.height, art])
  const frameRef = useRef(frame)
  frameRef.current = frame

  const goal = useRef<{ pos: Vector3; target: Vector3 } | null>(null)
  const offset = useRef({ x: frame.ox, y: frame.oy })
  const lastInteract = useRef(-10)

  const overview = () => ({
    target: PIVOT.clone(),
    pos: PIVOT.clone().add(new Vector3(0, 0.04, frameRef.current.d0)),
  })

  const shotFor = (id: FeatureId) => {
    const lm = LANDMARKS[FEATURES[id].anchor]
    const shot = SHOTS[id]
    const side = lm.x === 0 ? 1 : Math.sign(lm.x)
    const local = frontHit(lm.x, lm.y)
    // aim between the feature and the skull centre so the close-up keeps context
    local.lerp(new Vector3(0, local.y, PIVOT.z), 0.25)
    // `head` is the pivot group; head-local coordinates live in its child, offset by −PIVOT
    const target = head.current ? head.current.localToWorld(local.clone().sub(PIVOT)) : local.clone()
    const az = MathUtils.degToRad(shot.az) * side
    const el = MathUtils.degToRad(shot.el)
    const dir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    const dist = frameRef.current.d0 * shot.k
    return { target, pos: target.clone().addScaledVector(dir, dist) }
  }

  // initial pose
  useEffect(() => {
    const o = overview()
    camera.position.copy(o.pos).add(new Vector3(0.6, 0.25, 1.2))
    goal.current = o
    controls.current?.target.copy(o.target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // relayout: keep the current view direction, re-normalise distance when idle
  useEffect(() => {
    if (!useFace.getState().selected) goal.current = overview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame.d0])

  // store requests: feature selection, reset, zoom
  useEffect(() => {
    let prev = useFace.getState()
    return useFace.subscribe((s) => {
      if (s.selected !== prev.selected) goal.current = s.selected ? shotFor(s.selected) : overview()
      if (s.view.resetNonce !== prev.view.resetNonce) goal.current = overview()
      if (s.view.zoomNonce !== prev.view.zoomNonce && controls.current) {
        const t = controls.current.target.clone()
        const off = camera.position.clone().sub(t)
        const d = MathUtils.clamp(off.length() * (s.view.zoomDir > 0 ? 0.8 : 1.25), frameRef.current.d0 * 0.32, frameRef.current.d0 * 1.5)
        goal.current = { target: t, pos: t.clone().add(off.setLength(d)) }
      }
      prev = s
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  // user interaction cancels flights
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const onStart = () => {
      goal.current = null
      lastInteract.current = performance.now() / 1000
    }
    c.addEventListener('start', onStart)
    return () => c.removeEventListener('start', onStart)
  }, [])

  // double-click on empty space → reset
  useEffect(() => {
    const el = gl.domElement
    const ray = new Raycaster()
    const ndc = new Vector2()
    const onDbl = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const m = headRegistry.mesh
      if (m && ray.intersectObject(m, false).length) return
      useFace.getState().resetView()
    }
    el.addEventListener('dblclick', onDbl)
    return () => el.removeEventListener('dblclick', onDbl)
  }, [gl, camera])

  // cursor follows the active tool
  const tool = useFace((s) => s.tool)
  useEffect(() => {
    gl.domElement.style.cursor = tool === 'rotate' ? 'grab' : ''
  }, [tool, gl])

  useFrame((state, dt) => {
    const c = controls.current
    if (!c) return
    const f = frameRef.current
    const s = useFace.getState()

    // principal-point offset (head in the free centre; slides left when the inspector opens)
    easing.damp(offset.current, 'x', f.ox + (s.selected ? f.shift : 0), 0.45, dt)
    easing.damp(offset.current, 'y', f.oy, 0.45, dt)
    camera.setViewOffset(size.width, size.height, -offset.current.x, -offset.current.y, size.width, size.height)

    c.minDistance = f.d0 * 0.3
    c.maxDistance = f.d0 * 1.6

    if (goal.current) {
      easing.damp3(camera.position, goal.current.pos, 0.42, dt)
      easing.damp3(c.target, goal.current.target, 0.42, dt)
      if (camera.position.distanceToSquared(goal.current.pos) < 1e-6 && c.target.distanceToSquared(goal.current.target) < 1e-6) goal.current = null
    }
    c.update()

    // head idle sway / showcase turntable
    const g = head.current
    if (g) {
      const t = state.clock.elapsedTime
      const idle = t - lastInteract.current > 3 && !s.selected
      const yaw = s.autoRotate ? Math.sin(t * 0.35) * 1.0 : idle ? Math.sin(t * 0.25) * 0.07 : 0
      const pitch = idle && !s.autoRotate ? Math.sin(t * 0.19) * 0.025 : 0
      easing.damp(g.rotation, 'y', yaw, 0.8, dt)
      easing.damp(g.rotation, 'x', pitch, 0.8, dt)
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      minAzimuthAngle={-AZ}
      maxAzimuthAngle={AZ}
      minPolarAngle={Math.PI / 2 - EL}
      maxPolarAngle={Math.PI / 2 + EL}
    />
  )
}
