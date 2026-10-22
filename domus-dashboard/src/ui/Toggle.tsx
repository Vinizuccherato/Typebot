import { motion } from 'motion/react'
import { cn, springs } from '../lib/utils'

export interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}

/** iOS-grade switch: liquid knob that stretches while travelling. */
export function Toggle({ checked, onChange, label, size = 'md', className }: ToggleProps) {
  const w = size === 'sm' ? 40 : 48
  const h = size === 'sm' ? 22 : 26
  const k = h - 6
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('glass glass-well relative shrink-0 cursor-pointer rounded-full p-0 outline-none', className)}
      style={{ width: w, height: h }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 z-[1] rounded-full"
        initial={false}
        animate={{ opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: 'linear-gradient(90deg, rgb(140 178 104 / 0.55), rgb(198 239 142 / 0.85))',
          boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.25), 0 0 14px rgb(198 239 142 / 0.35)',
        }}
      />
      <motion.span
        aria-hidden
        className="absolute top-[3px] z-[3] rounded-full bg-white"
        initial={false}
        animate={{ left: checked ? w - k - 3 : 3 }}
        whileTap={{ width: k + 6 }}
        transition={springs.bouncy}
        style={{
          width: k,
          height: k,
          boxShadow: '0 2px 6px rgb(0 0 0 / 0.35), inset 0 -1px 1px rgb(0 0 0 / 0.08)',
        }}
      />
    </button>
  )
}
