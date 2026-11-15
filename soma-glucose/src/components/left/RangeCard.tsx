import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { usePointerDrag } from '../../lib/usePointerDrag'
import { CardHead, Corner, Tip } from './parts'

const LO = 50
const HI = 200
const PERIODS = [
  { id: 'night', label: 'Night', from: 0, to: 6 },
  { id: 'morning', label: 'Morning', from: 6, to: 11 },
  { id: 'midday', label: 'Midday', from: 11, to: 15 },
  { id: 'afternoon', label: 'Afternoon', from: 15, to: 19 },
  { id: 'evening', label: 'Evening', from: 19, to: 24 },
]
const TICKS = [180, 140, 100, 70]

/** Period lows/highs with a draggable personal target band. */
export function RangeCard() {
  const series = useSoma((s) => s.series)
  const now = useSoma((s) => s.now)
  const min = useSoma((s) => s.stats.min)
  const toast = useSoma((s) => s.toast)
  const [band, setBand] = useState({ low: 70, high: 140 })
  const [active, setActive] = useState<'low' | 'high' | null>(null)
  const grab = useRef<'low' | 'high'>('low')
  const bandRef = useRef(band)
  bandRef.current = band

  const bars = useMemo(
    () =>
      PERIODS.map((p) => {
        const to = Math.min(p.to * 12, now + 1)
        const v = series.slice(p.from * 12, to)
        return v.length ? { ...p, min: Math.min(...v), max: Math.max(...v) } : { ...p, min: null, max: null }
      }),
    [series, now],
  )

  const H = 100
  const yOf = (v: number) => (1 - (v - LO) / (HI - LO)) * H
  const vOf = (py: number) => Math.round(LO + (1 - py / H) * (HI - LO))

  const commit = (b: { low: number; high: number }) =>
    toast({ title: 'Target range updated', detail: `${b.low}–${b.high} mg/dl`, tone: 'success' })

  const drag = usePointerDrag<HTMLDivElement>((p) => {
    const v = vOf(Math.max(0, Math.min(H, p.y * H)))
    if (p.phase === 'start') grab.current = Math.abs(v - band.low) < Math.abs(v - band.high) ? 'low' : 'high'
    setActive(p.phase === 'end' ? null : grab.current)
    const b = bandRef.current
    const next = grab.current === 'low' ? { ...b, low: Math.max(LO, Math.min(b.high - 10, v)) } : { ...b, high: Math.min(HI, Math.max(b.low + 10, v)) }
    bandRef.current = next
    setBand(next)
    if (p.phase === 'end') commit(next)
  })

  const key = (which: 'low' | 'high') => (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowUp' ? 5 : e.key === 'ArrowDown' ? -5 : 0
    if (!d) return
    e.preventDefault()
    setBand((b) => (which === 'low' ? { ...b, low: Math.max(LO, Math.min(b.high - 10, b.low + d)) } : { ...b, high: Math.min(HI, Math.max(b.low + 10, b.high + d)) }))
  }

  return (
    <Glass variant="frost" radius={24} specular={0.6} className="flex h-full w-full flex-col px-[14px] pb-[14px] pt-[15px]">
      <CardHead label="Range" right={<Corner label="Range details" onClick={() => toast({ title: `Target ${band.low}–${band.high} mg/dl`, detail: 'Drag the band edges to personalise' })} />} />

      <div className="relative z-[3] mt-2 flex min-h-0 flex-1 gap-1.5">
        {/* y ticks */}
        <div className="relative w-[18px] shrink-0" style={{ height: H }}>
          {TICKS.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 text-[8.5px] text-[var(--ink-3)] tabular" style={{ top: yOf(t) }}>
              {t}
            </span>
          ))}
        </div>
        {/* plot */}
        <div ref={drag.ref} onPointerDown={drag.onPointerDown} className="relative flex-1 cursor-ns-resize touch-none" style={{ height: H }}>
          <motion.div
            className="absolute inset-x-0 rounded-[4px] bg-volt/30"
            initial={false}
            animate={{ top: yOf(band.high), height: yOf(band.low) - yOf(band.high) }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
          {(['high', 'low'] as const).map((w) => (
            <motion.div
              key={w}
              role="slider"
              tabIndex={0}
              aria-label={w === 'low' ? 'Target range low' : 'Target range high'}
              aria-valuemin={LO}
              aria-valuemax={HI}
              aria-valuenow={band[w]}
              onKeyDown={key(w)}
              onKeyUp={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && commit(band)}
              className="absolute inset-x-0 h-0 outline-none"
              initial={false}
              animate={{ top: yOf(band[w]) }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            >
              <span className="absolute inset-x-0 border-t border-dashed border-[rgb(18_18_18/0.45)]" />
              <span className="absolute -right-1 -top-[5px] h-[10px] w-[10px] rounded-full border-[1.5px] border-[var(--ink)] bg-white" />
              {active === w && (
                <span className="absolute -left-1 -translate-x-full -translate-y-1/2">
                  <Tip>{band[w]}</Tip>
                </span>
              )}
            </motion.div>
          ))}
          {/* period bars */}
          <div className="pointer-events-none absolute inset-0 flex justify-around px-1">
            {bars.map((b) => (
              <div key={b.id} className="relative w-[6px]" title={b.label}>
                {b.min !== null && b.max !== null ? (
                  <motion.span
                    className="absolute left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-[var(--ink)]"
                    initial={false}
                    animate={{ top: yOf(Math.min(HI, b.max)), height: Math.max(3, yOf(Math.max(LO, b.min)) - yOf(Math.min(HI, b.max))) }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                  >
                    <span className="absolute -left-[2px] top-0 h-[2px] w-[6px] rounded-full bg-[var(--ink)]" />
                    <span className="absolute -left-[2px] bottom-0 h-[2px] w-[6px] rounded-full bg-[var(--ink)]" />
                  </motion.span>
                ) : (
                  <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[rgb(18_18_18/0.18)]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-[3] mt-2 flex items-end gap-1.5">
        <AnimatedNumber value={min} className="text-[30px] font-light leading-none tracking-[-0.03em]" />
        <span className="pb-[3px] text-[10.5px] leading-tight text-[var(--ink-2)]">
          mg/dl
          <br />
          lowest
        </span>
      </div>
    </Glass>
  )
}
