import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  ArrowUpDown,
  BedDouble,
  Bot,
  CookingPot,
  CornerDownLeft,
  Lamp,
  Leaf,
  Lock,
  LockOpen,
  Palette,
  Pause,
  Play,
  SearchX,
  Sofa,
  Speaker,
  Thermometer,
  ThermometerSnowflake,
  TreePalm,
  Tv,
  type LucideIcon,
} from 'lucide-react'
import { useDomus, type FocusId, type RoomId } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { SCENES } from '../../lib/scenes'
import { Glass } from '../../ui/Glass'
import { cn, springs } from '../../lib/utils'
import { NAV_ITEMS, navigateTo } from './Sidebar'
import { PALETTE_SCOPES, usePaletteScope, type PaletteScope } from './paletteScope'

type Group = Exclude<PaletteScope, 'all'>

interface PItem {
  id: string
  group: Group
  title: string
  hint: string
  icon: LucideIcon
  keywords?: string
  /** right-aligned state label ("On", "Locked"…) */
  state?: string
  /** keep the palette open after running */
  stay?: boolean
  run: () => void
}

const GROUP_LABEL: Record<Group, string> = {
  rooms: 'Rooms',
  scenes: 'Scenes',
  devices: 'Devices & controls',
  navigate: 'Navigate',
}
const GROUP_ORDER: Group[] = ['rooms', 'scenes', 'devices', 'navigate']

