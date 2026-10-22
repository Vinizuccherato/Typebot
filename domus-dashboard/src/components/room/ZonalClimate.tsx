import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react'
import { Leaf, Minus, Plus, SlidersHorizontal, UserCheck } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { IconButton } from '../../ui/IconButton'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { Toggle } from '../../ui/Toggle'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'
import { TEMP_MAX, TEMP_MIN, useDomus, useSelectedRoom } from '../../store'

/* Gauge geometry — design px inside a 364×208 box (the card at reference size). */
const W = 364
const H = 208
const CX = 182
const CY = 219
const R = 157
const HALF = 47 // degrees each side of 12 o'clock
const TICKS = 71
const STEP = 0.5

const toRad = (deg: number) => (deg * Math.PI) / 180
const angleOf = (v: number) => -HALF + ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * HALF * 2
const valueOf = (deg: number) => TEMP_MIN + ((deg + HALF) / (HALF * 2)) * (TEMP_MAX - TEMP_MIN)
const pt = (deg: number, r = R) => [CX + r * Math.sin(toRad(deg)), CY - r * Math.cos(toRad(deg))] as const
const arcPath = (from: number, to: number, r = R) => {
  const [x1, y1] = pt(from, r)
  const [x2, y2] = pt(Math.max(to, from + 0.01), r)
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}
const snap = (v: number) => clamp(Math.round(v / STEP) * STEP, TEMP_MIN, TEMP_MAX)

const SCHEDULE = [
  { time: '06:30', label: 'Wake', temp: 22 },
  { time: '18:00', label: 'Evening', temp: 22.5 },
  { time: '23:00', label: 'Sleep', temp: 20.5 },
]

/** Press-and-hold auto-repeat with acceleration. */
function useAutoRepeat(fn: () => void) {
  const timer = useRef<number | undefined>(undefined)
  const stop = useCallback(() => window.clearTimeout(timer.current), [])
  const start = useCallback(() => {
    fn()
    let delay = 380
    const loop = () => {
      fn()
      delay = Math.max(55, delay * 0.78)
      timer.current = window.setTimeout(loop, delay)
    }
    timer.current = window.setTimeout(loop, delay)
  }, [fn])
  useEffect(() => stop, [stop])
  return { start, stop }
}

