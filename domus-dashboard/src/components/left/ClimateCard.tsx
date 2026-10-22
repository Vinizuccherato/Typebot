import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion, useSpring, useTransform } from 'motion/react'
import { Flame, Leaf, RefreshCw, Snowflake, ThermometerSun, Wind, type LucideIcon } from 'lucide-react'
import { TEMP_MAX, TEMP_MIN, useDomus, type ClimateMode } from '../../store'
import { Glass } from '../../ui/Glass'
import { Chip } from '../../ui/Chip'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'

/* Dial geometry (design px).
   Reference: lit counter-clockwise from 12 o'clock around the left side to a knob at the
   bottom-right; a 60° gap at the top-right holds the "% HR" chip. */
const SIZE = 200
const C = SIZE / 2
const R = 82
const TUBE = 10
const SWEEP = 300 // degrees, counter-clockwise from 12 o'clock
const STEP = 0.5
/** The ring reads as a thermometer on a 0–30°C scale; the target is limited to TEMP_MIN–TEMP_MAX. */
const SCALE_MIN = 0
const SCALE_MAX = 30
const RANGE = SCALE_MAX - SCALE_MIN

interface ModeDef {
  id: ClimateMode
  label: string
  icon: LucideIcon
  /** accent (list, readout) */
  color: string
  /** tube gradient start → end */
  tube: [string, string]
  /** knob sphere: highlight, body, shade */
  sphere: [string, string, string]
}

const MODES: ModeDef[] = [
  { id: 'auto', label: 'Auto', icon: RefreshCw, color: '#c6ef8e', tube: ['#e9f9cf', '#a6d27c'], sphere: ['#f3ffe0', '#b5e27a', '#7fa95a'] },
  { id: 'cold', label: 'Cold', icon: Snowflake, color: '#9fd3e6', tube: ['#e3f5fb', '#86c0d6'], sphere: ['#effaff', '#9fd3e6', '#5f97ab'] },
  { id: 'warm', label: 'Warm', icon: Flame, color: '#f2b36b', tube: ['#fde8cc', '#e8a35c'], sphere: ['#fff1de', '#f2b36b', '#b97a3a'] },
  { id: 'eco', label: 'Eco', icon: Leaf, color: '#b5e27a', tube: ['#e2f7c8', '#8cc46a'], sphere: ['#eefde0', '#9fd67e', '#5e9449'] },
]

/** Point at `ccw` degrees counter-clockwise from 12 o'clock. */
const polar = (ccw: number, r = R) => {
  const a = (ccw * Math.PI) / 180
  return { x: C - r * Math.sin(a), y: C - r * Math.cos(a) }
}

