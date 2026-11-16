import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Circle, Eye } from 'lucide-react'
import { useStudio, type FaceForm as FaceFormT, type RegionId } from '../../store'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, springs } from '../../lib/utils'
import { Label, useGesture } from '../kit'

const FaceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <ellipse cx="8" cy="8" rx="5" ry="6.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)
const LipsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <path d="M1.5 8 Q4.5 4 8 6.2 Q11.5 4 14.5 8 Q11 12.6 8 12.6 Q5 12.6 1.5 8 Z M1.5 8 Q8 9.6 14.5 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

const SLIDERS: { key: keyof FaceFormT; label: string; region: RegionId; icon: () => React.ReactElement }[] = [
  { key: 'width', label: 'Face width', region: 'face', icon: FaceIcon },
  { key: 'eyes', label: 'Eye size', region: 'eyes', icon: () => <Eye size={16} strokeWidth={1.5} /> },
  { key: 'roundness', label: 'Jaw roundness', region: 'face', icon: () => <Circle size={15} strokeWidth={1.5} /> },
  { key: 'lips', label: 'Lip fullness', region: 'face', icon: LipsIcon },
]

function VSlider({ k, label, region, Icon }: { k: keyof FaceFormT; label: string; region: RegionId; Icon: () => React.ReactElement }) {
  const value = useStudio((s) => s.look.face[k])
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)
  const gesture = useGesture()
  const [dragging, setDragging] = useState(false)

  const set = (v: number, commit: boolean) => edit((l) => ({ face: { ...l.face, [k]: Math.round(clamp(v, 0, 1) * 100) / 100 } }), commit)

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      setRegion(region)
      gesture.begin()
      setDragging(true)
    }
    set(1 - p.y, false)
    if (p.phase === 'end') {
      gesture.end()
      setDragging(false)
    }
  })

  const pct = Math.round(value * 100)
  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div
        ref={drag.ref}
        onPointerDown={drag.onPointerDown}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        onFocus={() => setRegion(region)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.02
          const d = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: 0.1, PageDown: -0.1 }[e.key]
          if (e.key === 'Home') set(0, true)
          else if (e.key === 'End') set(1, true)
          else if (d !== undefined) set(value + d, true)
          else return
          e.preventDefault()
        }}
        onWheel={(e) => {
          setRegion(region)
          set(value - e.deltaY * 0.0015, true)
        }}
        className="group relative w-[26px] flex-1 cursor-pointer touch-none rounded-full outline-none"
      >
        {/* track */}
        <span className="absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 rounded-full bg-white/80" />
        <motion.span
          className="absolute bottom-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-azure"
          style={{ boxShadow: '0 0 8px rgb(60 108 246 / 0.5)' }}
          initial={false}
          animate={{ height: `${pct}%` }}
          transition={dragging ? { duration: 0 } : springs.snappy}
        />
        {/* thumb */}
        <motion.span
          className="absolute left-1/2 h-[22px] w-[9px] -translate-x-1/2 translate-y-1/2 rounded-full bg-white"
          style={{ boxShadow: '0 3px 8px -1px rgb(40 44 70 / 0.45), inset 0 -1px 1px rgb(0 0 0 / 0.08)' }}
          initial={false}
          animate={{ bottom: `${pct}%`, scale: dragging ? 1.2 : 1 }}
          transition={dragging ? { bottom: { duration: 0 }, scale: springs.snappy } : springs.snappy}
          whileHover={{ scale: 1.12 }}
        />
        <AnimatePresence>
          {dragging && (
            <motion.span
              className="tabular pointer-events-none absolute left-[22px] z-10 translate-y-1/2 whitespace-nowrap rounded-full bg-white/92 px-2 py-[2px] text-[11px] text-[var(--text)] shadow-[0_6px_14px_-8px_rgb(40_44_70/0.5)]"
              style={{ bottom: `${pct}%` }}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
            >
              {label} · {pct}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="text-white/90" title={label}>
        <Icon />
      </span>
    </div>
  )
}

export function FaceForm() {
  return (
    <div className="flex h-full w-full flex-col gap-3">
      <Label region="face">Face form</Label>
      <div
        className="glass glass-frost flex flex-1 items-stretch justify-around rounded-[16px] px-3 pb-3 pt-4"
        style={{ ['--g-fill-a' as string]: 'rgb(255 255 255 / 0.12)', ['--g-fill-b' as string]: 'rgb(255 255 255 / 0.04)' }}
        role="group"
        aria-label="Face form"
      >
        {SLIDERS.map((s) => (
          <div key={s.key} className="relative z-[3] h-full">
            <VSlider k={s.key} label={s.label} region={s.region} Icon={s.icon} />
          </div>
        ))}
      </div>
    </div>
  )
}
