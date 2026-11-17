import { forwardRef, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn, springs } from '../lib/utils'

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  /** primary = porcelain capsule (56pt), secondary = glass capsule, ghost = text */
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'lg' | 'md'
  icon?: ReactNode
}

/** Capsule CTA — 56pt primary per RESEARCH.md, 44pt minimum hit area for every size. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, variant = 'primary', size = 'lg', icon, className, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={springs.snappy}
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] outline-none disabled:cursor-not-allowed disabled:opacity-40',
        size === 'lg' ? 'h-14 px-7 text-[16px]' : 'h-11 px-5 text-[14px]',
        variant === 'primary' && 'glass glass-ink',
        variant === 'secondary' && 'glass glass-pill text-[var(--text)]',
        variant === 'ghost' && 'text-[var(--text-2)] hover:text-[var(--text)]',
        className,
      )}
      {...rest}
    >
      <span className="relative z-[3] inline-flex items-center gap-2">
        {children}
        {icon}
      </span>
    </motion.button>
  )
})
