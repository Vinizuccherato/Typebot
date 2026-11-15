import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarClock } from 'lucide-react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel, Popover } from './kit'

const R = 27
const C = 2 * Math.PI * R

/** Sensor life: days left + a ring that empties as the 14-day wear period runs out. */
export function Expiration() {
  const sensor = useSoma((s) => s.sensor)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const left = sensor.expiresInDays / sensor.lifeDays
  const ends = new Date(Date.now() + sensor.expiresInDays * 864e5).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <>
      <Glass variant="frost" radius={26} specular={0.6} className="h-full w-full">
        <button
          ref={ref}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Sensor expires in ${sensor.expiresInDays} days. Show details`}
          className="relative z-[3] flex h-full w-full cursor-pointer items-center justify-between rounded-[26px] px-[18px] text-left outline-none"
        >
          <span className="flex h-full flex-col justify-between py-[16px]">
            <CardLabel className="text-[var(--ink-2)]">Expiration</CardLabel>
            <span className="flex items-baseline gap-1.5">
              <AnimatedNumber value={sensor.expiresInDays} className="text-[40px] font-light leading-none tracking-[-0.03em]" />
              <span className="text-[12px] text-[var(--ink-3)]">days</span>
            </span>
          </span>
          <span className="relative grid h-[70px] w-[70px] place-items-center">
            <svg width="70" height="70" viewBox="0 0 70 70" className="absolute inset-0 -rotate-90">
              <circle cx="35" cy="35" r={R} fill="none" stroke="rgb(18 18 18 / 0.1)" strokeWidth="2" />
              <motion.circle
                cx="35"
                cy="35"
                r={R}
                fill="none"
                stroke="rgb(18 18 18 / 0.55)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - left) }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <span className="h-[34px] w-[34px] rounded-full bg-white shadow-[inset_0_1px_2px_rgb(0_0_0/0.08),0_2px_6px_rgb(0_0_0/0.08)]" />
          </span>
        </button>
      </Glass>
      <Popover anchor={ref} open={open} onClose={() => setOpen(false)} label="Sensor expiration" width={250} align="end">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <CalendarClock size={15} strokeWidth={1.6} /> Replace on {ends}
        </div>
        <p className="mt-2 text-[11.5px] leading-[1.5] text-[var(--ink-2)]">
          Day {sensor.lifeDays - sensor.expiresInDays + 1} of {sensor.lifeDays}. Apply the new sensor on the back of the other arm, then pair it from Signal. Readings carry over without a warm-up gap.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
          <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${(1 - left) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-[var(--ink-3)]">
          <span>Applied</span>
          <span>{Math.round((1 - left) * 100)}% worn</span>
        </div>
      </Popover>
    </>
  )
}
