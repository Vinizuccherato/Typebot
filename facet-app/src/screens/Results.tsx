import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ChevronRight, Info, Move3d, Share2 } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { useFacet } from '../store'
import { FaceView, type FaceViewProps } from '../three/FaceView'
import { Button } from '../ui/Button'
import { ScoreRing } from '../ui/ScoreRing'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { useSpecular } from '../lib/useSpecular'
import { springs } from '../lib/utils'
import { TopBar } from './parts4/TopBar'
import { Segmented } from './parts4/Segmented'
import { SemiGauge } from './parts4/SemiGauge'
import { Sheet } from './parts4/Sheet'

type Lens = 'thirds' | 'golden' | 'symmetry'
type MetricId = 'thirds' | 'symmetry' | 'lw' | 'jaw'

const LENS_OVERLAY: Record<Lens, NonNullable<FaceViewProps['overlays']>> = {
  thirds: { thirds: true },
  golden: { golden: true },
  symmetry: { symmetry: true },
}

/** Explanations shown in the metric sheet — plain language, no absolute claims. */
const EXPLAIN: Record<MetricId, { title: string; body: string; ideal: string; overlays: NonNullable<FaceViewProps['overlays']> }> = {
  thirds: {
    title: 'Facial thirds',
    body: 'Hairline to brow, brow to nose base, nose base to chin. Near-equal thirds read as balanced; your middle and lower thirds match, the upper third is a touch shorter.',
    ideal: 'Each third ≈ 33%',
    overlays: { thirds: true },
  },
  symmetry: {
    title: 'Symmetry',
    body: 'How closely the left and right sides mirror each other across 34 paired landmarks. Nobody is perfectly symmetric — anything above 90% is in the natural, balanced range.',
    ideal: 'Natural range 88–97%',
    overlays: { symmetry: true },
  },
  lw: {
    title: 'Length : width',
    body: 'Face length from hairline to chin divided by cheekbone width. Around 1.3–1.4 is typical of an oval face, which suits most frame and haircut shapes.',
    ideal: 'Oval range 1.30–1.45',
    overlays: { golden: true },
  },
  jaw: {
    title: 'Jaw : cheek',
    body: 'Jaw width compared with cheekbone width. A softly tapering jaw (0.78–0.88) keeps the lower face light; frames with a little width at the top balance it best.',
    ideal: 'Soft taper 0.78–0.88',
    overlays: { measure: 'jaw' },
  },
}

function MetricCard({ onOpen, label, children, foot }: { onOpen: () => void; label: string; children: React.ReactNode; foot: React.ReactNode }) {
  const spec = useSpecular<HTMLButtonElement>(1)
  return (
    <motion.button
      ref={spec.ref}
      type="button"
      onClick={onOpen}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
      aria-haspopup="dialog"
      className="glass glass-frost flex h-[152px] cursor-pointer flex-col justify-between rounded-[22px] p-3.5 text-left outline-none"
    >
      <span className="relative z-[3] flex w-full items-center justify-between">
        <span className="text-[12px] font-semibold text-[var(--text-2)]">{label}</span>
        <ChevronRight size={14} className="text-[var(--text-4)]" />
      </span>
      <span className="relative z-[3] block w-full">{children}</span>
      <span className="relative z-[3] block text-[11.5px] text-[var(--text-3)]">{foot}</span>
    </motion.button>
  )
}

function ThirdsBars({ thirds }: { thirds: [number, number, number] }) {
  const names = ['Upper', 'Middle', 'Lower']
  return (
    <span className="flex flex-col gap-1.5">
      {thirds.map((v, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className="w-[42px] text-[10.5px] text-[var(--text-3)]">{names[i]}</span>
          <span className="relative h-1.5 flex-1 rounded-full bg-white/10">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--lilac), var(--champagne))' }}
              initial={{ width: 0 }}
              animate={{ width: `${(v / 40) * 100}%` }}
              transition={{ ...springs.soft, delay: 0.1 * i }}
            />
            {/* ideal 33% tick */}
            <span className="absolute -top-0.5 h-2.5 w-px bg-white/60" style={{ left: `${(33.3 / 40) * 100}%` }} />
          </span>
          <span className="tabular w-[26px] text-right text-[11px] font-semibold">{v}%</span>
        </span>
      ))}
    </span>
  )
}

