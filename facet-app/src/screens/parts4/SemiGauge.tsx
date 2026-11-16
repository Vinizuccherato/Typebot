import { motion } from 'motion/react'

/** Dense semicircular tick gauge (Soma lineage). value/min/max share a unit; band = ideal range. */
export function SemiGauge({ value, min, max, band, size = 120 }: { value: number; min: number; max: number; band?: [number, number]; size?: number }) {
  const r = size / 2 - 6
  const cx = size / 2
  const cy = size / 2 + 4
  const N = 33
  const t = (v: number) => Math.min(1, Math.max(0, (v - min) / (max - min)))
  const ang = (k: number) => Math.PI * (1 - k)
  const marker = ang(t(value))
  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`} aria-hidden>
      {Array.from({ length: N }, (_, i) => {
        const k = i / (N - 1)
        const a = ang(k)
        const v = min + k * (max - min)
        const inBand = band ? v >= band[0] && v <= band[1] : false
        const passed = k <= t(value)
        const r1 = r - (i % 4 === 0 ? 9 : 6)
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy - Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r}
            y2={cy - Math.sin(a) * r}
            stroke={passed ? (inBand ? 'var(--lilac)' : 'rgb(244 239 234 / 0.55)') : 'rgb(244 239 234 / 0.16)'}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        )
      })}
      <motion.circle
        r={4}
        fill="var(--champagne)"
        initial={false}
        animate={{ cx: cx + Math.cos(marker) * (r + 1), cy: cy - Math.sin(marker) * (r + 1) }}
        transition={{ type: 'spring', stiffness: 80, damping: 16 }}
        style={{ filter: 'drop-shadow(0 0 4px rgb(232 203 168 / 0.8))' }}
      />
    </svg>
  )
}
