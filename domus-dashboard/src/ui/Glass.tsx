import { forwardRef, useImperativeHandle } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '../lib/utils'
import { useSpecular } from '../lib/useSpecular'

export type GlassVariant = 'frost' | 'smoke' | 'inset' | 'well' | 'ink' | 'pill' | 'solid'

export interface GlassProps extends HTMLMotionProps<'div'> {
  variant?: GlassVariant
  /** Pointer-following specular reflex. `true` = 1, or pass an opacity 0..1. */
  specular?: boolean | number
  radius?: number | string
}

/**
 * The liquid-glass surface every Domus card is built on.
 * Material is defined in index.css (.glass + .glass-{variant}).
 */
export const Glass = forwardRef<HTMLDivElement, GlassProps>(function Glass(
  { variant = 'frost', specular = false, radius = 28, className, style, onPointerMove, onPointerLeave, ...rest },
  forwarded,
) {
  const strength = specular === true ? 1 : specular === false ? 0 : specular
  const spec = useSpecular<HTMLDivElement>(strength)
  useImperativeHandle(forwarded, () => spec.ref.current as HTMLDivElement)

  return (
    <motion.div
      ref={spec.ref}
      className={cn('glass', `glass-${variant}`, className)}
      style={{ borderRadius: radius, ...style }}
      onPointerMove={(e) => {
        if (strength) spec.onPointerMove(e)
        onPointerMove?.(e)
      }}
      onPointerLeave={(e) => {
        if (strength) spec.onPointerLeave()
        onPointerLeave?.(e)
      }}
      {...rest}
    />
  )
})
