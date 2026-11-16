import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import { easing } from 'maath'
import { useArtboard } from '../layout/Artboard'
import { useStudio, type NavId, type RegionId } from '../store'
import { headTurn } from './interaction'

/* Orthographic-feeling portrait camera that pins the avatar to the layout:
   head-local point (0, focusY, 0) is projected to a design-px anchor via a view offset,
   at a fixed pixels-per-unit scale — so the head sits exactly where the reference has it
   (crown ≈ y 190, chin ≈ y 600, centre x ≈ 715) at any viewport size. */

const FOV = 18
const PPU = 174.5 // design px per head unit at zoom 1
const ANCHOR = { x: 715, y: 382 } // where the nasion sits in design px

const FOCUS_REGION: Record<RegionId, { k: number; y: number }> = {
  face: { k: 1, y: 0 },
  eyes: { k: 1.26, y: 0.07 },
  brows: { k: 1.26, y: 0.12 },
  accessories: { k: 1.14, y: 0.0 },
}
const FOCUS_NAV: Record<Exclude<NavId, 'head'>, { k: number; y: number }> = {
  body: { k: 0.64, y: -0.95 },
  outfit: { k: 0.56, y: -1.75 },
}

const MAX_YAW = (35 * Math.PI) / 180
const MAX_PITCH = (15 * Math.PI) / 180

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const { mode, scale } = useArtboard()
  const nav = useStudio((s) => s.nav)
  const region = useStudio((s) => s.region)
  const zoom = useStudio((s) => s.zoom)
  const resetNonce = useStudio((s) => s.resetNonce)

  const cur = useRef({ k: 1, y: 0 })
  const user = useRef({ zoom: 1 })

  useEffect(() => {
    camera.fov = FOV
    camera.updateProjectionMatrix()
  }, [camera])

  // reset: user zoom + head turn back to neutral
  useEffect(() => {
    if (!resetNonce) return
    user.current.zoom = 1
    headTurn.yaw = 0
    headTurn.pitch = 0
  }, [resetNonce])

  // drag to turn the head; wheel / pinch to zoom (desktop)
  useEffect(() => {
    const el = gl.domElement
    const pts = new Map<number, { x: number; y: number }>()
    let pinch = 0
    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 1) headTurn.dragging = true
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId)
      if (!prev) return
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) user.current.zoom = Math.min(1.8, Math.max(0.8, user.current.zoom * (d / pinch)))
        pinch = d
        return
      }
      headTurn.yaw = Math.max(-MAX_YAW, Math.min(MAX_YAW, headTurn.yaw + dx * 0.0065))
      headTurn.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, headTurn.pitch - dy * 0.0045))
    }
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      if (pts.size === 0) {
        headTurn.dragging = false
        el.style.cursor = 'grab'
      }
    }
    const wheel = (e: WheelEvent) => {
      if (mode === 'compact' && !e.ctrlKey) return // let the page scroll on phones
      e.preventDefault()
      user.current.zoom = Math.min(1.8, Math.max(0.8, user.current.zoom * Math.exp(-e.deltaY * 0.0015)))
    }
    el.style.cursor = 'grab'
    el.style.touchAction = mode === 'compact' ? 'pan-y' : 'none'
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl, mode])

  useFrame((_, dt) => {
    // the head springs back to neutral once released
    if (!headTurn.dragging) {
      const k = 1 - Math.exp(-dt * 3.2)
      headTurn.yaw += (0 - headTurn.yaw) * k
      headTurn.pitch += (0 - headTurn.pitch) * k
    }

    const f = nav === 'head' ? FOCUS_REGION[region] : FOCUS_NAV[nav]
    easing.damp(cur.current, 'k', f.k * zoom * user.current.zoom, 0.35, dt)
    easing.damp(cur.current, 'y', f.y, 0.35, dt)

    const vw = size.width
    const vh = size.height
    let ppu: number
    let ax: number
    let ay: number
    if (mode === 'desktop') {
      ppu = PPU * scale
      ax = ANCHOR.x * scale
      ay = ANCHOR.y * scale
    } else {
      // compact: head centred in the top half of the viewport
      const hero = vh * 0.5
      ppu = Math.min((hero * 0.62) / 2.35, (vw * 0.62) / 1.5)
      ax = vw / 2
      ay = hero * 0.47
    }
    ppu *= cur.current.k
    const t = Math.tan((FOV * Math.PI) / 360)
    const dist = vh / (ppu * 2 * t)
    camera.position.set(0, cur.current.y, dist)
    camera.rotation.set(0, 0, 0)
    camera.near = 0.1
    camera.far = dist + 20
    camera.aspect = vw / vh
    camera.setViewOffset(vw, vh, -(ax - vw / 2), -(ay - vh / 2), vw, vh)
    camera.updateProjectionMatrix()
  })

  return null
}
