import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowDown, Layers2 } from 'lucide-react'
import { useDomus } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { clamp, springs } from '../../lib/utils'

const CHART_H = 74 // svg height (design px)
const BASE_Y = 66 // dotted baseline
const TOP_Y = 6
const INSET = 15 // label half-width so 00:00 / 24:00 centre on the ends
const PEAK = 0.75 // hours at/above this are hatched — morning & evening peaks dominate

const fmtHour = (h: number) => `${String(h).padStart(2, '0')}:00`

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(236)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.offsetWidth)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function useCurrentHour() {
  const [h, setH] = useState(() => new Date().getHours())
  useEffect(() => {
    const id = window.setInterval(() => setH(new Date().getHours()), 60_000)
    return () => window.clearInterval(id)
  }, [])
  return h
}

function StepChart({ onHover }: { onHover?: (h: number | null) => void }) {
  const series = useDomus((s) => s.energy.series)
  const [wrapRef, W] = useWidth<HTMLDivElement>()
  const [hover, setHoverState] = useState<number | null>(null)
  const setHover = (h: number | null) => {
    setHoverState(h)
    onHover?.(h)
  }
  const nowH = useCurrentHour()
  const uid = useId().replace(/:/g, '')

  const x0 = INSET
  const x1 = Math.max(W - INSET, x0 + 10)
  const max = Math.max(...series, 1)
  const X = (i: number) => x0 + (i / 24) * (x1 - x0)
  const Y = (v: number) => BASE_Y - (v / max) * (BASE_Y - TOP_Y)

  const { line, blocks, stems } = useMemo(() => {
    let d = `M ${X(0)} ${Y(series[0])}`
    for (let i = 0; i < 24; i++) d += ` H ${X(i + 1)} V ${Y(series[i + 1])}`
    // consecutive peak hours merge into one stepped, outlined block
    const blocks: { d: string; from: number; to: number }[] = []
    const stems: { x: number; y: number }[] = []
    for (let i = 0; i < 24; i++) {
      if (series[i] >= PEAK) {
        let j = i
        while (j + 1 < 24 && series[j + 1] >= PEAK) j++
        let bd = `M ${X(i)} ${BASE_Y} V ${Y(series[i])}`
        for (let k = i; k <= j; k++) bd += ` H ${X(k + 1)}${k < j ? ` V ${Y(series[k + 1])}` : ''}`
        bd += ` V ${BASE_Y} Z`
        blocks.push({ d: bd, from: i, to: j + 1 })
        i = j
      } else if (i % 2 === 1) stems.push({ x: (X(i) + X(i + 1)) / 2, y: Y(series[i]) })
    }
    return { line: d, blocks, stems }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, W])

  const scrubFrom = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect()
    const px = ((clientX - r.left) / r.width) * W
    setHover(clamp(Math.round(((px - x0) / (x1 - x0)) * 24), 0, 24))
  }

  const onKey = (e: React.KeyboardEvent) => {
    const cur = hover ?? nowH
    let n: number | null = null
    if (e.key === 'ArrowRight') n = cur + (e.shiftKey ? 6 : 1)
    else if (e.key === 'ArrowLeft') n = cur - (e.shiftKey ? 6 : 1)
    else if (e.key === 'Home') n = 0
    else if (e.key === 'End') n = 24
    else if (e.key === 'Escape') {
      setHover(null)
      return
    }
    if (n !== null) {
      e.preventDefault()
      setHover(clamp(n, 0, 24))
    }
  }

  const hv = hover !== null ? series[hover] : null

  return (
    <div
      ref={wrapRef}
      className="relative w-full rounded-[10px] outline-none"
      tabIndex={0}
      role="group"
      aria-label="Hourly energy usage. Use left and right arrows to inspect hours."
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
    >
      <svg
        width={W}
        height={CHART_H}
        viewBox={`0 0 ${W} ${CHART_H}`}
        className="block overflow-visible"
        onPointerMove={(e) => scrubFrom(e.clientX, e.currentTarget)}
        onPointerDown={(e) => scrubFrom(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}
        style={{ touchAction: 'pan-y' }}
      >
        <defs>
          <pattern id={`hatch-${uid}`} width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4.5" stroke="rgb(255 255 255 / 0.7)" strokeWidth="1.3" />
          </pattern>
          <radialGradient id={`glow-${uid}`}>
            <stop offset="0" stopColor="#c6ef8e" stopOpacity="0.9" />
            <stop offset="1" stopColor="#c6ef8e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* stems */}
        {stems.map((s, i) => (
          <motion.line
            key={`s${i}`}
            x1={s.x}
            x2={s.x}
            y1={s.y + 3}
            y2={BASE_Y - 3}
            stroke="rgb(255 255 255 / 0.2)"
            strokeWidth="1"
            strokeDasharray="1 2.6"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.03, duration: 0.5 }}
          />
        ))}

        {/* hatched peak blocks */}
        {blocks.map((b, k) => (
          <motion.g
            key={`b${b.from}`}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: hover === null || (hover >= b.from && hover <= b.to) ? 1 : 0.5, scaleY: 1 }}
            transition={{ ...springs.soft, delay: 0.35 + k * 0.08 }}
            style={{ originY: 1, transformBox: 'fill-box' }}
          >
            <path d={b.d} fill="rgb(255 255 255 / 0.07)" />
            <path d={b.d} fill={`url(#hatch-${uid})`} stroke="white" strokeWidth="1" strokeLinejoin="miter" />
          </motion.g>
        ))}

        {/* dotted baseline */}
        <line
          x1={x0 - 6}
          x2={x1 + 6}
          y1={BASE_Y + 4}
          y2={BASE_Y + 4}
          stroke="rgb(255 255 255 / 0.32)"
          strokeWidth="1.2"
          strokeDasharray="0.1 3.4"
          strokeLinecap="round"
        />
        {Array.from({ length: 25 }, (_, i) => (
          <circle
            key={`t${i}`}
            cx={X(i)}
            cy={BASE_Y + 4}
            r={i % 6 === 0 ? 1.6 : 0.9}
            fill={i % 6 === 0 ? 'rgb(255 255 255 / 0.75)' : 'rgb(255 255 255 / 0.35)'}
          />
        ))}

        {/* step line */}
        <motion.path
          d={line}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />

        {/* live "now" marker */}
        {hover === null && (
          <g transform={`translate(${X(nowH)} ${Y(series[nowH])})`}>
            <motion.circle
              r={3}
              fill="none"
              stroke="#c6ef8e"
              strokeWidth="1.2"
              initial={{ r: 3, scale: 1, opacity: 0.7 }}
              animate={{ r: 3, scale: [1, 3.4], opacity: [0.7, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', originX: 0.5, originY: 0.5 }}
            />
            <circle r="3" fill="#c6ef8e" />
          </g>
        )}

        {/* scrub guide */}
        {hover !== null && hv !== null && (
          <g>
            <line x1={X(hover)} x2={X(hover)} y1={TOP_Y - 4} y2={BASE_Y + 4} stroke="rgb(255 255 255 / 0.45)" strokeWidth="1" />
            <circle cx={X(hover)} cy={Y(hv)} r="9" fill={`url(#glow-${uid})`} />
            <circle cx={X(hover)} cy={Y(hv)} r="3.2" fill="#0c0c0b" stroke="#c6ef8e" strokeWidth="1.6" />
          </g>
        )}
      </svg>

      <span className="sr-only" aria-live="polite">
        {hover !== null && hv !== null ? `${fmtHour(hover)}, ${hv.toFixed(2)} kilowatt hours` : ''}
      </span>

      {/* hour labels */}
      <div className="relative mt-1.5 h-[14px] text-[11px] text-white/45">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h} className="tabular absolute top-0 -translate-x-1/2 leading-none" style={{ left: X(h) }}>
            {fmtHour(h)}
          </span>
        ))}
      </div>
    </div>
  )
}

