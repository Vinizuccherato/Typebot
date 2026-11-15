import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useSoma, type MetricId } from '../../store'
import { RANGE_HIGH, RANGE_LOW, SLOTS, slotLabel } from '../../lib/glucose'
import { springs } from '../../lib/utils'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel, smoothPath } from './kit'

const W = 860
const H = 260
const LO = 40
const HI = 230
const y = (v: number) => H - ((v - LO) / (HI - LO)) * H

const CHIPS: { id: MetricId; label: string }[] = [
  { id: 'glucose', label: 'Glucose' },
  { id: 'hemoglobin', label: 'Hba1c' },
  { id: 'ketones', label: 'Ketones' },
  { id: 'cholesterol', label: 'Cholesterol' },
]

const TITLES = { glucose: 'Continuous glucose', metabolic: 'Continuous glucose', score: 'Score breakdown', cholesterol: 'Lipid panel' } as const

/** Full-day CGM trace with the 70–140 target band and scrubbing. */
function Trace() {
  const series = useSoma((s) => s.series)
  const now = useSoma((s) => s.now)
  const [hover, setHover] = useState<number | null>(null)
  const { past, future } = useMemo(() => {
    const step = 2 // 144 vertices is plenty for a smooth curve at this width
    const pts = (from: number, to: number) => {
      const out: [number, number][] = []
      for (let i = from; i <= to; i += step) out.push([(i / (SLOTS - 1)) * W, y(series[i])])
      return out
    }
    return { past: smoothPath(pts(0, now)), future: now < SLOTS - 1 ? smoothPath(pts(now, SLOTS - 1)) : '' }
  }, [series, now])
  const i = hover ?? now
  const cx = (i / (SLOTS - 1)) * W

  return (
    <div
      className="relative cursor-crosshair outline-none"
      tabIndex={0}
      role="img"
      aria-label="Glucose readings over 24 hours. Arrow keys inspect readings."
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setHover(Math.max(0, Math.min(now, Math.round(((e.clientX - r.left) / r.width) * (SLOTS - 1)))))
      }}
      onPointerLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? now) - 3))
        if (e.key === 'ArrowRight') setHover((h) => Math.min(now, (h ?? now) + 3))
      }}
      onBlur={() => setHover(null)}
    >
      <svg width="100%" viewBox={`0 0 ${W} ${H + 22}`} className="block overflow-visible">
        <defs>
          <linearGradient id="ex-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dcec55" stopOpacity="0.28" />
            <stop offset="1" stopColor="#dcec55" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y={y(RANGE_HIGH)} width={W} height={y(RANGE_LOW) - y(RANGE_HIGH)} fill="white" fillOpacity="0.06" rx="6" />
        {[RANGE_LOW, RANGE_HIGH, 180].map((v) => (
          <g key={v}>
            <line x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="white" strokeOpacity={v === 180 ? 0.08 : 0.2} strokeDasharray="3 4" />
            <text x={W + 6} y={y(v) + 3} fontSize="10" fill="white" fillOpacity="0.45">{v}</text>
          </g>
        ))}
        {Array.from({ length: 9 }, (_, k) => (
          <text key={k} x={(k / 8) * W} y={H + 18} fontSize="10" fill="white" fillOpacity="0.45" textAnchor={k === 0 ? 'start' : k === 8 ? 'end' : 'middle'}>
            {String(k * 3).padStart(2, '0')}:00
          </text>
        ))}
        <motion.path d={`${past} L ${(now / (SLOTS - 1)) * W} ${H} L 0 ${H} Z`} fill="url(#ex-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={past} fill="none" stroke="white" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
        {future && <path d={future} fill="none" stroke="white" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="2 5" />}
        <line x1={cx} x2={cx} y1="0" y2={H} stroke="white" strokeOpacity="0.3" />
        <circle cx={cx} cy={y(series[i])} r="10" fill="#dcec55" opacity="0.25" />
        <circle cx={cx} cy={y(series[i])} r="4.5" fill="#dcec55" stroke="#1d1d1c" strokeWidth="1.5" />
      </svg>
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[var(--ink)] tabular shadow-lg"
        style={{ left: `${(cx / W) * 100}%`, top: `calc(${(y(series[i]) / (H + 22)) * 100}% - 14px)` }}
      >
        {slotLabel(i)} · {series[i]} mg/dl{hover === null ? ' · now' : ''}
      </div>
    </div>
  )
}

