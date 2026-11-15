import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Smile } from 'lucide-react'
import { useFace } from '../../store'
import { Glass } from '../../ui/Glass'
import { springs } from '../../lib/utils'
import { useArtboard } from '../../layout/Artboard'

/** Hourly activity minutes for today — a plausible day shape (deterministic). */
const ACTIVITY = Array.from({ length: 24 }, (_, h) => {
  const walk = 22 * Math.exp(-Math.pow((h - 8) / 1.1, 2)) + 30 * Math.exp(-Math.pow((h - 18) / 1.3, 2))
  const day = h >= 7 && h <= 22 ? 6 + ((h * 7) % 5) : 0
  return Math.round(walk + day)
})

/** General Fitness — "Active" status and an hourly activity strip with scrubbing. */
export function GeneralFitness() {
  const gfi = useFace((s) => s.vitals.gfi)
  const [hover, setHover] = useState<number | null>(null)
  const compact = useArtboard().mode === 'compact'
  const now = new Date().getHours()
  const max = useMemo(() => Math.max(...ACTIVITY), [])
  const total = ACTIVITY.slice(0, now + 1).reduce((a, b) => a + b, 0)
  const shown = hover ?? now
  const status = gfi >= 70 ? 'Active' : gfi >= 45 ? 'Moderate' : 'Resting'

  const barsEl = (
    <div
      className={`flex items-end gap-[3px] ${compact ? 'h-[36px]' : 'mt-auto h-[58px]'}`}
      role="slider"
      tabIndex={0}
      aria-label="Activity by hour"
      aria-valuemin={0}
      aria-valuemax={23}
      aria-valuenow={shown}
      aria-valuetext={`${String(shown).padStart(2, '0')}:00, ${ACTIVITY[shown]} active minutes`}
      onPointerLeave={() => setHover(null)}
      onBlur={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? now) - 1))
        if (e.key === 'ArrowRight') setHover((h) => Math.min(23, (h ?? now) + 1))
      }}
    >
      {ACTIVITY.map((m, h) => {
        const future = h > now
        const on = h === shown
        return (
          <motion.span
            key={h}
            onPointerEnter={() => setHover(h)}
            className="relative flex-1 rounded-full"
            initial={{ height: 3 }}
            animate={{ height: Math.max(3, (m / max) * (compact ? 36 : 58)), opacity: future ? 0.25 : 1 }}
            transition={{ ...springs.soft, delay: h * 0.015 }}
            style={{
              background: on ? 'linear-gradient(180deg, #c8ffe2, #2f9e74)' : 'rgb(255 255 255 / 0.22)',
              boxShadow: on ? '0 0 12px rgb(143 240 192 / 0.5)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
  const pillEl = (
    <span className={`glass glass-pill inline-flex ${compact ? '' : 'mt-auto'} w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white`}>
      <span className="relative z-[3] h-1.5 w-1.5 rounded-full bg-[var(--mint)] shadow-[0_0_8px_var(--mint)]" />
      <span className="relative z-[3]">{status}</span>
    </span>
  )

  if (compact) {
    return (
      <Glass variant="smoke" radius={24} className="flex h-full w-full flex-col gap-2.5 px-4 py-3.5">
        <div className="relative z-[3] flex items-center gap-2">
          <Smile size={15} strokeWidth={1.7} className="shrink-0 text-white/85" />
          <h2 className="truncate text-[14px] text-white">General Fitness</h2>
        </div>
        <div className="relative z-[3]">{barsEl}</div>
        <div className="relative z-[3] mt-auto flex items-center justify-between">
          {pillEl}
          <span className="tabular text-[11px] text-white/55">{total} min</span>
        </div>
      </Glass>
    )
  }

  return (
    <Glass variant="smoke" radius={24} className="flex h-full w-full gap-4 px-5 py-4">
      <div className="relative z-[3] flex min-w-[124px] flex-col">
        <div className="flex items-center gap-2.5">
          <Smile size={16} strokeWidth={1.7} className="text-white/85" />
          <h2 className="text-[15px] text-white">General Fitness</h2>
        </div>
        {pillEl}
      </div>

      <div className="relative z-[3] flex min-w-0 flex-1 flex-col">
        <p className="flex items-baseline justify-between text-[11px] text-white/50">
          <span className="tabular">{hover === null ? 'Today' : `${String(shown).padStart(2, '0')}:00`}</span>
          <span className="tabular">
            <span className="text-[13px] text-white">{hover === null ? total : ACTIVITY[shown]}</span> {hover === null ? 'active min today' : 'active min'}
          </span>
        </p>
        {barsEl}
      </div>
    </Glass>
  )
}
