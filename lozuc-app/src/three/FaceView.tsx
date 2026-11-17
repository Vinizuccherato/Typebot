import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace, type PerspectiveCamera } from 'three'
import { easing } from 'maath'
import { CURRENT_STYLE, READING, type RegionId, type StyleSpec } from '../store'
import { HeadModel, type Pose, type RegionLayer } from './face/HeadModel'
import { Mark } from './face/Mark'
import { PRIORITY_COLOR, REGION_IDS } from './face/regions'
import { NEAR, register, viewportDistance } from './budget'
import { preloadHead } from './geo/useHeadGeometry'

/* CONTRACT (3D agent owns the implementation). A live 3D viewport of the client's
   head (male, anonymous, procedural) or the brand mark. Used on almost every screen. */
export interface FaceViewProps {
  className?: string
  /** 'mark' = lozuc brand object; 'face' = the client's head */
  subject: 'mark' | 'face'
  /** 'skin' = natural render; 'scan' = sage hologram (capture/processing); 'map' = matte clay-like render for the region map */
  material?: 'skin' | 'scan' | 'map'
  /** 0–100 reveal / sweep progress for 'scan' */
  scan?: number
  /** hair, beard, brows and tones to render (defaults to CURRENT_STYLE) */
  style?: StyleSpec
  /** standardized capture pose */
  pose?: 'front' | 'profile' | 'threeQuarter'
  /** LZ-01 region map: show hotspots, highlight the active region, report clicks */
  regions?: { show: boolean; active?: RegionId | null; onSelect?: (id: RegionId) => void; priorities?: Partial<Record<RegionId, 'alta' | 'media' | 'baixa' | null>> }
  landmarks?: boolean
  autoRotate?: boolean
  /** drag to rotate, wheel/pinch to zoom */
  interactive?: boolean
  framing?: 'head' | 'face' | 'bust' | 'hair' | 'beard' | 'brows'
}

/*
  One small canvas per view (screens float glass UI over the face, so a shared
  overlay canvas would cover it). The expensive part is shared: geometry is
  meshed once in a worker and the same BufferGeometry is uploaded to every
  context. A page-wide budget (budget.ts) keeps ≤ 8 contexts alive: views mount
  near the viewport and unmount (context released) when far or out-ranked,
  leaving a static placeholder.
*/

const isSoftware = () => typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

/** framing → (centre y, fit height, fit width) in head-local units (1 = 10 cm, origin = nasion) */
const FRAMES = {
  head: { cy: -0.08, h: 3.3, w: 3.3 },
  face: { cy: -0.3, h: 2.15, w: 2.0 },
  bust: { cy: -1.15, h: 5.2, w: 5.0 },
  hair: { cy: 0.45, h: 2.5, w: 3.0 }, // whole hair mass incl. sides and fringe
  beard: { cy: -0.78, h: 1.8, w: 2.2 }, // nose to neckline, both cheeks
  brows: { cy: 0.08, h: 1.0, w: 1.9 }, // both brows + eyes for context
  mark: { cy: 0, h: 2.7, w: 2.7 },
} as const

const NAME = Object.fromEntries(READING.map((r) => [r.id, r.name])) as Record<RegionId, string>

/** how far the face centre swings sideways at each preset yaw (pivot behind the face) */
const POSE_X = { front: 0, threeQuarter: 0.6, profile: 0.85 } as const

function CameraRig({ framing, pose, preset }: { framing: keyof typeof FRAMES; pose: React.MutableRefObject<Pose>; preset?: keyof typeof POSE_X }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  const cur = useRef<{ cx: number; cy: number; d: number } | null>(null)
  useFrame((_, dt) => {
    const f = FRAMES[framing]
    const t = Math.tan((camera.fov * Math.PI) / 360)
    const aspect = size.width / Math.max(1, size.height)
    const d = Math.max(f.h / (2 * t), f.w / (2 * t * aspect)) / pose.current.zoom
    // close framings follow the face when the preset turns it (no cheek-cropped thumbnails)
    const close = framing === 'face' || framing === 'beard' || framing === 'brows' ? 1 : framing === 'hair' ? 0.55 : framing === 'head' ? 0.2 : 0
    const cx = POSE_X[preset ?? 'front'] * close
    if (!cur.current) cur.current = { cx, cy: f.cy, d }
    easing.damp(cur.current, 'cx', cx, 0.35, dt)
    easing.damp(cur.current, 'cy', f.cy, 0.35, dt)
    easing.damp(cur.current, 'd', d, 0.3, dt)
    camera.position.set(cur.current.cx, cur.current.cy + 0.04, cur.current.d)
    camera.lookAt(cur.current.cx, cur.current.cy, 0)
  })
  return null
}

