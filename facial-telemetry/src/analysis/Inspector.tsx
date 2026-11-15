import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, ScanFace, X } from 'lucide-react'
import { Glass } from '../ui/Glass'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { FEATURES, type FeatureId } from '../lib/face'
import { springs } from '../lib/utils'
import { useFace, type Overlays } from '../store'
import { useAnalysis } from './analysisStore'
import { FEATURE_ORDER, fmt, type FeatureReport, type Measure } from './model'

/* Feature inspector — the visagism read-out docked beside the head.
   Idle: face shape, harmony score and a feature picker.
   Selected: measurements vs. ideal, headline ratio, insight, overlay toggles. */

const OVERLAY_KEYS: { k: keyof Overlays; label: string }[] = [
  { k: 'thirds', label: 'Thirds' },
  { k: 'fifths', label: 'Fifths' },
  { k: 'golden', label: 'Golden φ' },
  { k: 'symmetry', label: 'Symmetry' },
]

function ScoreRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth="2.5" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={springs.soft}
          style={{ filter: 'drop-shadow(0 0 4px rgb(143 240 192 / .6))' }}
        />
      </svg>
      <AnimatedNumber value={value} className="relative text-[13px] font-medium" />
    </div>
  )
}

function FeatureChips({ compact = false }: { compact?: boolean }) {
  const selected = useFace((s) => s.selected)
  const select = useFace((s) => s.select)
  const hover = useFace((s) => s.hover)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const focusAt = (i: number) => refs.current[(i + FEATURE_ORDER.length) % FEATURE_ORDER.length]?.focus()
  return (
    <div role="radiogroup" aria-label="Facial feature" className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-1.5'}`}>
      {FEATURE_ORDER.map((f, i) => {
        const on = selected === f
        return (
          <button
            key={f}
            ref={(el) => void (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!selected && i === 0) ? 0 : -1}
            onClick={() => select(on ? null : f)}
            onPointerEnter={() => hover(f)}
            onPointerLeave={() => hover(null)}
            onFocus={() => hover(f)}
            onBlur={() => hover(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), focusAt(i + 1), select(FEATURE_ORDER[(i + 1) % FEATURE_ORDER.length]))
              if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), focusAt(i - 1), select(FEATURE_ORDER[(i - 1 + FEATURE_ORDER.length) % FEATURE_ORDER.length]))
            }}
            className={`relative cursor-pointer rounded-full px-2.5 py-[5px] text-[11px] outline-none transition-colors ${on ? 'text-[#04140e]' : 'text-[var(--text-2)] hover:text-[var(--text)]'}`}
          >
            {on && <motion.span layoutId="chip-on" className="absolute inset-0 rounded-full bg-[var(--mint)]" transition={springs.snappy} />}
            {!on && <span className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04]" />}
            <span className="relative">{FEATURES[f].label}</span>
          </button>
        )
      })}
    </div>
  )
}

