import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { Check } from 'lucide-react'
import { useDomus } from '../../store'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { clamp, cn, springs } from '../../lib/utils'
import { CardSheet, DeviceCard, PowerRow, Segmented, SheetHeader } from './DeviceCard'
import { LED_PRESETS, SWATCH_BASE_CSS, SWATCH_SHADE_CSS, offSwatch, swatchHex } from './color'
import { keyToValue, useWheelStep } from './hooks'

type Effect = 'static' | 'breathe' | 'flow'
type Sheet = 'settings' | 'presets' | null

/** LED Strip Frame — 2D champagne/gold picker + brightness. */
export function LedCard() {
  const led = useDomus((s) => s.led)
  const setLed = useDomus((s) => s.setLed)
  const toast = useDomus((s) => s.toast)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [effect, setEffect] = useState<Effect>('static')
  const captionRef = useRef<HTMLButtonElement>(null)

  const setPower = (on: boolean) => {
    setLed({ on })
    toast({ title: 'LED Strip Frame', detail: on ? 'On' : 'Off', tone: on ? 'success' : 'default' })
  }
  const ensureOn = () => {
    if (!led.on) {
      setLed({ on: true })
      toast({ title: 'LED Strip Frame', detail: 'On', tone: 'success' })
    }
  }

  return (
    <DeviceCard
      title={['LED Strip', 'Frame']}
      on={led.on}
      sheetOpen={sheet === 'settings'}
      onSheetOpenChange={(o) => setSheet(o ? 'settings' : null)}
      sheetLabel="LED strip settings"
      obscured={sheet === 'presets'}
      overlay={
        <CardSheet open={sheet === 'presets'} onClose={() => setSheet(null)} label="LED colour presets" anchor={captionRef}>
          <div className="mb-2 min-h-[30px] pr-10 text-[12.5px] leading-tight text-white/95">
            Presets
            <div className="mt-0.5 text-[10.5px] text-white/60">Tap to apply</div>
          </div>
          <div className="grid flex-1 grid-cols-3 content-start gap-x-1 gap-y-1.5">
            {LED_PRESETS.map((p) => {
              const active = led.color.toLowerCase() === p.color.toLowerCase()
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setLed({ on: true, color: p.color, x: p.x, y: p.y })
                    toast({ title: 'LED Strip Frame', detail: `${p.name} preset`, tone: 'success' })
                  }}
                  className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl py-0.5 outline-none"
                >
                  <span className="relative grid h-[30px] w-[30px] place-items-center">
                    {active && (
                      <motion.span
                        layoutId="led-preset-ring"
                        className="absolute inset-0 rounded-full border-[1.5px] border-white"
                        transition={springs.snappy}
                      />
                    )}
                    {/* CSS press/hover: motion gestures on a span would add a second tab stop */}
                    <span
                      className="grid h-[22px] w-[22px] place-items-center rounded-full transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-[1.08] group-active:scale-90"
                      style={{
                        background: `radial-gradient(circle at 35% 30%, #fff8 0%, transparent 45%), ${p.color}`,
                        boxShadow: `0 0 12px ${p.color}66, inset 0 -2px 4px rgb(0 0 0 / 0.18)`,
                      }}
                    >
                      {active && <Check size={11} strokeWidth={2.4} className="text-ink/70" />}
                    </span>
                  </span>
                  <span className={cn('text-[9.5px] leading-none', active ? 'text-white/90' : 'text-white/60 group-hover:text-white/85')}>
                    {p.name}
                  </span>
                </button>
              )
            })}
          </div>
        </CardSheet>
      }
      sheet={
        <>
          <SheetHeader title="LED Strip Frame" sub={led.on ? `${Math.round(led.brightness)}% · ${led.color.toUpperCase()}` : 'Off'} />
          <PowerRow on={led.on} onChange={setPower} label="LED Strip Frame" />
          <div className="mt-auto">
            <div className="mb-1.5 text-[11px] text-white/70">Effect</div>
            <Segmented
              id="led-effect"
              label="LED effect"
              value={effect}
              onChange={(v) => {
                setEffect(v)
                toast({ title: 'LED Strip Frame', detail: `${v[0].toUpperCase()}${v.slice(1)} effect` })
              }}
              options={[
                { value: 'static', label: 'Static' },
                { value: 'breathe', label: 'Breathe' },
                { value: 'flow', label: 'Flow' },
              ]}
            />
          </div>
        </>
      }
    >
      <Swatch effect={effect} onTouch={ensureOn} />
      <Brightness onTouch={ensureOn} />
      <button
        ref={captionRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={sheet === 'presets'}
        onClick={() => setSheet(sheet === 'presets' ? null : 'presets')}
        className="mx-auto mt-auto cursor-pointer rounded-full px-2 text-[11px] leading-[16px] text-white/55 outline-none transition-colors hover:text-white/80"
      >
        Customize Color
      </button>

    </DeviceCard>
  )
}

