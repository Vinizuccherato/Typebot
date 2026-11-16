import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace, type PerspectiveCamera } from 'three'
import { easing } from 'maath'
import { useFacet, type Look } from '../store'
import { FaceModel, type Pose } from './face/FaceModel'
import { Mark } from './face/Mark'

/* CONTRACT (screens use this): a DOM element that shows a live 3D viewport. */
export interface FaceViewProps {
  className?: string
  /** 'mark' = the splash brand crystal; the rest show the face model */
  subject: 'mark' | 'face'
  /** surface treatment of the face */
  material?: 'hologram' | 'thermal' | 'skin'
  /** 0–100 scan sweep / reveal progress (hologram & thermal) */
  scan?: number
  landmarks?: boolean
  overlays?: { thirds?: boolean; golden?: boolean; symmetry?: boolean; measure?: 'brows' | 'eyes' | 'nose' | 'lips' | 'jaw' | null }
  /** brows + glasses + hair colour from this look (defaults to the store look) */
  look?: Look
  accessories?: boolean
  autoRotate?: boolean
  /** drag to rotate, pinch/wheel to zoom */
  interactive?: boolean
  framing?: 'head' | 'bust' | 'face' | 'eyes'
}

/*
  Implementation note — one canvas per view (not one shared canvas + drei <View>):
  the screens paint opaque backgrounds and float glass UI over the face, so a shared
  canvas would have to sit ON TOP of the DOM and would cover that UI. Each FaceView
  therefore owns a small canvas that lives in the DOM flow (it zooms, scrolls and
  slides with its screen), while the expensive part is shared: the head/body/hair
  geometry is meshed ONCE in a worker and the same BufferGeometry is uploaded to
  every context. Canvases mount only when near the viewport and freeze when hidden,
  so the board never holds more contexts than it shows.
*/

const isSoftware = () => typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

/** framing → (centre y, fit height, fit width) in head-local units */
const FRAMES = {
  head: { cy: -0.02, h: 3.25, w: 3.3 },
  face: { cy: -0.24, h: 2.25, w: 2.05 },
  eyes: { cy: 0.04, h: 0.95, w: 1.75 },
  bust: { cy: -1.35, h: 5.6, w: 4.8 },
  mark: { cy: -0.25, h: 3.0, w: 3.0 },
} as const

