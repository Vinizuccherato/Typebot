import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import CameraControlsImpl from 'camera-controls'
import { useDomus, type FocusId } from '../store'
import { useArtboard } from '../layout/Artboard'
import { prefersReducedMotion } from '../lib/utils'
import { ARRAY_CENTER, DOOR, PAV } from './layout'
import { isSoftwareRenderer } from './gpu'

const { ACTION } = CameraControlsImpl

interface View {
  target: [number, number, number]
  az: number // radians around +y, 0 = looking from +z
  polar: number // radians from +y
  k: number // distance multiplier of the fitted overview distance
}

/** Camera "shots". Overview reproduces the reference: elevated 3/4 from the front-right. */
const VIEWS: Record<FocusId, View> = {
  overview: { target: [-0.4, 3.4, -0.8], az: 0.98, polar: 1.22, k: 1 },
  solar: { target: [ARRAY_CENTER[0], ARRAY_CENTER[1], ARRAY_CENTER[2]], az: 0.45, polar: 0.72, k: 0.6 },
  'main-hall': { target: [-5.6, 2.5, 1.2], az: 0.42, polar: 1.2, k: 0.46 },
  'front-door': { target: [(DOOR.x0 + DOOR.x1) / 2, 2.2, PAV.z1 + 0.6], az: 0.3, polar: 1.3, k: 0.4 },
}

const spherical = (v: View, dist: number) => {
  const [tx, ty, tz] = v.target
  const s = Math.sin(v.polar)
  return [tx + dist * s * Math.sin(v.az), ty + dist * Math.cos(v.polar), tz + dist * s * Math.cos(v.az)] as const
}

/**
 * Framing — distance/fov/principal-point so the house lands where the
 * reference puts it (≈53% x / 36% y on desktop) and in the hero window on
 * compact layouts.
 */
function useFraming() {
  const size = useThree((s) => s.size)
  const { mode } = useArtboard()
  return useMemo(() => {
    const aspect = size.width / Math.max(1, size.height)
    if (mode === 'compact') {
      const fov = 34
      // fit ~27 m of house across 96% of the width
      const halfH = Math.tan(THREE.MathUtils.degToRad(fov / 2))
      const dist = 27 / (0.96 * 2 * halfH * aspect)
      return { fov, dist: Math.max(46, dist), ox: 0.5, oy: aspect < 0.8 ? 0.33 : 0.4 }
    }
    const fov = 28
    const ref = 16 / 9
    // keep the house width constant relative to the artboard on narrower screens
    const dist = 60 * Math.max(1, Math.pow(ref / aspect, 0.85))
    return { fov, dist, ox: 0.535, oy: 0.37 }
  }, [size.width, size.height, mode])
}

