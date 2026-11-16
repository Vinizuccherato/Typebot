import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useStudio, type Look, type RegionId } from '../store'
import { cn, springs } from '../lib/utils'
import { Glass } from '../ui/Glass'

/* Shared pieces for the studio panels. */

/** White, tracked, uppercase section label; a small azure dot marks the active region. */
export function Label({ children, region, id }: { children: ReactNode; region?: RegionId; id?: string }) {
  const active = useStudio((s) => (region ? s.region === region : false))
  return (
    <div id={id} className="label flex h-[18px] items-center gap-2" style={{ textShadow: '0 1px 6px rgb(60 64 90 / 0.25)' }}>
      {children}
      <AnimatePresence>
        {active && (
          <motion.span
            aria-hidden
            className="h-[6px] w-[6px] rounded-full bg-azure"
            style={{ boxShadow: '0 0 8px rgb(60 108 246 / 0.8)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={springs.bouncy}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Begin a continuous gesture: edits during the drag skip history (edit(…, false));
 * `end()` pushes the pre-drag look so undo is one step per gesture.
 */
export function useGesture() {
  const before = useRef<Look | null>(null)
  const begin = useCallback(() => {
    before.current = useStudio.getState().look
  }, [])
  const end = useCallback(() => {
    if (before.current) useStudio.getState().commitGesture(before.current)
    before.current = null
  }, [])
  return { begin, end }
}

/** Roving-tabindex keyboard handler for a row/grid of options. */
export function rovingKeys<T>(items: readonly T[], current: number, pick: (item: T, index: number) => void, cols = items.length) {
  return (e: React.KeyboardEvent<HTMLElement>) => {
    const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }
    const d = map[e.key]
    if (d === undefined && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const i = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (current + d + items.length) % items.length
    pick(items[i], i)
    const host = e.currentTarget
    requestAnimationFrame(() => (host.querySelector(`[data-idx="${i}"]`) as HTMLElement | null)?.focus())
  }
}

/** Row of colour swatches (radiogroup) as in Eye / Eyebrow colour. */
export function SwatchRow({
  label,
  colors,
  value,
  onPick,
}: {
  label: string
  colors: readonly { id: string; label: string; hex: string }[]
  value: string
  onPick: (hex: string) => void
}) {
  const idx = Math.max(0, colors.findIndex((c) => c.hex === value))
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-[14px]" onKeyDown={rovingKeys(colors, idx, (c) => onPick(c.hex))}>
      {colors.map((c, i) => {
        const on = i === idx && colors[idx].hex === value
        return (
          <motion.button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.label}
            title={c.label}
            data-idx={i}
            tabIndex={i === idx ? 0 : -1}
            onClick={() => onPick(c.hex)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="relative grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full outline-none"
          >
            {on && (
              <motion.span
                layoutId={`ring-${label}`}
                className="absolute -inset-[4px] rounded-full border-[1.5px] border-white"
                style={{ boxShadow: '0 0 0 1px rgb(60 108 246 / 0.25), 0 4px 12px -4px rgb(40 44 70 / 0.35)' }}
                transition={springs.snappy}
              />
            )}
            <span
              className="h-full w-full rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c.hex} 70%, white), ${c.hex} 60%, color-mix(in srgb, ${c.hex} 80%, black))`,
                boxShadow: 'inset 0 1px 1px rgb(255 255 255 / 0.5), 0 2px 6px -2px rgb(40 44 70 / 0.35)',
              }}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

/** A selectable thumbnail tile (eye / brow forms). */
export function Thumb({
  selected,
  label,
  idx,
  tabIndex,
  onClick,
  className,
  children,
}: {
  selected: boolean
  label: string
  idx: number
  tabIndex: number
  onClick: () => void
  className?: string
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      data-idx={idx}
      tabIndex={tabIndex}
      onClick={onClick}
      animate={{ y: selected ? -2 : 0 }}
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
      className={cn('relative cursor-pointer overflow-visible rounded-[9px] outline-none', className)}
      style={{ boxShadow: selected ? '0 10px 20px -10px rgb(40 44 70 / 0.55)' : '0 4px 10px -8px rgb(40 44 70 / 0.4)' }}
    >
      <span className="block h-full w-full overflow-hidden rounded-[9px]">{children}</span>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-[3px] rounded-[11px] border-[1.5px] border-white"
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.94 }}
        transition={springs.snappy}
      />
    </motion.button>
  )
}

/* ── Popover (portal, so its glass never sits inside another backdrop root) ── */

export function Popover({
  open,
  onClose,
  anchor,
  placement = 'top',
  align = 'start',
  label,
  children,
  width = 200,
}: {
  open: boolean
  onClose: () => void
  anchor: RefObject<HTMLElement | null>
  placement?: 'top' | 'bottom'
  align?: 'start' | 'end' | 'center'
  label: string
  children: ReactNode
  width?: number
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current) return
    const r = anchor.current.getBoundingClientRect()
    const x = align === 'start' ? r.left : align === 'end' ? r.right : r.left + r.width / 2
    setPos({ x, y: placement === 'top' ? r.top - 10 : r.bottom + 10 })
  }, [open, anchor, placement, align])

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
    requestAnimationFrame(() => (panel.current?.querySelector('button, [tabindex="0"]') as HTMLElement | null)?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open, onClose, anchor])

  const tx = align === 'start' ? '0%' : align === 'end' ? '-100%' : '-50%'
  const ty = placement === 'top' ? '-100%' : '0%'
  const origin = `${align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'} ${placement === 'top' ? 'bottom' : 'top'}`

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <div className="fixed z-50" style={{ left: pos.x, top: pos.y, transform: `translate(${tx}, ${ty})` }}>
          <div style={{ transform: 'scale(var(--s))', transformOrigin: origin }}>
            <motion.div
              initial={{ scale: 0.9, y: placement === 'top' ? 6 : -6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: placement === 'top' ? 6 : -6 }}
              transition={springs.snappy}
              style={{ transformOrigin: origin }}
            >
              <Glass
                ref={panel}
                role="dialog"
                aria-label={label}
                radius={18}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="p-1.5 text-[var(--text)]"
                style={{ width, background: 'linear-gradient(150deg, rgb(255 255 255 / 0.82), rgb(240 241 248 / 0.72))' }}
              >
                <div className="relative z-[3]">{children}</div>
              </Glass>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function MenuItem({ children, onClick, active, danger }: { children: ReactNode; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center justify-between gap-3 rounded-[12px] px-3 py-2 text-left text-[13px] outline-none transition-colors hover:bg-[rgb(60_64_90/0.07)]',
        danger ? 'text-[#c2413a]' : 'text-[var(--text)]',
      )}
    >
      {children}
      {active && <span className="h-[7px] w-[7px] rounded-full bg-azure" />}
    </button>
  )
}
