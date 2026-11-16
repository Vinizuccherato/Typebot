import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { cn } from '../../lib/utils'

/** Telemetry-style corner brackets framing a region (decorative). */
export function Brackets({ className, size = 18, delay = 0.2, color = 'var(--lilac)' }: { className?: string; size?: number; delay?: number; color?: string }) {
  const corners = [
    { pos: 'left-0 top-0', d: `M0 ${size} V0 H${size}` },
    { pos: 'right-0 top-0', d: `M0 0 H${size} V${size}` },
    { pos: 'left-0 bottom-0', d: `M0 0 V${size} H${size}` },
    { pos: 'right-0 bottom-0', d: `M${size} 0 V${size} H0` },
  ]
  return (
    <div aria-hidden className={cn('pointer-events-none absolute', className)}>
      {corners.map((c, i) => (
        <motion.svg
          key={i}
          width={size}
          height={size}
          viewBox={`-1 -1 ${size + 2} ${size + 2}`}
          className={cn('absolute', c.pos)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ delay: delay + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <path d={c.d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </motion.svg>
      ))}
    </div>
  )
}

/** Faint construction geometry (thin lines + nodes) drawn in on mount. */
export function Construction({ className, delay = 0.4, opacity = 0.35 }: { className?: string; delay?: number; opacity?: number }) {
  const lines = [
    'M30 40 L196 150 L362 40',
    'M196 150 L196 520',
    'M70 330 H322',
    'M110 230 L196 150 L282 230',
  ]
  const nodes: [number, number][] = [
    [196, 150],
    [70, 330],
    [322, 330],
    [110, 230],
    [282, 230],
    [196, 520],
  ]
  return (
    <svg aria-hidden viewBox="0 0 393 560" className={cn('pointer-events-none absolute', className)} style={{ opacity }}>
      {lines.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="var(--lilac)"
          strokeWidth="0.75"
          strokeDasharray="2 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: delay + i * 0.12, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.rect
          key={i}
          x={x - 3}
          y={y - 3}
          width={6}
          height={6}
          fill="none"
          stroke="var(--champagne)"
          strokeWidth="0.9"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.5 + i * 0.08 }}
        />
      ))}
    </svg>
  )
}

/** Small floating glass pill (metric callouts). */
export function GlassChip({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('glass glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold', className)}>
      {icon && <span className="relative z-[3] text-[var(--lilac)]">{icon}</span>}
      <span className="relative z-[3] tabular">{children}</span>
    </span>
  )
}

/** On-device privacy promise (RESEARCH.md: state it in the flow, up front). */
export function PrivacyLine({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start justify-center gap-1.5 text-center text-[12px] leading-[1.45] text-[var(--text-3)]', className)}>
      <Lock size={12} className="mt-[2px] shrink-0 text-[var(--champagne)]" aria-hidden />
      <span>Photos are analysed on your device and never leave it unless you choose.</span>
    </p>
  )
}
