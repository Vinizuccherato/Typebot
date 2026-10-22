import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useDomus } from '../../store'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'
import { DeviceCard, PowerRow } from './DeviceCard'
import { keyToValue, useElementSize, useWheelStep } from './hooks'

/* Four equal columns on a non-linear scale, exactly like the reference: 20 · 40 · 60 · 100. */
const BANDS: Array<[number, number]> = [
  [0, 20],
  [20, 40],
  [40, 60],
  [60, 100],
]
const GAP = 3

const PLAYLIST = [
  { track: 'Weightless', artist: 'Marconi Union' },
  { track: 'Teardrop', artist: 'Massive Attack' },
  { track: 'Intro', artist: 'The xx' },
  { track: 'Avril 14th', artist: 'Aphex Twin' },
]

/** position u ∈ [0,1] along the well → volume */
const uToVolume = (u: number) => {
  const c = clamp(u, 0, 0.99999) * 4
  const i = Math.floor(c)
  const [lo, hi] = BANDS[i]
  return lo + (c - i) * (hi - lo)
}
/** volume → position u ∈ [0,1] */
const volumeToU = (v: number) => {
  const i = BANDS.findIndex(([, hi]) => v <= hi)
  const [lo, hi] = BANDS[Math.max(0, i)]
  return (Math.max(0, i) + (clamp(v, lo, hi) - lo) / (hi - lo)) / 4
}

/** Pro Max Studio Speaker — banded level well with a live equaliser shimmer. */
export function SpeakerCard() {
  const speaker = useDomus((s) => s.speaker)
  const setSpeaker = useDomus((s) => s.setSpeaker)
  const toast = useDomus((s) => s.toast)
  const [sheet, setSheet] = useState(false)

  const setPower = (on: boolean) => {
    setSpeaker({ on, playing: on ? speaker.playing : false })
    toast({ title: 'Pro Max Studio Speaker', detail: on ? 'On' : 'Off', tone: on ? 'success' : 'default' })
  }
  const togglePlay = () => {
    const playing = !(speaker.on && speaker.playing)
    setSpeaker({ on: true, playing })
    toast({
      title: 'Pro Max Studio Speaker',
      detail: playing ? `Playing “${speaker.track}”` : 'Paused',
      tone: playing ? 'success' : 'default',
    })
  }
  const skip = (dir: 1 | -1) => {
    const i = PLAYLIST.findIndex((p) => p.track === speaker.track)
    const next = PLAYLIST[(i + dir + PLAYLIST.length) % PLAYLIST.length]
    setSpeaker({ ...next, on: true, playing: true })
    toast({ title: 'Now playing', detail: `${next.track} — ${next.artist}` })
  }
  const playing = speaker.on && speaker.playing

  return (
    <DeviceCard
      title={['Pro Max Studio', 'Speaker']}
      on={speaker.on}
      sheetOpen={sheet}
      onSheetOpenChange={setSheet}
      sheetLabel="Speaker settings"
      sheet={
        <>
          <div className="mb-1.5 min-h-[30px] pr-10">
            <div className="truncate text-[12.5px] leading-tight text-white/95">{speaker.track}</div>
            <div className="mt-0.5 truncate text-[10.5px] leading-tight text-white/60">{speaker.artist}</div>
          </div>
          <div className="relative h-[3px] overflow-hidden rounded-full bg-white/12">
            <motion.div
              key={speaker.track}
              className="absolute inset-y-0 left-0 rounded-full bg-lime-glow"
              initial={{ width: '8%' }}
              animate={playing ? { width: ['8%', '100%'] } : undefined}
              transition={{ duration: 48, ease: 'linear', repeat: Infinity }}
            />
          </div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <TransportButton label="Previous track" onClick={() => skip(-1)}>
              <SkipBack size={14} strokeWidth={1.8} />
            </TransportButton>
            <motion.button
              type="button"
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={togglePlay}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              transition={springs.snappy}
              className="glass glass-solid grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={playing ? 'pause' : 'play'}
                  className="relative z-[3] grid place-items-center"
                  initial={{ scale: 0.4, opacity: 0, rotate: -40 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0, rotate: 40 }}
                  transition={springs.snappy}
                >
                  {playing ? (
                    <Pause size={14} strokeWidth={2} fill="currentColor" />
                  ) : (
                    <Play size={14} strokeWidth={2} fill="currentColor" className="translate-x-[1px]" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <TransportButton label="Next track" onClick={() => skip(1)}>
              <SkipForward size={14} strokeWidth={1.8} />
            </TransportButton>
          </div>
          <div className="mt-auto">
            <PowerRow on={speaker.on} onChange={setPower} label="Pro Max Studio Speaker" />
          </div>
        </>
      }
    >
      <div className="mt-auto">
        <LevelWell playing={playing} />
        <BandLabels />
      </div>
    </DeviceCard>
  )
}

function BandLabels() {
  const volume = useDomus((s) => s.speaker.volume)
  const active = Math.max(0, BANDS.findIndex(([, hi]) => volume <= hi))
  return (
    <div className="mt-[7px] grid grid-cols-4 text-center text-[10.5px] leading-none" style={{ columnGap: GAP }}>
      {BANDS.map(([, hi], i) => (
        <span
          key={hi}
          className={cn('tabular transition-colors duration-300', i === active ? 'font-medium text-white/90' : 'text-white/50')}
        >
          {hi}%
        </span>
      ))}
    </div>
  )
}

function TransportButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      transition={springs.snappy}
      className="grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
    >
      {children}
    </motion.button>
  )
}

