import { motion } from 'motion/react'
import { springs } from '../lib/utils'

/** Segmented step progress (quiz / flows). */
export function ProgressSteps({ total, current, label }: { total: number; current: number; label?: string }) {
  return (
    <div className="flex items-center gap-3" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={label ?? 'Progress'}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/12">
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
