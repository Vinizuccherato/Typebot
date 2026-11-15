import { motion } from 'motion/react'
import { batteryLabel, useRings } from '../store'
import { AnimatedNumber } from '../ui/AnimatedNumber'

/* Gauge geometry (logical pt). The track runs 230° from the upper-left,
   down through the bottom, ending upper-right — as in the reference. */
const CX = 195
const CY = 407
const R = 166
const START = 205 // degrees, y-down, clockwise from +x
const SPAN = 230

const pt = (deg: number) => {
  const a = (deg * Math.PI) / 180
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)] as const
}
const [sx, sy] = pt(START)
const [ex, ey] = pt(START - SPAN)
// sweep-flag 0: decreasing angle (left → bottom → right); large arc since SPAN > 180
const TRACK = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${R} ${R} 0 1 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`

export function BatteryGauge() {
  const ring = useRings((s) => s.rings[s.activeId])
  const charging = useRings((s) => s.charging)
  const setCharging = useRings((s) => s.setCharging)
  const showToast = useRings((s) => s.showToast)
  const v = ring.battery / 100

  const toggle = () => {
    const next = !charging
    if (next && ring.battery >= 100) return showToast('Battery is full')
    setCharging(next)
    showToast(next ? 'Ring placed on charger' : 'Charging paused')
  }

  return (
    <>
      <svg className="pointer-events-none absolute left-0 top-0" width="390" height="620" viewBox="0 0 390 620" aria-hidden>
        <defs>
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <linearGradient id="arc-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        {/* faint track */}
        <path d={TRACK} fill="none" stroke="white" strokeOpacity="0.16" strokeWidth="1.6" strokeLinecap="round" />
        {/* glow + value */}
        <motion.path
          d={TRACK}
          fill="none"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#arc-glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: v }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 1 }}
        />
        <motion.path
          d={TRACK}
          fill="none"
          stroke="url(#arc-fade)"
          strokeWidth="2.2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: v }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 1 }}
        />
        {/* charging: a bead of light travelling along the filled arc */}
        {charging && (
          <motion.path
            d={TRACK}
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#arc-glow)"
            pathLength={1}
            strokeDasharray="0.04 1"
            initial={{ strokeDashoffset: 0.04 }}
            animate={{ strokeDashoffset: [0.04, -v] }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.2 }}
          />
        )}
      </svg>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={charging}
        className="absolute left-[24px] top-[284px] cursor-pointer rounded-xl text-left outline-none transition-transform active:scale-[0.97]"
        aria-label={`Battery life ${ring.battery}%, ${charging ? 'charging' : batteryLabel(ring.battery)}. Tap to ${charging ? 'stop' : 'start'} charging.`}
      >
        <motion.span
          className="block text-[11.5px] font-normal tracking-[0.01em] text-white/85"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          Battery Life
        </motion.span>
        <motion.span
          className="mt-[3px] flex items-baseline gap-[3px]"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
        >
          <span className="text-[28px] font-normal leading-none tracking-[-0.02em] text-white">
            <AnimatedNumber value={ring.battery} />%
          </span>
          <span className="text-[12.5px] font-light text-white/90">{charging ? 'Charging' : batteryLabel(ring.battery)}</span>
        </motion.span>
      </button>
    </>
  )
}
