import { useEffect, useRef } from 'react'
import { useFace } from '../../store'
import { useArtboard } from '../../layout/Artboard'

export interface TraceOptions {
  /** how many of the latest rPPG samples span the width */
  samples: number
  color: string
  /** 0..1 — fill under the line */
  fill?: number
  lineWidth?: number
}

/**
 * Draws the live rPPG/pulse stream on a canvas at 60fps. The store pushes a sample
 * every 100 ms; between samples the trace scrolls smoothly so motion never steps.
 * Sizes from offsetWidth (unscaled) × DPR × artboard scale, so it stays crisp.
 */
export function useTrace(opts: TraceOptions) {
  const ref = useRef<HTMLCanvasElement>(null)
  const { scale } = useArtboard()
  const o = useRef(opts)
  o.current = opts

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let w = 0
    let h = 0
    let last = useFace.getState().vitals.rppg
    let changedAt = performance.now()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const size = () => {
      const k = Math.min(3, (window.devicePixelRatio || 1) * scale)
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width = Math.round(w * k)
      canvas.height = Math.round(h * k)
      ctx.setTransform(k, 0, 0, k, 0, 0)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(canvas)

    const draw = (now: number) => {
      const { samples, color, fill = 0.18, lineWidth = 1.6 } = o.current
      const data = useFace.getState().vitals.rppg
      if (data !== last) {
        last = data
        changedAt = now
      }
      const t = reduce ? 1 : Math.min(1, (now - changedAt) / 100)
      const n = Math.min(samples, data.length - 1)
      const step = w / (n - 1)
      const pad = lineWidth + 2
      const yOf = (v: number) => pad + (1 - Math.max(0, Math.min(1, v))) * (h - pad * 2)
      ctx.clearRect(0, 0, w, h)
      ctx.beginPath()
      const start = data.length - n - 1
      const pts: [number, number][] = []
      for (let i = 0; i <= n; i++) pts.push([(i - t) * step, yOf(data[start + i])])
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1]
        const [x1, y1] = pts[i]
        const mx = (x0 + x1) / 2
        ctx.quadraticCurveTo(x0, y0, mx, (y0 + y1) / 2)
        if (i === pts.length - 1) ctx.lineTo(x1, y1)
      }
      const fade = ctx.createLinearGradient(0, 0, w, 0)
      fade.addColorStop(0, 'transparent')
      fade.addColorStop(0.25, color)
      fade.addColorStop(1, color)
      ctx.strokeStyle = fade
      ctx.lineWidth = lineWidth
      ctx.lineJoin = 'round'
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
      if (fill > 0) {
        ctx.lineTo(pts[pts.length - 1][0], h)
        ctx.lineTo(pts[0][0], h)
        ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, color.replace('rgb(', 'rgba(').replace(')', `, ${fill})`))
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fill()
      }
      // live head
      const [hx, hy] = pts[pts.length - 1]
      ctx.beginPath()
      ctx.arc(Math.min(hx, w - 3), hy, 2.6, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = color
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [scale])

  return ref
}
