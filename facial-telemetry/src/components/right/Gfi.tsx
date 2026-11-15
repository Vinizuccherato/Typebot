import { motion } from 'motion/react'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { useFace } from '../../store'

const R = 24
const C = 2 * Math.PI * R

/** General Fitness Index with the leaf-vein ring from the reference. */
export function Gfi() {
  const gfi = useFace((s) => s.vitals.gfi)
  const toast = useFace((s) => s.toast)
  return (
    <Glass
      variant="smoke"
      radius={22}
      specular={0.5}
      className="flex h-full w-full cursor-pointer items-center justify-between gap-2 p-4"
      role="button"
      tabIndex={0}
      aria-label={`General fitness index ${gfi}%`}
      onClick={() => toast({ title: `General fitness index ${gfi}%`, detail: 'Top 18% for age group · +3 this week' })}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), e.currentTarget.click())}
    >
      <div className="relative z-[3]">
        <AnimatedNumber value={gfi} className="block text-[34px] font-light leading-none text-white" />
        <span className="mt-1 block text-[10.5px] text-white/55">% GFI</span>
      </div>
      <svg className="relative z-[3] shrink-0" width="60" height="60" viewBox="0 0 60 60" aria-hidden>
        <circle cx="30" cy="30" r={R} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="1.2" />
        <motion.circle
          cx="30"
          cy="30"
          r={R}
          fill="none"
          stroke="var(--mint)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={C}
          transform="rotate(-90 30 30)"
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - gfi / 100) }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          style={{ filter: 'drop-shadow(0 0 4px rgb(143 240 192 / 0.6))' }}
        />
        {/* leaf: midrib + veins */}
        <g stroke="rgb(255 255 255 / 0.55)" strokeWidth="0.9" strokeLinecap="round" fill="none">
          <path d="M19 41 C 24 30, 31 22, 42 18" />
          <path d="M19 41 C 22 30, 30 21, 42 18 C 40 28, 32 37, 19 41 Z" stroke="rgb(255 255 255 / 0.3)" />
          {[0.25, 0.42, 0.58, 0.74].map((t) => {
            const x = 19 + (42 - 19) * t
            const y = 41 + (18 - 41) * t
            return (
              <g key={t}>
                <path d={`M${x} ${y} l ${-3.2 + t} ${-4.5 + t * 2}`} />
                <path d={`M${x} ${y} l ${4.5 - t * 2} ${2.6 - t}`} />
              </g>
            )
          })}
        </g>
      </svg>
    </Glass>
  )
}
