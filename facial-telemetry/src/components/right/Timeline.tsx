import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Pause, Play } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { useFace } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, springs } from '../../lib/utils'
import { hms, Tip } from './kit'

/** Session events pinned on the ruler (fractions of the recording). */
const EVENTS = [
  { at: 0.06, label: 'Calibration' },
  { at: 0.27, label: 'Baseline captured' },
  { at: 0.52, label: 'HR spike · 74 bpm' },
  { at: 0.71, label: 'Stress probe' },
  { at: 0.93, label: 'Topology pass' },
]
const SPEEDS = [0.5, 1, 2] as const

/** Recording timeline: scrub, play/pause, playback speed. */
export function Timeline() {
  const t = useFace((s) => s.timeline)
  const setTimeline = useFace((s) => s.setTimeline)
  const { mode } = useArtboard()
  const [drag, setDrag] = useState(false)
  const [hoverEv, setHoverEv] = useState<number | null>(null)
  const frac = t.duration ? t.position / t.duration : 0

  const ruler = usePointerDrag<HTMLDivElement>((p) => {
    setTimeline({ position: clamp(p.x, 0, 1) * t.duration })
    setDrag(p.phase !== 'end')
  })

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 60 : 10
    if (e.key === 'ArrowRight') setTimeline({ position: Math.min(t.duration, t.position + step) })
    else if (e.key === 'ArrowLeft') setTimeline({ position: Math.max(0, t.position - step) })
    else if (e.key === 'Home') setTimeline({ position: 0 })
    else if (e.key === 'End') setTimeline({ position: t.duration })
    else if (e.key === ' ') setTimeline({ playing: !t.playing })
    else return
    e.preventDefault()
  }

  const nextSpeed = SPEEDS[(SPEEDS.indexOf(t.speed) + 1) % SPEEDS.length]

  return (
    <Glass variant="frost" radius={20} className="flex h-full w-full items-center gap-3 px-3">
      <motion.button
        type="button"
        onClick={() => setTimeline({ playing: !t.playing })}
        aria-label={t.playing ? 'Pause playback' : 'Play'}
        whileTap={{ scale: 0.9 }}
        transition={springs.snappy}
        className="glass glass-ink relative z-[3] grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full outline-none"
      >
        {t.playing ? <Pause size={14} className="relative z-[3]" /> : <Play size={14} className="relative z-[3] translate-x-[1px]" />}
      </motion.button>

      <div className="relative z-[3] flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 text-[10.5px]">
          <span className="text-white/60">Timeline</span>
          <span className="tabular text-white/80">
            {hms(t.position)} <span className="text-white/40">/ {hms(t.duration)}</span>
          </span>
        </div>
        <div
          ref={ruler.ref}
          onPointerDown={ruler.onPointerDown}
          role="slider"
          tabIndex={0}
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(t.duration)}
          aria-valuenow={Math.round(t.position)}
          aria-valuetext={hms(t.position)}
          onKeyDown={onKey}
          className="relative h-[20px] cursor-pointer touch-none rounded-md outline-none"
        >
          {/* ticks */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[10px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.28) 0 1px, transparent 1px 25%), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.12) 0 1px, transparent 1px 2.5%)',
              backgroundSize: '100% 10px, 100% 5px',
              backgroundPosition: '0 0, 0 5px',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* played */}
          <div aria-hidden className="absolute bottom-0 left-0 h-[2px] rounded-full bg-mint/70" style={{ width: `${frac * 100}%` }} />
          {/* events */}
          {EVENTS.map((ev, i) => (
            <span
              key={ev.label}
              onPointerEnter={() => setHoverEv(i)}
              onPointerLeave={() => setHoverEv(null)}
              className="absolute top-[2px] h-[6px] w-[6px] -translate-x-1/2 rounded-full"
              style={{ left: `${ev.at * 100}%`, background: ev.at <= frac ? 'var(--mint)' : 'rgb(255 255 255 / 0.35)' }}
            />
          ))}
          {/* playhead */}
          <motion.div aria-hidden className="absolute -top-[3px] bottom-0 w-[2px] -translate-x-1/2 rounded-full bg-mint shadow-[0_0_10px_var(--mint)]" style={{ left: `${frac * 100}%` }} animate={{ scaleY: drag ? 1.25 : 1 }} />
          <AnimatePresence>
            {hoverEv !== null && (
              <Tip x={`${EVENTS[hoverEv].at * 100}%`} y={-2}>
                {EVENTS[hoverEv].label}
              </Tip>
            )}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setTimeline({ speed: nextSpeed })}
        aria-label={`Playback speed ${t.speed}×, switch to ${nextSpeed}×`}
        className="glass glass-pill relative z-[3] flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[10.5px] text-white/70 outline-none transition-colors hover:text-white"
      >
        {mode === 'desktop' && <span className="relative z-[3]">Playback speed</span>}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={t.speed}
            className="tabular relative z-[3] font-medium text-mint"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={springs.snappy}
          >
            {t.speed}×
          </motion.span>
        </AnimatePresence>
      </button>
    </Glass>
  )
}
