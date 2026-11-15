import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useFace } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CornerArrow } from './parts'
import { useArtboard } from '../../layout/Artboard'
import { useTrace } from './useTrace'

function EcgGlyph() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden>
      <path d="M1 8h4l2-5 3 9 2.5-6 1.5 2H19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Heart Rate — live rPPG-derived pulse with a scrolling trace and a beat-synced glow. */
export function HeartRate() {
  const hr = useFace((s) => s.vitals.heartRate)
  const select = useFace((s) => s.select)
  const setTab = useFace((s) => s.setTab)
  const trace = useTrace({ samples: 46, color: 'rgb(143, 240, 192)', fill: 0.16 })
  const [beat, setBeat] = useState(0)
  const compact = useArtboard().mode === 'compact'

  // one glow pulse per heartbeat, synced to the live rate
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setBeat((b) => b + 1), 60000 / Math.max(40, hr))
    return () => window.clearInterval(id)
  }, [hr])

  return (
    <Glass variant="frost" radius={22} specular className="flex h-full w-full flex-col overflow-hidden px-5 pb-4 pt-4">
      <motion.span
        key={beat}
        aria-hidden
        className="pointer-events-none absolute -bottom-10 right-2 z-0 h-32 w-32 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(143 240 192 / 0.22), transparent)' }}
        initial={{ opacity: 0.9, scale: 0.85 }}
        animate={{ opacity: 0, scale: 1.25 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <div className="relative z-[3] flex items-start justify-between">
        <h2 className="text-[15px] font-normal text-white">Heart Rate</h2>
        <CornerArrow
          label="Open biometrics"
          onClick={() => {
            setTab('biometrics')
            select(null)
          }}
        />
      </div>
      {compact ? (
        <div className="relative z-[3] mt-auto flex items-end gap-3">
          <canvas ref={trace} className="h-[46px] min-w-0 flex-1" aria-hidden />
          <p className="flex items-baseline gap-1 leading-none">
            <AnimatedNumber value={hr} className="text-[36px] font-light tracking-[-0.03em] text-white" />
            <span className="text-[11px] text-white/55">bpm</span>
          </p>
        </div>
      ) : (
        <>
          <canvas ref={trace} className="relative z-[3] mt-1 h-0 w-full flex-1" aria-hidden />
          <div className="relative z-[3] mt-1 flex items-end justify-between">
            <div className="flex flex-col gap-1.5 text-white/60">
              <EcgGlyph />
              <span className="text-[11.5px]">bpm</span>
            </div>
            <p className="leading-none" aria-live="off">
              <AnimatedNumber value={hr} className="text-[44px] font-light tracking-[-0.03em] text-white" />
              <span className="sr-only"> beats per minute</span>
            </p>
          </div>
        </>
      )}
    </Glass>
  )
}