const ROOM_ICON: Record<RoomId, LucideIcon> = {
  'main-hall': Sofa,
  kitchen: CookingPot,
  'master-suite': BedDouble,
  studio: Palette,
  terrace: TreePalm,
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/**
 * Token-based fuzzy score: prefix > word-start > substring > initials/subsequence.
 * Subsequence matching (e.g. "mhl" → "Main HalL") only applies when `loose`, and
 * must start on a word boundary so short queries stay precise. 0 = no match.
 */
function fuzzy(query: string, text: string, loose = false): number {
  const t = norm(text)
  let total = 0
  for (const tok of norm(query).split(/\s+/).filter(Boolean)) {
    const idx = t.indexOf(tok)
    if (idx === 0) total += 6
    else if (idx > 0 && /[\s·\-/"]/.test(t[idx - 1])) total += 4
    else if (idx > 0) total += 2
    else if (loose) {
      const words = t.split(/[\s·\-/"]+/)
      const start = words.findIndex((w) => w.startsWith(tok[0]))
      if (start < 0) return 0
      const rest = words.slice(start).join(' ')
      let j = 0
      for (const ch of rest) {
        if (ch === tok[j]) j++
        if (j === tok.length) break
      }
      if (j < tok.length || rest.length > tok.length * 4) return 0
      total += 0.5
    } else return 0
  }
  return total
}

function useItems(): PItem[] {
  const rooms = useDomus((s) => s.rooms)
  const nodes = useDomus((s) => s.nodes)
  const lamp = useDomus((s) => s.lamp)
  const led = useDomus((s) => s.led)
  const speaker = useDomus((s) => s.speaker)
  const door = useDomus((s) => s.door)
  const eco = useDomus((s) => s.eco)
  const selected = useDomus((s) => s.selectedRoom)

  return useMemo(() => {
    const S = useDomus.getState
    const toast = (title: string, detail?: string, tone: 'default' | 'success' | 'warning' = 'default') =>
      S().toast({ title, detail, tone })
    const hall = rooms['main-hall']
    const items: PItem[] = []

    for (const r of Object.values(rooms)) {
      items.push({
        id: `room-${r.id}`,
        group: 'rooms',
        title: r.name,
        hint: `${r.code} · ${r.temperature.toFixed(1)}°C · ${r.area} m² · ${r.devices} devices`,
        icon: ROOM_ICON[r.id],
        keywords: 'room zone',
        state: r.id === selected ? 'Viewing' : undefined,
        run: () => {
          S().selectRoom(r.id)
          S().setFocus((r.id === 'main-hall' ? 'main-hall' : 'overview') as FocusId)
          toast(r.name, `${r.temperature.toFixed(1)}°C · ${r.humidity}% humidity · ${r.occupants} people`)
        },
      })
    }

    for (const sc of SCENES) {
      items.push({
        id: `scene-${sc.id}`,
        group: 'scenes',
        title: sc.name,
        hint: sc.hint,
        icon: sc.icon,
        keywords: `scene routine ${sc.keywords.join(' ')}`,
        run: () => {
          const actions = sc.run()
          toast(`${sc.name} activated`, actions.join(' · '), 'success')
        },
      })
    }

    const dev = (p: Omit<PItem, 'group'>) => items.push({ ...p, group: 'devices' })
    dev({
      id: 'tv',
      title: `Turn ${nodes.tv.on ? 'off' : 'on'} Smart OLED TV 65"`,
      hint: 'Main Hall · node',
      icon: Tv,
      keywords: 'television tv screen tele',
      state: nodes.tv.on ? 'On' : 'Off',
      run: () => {
        S().toggleNode('tv')
        toast(`Smart OLED TV ${S().nodes.tv.on ? 'on' : 'off'}`, 'Main Hall')
      },
    })
    dev({
      id: 'sonos',
      title: `Turn ${nodes.sonos.on ? 'off' : 'on'} Sonos Era 300`,
      hint: 'Main Hall · spatial audio',
      icon: Speaker,
      keywords: 'sonos speaker audio music',
      state: nodes.sonos.on ? 'On' : 'Off',
      run: () => {
        S().toggleNode('sonos')
        toast(`Sonos Era 300 ${S().nodes.sonos.on ? 'on' : 'off'}`)
      },
    })
    dev({
      id: 'cleanbot',
      title: `${nodes.cleanbot.on ? 'Dock' : 'Start'} Aether CleanBot V4`,
      hint: nodes.cleanbot.on ? 'Cleaning Main Hall · 64% battery' : 'Docked · ready',
      icon: Bot,
      keywords: 'robot vacuum clean aspirador limpiar',
      state: nodes.cleanbot.on ? 'Running' : 'Docked',
      run: () => {
        S().toggleNode('cleanbot')
        toast(S().nodes.cleanbot.on ? 'CleanBot started' : 'CleanBot docked', 'Aether CleanBot V4')
      },
    })
    dev({
      id: 'lamp',
      title: `Turn ${lamp.on ? 'off' : 'on'} Hue Master Lamp`,
      hint: `${lamp.intensity}% intensity`,
      icon: Lamp,
      keywords: 'light lamp luz lampara hue',
      state: lamp.on ? 'On' : 'Off',
      run: () => {
        S().setLamp({ on: !S().lamp.on })
        toast(`Hue Master Lamp ${S().lamp.on ? 'on' : 'off'}`, `${S().lamp.intensity}% intensity`)
      },
    })
    dev({
      id: 'led',
      title: `Turn ${led.on ? 'off' : 'on'} LED Strip Frame`,
      hint: `${led.brightness}% · ${led.color.toUpperCase()}`,
      icon: Palette,
      keywords: 'led strip light color colour',
      state: led.on ? 'On' : 'Off',
      run: () => {
        S().setLed({ on: !S().led.on })
        toast(`LED Strip Frame ${S().led.on ? 'on' : 'off'}`)
      },
    })
    dev({
      id: 'speaker',
      title: `${speaker.playing ? 'Pause' : 'Play'} Pro Max Studio Speaker`,
      hint: `${speaker.track} — ${speaker.artist} · ${speaker.volume}%`,
      icon: speaker.playing ? Pause : Play,
      keywords: 'music play pause speaker musica',
      state: speaker.playing ? 'Playing' : 'Paused',
      run: () => {
        const playing = !S().speaker.playing
        S().setSpeaker({ on: true, playing })
        toast(playing ? 'Now playing' : 'Paused', `${S().speaker.track} — ${S().speaker.artist}`)
      },
    })
    dev({
      id: 'door',
      title: `${door.locked ? 'Unlock' : 'Lock'} Front Door`,
      hint: door.locked ? 'Currently locked' : 'Currently unlocked',
      icon: door.locked ? LockOpen : Lock,
      keywords: 'door lock unlock porta puerta security',
      state: door.locked ? 'Locked' : 'Unlocked',
      run: () => {
        const locked = !S().door.locked
        S().setDoorLocked(locked)
        S().setFocus('front-door')
        toast(`Front Door ${locked ? 'locked' : 'unlocked'}`, undefined, locked ? 'success' : 'warning')
      },
    })
    dev({
      id: 'eco',
      title: `Turn ${eco.active ? 'off' : 'on'} ECO Mode`,
      hint: eco.active ? `${eco.savings}% savings today` : 'Solar-first scheduling',
      icon: Leaf,
      keywords: 'eco energy saving green',
      state: eco.active ? 'Active' : 'Off',
      run: () => {
        const active = !S().eco.active
        S().setEco(active)
        toast(`ECO Mode ${active ? 'on' : 'off'}`, active ? '34% savings today' : undefined, active ? 'success' : 'default')
      },
    })
    dev({
      id: 'warmer',
      title: 'Warmer Main Hall',
      hint: `Set to ${Math.min(30, hall.target + 0.5).toFixed(1)}°C`,
      icon: Thermometer,
      keywords: 'temperature heat warm hotter calor',
      state: `${hall.target.toFixed(1)}°`,
      stay: true,
      run: () => {
        S().nudgeRoomTarget('main-hall', 0.5)
        S().setFocus('main-hall')
      },
    })
    dev({
      id: 'cooler',
      title: 'Cooler Main Hall',
      hint: `Set to ${Math.max(16, hall.target - 0.5).toFixed(1)}°C`,
      icon: ThermometerSnowflake,
      keywords: 'temperature cool cold colder frio',
      state: `${hall.target.toFixed(1)}°`,
      stay: true,
      run: () => {
        S().nudgeRoomTarget('main-hall', -0.5)
        S().setFocus('main-hall')
      },
    })

    for (const n of NAV_ITEMS) {
      items.push({
        id: `nav-${n.id}`,
        group: 'navigate',
        title: `Go to ${n.label}`,
        hint: n.hint,
        icon: n.icon,
        keywords: 'navigate open go',
        stay: n.id === 'scenes',
        run: () => (n.id === 'scenes' ? usePaletteScope.getState().setScope('scenes') : navigateTo(n.id)),
      })
    }
    return items
  }, [rooms, nodes, lamp, led, speaker, door, eco, selected])
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center gap-0.5 rounded-[6px] border border-white/15 bg-white/[0.07] px-1.5 font-sans text-[10.5px] text-white/60">
      {children}
    </kbd>
  )
}

export function CommandPalette() {
  const open = useDomus((s) => s.paletteOpen)
  const setOpen = useDomus((s) => s.setPaletteOpen)
  const { mode, scale } = useArtboard()
  const scope = usePaletteScope((s) => s.scope)
  const setScope = usePaletteScope((s) => s.setScope)
  const items = useItems()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  // Global shortcuts: ⌘K / Ctrl+K toggle, "/" opens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const s = useDomus.getState()
        if (!s.paletteOpen) usePaletteScope.getState().setScope('all')
        s.setPaletteOpen(!s.paletteOpen)
      } else if (e.key === '/' && !typing && !useDomus.getState().paletteOpen) {
        e.preventDefault()
        usePaletteScope.getState().setScope('all')
        useDomus.getState().setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null
      setQ('')
      setActive(0)
      // focus synchronously (the input is mounted in this commit) so no keystroke is lost
      inputRef.current?.focus({ preventScroll: true })
    } else {
      restoreFocus.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  const results = useMemo(() => {
    const pool = scope === 'all' ? items : items.filter((i) => i.group === scope)
    const scored = pool
      .map((it) => {
        if (!q.trim()) return { it, s: 1 }
        const st = fuzzy(q, it.title, true)
        const sh = st ? 0 : fuzzy(q, `${it.title} ${it.hint} ${it.keywords ?? ''} ${GROUP_LABEL[it.group]}`) * 0.6
        return { it, s: st * 2 + sh }
      })
      .filter((x) => x.s > 0)
    const groups: { group: Group; items: PItem[] }[] = []
    for (const g of GROUP_ORDER) {
      const list = scored
        .filter((x) => x.it.group === g)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.it)
      if (list.length) groups.push({ group: g, items: list })
    }
    // with a query, order groups by best match
    if (q.trim()) {
      const best = (g: Group) => Math.max(...scored.filter((x) => x.it.group === g).map((x) => x.s))
      groups.sort((a, b) => best(b.group) - best(a.group))
    }
    return groups
  }, [items, q, scope])

  const flat = useMemo(() => results.flatMap((g) => g.items), [results])

  useEffect(() => setActive(0), [q, scope])
  useEffect(() => {
    if (active >= flat.length) setActive(Math.max(0, flat.length - 1))
  }, [flat.length, active])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const run = (it: PItem | undefined) => {
    if (!it) return
    if (!it.stay) setOpen(false)
    it.run()
  }

  const cycleScope = (d: number) => {
    const i = PALETTE_SCOPES.findIndex((s) => s.id === scope)
    setScope(PALETTE_SCOPES[(i + d + PALETTE_SCOPES.length) % PALETTE_SCOPES.length].id)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(flat[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (q) setQ('')
      else setOpen(false)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      cycleScope(e.shiftKey ? -1 : 1)
    } else if (e.key === 'Backspace' && !q && scope !== 'all') {
      setScope('all')
    }
  }

  const s = mode === 'desktop' ? scale : 1
  const width = mode === 'desktop' ? 600 : Math.min(600, window.innerWidth - 24)
  const activeId = flat[active]?.id

  let idx = -1

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <div key="palette" className="fixed inset-0 z-[100]" role="presentation">
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgb(38 36 32 / 0.26)', backdropFilter: 'blur(8px) saturate(120%)', WebkitBackdropFilter: 'blur(8px) saturate(120%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              onPointerDown={() => setOpen(false)}
            />
            <div
              className="absolute left-1/2 top-0"
              style={{
                width,
                transform: `translateX(-50%) scale(${s})`,
                transformOrigin: 'top center',
                marginTop: mode === 'desktop' ? 112 * s : 56,
              }}
            >
              <motion.div
                initial={{ y: -14, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: -8, scale: 0.97, transition: { duration: 0.16 } }}
                transition={springs.snappy}
              >
                <Glass
                  variant="frost"
                  radius={28}
                  specular={0.6}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2 } }}
                  exit={{ opacity: 0, transition: { duration: 0.14 } }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Command palette"
                  className="overflow-hidden"
                  style={{
                    ['--g-fill-a' as string]: 'rgb(132 127 119 / 0.62)',
                    ['--g-fill-b' as string]: 'rgb(78 75 70 / 0.58)',
                    ['--g-blur' as string]: '40px',
                    ['--g-shadow' as string]: '0 40px 100px -30px rgb(10 8 6 / 0.65), 0 2px 10px rgb(0 0 0 / 0.2)',
                  }}
                >
                  <div className="relative z-[3]">
                    {/* input */}
                    <div className="flex items-center gap-3 px-5 pb-3 pt-4">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0 text-white/75">
                        <path d="M15.6 6.2A7 7 0 1 0 17 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        <circle cx="17" cy="10" r="1.3" fill="currentColor" />
                      </svg>
                      <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Search for a room, scene, or node..."
                        aria-label="Search"
                        aria-controls="palette-list"
                        aria-activedescendant={activeId ? `pi-${activeId}` : undefined}
                        role="combobox"
                        aria-expanded="true"
                        autoComplete="off"
                        spellCheck={false}
                        className="h-9 min-w-0 flex-1 bg-transparent text-[17px] font-light text-white placeholder:text-white/45"
                        style={{ outline: 'none' }}
                      />
                      <Kbd>esc</Kbd>
                    </div>

                    {/* scopes */}
                    <div className="flex gap-1 px-4 pb-3" role="tablist" aria-label="Filter">
                      {PALETTE_SCOPES.map((sc) => {
                        const on = sc.id === scope
                        return (
                          <button
                            key={sc.id}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            tabIndex={-1}
                            onClick={() => {
                              setScope(sc.id)
                              inputRef.current?.focus()
                            }}
                            className={cn(
                              'relative h-[28px] cursor-pointer rounded-full px-3 text-[12px] outline-none transition-colors duration-200',
                              on ? 'text-[#121210]' : 'text-white/65 hover:bg-white/10 hover:text-white',
                            )}
                          >
                            {on && <motion.span layoutId="palette-scope" className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgb(0_0_0/0.25)]" transition={springs.snappy} />}
                            <span className="relative">{sc.label}</span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="hairline" />

                    {/* results */}
                    <div ref={listRef} id="palette-list" role="listbox" className="scroll-thin max-h-[372px] overflow-y-auto px-2 py-2">
                      {flat.length === 0 && (
                        <div className="flex flex-col items-center px-6 py-10 text-center">
                          <span className="glass glass-well mb-3 grid h-11 w-11 place-items-center rounded-full text-white/60">
                            <SearchX size={18} strokeWidth={1.6} className="relative z-[3]" />
                          </span>
                          <div className="text-[14px] text-white/85">No results for “{q}”</div>
                          <div className="mt-1 text-[12px] text-white/50">Try “movie”, “lock”, “kitchen” or “eco”.</div>
                        </div>
                      )}
                      {results.map((g) => (
                        <div key={g.group} role="group" aria-label={GROUP_LABEL[g.group]} className="pb-1">
                          <div className="px-3 pb-1.5 pt-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/45">
                            {GROUP_LABEL[g.group]}
                          </div>
                          {g.items.map((it) => {
                            idx += 1
                            const i = idx
                            const on = i === active
                            const Icon = it.icon
                            return (
                              <div
                                key={it.id}
                                id={`pi-${it.id}`}
                                data-idx={i}
                                role="option"
                                aria-selected={on}
                                onPointerMove={() => active !== i && setActive(i)}
                                onClick={() => run(it)}
                                className="relative flex h-[50px] cursor-pointer items-center gap-3 rounded-[16px] px-2.5"
                              >
                                {on && (
                                  <motion.span
                                    layoutId="palette-active"
                                    className="absolute inset-0 rounded-[16px] bg-white/[0.13] shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]"
                                    transition={springs.snappy}
                                  />
                                )}
                                <span
                                  className={cn(
                                    'relative grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full transition-colors duration-200',
                                    on ? 'bg-white text-[#121210]' : 'bg-white/[0.08] text-white/80',
                                  )}
                                >
                                  <Icon size={15} strokeWidth={1.7} />
                                </span>
                                <span className="relative min-w-0 flex-1">
                                  <span className="block truncate text-[14px] leading-tight text-white">{it.title}</span>
                                  <span className="mt-[2px] block truncate text-[11.5px] leading-tight text-white/50">{it.hint}</span>
                                </span>
                                {it.state && (
                                  <span
                                    className={cn(
                                      'relative shrink-0 rounded-full px-2 py-[2px] text-[11px] tabular',
                                      /^(On|Active|Playing|Running|Locked|Viewing)$/.test(it.state)
                                        ? 'bg-[rgb(198_239_142/0.16)] text-lime-glow'
                                        : 'bg-white/[0.07] text-white/55',
                                    )}
                                  >
                                    {it.state}
                                  </span>
                                )}
                                <span className={cn('relative shrink-0 transition-opacity duration-150', on ? 'opacity-100' : 'opacity-0')}>
                                  <Kbd>
                                    <CornerDownLeft size={11} strokeWidth={2} />
                                  </Kbd>
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>

                    {/* footer */}
                    <div className="hairline" />
                    <div className="flex items-center gap-4 px-5 py-2.5 text-[11px] text-white/50">
                      {mode === 'desktop' && (
                      <>
                      <span className="flex items-center gap-1.5">
                        <Kbd>
                          <ArrowUpDown size={11} strokeWidth={2} />
                        </Kbd>
                        navigate
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Kbd>
                          <CornerDownLeft size={11} strokeWidth={2} />
                        </Kbd>
                        run
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Kbd>tab</Kbd>
                        filter
                      </span>
                      </>
                      )}
                      <span className="ml-auto tabular">
                        {flat.length} result{flat.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </Glass>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}
