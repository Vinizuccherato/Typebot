import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { ChevronRight, Download, FileJson, FileText, Search, Share2 } from 'lucide-react'
import { useFace, TABS } from '../../store'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { springs, cn } from '../../lib/utils'
import { CommandPalette } from './CommandPalette'
import { Popover, PopRow } from './Popover'

/** Two overlapping soft discs — the product mark from the reference. */
function Logo() {
  return (
    <Glass variant="pill" radius={16} className="grid h-12 w-12 shrink-0 place-items-center">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="relative z-[3]">
        <circle cx="9" cy="10" r="6.2" fill="white" fillOpacity="0.9" />
        <circle cx="15" cy="14" r="6.2" fill="white" fillOpacity="0.45" />
      </svg>
    </Glass>
  )
}

function Breadcrumb() {
  const running = useFace((s) => s.scan.running)
  return (
    <Glass variant="pill" radius={999} className="flex h-12 items-center gap-2 px-4 text-[12.5px]">
      <span className="relative z-[3] grid h-2 w-2 place-items-center" aria-hidden>
        <span className="absolute h-2 w-2 rounded-full" style={{ background: running ? 'var(--mint)' : 'rgb(242 247 245 / 0.5)' }} />
        {running && (
          <motion.span
            className="absolute h-2 w-2 rounded-full bg-[var(--mint)]"
            animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </span>
      <span className="relative z-[3] text-white/50">Category</span>
      <ChevronRight size={12} className="relative z-[3] text-white/35" aria-hidden />
      <span className="relative z-[3] text-white/90">Summary</span>
      <span className="sr-only">{running ? 'Scan in progress' : 'Scan complete'}</span>
    </Glass>
  )
}

function Tabs({ compact }: { compact: boolean }) {
  const tab = useFace((s) => s.tab)
  const setTab = useFace((s) => s.setTab)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  return (
    <Glass variant="pill" radius={999} className="flex h-12 items-center p-[5px]" role="tablist" aria-label="Analysis view">
      {TABS.map((t, i) => {
        const on = t.id === tab
        return (
          <button
            key={t.id}
            ref={(el) => void (refs.current[i] = el)}
            type="button"
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
              'relative z-[3] h-full cursor-pointer whitespace-nowrap rounded-full outline-none transition-colors',
              compact ? 'px-3 text-[12px]' : 'px-[18px] text-[13px]',
              on ? 'text-white' : 'text-white/50 hover:text-white/80',
            )}
          >
            {on && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-full"
                transition={springs.snappy}
                style={{
                  background: 'linear-gradient(180deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.06))',
                  boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.18), inset 0 0 0 1px rgb(255 255 255 / 0.08)',
                }}
              />
            )}
            <span className="relative">{compact && t.id === 'symmetry' ? 'Symmetry' : t.label}</span>
          </button>
        )
      })}
    </Glass>
  )
}

function SearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label="Search (Ctrl K)"
      title="Search · ⌘K"
      onClick={onOpen}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={springs.snappy}
      className="glass glass-pill grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full outline-none"
    >
      <Search size={17} strokeWidth={1.6} className="relative z-[3] text-white/80" />
    </motion.button>
  )
}

function Session() {
  const running = useFace((s) => s.scan.running)
  const progress = useFace((s) => s.scan.progress)
  return (
    <Glass variant="pill" radius={999} className="flex h-12 items-center gap-2.5 pl-4 pr-5 text-[12.5px]">
      <span className="relative z-[3] flex items-center gap-1.5">
        <motion.span
          className="h-[7px] w-[7px] rounded-full bg-[var(--hot)]"
          animate={running ? { opacity: [1, 0.25, 1] } : { opacity: 0.4 }}
          transition={{ duration: 1.2, repeat: running ? Infinity : 0 }}
        />
        <span className="font-medium tracking-[0.06em] text-white/80">{running ? 'REC' : 'IDLE'}</span>
      </span>
      <span className="relative z-[3] h-4 w-px bg-white/12" />
      <span className="relative z-[3] text-white/55">Subject</span>
      <span className="relative z-[3] tabular text-white/90">#A-0247</span>
      <span className="relative z-[3] tabular w-[34px] text-right text-[var(--mint)]">{Math.round(progress)}%</span>
    </Glass>
  )
}

function ExportButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const toast = useFace((s) => s.toast)
  const done = (title: string, detail: string) => {
    setOpen(false)
    toast({ title, detail, tone: 'success' })
  }
  return (
    <>
      <motion.button
        ref={ref}
        type="button"
        aria-label="Export report"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        transition={springs.snappy}
        className="glass glass-pill grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full outline-none"
      >
        <Download size={17} strokeWidth={1.6} className="relative z-[3] text-white/80" />
      </motion.button>
      <Popover anchor={ref} open={open} onClose={() => setOpen(false)} width={250} label="Export report">
        <p className="px-3 pb-1 pt-2 text-[10.5px] uppercase tracking-[0.08em] text-white/40">Export session</p>
        <PopRow onClick={() => done('Report exported', 'Telemetry summary · PDF')}>
          <FileText size={15} strokeWidth={1.6} className="text-white/55" /> Telemetry report (PDF)
        </PopRow>
        <PopRow onClick={() => done('Landmarks exported', '32 points · head-local mm')}>
          <FileJson size={15} strokeWidth={1.6} className="text-white/55" /> Landmarks (JSON)
        </PopRow>
        <PopRow onClick={() => done('Share link copied', 'Valid for 24 hours')}>
          <Share2 size={15} strokeWidth={1.6} className="text-white/55" /> Copy share link
        </PopRow>
      </Popover>
    </>
  )
}

function Avatar() {
  return (
    <div
      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[13px] font-medium text-[#04140e]"
      style={{ background: 'radial-gradient(circle at 30% 25%, #d6ffe9, #8ff0c0 45%, #2f9e74)', boxShadow: '0 6px 18px -6px rgb(143 240 192 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.6)' }}
      aria-label="Operator: Dr. Lena Ortiz"
      role="img"
    >
      LO
    </div>
  )
}

/** Top bar: mark, breadcrumb, search + analysis tabs, session status, export, operator. */
export function Header() {
  const { mode } = useArtboard()
  const compact = mode === 'compact'
  const [palette, setPalette] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Logo />
          <Breadcrumb />
          <span className="flex-1" />
          <SearchButton onOpen={() => setPalette(true)} />
          <Avatar />
        </div>
        <div className="flex justify-center">
          <Tabs compact />
        </div>
        <CommandPalette open={palette} onClose={() => setPalette(false)} />
      </div>
    )
  }

  return (
    <div className="relative flex h-full items-center">
      <div className="flex items-center gap-3">
        <Logo />
        <Breadcrumb />
      </div>
      <div className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-2.5">
        <SearchButton onOpen={() => setPalette(true)} />
        <Tabs compact={false} />
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <Session />
        <ExportButton />
        <Avatar />
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}