function Lights({ mark }: { mark: boolean }) {
  return (
    <>
      <hemisphereLight args={['#f1f0ea', '#3a302a', 0.55]} />
      {/* sculpture studio: soft warm key from the upper left, cool sage rim from behind right, mist fill, warm bounce */}
      <directionalLight position={[-3.4, 3.2, 3.6]} intensity={1.75} color="#fff1e6" />
      <directionalLight position={[4.2, 1.8, -2.6]} intensity={1.6} color="#a9c7b6" />
      <directionalLight position={[2.2, 0.6, 4]} intensity={0.55} color="#e3ece6" />
      <directionalLight position={[0, -3.5, 2.2]} intensity={0.32} color="#e9cdb8" />
      <Suspense fallback={null}>
        <Environment resolution={64} frames={1}>
          <Lightformer form="rect" intensity={1.3} color="#fff0e2" position={[-3, 1.5, 4]} scale={[3, 2.4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#a9c7b6" position={[4.5, 0.5, 0]} rotation-y={-Math.PI / 2.4} scale={[2.6, 4.5, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#d8b97e" position={[0, 4, 1]} rotation-x={Math.PI / 2} scale={[5, 3, 1]} />
          <Lightformer form="ring" intensity={mark ? 2.4 : 1.2} color="#ffffff" position={[-1.4, 1.6, 5]} scale={0.6} />
          {mark && <Lightformer form="rect" intensity={1.2} color="#d7e8de" position={[0, -3, 2]} rotation-x={-Math.PI / 2.5} scale={[4, 1.4, 1]} />}
        </Environment>
      </Suspense>
    </>
  )
}

function Placeholder({ subject }: { subject: 'mark' | 'face' }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background:
          subject === 'mark'
            ? 'radial-gradient(closest-side, rgb(215 232 222 / 0.28), rgb(169 199 182 / 0.08) 60%, transparent)'
            : 'radial-gradient(38% 46% at 50% 44%, rgb(201 152 118 / 0.16), rgb(169 199 182 / 0.08) 62%, transparent 80%)',
      }}
    />
  )
}

