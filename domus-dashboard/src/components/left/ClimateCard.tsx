import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useSpring, useTransform } from 'motion/react'
import { Flame, Leaf, RefreshCw, Snowflake, ThermometerSun, Wind, type LucideIcon } from 'lucide-react'
import { TEMP_MAX, TEMP_MIN, useDomus, type ClimateMode } from '../../store'
import { Glass } from '../../ui/Glass'
import { Chip } from '../../ui/Chip'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'

/* Dial geometry (design px) */
const SIZE = 184
const C = SIZE / 2
const R = 74
const START = -135 // degrees, clockwise from 12 o'clock
const SWEEP = 270
const STEP = 0.5
/** The ring reads as a thermometer on a 0–30°C scale; the target is limited to TEMP_MIN–TEMP_MAX. */
const SCALE_MIN = 0
const SCALE_MAX = 30
const RANGE = SCALE_MAX - SCALE_MIN

const MODES: { id: ClimateMode; label: string; icon: LucideIcon; color: string; dim: string }[] = [
  { id: 'auto', label: 'Auto', icon: RefreshCw, color: '#c2e89c', dim: '#7d9a62' },
  { id: 'cold', label: 'Cold', icon: Snowflake, color: '#9fd3e6', dim: '#5d8796' },
  { id: 'warm', label: 'Warm', icon: Flame, color: '#f2b36b', dim: '#9c6b3a' },
  { id: 'eco', label: 'Eco', icon: Leaf, color: '#c6ef8e', dim: '#6d8f52' },
]

const polar = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) }
}

const arcPath = (from: number, to: number, r = R) => {
  const span = Math.max(0.01, to - from)
  const a = polar(from, r)
  const b = polar(from + span, r)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
}

const toT = (v: number) => clamp((v - SCALE_MIN) / RANGE, 0, 1)
const T_MIN = toT(TEMP_MIN)
const T_MAX = toT(TEMP_MAX)
const snap = (v: number) => Math.round(v / STEP) * STEP

