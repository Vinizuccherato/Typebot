import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn, springs } from '../lib/utils'
import { useSpecular } from '../lib/useSpecular'

/** Multi-select glass card (quiz answers). */
export function SelectCard({ selected, onToggle, icon, title, hint }: { selected: boolean; onToggle: () => void; icon: ReactNode; title: string; hint?: string }) {
  const spec = useSpecular<HTMLButtonElement>(1)
  return (
    <motion.button
      ref={spec.ref}
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      className={cn('glass glass-frost relative flex min-h-[112px] cursor-pointer flex-col items-start justify-between rounded-[22px] p-4 text-left outline-none')}
      style={selected ? { ['--g-edge-a' as string]: 'rgb(195 180 255 / 0.9)', ['--g-fill-a' as string]: 'rgb(195 180 255 / 0.16)' } : undefined}
    >
      <span className="relative z-[3] grid h-10 w-10 place-items-center rounded-full bg-white/8 text-[var(--text)]">{icon}</span>
      <span className="relative z-[3]">
        <span className="block text-[15px] font-semibold">{title}</span>
        {hint && <span className="block text-[12px] text-[var(--text-3)]">{hint}</span>}
      </span>
      <motion.span
        aria-hidden
        className="absolute right-3 top-3 z-[3] grid h-6 w-6 place-items-center rounded-full"
        initial={false}
        animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0, backgroundColor: 'var(--lilac)' }}
        transition={springs.bouncy}
      >
        <Check size={14} strokeWidth={2.6} className="text-[var(--color-ink)]" />
      </motion.span>
    </motion.button>
  )
}
