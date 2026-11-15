import { motion } from 'motion/react'
import { useRings } from '../store'
import { RingScene } from '../three/RingScene'
import { BatteryGauge } from './BatteryGauge'
import { BRAND } from '../brand'
import { useUiScale } from '../lib/uiScale'

/**
 * Full-bleed painted light behind the whole app. The reference uses a photograph
 * (hand wearing the ring); we paint the same light — sky haze, platinum highlight,
 * warm skin glow — and float a real 3D ring in it (see <Hero/>).
 */
export function Backdrop() {
  return (
    <div className="absolute inset-0">
      {/* painted light */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, var(--sky-a) 0%, var(--sky-b) 46%, var(--sky-c) 72%, #9fb5c0 100%)' }}
      />
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div
          className="drift absolute left-[8%] top-[6%] h-[48%] w-[84%] rounded-full blur-[38px]"
          style={{ background: 'radial-gradient(closest-side, rgb(247 249 248 / 0.95), rgb(236 238 232 / 0.55) 55%, transparent)', animation: 'drift-a 14s ease-in-out infinite' }}
        />
        <div
          className="drift absolute left-[30%] top-[28%] h-[34%] w-[56%] rounded-full blur-[44px]"
          style={{ background: 'radial-gradient(closest-side, rgb(236 182 158 / 0.75), rgb(226 176 160 / 0.3) 60%, transparent)', animation: 'drift-b 17s ease-in-out infinite' }}
        />
        <div
          className="drift absolute -left-[10%] top-[40%] h-[30%] w-[50%] rounded-full blur-[50px]"
          style={{ background: 'radial-gradient(closest-side, rgb(150 182 196 / 0.8), transparent)', animation: 'drift-a 19s ease-in-out infinite reverse' }}
        />
        <div className="grain absolute inset-0 opacity-[0.18]" />
      </div>

    </div>
  )
}

export function Hero() {
  const activeId = useRings((s) => s.activeId)
  const pulse = useRings((s) => s.pulse)
  const resolution = useUiScale()

  return (
    <div className="absolute inset-0">
      {/* floating 3D ring */}
      <RingScene variant="hero" finish={activeId} pulse={pulse} resolution={resolution} className="absolute inset-x-0 top-[282px] h-[250px]" />

      {/* top glyph */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[90px] -translate-x-1/2"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <svg width="26" height="30" viewBox="0 0 26 30">
          <circle cx="13" cy="17" r="11" fill="none" stroke="white" strokeWidth="1.4" />
          {BRAND.neutral ? (
            <circle cx="13" cy="17" r="2.2" fill="white" />
          ) : (
            <path d="M8.5 2.5h9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          )}
        </svg>
      </motion.div>

      <BatteryGauge />
    </div>
  )
}
