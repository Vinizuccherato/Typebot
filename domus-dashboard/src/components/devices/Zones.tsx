import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useDomus, type RoomId } from '../../store'
import { Glass } from '../../ui/Glass'
import { cn, springs } from '../../lib/utils'
import { svgId } from './hooks'

const ORDER: RoomId[] = ['main-hall', 'kitchen', 'master-suite', 'studio', 'terrace']

/** "+3 synchronized zones" — avatar stack of procedural room thumbnails + sync popover. */
export function ZonePill() {
  const rooms = useDomus((s) => s.rooms)
  const initial = useDomus((s) => s.zonesSynced)
  const toast = useDomus((s) => s.toast)
  const [open, setOpen] = useState(false)
  const [synced, setSynced] = useState<RoomId[]>(() => ORDER.slice(0, initial))
  const btn = useRef<HTMLButtonElement>(null)
  const pop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btn.current?.focus({ preventScroll: true })
      }
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (pop.current?.contains(t) || btn.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown, true)
    }
  }, [open])

  const toggle = (id: RoomId) => {
    const on = !synced.includes(id)
    setSynced((s) => (on ? ORDER.filter((r) => s.includes(r) || r === id) : s.filter((r) => r !== id)))
    toast({ title: rooms[id].name, detail: on ? 'Zone synchronized' : 'Zone unlinked', tone: on ? 'success' : 'default' })
  }

  const stack = synced.slice(0, 3)

  return (
    <div className="relative">
      <motion.button
        ref={btn}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.97 }}
        transition={springs.snappy}
        className="glass glass-well flex h-[40px] cursor-pointer items-center gap-2.5 rounded-full pl-[6px] pr-4 outline-none"
      >
        <span className="relative z-[3] flex items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {stack.map((id, i) => (
              <motion.span
                key={id}
                layout
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={springs.snappy}
                className={cn('relative block rounded-full', i > 0 && '-ml-[9px]', i === 2 && '@max-sm:hidden')}
                style={{ zIndex: 3 - i, boxShadow: '0 0 0 2px rgb(30 29 27 / 0.9)' }}
              >
                <RoomThumb id={id} size={28} />
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
        <span className="tabular relative z-[3] whitespace-nowrap text-[12.5px] text-white/75">
          +{synced.length}
          <span className="@max-sm:hidden"> synchronized zones</span>
          <span className="hidden @max-sm:inline"> zones</span>
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <Glass
            ref={pop}
            role="dialog"
            aria-label="Synchronized zones"
            variant="frost"
            radius={22}
            className="z-40 w-[264px] p-2"
            // inline: `.glass { position: relative }` is unlayered and would beat Tailwind's `absolute`
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: 0,
              transformOrigin: 'calc(100% - 40px) 100%',
              ['--g-fill-a' as string]: 'rgb(66 63 59 / 0.9)',
              ['--g-fill-b' as string]: 'rgb(36 35 32 / 0.94)',
            }}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4, transition: { duration: 0.15 } }}
            transition={springs.snappy}
          >
            <div className="relative z-[3]">
              <div className="flex items-baseline justify-between px-2 pb-1.5 pt-1">
                <span className="text-[12.5px] text-white/90">Zones</span>
                <span className="tabular text-[10.5px] text-white/60">
                  {synced.length} of {ORDER.length} in sync
                </span>
              </div>
              <ul className="flex flex-col gap-0.5">
                {ORDER.map((id) => {
                  const r = rooms[id]
                  const on = synced.includes(id)
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(id)}
                        className="flex h-[40px] w-full cursor-pointer items-center gap-2.5 rounded-[14px] px-1.5 text-left outline-none transition-colors hover:bg-white/10"
                      >
                        <RoomThumb id={id} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] leading-tight text-white/90">{r.name}</span>
                          <span className="tabular block text-[10.5px] leading-tight text-white/55">
                            {r.code} · {r.temperature.toFixed(1)}°C
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5 pr-1.5 text-[10.5px]">
                          <span className="relative grid h-2 w-2 place-items-center">
                            {on && (
                              <motion.span
                                className="absolute inset-0 rounded-full bg-lime-glow"
                                animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                              />
                            )}
                            <span
                              className={cn(
                                'relative h-2 w-2 rounded-full transition-colors duration-300',
                                on ? 'bg-lime-glow shadow-[0_0_8px_var(--accent)]' : 'bg-white/25',
                              )}
                            />
                          </span>
                          <span className={on ? 'text-white/80' : 'text-white/55'}>{on ? 'Synced' : 'Sync'}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Glass>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Tiny procedural interior illustrations (no remote images). */
export function RoomThumb({ id, size = 28 }: { id: RoomId; size?: number }) {
  const uid = svgId(useId())
  const g = (n: string) => `${uid}-${n}`
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className="block rounded-full" aria-hidden>
      <defs>
        <clipPath id={g('c')}>
          <circle cx="14" cy="14" r="14" />
        </clipPath>
        <linearGradient id={g('wall')} x1="0" y1="0" x2="0" y2="1">
          {id === 'main-hall' && (
            <>
              <stop offset="0" stopColor="#d9cfbf" />
              <stop offset="1" stopColor="#a6977f" />
            </>
          )}
          {id === 'kitchen' && (
            <>
              <stop offset="0" stopColor="#e4e1da" />
              <stop offset="1" stopColor="#b9b3a8" />
            </>
          )}
          {id === 'master-suite' && (
            <>
              <stop offset="0" stopColor="#8f93a6" />
              <stop offset="1" stopColor="#cdb9a5" />
            </>
          )}
          {id === 'studio' && (
            <>
              <stop offset="0" stopColor="#3a3834" />
              <stop offset="1" stopColor="#24231f" />
            </>
          )}
          {id === 'terrace' && (
            <>
              <stop offset="0" stopColor="#d6e1e3" />
              <stop offset="1" stopColor="#b9c9c4" />
            </>
          )}
        </linearGradient>
        <linearGradient id={g('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd3d8" />
          <stop offset="1" stopColor="#7f9d72" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${g('c')})`}>
        <rect width="28" height="28" fill={`url(#${g('wall')})`} />
        {id === 'main-hall' && (
          <>
            <rect x="4" y="5" width="20" height="13" rx="1" fill={`url(#${g('sky')})`} />
            <rect x="13.6" y="5" width="0.8" height="13" fill="#2b2a27" opacity="0.7" />
            <circle cx="8" cy="15" r="3.5" fill="#5f7d4f" opacity="0.85" />
            <rect x="0" y="20" width="28" height="8" fill="#8b7b65" />
            <rect x="5" y="16.5" width="14" height="5" rx="1.6" fill="#2f2d2a" />
            <rect x="6" y="15.5" width="12" height="2.5" rx="1.2" fill="#46433e" />
            <circle cx="22" cy="12" r="1.4" fill="#f3e3b5" />
          </>
        )}
        {id === 'kitchen' && (
          <>
            <line x1="9" y1="0" x2="9" y2="8" stroke="#3a3834" strokeWidth="0.6" />
            <line x1="19" y1="0" x2="19" y2="8" stroke="#3a3834" strokeWidth="0.6" />
            <circle cx="9" cy="9" r="2" fill="#f2d58a" />
            <circle cx="19" cy="9" r="2" fill="#f2d58a" />
            <circle cx="9" cy="9" r="4" fill="#f2d58a" opacity="0.25" />
            <circle cx="19" cy="9" r="4" fill="#f2d58a" opacity="0.25" />
            <rect x="0" y="17" width="28" height="11" fill="#4a4540" />
            <rect x="0" y="16" width="28" height="2" fill="#efece6" />
            <rect x="11" y="19.5" width="6" height="5" rx="0.6" fill="#36322e" />
          </>
        )}
        {id === 'master-suite' && (
          <>
            <rect x="15" y="4" width="10" height="11" rx="1" fill="#e9c9a0" opacity="0.8" />
            <rect x="0" y="21" width="28" height="7" fill="#7a6a5b" />
            <rect x="3" y="15" width="17" height="7" rx="1.6" fill="#f4f1ec" />
            <rect x="3" y="12.5" width="5" height="4" rx="1.4" fill="#e2ddd5" />
            <rect x="3" y="18.5" width="17" height="3.5" rx="1.2" fill="#b9a993" />
          </>
        )}
        {id === 'studio' && (
          <>
            <rect x="6" y="7" width="16" height="10" rx="1" fill="#151513" />
            <rect x="7" y="8" width="14" height="8" rx="0.6" fill="#c6ef8e" opacity="0.65" />
            <circle cx="14" cy="12" r="9" fill="#c6ef8e" opacity="0.12" />
            <rect x="13" y="17" width="2" height="3" fill="#151513" />
            <rect x="0" y="21" width="28" height="7" fill="#4b4640" />
          </>
        )}
        {id === 'terrace' && (
          <>
            <circle cx="20" cy="8" r="3" fill="#f6efd7" />
            <rect x="0" y="19" width="28" height="9" fill="#9a8a74" />
            <path d="M0 19h28" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.6" />
            <ellipse cx="8" cy="15" rx="4.2" ry="5" fill="#6f8f5a" />
            <rect x="7.4" y="17" width="1.2" height="3" fill="#4b3d2f" />
            <rect x="14" y="15" width="9" height="4" rx="1" fill="#efece6" />
          </>
        )}
        {/* lens sheen */}
        <ellipse cx="10" cy="5" rx="12" ry="6" fill="#fff" opacity="0.16" />
      </g>
      <circle cx="14" cy="14" r="13.5" fill="none" stroke="#fff" strokeOpacity="0.28" />
    </svg>
  )
}