function CameraRig({ framing, pose }: { framing: keyof typeof FRAMES; pose: React.MutableRefObject<Pose> }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const target = useRef({ cy: FRAMES[framing].cy, d: 10 })
  useFrame((_, dt) => {
    const f = FRAMES[framing]
    const t = Math.tan((camera.fov * Math.PI) / 360)
    const aspect = size.width / Math.max(1, size.height)
    const d = Math.max(f.h / (2 * t), f.w / (2 * t * aspect)) / pose.current.zoom
    easing.damp(target.current, 'cy', f.cy, 0.35, dt)
    easing.damp(target.current, 'd', d, 0.3, dt)
    camera.position.set(0, target.current.cy + 0.05, target.current.d)
    camera.lookAt(0, target.current.cy, 0)
  })
  return null
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#e9e2ff', '#2a1f33', 0.45]} />
      {/* champagne key from the right, lilac rim from the left-back, soft frontal fill */}
      <directionalLight position={[3.8, 2.6, 3.6]} intensity={2.2} color="#ffe6cf" />
      <directionalLight position={[-4.5, 1.8, -1.5]} intensity={1.6} color="#c3b4ff" />
      <directionalLight position={[-1.2, 0.5, 4]} intensity={0.55} color="#f1ecff" />
      <Suspense fallback={null}>
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={1.4} color="#ffe9d6" position={[3, 1.5, 4]} scale={[3, 2.4, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#b9a6ff" position={[-4.5, 0.5, 1]} rotation-y={Math.PI / 2.4} scale={[2.6, 4.5, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffffff" position={[0, 4, 2]} rotation-x={Math.PI / 2} scale={[5, 3, 1]} />
          <Lightformer form="ring" intensity={1.8} color="#ffffff" position={[1.4, 1.6, 5]} scale={0.6} />
        </Environment>
      </Suspense>
    </>
  )
}

export function FaceView({ className, subject, framing, interactive, look: lookProp, ...rest }: FaceViewProps) {
  const host = useRef<HTMLDivElement>(null)
  const storeLook = useFacet((s) => s.look)
  const look = lookProp ?? storeLook
  const pose = useRef<Pose>({ yaw: 0, pitch: 0, zoom: 1, dragging: false })
  const [near, setNear] = useState(false) // mount the canvas
  const [visible, setVisible] = useState(false) // run the frame loop
  const [k, setK] = useState(1) // CSS zoom/scale of the host (visual px per layout px)
  const soft = useMemo(isSoftware, [])
  const [degraded, setDegraded] = useState(false)

  // visibility: mount when within 300px of the viewport, freeze when out of view
  useEffect(() => {
    const el = host.current
    if (!el) return
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '300px' })
    const vis = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 })
    near.observe(el)
    vis.observe(el)
    return () => (near.disconnect(), vis.disconnect())
  }, [])

  // render resolution follows the visual size, not the layout size (screens are CSS-zoomed)
  useLayoutEffect(() => {
    const el = host.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (el.offsetWidth) setK(Math.max(0.5, Math.min(2.5, r.width / el.offsetWidth)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => (ro.disconnect(), window.removeEventListener('resize', measure))
  }, [])

  // drag to rotate (springs back), wheel / pinch to zoom — this view only
  useEffect(() => {
    const el = host.current
    if (!el || !interactive) return
    const pts = new Map<number, { x: number; y: number }>()
    let pinch0 = 0
    let zoom0 = 1
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId)
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      pose.current.dragging = true
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]
        pinch0 = Math.hypot(a.x - b.x, a.y - b.y)
        zoom0 = pose.current.zoom
      }
    }
    const move = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId)
      if (!prev) return
      const w = el.getBoundingClientRect().width || 300
      if (pts.size === 1) {
        const P = pose.current
        P.yaw = Math.max(-1.05, Math.min(1.05, P.yaw + ((e.clientX - prev.x) / w) * 2.6))
        P.pitch = Math.max(-0.35, Math.min(0.35, P.pitch - ((e.clientY - prev.y) / w) * 1.4))
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()]
        pose.current.zoom = Math.max(0.75, Math.min(1.9, zoom0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch0)))
      }
    }
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId)
      if (pts.size === 0) {
        pose.current.dragging = false
        // spring back to the front
        pose.current.yaw = 0
        pose.current.pitch = 0
      }
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      pose.current.zoom = Math.max(0.75, Math.min(1.9, pose.current.zoom * Math.exp(-e.deltaY * 0.0015)))
    }
    const dbl = () => (pose.current.zoom = 1)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('dblclick', dbl)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('dblclick', dbl)
    }
  }, [interactive])

  const base = soft ? 1 : Math.min(2, window.devicePixelRatio || 1)
  const floor = base >= 2 ? 1.5 : 1
  const dpr = Math.min(3, (degraded ? floor : base) * k)
  const frame = subject === 'mark' ? 'mark' : (framing ?? 'head')

  return (
    <div
      ref={host}
      className={className}
      data-wheel={interactive ? '' : undefined}
      style={{ position: 'relative', overflow: 'hidden', touchAction: interactive ? 'none' : undefined, cursor: interactive ? 'grab' : undefined }}
      role="img"
      aria-label={subject === 'mark' ? 'facet. brand crystal' : `3D face — ${rest.material ?? 'skin'}${interactive ? ', drag to rotate, scroll to zoom' : ''}`}
    >
      {near && (
        <Canvas
          dpr={dpr}
          frameloop={visible ? 'always' : 'never'}
          resize={{ offsetSize: true }}
          gl={{ alpha: true, antialias: !soft, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.0, outputColorSpace: SRGBColorSpace, powerPreference: 'high-performance' }}
          camera={{ fov: 22, position: [0, 0, 10], near: 0.1, far: 60 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <PerformanceMonitor onDecline={() => setDegraded(true)} />
          <CameraRig framing={frame} pose={pose} />
          <Lights />
          {subject === 'mark' ? <Mark /> : <FaceModel {...rest} look={look} pose={pose} />}
        </Canvas>
      )}
    </div>
  )
}
