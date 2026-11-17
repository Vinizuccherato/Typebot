import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { ChevronLeft, X, type LucideIcon } from 'lucide-react'
import { useScreen } from '../../shell/screenContext'
import { SAFE_TOP, TABBAR_SPACE } from '../../shell/ScreenFrame'
import type { Source } from '../../store'
import { cn, springs } from '../../lib/utils'
import { usePointerDrag } from '../../lib/usePointerDrag'

/* ──────────────────────────────────────────────────────────────
   Shared building blocks for the stage 5–6 screens (Guide, Routine,
   Plan, Home, Personal, Evolution, Settings).
   ────────────────────────────────────────────────────────────── */

/** Scrolling page with an iOS large title that collapses into a glass nav bar. */
export function ScrollScreen({
  title,
  eyebrow,
  back,
  trailing,
  children,
  footer,
  className,
}: {
  title: string
  eyebrow?: ReactNode
  back?: { label: string; onClick: () => void }
  trailing?: ReactNode
  children: ReactNode
  /** pinned content above the tab bar (e.g. composer) */
  footer?: ReactNode
  className?: string
}) {
  const { mode } = useScreen()
  const web = mode === 'web'
  const scroller = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: scroller })
  const barOpacity = useTransform(scrollY, [24, 64], [0, 1])
  const top = web ? 20 : SAFE_TOP
  const bottom = web ? 32 : footer ? 16 : TABBAR_SPACE
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* collapsed bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30" style={{ height: top + 52 }}>
        <motion.div aria-hidden className="glass glass-smoke absolute inset-0 rounded-none" style={{ opacity: barOpacity, borderRadius: 0 }} />
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex h-[52px] items-center justify-between px-4">
          {back ? (
            <button type="button" onClick={back.onClick} aria-label={back.label} className="glass glass-pill liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
              <ChevronLeft size={20} className="relative z-[3]" />
            </button>
          ) : (
            <span className="w-11" />
          )}
          <motion.span className="text-[16px] font-semibold" style={{ opacity: barOpacity }} aria-hidden>
            {title}
          </motion.span>
          <span className="flex min-w-11 justify-end gap-2">{trailing}</span>
        </div>
      </div>

      <div ref={scroller} className={cn('relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden', className)} style={{ paddingTop: top + 52, paddingBottom: bottom, scrollbarWidth: 'none' }}>
        <header className="px-5 pb-4 @3xl:px-10">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className="display text-[34px] font-semibold leading-[1.05] @3xl:text-[44px]">{title}</h1>
        </header>
        {children}
      </div>
      {footer}
    </div>
  )
}

/** Liquid-glass segmented control (radiogroup, arrow keys). */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; icon?: LucideIcon }[]; label: string; className?: string }) {
  const id = useRef(`seg-${Math.random().toString(36).slice(2, 7)}`).current
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('glass glass-well flex rounded-full p-1', className)}
      onKeyDown={(e) => {
        const i = options.findIndex((o) => o.id === value)
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (!d) return
        e.preventDefault()
        onChange(options[(i + d + options.length) % options.length].id)
      }}
    >
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cn('relative z-[3] flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold outline-none transition-colors', on ? 'text-[var(--color-pine)]' : 'text-[var(--text-2)] hover:text-[var(--text)]')}
          >
            {on && <motion.span layoutId={id} className="glass glass-ink absolute inset-0 rounded-full" transition={springs.snappy} />}
            {o.icon && <o.icon size={15} className="relative z-[3]" />}
            <span className="relative z-[3]">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-5 @3xl:px-0">
      <h2 className="label">{children}</h2>
      {action}
    </div>
  )
}

const SOURCE_TONE: Record<Source | 'dados' | 'referência', string> = {
  observado: 'bg-[var(--sage)]',
  informado: 'bg-[var(--brass)]',
  incerto: 'bg-[var(--clay)]',
  dados: 'bg-[var(--sage)]',
  referência: 'bg-[var(--brass)]',
}

/** Small provenance chip — the product rule that every claim says where it comes from. */
export function SourceChip({ source, prefix }: { source: Source | 'dados' | 'referência'; prefix?: string }) {
  return (
    <span className="glass glass-pill inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium text-[var(--text-2)]">
      <span className={cn('relative z-[3] h-1.5 w-1.5 rounded-full', SOURCE_TONE[source])} />
      <span className="relative z-[3]">
        {prefix}
        {source}
      </span>
    </span>
  )
}