function Swatch({ effect, onTouch }: { effect: Effect; onTouch: () => void }) {
  const led = useDomus((s) => s.led)
  const setLed = useDomus((s) => s.setLed)
  const [dragging, setDragging] = useState(false)

  const sx = useSpring(led.x, { stiffness: 700, damping: 45, mass: 0.5 })
  const sy = useSpring(led.y, { stiffness: 700, damping: 45, mass: 0.5 })
  useEffect(() => sx.set(led.x), [sx, led.x])
  useEffect(() => sy.set(led.y), [sy, led.y])
  const left = useTransform(sx, (v) => `${clamp(v, 0, 1) * 100}%`)
  const top = useTransform(sy, (v) => `${clamp(v, 0, 1) * 100}%`)

  const pick = (x: number, y: number) => {
    const cx = clamp(x, 0, 1)
    const cy = clamp(y, 0, 1)
    setLed({ x: cx, y: cy, color: swatchHex(cx, cy) })
  }

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      onTouch()
      setDragging(true)
    }
    pick(p.x, p.y)
    if (p.phase === 'end') setDragging(false)
  })
  useWheelStep(drag.ref, (dir) => pick(led.x + dir * 0.03, led.y))

  // A preset outside the champagne→gold family washes the swatch in its hue.
  const tint = offSwatch(led.color, led.x, led.y) > 42

  return (
    <div
      ref={drag.ref}
      role="slider"
      tabIndex={0}
      aria-label="LED colour"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(led.x * 100)}
      aria-valuetext={`Colour ${led.color.toUpperCase()}`}
      onPointerDown={drag.onPointerDown}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 0.1 : 0.03
        const map: Record<string, [number, number]> = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step],
        }
        const d = map[e.key]
        if (!d) return
        e.preventDefault()
        onTouch()
        pick(led.x + d[0], led.y + d[1])
      }}
      className="group relative mt-[6px] h-[70px] w-full cursor-crosshair touch-none rounded-[14px] outline-none"
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[14px]"
        style={{
          background: `${SWATCH_SHADE_CSS}, ${SWATCH_BASE_CSS}`,
          boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 0 0 1px rgb(255 255 255 / 0.12), 0 8px 22px -12px rgb(0 0 0 / 0.6)',
        }}
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: tint ? 0.78 : 0 }}
          transition={{ duration: 0.45 }}
          style={{ background: led.color, mixBlendMode: 'color' }}
        />
        {/* glossy top reflection */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/22 to-transparent" />
        {effect === 'flow' && (
          <motion.div
            className="absolute inset-y-0 w-1/2"
            style={{ background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.28), transparent)' }}
            animate={{ x: ['-100%', '220%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* handle */}
      <motion.span
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left, top }}
        initial={false}
        animate={{
          width: dragging ? 22 : 16,
          height: dragging ? 22 : 16,
          scale: effect === 'breathe' ? [1, 1.18, 1] : 1,
        }}
        transition={
          effect === 'breathe'
            ? { scale: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }, default: springs.bouncy }
            : springs.bouncy
        }
      >
        <span
          className="absolute inset-0 rounded-full border-[2.5px] border-white"
          style={{
            background: led.color,
            boxShadow: `0 0 0 1px rgb(0 0 0 / 0.12), 0 3px 10px rgb(0 0 0 / 0.35), 0 0 16px ${led.color}`,
          }}
        />
      </motion.span>
    </div>
  )
}

function Brightness({ onTouch }: { onTouch: () => void }) {
  const brightness = useDomus((s) => s.led.brightness)
  const color = useDomus((s) => s.led.color)
  const setLed = useDomus((s) => s.setLed)
  const [dragging, setDragging] = useState(false)

  const spring = useSpring(brightness, { stiffness: 600, damping: 42, mass: 0.5 })
  useEffect(() => spring.set(brightness), [spring, brightness])
  const pct = useTransform(spring, (v) => `${clamp(v, 0, 100)}%`)

  const set = (v: number) => setLed({ brightness: Math.round(clamp(v, 0, 100)) })
  const drag = usePointerDrag<HTMLDivElement>((p) => {
    if (p.phase === 'start') {
      onTouch()
      setDragging(true)
    }
    set(p.x * 100)
    if (p.phase === 'end') setDragging(false)
  })
  useWheelStep(drag.ref, (dir) => set(brightness + dir * 2))

  return (
    <div
      ref={drag.ref}
      role="slider"
      tabIndex={0}
      aria-label="LED brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(brightness)}
      aria-valuetext={`${Math.round(brightness)}%`}
      onPointerDown={drag.onPointerDown}
      onKeyDown={(e) => {
        const next = keyToValue(e, brightness)
        if (next === null) return
        e.preventDefault()
        onTouch()
        set(next)
      }}
      className="group relative mt-[8px] flex h-[20px] w-full cursor-ew-resize touch-none items-center outline-none"
    >
      <div className="relative h-[12px] w-full overflow-hidden rounded-full bg-black/30 shadow-[inset_0_1px_2px_rgb(0_0_0/0.45),0_1px_0_rgb(255_255_255/0.08)]">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: pct,
            background: `linear-gradient(90deg, rgb(98 92 58 / 0.55), ${color})`,
            boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.35), 0 0 12px ${color}99`,
          }}
        />
      </div>
      <motion.span
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          left: pct,
          boxShadow: `0 0 0 3px rgb(255 255 255 / 0.22), 0 2px 6px rgb(0 0 0 / 0.45), 0 0 14px ${color}`,
        }}
        initial={false}
        animate={{ width: dragging ? 20 : 16, height: dragging ? 20 : 16 }}
        transition={springs.bouncy}
      />
      <motion.span
        aria-hidden
        className="tabular pointer-events-none absolute -top-[22px] -translate-x-1/2 rounded-full bg-white px-1.5 py-[1px] text-[10px] font-medium text-ink shadow-[0_4px_10px_rgb(0_0_0/0.3)]"
        style={{ left: pct }}
        initial={false}
        animate={{ opacity: dragging ? 1 : 0, y: dragging ? 0 : 4, scale: dragging ? 1 : 0.9 }}
        transition={springs.snappy}
      >
        {Math.round(brightness)}%
      </motion.span>
    </div>
  )
}
