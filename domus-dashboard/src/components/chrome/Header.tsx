import { useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Bot,
  Building2,
  ChevronDown,
  Cpu,
  Lamp,
  Leaf,
  Lock,
  LockOpen,
  LogOut,
  MapPin,
  Radio,
  Repeat,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Speaker,
  Sun,
  Tv,
  User,
  Zap,
} from 'lucide-react'
import { useDomus } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { Glass } from '../../ui/Glass'
import { IconButton } from '../../ui/IconButton'
import { Toggle } from '../../ui/Toggle'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { cn, springs } from '../../lib/utils'
import { MenuRow, Popover, PopoverHeading, useDismiss } from './Popover'
import { openPalette } from './paletteScope'

/* ─────────────────────────── Logo ─────────────────────────── */

export function DomusMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="domus-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcf8b4" />
          <stop offset="1" stopColor="#b2e173" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        fill="url(#domus-mark)"
        d="M14.1 3.9a3 3 0 0 1 3.8 0l9.8 8.2A3.5 3.5 0 0 1 29 14.8V26a3 3 0 0 1-3 3h-6.2v-7.4a3.8 3.8 0 0 0-7.6 0V29H6a3 3 0 0 1-3-3V14.8a3.5 3.5 0 0 1 1.3-2.7z"
      />
    </svg>
  )
}

function Logo() {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        useDomus.getState().setNav('home')
        useDomus.getState().setFocus('overview')
      }}
      className="group flex h-full shrink-0 items-center gap-2.5 rounded-full pr-2 outline-none"
      aria-label="Domus — home overview"
    >
      <motion.span
        className="grid place-items-center drop-shadow-[0_4px_14px_rgb(198_239_142/0.35)]"
        whileHover={{ rotate: -6, scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.bouncy}
      >
        <DomusMark />
      </motion.span>
      <span className="text-[22px] font-semibold tracking-[-0.01em] text-white">Domus</span>
    </a>
  )
}

/* ─────────────────────────── Search ─────────────────────────── */

function SearchGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden className="relative z-[3]">
      <path
        d="M15.6 6.2A7 7 0 1 0 17 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="17" cy="10" r="1.3" fill="currentColor" />
    </svg>
  )
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

function SearchPill() {
  return (
    <Glass
      variant="pill"
      radius={999}
      specular={0.7}
      className="h-full w-[370px] shrink-0"
      whileHover={{ scale: 1.01 }}
      transition={springs.soft}
    >
      <button
        type="button"
        onClick={() => openPalette('all')}
        aria-label="Search for a room, scene, or node"
        aria-keyshortcuts="Meta+K Control+K /"
        className="relative z-[3] flex h-full w-full cursor-text items-center gap-3 rounded-full pl-3 pr-3 text-left outline-none"
      >
        <span className="glass glass-well grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-white/80">
          <SearchGlyph />
        </span>
        <span className="flex-1 truncate text-[13.5px] text-white/55">Search for a room, scene, or node...</span>
        <kbd className="flex h-[22px] items-center gap-0.5 rounded-md border border-white/15 bg-white/[0.07] px-1.5 font-sans text-[11px] text-white/50">
          {isMac ? '⌘' : 'Ctrl'}
          <span>K</span>
        </kbd>
      </button>
    </Glass>
  )
}

/* ─────────────────────────── ECO ─────────────────────────── */

