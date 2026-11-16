import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Eye, PenLine, Search } from 'lucide-react'
import { useStudio, type RegionId } from '../../store'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'
import { MenuItem, Popover, useGesture } from '../kit'

/* ── Zoom ─────────────────────────────────────────────────── */

const ZOOMS = [1, 1.25, 1.5] as const

export function ZoomControl() {
  const zoom = useStudio((s) => s.zoom)
  const setZoom = useStudio((s) => s.setZoom)
  const recenter = useStudio((s) => s.recenter)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  return (
    <>
      <motion.button
        ref={ref}
        type="button"
        aria-label={`Zoom ${Math.round(zoom * 100)}%`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        transition={springs.snappy}
        className="glass glass-pill flex h-full w-full cursor-pointer items-center justify-center gap-1.5 rounded-full text-white outline-none"
      >
        <Search size={17} strokeWidth={1.8} className="relative z-[3]" />
        <motion.span className="relative z-[3]" animate={{ rotate: open ? 180 : 0 }} transition={springs.snappy}>
          <ChevronDown size={15} strokeWidth={1.8} />
        </motion.span>
      </motion.button>
      <Popover open={open} onClose={() => setOpen(false)} anchor={ref} placement="top" align="start" label="Zoom" width={190}>
        <div className="px-3 pb-1 pt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-3)]">Zoom</div>
        {ZOOMS.map((z) => (
          <MenuItem key={z} active={z === zoom} onClick={() => (setZoom(z), setOpen(false))}>
            <span className="tabular">{Math.round(z * 100)}%</span>
          </MenuItem>
        ))}
        <div className="mx-2 my-1 h-px bg-[rgb(60_64_90/0.1)]" />
        <MenuItem onClick={() => (recenter(), setOpen(false))}>Recenter view</MenuItem>
      </Popover>
    </>
  )
}

/* ── MIN–MAX strength ─────────────────────────────────────── */

const STRENGTH_LABEL: Record<RegionId, string> = {
  face: 'Face · sculpt depth',
  eyes: 'Eyes · openness',
  brows: 'Eyebrows · thickness',
  accessories: 'Frames · weight',
}

export function StrengthSlider() {
  const region = useStudio((s) => s.region)
  const value = useStudio((s) => s.look.strength[s.region])
  const edit = useStudio((s) => s.edit)
  const gesture = useGesture()
  const [dragging, setDragging] = useState(false)

  const set = (v: number, commit: boolean) =>
    edit((l) => ({ strength: { ...l.strength, [region]: Math.round(clamp(v, 0, 1) * 100) / 100 } }), commit)

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      gesture.begin()
      setDragging(true)
    }
    set(p.x, false)
    if (p.phase === 'end') {
      gesture.end()
      setDragging(false)
    }
  })

  return (
    <div className="relative flex h-full w-full items-center gap-4 px-2 text-[12px] font-medium uppercase tracking-[0.12em] text-white">
      <span aria-hidden>Min</span>
      <div
        ref={drag.ref}
        onPointerDown={drag.onPointerDown}
        role="slider"
        tabIndex={0}
        aria-label={STRENGTH_LABEL[region]}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-valuetext={`${Math.round(value * 100)}%`}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.02
          const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: 0.1, PageDown: -0.1 }[e.key]
          if (e.key === 'Home') set(0, true)
          else if (e.key === 'End') set(1, true)
          else if (d !== undefined) set(value + d, true)
          else return
          e.preventDefault()
        }}
        onWheel={(e) => set(value - e.deltaY * 0.0015, true)}
        className="group relative flex h-[40px] flex-1 cursor-pointer touch-none items-center rounded-full outline-none"
      >
        <span className="absolute inset-x-0 h-[3px] rounded-full bg-white/70" />
        <motion.span
          className="absolute left-0 h-[3px] rounded-full bg-azure"
          style={{ boxShadow: '0 0 10px rgb(60 108 246 / 0.5)' }}
          initial={false}
          animate={{ width: `${value * 100}%` }}
          transition={dragging ? { duration: 0 } : springs.snappy}
        />
        <motion.span
          className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ boxShadow: '0 4px 10px -2px rgb(40 44 70 / 0.45), inset 0 -1px 1px rgb(0 0 0 / 0.08)' }}
          initial={false}
          animate={{ left: `${value * 100}%`, scale: dragging ? 1.18 : 1 }}
          transition={dragging ? { left: { duration: 0 }, scale: springs.snappy } : springs.snappy}
        />
        <AnimatePresence>
          {dragging && (
            <motion.span
              className="tabular absolute -top-[22px] -translate-x-1/2 rounded-full bg-white/90 px-2 py-[2px] text-[11px] normal-case tracking-normal text-[var(--text)]"
              style={{ left: `${value * 100}%` }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              {Math.round(value * 100)}%
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span aria-hidden>Max</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={region}
          aria-hidden
          className="pointer-events-none absolute -top-[16px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[10.5px] font-normal tracking-[0.1em] text-white/80"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {STRENGTH_LABEL[region]}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

/* ── Compare (hold) + edit ───────────────────────────────── */

export function ViewTools() {
  const comparing = useStudio((s) => s.comparing)
  const setComparing = useStudio((s) => s.setComparing)
  const recenter = useStudio((s) => s.recenter)
  const reset = useStudio((s) => s.reset)
  const toast = useStudio((s) => s.toast)
  const [menu, setMenu] = useState(false)
  const pen = useRef<HTMLButtonElement>(null)

  // Hold Space anywhere to compare with the last saved look.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, button, [role="slider"], [role="radio"], [role="tab"]')) return
      e.preventDefault()
      setComparing(true)
    }
    const up = (e: KeyboardEvent) => e.code === 'Space' && setComparing(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [setComparing])

  return (
    <div className="flex h-full w-full items-center justify-end gap-2.5">
      <motion.button
        type="button"
        aria-label="Hold to compare with the saved look"
        title="Hold to compare (or hold Space)"
        aria-pressed={comparing}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setComparing(true)
        }}
        onPointerUp={() => setComparing(false)}
        onPointerCancel={() => setComparing(false)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && (e.preventDefault(), setComparing(true))}
        onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && setComparing(false)}
        animate={{ scale: comparing ? 0.92 : 1 }}
        whileHover={{ scale: 1.06 }}
        transition={springs.snappy}
        className={cn(
          'glass grid h-[46px] w-[46px] cursor-pointer place-items-center rounded-full outline-none',
          comparing ? 'glass-ink' : 'glass-pill text-white',
        )}
      >
        <Eye size={18} strokeWidth={1.7} className="relative z-[3]" />
      </motion.button>
      <motion.button
        ref={pen}
        type="button"
        aria-label="Edit actions"
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={springs.snappy}
        className="glass glass-ink grid h-[46px] w-[46px] cursor-pointer place-items-center rounded-full outline-none"
      >
        <PenLine size={17} strokeWidth={1.8} className="relative z-[3]" />
      </motion.button>
      <Popover open={menu} onClose={() => setMenu(false)} anchor={pen} placement="top" align="end" label="Edit actions" width={210}>
        <MenuItem onClick={() => (recenter(), setMenu(false))}>Recenter view</MenuItem>
        <MenuItem
          danger
          onClick={() => {
            reset()
            setMenu(false)
            toast({ title: 'Reset to defaults', detail: 'Undo with ⌘Z' })
          }}
        >
          Reset all
        </MenuItem>
      </Popover>
    </div>
  )
}