export function EnergyCard() {
  const energy = useDomus((s) => s.energy)
  const delta = energy.deltaVsYesterday
  const [hover, setHover] = useState<number | null>(null)

  return (
    <MotionConfig reducedMotion="user">
      <Glass
        variant="ink"
        radius={28}
        specular={0.9}
        className="flex h-full w-full flex-col px-[22px] pb-[14px] pt-[20px]"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springs.glide, delay: 0.25 }}
      >
        <div className="relative z-[3] flex items-start gap-3">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-white/[0.08] text-white/90 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_1px_0_rgb(255_255_255/0.12)]">
            <Layers2 size={17} strokeWidth={1.6} />
          </span>
          <div className="min-w-0 pt-[1px]">
            <h2 className="m-0 text-[17px] font-normal leading-[1.1] text-white">Energy Usage</h2>
            <span className="mt-[6px] inline-flex h-[20px] items-center gap-1.5 rounded-full bg-white/[0.08] pl-[3px] pr-2 text-[10.5px] text-white/70 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
              <span className="grid h-[14px] w-[14px] place-items-center rounded-full bg-white/12 text-lime-glow">
                <ArrowDown size={9} strokeWidth={2.4} />
              </span>
              <span className="tabular">{delta}% vs ayer</span>
            </span>
          </div>
        </div>

        <div className="relative z-[3] mt-[18px] flex items-baseline gap-1">
          <AnimatedNumber
            key={hover !== null ? 'hour' : 'today'}
            value={hover !== null ? energy.series[hover] : energy.today}
            decimals={hover !== null ? 2 : 1}
            stiffness={hover !== null ? 420 : 180}
            className="text-[50px] font-light leading-none tracking-[-0.025em] text-white"
          />
          <span className="text-[15px] font-light text-white/80">kWh</span>
          <AnimatePresence>
            {hover !== null && (
              <motion.span
                key="at"
                className="ml-1.5 rounded-full bg-white/[0.08] px-2 py-[2px] text-[11px] tabular text-white/65"
                initial={{ opacity: 0, x: -6, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -4, filter: 'blur(4px)', transition: { duration: 0.15 } }}
                transition={springs.snappy}
              >
                {fmtHour(hover)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-[3] mt-auto">
          <StepChart onHover={setHover} />
        </div>
      </Glass>
    </MotionConfig>
  )
}
