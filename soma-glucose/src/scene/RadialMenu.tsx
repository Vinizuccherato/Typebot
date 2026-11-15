import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { Activity, Droplet, FlaskConical, HeartPulse, type LucideIcon } from 'lucide-react'
import { useSoma, type MetricId } from '../store'
import { springs } from '../lib/utils'
import { coreCss } from './Figure'

/* Menu geometry in design px around the sensor centre (container 400×400). */
const C = 200
const R0 = 72 // inner radius (just clear of the puck)
const R1 = 150 // outer radius
const R1_SEL = 176 // selected segment pops out
const CORNER = 9

interface Seg {
  id: MetricId
  label: string
  icon: LucideIcon
  a0: number // degrees, y-down, clockwise from +x
  a1: number
}

const SEGS: Seg[] = [
  { id: 'hemoglobin', label: 'Hemoglobin', icon: Droplet, a0: -124, a1: -79 },
  { id: 'ketones', label: 'Ketones', icon: FlaskConical, a0: -76, a1: -31 },
  { id: 'glucose', label: 'Glucose', icon: Activity, a0: -28, a1: 22 },
  { id: 'cholesterol', label: 'Cholesterol', icon: HeartPulse, a0: 25, a1: 70 },
]

const rad = (d: number) => (d * Math.PI) / 180
const pt = (r: number, a: number) => `${(C + r * Math.cos(rad(a))).toFixed(2)} ${(C + r * Math.sin(rad(a))).toFixed(2)}`

/** Annular sector with softly rounded corners. */
function sector(r0: number, r1: number, a0: number, a1: number) {
  const d1 = (CORNER / r1) * (180 / Math.PI)
  const d0 = (CORNER / r0) * (180 / Math.PI)
  const large = a1 - a0 > 180 ? 1 : 0
  return [
    `M ${pt(r1 - CORNER, a0)}`,
    `Q ${pt(r1, a0)} ${pt(r1, a0 + d1)}`,
    `A ${r1} ${r1} 0 ${large} 1 ${pt(r1, a1 - d1)}`,
    `Q ${pt(r1, a1)} ${pt(r1 - CORNER, a1)}`,
    `L ${pt(r0 + CORNER, a1)}`,
    `Q ${pt(r0, a1)} ${pt(r0, a1 - d0)}`,
    `A ${r0} ${r0} 0 ${large} 0 ${pt(r0, a0 + d0)}`,
    `Q ${pt(r0, a0)} ${pt(r0 + CORNER, a0)}`,
    'Z',
  ].join(' ')
}

function Segment({ seg, selected, onSelect, focusable }: { seg: Seg; selected: boolean; onSelect: () => void; focusable: boolean }) {
  const r1 = useMotionValue(selected ? R1_SEL : R1)
  const lift = useMotionValue(0)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    const c = animate(r1, selected ? R1_SEL : R1, springs.bouncy)
    return () => c.stop()
  }, [selected, r1])
  useEffect(() => {
    const c = animate(lift, hover && !selected ? 5 : 0, springs.snappy)
    return () => c.stop()
  }, [hover, selected, lift])

  const mid = (seg.a0 + seg.a1) / 2
  const clip = useTransform(r1, (r) => `path("${sector(R0, r, seg.a0, seg.a1)}")`)
  const d = useTransform(r1, (r) => sector(R0, r, seg.a0, seg.a1))
  const x = useTransform(lift, (l) => Math.cos(rad(mid)) * l)
  const y = useTransform(lift, (l) => Math.sin(rad(mid)) * l)
  const labelR = useTransform(r1, (r) => (R0 + r) / 2 + (selected ? 4 : 0))
  const lx = useTransform(labelR, (r) => C + Math.cos(rad(mid)) * r)
  const ly = useTransform(labelR, (r) => C + Math.sin(rad(mid)) * r)
  const Icon = seg.icon

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={seg.label}
      tabIndex={focusable ? 0 : -1}
      onClick={onSelect}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="pointer-events-auto absolute inset-0 cursor-pointer outline-none"
      initial={false}
      animate={{ backgroundColor: selected ? 'rgba(246,245,242,0.86)' : hover ? 'rgba(52,51,48,0.68)' : 'rgba(30,30,28,0.6)' }}
      transition={{ backgroundColor: { duration: 0.3 } }}
      // glass lives on the clipped element itself: a clipped ancestor would be a backdrop root
      style={
        {
          x,
          y,
          clipPath: clip,
          WebkitClipPath: clip,
          backdropFilter: 'blur(16px) saturate(130%)',
          WebkitBackdropFilter: 'blur(16px) saturate(130%)',
        } as unknown as CSSProperties
      }
    >
      {/* hairline edge */}
      <svg aria-hidden className="pointer-events-none absolute inset-0" width={2 * C} height={2 * C} viewBox={`0 0 ${2 * C} ${2 * C}`}>
        <defs>
          <linearGradient id={`edge-${seg.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={selected ? 1 : 0.38} />
            <stop offset="1" stopColor="#fff" stopOpacity={selected ? 0.5 : 0.06} />
          </linearGradient>
        </defs>
        <motion.path d={d as MotionValue<string>} fill="none" stroke={`url(#edge-${seg.id})`} strokeWidth={2} />
      </svg>
      {/* label */}
      <motion.span
        className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[3px] whitespace-nowrap"
        style={{ left: lx, top: ly }}
      >
        <Icon size={13} strokeWidth={1.7} className={selected ? 'text-[#161616]' : 'text-white/75'} />
        <span className={`text-[10.5px] font-medium tracking-[0.01em] ${selected ? 'text-[#161616]' : 'text-white/80'}`}>{seg.label}</span>
      </motion.span>
    </motion.button>
  )
}

/** Smoked-glass half ring around the sensor — pick which biomarker the cards show. */
export const RadialMenu = forwardRef<HTMLDivElement, { reading: number }>(function RadialMenu({ reading }, ref) {
  const metric = useSoma((s) => s.metric)
  const setMetric = useSoma((s) => s.setMetric)
  const group = useRef<HTMLDivElement>(null)

  const move = (dir: 1 | -1) => {
    const i = SEGS.findIndex((s) => s.id === metric)
    const next = SEGS[(i + dir + SEGS.length) % SEGS.length]
    setMetric(next.id)
    requestAnimationFrame(() => group.current?.querySelector<HTMLButtonElement>(`[aria-label="${next.label}"]`)?.focus())
  }

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: 2 * C, height: 2 * C }}>
      {/* reading pulse — a crisp ring that blooms from the puck on each new value */}
      <motion.span
        key={`${reading}-${metric}`}
        aria-hidden
        className="absolute rounded-full border"
        style={{ left: C - 58, top: C - 58, width: 116, height: 116, borderColor: coreCss[metric] }}
        initial={{ scale: 0.9, opacity: 0.85 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div
        ref={group}
        role="radiogroup"
        aria-label="Biomarker"
        className="absolute inset-0"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') (e.preventDefault(), move(1))
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') (e.preventDefault(), move(-1))
        }}
      >
        {SEGS.map((s) => (
          <Segment key={s.id} seg={s} selected={s.id === metric} focusable={s.id === metric} onSelect={() => setMetric(s.id)} />
        ))}
      </div>
      {/* separator dots along the outer edge */}
      {[-77.5, -29.5, 23.5].map((a) => (
        <span
          key={a}
          aria-hidden
          className="absolute h-[4px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55"
          style={{ left: C + Math.cos(rad(a)) * (R1 + 12), top: C + Math.sin(rad(a)) * (R1 + 12) }}
        />
      ))}
    </div>
  )
})

export const MENU_HALF = C
