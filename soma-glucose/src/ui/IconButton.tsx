import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { cn, springs } from '../lib/utils'

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon
  label: string
  size?: number
  iconSize?: number
  /** pill = frosted white, ink = solid black, smoke = on dark glass */
  variant?: 'pill' | 'ink' | 'smoke'
  badge?: boolean
}

/** Circular glass control. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 40, iconSize, variant = 'pill', badge, className, style, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className={cn(
        'glass relative grid shrink-0 cursor-pointer place-items-center rounded-full outline-none',
        variant === 'pill' && 'glass-pill text-[var(--ink)]',
        variant === 'ink' && 'glass-ink',
        variant === 'smoke' && 'glass-well dark text-white/85 hover:text-white',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <Icon size={iconSize ?? Math.round(size * 0.4)} strokeWidth={1.6} className="relative z-[3]" />
      {badge && <span className="absolute right-[24%] top-[24%] z-[3] h-[7px] w-[7px] rounded-full bg-volt ring-2 ring-white" />}
    </motion.button>
  )
})