export function CameraRig() {
  const controls = useRef<CameraControlsImpl>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const { mode } = useArtboard()
  const focus = useDomus((s) => s.focus)
  const framing = useFraming()
  const first = useRef(true)
  const dragging = useRef(false)
  const pointer = useRef({ x: 0, y: 0 })
  const applied = useRef({ az: 0, polar: 0 })
  const reduced = useMemo(() => prefersReducedMotion() || isSoftwareRenderer(gl), [gl])

  /* principal-point shift + fov */
  useLayoutEffect(() => {
    camera.fov = framing.fov
    const w = size.width
    const h = size.height
    camera.setViewOffset(w, h, w * (0.5 - framing.ox), h * (0.5 - framing.oy), w, h)
    camera.updateProjectionMatrix()
    // fog scales with the shot distance so trees always dissolve the same way
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = framing.dist * 0.95
      scene.fog.far = framing.dist * 2.5
    }
  }, [camera, size.width, size.height, framing, scene])

  /* controls configuration */
  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.smoothTime = 0.7
    c.draggingSmoothTime = 0.14
    c.azimuthRotateSpeed = 0.55
    c.polarRotateSpeed = 0.5
    c.dollySpeed = 0.6
    c.dollyToCursor = false
    c.mouseButtons.left = ACTION.ROTATE
    c.mouseButtons.right = ACTION.NONE
    c.mouseButtons.middle = ACTION.NONE
    c.mouseButtons.wheel = ACTION.DOLLY
    c.touches.one = mode === 'compact' ? ACTION.NONE : ACTION.TOUCH_ROTATE
    c.touches.two = mode === 'compact' ? ACTION.NONE : ACTION.TOUCH_DOLLY
    c.touches.three = ACTION.NONE
    c.minPolarAngle = 0.5
    c.maxPolarAngle = 1.38
    c.minAzimuthAngle = -0.45
    c.maxAzimuthAngle = 1.55
    c.minDistance = framing.dist * 0.3
    c.maxDistance = framing.dist * 1.35
    // compact: let vertical page scroll pass through the canvas
    if (mode === 'compact') gl.domElement.style.touchAction = 'pan-y'
  }, [mode, framing.dist, gl])

  /* fly to the focused shot (cinematic intro on first mount) */
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const v = VIEWS[focus]
    const dist = framing.dist * v.k
    const [px, py, pz] = spherical(v, dist)
    applied.current = { az: 0, polar: 0 }
    if (first.current) {
      first.current = false
      const intro = { ...v, az: v.az + 0.42, polar: v.polar - 0.18 }
      const [ix, iy, iz] = spherical(intro, dist * 1.28)
      c.setLookAt(ix, iy, iz, ...v.target, false)
      if (reduced) {
        c.setLookAt(px, py, pz, ...v.target, false)
      } else {
        c.smoothTime = 1.35
        c.setLookAt(px, py, pz, ...v.target, true)
        window.setTimeout(() => {
          if (controls.current) controls.current.smoothTime = 0.7
        }, 2400)
      }
      return
    }
    c.setLookAt(px, py, pz, ...v.target, true)
  }, [focus, framing.dist, reduced])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const c = controls.current
      console.log('[scene]', JSON.stringify({ pos: camera.position.toArray().map((v) => +v.toFixed(2)), az: c?.azimuthAngle, polar: c?.polarAngle, dist: c?.distance, fd: framing.dist, view: camera.view }))
    }, 6000)
    return () => window.clearTimeout(id)
  }, [camera, framing])

  /* pointer parallax source (window-level: the UI covers most of the canvas) */
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* Esc / double-click → overview */
  useEffect(() => {
    const toOverview = () => {
      const s = useDomus.getState()
      if (s.focus !== 'overview') s.setFocus('overview')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      const s = useDomus.getState()
      if (s.paletteOpen || s.assistantOpen) return
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      toOverview()
    }
    const el = gl.domElement
    window.addEventListener('keydown', onKey)
    el.addEventListener('dblclick', toOverview)
    return () => {
      window.removeEventListener('keydown', onKey)
      el.removeEventListener('dblclick', toOverview)
    }
  }, [gl])

  /* idle drift + parallax as small relative rotations (composes with user orbit) */
  useFrame((state, dt) => {
    const c = controls.current
    if (!c || reduced || dragging.current) return
    const t = state.clock.elapsedTime
    const wantAz = -pointer.current.x * 0.05 + Math.sin(t * 0.21) * 0.03
    const wantPolar = -pointer.current.y * 0.022 + Math.sin(t * 0.17 + 1.3) * 0.008
    const k = 1 - Math.exp(-dt * 2.2)
    const dAz = (wantAz - applied.current.az) * k
    const dPolar = (wantPolar - applied.current.polar) * k
    if (Math.abs(dAz) + Math.abs(dPolar) < 1e-6) return
    applied.current.az += dAz
    applied.current.polar += dPolar
    // `true` = add to the destination, so in-flight fly-tos keep easing
    c.rotate(dAz, dPolar, true)
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      onStart={() => (dragging.current = true)}
      onEnd={() => {
        dragging.current = false
        applied.current = { az: 0, polar: 0 }
      }}
    />
  )
}
