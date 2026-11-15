import { useState } from 'react'
import { motion } from 'motion/react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel, ExpandButton, polar } from './kit'

const WHY: Record<string, string> = {
  tir: 'Readings inside 70–140 mg/dl',
  stability: 'Low variability across the day',
  recovery: 'Overnight return to baseline',
  activity: 'Movement blunting meal spikes',
}

const TICKS = 17
const GW = 78
const GR = 32

/** One semicircular tick gauge per score component. */
function PartGauge({ label, value, max, hot, onHover, active }: { label: string; value: number; max: number; hot: boolean; onHover: (on: boolean) => void; active: boolean }) {
  const lit = Math.round((value / max) * TICKS)
  const cx = GW / 2
  const cy = 40
  return (
    <div
      className="relative flex min-w-0 flex-1 cursor-default flex-col items-center outline-none"
      tabIndex={0}
      role="img"
      aria-label={`${label}: ${value} of ${max} points`}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
    >
      <svg width="100%" viewBox={`0 0 ${GW} 46`} className="max-w-[104px] overflow-visible">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = 180 + (i / (TICKS - 1)) * 180
          const [x1, y1] = polar(cx, cy, GR - 7, a)
          const [x2, y2] = polar(cx, cy, GR, a)
          const on = i < lit
          return (
            <motion.line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth={on ? 2 : 1.4}
              strokeLinecap="round"
              initial={{ stroke: 'rgba(255,255,255,0.14)' }}
              animate={{ stroke: on ? (hot ? '#dcec55' : 'rgba(255,255,255,0.9)') : 'rgba(255,255,255,0.14)' }}
              transition={{ delay: i * 0.025, duration: 0.25 }}
            />
          )
        })}
        {hot && <circle cx={cx} cy={cy - 2} r="10" fill="#dcec55" opacity="0.18" />}
      </svg>
      <span className="-mt-[30px] text-[19px] font-light tabular">
        <AnimatedNumber value={value} />
      </span>
      <span className={`mt-1.5 text-[10px] transition-colors ${active ? 'text-white' : 'text-white/60'}`}>{label}</span>
    </div>
  )
}

export function ScoreCalc() {
  const score = useSoma((s) => s.score)
  const setExpanded = useSoma((s) => s.setExpanded)
  const [hover, setHover] = useState<string | null>(null)
  const strongest = score.parts.reduce((a, b) => (b.value / b.max > a.value / a.max ? b : a))
  const hovered = score.parts.find((p) => p.id === hover)

  return (
    <Glass variant="smoke" radius={26} specular={0.7} className="on-dark h-full w-full overflow-hidden">
      {/* light pooling at the bottom edge, as in the reference */}
      <div aria-hidden className="pointer-events-none absolute -bottom-16 left-1/2 h-[120px] w-[220px] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.55), transparent)', filter: 'blur(10px)' }} />
      <div className="relative z-[3] flex h-full flex-col justify-between px-[18px] pb-[12px] pt-[16px]">
        <div>
        <div className="flex items-center justify-between gap-3">
          <CardLabel className="text-white/85">Score calculation</CardLabel>
          <span className="ml-auto flex items-baseline gap-1">
            <AnimatedNumber value={score.total} className="text-[26px] font-light leading-none tracking-[-0.02em]" />
            <span className="text-[10.5px] text-white/55">/100</span>
          </span>
          <ExpandButton label="Expand score breakdown" onClick={() => setExpanded('score')} />
        </div>
        <motion.p key={hovered?.id ?? 'none'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="-mt-1 text-[11px] text-white/60">
          {hovered ? `${hovered.label}: ${WHY[hovered.id]} · ${hovered.value}/${hovered.max}` : 'Metabolic score from four signals — hover a gauge'}
        </motion.p>
        </div>
        <div className="flex items-end gap-2">
          {score.parts.map((p) => (
            <PartGauge key={p.id} label={p.label} value={p.value} max={p.max} hot={p.id === strongest.id} active={hover === p.id} onHover={(on) => setHover(on ? p.id : null)} />
          ))}
        </div>
      </div>
    </Glass>
  )
}
