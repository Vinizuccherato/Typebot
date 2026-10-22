import { useEffect, useId, useState } from 'react'
import { motion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useDomus } from '../../store'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn } from '../../lib/utils'
import { DeviceCard, PowerRow, SheetHeader } from './DeviceCard'
import { keyToValue, svgId, useElementSize, useWheelStep } from './hooks'

const LABELS = ['Low', 'Medium', 'High'] as const
const PRESETS = [18, 50, 88]
const SEG_GAP = 6

/** Hue Master Lamp — intensity ramp: one rising wedge split into Low / Medium / High blocks. */
export function LampCard() {
  const lamp = useDomus((s) => s.lamp)
  const setLamp = useDomus((s) => s.setLamp)
  const toast = useDomus((s) => s.toast)
  const [sheet, setSheet] = useState(false)
  const [kelvin, setKelvin] = useState(3000)

  const setPower = (on: boolean) => {
    setLamp({ on })
    toast({ title: 'Hue Master Lamp', detail: on ? `On · ${Math.round(lamp.intensity)}%` : 'Off', tone: on ? 'success' : 'default' })
  }

  return (
    <DeviceCard
      title={['Hue Master', 'Lamp']}
      on={lamp.on}
      sheetOpen={sheet}
      onSheetOpenChange={setSheet}
      sheetLabel="Lamp settings"
      sheet={
        <>
          <SheetHeader title="Hue Master Lamp" sub={lamp.on ? `${Math.round(lamp.intensity)}% · ${kelvin}K` : 'Off'} />
          <PowerRow on={lamp.on} onChange={setPower} label="Hue Master Lamp" />
          <div className="mt-auto">
            <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
              <span className="text-white/70">Temperature</span>
              <span className="tabular text-white/55">{kelvin}K</span>
            </div>
            <KelvinSlider value={kelvin} onChange={setKelvin} />
            <div className="mt-1 flex justify-between text-[10px] text-white/40">
              <span>Warm</span>
              <span>Cool</span>
            </div>
          </div>
        </>
      }
    >
      <div className="pointer-events-none flex items-baseline pt-[6px]">
        <AnimatedNumber value={Math.round(lamp.intensity)} className="text-[38px] font-light leading-[0.9] tracking-[-0.03em]" />
        <span className="ml-[1px] text-[21px] font-light leading-none text-white/90">%</span>
      </div>
      <div className="pointer-events-none mt-[5px] text-[10.5px] leading-none text-white/45">Intensity</div>
      <IntensityRamp />
    </DeviceCard>
  )
}

