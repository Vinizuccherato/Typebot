import { motion } from 'motion/react'
import { springs } from '../lib/utils'

/** Pager dots (active dot stretches into a capsule). */
export function PageDots({ count, index, onSelect, labels }: { count: number; index: number; onSelect: (i: number) => void; labels?: string[] }) {
  return (
    <div className="flex items-center gap-1.5" role="tablist" aria-label="Slides">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === index}
          aria-label={labels?.[i] ?? `Slide ${i + 1}`}
          onClick={() => onSelect(i)}
          className="grid h-11 w-6 cursor-pointer place-items-center outline-none"
        >
          <motion.span
            className="block h-1.5 rounded-full bg-[var(--text)]"
            initial={false}
            animate={{ width: i === index ? 22 : 6, opacity: i === index ? 1 : 0.35 }}
            transition={springs.snappy}
          />
        </button>
      ))}
    </div>
  )
}