function EcoPill({ compact }: { compact?: boolean }) {
  const eco = useDomus((s) => s.eco)
  const setEco = useDomus((s) => s.setEco)
  const toast = useDomus((s) => s.toast)

  const flip = () => {
    const next = !eco.active
    setEco(next)
    toast(
      next
        ? { title: 'ECO Mode on', detail: 'Solar-first scheduling · 34% savings today', tone: 'success' }
        : { title: 'ECO Mode off', detail: 'Comfort priority restored' },
    )
  }

  return (
    <Glass
      variant="pill"
      radius={999}
      specular={0.7}
      className={cn('h-full shrink-0', compact ? 'w-full' : 'w-[338px]')}
      animate={{
        ['--g-edge-a' as string]: eco.active ? 'rgb(225 250 190 / 0.75)' : 'rgb(255 255 255 / 0.5)',
      }}
      whileHover={{ scale: 1.012 }}
      transition={springs.soft}
    >
      <button
        type="button"
        role="switch"
        aria-checked={eco.active}
        aria-label="ECO mode"
        onClick={flip}
        className="relative z-[3] flex h-full w-full cursor-pointer items-center gap-3 rounded-full pl-2 pr-4 text-left outline-none"
      >
        <motion.span
          className="glass glass-pill grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full"
          animate={{
            backgroundColor: eco.active ? 'rgba(198,239,142,0.18)' : 'rgba(255,255,255,0.04)',
            boxShadow: eco.active
              ? '0 0 18px rgba(198,239,142,0.45), inset 0 1px 0 rgba(255,255,255,0.3)'
              : '0 0 0 rgba(198,239,142,0), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          whileTap={{ scale: 0.88 }}
          transition={{ duration: 0.45 }}
        >
          <motion.span
            className="relative z-[3] grid place-items-center"
            animate={{ color: eco.active ? '#d4f5a4' : 'rgba(255,255,255,0.6)', rotate: eco.active ? 0 : -24 }}
            transition={springs.bouncy}
          >
            <Leaf size={15} strokeWidth={1.7} />
          </motion.span>
        </motion.span>
        <span className="relative h-[20px] flex-1 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={eco.active ? 'on' : 'off'}
              className="absolute inset-0 flex items-center whitespace-nowrap text-[13.5px]"
              initial={{ y: 14, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -14, opacity: 0, filter: 'blur(4px)' }}
              transition={springs.soft}
            >
              {eco.active ? (
                <>
                  <span className="text-white/90">ECO Mode Active</span>
                  <span className="mx-1.5 text-white/40">•</span>
                  <span className="text-white/60">
                    <AnimatedNumber value={eco.savings} />% savings today
                  </span>
                </>
              ) : (
                <>
                  <span className="text-white/75">ECO Mode Off</span>
                  <span className="mx-1.5 text-white/35">•</span>
                  <span className="text-white/50">Tap to save energy</span>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </Glass>
  )
}

/* ─────────────────────── Header popovers ─────────────────────── */

type PopId = 'residence' | 'security' | 'network' | 'user' | null

function ResidencePanel() {
  const solar = useDomus((s) => s.solar)
  const eco = useDomus((s) => s.eco)
  const rooms = useDomus((s) => s.rooms)
  const energy = useDomus((s) => s.energy)
  const totalArea = Object.values(rooms).reduce((a, r) => a + r.area, 0)
  const devices = Object.values(rooms).reduce((a, r) => a + r.devices, 0)
  return (
    <>
      <div className="flex items-center gap-3 px-2.5 pb-2 pt-2">
        <span className="glass glass-solid grid h-10 w-10 place-items-center rounded-[14px]">
          <Building2 size={18} strokeWidth={1.6} className="relative z-[3]" />
        </span>
        <div>
          <div className="text-[15px] font-medium leading-tight">Nort Residence</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-white/50">
            <MapPin size={11} strokeWidth={1.8} /> Calle Nort 14 · Valencia
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-1.5 pb-1.5">
        {[
          { k: 'Rooms', v: Object.keys(rooms).length.toString() },
          { k: 'Area', v: `${totalArea} m²` },
          { k: 'Devices', v: devices.toString() },
        ].map((x) => (
          <div key={x.k} className="glass glass-inset rounded-[14px] px-2.5 py-2">
            <div className="relative z-[3] text-[10.5px] uppercase tracking-[0.12em] text-white/45">{x.k}</div>
            <div className="relative z-[3] mt-0.5 text-[15px] tabular">{x.v}</div>
          </div>
        ))}
      </div>
      <div className="hairline mx-2 my-1" />
      <MenuRow
        icon={<Sun size={14} strokeWidth={1.7} className="text-lime-glow" />}
        title="Solar production"
        detail={`Peak ${solar.peak} kW today`}
        trailing={
          <span className="text-[13px] tabular text-white/85">
            <AnimatedNumber value={solar.kw} decimals={1} /> kW
          </span>
        }
      />
      <MenuRow
        icon={<Zap size={14} strokeWidth={1.7} />}
        title="Consumption today"
        detail={eco.active ? `ECO saving ${eco.savings}%` : 'ECO mode off'}
        trailing={
          <span className="text-[13px] tabular text-white/85">
            <AnimatedNumber value={energy.today} decimals={1} /> kWh
          </span>
        }
      />
    </>
  )
}

function SecurityPanel() {
  const locked = useDomus((s) => s.door.locked)
  const setDoorLocked = useDomus((s) => s.setDoorLocked)
  const setFocus = useDomus((s) => s.setFocus)
  const toast = useDomus((s) => s.toast)
  return (
    <>
      <PopoverHeading
        aside={
          <span className={cn('flex items-center gap-1 text-[11px]', locked ? 'text-lime-glow' : 'text-[#f2b36b]')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', locked ? 'bg-lime-glow' : 'bg-[#f2b36b]')} />
            {locked ? 'Secured' : 'Attention'}
          </span>
        }
      >
        Security
      </PopoverHeading>
      <MenuRow
        icon={
          <motion.span key={String(locked)} initial={{ scale: 0.6, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={springs.bouncy}>
            {locked ? <Lock size={14} strokeWidth={1.7} /> : <LockOpen size={14} strokeWidth={1.7} className="text-[#f2b36b]" />}
          </motion.span>
        }
        title="Front Door"
        detail={locked ? 'Locked · auto-lock 30s' : 'Unlocked'}
        trailing={
          <Toggle
            size="sm"
            label="Front door lock"
            checked={locked}
            onChange={(v) => {
              setDoorLocked(v)
              setFocus('front-door')
              toast(v ? { title: 'Front Door locked', tone: 'success' } : { title: 'Front Door unlocked', tone: 'warning' })
            }}
          />
        }
      />
      <MenuRow icon={<ShieldCheck size={14} strokeWidth={1.7} />} title="Perimeter" detail="4 cameras · 6 sensors online" />
      <MenuRow icon={<Shield size={14} strokeWidth={1.7} />} title="Last event" detail="Motion · Garden · 14 min ago" />
    </>
  )
}

function NetworkPanel() {
  const nodes = useDomus((s) => s.nodes)
  const lamp = useDomus((s) => s.lamp)
  const led = useDomus((s) => s.led)
  const speaker = useDomus((s) => s.speaker)
  const list = [
    { icon: Tv, name: `${nodes.tv.name} ${nodes.tv.model}`, on: nodes.tv.on, sig: 4 },
    { icon: Speaker, name: `${nodes.sonos.name} ${nodes.sonos.model}`, on: nodes.sonos.on, sig: 4 },
    { icon: Bot, name: `${nodes.cleanbot.name} ${nodes.cleanbot.model}`, on: nodes.cleanbot.on, sig: 3 },
    { icon: Lamp, name: 'Hue Master Lamp', on: lamp.on, sig: 4 },
    { icon: Cpu, name: 'LED Strip Frame', on: led.on, sig: 3 },
    { icon: Speaker, name: 'Pro Max Studio Speaker', on: speaker.on, sig: 2 },
  ]
  return (
    <>
      <PopoverHeading aside={<span className="text-[11px] tabular text-white/50">Mesh · 2.4 ms</span>}>
        Nodes online · {list.length}
      </PopoverHeading>
      <div className="max-h-[300px] overflow-auto scroll-thin">
        {list.map((n) => (
          <MenuRow
            key={n.name}
            icon={<n.icon size={14} strokeWidth={1.7} />}
            title={n.name}
            detail={n.on ? 'Active' : 'Standby'}
            trailing={
              <span className="flex items-end gap-[2px]" aria-label={`Signal ${n.sig} of 4`}>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn('w-[3px] rounded-full', i < n.sig ? (n.on ? 'bg-lime-glow' : 'bg-white/60') : 'bg-white/15')}
                    style={{ height: 4 + i * 3 }}
                  />
                ))}
              </span>
            }
          />
        ))}
      </div>
    </>
  )
}

/* ─────────────────────────── User ─────────────────────────── */

export function Avatar({ size = 34 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background:
          'radial-gradient(120% 120% at 30% 20%, #ffe2c6 0%, #f0a98b 42%, #b9706a 78%, #7f4c52 100%)',
        boxShadow: '0 0 0 1.5px rgb(255 255 255 / 0.65), 0 4px 12px -4px rgb(0 0 0 / 0.4)',
      }}
      aria-hidden
    >
      <span
        className="absolute inset-0"
        style={{ background: 'radial-gradient(60% 45% at 35% 18%, rgb(255 255 255 / 0.55), transparent 70%)' }}
      />
      <span className="relative text-[12px] font-semibold tracking-[0.02em] text-white" style={{ fontSize: size * 0.36 }}>
        AM
      </span>
    </span>
  )
}

function UserMenu({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <Glass
      variant="pill"
      radius={999}
      specular={0.7}
      className="h-full w-[210px] shrink-0"
      whileHover={{ scale: 1.012 }}
      transition={springs.soft}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className="relative z-[3] flex h-full w-full cursor-pointer items-center gap-2.5 rounded-full pl-1.5 pr-3.5 text-left outline-none"
      >
        <Avatar />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] leading-tight text-white">Alejandra Magno</span>
          <span className="block truncate text-[11px] leading-tight text-white/50">Nort Residence</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={springs.snappy} className="text-white/70">
          <ChevronDown size={16} strokeWidth={1.8} />
        </motion.span>
      </button>
    </Glass>
  )
}

function UserPanel({ close }: { close: () => void }) {
  const toast = useDomus((s) => s.toast)
  const act = (title: string, detail?: string) => () => {
    close()
    toast({ title, detail })
  }
  return (
    <div role="menu">
      <div className="flex items-center gap-3 px-2.5 pb-2 pt-2">
        <Avatar size={40} />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-medium leading-tight">Alejandra Magno</div>
          <div className="truncate text-[11.5px] text-white/50">alejandra@nort.residence</div>
        </div>
      </div>
      <div className="hairline mx-2 my-1" />
      <MenuRow icon={<User size={14} strokeWidth={1.7} />} title="Profile" onClick={act('Profile', 'Opening your account')} />
      <MenuRow
        icon={<Repeat size={14} strokeWidth={1.7} />}
        title="Switch residence"
        detail="Nort Residence · 2 more"
        onClick={act('Switch residence', 'Costa Loft and Atelier 7 available')}
      />
      <MenuRow icon={<Settings size={14} strokeWidth={1.7} />} title="Preferences" onClick={act('Preferences')} />
      <div className="hairline mx-2 my-1" />
      <MenuRow icon={<LogOut size={14} strokeWidth={1.7} />} title="Sign out" danger onClick={act('Signed out', 'Demo session — nothing changed')} />
    </div>
  )
}

/* ─────────────────────────── Header ─────────────────────────── */

function PopTrigger({
  id,
  open,
  setOpen,
  children,
  trigger,
  width,
  label,
}: {
  id: Exclude<PopId, null>
  open: PopId
  setOpen: (p: PopId) => void
  children: React.ReactNode
  trigger: React.ReactNode
  width?: number
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isOpen = open === id
  useDismiss(ref, isOpen, () => setOpen(null))
  return (
    <div ref={ref} className="relative h-full">
      {trigger}
      <Popover open={isOpen} width={width} label={label}>
        {children}
      </Popover>
    </div>
  )
}

export function Header() {
  const { mode } = useArtboard()
  const [open, setOpen] = useState<PopId>(null)
  const locked = useDomus((s) => s.door.locked)
  const toggle = (id: Exclude<PopId, null>) => setOpen((o) => (o === id ? null : id))

  if (mode === 'compact') {
    return (
      <MotionConfig reducedMotion="user">
        <div className="flex h-[46px] w-full items-center gap-2">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <IconButton icon={Search} label="Search" onClick={() => openPalette('all')} />
            <PopTrigger
              id="user"
              open={open}
              setOpen={setOpen}
              width={260}
              label="Account"
              trigger={
                <button
                  type="button"
                  aria-label="Account"
                  aria-expanded={open === 'user'}
                  onClick={() => toggle('user')}
                  className="grid h-[46px] w-[46px] cursor-pointer place-items-center rounded-full outline-none"
                >
                  <Avatar size={40} />
                </button>
              }
            >
              <UserPanel close={() => setOpen(null)} />
            </PopTrigger>
          </div>
        </div>
      </MotionConfig>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <header className="flex h-full w-full items-center">
        <div className="flex h-full w-[226px] shrink-0 items-center">
          <Logo />
        </div>
        <SearchPill />
        <div className="w-5 shrink-0" />
        <EcoPill />

        <div className="ml-auto flex h-full items-center gap-2.5">
          <PopTrigger
            id="residence"
            open={open}
            setOpen={setOpen}
            width={316}
            label="Residence"
            trigger={<IconButton icon={Building2} label="Residence" active={open === 'residence'} onClick={() => toggle('residence')} />}
          >
            <ResidencePanel />
          </PopTrigger>
          <PopTrigger
            id="security"
            open={open}
            setOpen={setOpen}
            width={316}
            label="Security"
            trigger={
              <IconButton
                icon={Shield}
                label="Security status"
                badge={!locked}
                active={open === 'security'}
                onClick={() => toggle('security')}
              />
            }
          >
            <SecurityPanel />
          </PopTrigger>
          <PopTrigger
            id="network"
            open={open}
            setOpen={setOpen}
            width={316}
            label="Network"
            trigger={<IconButton icon={Radio} label="Network & nodes" active={open === 'network'} onClick={() => toggle('network')} />}
          >
            <NetworkPanel />
          </PopTrigger>
          <div className="w-0.5" />
          <PopTrigger
            id="user"
            open={open}
            setOpen={setOpen}
            width={260}
            label="Account"
            trigger={<UserMenu open={open === 'user'} onToggle={() => toggle('user')} />}
          >
            <UserPanel close={() => setOpen(null)} />
          </PopTrigger>
        </div>
      </header>
    </MotionConfig>
  )
}

export { EcoPill }
