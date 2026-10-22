import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { cn, springs } from '../lib/utils'

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  icon: LucideIcon
  label: string
  size?: number
  iconSize?: number
  variant?: 'pill' | 'solid' | 'well' | 'ghost'
  active?: boolean
  badge?: boolean
}

/** Circular glass control. `solid` = white disc with dark glyph (settings / active states). */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, size = 46, iconSize, variant = 'pill', active, badge, className, style, ...rest },
  ref,
) {
  const isSolid = variant === 'solid' || active
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileHover={{ y: -1, scale: 1.04 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className={cn(
        'relative grid shrink-0 cursor-pointer place-items-center rounded-full outline-none',
        variant !== 'ghost' && 'glass',
        variant === 'pill' && !active && 'glass-pill text-white/85 hover:text-white',
        variant === 'well' && !active && 'glass-well text-white/80 hover:text-white',
        variant === 'ghost' && !active && 'text-white/70 transition-colors hover:bg-white/10 hover:text-white',
        isSolid && 'glass glass-solid',
        className,
      )}
      style={{ width: size, height: size, ...style }}
      {...rest}
    >
      <Icon size={iconSize ?? Math.round(size * 0.4)} strokeWidth={1.6} className="relative z-[3]" />
      {badge && (
        <span className="absolute right-[22%] top-[22%] z-[3] h-2 w-2 rounded-full bg-lime-glow shadow-[0_0_8px_var(--accent)]" />
      )}
    </motion.button>
  )
})
