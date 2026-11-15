import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSoma } from '../../store'
import { RANGE_HIGH, RANGE_LOW } from '../../lib/glucose'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardHead, Tip } from './parts'
import { useSize } from './useSize'

const Y_MIN = 60
const BUCKET = 2 // hours per candle
const TICKS = [180, 140, 100, 70]
const AXIS_W = 26
const X_H = 16

const status = (score: number) => (score >= 85 ? 'Great' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Low')
const caption = (score: number) =>
  score >= 85 ? 'Stable, well-balanced day' : score >= 70 ? 'Mostly steady with a few swings' : 'Noticeable swings today'

export function MetabolicScore() {
  const series = useSoma((s) => s.series)
  const now = useSoma((s) => s.now)
  const avg = useSoma((s) => s.stats.avg)
  const total = useSoma((s) => s.score.total)
  const tab = useSoma((s) => s.tab)
  const date = useSoma((s) => s.date)
  const [chartRef, { w, h }] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const hours = useMemo(
    () =>
      Array.from({ length: 24 / BUCKET }, (_, b) => {
        const hr = b * BUCKET
        const from = hr * 12
        const to = Math.min(from + 12 * BUCKET, now + 1)
        if (to <= from) return null
        const v = series.slice(from, to)
        return { hr, min: Math.min(...v), max: Math.max(...v), mean: Math.round(v.reduce((a, b) => a + b, 0) / v.length) }
      }),
    [series, now],
  )
  const nowHour = Math.floor(now / 12 / BUCKET)
  const LAST = 24 / BUCKET - 1

  const plotW = Math.max(0, w - AXIS_W)
  const plotH = Math.max(0, h - X_H)
  const x = (i: number) => 8 + (i / LAST) * (plotW - 16)
  // fixed 60–180 scale (as in the reference), widened only if the day peaks higher
  const yMax = Math.max(180, ...hours.map((c) => (c ? c.max + 10 : 0)))
  const y = (v: number) => 4 + (1 - (Math.min(yMax, Math.max(Y_MIN, v)) - Y_MIN) / (yMax - Y_MIN)) * (plotH - 8)

  const pick = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const local = ((clientX - r.left) / r.width) * w
    const hr = Math.round(((local - 8) / Math.max(1, plotW - 16)) * LAST)
    setHover(Math.max(0, Math.min(nowHour, hr)))
  }
  const hv = hover !== null ? hours[hover] : null
  const st = status(total)

  return (
    <Glass variant="frost" radius={24} specular={0.6} className="flex h-full w-full flex-col px-[18px] pb-[14px] pt-[16px]">
      <CardHead
        label="Metabolic score"
        meta={
          <>
            · <AnimatedNumber value={avg} /> avg
          </>
        }
        right={
          <span className="glass glass-pill flex h-[24px] items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium">
            <span className="relative z-[3] h-[7px] w-[7px] rounded-full bg-volt shadow-[0_0_0_2px_rgb(220_236_85/0.35)]" />
            <span className="relative z-[3]">{st}</span>
          </span>
        }
      />

      <div className="relative z-[3] mt-2 flex items-end gap-1.5">
        <AnimatedNumber value={total} className="text-[40px] font-light leading-[0.9] tracking-[-0.03em]" />
        <span className="pb-[3px] text-[12px] text-[var(--ink-2)]">/100</span>
        <span className="mb-[3px] ml-auto max-w-[150px] truncate text-right text-[11px] text-[var(--ink-3)]">{caption(total)}</span>
      </div>

      <div
        ref={chartRef}
        role="img"
        tabIndex={0}
        aria-label={`Two-hour glucose ranges. ${hv ? `${String(hv.hr).padStart(2, '0')}:00 average ${hv.mean}, range ${hv.min} to ${hv.max} mg/dl` : 'Use arrow keys to inspect periods.'}`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
          e.preventDefault()
          setHover((v) => Math.max(0, Math.min(nowHour, (v ?? nowHour) + (e.key === 'ArrowRight' ? 1 : -1))))
        }}
        onBlur={() => setHover(null)}
        className="relative z-[3] mt-2 min-h-0 flex-1 cursor-crosshair rounded-[10px] outline-none"
      >
        {w > 0 && (
          <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
            {/* target band */}
            <rect x={0} y={y(RANGE_HIGH)} width={plotW} height={y(RANGE_LOW) - y(RANGE_HIGH)} fill="rgb(18 18 18 / 0.025)" />
            {[RANGE_LOW, RANGE_HIGH].map((v) => (
              <line key={v} x1={0} x2={plotW} y1={y(v)} y2={y(v)} stroke="rgb(18 18 18 / 0.28)" strokeDasharray="2 3" />
            ))}
            {/* y axis */}
            {TICKS.filter((t) => t <= yMax).map((t) => (
              <text key={t} x={w - 2} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill="rgb(18 18 18 / 0.45)" className="tabular">
                {t}
              </text>
            ))}
            {/* x axis */}
            {[0, 3, 6, 9, 11].map((i) => (
              <text key={i} x={x(i)} y={h - 2} textAnchor="middle" fontSize="9.5" fill="rgb(18 18 18 / 0.45)" className="tabular">
                {String(i * BUCKET).padStart(2, '0')}
              </text>
            ))}
            {/* hover guide */}
            {hv && <line x1={x(hover!)} x2={x(hover!)} y1={0} y2={plotH} stroke="rgb(18 18 18 / 0.18)" />}
            {/* candles */}
            <g key={`${tab}-${date}`}>
              {hours.map((c, i) => {
                const cx = x(i)
                if (!c) return <circle key={i} cx={cx} cy={y(100)} r={1.1} fill="rgb(18 18 18 / 0.16)" />
                const isNow = i === nowHour
                const dim = hover !== null && hover !== i
                return (
                  <motion.g
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: dim ? 0.35 : 1, y: 0 }}
                    transition={{ delay: hover === null ? i * 0.018 : 0, duration: 0.35 }}
                  >
                    <motion.line
                      x1={cx}
                      x2={cx}
                      initial={false}
                      animate={{ y1: y(c.max), y2: y(c.min) }}
                      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                      stroke={isNow ? '#9fb127' : 'rgb(18 18 18 / 0.42)'}
                      strokeWidth={isNow ? 2.2 : 1.6}
                      strokeLinecap="round"
                    />
                    <motion.circle
                      cx={cx}
                      initial={false}
                      animate={{ cy: y(c.mean), r: isNow ? 3.8 : 2.6 }}
                      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                      fill={isNow ? 'var(--volt)' : 'var(--ink)'}
                      stroke={isNow ? 'var(--ink)' : 'none'}
                      strokeWidth={1.4}
                    />
                  </motion.g>
                )
              })}
            </g>
            {/* live pulse */}
            {hours[nowHour] && !hv && (
              <circle cx={x(nowHour)} cy={y(hours[nowHour]!.mean)} r={4} fill="none" stroke="var(--volt)" strokeWidth={1.5}>
                <animate attributeName="r" values="4;10" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
          </svg>
        )}
        <AnimatePresence>
          {hv && (
            <motion.div
              key="tip"
              className="absolute -top-1 -translate-x-1/2 -translate-y-full"
              style={{ left: Math.min(Math.max(x(hover!), 70), plotW - 60) }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Tip>
                {String(hv.hr).padStart(2, '0')}–{String(hv.hr + BUCKET).padStart(2, '0')}h · avg {hv.mean} · {hv.min}–{hv.max}
              </Tip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Glass>
  )
}