export function FaceView({ className, subject, framing, interactive, style, pose: posePreset, regions, material = 'skin', scan, landmarks, autoRotate }: FaceViewProps) {
  const host = useRef<HTMLDivElement>(null)
  const pose = useRef<Pose>({ yaw: 0, pitch: 0, zoom: 1, dragging: false })
  const [live, setLive] = useState(false) // canvas mounted (granted by the budget)
  const [visible, setVisible] = useState(false) // frame loop running
  const [k, setK] = useState(1) // CSS zoom/scale of the host (visual px per layout px)
  const soft = useMemo(isSoftware, [])
  const [degraded, setDegraded] = useState(false)
  const hot = useRef<Partial<Record<RegionId, HTMLElement | null>>>({})
  const pick = useRef<{ x: number; y: number } | null>(null)
  const onSelect = useRef(regions?.onSelect)
  onSelect.current = regions?.onSelect

  useEffect(() => {
    if (subject === 'face') preloadHead()
  }, [subject])

  // context budget: near (≤ 600px) views compete for ≤ 8 live canvases
  useEffect(() => {
    const el = host.current
    if (!el) return
    const slot = register(setLive)
    const near = new IntersectionObserver(([e]) => slot.update(e.isIntersecting ? viewportDistance(e.boundingClientRect) : Infinity), { rootMargin: `${NEAR}px` })
    const vis = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        if (e.isIntersecting) slot.update(0)
        else slot.update(viewportDistance(e.boundingClientRect))
      },
      { threshold: 0.01 },
    )
    near.observe(el)
    vis.observe(el)
    return () => (near.disconnect(), vis.disconnect(), slot.release())
  }, [])

  // render resolution follows the visual size, not the layout size (screens may be CSS-zoomed)
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

  // drag to rotate (springs back), wheel / pinch to zoom, tap on the surface to pick a region
  const pickable = subject === 'face' && !!regions?.show
  useEffect(() => {
    const el = host.current
    if (!el || (!interactive && !pickable)) return
    const pts = new Map<number, { x: number; y: number }>()
    let start: { x: number; y: number } | null = null
    let pinch0 = 0
    let zoom0 = 1
    const onHotspot = (e: Event) => !!(e.target as HTMLElement).closest?.('[data-hotspot]')
    const down = (e: PointerEvent) => {
      if (onHotspot(e)) return
      start = { x: e.clientX, y: e.clientY }
      if (!interactive) return
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
        P.yaw = Math.max(-1.22, Math.min(1.22, P.yaw + ((e.clientX - prev.x) / w) * 2.6)) // ±70°
        P.pitch = Math.max(-0.35, Math.min(0.35, P.pitch - ((e.clientY - prev.y) / w) * 1.4)) // ±20°
      }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pts.size === 2 && pinch0) {
        const [a, b] = [...pts.values()]
        pose.current.zoom = Math.max(0.75, Math.min(2.2, zoom0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch0)))
      }
    }
    const up = (e: PointerEvent) => {
      if (start && pickable && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6 && !onHotspot(e)) {
        const r = el.getBoundingClientRect()
        const s = el.offsetWidth ? r.width / el.offsetWidth : 1
        pick.current = { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }
      }
      start = null
      pts.delete(e.pointerId)
      if (pts.size === 0 && pose.current.dragging) {
        pose.current.dragging = false
        pose.current.yaw = 0 // spring back
        pose.current.pitch = 0
      }
    }
    const wheel = (e: WheelEvent) => {
      if (!interactive) return
      e.preventDefault()
      pose.current.zoom = Math.max(0.75, Math.min(2.2, pose.current.zoom * Math.exp(-e.deltaY * 0.0015)))
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
  }, [interactive, pickable])

  const layer = useMemo<RegionLayer | undefined>(
    () => (subject === 'face' && regions ? { show: regions.show, active: regions.active ?? null, els: hot, pick, onSelect: (id) => onSelect.current?.(id) } : undefined),
    [subject, regions?.show, regions?.active], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const base = soft ? 1 : Math.min(2, window.devicePixelRatio || 1)
  const floor = base >= 2 ? 1.5 : 1
  const dpr = Math.min(2, (degraded ? floor : base) * k)
  const frame = subject === 'mark' ? 'mark' : (framing ?? 'head')
  const spec = style ?? CURRENT_STYLE

  return (
    <div
      ref={host}
      // keep the caller's positioning (e.g. `absolute inset-0`); an inline `position` would override it and collapse the box
      className={/\b(absolute|fixed|relative|sticky)\b/.test(className ?? '') ? className : `relative ${className ?? ''}`}
      data-wheel={interactive ? '' : undefined}
      style={{ overflow: 'hidden', touchAction: interactive ? 'none' : undefined, cursor: interactive ? 'grab' : undefined }}
      role={regions?.show ? 'group' : 'img'}
      aria-label={subject === 'mark' ? 'lozuc' : `Rosto em 3D${regions?.show ? ' — mapa de regiões' : ''}${interactive ? ', arraste para girar, role para aproximar' : ''}`}
    >
      {!live && <Placeholder subject={subject} />}
      {live && (
        <Canvas
          dpr={dpr}
          frameloop={visible ? 'always' : 'never'}
          resize={{ offsetSize: true }}
          eventSource={host as React.MutableRefObject<HTMLElement>}
          eventPrefix="offset"
          gl={{ alpha: true, antialias: !soft, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.0, outputColorSpace: SRGBColorSpace, powerPreference: 'high-performance' }}
          camera={{ fov: 22, position: [0, 0, 10], near: 0.1, far: 60 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <PerformanceMonitor onDecline={() => setDegraded(true)} />
          <CameraRig framing={frame} pose={pose} preset={subject === 'face' ? posePreset : undefined} />
          <Lights mark={subject === 'mark'} />
          {subject === 'mark' ? (
            <Mark />
          ) : (
            <HeadModel material={material} scan={scan} style={spec} pose={pose} posePreset={posePreset} landmarks={landmarks} autoRotate={autoRotate} regions={layer} />
          )}
        </Canvas>
      )}
      {live && subject === 'face' && regions?.show && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {REGION_IDS.map((id) => {
            const p = regions.priorities?.[id]
            const c = PRIORITY_COLOR[p ?? 'none']
            const on = regions.active === id
            return (
              <button
                key={id}
                type="button"
                data-hotspot
                ref={(b) => void (hot.current[id] = b)}
                aria-label={`${NAME[id] ?? id}${p ? ` — prioridade ${p}` : ''}`}
                aria-pressed={on}
                onClick={() => regions.onSelect?.(id)}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 26,
                  height: 26,
                  padding: 0,
                  border: 0,
                  borderRadius: 999,
                  background: 'transparent',
                  opacity: 0,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  transition: 'opacity .25s',
                  willChange: 'transform',
                }}
              >
                <span
                  style={{
                    width: on ? 18 : 13,
                    height: on ? 18 : 13,
                    borderRadius: 999,
                    border: `1.5px solid ${c}`,
                    background: on ? `${c}55` : 'rgb(12 20 17 / 0.35)',
                    boxShadow: on ? `0 0 0 4px ${c}26, 0 0 14px ${c}88` : `0 0 0 3px rgb(12 20 17 / 0.18)`,
                    backdropFilter: 'blur(4px)',
                    transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: 999, background: c }} />
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
