import { motion } from 'motion/react'
import { useArtboard } from '../../layout/Artboard'

const rise = (d: number) => ({
  initial: { y: 14, filter: 'blur(6px)', opacity: 0 },
  animate: { y: 0, filter: 'blur(0px)', opacity: 1 },
  transition: { delay: d, duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
})

export function Title() {
  const compact = useArtboard().mode === 'compact'
  return (
    <div className="flex flex-col">
      <h1 className={`font-normal leading-[1.02] tracking-[-0.025em] text-[var(--ink)] ${compact ? 'text-[40px]' : 'text-[54px]'}`}>
        <motion.span className="block" {...rise(0.05)}>
          Glucose
        </motion.span>
        <motion.span className="block" {...rise(0.15)}>
          Monitoring
        </motion.span>
      </h1>
      <motion.p className="mt-3 max-w-[300px] text-[12px] leading-snug text-[var(--ink-3)]" {...rise(0.28)}>
        Stay aware of your glucose levels throughout the day
      </motion.p>
    </div>
  )
}
