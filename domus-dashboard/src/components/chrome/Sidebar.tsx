import { useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { BellRing, CalendarDays, CloudSun, House, Lightbulb, Zap, type LucideIcon } from 'lucide-react'
import { useDomus, type FocusId, type NavId } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { Glass } from '../../ui/Glass'
import { cn, springs } from '../../lib/utils'
import { openPalette } from './paletteScope'

interface NavItem {
  id: NavId
  icon: LucideIcon
  label: string
  hint: string
  focus?: FocusId
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: House, label: 'Home', hint: 'Residence overview', focus: 'overview' },
  { id: 'scenes', icon: CalendarDays, label: 'Scenes', hint: 'Routines & moments' },
  { id: 'lighting', icon: Lightbulb, label: 'Lighting', hint: 'Lamps & LED strips', focus: 'main-hall' },
  { id: 'climate', icon: CloudSun, label: 'Climate', hint: 'Zones & comfort', focus: 'main-hall' },
  { id: 'energy', icon: Zap, label: 'Energy', hint: 'Solar & consumption', focus: 'solar' },
  { id: 'security', icon: BellRing, label: 'Security', hint: 'Doors & sensors', focus: 'front-door' },
]

/** Shared navigation behaviour (sidebar, command palette). */
export function navigateTo(id: NavId) {
  const item = NAV_ITEMS.find((n) => n.id === id)
  const s = useDomus.getState()
  s.setNav(id)
  if (id === 'scenes') {
    openPalette('scenes')
    return
  }
  if (item?.focus) s.setFocus(item.focus)
  if (item?.focus === 'main-hall') s.selectRoom('main-hall')
}

const ITEM = 40
const GAP = 10
const PAD = 6

export function Sidebar() {
  const { mode } = useArtboard()
  const horizontal = mode === 'compact'
  const nav = useDomus((s) => s.nav)
  const [tip, setTip] = useState<number | null>(null)
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((n) => n.id === nav),
  )

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const next = horizontal ? 'ArrowRight' : 'ArrowDown'
    const prev = horizontal ? 'ArrowLeft' : 'ArrowUp'
    let j: number | null = null
    if (e.key === next) j = (i + 1) % NAV_ITEMS.length
    else if (e.key === prev) j = (i - 1 + NAV_ITEMS.length) % NAV_ITEMS.length
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = NAV_ITEMS.length - 1
    if (j !== null) {
      e.preventDefault()
      refs.current[j]?.focus()
      setTip(j)
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Primary" className="relative" onPointerLeave={() => setTip(null)}>
        <Glass
          variant="frost"
          radius={999}
          specular={0.6}
          className={cn('flex items-center', horizontal ? 'flex-row' : 'flex-col')}
          style={{ padding: PAD, gap: GAP }}
          initial={{ opacity: 0, x: horizontal ? 0 : -16, y: horizontal ? 16 : 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
          transition={{ ...springs.soft, delay: 0.1 }}
        >
          {NAV_ITEMS.map((item, i) => {
            const active = item.id === nav
            const Icon = item.icon
            return (
              <button
                key={item.id}
                ref={(el) => {
                  refs.current[i] = el
                }}
                type="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => navigateTo(item.id)}
                onPointerEnter={() => setTip(i)}
                onFocus={(e) => e.currentTarget.matches(':focus-visible') && setTip(i)}
                onBlur={() => setTip(null)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  'group relative z-[3] grid shrink-0 cursor-pointer place-items-center rounded-full outline-none transition-colors duration-300',
                  active ? 'text-[#121210]' : 'text-white/70 hover:text-white',
                )}
                style={{ width: ITEM, height: ITEM }}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="glass glass-solid inset-0 rounded-full"
                    style={{ position: 'absolute' }}
                    transition={springs.snappy}
                  />
                )}
                {!active && (
                  <span className="absolute inset-0 scale-75 rounded-full bg-white/0 transition-all duration-300 ease-[var(--ease-glass)] group-hover:scale-100 group-hover:bg-white/10 group-active:scale-90" />
                )}
                <motion.span className="relative z-[3] grid place-items-center" whileTap={{ scale: 0.84 }} transition={springs.snappy}>
                  <Icon size={18} strokeWidth={1.6} />
                </motion.span>
              </button>
            )
          })}
        </Glass>

        {/* Tooltip layer — sibling of the glass so it floats above other slots */}
        <AnimatePresence>
          {tip !== null && (
            <motion.div
              key="tip"
              role="tooltip"
              className="pointer-events-none absolute z-50"
              style={
                horizontal
                  ? { bottom: `calc(100% + 10px)`, left: PAD + tip * (ITEM + GAP) + ITEM / 2, x: '-50%' }
                  : { left: `calc(100% + 12px)`, top: PAD + tip * (ITEM + GAP) + ITEM / 2, y: '-50%' }
              }
              initial={{ opacity: 0, scale: 0.9, ...(horizontal ? { y: 6 } : { x: -6 }) }}
              animate={{
                opacity: 1,
                scale: 1,
                ...(horizontal ? { y: 0 } : { x: 0 }),
                ...(horizontal
                  ? { left: PAD + tip * (ITEM + GAP) + ITEM / 2 }
                  : { top: PAD + tip * (ITEM + GAP) + ITEM / 2 }),
              }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.12 } }}
              transition={springs.snappy}
            >
              <Glass
                variant="pill"
                radius={14}
                className="whitespace-nowrap px-3 py-1.5"
                style={{
                  ['--g-fill-a' as string]: 'rgb(60 58 54 / 0.62)',
                  ['--g-fill-b' as string]: 'rgb(36 35 32 / 0.55)',
                }}
              >
                <div className="relative z-[3] text-[12.5px] leading-tight text-white">{NAV_ITEMS[tip].label}</div>
                <div className="relative z-[3] text-[10.5px] leading-tight text-white/50">{NAV_ITEMS[tip].hint}</div>
              </Glass>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </MotionConfig>
  )
}