export function ZonalClimate() {
  const room = useSelectedRoom()
  const setRoomTarget = useDomus((s) => s.setRoomTarget)
  const eco = useDomus((s) => s.eco.active)
  const setEco = useDomus((s) => s.setEco)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [followOccupancy, setFollowOccupancy] = useState(true)
  const [dragging, setDragging] = useState(false)

  const target = room.target
  const set = useCallback((v: number) => setRoomTarget(room.id, snap(v)), [room.id, setRoomTarget])
  const nudge = useCallback((d: number) => set(useDomus.getState().rooms[room.id].target + d), [room.id, set])

  const plus = useAutoRepeat(useCallback(() => nudge(STEP), [nudge]))
  const minus = useAutoRepeat(useCallback(() => nudge(-STEP), [nudge]))

  /* animated arc */
  const angle = useSpring(angleOf(target), { stiffness: 210, damping: 28, mass: 0.8 })
  useEffect(() => angle.set(angleOf(target)), [angle, target])
  const bandD = useTransform(angle, (a) => arcPath(-HALF, a))
  const knobX = useTransform(angle, (a) => pt(a)[0])
  const knobY = useTransform(angle, (a) => pt(a)[1])
  const gradX2 = useTransform(angle, (a) => Math.max(pt(a)[0], pt(-HALF)[0] + 24))

  /* drag along the arc */
  const active = useRef(false)
  const drag = usePointerDrag<HTMLDivElement>((p) => {
    const x = (p.px / p.width) * W
    const y = (p.py / p.height) * H
    if (p.phase === 'start') {
      const dist = Math.hypot(x - CX, y - CY)
      active.current = Math.abs(dist - R) < 34 && y < CY - R * Math.cos(toRad(HALF)) + 26
      if (active.current) setDragging(true)
    }
    if (!active.current) return
    const deg = (Math.atan2(x - CX, CY - y) * 180) / Math.PI
    set(valueOf(clamp(deg, -HALF, HALF)))
    if (p.phase === 'end') {
      active.current = false
      setDragging(false)
    }
  })

  /* wheel (non-passive so the page never scrolls while tuning) */
  const wheelHost = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = wheelHost.current
    if (!el) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      acc += e.deltaY
      if (Math.abs(acc) >= 40) {
        nudge(acc < 0 ? STEP : -STEP)
        acc = 0
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [nudge])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowUp: STEP, ArrowRight: STEP, ArrowDown: -STEP, ArrowLeft: -STEP, PageUp: 2, PageDown: -2 }
    if (e.key in map) {
      e.preventDefault()
      nudge(map[e.key])
    } else if (e.key === 'Home') {
      e.preventDefault()
      set(TEMP_MIN)
    } else if (e.key === 'End') {
      e.preventDefault()
      set(TEMP_MAX)
    }
  }

  /* status */
  const diff = target - room.temperature
  const status =
    Math.abs(diff) < 0.15
      ? { tone: 'hold', text: `Holding ${room.temperature.toFixed(1)}°C` }
      : diff > 0
        ? { tone: 'heat', text: `Heating to ${target.toFixed(1)}°C · ~${Math.max(1, Math.round(Math.abs(diff) * 4))} min` }
        : { tone: 'cool', text: `Cooling to ${target.toFixed(1)}°C · ~${Math.max(1, Math.round(Math.abs(diff) * 4))} min` }

  const ticks = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, i) => {
        const deg = -HALF + (i / (TICKS - 1)) * HALF * 2
        const [x1, y1] = pt(deg, R - 9)
        const [x2, y2] = pt(deg, R + 9)
        return { deg, x1, y1, x2, y2, major: i % 7 === 0 }
      }),
    [],
  )
  const valueDeg = angleOf(target)

  /* close settings on outside click / Esc */
  const settingsRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!settingsOpen) return
    const onDown = (e: PointerEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setSettingsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSettingsOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [settingsOpen])

  const [startX] = pt(-HALF)

  return (
    <Glass variant="inset" radius={26} specular={0.6} className={cn('relative h-full w-full', settingsOpen && 'z-30')}>
      {/* label + status */}
      <div className="absolute left-[18px] top-[17px] z-[3]">
        <div className="text-[13px] leading-none text-white/72">Zonal climate control</div>
        <div className="mt-[7px] flex items-center gap-1.5 text-[11px] leading-none text-white/45">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-500',
              status.tone === 'hold' ? 'bg-white/40' : status.tone === 'heat' ? 'bg-[#f0c27a] shadow-[0_0_6px_#f0c27a]' : 'bg-[#9fd4ff] shadow-[0_0_6px_#9fd4ff]',
            )}
          />
          <span className="tabular">{status.text}</span>
        </div>
      </div>

      {/* settings */}
      <div ref={settingsRef} className="absolute right-3 top-3 z-[6]">
        <IconButton
          icon={SlidersHorizontal}
          label="Climate settings"
          variant="solid"
          size={40}
          iconSize={16}
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((o) => !o)}
        />
        <AnimatePresence>
          {settingsOpen && (
            <Glass
              variant="smoke"
              radius={20}
              initial={{ opacity: 0, y: -6, scale: 0.96, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, scale: 0.97, filter: 'blur(4px)' }}
              transition={springs.snappy}
              className="w-[232px] origin-top-right p-3"
              style={{ position: 'absolute', right: 0, top: 48 }}
              role="dialog"
              aria-label="Climate settings"
            >
              <div className="relative z-[3]">
                <div className="px-1 pb-2 text-[12px] font-medium text-white/85">{room.name} · Climate</div>
                <label className="flex items-center justify-between gap-2 rounded-xl px-1 py-1.5 text-[12px] text-white/80">
                  <span className="flex items-center gap-2">
                    <Leaf size={13} strokeWidth={1.7} className="text-lime-glow" /> Eco schedule
                  </span>
                  <Toggle size="sm" checked={eco} onChange={setEco} label="Eco schedule" />
                </label>
                <label className="flex items-center justify-between gap-2 rounded-xl px-1 py-1.5 text-[12px] text-white/80">
                  <span className="flex items-center gap-2">
                    <UserCheck size={13} strokeWidth={1.7} className="text-white/70" /> Follow occupancy
                  </span>
                  <Toggle size="sm" checked={followOccupancy} onChange={setFollowOccupancy} label="Follow occupancy" />
                </label>
                <div className="hairline my-2" />
                <div className="px-1 pb-1 text-[10.5px] uppercase tracking-[0.08em] text-white/40">Schedule</div>
                {SCHEDULE.map((row) => (
                  <button
                    key={row.time}
                    type="button"
                    onClick={() => set(row.temp)}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-1.5 text-left text-[12px] text-white/75 transition-colors hover:bg-white/10 hover:text-white',
                      Math.abs(row.temp - target) < 0.05 && 'bg-white/10 text-white',
                    )}
                  >
                    <span className="tabular">
                      {row.time} <span className="text-white/45">· {row.label}</span>
                    </span>
                    <span className="tabular">{row.temp.toFixed(1)}°</span>
                  </button>
                ))}
              </div>
            </Glass>
          )}
        </AnimatePresence>
      </div>

      {/* gauge box — keeps reference proportions at any card width */}
      <div className="absolute inset-x-0 bottom-0 z-[3] mx-auto aspect-[364/208] w-full max-w-[364px]">
        <div
          ref={(el) => {
            drag.ref.current = el
            wheelHost.current = el
          }}
          onPointerDown={drag.onPointerDown}
          role="slider"
          tabIndex={0}
          aria-label={`${room.name} target temperature`}
          aria-valuemin={TEMP_MIN}
          aria-valuemax={TEMP_MAX}
          aria-valuenow={target}
          aria-valuetext={`${target.toFixed(1)} degrees Celsius`}
          onKeyDown={onKeyDown}
          className={cn('absolute inset-0 touch-none rounded-[26px] outline-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
        >
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            <defs>
              <motion.linearGradient id="zc-band" gradientUnits="userSpaceOnUse" x1={startX} y1={0} x2={gradX2} y2={0}>
                <stop offset="0" stopColor="#c6ef8e" stopOpacity="0.08" />
                <stop offset="0.55" stopColor="#b5e27a" stopOpacity="0.55" />
                <stop offset="1" stopColor="#dcffb0" stopOpacity="1" />
              </motion.linearGradient>
              <filter id="zc-halo" x="-40%" y="-80%" width="180%" height="260%">
                <feGaussianBlur stdDeviation="9" />
              </filter>
              <filter id="zc-knob" x="-200%" y="-200%" width="500%" height="500%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>

            {/* track */}
            <path d={arcPath(-HALF, HALF)} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth={20} strokeLinecap="round" />
            {/* halo + band */}
            <motion.path d={bandD} fill="none" stroke="url(#zc-band)" strokeWidth={30} strokeLinecap="round" filter="url(#zc-halo)" opacity={0.85} />
            <motion.path d={bandD} fill="none" stroke="url(#zc-band)" strokeWidth={18} strokeLinecap="round" />

            {/* ticks */}
            {ticks.map((t) => {
              const on = t.deg <= valueDeg + 0.01
              return (
                <line
                  key={t.deg}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  strokeLinecap="round"
                  strokeWidth={t.major ? 1.3 : 1}
                  style={{
                    stroke: on ? 'rgb(34 48 20 / 0.42)' : t.major ? 'rgb(255 255 255 / 0.42)' : 'rgb(255 255 255 / 0.24)',
                    transition: 'stroke 0.35s ease',
                  }}
                />
              )
            })}

            {/* knob */}
            <motion.circle cx={knobX} cy={knobY} r={12} fill="#e6ffc8" opacity={dragging ? 0.9 : 0.55} filter="url(#zc-knob)" />
            <motion.circle cx={knobX} cy={knobY} r={dragging ? 7 : 5.5} fill="#fff" style={{ filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.35))' }} />
          </svg>

          {/* readout */}
          <div className="pointer-events-none absolute left-1/2 top-[77.5%] flex -translate-x-1/2 -translate-y-1/2 items-baseline text-white">
            <AnimatedNumber value={target} decimals={1} stiffness={240} className="text-[56px] font-light leading-none tracking-[-0.02em]" />
            <span className="ml-0.5 text-[22px] font-light leading-none text-white/90">°C</span>
          </div>
        </div>

        {/* + / − (reference order: plus left, minus right) */}
        <div className="absolute left-[11%] top-[64.5%] -translate-x-1/2 -translate-y-1/2">
          <IconButton
            icon={Plus}
            label="Raise temperature"
            variant="well"
            size={44}
            iconSize={18}
            onPointerDown={(e) => {
              if (e.button === 0) plus.start()
            }}
            onPointerUp={plus.stop}
            onPointerLeave={plus.stop}
            onPointerCancel={plus.stop}
            onClick={(e) => e.detail === 0 && nudge(STEP)}
          />
        </div>
        <div className="absolute left-[89%] top-[64.5%] -translate-x-1/2 -translate-y-1/2">
          <IconButton
            icon={Minus}
            label="Lower temperature"
            variant="well"
            size={44}
            iconSize={18}
            onPointerDown={(e) => {
              if (e.button === 0) minus.start()
            }}
            onPointerUp={minus.stop}
            onPointerLeave={minus.stop}
            onPointerCancel={minus.stop}
            onClick={(e) => e.detail === 0 && nudge(-STEP)}
          />
        </div>
      </div>
    </Glass>
  )
}
