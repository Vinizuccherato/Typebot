import { useEffect } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'

export interface AnimatedNumberProps {
  value: number
  decimals?: number
  className?: string
  /** Spring stiffness — lower = lazier counting. */
  stiffness?: number
}

/** Spring-interpolated number (tabular, no layout shift). */
export function AnimatedNumber({ value, decimals = 0, className, stiffness = 180 }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness, damping: 26, mass: 0.8 })
  const text = useTransform(spring, (v) => v.toFixed(decimals))
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  return <motion.span className={className ? `tabular ${className}` : 'tabular'}>{text}</motion.span>
}
