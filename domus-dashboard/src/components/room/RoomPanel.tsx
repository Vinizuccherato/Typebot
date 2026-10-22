import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BedDouble, ChevronDown, CookingPot, Droplets, Hash, Laptop, Sofa, Thermometer, Trees, Users, type LucideIcon } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { Chip } from '../../ui/Chip'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { cn, springs } from '../../lib/utils'
import { useDomus, useSelectedRoom, type RoomId } from '../../store'
import { ZonalClimate } from './ZonalClimate'
import { NodesGrid } from './NodesGrid'

export const ROOM_ICON: Record<RoomId, LucideIcon> = {
  'main-hall': Sofa,
  kitchen: CookingPot,
  'master-suite': BedDouble,
  studio: Laptop,
  terrace: Trees,
}

const ORDER: RoomId[] = ['main-hall', 'kitchen', 'master-suite', 'studio', 'terrace']

const swap = {
  initial: { opacity: 0, y: 6, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(6px)' },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
}

function RoomSwitcher({ onClose }: { onClose: () => void }) {
  const rooms = useDomus((s) => s.rooms)
  const selected = useDomus((s) => s.selectedRoom)
  const selectRoom = useDomus((s) => s.selectRoom)
  const setFocus = useDomus((s) => s.setFocus)
  const list = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
  }, [])

  const pick = (id: RoomId) => {
    selectRoom(id)
    setFocus(id === 'main-hall' ? 'main-hall' : 'overview')
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
    }
  }

  return (
    <Glass
      variant="smoke"
      radius={22}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      style={{ background: 'linear-gradient(150deg, rgb(52 50 46 / 0.9), rgb(28 27 25 / 0.88))' }}
      transition={springs.snappy}
      className="absolute left-0 top-[52px] z-40 w-[272px] origin-top-left p-1.5"
    >
      <div ref={list} role="listbox" aria-label="Rooms" onKeyDown={onKeyDown} className="relative z-[3] flex flex-col gap-0.5">
        {ORDER.map((id) => {
          const r = rooms[id]
          const Icon = ROOM_ICON[id]
          const active = id === selected
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => pick(id)}
              className={cn(
                'group flex cursor-pointer items-center gap-3 rounded-[16px] px-2.5 py-2 text-left outline-none transition-colors',
                active ? 'bg-white/14' : 'hover:bg-white/8 focus-visible:bg-white/8',
              )}
            >
              <span className={cn('grid h-8 w-8 place-items-center rounded-full', active ? 'bg-white text-ink' : 'bg-white/8 text-white/75')}>
                <Icon size={15} strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-white">{r.name}</span>
                <span className="block text-[11px] text-white/45">
                  {r.code} · {r.area} m²
                </span>
              </span>
              <span className="text-right">
                <span className="tabular block text-[13px] text-white/90">{r.temperature.toFixed(1)}°</span>
                <span className="flex items-center justify-end gap-1 text-[10.5px] text-white/45">
                  <span className={cn('h-1.5 w-1.5 rounded-full', r.occupants ? 'bg-lime-glow shadow-[0_0_6px_var(--accent)]' : 'bg-white/25')} />
                  {r.occupants ? `${r.occupants} in` : 'Empty'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Glass>
  )
}

function RoomHeader() {
  const room = useSelectedRoom()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement | null>(null)
  const Icon = ROOM_ICON[room.id]

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative z-40 flex h-[44px] items-center justify-between gap-2 pl-1.5 pr-0.5">
      <div ref={wrap} className="relative min-w-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="group flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 outline-none transition-colors hover:bg-white/8"
        >
          <span className="glass glass-pill grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/85">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={room.id} {...swap} className="relative z-[3]">
                <Icon size={15} strokeWidth={1.7} />
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={room.id} {...swap} className="block whitespace-nowrap text-[18px] font-normal leading-none tracking-[-0.01em] text-white">
                {room.name}
              </motion.span>
            </AnimatePresence>
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={springs.snappy}
            className={cn(
              'text-white/70 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100',
              open ? 'opacity-100' : 'opacity-0',
            )}
          >
            <ChevronDown size={15} strokeWidth={1.8} />
          </motion.span>
        </button>
        <AnimatePresence>{open && <RoomSwitcher onClose={() => setOpen(false)} />}</AnimatePresence>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Chip icon={Hash} size="sm" variant="inset">
          {room.code}
        </Chip>
        <Chip size="sm" variant="inset">
          {room.area} m²
        </Chip>
      </div>
    </div>
  )
}

function RoomStats() {
  const room = useSelectedRoom()
  const people = `${room.occupants} ${room.occupants === 1 ? 'person' : 'people'}`
  return (
    <div className="@container">
      <div className="flex h-8 items-center gap-1.5 px-0.5">
        <Chip icon={Thermometer} variant="well">
          <AnimatedNumber value={room.temperature} decimals={1} />
          °C
        </Chip>
        <Chip icon={Users} variant="well">
          {room.occupants ? (
            <>
              <span className="hidden @min-[350px]:inline">Taken ({people})</span>
              <span className="@min-[350px]:hidden">{people}</span>
            </>
          ) : (
            'Vacant'
          )}
        </Chip>
        <Chip icon={Droplets} variant="well">
          <AnimatedNumber value={room.humidity} />% Humidity
        </Chip>
      </div>
    </div>
  )
}

export function RoomPanel() {
  return (
    <Glass
      variant="frost"
      radius={30}
      specular={0.5}
      className="flex h-full w-full flex-col p-3"
    >
      <div className="relative z-[4] mt-2">
        <RoomHeader />
      </div>
      <div className="relative z-[3] mt-3.5">
        <RoomStats />
      </div>
      <div className="relative z-[3] mt-3 min-h-[208px] flex-1">
        <ZonalClimate />
      </div>
      <div className="relative z-[2] mt-2 h-[236px] max-h-[236px] shrink-0">
        <NodesGrid />
      </div>
    </Glass>
  )
}
