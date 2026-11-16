import { motion } from 'motion/react'
import { AnimatedNumber } from './AnimatedNumber'

/** Gradient score ring (Soma/ring-app gauge lineage). `value` 0–100. */
export function ScoreRing({ value, size = 120, stroke = 8, label, sub }: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2
  const id = `sr-${size}-${stroke}`
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Score'} ${value} of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--lilac)" />
            <stop offset="1" stopColor="var(--champagne)" />
          </linearGradient>
          <filter id={`${id}-glow`}>
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          filter={`url(#${id}-glow)`}
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ type: 'spring', stiffness: 50, damping: 16 }}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ type: 'spring', stiffness: 50, damping: 16 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <AnimatedNumber value={value} className="display block text-[30px] leading-none" />
          {sub && <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-3)]">{sub}</span>}
        </div>
      </div>
    </div>
  )
}
