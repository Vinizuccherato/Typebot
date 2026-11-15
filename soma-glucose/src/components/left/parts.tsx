import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { motion } from 'motion/react'
import { springs } from '../../lib/utils'

/** Card caption row: UPPERCASE label, optional meta, right-side slot. */
export function CardHead({ label, meta, right }: { label: string; meta?: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative z-[3] flex items-center justify-between gap-2">
      <p className="flex min-w-0 items-baseline gap-1.5 truncate">
        <span className="label text-[var(--ink)]">{label}</span>
        {meta && <span className="truncate text-[11px] text-[var(--ink-3)]">{meta}</span>}
      </p>
      {right}
    </div>
  )
}

/** The small ↗ affordance in the reference's card corners. */
export function Corner({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.12, rotate: 8 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--ink-2)] outline-none hover:text-[var(--ink)]"
    >
      <ArrowUpRight size={15} strokeWidth={1.7} />
    </motion.button>
  )
}

/** Hover / scrub tooltip bubble (positioned by the caller). */
export function Tip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none whitespace-nowrap rounded-[10px] bg-[var(--ink)] px-2 py-1 text-[10.5px] leading-tight text-white shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)] tabular">
      {children}
    </span>
  )
}
