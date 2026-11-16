import { useRef } from 'react'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { useFace } from '../../store'
import { prefersReducedMotion } from '../../lib/utils'
import { CornerButton, useCanvasLoop } from './kit'

function LungsGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M12 3v8m0 0-3 2m3-2 3 2" />
      <path d="M8.5 7.5C6 8 4 11 3.6 15.5 3.3 19 5 20.5 7 20c1.8-.4 2.5-1.7 2.5-3.8V9.2c0-1-.4-1.8-1-1.7Z" />
      <path d="M15.5 7.5C18 8 20 11 20.4 15.5c.3 3.5-1.4 5-3.4 4.5-1.8-.4-2.5-1.7-2.5-3.8V9.2c0-1 .4-1.8 1-1.7Z" />
    </svg>
  )
}

/** Respiratory rate with a breathing ripple paced by the live rate. */
export function Respiratory() {
  const resp = useFace((s) => s.vitals.respiratory)
  const toast = useFace((s) => s.toast)
  const phase = useRef(0)
  const still = prefersReducedMotion()

  const canvas = useCanvasLoop((ctx, w, h, _t, dt) => {
    const rate = useFace.getState().vitals.respiratory
    if (!still) phase.current += (dt * rate) / 60
    const p = phase.current % 1
    // inhale 40% / exhale 60%
    const breath = p < 0.4 ? Math.sin((p / 0.4) * (Math.PI / 2)) : Math.cos(((p - 0.4) / 0.6) * (Math.PI / 2))
    const cx = 22
    const cy = h / 2
    const base = 15
    // expanding ripples
    for (let i = 0; i < 3; i++) {
      const q = (p + i / 3) % 1
      ctx.beginPath()
      ctx.arc(cx, cy, base + q * 26, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(143,240,192,${0.45 * (1 - q)})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    // breathing core
    const r = base + breath * 5
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(143,240,192,0.5)')
    g.addColorStop(0.7, 'rgba(143,240,192,0.16)')
    g.addColorStop(1, 'rgba(143,240,192,0.08)')
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = 'rgba(143,240,192,0.55)'
    ctx.lineWidth = 1.4
    ctx.stroke()
    // flow line to the right
    ctx.beginPath()
    for (let x = cx + base + 34; x < w; x += 2) {
      const k = (x - cx) / w
      const y = cy + Math.sin(k * 9 - phase.current * Math.PI * 2) * 6 * (0.55 + breath * 0.45) * (1 - k * 0.35)
      if (x === cx + base + 34) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = 'rgba(143,240,192,0.5)'
    ctx.lineWidth = 1.3
    ctx.stroke()
  })

  return (
    <Glass variant="frost" radius={22} specular={0.6} className="flex h-full w-full flex-col p-4">
      <div className="relative z-[3] flex items-start justify-between">
        <h3 className="text-[14px] font-normal leading-[1.2] text-white">
          Respiratory
          <br />
          Rate
        </h3>
        <CornerButton label="Respiratory trend" onClick={() => toast({ title: 'Respiratory trend', detail: `${resp} brpm · steady over 20 min` })} />
      </div>
      <div className="relative z-[3] mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <canvas ref={canvas} aria-hidden className="mb-1 block h-[54px] w-full" />
          <div className="flex items-center gap-1.5 text-white/55">
            <LungsGlyph />
            <span className="text-[11px]">brpm</span>
          </div>
        </div>
        <AnimatedNumber value={resp} className="text-[40px] font-light leading-none tracking-[-0.02em] text-white" />
      </div>
      <span className="sr-only" aria-live="polite">
        Respiratory rate {resp} breaths per minute
      </span>
    </Glass>
  )
}
