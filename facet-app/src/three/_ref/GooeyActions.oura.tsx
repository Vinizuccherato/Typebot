import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { SIZES, useRings, type Ring } from '../store'
import { springs } from '../lib/utils'
import { AnimatedNumber } from '../ui/AnimatedNumber'

type Mode = 'idle' | 'sizing' | 'pairing'

const D = 66 // circle diameter
const H = 62 // pill height
const GAP = 3 // close enough for the metaball neck to form

/**
 * Size · Activate · Battery — three white blobs fused by a metaball (goo) filter,
 * exactly like the reference. Shapes live in a filtered layer; text and hit
 * targets sit in an unfiltered twin layer with identical geometry.
 */
export function GooeyActions({ ring }: { ring: Ring }) {
  const activeId = useRings((s) => s.activeId)
  const activate = useRings((s) => s.activate)
  const setSize = useRings((s) => s.setSize)
  const showToast = useRings((s) => s.showToast)
  const [mode, setMode] = useState<Mode>('idle')
  const [press, setPress] = useState<'size' | 'pill' | 'battery' | null>(null)
  const timer = useRef(0)
  const isActive = ring.id === activeId

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => setMode('idle'), [ring.id])

  const onPill = () => {
    if (mode === 'sizing') return setMode('idle')
    if (isActive || mode === 'pairing') return
    setMode('pairing')
    timer.current = window.setTimeout(() => {
      activate(ring.id)
      setMode('idle')
    }, 1500)
  }

  const onSize = () => setMode((m) => (m === 'sizing' ? 'idle' : m === 'pairing' ? m : 'sizing'))

  const onBattery = () => {
    const days = Math.max(0.2, (ring.battery / 100) * 7)
    showToast(`${ring.battery}% · about ${days < 1 ? `${Math.round(days * 24)} h` : `${days.toFixed(1)} days`} left`)
  }

  const sizing = mode === 'sizing'
  const pairing = mode === 'pairing'

  // shared geometry for both layers
  const left = { width: sizing ? D + 6 : D, height: sizing ? D + 6 : D, scale: press === 'size' ? 0.92 : pairing ? 0.94 : 1 }
  const right = { width: sizing ? 0 : D, height: sizing ? 0 : D, marginLeft: sizing ? 0 : GAP, scale: press === 'battery' ? 0.92 : pairing ? 0.94 : 1 }
  const pill = { height: H, scaleY: press === 'pill' ? 0.9 : 1, scaleX: press === 'pill' ? 0.97 : pairing ? 1.02 : 1 }

  return (
    <div className="relative h-[72px] w-full">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="goo" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </svg>

      {/* metaball layer */}
      <div className="absolute inset-0 flex items-center" style={{ filter: 'url(#goo) drop-shadow(0 10px 18px rgb(40 60 70 / 0.18))' }} aria-hidden>
        <motion.div className="shrink-0 rounded-full bg-white" initial={false} animate={left} transition={springs.bouncy} />
        <motion.div className="ml-[3px] flex-1 rounded-full bg-white" initial={false} animate={pill} transition={springs.bouncy} />
        <motion.div className="shrink-0 rounded-full bg-white" initial={false} animate={right} transition={springs.bouncy} />
      </div>

      {/* content layer (same geometry, no filter) */}
      <div className="absolute inset-0 flex items-center text-[#1b2024]">
        <motion.button
          type="button"
          aria-label={`Ring size ${ring.size}. ${sizing ? 'Close size picker' : 'Change size'}`}
          aria-expanded={sizing}
          onClick={onSize}
          onPointerDown={() => setPress('size')}
          onPointerUp={() => setPress(null)}
          onPointerLeave={() => setPress(null)}
          className="grid shrink-0 cursor-pointer place-items-center rounded-full outline-none"
          initial={false}
          animate={left}
          transition={springs.bouncy}
        >
          <span className="flex flex-col items-center leading-none">
            <AnimatedNumber value={ring.size} className="text-[23px] font-light" stiffness={300} />
            <span className="mt-[3px] text-[8.5px] font-normal tracking-[0.02em] text-[#1b2024]/55">Size</span>
          </span>
        </motion.button>

        <motion.div className="relative ml-[3px] flex flex-1 items-center justify-center overflow-hidden rounded-full" initial={false} animate={pill} transition={springs.bouncy}>
          <AnimatePresence mode="popLayout" initial={false}>
            {sizing ? (
              <motion.div
                key="sizes"
                role="radiogroup"
                aria-label="Ring size"
                className="flex w-full items-center justify-between px-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.22 }}
              >
                {SIZES.map((sz) => {
                  const on = sz === ring.size
                  return (
                    <button
                      key={sz}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={`Size ${sz}`}
                      onClick={() => setSize(ring.id, sz)}
                      onKeyDown={(e) => {
                        const i = SIZES.indexOf(ring.size)
                        if (e.key === 'ArrowRight') setSize(ring.id, SIZES[Math.min(SIZES.length - 1, i + 1)])
                        if (e.key === 'ArrowLeft') setSize(ring.id, SIZES[Math.max(0, i - 1)])
                        if (e.key === 'Enter' || e.key === 'Escape') setMode('idle')
                      }}
                      className="relative grid h-9 w-[26px] cursor-pointer place-items-center rounded-full outline-none"
                    >
                      {on && <motion.span layoutId="size-dot" className="absolute inset-0 rounded-full bg-[#1b2024]" transition={springs.snappy} />}
                      <span className={`relative text-[14px] tabular transition-colors ${on ? 'text-white' : 'text-[#1b2024]/55'}`}>{sz}</span>
                    </button>
                  )
                })}
              </motion.div>
            ) : (
              <motion.button
                key="activate"
                type="button"
                onClick={onPill}
                onPointerDown={() => setPress('pill')}
                onPointerUp={() => setPress(null)}
                onPointerLeave={() => setPress(null)}
                aria-disabled={isActive || pairing}
                aria-label={isActive ? `${ring.material} ${ring.color} is the active ring` : `Activate ${ring.material} ${ring.color}`}
                className={`relative flex h-full w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-normal outline-none ${isActive ? 'cursor-default' : 'cursor-pointer'}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.22 }}
              >
                {pairing && (
                  <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                    <span
                      className="absolute inset-y-0 w-1/2"
                      style={{ background: 'linear-gradient(90deg, transparent, rgb(150 180 195 / 0.35), transparent)', animation: 'shimmer 1.1s var(--ease-glass) infinite' }}
                    />
                  </span>
                )}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isActive ? 'active' : pairing ? 'pairing' : 'idle'}
                    className="relative flex items-center gap-1.5"
                    initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(3px)' }}
                    transition={{ duration: 0.2 }}
                  >
                    {isActive ? (
                      <>
                        <Check size={15} strokeWidth={2} /> Active
                      </>
                    ) : pairing ? (
                      'Pairing…'
                    ) : (
                      'Activate'
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          type="button"
          onClick={onBattery}
          onPointerDown={() => setPress('battery')}
          onPointerUp={() => setPress(null)}
          onPointerLeave={() => setPress(null)}
          aria-label={`Battery ${ring.battery}%`}
          tabIndex={sizing ? -1 : 0}
          className="relative grid shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full outline-none"
          initial={false}
          animate={{ ...right, opacity: sizing ? 0 : 1 }}
          transition={springs.bouncy}
        >
          <svg className="absolute inset-[5px]" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="26" fill="none" stroke="#1b2024" strokeOpacity="0.07" strokeWidth="1.5" />
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              fill="none"
              stroke="#1b2024"
              strokeOpacity="0.35"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              initial={false}
              animate={{ pathLength: ring.battery / 100 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
            />
          </svg>
          <span className="flex flex-col items-center leading-none">
            <AnimatedNumber value={ring.battery} className="text-[23px] font-light" stiffness={200} />
            <span className="mt-[3px] text-[8.5px] font-normal tracking-[0.02em] text-[#1b2024]/55">Battery</span>
          </span>
        </motion.button>
      </div>
    </div>
  )
}
