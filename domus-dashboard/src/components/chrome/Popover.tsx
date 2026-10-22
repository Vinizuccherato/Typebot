import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Glass } from '../../ui/Glass'
import { cn, springs } from '../../lib/utils'

/** Closes on outside pointer-down and on Escape. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onClose: () => void) {
  const cb = useRef(onClose)
  cb.current = onClose
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current()
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, open])
}

export interface PopoverProps {
  open: boolean
  align?: 'left' | 'right'
  width?: number
  className?: string
  children: ReactNode
  label: string
}

/**
 * Glass popover that springs out of its trigger. Must be rendered as a sibling
 * of the trigger inside a `relative` wrapper (outside any `.glass` element, so
 * it escapes that stacking context and floats above the other slots).
 */
export function Popover({ open, align = 'right', width = 300, className, children, label }: PopoverProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label={label}
          className={cn('absolute top-[calc(100%+12px)] z-50', align === 'right' ? 'right-0' : 'left-0')}
          style={{ width, transformOrigin: align === 'right' ? 'top right' : 'top left' }}
          initial={{ opacity: 0, scale: 0.92, y: -6, filter: 'blur(6px)' }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.95, y: -4, filter: 'blur(4px)', transition: { duration: 0.16 } }}
          transition={springs.snappy}
        >
          <Glass
            variant="frost"
            radius={24}
            specular={0.8}
            className={cn('p-2 text-white', className)}
            style={{
              ['--g-fill-a' as string]: 'rgb(120 116 108 / 0.55)',
              ['--g-fill-b' as string]: 'rgb(70 67 62 / 0.5)',
              ['--g-blur' as string]: '34px',
            }}
          >
            <div className="relative z-[3]">{children}</div>
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Row used inside popovers / menus. */
export function MenuRow({
  icon,
  title,
  detail,
  trailing,
  onClick,
  danger,
}: {
  icon: ReactNode
  title: string
  detail?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2 text-left outline-none transition-colors duration-200',
        onClick && 'cursor-pointer hover:bg-white/10 focus-visible:bg-white/10 active:bg-white/15',
        danger && 'text-[#ffb4a6]',
      )}
    >
      <span className="glass glass-well grid h-8 w-8 shrink-0 place-items-center rounded-full">
        <span className="relative z-[3] grid place-items-center">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] leading-tight">{title}</span>
        {detail && <span className="mt-0.5 block truncate text-[11.5px] leading-tight text-white/50">{detail}</span>}
      </span>
      {trailing}
    </Comp>
  )
}

export function PopoverHeading({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">{children}</span>
      {aside}
    </div>
  )
}
