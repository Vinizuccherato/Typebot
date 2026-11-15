import { motion } from 'motion/react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel, ExpandButton, polar } from './kit'

const MIN = 100
const MAX = 260
const N = 45
const VW = 236
const CX = VW / 2
const CY = 82
const R = 74

const angle = (v: number) => 180 + ((Math.max(MIN, Math.min(MAX, v)) - MIN) / (MAX - MIN)) * 180

/** Total cholesterol on a dense tick dial; the desirable band is lit, a volt marker shows today. */
export function Cholesterol() {
  const c = useSoma((s) => s.cholesterol)
  const m = useSoma((s) => s.metrics.cholesterol)
  const setExpanded = useSoma((s) => s.setExpanded)
  const total = m.value
  const a = angle(total)
  const [mx, my] = polar(CX, CY, R + 1, a)

  return (
    <Glass variant="smoke" radius={26} specular={0.7} className="on-dark h-full w-full overflow-hidden">
      <div className="relative z-[3] flex h-full flex-col px-[16px] pb-[14px] pt-[16px]">
        <div className="flex items-center justify-between">
          <CardLabel className="text-white/85">Cholesterol</CardLabel>
          <ExpandButton label="Expand lipid panel" onClick={() => setExpanded('cholesterol')} />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <AnimatedNumber value={c.daysLogged} className="text-[38px] font-light leading-none tracking-[-0.03em]" />
          <span className="text-[11.5px] text-white/50">/{c.ofDays} days logged</span>
        </div>

        <div className="relative mt-auto" role="img" aria-label={`Total cholesterol ${total} mg/dl, ${m.status}. Desirable band ${m.low}–${m.high}.`}>
          <svg width="100%" viewBox={`0 0 ${VW} ${CY + 8}`} className="block overflow-visible">
            {Array.from({ length: N }, (_, i) => {
              const v = MIN + (i / (N - 1)) * (MAX - MIN)
              const ang = 180 + (i / (N - 1)) * 180
              const band = v >= m.low && v <= m.high
              const major = i % 4 === 0
              const [x1, y1] = polar(CX, CY, R - (major ? 14 : 10), ang)
              const [x2, y2] = polar(CX, CY, R, ang)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity={band ? 0.62 : 0.16} strokeWidth={major ? 1.6 : 1.1} strokeLinecap="round" />
            })}
            <motion.g initial={false} animate={{ x: mx, y: my }} transition={{ type: 'spring', stiffness: 70, damping: 16 }}>
              <circle r="9" fill="#dcec55" opacity="0.25" />
              <circle r="4.5" fill="#dcec55" stroke="#1d1d1c" strokeWidth="1.5" />
            </motion.g>
            <text x={CX - R} y={CY + 6} fontSize="9" fill="white" fillOpacity="0.4" textAnchor="middle">{MIN}</text>
            <text x={CX + R} y={CY + 6} fontSize="9" fill="white" fillOpacity="0.4" textAnchor="middle">{MAX}</text>
          </svg>
          <div className="absolute inset-x-0 bottom-[2px] flex flex-col items-center">
            <span className="flex items-baseline gap-1">
              <AnimatedNumber value={total} className="text-[22px] font-light" />
              <span className="text-[10px] text-white/50">mg/dl</span>
            </span>
            <span className="text-[10px] text-[#dcec55]">{m.status}</span>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10.5px]">
          {[
            ['HDL', c.hdl, '≥ 50'],
            ['LDL', c.ldl, '< 100'],
          ].map(([k, v, t]) => (
            <span key={k as string} className="flex items-baseline justify-between rounded-full bg-white/[0.07] px-2.5 py-1 ring-1 ring-white/10">
              <span className="text-white/55">{k}</span>
              <span className="tabular whitespace-nowrap">
                {v} <span className="text-white/40 max-lg:hidden">{t}</span>
              </span>
            </span>
          ))}
        </div>
      </div>
    </Glass>
  )
}
