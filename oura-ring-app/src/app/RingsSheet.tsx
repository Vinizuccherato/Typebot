import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { Plus } from 'lucide-react'
import { useRings, type FinishId, type Ring } from '../store'
import { RingScene } from '../three/RingScene'
import { usePointerDrag } from '../lib/usePointerDrag'
import { springs } from '../lib/utils'
import { BRAND } from '../brand'
import { useUiScale } from '../lib/uiScale'
import { GooeyActions } from './GooeyActions'

export const SWATCH: Record<FinishId, string> = {
  cloud: 'radial-gradient(circle at 35% 30%, #ffffff, #ecebe7 60%, #cfd3d2)',
  petal: 'radial-gradient(circle at 35% 30%, #fff6f3, #ecd2cc 60%, #cfaea7)',
  tide: 'radial-gradient(circle at 35% 30%, #f4f8fa, #c9d7de 60%, #9fb2bc)',
  titanium: 'radial-gradient(circle at 35% 30%, #fbfcfc, #c3c8cc 55%, #858c92)',
}

/** The "My Rings" liquid-glass sheet. Drag the grabber to expand; swipe the details to browse rings. */
export function RingsSheet({ placement = 'sheet' }: { placement?: 'sheet' | 'panel' }) {
  const order = useRings((s) => s.order)
  const rings = useRings((s) => s.rings)
  const selectedId = useRings((s) => s.selectedId)
  const activeId = useRings((s) => s.activeId)
  const select = useRings((s) => s.select)
  const step = useRings((s) => s.step)
  const open = useRings((s) => s.sheetOpen)
  const setOpen = useRings((s) => s.setSheetOpen)
  const pulse = useRings((s) => s.pulse)
  const resolution = useUiScale()
  const ring = rings[selectedId]
  const [dir, setDir] = useState<1 | -1>(1)

  /* grabber drag — rubber-banded, snaps open/closed */
  const y = useMotionValue(70)
  const start = useRef(0)
  useEffect(() => {
    const c = animate(y, 0, { ...springs.glide, delay: 0.35 })
    return () => c.stop()
  }, [y])
  const grab = usePointerDrag<HTMLDivElement>((p) => {
    const cy = p.event.clientY
    if (p.phase === 'start') start.current = cy
    const dy = cy - start.current
    if (p.phase === 'move') y.set(dy * 0.35)
    if (p.phase === 'end') {
      if (Math.abs(dy) < 6) setOpen(!open)
      else if (dy < -30) setOpen(true)
      else if (dy > 30) setOpen(false)
      animate(y, 0, springs.bouncy)
    }
  })

  /* horizontal swipe on the details to browse */
  const swipeStart = useRef(0)
  const swipe = usePointerDrag<HTMLDivElement>((p) => {
    const cx = p.event.clientX
    if (p.phase === 'start') swipeStart.current = cx
    if (p.phase === 'end') {
      const dx = cx - swipeStart.current
      if (Math.abs(dx) > 36) go(dx < 0 ? 1 : -1)
    }
  })
  const go = (d: 1 | -1) => {
    setDir(d)
    step(d)
  }

  return (
    <motion.section
      aria-label="My Rings"
      className={`frost z-20 rounded-[34px] ${placement === 'sheet' ? 'absolute inset-x-[18px] bottom-[24px]' : 'relative w-full'}`}
      style={{ y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.6 }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
    >
      {/* grabber */}
      <div
        ref={grab.ref}
        onPointerDown={grab.onPointerDown}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? 'Collapse My Rings' : 'Expand My Rings'}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(!open))}
        className="relative z-[3] flex h-[30px] cursor-grab touch-none items-center justify-center active:cursor-grabbing"
      >
        <span className="flex flex-col items-center gap-[3px]">
          <span className="h-[1.5px] w-[22px] rounded-full bg-white/80" />
          <motion.span className="h-[1.5px] rounded-full bg-white/55" initial={false} animate={{ width: open ? 22 : 14 }} transition={springs.snappy} />
        </span>
      </div>

      {/* header */}
      <div className="relative z-[3] flex items-start justify-between pl-[30px] pr-[16px]">
        <h2 className="pt-[12px] text-[16.5px] font-light tracking-[0.005em] text-white">My Rings</h2>
        <AddRingButton />
      </div>

      {/* expanded: all rings */}
      <motion.div className="relative z-[3] overflow-hidden" initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={springs.glide}>
        <ul className="mx-[16px] mt-1 flex flex-col gap-[6px]" aria-label="All rings">
          {order.map((id) => (
            <RingRow key={id} ring={rings[id]} selected={id === selectedId} active={id === activeId} onSelect={() => select(id)} />
          ))}
        </ul>
      </motion.div>

      {/* product */}
      <div
        ref={swipe.ref}
        onPointerDown={(e) => {
          // pager buttons and the spinnable 3D ring handle their own pointer
          if ((e.target as HTMLElement).closest('button, [data-spin]')) return
          swipe.onPointerDown(e)
        }}
        className="relative z-[3] -mt-[10px] h-[118px] touch-pan-y"
        aria-roledescription="carousel"
      >
        <div data-spin className="absolute left-1/2 top-0 h-[118px] w-[150px] -translate-x-1/2">
          <RingScene variant="product" finish={selectedId} pulse={pulse} resolution={resolution} className="h-full w-full" />
        </div>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={selectedId}
            custom={dir}
            className="pointer-events-none absolute inset-x-0 top-[50px] flex justify-between pl-[30px] pr-[22px]"
            initial={{ opacity: 0, x: dir * 24, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: dir * -24, filter: 'blur(4px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11.5px] font-light leading-[1.35] text-white">
              {BRAND.model}
              <br />
              {ring.material}
            </p>
            <p className="w-[78px] text-[10.5px] font-light leading-[1.4] text-white/70">
              {ring.color}, Size {ring.size}
              <br />
              Battery {ring.battery}%
            </p>
          </motion.div>
        </AnimatePresence>
        {/* pager */}
        <div className="absolute inset-x-0 bottom-[2px] flex justify-center gap-[5px]" role="tablist" aria-label="Choose ring">
          {order.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === selectedId}
              aria-label={`${rings[id].material} ${rings[id].color}`}
              onClick={() => {
                setDir(order.indexOf(id) > order.indexOf(selectedId) ? 1 : -1)
                select(id)
              }}
              className="grid h-4 w-4 cursor-pointer place-items-center outline-none"
            >
              <motion.span className="block h-[4px] rounded-full bg-white" initial={false} animate={{ width: id === selectedId ? 12 : 4, opacity: id === selectedId ? 0.9 : 0.4 }} transition={springs.snappy} />
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-[3] px-[16px] pb-[16px] pt-[8px]">
        <GooeyActions ring={ring} />
      </div>
    </motion.section>
  )
}

