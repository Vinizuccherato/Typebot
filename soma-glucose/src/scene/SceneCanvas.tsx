import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useArtboard } from '../layout/Artboard'
import { useSoma } from '../store'
import { prefersReducedMotion } from '../lib/utils'
import { Figure, type Motion } from './Figure'
import { MENU_HALF, RadialMenu } from './RadialMenu'
import type { ViewMap } from './pose'

const isSoftware = () =>
  typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

/* The figure is soft studio material, so the raymarch runs at a modest
   resolution and steps down under load (it is a per-pixel shader, not meshes). */
const dprLevels = () => {
  if (isSoftware()) return [0.5]
  const top = Math.min(1.5, window.devicePixelRatio || 1)
  return [top, Math.min(top, 1), 0.75]
}

/** Full-viewport sculpted figure with the CGM sensor and its radial biomarker menu. */
export function SceneCanvas() {
  const board = useArtboard()
  const reading = useSoma((s) => s.stats.current)
  const view = useRef<ViewMap>({ scale: 1, originX: 0, originY: 0 })
  const motion = useRef<Motion>({ px: 0, py: 0, dx: 0, dy: 0, dragging: false })
  const menu = useRef<HTMLDivElement>(null)
  const menuLayer = useRef<HTMLDivElement>(null)
  const [levels] = useState(dprLevels)
  const [level, setLevel] = useState(0)
  const reduced = prefersReducedMotion()

  /* design px → CSS px. Desktop: the artboard's own mapping. Compact: the figure is
     re-centred into the hero window under the title. */
  useLayoutEffect(() => {
    if (board.mode === 'desktop') {
      view.current = { scale: board.scale, originX: 0, originY: 0 }
    } else {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sc = Math.min(1, Math.max(0.42, vw / 760))
      const anchor = { u: 650, v: 470 }
      const target = { x: vw / 2, y: 290 + vh * 0.24 }
      view.current = { scale: sc, originX: target.x - anchor.u * sc, originY: target.y - anchor.v * sc }
    }
  }, [board])

  /* compact: the page scrolls over the fixed figure, so the menu fades out with the hero */
  useEffect(() => {
    const layer = menuLayer.current
    if (!layer) return
    if (board.mode !== 'compact') {
      layer.style.opacity = ''
      layer.style.visibility = ''
      return
    }
    const on = () => {
      const o = Math.max(0, 1 - window.scrollY / 220)
      layer.style.opacity = String(o)
      layer.style.visibility = o < 0.02 ? 'hidden' : ''
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [board.mode])

  /* pointer parallax anywhere on the page */
  useEffect(() => {
    const on = (e: PointerEvent) => {
      motion.current.px = (e.clientX / window.innerWidth) * 2 - 1
      motion.current.py = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [])

  const onSensor = useCallback((x: number, y: number, k: number) => {
    const el = menu.current
    if (!el) return
    const s = view.current.scale * k
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s}) translate(${-MENU_HALF}px, ${-MENU_HALF}px)`
  }, [])

  /* drag on empty studio space → clamped orbit that springs back */
  const drag = useRef({ x: 0, y: 0 })
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || board.mode === 'compact') return
    drag.current = { x: e.clientX, y: e.clientY }
    motion.current.dragging = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!motion.current.dragging) return
    const k = 0.004 / Math.max(0.5, view.current.scale)
    motion.current.dx = Math.max(-1.6, Math.min(1.6, -(e.clientX - drag.current.x) * k))
    motion.current.dy = Math.max(-1, Math.min(1, (e.clientY - drag.current.y) * k))
  }
  const onPointerUp = () => {
    motion.current.dragging = false
  }

  return (
    <>
      <div
        className="fixed inset-0 z-0"
        style={{ cursor: board.mode === 'desktop' ? 'grab' : undefined, touchAction: board.mode === 'compact' ? 'pan-y' : 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-hidden
      >
        <Canvas
          dpr={levels[level]}
          gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
          orthographic
          resize={{ offsetSize: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <PerformanceMonitor
            onDecline={() => setLevel((l) => Math.min(levels.length - 1, l + 1))}
            onIncline={() => setLevel((l) => Math.max(0, l - 1))}
            flipflops={3}
          />
          <Figure view={view} motion={motion} onSensor={onSensor} reduced={reduced} />
        </Canvas>
      </div>
      {/* the biomarker menu sits above the artboard's empty centre */}
      <div ref={menuLayer} className="pointer-events-none fixed inset-0 z-[11]">
        <RadialMenu ref={menu} reading={reading} />
      </div>
    </>
  )
}
