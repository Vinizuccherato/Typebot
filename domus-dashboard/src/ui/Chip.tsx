import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

export interface ChipProps {
  icon?: LucideIcon
  children: ReactNode
  className?: string
  variant?: 'pill' | 'well' | 'inset'
  size?: 'sm' | 'md'
  title?: string
}

/** Small glass label: "22.5°C", "Room-01", "48% Humidity"… */
export function Chip({ icon: Icon, children, className, variant = 'pill', size = 'md', title }: ChipProps) {
  return (
    <span
      title={title}
      className={cn(
        'glass inline-flex items-center gap-1.5 whitespace-nowrap rounded-full text-white/80',
        `glass-${variant}`,
        size === 'sm' ? 'h-7 px-2.5 text-[11.5px]' : 'h-8 px-3 text-[12.5px]',
        className,
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 13} strokeWidth={1.7} className="relative z-[3] text-white/70" />}
      <span className="relative z-[3] tabular">{children}</span>
    </span>
  )
}
