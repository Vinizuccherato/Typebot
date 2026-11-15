import { useEffect, useId, useRef, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useArtboard } from '../../layout/Artboard'
import { cn, springs } from '../../lib/utils'

/* Shared bits for the right/bottom cards. */

/** hh:mm:ss */
export const hms = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0')).join(':')
}

export const MINT = '#8ff0c0'

/** Small circular ↗ button in a card corner. */
export function CornerButton({ label, onClick, className }: { label: string; onClick?: () => void; className?: string }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className={cn('glass glass-pill relative z-[3] grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-white/75 outline-none hover:text-white', className)}
    >
      <ArrowUpRight size={13} strokeWidth={1.6} className="relative z-[3]" />
    </motion.button>
  )
}

/** Accessible segmented control with a sliding mint pill. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  const id = useId()
  const idx = options.findIndex((o) => o.value === value)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('glass glass-well relative flex rounded-full p-[3px]', className)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault()
          onChange(options[(idx + 1) % options.length].value)
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          onChange(options[(idx - 1 + options.length) % options.length].value)
        }
      }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-[3] flex-1 cursor-pointer rounded-full px-2 py-[5px] text-[11px] font-medium outline-none transition-colors',
              on ? 'text-[#04140e]' : 'text-white/60 hover:text-white',
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(150deg, #8ff0c0, #46be8c)', boxShadow: '0 6px 16px -8px rgb(70 200 150 / 0.7)' }}
                transition={springs.snappy}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * DPR- and artboard-scale-aware <canvas> driven by rAF. `draw` receives CSS-px
 * width/height (layout size, unaffected by the artboard transform) and elapsed seconds.
 */
export function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw
  const { scale } = useArtboard()

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let w = 0
    let h = 0
    const resize = () => {
      w = c.offsetWidth
      h = c.offsetHeight
      const k = Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, scale))
      c.width = Math.max(1, Math.round(w * k))
      c.height = Math.max(1, Math.round(h * k))
      ctx.setTransform(k, 0, 0, k, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    let raf = 0
    const t0 = performance.now()
    let last = t0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden || !w || !h) return
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      drawRef.current(ctx, w, h, (now - t0) / 1000, dt)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [scale])

  return ref
}

/** Tiny floating tooltip (positioned by the caller in % / px). */
export function Tip({ x, y, children }: { x: number | string; y: number; children: ReactNode }) {
  return (
    <motion.div
      role="status"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg px-2 py-1 text-[10.5px] text-white"
      style={{ left: x, top: y, background: 'rgb(6 12 11 / 0.92)', boxShadow: '0 8px 20px -8px rgb(0 0 0 / 0.8), inset 0 0 0 1px rgb(143 240 192 / 0.18)' }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  )
}
