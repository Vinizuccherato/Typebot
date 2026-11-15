import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Bell, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { TABS, useSoma } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { cn, springs } from '../../lib/utils'
import { IconButton } from '../../ui/IconButton'
import { Toggle } from '../../ui/Toggle'
import { Popover, PopRow } from './Popover'

/* ── helpers ─────────────────────────────────────────────────── */

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const dayLabel = (s: string) => {
  const d = fromIso(s)
  const today = new Date()
  const y = new Date(today)
  y.setDate(today.getDate() - 1)
  const short = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (iso(d) === iso(today)) return `Today, ${short}`
  if (iso(d) === iso(y)) return `Yesterday, ${short}`
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

/* ── logo ────────────────────────────────────────────────────── */

function Logo() {
  return (
    <div className="flex items-center gap-2.5" aria-label="Soma">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[var(--ink)] shadow-[0_6px_14px_-6px_rgb(0_0_0/0.5)]">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <circle cx="9" cy="9" r="6.2" fill="none" stroke="#ecebe8" strokeWidth="2.2" />
          <circle cx="9" cy="9" r="2.2" fill="var(--volt)" />
        </svg>
      </span>
      <span className="text-[13px] font-semibold tracking-[0.14em]">SOMA</span>
    </div>
  )
}

/* ── tabs ────────────────────────────────────────────────────── */

function Tabs() {
  const tab = useSoma((s) => s.tab)
  const setTab = useSoma((s) => s.setTab)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <div role="tablist" aria-label="Dashboard view" className="flex items-center gap-1">
      {TABS.map((t, i) => {
        const on = t.id === tab
        return (
          <button
            key={t.id}
            ref={(el) => void (refs.current[i] = el)}
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              const n = (i + d + TABS.length) % TABS.length
              setTab(TABS[n].id)
              refs.current[n]?.focus()
            }}
            className={cn(
              'group relative h-[34px] cursor-pointer whitespace-nowrap rounded-full px-[15px] text-[12.5px] outline-none transition-colors duration-200',
              on ? 'text-white' : 'text-[var(--ink-2)] hover:text-[var(--ink)]',
            )}
          >
            {on && (
              <motion.span
                layoutId="tab-ink"
                className="absolute inset-0 rounded-full bg-[var(--ink)] shadow-[0_8px_18px_-8px_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.14)]"
                transition={springs.snappy}
              />
            )}
            {!on && (
              <span className="absolute inset-0 rounded-full border border-[rgb(18_18_18/0.14)] bg-white/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            )}
            <span className="relative">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── date picker ─────────────────────────────────────────────── */

function DatePicker() {
  const date = useSoma((s) => s.date)
  const setDate = useSoma((s) => s.setDate)
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const [month, setMonth] = useState(() => {
    const d = fromIso(date)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const today = new Date()
  const earliest = new Date(today)
  earliest.setDate(today.getDate() - 29)

  const cells = useMemo(() => {
    const first = (month.getDay() + 6) % 7 // Monday-first
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  }, [month])

  const canPrev = new Date(month.getFullYear(), month.getMonth(), 0) >= new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate())
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= today

  return (
    <>
      <motion.button
        ref={anchor}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        transition={springs.snappy}
        className="glass glass-pill flex h-[38px] cursor-pointer items-center gap-2 rounded-full pl-3 pr-3.5 text-[12.5px] outline-none"
      >
        <CalendarDays size={15} strokeWidth={1.6} className="relative z-[3]" />
        <span className="relative z-[3] tabular">{dayLabel(date)}</span>
        <ChevronDown size={14} strokeWidth={1.6} className={cn('relative z-[3] text-[var(--ink-3)] transition-transform', open && 'rotate-180')} />
      </motion.button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={288} label="Choose a day">
        <div className="flex items-center justify-between px-2 pb-2 pt-1">
          <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full outline-none hover:bg-black/5 disabled:cursor-default disabled:opacity-25">
            <ChevronLeft size={16} strokeWidth={1.6} />
          </button>
          <span className="text-[13px] font-medium">{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
          <button type="button" aria-label="Next month" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full outline-none hover:bg-black/5 disabled:cursor-default disabled:opacity-25">
            <ChevronRight size={16} strokeWidth={1.6} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-y-1 px-1 pb-1 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="pb-1 text-[10.5px] font-medium text-[var(--ink-3)]">
              {d}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />
            const id = iso(d)
            const disabled = d > today || d < new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate())
            const on = id === date
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                aria-label={d.toDateString()}
                onClick={() => {
                  setDate(id)
                  setOpen(false)
                }}
                className={cn(
                  'relative mx-auto grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full text-[12.5px] tabular outline-none transition-colors',
                  on ? 'bg-[var(--ink)] text-white' : 'hover:bg-black/[0.06]',
                  disabled && 'cursor-default text-[var(--ink-4)] hover:bg-transparent',
                )}
              >
                {d.getDate()}
                {!disabled && !on && <span className="absolute bottom-[5px] h-[3px] w-[3px] rounded-full bg-[var(--volt-deep,#b9cc2c)]" />}
              </button>
            )
          })}
        </div>
      </Popover>
    </>
  )
}

/* ── notifications ───────────────────────────────────────────── */

interface Alert {
  id: number
  title: string
  detail: string
  when: string
  tone: 'default' | 'warning' | 'success'
}

const SEED: Alert[] = [
  { id: -1, title: 'Post-lunch spike resolved', detail: 'Back in range after 92 min', when: '13:48', tone: 'success' },
  { id: -2, title: 'Sensor expires in 11 days', detail: 'Order a replacement sensor', when: '09:02', tone: 'default' },
  { id: -3, title: 'Weekly report ready', detail: 'Time in range up 6% vs last week', when: 'Mon', tone: 'default' },
]

function Notifications() {
  const toasts = useSoma((s) => s.toasts)
  const [log, setLog] = useState<Alert[]>(SEED)
  const [unread, setUnread] = useState(1)
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)

  // every warning toast becomes a persistent notification
  useEffect(() => {
    const fresh = toasts.filter((t) => t.tone === 'warning' && !log.some((a) => a.id === t.id))
    if (!fresh.length) return
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setLog((l) => [...fresh.map((t) => ({ id: t.id, title: t.title, detail: t.detail ?? '', when: now, tone: 'warning' as const })), ...l].slice(0, 8))
    setUnread((u) => u + fresh.length)
  }, [toasts, log])

  return (
    <>
      <IconButton
        ref={anchor}
        icon={Bell}
        label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        badge={unread > 0}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          setUnread(0)
        }}
        size={38}
        variant="ink"
      />
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={300} label="Notifications">
        <p className="label px-3 pb-1.5 pt-2 text-[var(--ink-3)]">Notifications</p>
        <ul className="flex flex-col">
          {log.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-[14px] px-3 py-2.5 hover:bg-black/[0.04]">
              <span className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: a.tone === 'warning' ? '#f0a13a' : a.tone === 'success' ? 'var(--volt)' : 'var(--ink-3)' }} />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-snug">{a.title}</span>
                <span className="block text-[11.5px] text-[var(--ink-2)]">{a.detail}</span>
              </span>
              <span className="tabular text-[11px] text-[var(--ink-3)]">{a.when}</span>
            </li>
          ))}
        </ul>
      </Popover>
    </>
  )
}

