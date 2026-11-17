import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, ChevronLeft } from 'lucide-react'
import { cn, prefersReducedMotion, springs } from '../../lib/utils'
import { useSpecular } from '../../lib/useSpecular'
import { useScreen } from '../../shell/screenContext'

/* Building blocks for stages 1–2. Lozuc palette only (sage / mist / brass / clay). */

/** true in the desktop web app (no status bar, two-column layouts via @3xl). */
export const useIsWeb = () => useScreen().mode === 'web'

/** Respect Reduce Motion once per mount. */
export function useReducedMotion() {
  const [r] = useState(prefersReducedMotion)
  return r
}

/**
 * Runs `fn` every `ms` while this screen is on display (board: always; app/web: when active).
 * Used for the honest demo loops (capture checks, processing stages).
 */
export function useActiveInterval(fn: () => void, ms: number, enabled = true) {
  const { active } = useScreen()
  useEffect(() => {
    if (!active || !enabled) return
    const id = window.setInterval(fn, ms)
    return () => window.clearInterval(id)
  }, [active, enabled, fn, ms])
}

/** Top bar: 44pt glass back chevron + optional centre/right content. Sits under the safe area. */
export function TopBar({ onBack, children, right, backLabel = 'Voltar' }: { onBack?: () => void; children?: ReactNode; right?: ReactNode; backLabel?: string }) {
  return (
    <div className="flex h-11 items-center gap-3">
      {onBack ? (
        <motion.button
          type="button"
          aria-label={backLabel}
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
          className="glass glass-pill liquid grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none"
        >
          <ChevronLeft size={20} className="relative z-[3]" />
        </motion.button>
      ) : (
        <span className="w-11 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {right ?? <span className="w-11 shrink-0" aria-hidden />}
    </div>
  )
}

/** Segmented step bar in sage → mist (replaces the facet ProgressSteps colours). */
export function StepBar({ total, current, label }: { total: number; current: number; label: string }) {
  return (
    <div className="flex items-center gap-3" role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--sage), var(--mist))' }}
              initial={false}
              animate={{ width: i < current ? '100%' : i === current ? '55%' : '0%' }}
              transition={springs.soft}
            />
          </span>
        ))}
      </div>
      <span className="tabular text-[12px] font-semibold text-[var(--text-3)]">
        {current + 1}/{total}
      </span>
    </div>
  )
}

/** Large selectable glass row (radio). Icon disc, title, hint, check badge; tilts slightly. */
export function OptionRow({ selected, onSelect, icon, title, hint, name }: { selected: boolean; onSelect: () => void; icon: ReactNode; title: string; hint?: string; name?: string }) {
  const spec = useSpecular<HTMLButtonElement>(1)
  return (
    <motion.button
      ref={spec.ref}
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      onClick={onSelect}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className={cn('glass flex min-h-[68px] w-full cursor-pointer items-center gap-3.5 rounded-[22px] px-4 py-3 text-left outline-none', selected ? 'glass-sage' : 'glass-frost')}
    >
      <span className={cn('relative z-[3] grid h-11 w-11 shrink-0 place-items-center rounded-full', selected ? 'bg-[var(--mist)] text-[var(--color-pine)]' : 'bg-white/8 text-[var(--text)]')}>{icon}</span>
      <span className="relative z-[3] min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold leading-tight">{title}</span>
        {hint && <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--text-3)]">{hint}</span>}
      </span>
      <motion.span
        aria-hidden
        className="relative z-[3] grid h-6 w-6 shrink-0 place-items-center rounded-full border"
        initial={false}
        animate={{ backgroundColor: selected ? 'rgb(215 232 222 / 1)' : 'rgb(255 255 255 / 0)', borderColor: selected ? 'rgb(215 232 222 / 1)' : 'rgb(255 255 255 / 0.25)' }}
        transition={{ duration: 0.2 }}
      >
        {selected && <Check size={14} strokeWidth={3} className="text-[var(--color-pine)]" />}
      </motion.span>
    </motion.button>
  )
}

/**
 * Segmented glass control (radiogroup) with a sliding sage pill.
 * Arrow keys move the selection (roving tabindex).
 */
export function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  id: string
  value: T | null
  options: { value: T; label: string; hint?: string }[]
  onChange: (v: T) => void
  label: string
  size?: 'md' | 'sm'
}) {
  const idx = options.findIndex((o) => o.value === value)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="glass glass-well flex rounded-[18px] p-1"
      onKeyDown={(e) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
        if (!d) return
        e.preventDefault()
        const n = (Math.max(0, idx) + d + options.length) % options.length
        onChange(options[n].value)
        ;(e.currentTarget.querySelectorAll('[role=radio]')[n] as HTMLElement | undefined)?.focus()
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (idx < 0 && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn('relative z-[3] flex flex-1 cursor-pointer flex-col items-center justify-center rounded-[14px] px-2 outline-none', size === 'md' ? 'min-h-[52px] py-1.5' : 'min-h-[44px]')}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="glass glass-sage absolute inset-0 rounded-[14px]" transition={springs.snappy} />}
            <span className={cn('relative z-[3] text-[14px] font-semibold', on ? 'text-[var(--text)]' : 'text-[var(--text-2)]')}>{o.label}</span>
            {o.hint && size === 'md' && <span className={cn('relative z-[3] text-[11px]', on ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]')}>{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Small "why we ask" caption under a question. */
export function Why({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[12.5px] leading-snug text-[var(--text-3)]">{children}</p>
}

/** Glass icon disc with depth (used in lists). */
export function IconDisc({ children, tone = 'glass' }: { children: ReactNode; tone?: 'glass' | 'sage' | 'clay' | 'ok' }) {
  return (
    <span
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-full',
        tone === 'glass' && 'bg-white/8 text-[var(--text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.18)]',
        tone === 'sage' && 'bg-[var(--sage)] text-[var(--color-pine)]',
        tone === 'clay' && 'bg-[rgb(227_164_138/0.18)] text-[var(--clay)]',
        tone === 'ok' && 'bg-[rgb(159_216_182/0.18)] text-[var(--ok)]',
      )}
    >
      {children}
    </span>
  )
}

/**
 * Pinned CTA area. Mobile: absolutely pinned 16pt above the home indicator with a fade.
 * Web: flows at the end of the content column.
 */
export function PinnedCTA({ children, web }: { children: ReactNode; web: boolean }) {
  if (web) return <div className="mt-6 flex flex-col items-stretch gap-1">{children}</div>
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5 pb-[34px] pt-10" style={{ background: 'linear-gradient(180deg, transparent, rgb(10 15 13 / 0.92) 42%)' }}>
      <div className="pointer-events-auto flex flex-col items-stretch gap-1">{children}</div>
    </div>
  )
}