function LevelWell({ playing }: { playing: boolean }) {
  const volume = useDomus((s) => s.speaker.volume)
  const on = useDomus((s) => s.speaker.on)
  const setSpeaker = useDomus((s) => s.setSpeaker)
  const toast = useDomus((s) => s.toast)
  const [dragging, setDragging] = useState(false)
  const [sizeRef, { width }] = useElementSize<HTMLDivElement>()

  const spring = useSpring(volume, { stiffness: 420, damping: 36, mass: 0.6 })
  useEffect(() => spring.set(volume), [spring, volume])

  const colW = Math.max(1, (width - GAP * 3) / 4)
  const edgeX = useTransform(spring, (v) => {
    const u = volumeToU(v) * 4
    const i = Math.min(3, Math.floor(u))
    return i * (colW + GAP) + (u - i) * colW
  })

  const ensureOn = () => {
    if (!on) {
      setSpeaker({ on: true })
      toast({ title: 'Pro Max Studio Speaker', detail: 'On', tone: 'success' })
    }
  }
  const set = (v: number) => setSpeaker({ volume: Math.round(clamp(v, 0, 100)) })

  /** pointer px → u, honouring the gaps between columns */
  const pxToU = (px: number) => {
    const slot = colW + GAP
    const i = clamp(Math.floor(px / slot), 0, 3)
    const within = clamp((px - i * slot) / colW, 0, 1)
    return (i + within) / 4
  }

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      ensureOn()
      setDragging(true)
    }
    set(uToVolume(pxToU(clamp(p.px, 0, p.width))))
    if (p.phase === 'end') setDragging(false)
  })
  useWheelStep(drag.ref, (dir) => set(volume + dir * 2))

  return (
    <div
      ref={(el) => {
        drag.ref.current = el
        sizeRef.current = el
      }}
      role="slider"
      tabIndex={0}
      aria-label="Speaker volume"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(volume)}
      aria-valuetext={`${Math.round(volume)}%`}
      data-dragging={dragging}
      onPointerDown={drag.onPointerDown}
      onKeyDown={(e) => {
        const next = keyToValue(e, volume, 0, 100, 2, 10)
        if (next === null) return
        e.preventDefault()
        ensureOn()
        set(next)
      }}
      className="group relative grid h-[88px] w-full cursor-ew-resize touch-none grid-cols-4 rounded-[14px] outline-none focus-visible:outline-offset-2"
      style={{ columnGap: GAP }}
    >
      {BANDS.map(([lo, hi], i) => (
        <Column key={hi} index={i} lo={lo} hi={hi} spring={spring} playing={playing} />
      ))}

      {/* leading edge + readout */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-[6px] left-0 w-[1.5px] -translate-x-1/2 rounded-full bg-white/90 opacity-0 shadow-[0_0_8px_rgb(198_239_142/0.9)] transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[dragging=true]:opacity-100"
        style={{ x: edgeX }}
      />
      <motion.span
        aria-hidden
        className="tabular pointer-events-none absolute -top-[20px] left-0 -translate-x-1/2 rounded-full bg-white px-1.5 py-[1px] text-[10px] font-medium text-ink shadow-[0_4px_10px_rgb(0_0_0/0.3)]"
        style={{ x: edgeX }}
        initial={false}
        animate={{ opacity: dragging ? 1 : 0, scale: dragging ? 1 : 0.85 }}
        transition={springs.snappy}
      >
        {Math.round(volume)}%
      </motion.span>
    </div>
  )
}

function Column({
  index,
  lo,
  hi,
  spring,
  playing,
}: {
  index: number
  lo: number
  hi: number
  spring: MotionValue<number>
  playing: boolean
}) {
  const fill = useTransform(spring, (v) => clamp((v - lo) / (hi - lo), 0, 1))
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[5px]',
        index === 0 && 'rounded-l-[14px]',
        index === 3 && 'rounded-r-[14px]',
      )}
      style={{
        background: 'linear-gradient(180deg, rgb(255 255 255 / 0.07), rgb(255 255 255 / 0.025))',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.08), inset 0 0 0 1px rgb(255 255 255 / 0.05)',
      }}
    >
      <motion.div className="absolute inset-0 origin-left" style={{ scaleX: fill }}>
        <div
          className={cn('domus-eq absolute inset-0 origin-bottom', playing && 'domus-eq-on')}
          style={{
            animationDuration: `${[1.15, 0.9, 1.3, 1.05][index]}s`,
            animationDelay: `${index * -0.37}s`,
            background:
              'linear-gradient(180deg, rgb(206 232 178 / 0.9) 0%, rgb(178 212 146 / 0.62) 40%, rgb(142 178 112 / 0.26) 80%, rgb(142 178 112 / 0.1) 100%)',
            boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.4), 0 0 18px rgb(198 239 142 / 0.3)',
          }}
        />
      </motion.div>
    </div>
  )
}

/** Equaliser shimmer — compositor-only (transform), killed by prefers-reduced-motion in index.css. */
export const EQ_CSS = `
@keyframes domus-eq {
  0%, 100% { transform: scaleY(1); }
  35% { transform: scaleY(0.93); }
  60% { transform: scaleY(0.98); }
  80% { transform: scaleY(0.9); }
}
.domus-eq { transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.domus-eq-on { animation: domus-eq 1s ease-in-out infinite; }
`