function OverlayToggles() {
  const overlays = useFace((s) => s.overlays)
  const toggle = useFace((s) => s.toggleOverlay)
  const select = useFace((s) => s.select)
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Proportion overlays">
      {OVERLAY_KEYS.map(({ k, label }) => (
        <button
          key={k}
          type="button"
          aria-pressed={overlays[k]}
          onClick={() => {
            toggle(k)
            // overlays describe the whole face, so leave the single-feature view
            if (!overlays[k]) select(null)
          }}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-[4px] text-[10.5px] outline-none transition-colors ${
            overlays[k] ? 'border-[var(--mint)]/60 bg-[var(--mint)]/10 text-[var(--mint)]' : 'border-white/10 text-[var(--text-3)] hover:text-[var(--text-2)]'
          }`}
        >
          <span className={`h-[5px] w-[5px] rounded-full ${overlays[k] ? 'bg-[var(--mint)]' : 'bg-white/25'}`} />
          {label}
        </button>
      ))}
    </div>
  )
}

function MeasureRow({ m, i }: { m: Measure; i: number }) {
  const hasIdeal = m.ideal !== undefined
  const delta = hasIdeal ? m.value - (m.ideal as number) : 0
  // position of the value on a ±tol bar around the ideal
  const pos = hasIdeal && m.tol ? Math.max(-1, Math.min(1, delta / m.tol)) : 0
  const good = m.score >= 70
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
      className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1"
    >
      <span className="truncate text-[11px] text-[var(--text-2)]">{m.label}</span>
      <span className="tabular text-right text-[12.5px] text-[var(--text)]">{fmt(m.value, m.unit)}</span>
      {hasIdeal && (
        <>
          <div className="relative h-[3px] rounded-full bg-white/10">
            <span className="absolute left-1/2 top-1/2 h-[7px] w-px -translate-y-1/2 bg-white/35" />
            <motion.span
              className={`absolute top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ${good ? 'bg-[var(--mint)]' : 'bg-[var(--warn)]'}`}
              initial={{ left: '50%' }}
              animate={{ left: `${50 + pos * 46}%` }}
              transition={springs.soft}
              style={{ boxShadow: good ? '0 0 8px rgb(143 240 192 / .7)' : '0 0 8px rgb(240 196 107 / .6)' }}
            />
          </div>
          <span className="tabular text-right text-[10px] text-[var(--text-3)]">
            ideal {fmt(m.ideal as number, m.unit)}
          </span>
        </>
      )}
    </motion.li>
  )
}

function RatioVisual({ r }: { r: NonNullable<FeatureReport['ratio']> }) {
  const total = r.a + r.b
  const ideal = r.ideal[0] / (r.ideal[0] + r.ideal[1])
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[10.5px]">
        <span className="text-[var(--text-3)]">{r.label}</span>
        <span className="tabular text-[var(--text-2)]">
          {(r.a / r.b).toFixed(2)} <span className="text-[var(--text-3)]">· ideal {(r.ideal[0] / r.ideal[1]).toFixed(2)}</span>
        </span>
      </div>
      <div className="relative flex h-[6px] gap-[2px] overflow-hidden rounded-full">
        <motion.span className="h-full rounded-full bg-[var(--mint)]" initial={{ flexGrow: 0.5 }} animate={{ flexGrow: r.a / total }} transition={springs.soft} style={{ flexBasis: 0 }} />
        <motion.span className="h-full rounded-full bg-white/25" initial={{ flexGrow: 0.5 }} animate={{ flexGrow: r.b / total }} transition={springs.soft} style={{ flexBasis: 0 }} />
        <span className="absolute top-[-2px] h-[10px] w-[2px] -translate-x-1/2 rounded bg-white" style={{ left: `${ideal * 100}%` }} title="Ideal split" />
      </div>
    </div>
  )
}

function Idle() {
  const summary = useAnalysis((s) => s.summary)
  const fromMesh = useAnalysis((s) => s.fromMesh)
  const progress = useFace((s) => s.scan.progress)
  return (
    <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">Visagism</div>
          <div className="mt-0.5 text-[22px] font-light leading-tight">{summary.shape} face</div>
        </div>
        <ScoreRing value={summary.harmony} />
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-[var(--text-3)]">{summary.shapeNote}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: 'L : W', v: summary.lengthRatio.toFixed(2) },
          { k: 'Symmetry', v: `${summary.symmetry}%` },
          { k: 'Thirds', v: summary.thirds.map((t) => Math.round(t)).join('·') },
        ].map((x) => (
          <div key={x.k} className="glass glass-well rounded-[12px] px-2 py-1.5">
            <div className="relative z-[3] text-[9.5px] text-[var(--text-3)]">{x.k}</div>
            <div className="tabular relative z-[3] text-[12.5px]">{x.v}</div>
          </div>
        ))}
      </div>
      <div className="hairline" />
      <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-3)]">
        <ScanFace size={12} strokeWidth={1.6} className="text-[var(--mint)]" />
        {progress < 100 ? `Mapping landmarks · ${Math.floor(progress)}%` : fromMesh ? '32 landmarks mapped on the 3D scan' : '32 landmarks · estimated surface'}
      </div>
      <FeatureChips />
    </motion.div>
  )
}

function Selected({ f }: { f: FeatureId }) {
  const report = useAnalysis((s) => s.reports[f])
  const select = useFace((s) => s.select)
  const i = FEATURE_ORDER.indexOf(f)
  const go = (d: number) => select(FEATURE_ORDER[(i + d + FEATURE_ORDER.length) % FEATURE_ORDER.length])
  return (
    <motion.div key={f} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous feature" onClick={() => go(-1)} className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[var(--text-2)] outline-none hover:bg-white/10 hover:text-[var(--text)]">
          <ChevronLeft size={15} strokeWidth={1.6} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="label">Feature analysis · {i + 1}/{FEATURE_ORDER.length}</div>
          <h3 className="text-[19px] font-light leading-tight">{report.label}</h3>
        </div>
        <ScoreRing value={report.score} size={40} />
        <button type="button" aria-label="Next feature" onClick={() => go(1)} className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[var(--text-2)] outline-none hover:bg-white/10 hover:text-[var(--text)]">
          <ChevronRight size={15} strokeWidth={1.6} />
        </button>
        <button type="button" aria-label="Close feature analysis" onClick={() => select(null)} className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[var(--text-2)] outline-none hover:bg-white/10 hover:text-[var(--text)]">
          <X size={14} strokeWidth={1.6} />
        </button>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
        {report.measures.map((m, k) => (
          <MeasureRow key={m.id} m={m} i={k} />
        ))}
      </ul>
      {report.ratio && <RatioVisual r={report.ratio} />}
      <p className="rounded-[12px] border border-[var(--mint)]/20 bg-[var(--mint)]/[0.06] px-3 py-2 text-[11px] leading-snug text-[var(--text-2)]">
        <span className="text-[var(--mint)]">Insight · </span>
        {report.insight}
      </p>
      <OverlayToggles />
    </motion.div>
  )
}

export function Inspector() {
  const selected = useFace((s) => s.selected)
  const select = useFace((s) => s.select)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useFace.getState().selected) select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  // Idle the card hugs its content (the face stays visible below it); a selected
  // feature grows it to the full slot. Height springs between the two.
  const shell = useRef<HTMLDivElement>(null)
  const idle = useRef<HTMLDivElement>(null)
  const [h, setH] = useState<{ idle: number; full: number }>({ idle: 0, full: 0 })
  useLayoutEffect(() => {
    const measure = () =>
      setH({
        idle: (idle.current?.offsetHeight ?? 0) + 32,
        full: shell.current?.parentElement?.offsetHeight ?? 0,
      })
    measure()
    const ro = new ResizeObserver(measure)
    if (idle.current) ro.observe(idle.current)
    if (shell.current?.parentElement) ro.observe(shell.current.parentElement)
    return () => ro.disconnect()
  }, [selected])
  const target = selected ? Math.max(h.full, 360) : h.idle

  return (
    <div ref={shell} className="w-full">
      <Glass
        variant="frost"
        radius={24}
        specular={0.6}
        className="flex w-full flex-col overflow-hidden p-4"
        aria-live="polite"
        initial={false}
        animate={target ? { height: target } : undefined}
        transition={springs.soft}
      >
        <div ref={selected ? undefined : idle} className={`relative z-[3] flex flex-col ${selected ? 'min-h-0 flex-1' : ''}`}>
          <AnimatePresence mode="wait" initial={false}>
            {selected ? <Selected key={selected} f={selected} /> : <Idle key="idle" />}
          </AnimatePresence>
        </div>
      </Glass>
    </div>
  )
}
