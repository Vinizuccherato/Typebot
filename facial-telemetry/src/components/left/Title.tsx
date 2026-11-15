import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useArtboard } from '../../layout/Artboard'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const stamp = (d: Date) => {
  const h = d.getHours() % 12 || 12
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'am' : 'pm'}`
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 14, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { delay: 0.12 + i * 0.09, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
})

/** "Facial data telemetry" + live session timestamp. */
export function Title() {
  const { mode } = useArtboard()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(id)
  }, [])
  const size = mode === 'compact' ? 'text-[44px]' : 'text-[64px]'
  return (
    <div>
      <h1 className={`${size} font-light leading-[1.02] tracking-[-0.025em] text-white`}>
        <motion.span className="block" {...rise(0)}>
          Facial data
        </motion.span>
        <motion.span className="block" {...rise(1)}>
          telemetry
        </motion.span>
      </h1>
      <motion.p className="tabular mt-5 text-[13px] text-white/50" {...rise(2)}>
        <time dateTime={now.toISOString()}>{stamp(now)}</time>
      </motion.p>
    </div>
  )
}