function RangeBar({ value, min, max, band }: { value: number; min: number; max: number; band: [number, number] }) {
  const t = (v: number) => ((v - min) / (max - min)) * 100
  return (
    <span className="relative mt-2 block h-1.5 rounded-full bg-white/10">
      <span className="absolute inset-y-0 rounded-full bg-[var(--lilac)]/30" style={{ left: `${t(band[0])}%`, width: `${t(band[1]) - t(band[0])}%` }} />
      <motion.span
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--champagne)]"
        style={{ boxShadow: '0 0 8px rgb(232 203 168 / 0.8)' }}
        initial={{ left: '0%' }}
        animate={{ left: `${t(value)}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 16 }}
      />
    </span>
  )
}

export function ResultsScreen() {
  const { mode, go } = useScreen()
  const back = useFacet((s) => s.back)
  const a = useFacet((s) => s.analysis)
  const toast = useFacet((s) => s.toast)
  const [lens, setLens] = useState<Lens>('thirds')
  const [open, setOpen] = useState<MetricId | null>(null)
  const ex = open ? EXPLAIN[open] : null

  return (
    <ScreenFrame>
      <TopBar
        title="Your analysis"
        onBack={mode === 'app' ? back : undefined}
        trailing={
          <button type="button" aria-label="Share analysis" onClick={() => toast({ title: 'Link copied', detail: 'Share your analysis privately' })} className="glass glass-pill grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
            <Share2 size={17} className="relative z-[3]" />
          </button>
        }
      />

      <div data-wheel className="absolute inset-0 overflow-y-auto overscroll-contain pb-[140px] pt-[114px]" style={{ scrollbarWidth: 'none' }}>
        <div className="px-5">
          <span className="label">Your face shape</span>
          <div className="mt-1 flex items-end justify-between">
            <h1 className="display text-[44px] leading-none">{a.shape}</h1>
            <span className="glass glass-pill mb-1 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold">
              <span className="relative z-[3] h-1.5 w-1.5 rounded-full bg-[var(--mint)]" />
              <span className="relative z-[3]">{a.shapeConfidence}% match</span>
            </span>
          </div>
          <p className="mt-2 text-[14px] leading-[1.45] text-[var(--text-2)]">Balanced length and width with a softly tapering jaw — a versatile base for frames and cuts.</p>
        </div>

        {/* hero: interactive 3D with proportion lenses */}
        <div className="glass glass-frost relative mx-5 mt-4 h-[312px] overflow-hidden rounded-[28px]">
          <FaceView subject="face" material="skin" overlays={LENS_OVERLAY[lens]} landmarks interactive framing="head" className="absolute inset-0" />
          <span className="absolute left-3 top-3 z-[3] inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] text-[var(--text-2)] backdrop-blur-md">
            <Move3d size={12} /> Drag to rotate
          </span>
          <div className="absolute inset-x-3 bottom-3 z-[3]">
            <Segmented
              label="Proportion lens"
              value={lens}
              onChange={setLens}
              size="sm"
              options={[
                { id: 'thirds', label: 'Thirds' },
                { id: 'golden', label: 'Golden ratio' },
                { id: 'symmetry', label: 'Symmetry' },
              ]}
            />
          </div>
        </div>

        {/* harmony */}
        <div className="glass glass-frost mx-5 mt-3 flex items-center gap-4 rounded-[24px] p-4">
          <div className="relative z-[3]">
            <ScoreRing value={a.harmony} size={96} stroke={7} label="Harmony" sub="/100" />
          </div>
          <div className="relative z-[3] min-w-0">
            <span className="label">Harmony score</span>
            <p className="mt-1 text-[16px] font-semibold leading-[1.3]">Balanced proportions</p>
            <p className="mt-1 text-[12.5px] leading-[1.4] text-[var(--text-3)]">Higher than 78% of scans with an oval shape. A guide to your features, not a grade.</p>
          </div>
        </div>

        {/* metric grid (Soma cards) */}
        <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Facial thirds" onOpen={() => setOpen('thirds')} foot="Ideal ≈ 33% each">
            <ThirdsBars thirds={a.thirds} />
          </MetricCard>
          <MetricCard label="Symmetry" onOpen={() => setOpen('symmetry')} foot="Natural range 88–97%">
            <span className="flex flex-col items-center">
              <SemiGauge value={a.symmetry} min={70} max={100} band={[88, 97]} size={112} />
              <span className="-mt-7 flex items-baseline">
                <AnimatedNumber value={a.symmetry} className="text-[22px] font-semibold" />
                <span className="text-[12px] text-[var(--text-3)]">%</span>
              </span>
            </span>
          </MetricCard>
          <MetricCard label="Length : width" onOpen={() => setOpen('lw')} foot="Oval range 1.30–1.45">
            <span className="display block text-[30px] leading-none">
              <AnimatedNumber value={a.lengthToWidth} decimals={2} />
            </span>
            <RangeBar value={a.lengthToWidth} min={1.1} max={1.7} band={[1.3, 1.45]} />
          </MetricCard>
          <MetricCard label="Jaw : cheek" onOpen={() => setOpen('jaw')} foot="Soft taper 0.78–0.88">
            <span className="display block text-[30px] leading-none">
              <AnimatedNumber value={a.jawToCheek} decimals={2} />
            </span>
            <RangeBar value={a.jawToCheek} min={0.65} max={1.05} band={[0.78, 0.88]} />
          </MetricCard>
        </div>

        {/* what this means */}
        <div className="glass glass-frost mx-5 mt-3 rounded-[24px] p-4">
          <span className="relative z-[3] flex items-center gap-2 text-[13px] font-semibold">
            <Info size={15} className="text-[var(--lilac)]" /> What this means
          </span>
          <ul className="relative z-[3] mt-2 flex flex-col gap-1.5 text-[13px] leading-[1.45] text-[var(--text-2)]">
            <li>Most frame shapes sit well on you — rectangular frames add a little structure.</li>
            <li>A soft, slightly lifted brow arch echoes your cheekbones.</li>
            <li>Volume at the crown keeps the upper third in step with the rest.</li>
          </ul>
        </div>
        <p className="mx-5 mt-3 text-[11.5px] leading-[1.4] text-[var(--text-4)]">Estimates from a single scan. Lighting and pose can shift values by a few percent.</p>
      </div>

      {/* pinned CTA */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[150px]" style={{ background: 'linear-gradient(180deg, transparent, rgb(14 12 18 / 0.92) 45%)' }} />
      <div className="absolute inset-x-5 bottom-[50px] z-30">
        <Button className="w-full" onClick={() => go('tryon')} icon={<ArrowRight size={18} />}>
          See recommendations
        </Button>
      </div>

      <Sheet open={!!ex} onClose={() => setOpen(null)} title={ex?.title ?? ''}>
        {ex && (
          <div>
            <div className="relative h-[200px] overflow-hidden rounded-[22px] bg-black/25">
              <FaceView subject="face" material="skin" overlays={ex.overlays} landmarks framing="head" className="absolute inset-0" />
            </div>
            <p className="mt-4 text-[14px] leading-[1.5] text-[var(--text-2)]">{ex.body}</p>
            <span className="glass glass-pill mt-3 inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-semibold">
              <span className="relative z-[3]">{ex.ideal}</span>
            </span>
          </div>
        )}
      </Sheet>
    </ScreenFrame>
  )
}
