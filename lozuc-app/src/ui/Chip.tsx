import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn, springs } from '../lib/utils'

/** Selectable capsule chip (radio or checkbox semantics). */
export function Chip({
  selected,
  onClick,
  children,
  role = 'radio',
  className,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  role?: 'radio' | 'checkbox'
  className?: string
}) {
  return (
    <motion.button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
      className={cn(
        'glass relative inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-medium outline-none transition-colors',
        selected ? 'glass-ink' : 'glass-pill text-[var(--text-2)] hover:text-[var(--text)]',
        className,
      )}
    >
      <span className="relative z-[3] inline-flex items-center gap-1.5">{children}</span>
    </motion.button>
  )
}