function IntensityRamp() {
  const intensity = useDomus((s) => s.lamp.intensity)
  const on = useDomus((s) => s.lamp.on)
  const setLamp = useDomus((s) => s.setLamp)
  const toast = useDomus((s) => s.toast)
  const [dragging, setDragging] = useState(false)
  const [sizeRef, { width: w, height: h }] = useElementSize<HTMLDivElement>()
  const id = svgId(useId())

  const spring = useSpring(intensity, { stiffness: 420, damping: 36, mass: 0.6 })
  useEffect(() => spring.set(intensity), [spring, intensity])

  const ensureOn = () => {
    if (!on) {
      setLamp({ on: true })
      toast({ title: 'Hue Master Lamp', detail: 'On', tone: 'success' })
    }
  }

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      ensureOn()
      setDragging(true)
    }
    setLamp({ intensity: Math.round(clamp(p.x, 0, 1) * 100) })
    if (p.phase === 'end') setDragging(false)
  })
  useWheelStep(drag.ref, (dir) => {
    ensureOn()
    setLamp({ intensity: intensity + dir * 2 })
  })

  const band = intensity < 34 ? 0 : intensity < 67 ? 1 : 2

  return (
    <div className="absolute inset-x-0 bottom-0">
      <div
        ref={(el) => {
          drag.ref.current = el
          sizeRef.current = el
        }}
        role="slider"
        tabIndex={0}
        aria-label="Lamp intensity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(intensity)}
        aria-valuetext={`${Math.round(intensity)}% · ${LABELS[band]}`}
        data-dragging={dragging}
        onPointerDown={drag.onPointerDown}
        onKeyDown={(e) => {
          const next = keyToValue(e, intensity)
          if (next === null) return
          e.preventDefault()
          ensureOn()
          setLamp({ intensity: next })
        }}
        className="group relative h-[74px] w-full cursor-ew-resize touch-none rounded-[10px] outline-none focus-visible:outline-offset-2"
      >
        {w > 0 && h > 0 && <RampSvg key={`${w}x${h}`} spring={spring} w={w} h={h} dragging={dragging} id={id} />}
      </div>
      <div className="mt-[7px] grid grid-cols-3 text-center text-[10.5px] leading-none" style={{ columnGap: SEG_GAP }}>
        {LABELS.map((l, i) => (
          <button
            key={l}
            type="button"
            tabIndex={-1}
            onClick={() => {
              ensureOn()
              setLamp({ intensity: PRESETS[i] })
            }}
            className={cn(
              'cursor-pointer transition-colors duration-300',
              i === band ? 'font-medium text-white/90' : 'text-white/40 hover:text-white/70',
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

type Pt = [number, number]

/** Closed polygon path with circular-ish rounded corners (quadratic joins). */
function roundedPoly(points: Pt[], r: number) {
  const n = points.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const prev = points[(i - 1 + n) % n]
    const next = points[(i + 1) % n]
    const v1: Pt = [prev[0] - p[0], prev[1] - p[1]]
    const v2: Pt = [next[0] - p[0], next[1] - p[1]]
    const l1 = Math.hypot(v1[0], v1[1])
    const l2 = Math.hypot(v2[0], v2[1])
    const rr = Math.min(r, l1 / 2, l2 / 2)
    const a: Pt = [p[0] + (v1[0] / l1) * rr, p[1] + (v1[1] / l1) * rr]
    const b: Pt = [p[0] + (v2[0] / l2) * rr, p[1] + (v2[1] / l2) * rr]
    d += `${i === 0 ? 'M' : 'L'}${a[0].toFixed(2)} ${a[1].toFixed(2)} Q${p[0]} ${p[1]} ${b[0].toFixed(2)} ${b[1].toFixed(2)} `
  }
  return d + 'Z'
}

interface RampSvgProps {
  spring: MotionValue<number>
  w: number
  h: number
  dragging: boolean
  id: string
}

/** Geometry is baked per size (keyed by w×h) so motion transforms never use stale bounds. */
function RampSvg({ spring, w, h, dragging, id }: RampSvgProps) {
  const h0 = Math.max(3, h * 0.05) // wedge starts almost as a point at the "Low" end
  const topAt = (x: number) => (h - h0) * (1 - x / w)
  const sw = (w - SEG_GAP * 2) / 3
  const segs = [0, 1, 2].map((i) => {
    const x0 = i * (sw + SEG_GAP)
    const x1 = x0 + sw
    return roundedPoly(
      [
        [x0, h],
        [x0, topAt(x0)],
        [x1, topAt(x1)],
        [x1, h],
      ],
      6,
    )
  })
  const all = segs.join(' ')

  const xMv = useTransform(spring, (v) => (clamp(v, 0, 100) / 100) * w)
  const litW = useTransform(xMv, (x) => Math.max(0, x))
  const edgeTop = useTransform(xMv, (x) => topAt(x) + 2)
  const knobX = useTransform(xMv, (x) => clamp(x, 4, w - 4))

  return (
    <svg width={w} height={h} className="absolute inset-0 overflow-visible" aria-hidden>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={all} />
        </clipPath>
        <clipPath id={`${id}-lit`}>
          <motion.rect x={0} y={-20} height={h + 40} width={litW} />
        </clipPath>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.025" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9cbd80" stopOpacity="0.8" />
          <stop offset="0.55" stopColor="#bcdba0" stopOpacity="0.94" />
          <stop offset="1" stopColor="#e0f3c9" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* soft bloom under the lit part */}
      <g clipPath={`url(#${id}-lit)`}>
        <motion.path
          d={all}
          fill="#c6ef8e"
          filter={`url(#${id}-glow)`}
          initial={false}
          animate={{ opacity: dragging ? 0.55 : 0.28 }}
          transition={{ duration: 0.35 }}
        />
      </g>

      {/* unlit glass blocks */}
      {segs.map((d, i) => (
        <path key={i} d={d} fill={`url(#${id}-base)`} stroke="#fff" strokeOpacity={0.09} strokeWidth={1} />
      ))}

      {/* lit portion */}
      <g clipPath={`url(#${id}-clip)`}>
        <g clipPath={`url(#${id}-lit)`}>
          <rect width={w} height={h} fill={`url(#${id}-fill)`} />
          <rect width={w} height={h} fill={`url(#${id}-sheen)`} />
        </g>
        {/* crisp leading edge */}
        <motion.line x1={xMv} x2={xMv} y1={h} y2={edgeTop} stroke="#f4ffe6" strokeOpacity={0.9} strokeWidth={1.5} />
      </g>

      <motion.circle
        cx={knobX}
        cy={edgeTop}
        r={3.5}
        initial={false}
        animate={{ r: dragging ? 5 : 3.5 }}
        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        fill="#fff"
        style={{ filter: 'drop-shadow(0 0 6px rgb(198 239 142 / 0.9))' }}
        className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[dragging=true]:opacity-100"
      />
    </svg>
  )
}

function KelvinSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const MIN = 2700
  const MAX = 6500
  const t = (value - MIN) / (MAX - MIN)
  const drag = usePointerDrag<HTMLDivElement>((p) => onChange(Math.round((MIN + clamp(p.x, 0, 1) * (MAX - MIN)) / 100) * 100))
  return (
    <div
      ref={drag.ref}
      role="slider"
      tabIndex={0}
      aria-label="Colour temperature"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value}
      aria-valuetext={`${value} kelvin`}
      onPointerDown={drag.onPointerDown}
      onKeyDown={(e) => {
        const next = keyToValue(e, value, MIN, MAX, 100, 500)
        if (next === null) return
        e.preventDefault()
        onChange(next)
      }}
      className="relative flex h-5 cursor-ew-resize touch-none items-center rounded-full outline-none"
    >
      <div
        className="h-[6px] w-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, #ffb066, #ffe2bd 45%, #f6f4ef 60%, #cfe2ff)',
          boxShadow: 'inset 0 1px 1px rgb(0 0 0 / 0.25)',
        }}
      />
      <motion.span
        className="absolute top-1/2 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.4)]"
        initial={false}
        animate={{ left: `${t * 100}%` }}
        transition={{ type: 'spring', stiffness: 600, damping: 40 }}
      />
    </div>
  )
}
