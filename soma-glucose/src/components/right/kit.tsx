import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { cn, springs } from '../../lib/utils'

/* ── small shared pieces for the right-hand cards ───────────────── */

/** Smooth Catmull-Rom path through points (rendered as cubic béziers). */
export function smoothPath(pts: [number, number][], tension = 0.5) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const t = tension / 3
    const c1x = p1[0] + (p2[0] - p0[0]) * t
    const c1y = p1[1] + (p2[1] - p0[1]) * t
    const c2x = p2[0] - (p3[0] - p1[0]) * t
    const c2y = p2[1] - (p3[1] - p1[1]) * t
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

/** Point on a circle; angle in degrees, 0 = 3 o'clock, clockwise (SVG y-down). */
export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/** Hover / keyboard scrub over an element: index in [0, n). Scale-safe (rect ratios). */
export function useScrub(n: number) {
  const [index, setIndex] = useState<number | null>(null)
  const onPointerMove = useCallback(
    (e: React.PointerEvent<Element>) => {
      const r = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      setIndex(Math.max(0, Math.min(n - 1, Math.round(x * (n - 1)))))
    },
    [n],
  )
  const onPointerLeave = useCallback(() => setIndex(null), [])
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
      e.preventDefault()
      setIndex((i) => {
        const cur = i ?? n - 1
        if (e.key === 'Home') return 0
        if (e.key === 'End') return n - 1
        return Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)))
      })
    },
    [n],
  )
  return { index, setIndex, handlers: { onPointerMove, onPointerLeave, onKeyDown, onBlur: onPointerLeave } }
}

/** "↗" circular button used in card corners. */
export function ExpandButton({ label, onClick, dark = true }: { label: string; onClick: () => void; dark?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className={cn(
        'grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-full outline-none transition-colors',
        dark ? 'bg-white/10 text-white/80 ring-1 ring-white/15 hover:bg-white/18 hover:text-white' : 'bg-black/[0.04] text-[var(--ink-2)] ring-1 ring-black/10 hover:bg-black/[0.07] hover:text-[var(--ink)]',
      )}
    >
      <ArrowUpRight size={14} strokeWidth={1.7} />
    </motion.button>
  )
}

/** Uppercase caption + optional status. */
export function CardLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('label whitespace-nowrap', className)}>{children}</span>
}

/**
 * Floating glass popover rendered in a portal (cards are backdrop roots and
 * stacking contexts, so it must live outside them). Positioned from the anchor's
 * screen rect; content is scaled by the artboard's --s so it matches the cards.
 */
export function Popover({
  anchor,
  open,
  onClose,
  children,
  side = 'bottom',
  align = 'end',
  dark = false,
  width = 240,
  label,
}: {
  anchor: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  children: ReactNode
  side?: 'bottom' | 'left' | 'top'
  align?: 'start' | 'end' | 'center'
  dark?: boolean
  width?: number
  label: string
}) {
  const [pos, setPos] = useState<{ x: number; y: number; s: number } | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current) return
    const measure = () => {
      const el = anchor.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const s = Number(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1
      const w = width * s
      const gap = 10 * s
      let x = align === 'end' ? r.right - w : align === 'start' ? r.left : r.left + r.width / 2 - w / 2
      let y = r.bottom + gap
      if (side === 'left') {
        x = r.left - gap - w
        y = r.top
      }
      if (side === 'top') y = r.top - gap
      x = Math.max(8, Math.min(window.innerWidth - w - 8, x))
      setPos({ x, y, s })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open, anchor, side, align, width])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panel.current?.contains(t) || anchor.current?.contains(t)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open, onClose, anchor])

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <div
          className="fixed left-0 top-0 z-[60]"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s})`,
            transformOrigin: side === 'top' ? 'bottom right' : 'top left',
            width,
            ...(side === 'top' ? { translate: '0 -100%' } : null),
          }}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.94, y: side === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: side === 'top' ? 4 : -4 }}
            transition={springs.snappy}
            className={cn('glass rounded-[20px] p-4', dark ? 'glass-smoke on-dark' : 'glass-frost')}
            style={
              dark
                ? { background: 'linear-gradient(150deg, rgb(48 47 45 / 0.94), rgb(22 22 21 / 0.94))' }
                : { background: 'linear-gradient(150deg, rgb(255 255 255 / 0.92), rgb(246 245 243 / 0.88))' }
            }
          >
            <div className="relative z-[3]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Small floating tooltip inside an SVG/chart container (absolute, not portaled). */
export function Tip({ x, y, children, dark = true }: { x: number; y: number; children: ReactNode; dark?: boolean }) {
  return (
    <motion.div
      className={cn(
        'pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-medium tabular shadow-[0_6px_16px_-6px_rgb(0_0_0/0.4)]',
        dark ? 'bg-white text-[var(--ink)]' : 'bg-[var(--ink)] text-white',
      )}
      style={{ left: x, top: y - 8 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.div>
  )
}