export function IconDisc({ icon: Icon, tone = 'glass', size = 40 }: { icon: LucideIcon; tone?: 'glass' | 'sage' | 'brass' | 'clay'; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn('relative z-[3] grid shrink-0 place-items-center rounded-full', tone === 'glass' && 'bg-white/8 text-[var(--text)]', tone === 'sage' && 'bg-[var(--sage)] text-[var(--color-pine)]', tone === 'brass' && 'bg-[var(--brass)] text-[var(--color-pine)]', tone === 'clay' && 'bg-[var(--clay)] text-[var(--color-pine)]')}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.45)} strokeWidth={1.9} />
    </span>
  )
}

/**
 * Bottom sheet inside the screen (one at a time). Grabber drag or Esc closes;
 * focus moves into the sheet and back to the opener.
 */
export function Sheet({ open, onClose, title, children, height = 'medium' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; height?: 'medium' | 'large' }) {
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<Element | null>(null)
  const [dy, setDy] = useState(0)
  const grab = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') return setDy(0)
    const y = Math.max(0, p.py - 14)
    if (p.phase === 'move') setDy(y)
    if (p.phase === 'end') {
      if (y > 90) onClose()
      setDy(0)
    }
  })
  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>('button, [href], input, [tabindex="0"]')?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      ;(opener.current as HTMLElement | null)?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[60]">
          <motion.button type="button" aria-label="Fechar" className="absolute inset-0 cursor-default bg-black/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass glass-smoke liquid absolute inset-x-2 bottom-2 flex flex-col rounded-[34px] @3xl:inset-x-auto @3xl:left-1/2 @3xl:w-[560px] @3xl:-translate-x-1/2"
            style={{ maxHeight: height === 'large' ? '88%' : '62%' }}
            initial={{ y: '100%' }}
            animate={{ y: dy }}
            exit={{ y: '100%' }}
            transition={springs.soft}
          >
            <div ref={grab.ref} onPointerDown={grab.onPointerDown} className="relative z-[3] flex cursor-grab touch-none justify-center pb-1 pt-2.5">
              <span className="h-[5px] w-9 rounded-full bg-white/30" />
            </div>
            <div className="relative z-[3] flex items-center justify-between px-5 pb-2 pt-1">
              <h2 className="text-[17px] font-semibold">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Concluir" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/8 outline-none hover:bg-white/12">
                <X size={18} />
              </button>
            </div>
            <div className="relative z-[3] min-h-0 flex-1 overflow-y-auto px-5 pb-6" style={{ scrollbarWidth: 'none' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Glass confirmation dialog (in-page — the viewer can't show native confirm()). */
export function ConfirmDialog({ open, title, body, confirm, onConfirm, onCancel, destructive }: { open: boolean; title: string; body: string; confirm: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[70] grid place-items-center p-6">
          <motion.div aria-hidden className="absolute inset-0 bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div role="alertdialog" aria-modal="true" aria-label={title} className="glass glass-smoke liquid relative w-full max-w-[330px] rounded-[30px] p-5 text-center" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={springs.bouncy}>
            <h2 className="relative z-[3] text-[18px] font-semibold">{title}</h2>
            <p className="relative z-[3] mt-2 text-[14px] leading-[1.45] text-[var(--text-2)]">{body}</p>
            <div className="relative z-[3] mt-5 flex flex-col gap-2">
              <button type="button" autoFocus onClick={onConfirm} className={cn('h-12 cursor-pointer rounded-full text-[15px] font-semibold outline-none', destructive ? 'bg-[var(--clay)] text-[var(--color-pine)]' : 'bg-[var(--color-bone)] text-[var(--color-pine)]')}>
                {confirm}
              </button>
              <button type="button" onClick={onCancel} className="h-12 cursor-pointer rounded-full text-[15px] font-semibold text-[var(--text-2)] outline-none hover:text-[var(--text)]">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Rating dots (1–3) for maintenance / effort / cost. */
export function Dots({ n, of = 3, label }: { n: number; of?: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${label}: ${n} de ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={cn('h-1.5 w-4 rounded-full', i < n ? 'bg-[var(--sage)]' : 'bg-white/12')} />
      ))}
    </span>
  )
}

/** Keeps `scrollY` subscribers quiet when unmounted (helper for components that observe scroll). */
export function useScrolled(container: React.RefObject<HTMLElement | null>, threshold = 8) {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll({ container })
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > threshold))
  return scrolled
}

/** Formats an ISO date as "05 out". */
export const shortDate = (iso: string) => {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}