function Dial({ chip }: { chip?: React.ReactNode }) {
  const climate = useDomus((s) => s.climate)
  const setTarget = useDomus((s) => s.setClimateTarget)
  const mode = MODES.find((m) => m.id === climate.mode) ?? MODES[0]
  const uid = useId().replace(/:/g, '')

  const [dragging, setDragging] = useState(false)
  const lastT = useRef(toT(climate.target))
  const active = useRef(false)

  const t = useSpring(toT(climate.target), { stiffness: 320, damping: 32, mass: 0.7 })
  useEffect(() => {
    t.set(toT(climate.target))
    lastT.current = toT(climate.target)
  }, [t, climate.target])

  const arc = useTransform(t, (v) => arcPath(START, START + v * SWEEP))
  const kx = useTransform(t, (v) => polar(START + v * SWEEP).x)
  const ky = useTransform(t, (v) => polar(START + v * SWEEP).y)

  const commit = (v: number) => {
    const next = clamp(snap(v), TEMP_MIN, TEMP_MAX)
    if (next !== useDomus.getState().climate.target) {
      setTarget(next)
      navigator.vibrate?.(4)
    }
  }

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    const dx = p.x - 0.5
    const dy = p.y - 0.5
    if (p.phase === 'start') {
      // ignore presses in the hub — only the ring is grabbable
      active.current = Math.hypot(dx, dy) > 0.27
      if (active.current) setDragging(true)
    }
    if (!active.current) return
    if (p.phase === 'end') {
      active.current = false
      setDragging(false)
      return
    }
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI // -180..180, 0 = top
    let nt: number
    if (deg >= START && deg <= START + SWEEP) nt = (deg - START) / SWEEP
    else nt = lastT.current > 0.75 ? 1 : T_MIN // dead zone at the bottom
    // no wrap-around jumps across the gap
    if (Math.abs(nt - lastT.current) > 0.6) nt = lastT.current > 0.75 ? 1 : T_MIN
    nt = clamp(nt, T_MIN, T_MAX)
    lastT.current = nt
    commit(SCALE_MIN + nt * RANGE)
  })

  // Wheel (non-passive so the page doesn't scroll)
  useEffect(() => {
    const el = drag.ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const cur = useDomus.getState().climate.target
      commit(cur + (e.deltaY < 0 ? STEP : -STEP))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKey = (e: React.KeyboardEvent) => {
    const cur = climate.target
    const map: Record<string, number> = {
      ArrowUp: STEP,
      ArrowRight: STEP,
      ArrowDown: -STEP,
      ArrowLeft: -STEP,
      PageUp: 2,
      PageDown: -2,
    }
    if (e.key in map) {
      e.preventDefault()
      commit(cur + map[e.key] * (e.shiftKey ? 2 : 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      commit(TEMP_MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      commit(TEMP_MAX)
    }
  }

  // ticks cover the settable band only (TEMP_MIN–TEMP_MAX)
  const ticks = (TEMP_MAX - TEMP_MIN) / STEP + 1
  const activeTick = Math.round((climate.target - TEMP_MIN) / STEP)
  const tickDeg = (i: number) => START + toT(TEMP_MIN + i * STEP) * SWEEP
  const curPt = polar(START + toT(climate.current) * SWEEP)

  return (
    <div
      ref={drag.ref}
      onPointerDown={drag.onPointerDown}
      onKeyDown={onKey}
      role="slider"
      tabIndex={0}
      aria-label="Comfort target temperature"
      aria-valuemin={TEMP_MIN}
      aria-valuemax={TEMP_MAX}
      aria-valuenow={climate.target}
      aria-valuetext={`Target ${climate.target.toFixed(1)} degrees, currently ${climate.current.toFixed(1)}`}
      className="group relative shrink-0 cursor-grab touch-none rounded-full outline-none active:cursor-grabbing"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 overflow-visible">
        <defs>
          <linearGradient id={`arc-${uid}`} gradientUnits="userSpaceOnUse" x1={polar(START).x} y1={polar(START).y} x2={C + R * 0.8} y2={C - R * 0.7}>
            <motion.stop offset="0" initial={false} animate={{ stopColor: mode.color }} transition={{ duration: 0.6 }} />
            <motion.stop offset="0.55" initial={false} animate={{ stopColor: mode.color }} transition={{ duration: 0.6 }} stopOpacity="0.8" />
            <motion.stop offset="1" initial={false} animate={{ stopColor: mode.dim }} transition={{ duration: 0.6 }} stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={`hub-${uid}`} cx="50%" cy="35%" r="70%">
            <stop offset="0" stopColor="rgb(255 255 255 / 0.07)" />
            <stop offset="1" stopColor="rgb(0 0 0 / 0.14)" />
          </radialGradient>
          <filter id={`blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* hub */}
        <circle cx={C} cy={C} r={R - 12} fill={`url(#hub-${uid})`} stroke="rgb(255 255 255 / 0.07)" />

        {/* track */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="1.6" />
        <path d={arcPath(START, START + SWEEP)} fill="none" stroke="rgb(0 0 0 / 0.18)" strokeWidth="6" strokeLinecap="round" />

        {/* ticks (visible while interacting) */}
        <motion.g initial={false} animate={{ opacity: dragging ? 1 : 0 }} transition={{ duration: 0.25 }} className="group-focus-visible:!opacity-100">
          {Array.from({ length: ticks }, (_, i) => {
            const deg = tickDeg(i)
            const major = i % 4 === 0
            const on = i === activeTick
            const a = polar(deg, R + 9)
            const b = polar(deg, R + (on ? 16 : major ? 13.5 : 12))
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={on ? mode.color : i <= activeTick ? 'rgb(255 255 255 / 0.55)' : 'rgb(255 255 255 / 0.22)'}
                strokeWidth={on ? 2 : 1}
                strokeLinecap="round"
              />
            )
          })}
        </motion.g>

        {/* glow + progress */}
        <motion.path d={arc} fill="none" stroke={`url(#arc-${uid})`} strokeWidth="12" strokeLinecap="round" opacity="0.55" filter={`url(#blur-${uid})`} />
        <motion.path d={arc} fill="none" stroke={`url(#arc-${uid})`} strokeWidth="5" strokeLinecap="round" />

        {/* current-temperature marker */}
        <circle cx={curPt.x} cy={curPt.y} r="2.2" fill="rgb(255 255 255 / 0.85)" />
      </svg>

      {/* HR chip floats on the ring, under the knob */}
      {chip}

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 overflow-visible">
        {/* knob */}
        <motion.g style={{ x: kx, y: ky }}>
          <motion.circle
            r={15}
            initial={{ r: 15, fill: mode.color, opacity: 0.16, scale: 1 }}
            animate={{ r: 15, fill: mode.color, opacity: dragging ? 0.28 : 0.16, scale: dragging ? 1.25 : 1 }}
            transition={springs.soft}
          />
          <motion.circle
            r={8.5}
            fill="white"
            initial={{ r: 8.5, stroke: mode.color, scale: 1 }}
            animate={{ r: 8.5, stroke: mode.color, scale: dragging ? 1.15 : 1 }}
            strokeWidth="3"
            transition={springs.bouncy}
            style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.35))' }}
          />
        </motion.g>
      </svg>

      {/* centre readout */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {dragging ? (
            <motion.div
              key="target"
              className="text-center"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
              transition={springs.snappy}
            >
              <div className="text-[40px] font-light leading-none tracking-[-0.02em]" style={{ color: mode.color }}>
                <AnimatedNumber value={climate.target} decimals={1} stiffness={400} />°
              </div>
              <div className="mt-1.5 text-[11px] text-white/55">Set target</div>
            </motion.div>
          ) : (
            <motion.div
              key="current"
              className="text-center"
              initial={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
              transition={springs.snappy}
            >
              <div className="pl-2 text-[42px] font-light leading-none tracking-[-0.025em] text-white">
                <AnimatedNumber value={climate.current} decimals={1} />°
              </div>
              <div className="mt-1.5 text-[11px] text-white/50">
                Target <span className="tabular">{climate.target.toFixed(1)}</span>°C
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ModeList() {
  const mode = useDomus((s) => s.climate.mode)
  const setMode = useDomus((s) => s.setClimateMode)
  const toast = useDomus((s) => s.toast)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const choose = (m: (typeof MODES)[number]) => {
    if (m.id === mode) return
    setMode(m.id)
    toast({ title: `${m.label} mode`, detail: 'Climate profile updated' })
  }

  return (
    <div role="radiogroup" aria-label="Climate mode" className="flex w-full flex-col gap-[6px]">
      {MODES.map((m, i) => {
        const on = m.id === mode
        const Icon = m.icon
        return (
          <button
            key={m.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => choose(m)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              const j = (i + d + MODES.length) % MODES.length
              choose(MODES[j])
              refs.current[j]?.focus()
            }}
            className={cn(
              'group relative flex h-[34px] w-[100px] cursor-pointer items-center gap-2 rounded-full pl-[5px] pr-3 text-left text-[13px] outline-none transition-colors duration-300',
              on ? 'text-white' : 'text-white/60 hover:text-white/90',
            )}
          >
            {on && (
              <motion.span
                layoutId="climate-mode"
                className="glass glass-pill absolute inset-0 rounded-full"
                transition={springs.snappy}
              />
            )}
            {!on && <span className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-300 group-hover:bg-white/[0.06]" />}
            <motion.span
              className="relative z-[3] grid h-[24px] w-[24px] place-items-center rounded-full border"
              initial={false}
              animate={{
                borderColor: on ? `${m.color}88` : 'rgba(255,255,255,0.16)',
                color: on ? m.color : 'rgba(255,255,255,0.65)',
                backgroundColor: on ? `${m.color}1f` : 'rgba(255,255,255,0)',
              }}
              transition={{ duration: 0.35 }}
            >
              <Icon size={12} strokeWidth={1.8} />
            </motion.span>
            <span className="relative z-[3]">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function ClimateCard() {
  const humidity = useDomus((s) => s.climate.humidity)
  return (
    <MotionConfig reducedMotion="user">
      <Glass
        variant="smoke"
        radius={30}
        specular={0.7}
        className="flex h-full w-full flex-col overflow-hidden px-[20px] pt-[20px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.glide, delay: 0.35 }}
      >
        <div className="relative z-[3] flex items-center gap-3">
          <span className="glass glass-pill grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-white/85">
            <ThermometerSun size={15} strokeWidth={1.6} className="relative z-[3]" />
          </span>
          <h2 className="m-0 text-[17px] font-normal leading-none text-white">Climate Control &amp; Comfort</h2>
        </div>

        <div className="relative z-[3] mt-[8px] flex flex-1 items-start gap-3">
          <div className="relative -ml-[6px] mt-[10px]">
            <Dial
              chip={
                <div className="pointer-events-none absolute left-[118px] top-[-2px]">
                  <Chip icon={Wind} size="sm" variant="pill" title="Relative humidity">
                    <AnimatedNumber value={humidity} />% HR
                  </Chip>
                </div>
              }
            />
          </div>
          <div className="flex min-w-[104px] flex-1 flex-col items-start pl-1 pt-[34px]">
            <ModeList />
          </div>
        </div>
      </Glass>
    </MotionConfig>
  )
}
