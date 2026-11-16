import { useRef } from 'react'
import { motion } from 'motion/react'
import { PersonStanding, Shirt, type LucideIcon } from 'lucide-react'
import { useStudio, type NavId } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { cn, springs } from '../../lib/utils'

/** A filled azure dot — the "head" section glyph as in the reference. */
const HeadDot: LucideIcon = (({ size = 16 }: { size?: number | string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <circle cx="8" cy="8" r="6" fill="currentColor" />
  </svg>
)) as unknown as LucideIcon

const ITEMS: { id: NavId; label: string; icon: LucideIcon }[] = [
  { id: 'head', label: 'Head & face', icon: HeadDot },
  { id: 'body', label: 'Body', icon: PersonStanding },
  { id: 'outfit', label: 'Outfit', icon: Shirt },
]

export function Rail() {
  const nav = useStudio((s) => s.nav)
  const setNav = useStudio((s) => s.setNav)
  const { mode } = useArtboard()
  const horizontal = mode === 'compact'
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const idx = ITEMS.findIndex((i) => i.id === nav)

  return (
    <nav
      role="tablist"
      aria-label="Edit section"
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      className={cn('flex h-full w-full items-center justify-center gap-[18px]', horizontal ? 'flex-row' : 'flex-col')}
      onKeyDown={(e) => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
        if (!d) return
        e.preventDefault()
        const n = (idx + d + ITEMS.length) % ITEMS.length
        setNav(ITEMS[n].id)
        refs.current[n]?.focus()
      }}
    >
      {ITEMS.map((it, i) => {
        const on = it.id === nav
        const Icon = it.icon
        return (
          <motion.button
            key={it.id}
            ref={(el) => void (refs.current[i] = el)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={it.label}
            title={it.label}
            tabIndex={on ? 0 : -1}
            onClick={() => setNav(it.id)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="glass glass-pill relative grid h-[52px] w-[52px] cursor-pointer place-items-center rounded-full outline-none"
          >
            {on && (
              <motion.span
                layoutId="rail-active"
                className="absolute inset-0 z-[2] rounded-full bg-white"
                style={{ boxShadow: '0 8px 20px -8px rgb(60 64 90 / 0.5)' }}
                transition={springs.snappy}
              />
            )}
            <span className={cn('relative z-[3] transition-colors duration-300', on ? 'text-azure' : 'text-white')}>
              <Icon size={on && it.id === 'head' ? 18 : 19} strokeWidth={1.7} />
            </span>
          </motion.button>
        )
      })}
    </nav>
  )
}
