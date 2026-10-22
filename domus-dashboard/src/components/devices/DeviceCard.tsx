import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SlidersVertical } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { IconButton } from '../../ui/IconButton'
import { Toggle } from '../../ui/Toggle'
import { cn, springs } from '../../lib/utils'

/* ──────────────────────────────────────────────────────────────
   Shared device card shell + the glass sheet that unfolds from
   the settings disc. The sheet lives inside the card, so it is
   never clipped (scroll-snap row in compact mode).
   ────────────────────────────────────────────────────────────── */

export interface DeviceCardProps {
  title: [string, string]
  on: boolean
  sheetOpen: boolean
  onSheetOpenChange: (open: boolean) => void
  sheet: ReactNode
  sheetLabel: string
  children: ReactNode
  /** Extra card-level layers (e.g. a second sheet) — not dimmed with the content. */
  overlay?: ReactNode
  /** True while an overlay sheet covers the card (content recedes behind it). */
  obscured?: boolean
  className?: string
}

/** Card glass tuned to the reference: as dark as (or darker than) the smoked panel. */
const CARD_MATERIAL = {
  '--g-fill-a': 'rgb(26 25 23 / 0.55)',
  '--g-fill-b': 'rgb(14 14 13 / 0.5)',
  '--g-blur': '16px',
  '--g-edge-a': 'rgb(255 255 255 / 0.3)',
  '--g-edge-b': 'rgb(255 255 255 / 0.07)',
  '--g-edge-c': 'rgb(255 255 255 / 0.03)',
  '--g-edge-d': 'rgb(255 255 255 / 0.12)',
  '--g-shadow': '0 18px 36px -20px rgb(0 0 0 / 0.55), 0 1px 2px rgb(0 0 0 / 0.15)',
  '--g-bevel': 'inset 0 1px 0 rgb(255 255 255 / 0.08)',
} as React.CSSProperties

export function DeviceCard({
  title,
  on,
  sheetOpen,
  onSheetOpenChange,
  sheet,
  sheetLabel,
  children,
  overlay,
  obscured,
  className,
}: DeviceCardProps) {
  const anchor = useRef<HTMLButtonElement>(null)
  const covered = sheetOpen || !!obscured
  return (
    <Glass
      variant="well"
      radius={24}
      specular={0.7}
      className={cn('relative flex h-full min-w-0 flex-col p-[14px] pb-3', className)}
      style={CARD_MATERIAL}
    >
      {/* above the sheet (z-20) so the settings disc stays tappable as its close control */}
      <div className="relative z-[25] flex items-start justify-between gap-2">
        <h3
          className={cn(
            'pt-[2px] text-[13.5px] font-normal leading-[1.18] tracking-[-0.005em] text-white/92 transition-opacity duration-300',
            covered && 'opacity-0',
          )}
        >
          {title[0]}
          <br />
          {title[1]}
        </h3>
        <IconButton
          ref={anchor}
          icon={SlidersVertical}
          label={sheetOpen ? `Close ${sheetLabel}` : sheetLabel}
          size={42}
          iconSize={16}
          variant="well"
          active={sheetOpen}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => onSheetOpenChange(!sheetOpen)}
          className="z-30"
        />
      </div>

      <motion.div
        className="relative z-[3] mt-1 flex min-h-0 flex-1 flex-col"
        initial={false}
        animate={{
          opacity: covered ? 0.1 : on ? 1 : 0.42,
          filter: covered
            ? 'saturate(0.6) brightness(0.9) blur(6px)'
            : on
              ? 'saturate(1) brightness(1) blur(0px)'
              : 'saturate(0.1) brightness(0.85) blur(0px)',
        }}
        transition={springs.soft}
        aria-hidden={covered || undefined}
      >
        {children}
      </motion.div>

      <CardSheet open={sheetOpen} onClose={() => onSheetOpenChange(false)} label={sheetLabel} anchor={anchor}>
        {sheet}
      </CardSheet>
      {overlay}
    </Glass>
  )
}

/** Near-opaque lifted sheet — legible even where nested backdrop blur is unavailable. */
const SHEET_MATERIAL = {
  '--g-fill-a': 'rgb(70 67 63 / 0.96)',
  '--g-fill-b': 'rgb(44 42 39 / 0.97)',
  '--g-blur': '18px',
  '--g-edge-a': 'rgb(255 255 255 / 0.55)',
  '--g-edge-b': 'rgb(255 255 255 / 0.12)',
  '--g-edge-d': 'rgb(255 255 255 / 0.22)',
  '--g-shadow': '0 18px 40px -16px rgb(0 0 0 / 0.6), 0 2px 6px rgb(0 0 0 / 0.25)',
} as React.CSSProperties

interface CardSheetProps {
  open: boolean
  onClose: () => void
  label: string
  anchor: RefObject<HTMLElement | null>
  children: ReactNode
  /** Leave room for the settings disc in the top-right corner. */
  className?: string
}

export function CardSheet({ open, onClose, label, anchor, children, className }: CardSheetProps) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close.current()
        anchor.current?.focus({ preventScroll: true })
      }
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t) || anchor.current?.contains(t)) return
      close.current()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown, true)
    const raf = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>('button, [role="slider"], [role="switch"]')?.focus({ preventScroll: true }),
    )
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown, true)
    }
  }, [open, anchor])

  return (
    <AnimatePresence>
      {open && (
        <Glass
          ref={ref}
          role="dialog"
          aria-label={label}
          variant="frost"
          radius={18}
          className={cn('z-20 flex flex-col px-3 pb-3 pt-[10px]', className)}
          // inline: `.glass { position: relative }` is unlayered and would beat Tailwind's `absolute`
          style={{ ...SHEET_MATERIAL, position: 'absolute', inset: 6, transformOrigin: 'calc(100% - 27px) 27px' }}
          initial={{ opacity: 0, scale: 0.86 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.16 } }}
          transition={springs.snappy}
        >
          <div className="relative z-[3] flex min-h-0 flex-1 flex-col">{children}</div>
        </Glass>
      )}
    </AnimatePresence>
  )
}

/** Sheet title row — reserves space for the settings disc on the right. */
export function SheetHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-2 min-h-[30px] pr-10">
      <div className="text-[12.5px] leading-tight text-white/95">{title}</div>
      {sub && <div className="tabular mt-0.5 text-[10.5px] leading-tight text-white/60">{sub}</div>}
    </div>
  )
}

export function PowerRow({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] text-white/75">Power</span>
      <Toggle checked={on} onChange={onChange} label={`${label} power`} size="sm" />
    </div>
  )
}

/** Segmented control with a shared-layout liquid pill. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  id,
  label,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  id: string
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="glass glass-well flex rounded-full p-[3px]">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative z-[3] h-[24px] flex-1 cursor-pointer rounded-full px-2 text-[11px] outline-none transition-colors',
              active ? 'text-ink' : 'text-white/65 hover:text-white',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-white shadow-[0_2px_8px_rgb(0_0_0/0.3)]"
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
