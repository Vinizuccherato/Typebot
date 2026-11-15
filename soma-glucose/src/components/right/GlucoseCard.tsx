import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSoma, type Metric } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel, ExpandButton, Tip, smoothPath, useScrub } from './kit'

const H = 104
const PAD_Y = 14

/** Centred moving average — the "trend" curve that weaves with the readings. */
const smooth = (s: number[], k = 3) => s.map((_, i) => {
  let sum = 0
  let n = 0
  for (let j = i - k; j <= i + k; j++) if (s[j] !== undefined) (sum += s[j], n++)
  return sum / n
})

/** Container width in unscaled CSS px (offsetWidth is immune to the artboard transform). */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null)
  const [w, setW] = useState(fallback)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.offsetWidth || fallback))
    ro.observe(el)
    setW(el.offsetWidth || fallback)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, w] as const
}

function Chart({ metric, nowHour }: { metric: Metric; nowHour: number }) {
  const { index, handlers } = useScrub(24)
  const [box, W] = useWidth<HTMLDivElement>(264)
  const { readings, trend, xs } = useMemo(() => {
    // soften meal spikes so the two traces read as calm interwoven waves (as in the reference)
    const s = smooth(metric.series, 1)
    const t = smooth(metric.series, 4)
    // exaggerate the trend's counter-phase a touch so the two lines interweave like the reference
    const mean = s.reduce((a, b) => a + b, 0) / s.length
    const t2 = t.map((v, i) => mean + (v - mean) * 0.55 + Math.sin(i / 2.2) * (Math.max(...s) - Math.min(...s)) * 0.12)
    const sd = Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / s.length) || 1
    const lo = mean - sd * 2.2
    const span = sd * 4.4
    const squash = (v: number) => lo + span / 2 + (span / 2) * Math.tanh((v - (lo + span / 2)) / (span / 2))
    const xs = s.map((_, i) => (i / (s.length - 1)) * W)
    const ys = (arr: number[]) => arr.map((v) => PAD_Y + (1 - (squash(v) - lo) / span) * (H - PAD_Y * 2))
    return { readings: ys(s), trend: ys(t2), xs }
  }, [metric.series, W])

  const rPts = readings.map((y, i) => [xs[i], y] as [number, number])
  const tPts = trend.map((y, i) => [xs[i], y] as [number, number])
  const cur = Math.min(23, nowHour)
  const hi = index ?? cur

  return (
    <div
      ref={box}
      className="relative mt-auto cursor-crosshair outline-none"
      tabIndex={0}
      role="img"
      aria-label={`${metric.name} over the last 24 hours. Use arrow keys to inspect each hour.`}
      {...handlers}
    >
      <svg width={W} height={H + 18} viewBox={`0 0 ${W} ${H + 18}`} className="block overflow-visible">
        <defs>
          <linearGradient id="gc-read" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.35" />
            <stop offset="0.6" stopColor="white" stopOpacity="0.95" />
            <stop offset="1" stopColor="#dcec55" />
          </linearGradient>
          <filter id="gc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* faint vertical grid */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={(i / 8) * W} x2={(i / 8) * W} y1={4} y2={H} stroke="white" strokeOpacity={0.07} strokeDasharray="2 3" />
        ))}
        <motion.path
          key={`t-${metric.id}`}
          d={smoothPath(tPts)}
          fill="none"
          stroke="white"
          strokeOpacity="0.38"
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.path
          key={`r-${metric.id}`}
          d={smoothPath(rPts)}
          fill="none"
          stroke="url(#gc-read)"
          strokeWidth="1.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* sparse dots on both curves, like the reference */}
        {rPts.map(([x, y], i) => (i % 4 === 2 ? <circle key={`rd${i}`} cx={x} cy={y} r="1.8" fill="white" fillOpacity="0.85" /> : null))}
        {tPts.map(([x, y], i) => (i % 4 === 0 ? <circle key={`td${i}`} cx={x} cy={y} r="1.5" fill="white" fillOpacity="0.4" /> : null))}
        {/* scrub / now */}
        <line x1={xs[hi]} x2={xs[hi]} y1={4} y2={H} stroke="white" strokeOpacity={index === null ? 0.16 : 0.4} />
        <circle cx={xs[hi]} cy={readings[hi]} r="7" fill="#dcec55" opacity="0.6" filter="url(#gc-glow)" />
        <circle cx={xs[hi]} cy={readings[hi]} r="3.4" fill="#dcec55" stroke="#1a1a19" strokeWidth="1.2" />
        {['00', '06', '12', '18', '24'].map((l, i) => (
          <text key={l} x={(i / 4) * W} y={H + 15} fill="white" fillOpacity="0.52" fontSize="9.5" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>
            {l}
          </text>
        ))}
      </svg>
      {index !== null && (
        <Tip x={xs[index]} y={readings[index]}>
          {String(index).padStart(2, '0')}:00 · {metric.series[index].toFixed(metric.decimals)} {metric.unit}
        </Tip>
      )}
    </div>
  )
}

export function GlucoseCard() {
  const metric = useSoma((s) => s.metrics[s.metric])
  const now = useSoma((s) => s.now)
  const signal = useSoma((s) => s.sensor.signal)
  const setExpanded = useSoma((s) => s.setExpanded)
  const live = signal === 'connected'

  return (
    <Glass variant="smoke" radius={26} specular={0.8} className="on-dark h-full w-full overflow-hidden">
      {/* volt light bloom, top-right — the sensor's glow caught in the glass */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-[130px] w-[130px] rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(238 248 140 / 0.95), rgb(220 236 85 / 0.55) 45%, rgb(220 236 85 / 0) 100%)', filter: 'blur(6px)' }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative z-[3] flex h-full flex-col px-[18px] pb-[14px] pt-[16px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={metric.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
                <CardLabel className="text-white/85">{metric.id === 'hemoglobin' ? 'Hba1c' : metric.name}</CardLabel>
              </motion.span>
            </AnimatePresence>
            <span className="flex items-center gap-1 text-[10.5px] text-white/60">
              <span className="relative grid h-2 w-2 place-items-center">
                {live && <span className="absolute inset-0 animate-ping rounded-full bg-[#dcec55]/70" />}
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-[#dcec55]' : 'bg-white/40'}`} />
              </span>
              {live ? 'Active' : 'Paused'}
            </span>
          </div>
          <ExpandButton label={`Expand ${metric.name}`} onClick={() => setExpanded('glucose')} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={metric.id}
            className="mt-3"
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-baseline gap-1.5">
              <AnimatedNumber value={metric.value} decimals={metric.decimals} className="text-[44px] font-light leading-none tracking-[-0.03em]" />
              <span className="text-[12px] text-white/60">{metric.unit}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/55">
              <span className={`h-1 w-3 rounded-full ${metric.value < metric.low || metric.value > metric.high ? 'bg-[#f3b25b]' : 'bg-[#dcec55]'}`} />
              {metric.status}
            </div>
          </motion.div>
        </AnimatePresence>

        <Chart metric={metric} nowHour={Math.floor(now / 12)} />
      </div>
    </Glass>
  )
}
