import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { CardLabel } from './kit'

const TEXT = { connected: 'Connected', searching: 'Searching…', off: 'Off' } as const

/** Bluetooth link to the sensor. Tap to re-pair. */
export function Signal() {
  const signal = useSoma((s) => s.sensor.signal)
  const setSignal = useSoma((s) => s.setSignal)
  const toast = useSoma((s) => s.toast)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const repair = () => {
    if (signal === 'searching') return
    setSignal('searching')
    timer.current = window.setTimeout(() => {
      setSignal('connected')
      toast({ title: 'Sensor connected', detail: 'Live readings resumed', tone: 'success' })
    }, 2000)
  }

  return (
    <Glass variant="frost" radius={22} specular={0.6} className="h-full w-full">
      <button
        type="button"
        onClick={repair}
        aria-label={`Signal ${TEXT[signal]}. Tap to re-pair the sensor`}
        aria-busy={signal === 'searching'}
        className="relative z-[3] flex h-full w-full cursor-pointer items-center justify-between rounded-[22px] px-[18px] text-left outline-none"
      >
        <span className="flex flex-col gap-1.5">
          <CardLabel className="text-[var(--ink-2)]">Signal</CardLabel>
          <motion.span key={signal} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} className="text-[14px] font-normal text-[var(--ink)]">
            {TEXT[signal]}
          </motion.span>
        </span>
        <span className="flex h-[22px] items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="w-[4px] rounded-full bg-[var(--ink)]"
              style={{ height: 6 + i * 5 }}
              animate={
                signal === 'searching'
                  ? { opacity: [0.15, 1, 0.15] }
                  : { opacity: signal === 'connected' ? (i < 4 ? 0.85 : 0.2) : 0.15 }
              }
              transition={signal === 'searching' ? { duration: 1, repeat: Infinity, delay: i * 0.15 } : { duration: 0.3 }}
            />
          ))}
        </span>
      </button>
    </Glass>
  )
}
