import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { AnimatePresence, motion } from 'motion/react'
import { Lock, LockOpen, Sofa } from 'lucide-react'
import { useDomus } from '../store'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { ARRAY, DOOR, PAV } from './layout'

/** lucide has no solar-panel glyph — drawn to match the reference icon. */
function SolarGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 5h15l1.5 9h-18z" />
      <path d="M3.8 9.5h16.4M9.3 5l-.8 9M14.7 5l.8 9" />
      <path d="M12 14v4M8.5 20h7" />
    </svg>
  )
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation()

interface PillProps {
  icon: ReactNode
  title: ReactNode
  meta?: ReactNode
  detail: string
  stacked?: boolean
  active?: boolean
  onActivate: () => void
  label: string
}

/** Liquid-glass hotspot pill. Scales with the artboard (--s). */
function Pill({ icon, title, meta, detail, stacked, active, onActivate, label }: PillProps) {
  return (
    <div style={{ transform: 'scale(var(--s, 1))', transformOrigin: 'center' }}>
      <motion.button
        type="button"
        aria-label={label}
        onPointerDown={stop}
        onPointerUp={stop}
        onDoubleClick={stop}
        onWheel={stop}
        onClick={(e) => {
          e.stopPropagation()
          onActivate()
        }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 520, damping: 32 }}
        className="glass glass-pill group relative flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full py-[4px] pl-[4px] pr-[14px] text-left text-white outline-none"
        style={
          {
            '--g-fill-a': 'rgb(72 70 66 / 0.42)',
            '--g-fill-b': 'rgb(40 39 36 / 0.32)',
            '--g-edge-a': 'rgb(255 255 255 / 0.5)',
            boxShadow: active
              ? '0 0 0 1px rgb(198 239 142 / 0.85), 0 0 22px rgb(198 239 142 / 0.45), 0 10px 26px -12px rgb(0 0 0 / 0.5)'
              : undefined,
          } as React.CSSProperties
        }
      >
        <span
          className="relative z-[3] grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full text-white transition-[box-shadow,background-color] duration-300 group-hover:bg-white/25 group-hover:shadow-[0_0_0_1px_rgb(198_239_142/0.9),0_0_14px_rgb(198_239_142/0.55)]"
          style={{ background: 'rgb(255 255 255 / 0.14)', boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.55)' }}
        >
          {icon}
        </span>
        <span className={`relative z-[3] flex ${stacked ? 'flex-col leading-[1.15]' : 'items-baseline gap-1.5'}`}>
          <span className="text-[13px] font-medium tracking-[-0.01em]">{title}</span>
          {meta && <span className={`tabular text-white/70 ${stacked ? 'text-[10.5px]' : 'text-[11px]'}`}>{meta}</span>}
        </span>
        {/* hover detail reveal */}
        <span className="relative z-[3] grid grid-cols-[0fr] opacity-0 transition-all duration-500 ease-[var(--ease-glass)] group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100">
          <span className="overflow-hidden">
            <span className="block pl-1 text-[10.5px] text-[#c6ef8e]">{detail}</span>
          </span>
        </span>
      </motion.button>
    </div>
  )
}

function SolarPill() {
  const kw = useDomus((s) => s.solar.kw)
  const peak = useDomus((s) => s.solar.peak)
  const eco = useDomus((s) => s.eco.active)
  const focus = useDomus((s) => s.focus)
  return (
    <Pill
      label={`Solar array, producing ${kw} kilowatts`}
      icon={<SolarGlyph />}
      title="Solar"
      meta={
        <>
          • <AnimatedNumber value={kw} decimals={1} />
          kW
        </>
      }
      detail={`${Math.round((kw / peak) * 100)}% of peak${eco ? ' · Eco' : ''}`}
      active={focus === 'solar'}
      onActivate={() => {
        const s = useDomus.getState()
        s.setFocus(s.focus === 'solar' ? 'overview' : 'solar')
        s.toast({ title: 'Solar array', detail: `Producing ${s.solar.kw.toFixed(1)} kW · 32 panels online`, tone: 'success' })
      }}
    />
  )
}

function HallPill() {
  const room = useDomus((s) => s.rooms['main-hall'])
  const focus = useDomus((s) => s.focus)
  return (
    <Pill
      stacked
      label={`Main Hall, ${room.temperature} degrees, ${room.devices} devices`}
      icon={<Sofa size={14} strokeWidth={1.6} />}
      title="Main Hall"
      meta={
        <>
          <AnimatedNumber value={room.temperature} decimals={1} />
          °C . {room.devices} devices
        </>
      }
      detail={focus === 'main-hall' ? 'Viewing' : 'Explore'}
      active={focus === 'main-hall'}
      onActivate={() => {
        const s = useDomus.getState()
        s.selectRoom('main-hall')
        s.setFocus(s.focus === 'main-hall' ? 'overview' : 'main-hall')
      }}
    />
  )
}

function DoorPill() {
  const locked = useDomus((s) => s.door.locked)
  const focus = useDomus((s) => s.focus)
  return (
    <Pill
      label={`Front door, ${locked ? 'locked' : 'unlocked'}. Toggle lock`}
      icon={
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={locked ? 'l' : 'u'}
            initial={{ scale: 0.4, rotate: locked ? -40 : 40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 24 }}
            className="grid place-items-center"
          >
            {locked ? <Lock size={13} strokeWidth={1.7} /> : <LockOpen size={13} strokeWidth={1.7} className="text-[#c6ef8e]" />}
          </motion.span>
        </AnimatePresence>
      }
      title="Front Door"
      meta={<>• {locked ? 'Locked' : 'Unlocked'}</>}
      detail={locked ? 'Tap to unlock' : 'Tap to lock'}
      active={focus === 'front-door' || !locked}
      onActivate={() => {
        const s = useDomus.getState()
        const next = !s.door.locked
        s.setDoorLocked(next)
        s.toast({
          title: next ? 'Front door locked' : 'Front door unlocked',
          detail: next ? 'Main entrance secured' : 'Auto-lock in 5 min',
          tone: next ? 'success' : 'warning',
        })
      }}
    />
  )
}

const common = { center: true, zIndexRange: [6, 0] as number[], pointerEvents: 'auto' as const }

export function Hotspots() {
  return (
    <group>
      <Html position={[-3.6, ARRAY.y + 2.9, ARRAY.z0 + 1.0]} {...common}>
        <SolarPill />
      </Html>
      <Html position={[PAV.x0 + 1.9, PAV.y0 + 2.5, PAV.z1 + 0.55]} {...common}>
        <HallPill />
      </Html>
      <Html position={[DOOR.x1 + 3.4, PAV.y0 + 1.7, PAV.z1 + 0.45]} {...common}>
        <DoorPill />
      </Html>
    </group>
  )
}