/* ── settings ────────────────────────────────────────────────── */

function Row({ label, hint, on, set }: { label: string; hint: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block text-[11.5px] text-[var(--ink-2)]">{hint}</span>
      </span>
      <Toggle checked={on} onChange={set} label={label} size="sm" />
    </div>
  )
}

function Settings() {
  const signal = useSoma((s) => s.sensor.signal)
  const setSignal = useSoma((s) => s.setSignal)
  const toast = useSoma((s) => s.toast)
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(true)
  const [haptics, setHaptics] = useState(true)
  const anchor = useRef<HTMLButtonElement>(null)

  return (
    <>
      <IconButton ref={anchor} icon={Settings2} label="Settings" variant="ink" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} size={38} />
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={290} label="Settings">
        <p className="label px-3 pb-1 pt-2 text-[var(--ink-3)]">Settings</p>
        <Row
          label="Live sync"
          hint={signal === 'connected' ? 'Sensor streaming every 5 min' : 'Paused — readings held'}
          on={signal === 'connected'}
          set={(v) => {
            setSignal(v ? 'connected' : 'off')
            toast({ title: v ? 'Live sync resumed' : 'Live sync paused', tone: v ? 'success' : 'default' })
          }}
        />
        <Row label="Range alerts" hint="Notify above 140 or below 70 mg/dl" on={alerts} set={setAlerts} />
        <Row label="Haptics" hint="Tap feedback on controls" on={haptics} set={setHaptics} />
      </Popover>
    </>
  )
}

/* ── profile ─────────────────────────────────────────────────── */

function Profile() {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const toast = useSoma((s) => s.toast)
  return (
    <>
      <motion.button
        ref={anchor}
        type="button"
        aria-label="Account"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.snappy}
        className="grid h-[38px] w-[38px] cursor-pointer place-items-center rounded-full text-[12px] font-semibold text-white outline-none"
        style={{ background: 'radial-gradient(circle at 30% 25%, #3a3a38, #121212 65%)', boxShadow: '0 6px 16px -8px rgb(0 0 0 / 0.55), inset 0 1px 0 rgb(255 255 255 / 0.14)' }}
      >
        JR
      </motion.button>
      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} width={240} label="Account">
        <div className="px-3 pb-2 pt-2.5">
          <p className="text-[14px] font-medium">Julia Reyes</p>
          <p className="text-[11.5px] text-[var(--ink-2)]">Soma Pro · Sensor S2</p>
        </div>
        <div className="hairline mx-2 my-1" />
        {['Health profile', 'Connected devices', 'Export report'].map((l) => (
          <PopRow key={l} onClick={() => (setOpen(false), toast({ title: l, detail: 'Opening…' }))}>
            {l}
          </PopRow>
        ))}
      </Popover>
    </>
  )
}

/* ── header ──────────────────────────────────────────────────── */

export function Header() {
  const { mode } = useArtboard()

  if (mode === 'compact') {
    return (
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Notifications />
            <Profile />
          </div>
        </div>
        <div className="-mx-1 flex items-center justify-between gap-2 overflow-x-auto px-1 pb-1">
          <Tabs />
        </div>
        <div>
          <DatePicker />
        </div>
      </header>
    )
  }

  return (
    <header className="relative flex h-full items-center justify-between">
      <Logo />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <Tabs />
      </div>
      <div className="flex items-center gap-2">
        <DatePicker />
        <Notifications />
        <Settings />
        <Profile />
      </div>
    </header>
  )
}