function RingRow({ ring, selected, active, onSelect }: { ring: Ring; selected: boolean; active: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="frost-soft relative flex w-full cursor-pointer items-center gap-3 rounded-[18px] px-3 py-[9px] text-left outline-none transition-transform active:scale-[0.98]"
      >
        {selected && <motion.span layoutId="row-sel" className="absolute inset-0 rounded-[18px] bg-white/22" transition={springs.snappy} />}
        <span className="relative h-7 w-7 shrink-0 rounded-full" style={{ background: SWATCH[ring.id], boxShadow: '0 2px 6px rgb(40 60 70 / 0.25)' }} />
        <span className="relative min-w-0 flex-1">
          <span className="block text-[12.5px] font-normal text-white">
            {ring.material} {ring.color}
          </span>
          <span className="block text-[10.5px] font-light text-white/80">Size {ring.size}</span>
        </span>
        {active && <span className="relative rounded-full bg-white/85 px-2 py-[2px] text-[9.5px] font-medium text-[#1b2024]">Active</span>}
        <span className="relative flex w-[54px] flex-col items-end gap-1">
          <span className="tabular text-[10.5px] text-white/80">{ring.battery}%</span>
          <span className="h-[3px] w-full overflow-hidden rounded-full bg-white/25">
            <motion.span className="block h-full rounded-full bg-white" initial={false} animate={{ width: `${ring.battery}%` }} transition={springs.glide} />
          </span>
        </span>
      </button>
    </li>
  )
}

function AddRingButton() {
  const showToast = useRings((s) => s.showToast)
  const [scanning, setScanning] = useState(false)
  return (
    <motion.button
      type="button"
      aria-label={scanning ? 'Searching for rings' : 'Add a ring'}
      aria-busy={scanning}
      onClick={() => {
        if (scanning) return
        setScanning(true)
        window.setTimeout(() => {
          setScanning(false)
          showToast('No new rings nearby')
        }, 2400)
      }}
      whileTap={{ scale: 0.92 }}
      transition={springs.snappy}
      className="frost-soft relative grid h-[60px] w-[60px] cursor-pointer place-items-center rounded-full text-white outline-none"
      style={{ boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 0 0 1px rgb(255 255 255 / 0.18)' }}
    >
      {scanning &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full border border-white/70"
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
      <motion.span animate={{ rotate: scanning ? 45 : 0 }} transition={springs.bouncy} className="grid place-items-center">
        <Plus size={15} strokeWidth={1.4} />
      </motion.span>
    </motion.button>
  )
}
