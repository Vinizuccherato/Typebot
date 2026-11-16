import { useId, useRef } from 'react'
import { motion } from 'motion/react'
import { cn, springs } from '../../lib/utils'

export interface SegOption<T extends string> {
  id: T
  label: string
}

/** Glass segmented control — sliding porcelain pill, roving radiogroup (←/→). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = 'md',
}: {
  options: SegOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  className?: string
  size?: 'md' | 'sm'
}) {
  const pill = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const i = Math.max(0, options.findIndex((o) => o.id === value))
  return (
    <div role="radiogroup" aria-label={label} className={cn('glass glass-pill relative flex rounded-full p-1', className)}>
      {options.map((o, k) => {
        const on = k === i
        return (
          <button
            key={o.id}
            ref={(el) => void (refs.current[k] = el)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              const n = (k + d + options.length) % options.length
              onChange(options[n].id)
              refs.current[n]?.focus()
            }}
            className={cn(
              'relative z-[3] flex flex-1 cursor-pointer items-center justify-center rounded-full font-semibold outline-none transition-colors',
              size === 'md' ? 'h-10 px-3 text-[13.5px]' : 'h-9 px-3 text-[12.5px]',
              on ? 'text-[var(--color-ink)]' : 'text-[var(--text-2)] hover:text-[var(--text)]',
            )}
          >
            {on && <motion.span layoutId={pill} className="absolute inset-0 rounded-full bg-[var(--color-porcelain)]" transition={springs.snappy} />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
