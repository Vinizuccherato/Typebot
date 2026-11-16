import { useId, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { springs } from '../../lib/utils'

const D = 60 // circle diameter
const H = 56 // pill height (primary CTA height per RESEARCH.md)
const GAP = 3 // close enough for the metaball neck to form

export interface GooeySide {
  icon: ReactNode
  label: string
  onPress?: () => void
  /** press-and-hold (e.g. compare); start fires on pointer down / key down, end on release */
  onHoldStart?: () => void
  onHoldEnd?: () => void
  active?: boolean
}

/**
 * Circle · pill · circle fused by a metaball (goo) filter — carried over from the ring app.
 * The porcelain shapes live in a filtered layer; text and hit targets sit in an unfiltered
 * twin layer with identical geometry, so labels stay crisp.
 */
export function GooeyRow({ left, center, right }: { left: GooeySide; center: { label: ReactNode; ariaLabel: string; onPress: () => void }; right: GooeySide }) {
  const fid = `goo-${useId().replace(/:/g, '')}`
  const [press, setPress] = useState<'l' | 'c' | 'r' | null>(null)

  const circle = (k: 'l' | 'r', side: GooeySide) => ({ width: D, height: D, scale: press === k ? 0.9 : side.active ? 1.06 : 1 })
  const pill = { height: H, scaleY: press === 'c' ? 0.9 : 1, scaleX: press === 'c' ? 0.97 : 1 }

  const sideProps = (k: 'l' | 'r', side: GooeySide) => ({
    'aria-label': side.label,
    'aria-pressed': side.onHoldStart ? side.active : undefined,
    onPointerDown: () => {
      setPress(k)
      side.onHoldStart?.()
    },
    onPointerUp: () => {
      setPress(null)
      side.onHoldEnd?.()
    },
    onPointerLeave: () => {
      if (press === k) side.onHoldEnd?.()
      setPress(null)
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && side.onHoldStart && !e.repeat) side.onHoldStart()
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && side.onHoldEnd) side.onHoldEnd()
    },
    onClick: side.onPress,
  })

  return (
    <div className="relative h-[66px] w-full">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id={fid} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </svg>

      {/* metaball layer */}
      <div className="absolute inset-0 flex items-center" style={{ filter: `url(#${fid}) drop-shadow(0 12px 22px rgb(195 180 255 / 0.28))` }} aria-hidden>
        <motion.div className="shrink-0 rounded-full bg-[var(--color-porcelain)]" initial={false} animate={circle('l', left)} transition={springs.bouncy} />
        <motion.div className="flex-1 rounded-full bg-[var(--color-porcelain)]" style={{ marginLeft: GAP, marginRight: GAP }} initial={false} animate={pill} transition={springs.bouncy} />
        <motion.div className="shrink-0 rounded-full bg-[var(--color-porcelain)]" initial={false} animate={circle('r', right)} transition={springs.bouncy} />
      </div>

      {/* content layer (same geometry, no filter) */}
      <div className="absolute inset-0 flex items-center text-[var(--color-ink)]">
        <motion.button type="button" className="grid shrink-0 cursor-pointer place-items-center rounded-full outline-none" initial={false} animate={circle('l', left)} transition={springs.bouncy} {...sideProps('l', left)}>
          {left.icon}
        </motion.button>
        <motion.button
          type="button"
          aria-label={center.ariaLabel}
          onClick={center.onPress}
          onPointerDown={() => setPress('c')}
          onPointerUp={() => setPress(null)}
          onPointerLeave={() => setPress(null)}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] font-semibold outline-none"
          style={{ marginLeft: GAP, marginRight: GAP }}
          initial={false}
          animate={pill}
          transition={springs.bouncy}
        >
          {center.label}
        </motion.button>
        <motion.button type="button" className="grid shrink-0 cursor-pointer place-items-center rounded-full outline-none" initial={false} animate={circle('r', right)} transition={springs.bouncy} {...sideProps('r', right)}>
          {right.icon}
        </motion.button>
      </div>
    </div>
  )
}