function ScoreBreakdown() {
  const score = useSoma((s) => s.score)
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      {score.parts.map((p) => (
        <div key={p.id} className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <span className="text-[11px] text-white/55">{p.label}</span>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedNumber value={p.value} className="text-[26px] font-light" />
            <span className="text-[11px] text-white/40">/{p.max}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-[#dcec55]" initial={{ width: 0 }} animate={{ width: `${(p.value / p.max) * 100}%` }} transition={springs.soft} />
          </div>
        </div>
      ))}
    </div>
  )
}

function LipidPanel() {
  const c = useSoma((s) => s.cholesterol)
  const total = useSoma((s) => s.metrics.cholesterol.value)
  const rows: [string, number, string][] = [
    ['Total', total, '< 200'],
    ['LDL', c.ldl, '< 100'],
    ['HDL', c.hdl, '≥ 50'],
    ['Days logged', c.daysLogged, `of ${c.ofDays}`],
  ]
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
      {rows.map(([k, v, t]) => (
        <div key={k} className="rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
          <span className="text-[11px] text-white/55">{k}</span>
          <div className="mt-1 flex items-baseline gap-1">
            <AnimatedNumber value={v} className="text-[26px] font-light" />
            <span className="text-[11px] text-white/40">{t}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Overlay: the tapped card grows into a large smoked-glass analysis panel. */
export function ExpandedCard() {
  const expanded = useSoma((s) => s.expanded)
  const setExpanded = useSoma((s) => s.setExpanded)
  const metric = useSoma((s) => s.metric)
  const setMetric = useSoma((s) => s.setMetric)
  const stats = useSoma((s) => s.stats)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const [origin, setOrigin] = useState('50% 50%')

  useEffect(() => {
    if (!expanded) return
    returnFocus.current = document.activeElement as HTMLElement
    const slot = document.querySelector(`[data-slot="${expanded === 'score' ? 'score calculation' : expanded}"]`)
    if (slot) {
      const r = slot.getBoundingClientRect()
      setOrigin(`${r.left + r.width / 2}px ${r.top + r.height / 2}px`)
    }
    const t = window.setTimeout(() => closeRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(null)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      returnFocus.current?.focus?.()
    }
  }, [expanded, setExpanded])

  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          key="ex"
          className="fixed inset-0 z-50 grid place-items-center"
          style={{ transformOrigin: origin }}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.4 }}
          transition={springs.soft}
        >
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            className="absolute inset-0 cursor-default bg-black/20"
            onClick={() => setExpanded(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div style={{ transform: 'scale(var(--s))' }}>
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={TITLES[expanded]}
            className="glass glass-smoke on-dark relative rounded-[32px]"
            style={{ width: 960, maxWidth: 'calc((100vw - 32px) / var(--s))', maxHeight: 'calc((100dvh - 32px) / var(--s))', overflowY: 'auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="relative z-[3] flex flex-col gap-5 p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardLabel className="text-white/60">{TITLES[expanded]}</CardLabel>
                  <div className="mt-2 flex items-baseline gap-2">
                    <AnimatedNumber value={stats.current} className="text-[56px] font-light leading-none tracking-[-0.03em]" />
                    <span className="text-[13px] text-white/55">mg/dl · {stats.trend}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div role="tablist" aria-label="Metric" className="flex flex-wrap gap-1.5">
                    {CHIPS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        role="tab"
                        aria-selected={metric === c.id}
                        onClick={() => setMetric(c.id)}
                        className={`relative cursor-pointer rounded-full px-3 py-1.5 text-[12px] outline-none transition-colors ${metric === c.id ? 'text-[var(--ink)]' : 'text-white/70 hover:text-white'}`}
                      >
                        {metric === c.id && <motion.span layoutId="ex-chip" className="absolute inset-0 rounded-full bg-[#dcec55]" transition={springs.snappy} />}
                        <span className="relative">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    ref={closeRef}
                    type="button"
                    aria-label="Close panel"
                    onClick={() => setExpanded(null)}
                    className="grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/10 text-white outline-none ring-1 ring-white/15 transition-colors hover:bg-white/20"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                {[
                  ['In range', `${stats.timeInRange}%`],
                  ['Average', `${stats.avg}`],
                  ['Lowest', `${stats.min}`],
                  ['Highest', `${stats.max}`],
                  ['Variability', `${stats.cv}% CV`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
                    <span className="text-[11px] text-white/50">{k}</span>
                    <div className="tabular mt-0.5 text-[20px] font-light">{v}</div>
                  </div>
                ))}
              </div>

              <div className="pr-7">
                <Trace />
              </div>

              {expanded === 'score' && <ScoreBreakdown />}
              {expanded === 'cholesterol' && <LipidPanel />}
            </div>
          </motion.section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
