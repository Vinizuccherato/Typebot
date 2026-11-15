import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { springs } from '../../lib/utils'

export interface PopoverProps {
  anchor: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  /** which edge of the anchor the panel aligns to */
  align?: 'start' | 'end'
  /** open above the anchor instead of below */
  side?: 'bottom' | 'top'
  width: number
  label: string
  children: ReactNode
}

/**
 * Frosted popover portalled to <body> (never nested in another .glass, so its
 * backdrop blur sees the real page) and scaled to match the artboard.
 */
export function Popover({ anchor, open, onClose, align = 'end', side = 'bottom', width, label, children }: PopoverProps) {
  const { scale } = useArtboard()
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = anchor.current?.getBoundingClientRect()
      if (!r) return
      const gap = 10 * scale
      setPos({ x: align === 'end' ? r.right : r.left, y: side === 'bottom' ? r.bottom + gap : r.top - gap })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, anchor, align, side, scale])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchor.current?.contains(t)) return
      if ((t as HTMLElement).closest?.('[data-popover]')) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open, onClose, anchor])

  const origin = `${side === 'bottom' ? 'top' : 'bottom'} ${align === 'end' ? 'right' : 'left'}`

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <div
          data-popover
          className="fixed z-[60]"
          style={{
            left: pos.x,
            top: pos.y,
            width,
            transformOrigin: origin,
            transform: `translate(${align === 'end' ? '-100%' : '0'}, ${side === 'top' ? '-100%' : '0'}) scale(${scale})`,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: side === 'bottom' ? -6 : 6 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: side === 'bottom' ? -4 : 4 }}
            transition={springs.snappy}
            style={{ transformOrigin: origin }}
          >
            <Glass
              role="dialog"
              aria-label={label}
              variant="frost"
              radius={22}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              style={{ ['--g-fill-a' as string]: 'rgb(255 255 255 / 0.82)', ['--g-fill-b' as string]: 'rgb(250 250 248 / 0.7)' }}
              className="p-2 text-[var(--ink)]"
            >
              <div className="relative z-[3]">{children}</div>
            </Glass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** One-line row used inside popovers. */
export function PopRow({ children, onClick, active }: { children: ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13px] outline-none transition-colors ${
        active ? 'bg-[var(--ink)] text-white' : 'hover:bg-black/[0.05] active:bg-black/[0.08]'
      }`}
    >
      {children}
    </button>
  )
}
