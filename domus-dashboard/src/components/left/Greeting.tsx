import { useEffect, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import { useArtboard } from '../../layout/Artboard'

const partOfDay = (d: Date) => {
  const h = d.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const rise = {
  hidden: { opacity: 0, y: 14, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

export function Greeting() {
  const { mode } = useArtboard()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const compact = mode === 'compact'

  return (
    <MotionConfig reducedMotion="user">
      <motion.hgroup
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
        className="select-none"
      >
        <motion.p
          variants={rise}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="m-0 font-light leading-[1.15] tracking-[-0.005em] text-white/80"
          style={{ fontSize: compact ? 22 : 27, textShadow: compact ? '0 1px 12px rgb(0 0 0 / 0.25)' : '0 1px 18px rgb(60 56 50 / 0.18)' }}
        >
          {partOfDay(now)},
        </motion.p>
        <motion.h1
          variants={rise}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="m-0 font-normal leading-[1.08] tracking-[-0.02em] text-white"
          style={{ fontSize: compact ? 42 : 52, textShadow: compact ? '0 1px 12px rgb(0 0 0 / 0.25)' : '0 2px 24px rgb(60 56 50 / 0.22)' }}
        >
          Alejandra
        </motion.h1>
      </motion.hgroup>
    </MotionConfig>
  )
}
