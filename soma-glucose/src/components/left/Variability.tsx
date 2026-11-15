import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useSoma } from '../../store'
import { slotLabel } from '../../lib/glucose'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardHead, Corner } from './parts'

const N = 36
const STEP = 8 // 36 × 8 slots = 24 h
const R0 = 38

const label = (s: number) => (s >= 80 ? 'Consistent' : s >= 60 ? 'Moderate' : 'Variable')

/** Radial dot chart: each dot is a 40-min sample, pushed out/in by its deviation from the day's mean. */
export function Variability() {
  const series = useSoma((s) => s.series)
  const now = useSoma((s) => s.now)
  const avg = useSoma((s) => s.stats.avg)
  const stability = useSoma((s) => s.stats.stability)
  const cv = useSoma((s) => s.stats.cv)
  const toast = useSoma((s) => s.toast)
  const [hover, setHover] = useState<number | null>(null)

  const dots = useMemo(
    () =>
      Array.from({ length: N }, (_, k) => {
        const slot = k * STEP
        const v = series[slot]
        const dev = (v - avg) / avg
        const a = (k / N) * Math.PI * 2 - Math.PI / 2
        const r = R0 + Math.max(-8, Math.min(9, dev * 42))
        return { k, slot, v, x: 60 + Math.cos(a) * r, y: 60 + Math.sin(a) * r, hot: Math.abs(dev) > 0.22, past: slot <= now }
      }),
    [series, now, avg],
  )
  const hv = hover !== null ? dots[hover] : null

  return (
    <Glass variant="frost" radius={24} specular={0.6} className="flex h-full w-full flex-col px-[16px] pb-[14px] pt-[15px]">
      <CardHead
        label="Variability"
        right={<Corner label="Variability details" onClick={() => toast({ title: `Variability ${stability}/100`, detail: `${label(stability)} · coefficient of variation ${cv}%` })} />}
      />
      <div className="relative z-[3] mx-auto mt-1 aspect-square w-full max-w-[124px] flex-1">
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full overflow-visible">
          <circle cx={60} cy={60} r={R0} fill="none" stroke="rgb(18 18 18 / 0.1)" strokeDasharray="1.5 3" />
          <path d="M57 60h6M60 57v6" stroke="rgb(18 18 18 / 0.35)" strokeWidth={1} />
          <motion.g
            animate={hover === null ? { rotate: 360 } : undefined}
            transition={{ duration: 120, ease: 'linear', repeat: Infinity }}
          >
            {dots.map((d) => (
              <motion.circle
                key={d.k}
                initial={false}
                animate={{ cx: d.x, cy: d.y, r: hover === d.k ? 3.6 : d.hot ? 2.6 : 1.7 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: d.k * 0.006 }}
                fill={!d.past ? 'rgb(18 18 18 / 0.14)' : d.hot ? 'var(--volt)' : 'var(--ink)'}
                stroke={d.hot && d.past ? 'var(--ink)' : 'none'}
                strokeWidth={0.8}
                onPointerEnter={() => d.past && setHover(d.k)}
                onPointerLeave={() => setHover(null)}
                style={{ cursor: d.past ? 'pointer' : 'default' }}
              />
            ))}
          </motion.g>
        </svg>
        {hv && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="flex flex-col items-center leading-tight">
              <span className="text-[13px] font-medium tabular">{hv.v}</span>
              <span className="text-[9.5px] text-[var(--ink-3)] tabular">{slotLabel(hv.slot)}</span>
            </span>
          </div>
        )}
      </div>
      <div className="relative z-[3] mt-1 flex items-end gap-2">
        <AnimatedNumber value={stability} className="text-[30px] font-light leading-none tracking-[-0.03em]" />
        <span className="pb-[3px] text-[11px] text-[var(--ink-2)]">{label(stability)}</span>
      </div>
    </Glass>
  )
}
