import { useState } from 'react'
import { motion } from 'motion/react'
import { HeartPulse, MoreHorizontal } from 'lucide-react'
import { useFace } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { useArtboard } from '../../layout/Artboard'
import { Tip } from './parts'

const W = 220
const H = 118
const CX = W / 2
const CY = 108
const R = 92
const TICKS = 41

const polar = (t: number, r: number) => {
  const a = Math.PI * (1 - t) // t 0 → left, 1 → right
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const
}

const zone = (v: number) => (v < 30 ? 'low' : v < 60 ? 'moderate' : 'high')

interface Stat {
  id: string
  label: string
  value: number
  decimals?: number
  unit: string
  suffix: string
  help: string
}

/** Mental Stress — recovery, HRV gap and tension, with a semicircular tension gauge. */
export function MentalStress() {
  const v = useFace((s) => s.vitals)
  const { mode } = useArtboard()
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null)
  const t = v.stress / 100

  const stats: Stat[] = [
    { id: 'rec', label: 'Recovery', value: v.recovery, unit: '%', suffix: 'max', help: 'Autonomic recovery vs. your 30-day best' },
    { id: 'hrv', label: 'HRV Gap', value: v.hrv, decimals: 1, unit: ' ms', suffix: '', help: 'RMSSD from facial blood-volume pulse' },
    { id: 'ten', label: 'Tension', value: v.stress, unit: '%', suffix: zone(v.stress), help: 'Micro-expression and perfusion load' },
  ]

  const [mx, my] = polar(t, R)

  return (
    <Glass variant="smoke" radius={24} className="flex h-full w-full flex-col overflow-visible px-5 pb-3 pt-4">
      <div className="relative z-[3] flex items-center gap-2.5">
        <HeartPulse size={16} strokeWidth={1.7} className="text-white/85" />
        <h2 className="flex-1 text-[15px] text-white">Mental Stress</h2>
        <MoreHorizontal size={16} className="text-white/45" aria-hidden />
      </div>

      <div className={`relative z-[3] mt-4 grid grid-cols-3 gap-3 ${mode === 'compact' ? '' : 'pr-2'}`}>
        {stats.map((s) => (
          <div
            key={s.id}
            tabIndex={0}
            aria-label={`${s.label}: ${s.value}${s.unit} ${s.suffix}. ${s.help}`}
            className="relative rounded-xl outline-none"
            onPointerEnter={(e) => setTip({ x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop, text: s.help })}
            onPointerLeave={() => setTip(null)}
            onFocus={(e) => setTip({ x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2, y: e.currentTarget.offsetTop, text: s.help })}
            onBlur={() => setTip(null)}
          >
            <p className="label">{s.label}</p>
            <p className="mt-1 whitespace-nowrap text-[15px] text-white">
              <AnimatedNumber value={s.value} decimals={s.decimals ?? 0} />
              {s.unit}
              {s.suffix && <span className="ml-1 text-[12px] text-white/50">{s.suffix}</span>}
            </p>
          </div>
        ))}
        {tip && (
          <Tip x={tip.x} y={tip.y}>
            {tip.text}
          </Tip>
        )}
      </div>

      <div className="relative z-[3] mt-auto flex items-end justify-between">
        <div className="pb-2">
          <p className="label">Stress load</p>
          <p className="mt-1 text-[12px] text-white/55">
            {zone(v.stress) === 'low' ? 'Calm, well regulated' : zone(v.stress) === 'moderate' ? 'Elevated, watch pacing' : 'High, take a break'}
          </p>
        </div>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tension gauge at ${v.stress}%`} className="-mb-1 shrink-0">
          <defs>
            <linearGradient id="ms-arc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2f9e74" />
              <stop offset="1" stopColor="#c8ffe2" />
            </linearGradient>
            <filter id="ms-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {Array.from({ length: TICKS }, (_, i) => {
            const k = i / (TICKS - 1)
            const [x1, y1] = polar(k, R - 14)
            const [x2, y2] = polar(k, R - (i % 5 === 0 ? 22 : 18))
            const on = k <= t
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? '#8ff0c0' : 'white'} strokeOpacity={on ? 0.85 : 0.14} strokeWidth={1.2} strokeLinecap="round" />
          })}
          <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="6" strokeLinecap="round" />
          <motion.path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="url(#ms-arc)"
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(0.02, t) }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          />
          <motion.circle r="9" fill="#8ff0c0" opacity="0.5" filter="url(#ms-glow)" initial={{ cx: CX - R, cy: CY }} animate={{ cx: mx, cy: my }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
          <motion.circle r="4.5" fill="white" initial={{ cx: CX - R, cy: CY }} animate={{ cx: mx, cy: my }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
          <text x={CX} y={CY - 26} textAnchor="middle" className="tabular" fill="white" fontSize="26" fontWeight="300">
            {v.stress}%
          </text>
          <text x={CX} y={CY - 8} textAnchor="middle" fill="white" fillOpacity="0.45" fontSize="10.5">
            tension
          </text>
        </svg>
      </div>
    </Glass>
  )
}