/** Counter-clockwise arc from 12 o'clock spanning `span` degrees. */
const arcPath = (span: number, r = R) => {
  const s = clamp(span, 0.01, 359.9)
  const a = polar(0, r)
  const b = polar(s, r)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${s > 180 ? 1 : 0} 0 ${b.x} ${b.y}`
}

const toT = (v: number) => clamp((v - SCALE_MIN) / RANGE, 0, 1)
const T_MIN = toT(TEMP_MIN)
const T_MAX = toT(TEMP_MAX)
const snap = (v: number) => Math.round(v / STEP) * STEP
const fade = { duration: 0.6 }

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

  const arc = useTransform(t, (v) => arcPath(v * SWEEP))
  const arcInner = useTransform(t, (v) => arcPath(v * SWEEP, R - 2.2))
  const kx = useTransform(t, (v) => polar(v * SWEEP).x)
  const ky = useTransform(t, (v) => polar(v * SWEEP).y)

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
      active.current = Math.hypot(dx, dy) > 0.3
      if (active.current) setDragging(true)
    }
    if (!active.current) return
    if (p.phase === 'end') {
      active.current = false
      setDragging(false)
      return
    }
    const cw = (Math.atan2(dx, -dy) * 180) / Math.PI // clockwise from 12, -180..180
    const ccw = (((-cw) % 360) + 360) % 360 // counter-clockwise from 12, 0..360
    let nt: number
    if (ccw <= SWEEP) nt = ccw / SWEEP
    else nt = ccw < SWEEP + (360 - SWEEP) / 2 ? 1 : lastT.current // inside the top-right gap
    // never wrap across the gap (30°C ↔ 0°C)
    if (Math.abs(nt - lastT.current) > 0.6) nt = lastT.current
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

  const dotR = R + TUBE / 2 + 8
  const valuePt = polar(toT(climate.target) * SWEEP, dotR)
  const curPt = polar(toT(climate.current) * SWEEP, dotR)

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
          <linearGradient id={`tube-${uid}`} gradientUnits="userSpaceOnUse" x1={C - R * 0.2} y1={C - R} x2={C + R * 0.55} y2={C + R}>
            <motion.stop offset="0" initial={false} animate={{ stopColor: mode.tube[0] }} transition={fade} />
            <motion.stop offset="1" initial={false} animate={{ stopColor: mode.tube[1] }} transition={fade} />
          </linearGradient>
          <radialGradient id={`hub-${uid}`} cx="50%" cy="30%" r="75%">
            <stop offset="0" stopColor="rgb(255 255 255 / 0.05)" />
            <stop offset="1" stopColor="rgb(0 0 0 / 0.14)" />
          </radialGradient>
          <filter id={`blur-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* recessed hub */}
        <circle cx={C} cy={C} r={64} fill="rgb(0 0 0 / 0.12)" />
        <circle cx={C} cy={C} r={64} fill={`url(#hub-${uid})`} stroke="rgb(255 255 255 / 0.07)" />

        {/* track */}
        <path d={arcPath(SWEEP)} fill="none" stroke="rgb(0 0 0 / 0.2)" strokeWidth={TUBE} strokeLinecap="round" />
        <path d={arcPath(SWEEP, R + TUBE / 2)} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="1" />

        {/* faint dot ticks — 1°C steps on the 0–30 scale; the settable band brightens while dragging */}
        {Array.from({ length: RANGE + 1 }, (_, v) => {
          const pt = polar((v / RANGE) * SWEEP, dotR)
          const settable = v >= TEMP_MIN
          const major = v % 5 === 0
          return (
            <motion.circle
              key={v}
              cx={pt.x}
              cy={pt.y}
              initial={{ r: major ? 1.4 : 1 }}
              animate={{
                r: major ? 1.4 : 1,
                opacity: dragging && settable ? (v <= climate.target ? 0.9 : 0.5) : major ? 0.38 : 0.2,
              }}
              transition={{ duration: 0.25 }}
              fill="white"
            />
          )
        })}
        {/* current reading */}
        <circle cx={curPt.x} cy={curPt.y} r="2.4" fill="white" opacity="0.9" />
        {/* exact set-point while dragging */}
        <motion.circle
          cx={valuePt.x}
          cy={valuePt.y}
          initial={{ r: 2.6, opacity: 0 }}
          animate={{ r: 2.6, opacity: dragging ? 1 : 0 }}
          fill={mode.color}
        />

        {/* glow + tube + specular */}
        <motion.path d={arc} fill="none" stroke={`url(#tube-${uid})`} strokeWidth={TUBE + 8} strokeLinecap="round" opacity="0.4" filter={`url(#blur-${uid})`} />
        <motion.path d={arc} fill="none" stroke={`url(#tube-${uid})`} strokeWidth={TUBE} strokeLinecap="round" />
        <motion.path d={arcInner} fill="none" stroke="rgb(255 255 255 / 0.4)" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* HR chip sits in the top-right gap, under the knob */}
      {chip}

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 overflow-visible">
        <defs>
          <radialGradient id={`sphere-${uid}`} cx="35%" cy="30%" r="75%" fx="35%" fy="30%">
            <motion.stop offset="0" initial={false} animate={{ stopColor: mode.sphere[0] }} transition={fade} />
            <motion.stop offset="0.55" initial={false} animate={{ stopColor: mode.sphere[1] }} transition={fade} />
            <motion.stop offset="1" initial={false} animate={{ stopColor: mode.sphere[2] }} transition={fade} />
          </radialGradient>
        </defs>
        <motion.g style={{ x: kx, y: ky }}>
          <motion.circle
            initial={{ r: 21, opacity: 0.16, scale: 1 }}
            animate={{ r: 21, fill: mode.color, opacity: dragging ? 0.3 : 0.16, scale: dragging ? 1.2 : 1 }}
            transition={springs.soft}
          />
          <motion.circle
            initial={{ r: 13, scale: 1 }}
            animate={{ r: 13, scale: dragging ? 1.12 : 1 }}
            transition={springs.bouncy}
            fill={`url(#sphere-${uid})`}
            stroke="rgb(255 255 255 / 0.55)"
            strokeWidth="0.75"
            style={{ filter: 'drop-shadow(0 3px 6px rgb(0 0 0 / 0.35))' }}
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
              <div className="mt-1.5 text-[11px] text-white/60">Set target</div>
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
              <div className="mt-1.5 text-[11px] text-white/60">
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
              'group relative flex h-[34px] w-full max-w-[100px] cursor-pointer items-center gap-2 rounded-full pl-[5px] pr-3 text-left text-[13px] outline-none transition-colors duration-300',
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
          <div className="relative -ml-[8px] mt-[4px]">
            <Dial
              chip={
                <div className="pointer-events-none absolute left-[114px] top-[13px]">
                  <Chip icon={Wind} size="sm" variant="pill" title="Relative humidity">
                    <AnimatedNumber value={humidity} />% HR
                  </Chip>
                </div>
              }
            />
          </div>
          <div className="flex min-w-[92px] flex-1 flex-col items-start pt-[30px]">
            <ModeList />
          </div>
        </div>
      </Glass>
    </MotionConfig>
  )
}
