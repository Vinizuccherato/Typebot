import { useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Camera, Hand, Info, Sparkles } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { READING, useLozuc, type RegionId, type RegionReading } from '../store'
import { useSpecular } from '../lib/useSpecular'
import { useTilt } from '../lib/useTilt'
import { cn, springs } from '../lib/utils'
import { AiLabel, PinnedCTA, PriorityPill, SourceChip, TopBar, enter, priorityColor, useSafe } from './b/kit'

const RANK = { alta: 0, media: 1, baixa: 2 } as const
const TOP = READING.filter((r) => r.priority === 'alta').slice(0, 3)
const UNCERTAIN = READING.filter((r) => r.source === 'incerto')
const PRIORITIES = Object.fromEntries(READING.map((r) => [r.id, r.priority])) as Record<RegionId, RegionReading['priority']>
/** chips: actionable regions first (alta → média → baixa → sem ação) */
const CHIPS = [...READING].sort((a, b) => (a.priority ? RANK[a.priority] : 3) - (b.priority ? RANK[b.priority] : 3))

/** LZ-01 — Leitura integrada do rosto: region map on the client's 3D head, priorities, and what can't be concluded. */
export function ReadingScreen() {
  const { go } = useScreen()
  const { top, web } = useSafe()
  const active = useLozuc((s) => s.activeRegion)
  const setActive = useLozuc((s) => s.setActiveRegion)
  const subscribed = useLozuc((s) => s.subscribed)
  const name = useLozuc((s) => s.profile.name)
  const region = READING.find((r) => r.id === active) ?? READING[1]
  const chipsRef = useRef<HTMLDivElement>(null)

  const pick = (id: RegionId) => {
    setActive(id)
    chipsRef.current?.querySelector<HTMLElement>(`[data-region="${id}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <ScreenFrame>
      <div className="h-full overflow-y-auto @3xl:overflow-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="@3xl:grid @3xl:h-full @3xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* hero: region map */}
          <div className="px-5 @3xl:flex @3xl:h-full @3xl:flex-col @3xl:p-6" style={{ paddingTop: top }}>
            <div className="@3xl:hidden">
              <TopBar title="Leitura do rosto" tag="LZ-01" onBack={() => go('processing')} right={<InfoButton />} />
            </div>
            <Hero region={region} onSelect={pick} />
          </div>

          {/* content */}
          <div className="@3xl:h-full @3xl:overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex flex-col gap-4 px-5 pb-[150px] pt-4 @3xl:px-6" style={{ paddingTop: web ? top : 16 }}>
              <div className="hidden @3xl:block">
                <TopBar title="Leitura do rosto" tag="LZ-01" onBack={() => go('processing')} right={<InfoButton />} />
              </div>

              <motion.header {...enter} className="pt-1">
                <AiLabel />
                <h2 className="display mt-2 text-[32px] leading-[1.02]">
                  {name}, seu rosto tem <span className="text-[var(--sage)]">ótima base</span> para estilos curtos e médios.
                </h2>
                <p className="mt-2 text-[14.5px] leading-[1.45] text-[var(--text-2)]">Lemos o conjunto — cabelo, barba, sobrancelhas, pele e proporções aparentes — e marcamos o que vale valorizar e o que fazer primeiro.</p>
              </motion.header>

              <Priorities onPick={pick} />

              {/* region chips */}
              <section aria-label="Regiões">
                <p className="label mb-2">Toque numa região</p>
                <div ref={chipsRef} role="tablist" aria-label="Regiões do rosto" className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 @3xl:-mx-6 @3xl:px-6" style={{ scrollbarWidth: 'none' }}>
                  {CHIPS.map((r) => {
                    const on = r.id === region.id
                    return (
                      <button
                        key={r.id}
                        data-region={r.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => pick(r.id)}
                        className={cn('glass relative flex h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold outline-none', on ? 'glass-ink' : 'glass-pill text-[var(--text-2)]')}
                      >
                        <span aria-hidden className="relative z-[3] h-2 w-2 rounded-full" style={{ background: priorityColor(r.priority), boxShadow: r.priority === 'alta' ? '0 0 8px var(--brass)' : undefined }} />
                        <span className="relative z-[3]">{r.name}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <RegionDetail region={region} />
              <Uncertain onRetake={() => go('capture')} />

              <p className="flex gap-2 text-[12px] leading-[1.45] text-[var(--text-3)]">
                <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
                Leitura de uma sessão de fotos. Luz, ângulo, barba e expressão mudam o que a câmera registra; não é diagnóstico de saúde nem nota de aparência.
              </p>
            </div>

          </div>
        </div>
      </div>
      {/* pinned to the frame (not the scroller); web: under the content column */}
      <PinnedCTA className="@3xl:left-[51%]">
        <Button onClick={() => go(subscribed ? 'directions' : 'paywall')} icon={<ArrowRight size={18} />}>
          Ver minhas direções
        </Button>
      </PinnedCTA>
    </ScreenFrame>
  )
}

function InfoButton() {
  return (
    <button type="button" aria-label="Como lemos seu rosto" title="Como lemos seu rosto" className="glass glass-pill liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
      <Info size={18} className="relative z-[3]" />
    </button>
  )
}

/** The client's 3D head as a region map. */
function Hero({ region, onSelect }: { region: RegionReading; onSelect: (id: RegionId) => void }) {
  const spec = useSpecular<HTMLDivElement>(0.8)
  return (
    <motion.div
      ref={spec.ref}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.soft}
      className="glass glass-frost relative mt-4 h-[360px] overflow-hidden rounded-[32px] @3xl:mt-4 @3xl:h-auto @3xl:flex-1"
    >
      {/* soft volumetric light behind the head */}
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgb(169 199 182 / 0.2), transparent 70%), radial-gradient(40% 30% at 70% 85%, rgb(216 185 126 / 0.1), transparent 70%)' }} />
      <FaceView
        subject="face"
        material="map"
        regions={{ show: true, active: region.id, onSelect, priorities: PRIORITIES }}
        interactive
        framing="head"
        className="absolute inset-0 z-[2]"
      />
      <span className="glass glass-smoke liquid absolute left-3 top-3 z-[4] inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[var(--text-2)]">
        <Hand size={13} className="relative z-[3]" aria-hidden />
        <span className="relative z-[3]">Gire e toque nas regiões</span>
      </span>
      {/* legend: colour + text */}
      <div className="glass glass-smoke liquid absolute inset-x-3 bottom-3 z-[4] flex items-center justify-between rounded-[20px] px-4 py-2.5">
        {(['alta', 'media', 'baixa'] as const).map((p) => (
          <span key={p} className="relative z-[3] inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--text-2)]">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: priorityColor(p) }} />
            {p === 'alta' ? 'Alta' : p === 'media' ? 'Média' : 'Baixa'}
          </span>
        ))}
        <span className="relative z-[3] text-[11.5px] font-semibold text-[var(--sage)]">{region.name}</span>
      </div>
    </motion.div>
  )
}

/** Top-3 high priorities, each traceable to the rule/preference that supports it. */
function Priorities({ onPick }: { onPick: (id: RegionId) => void }) {
  const tilt = useTilt<HTMLElement>(4)
  return (
    <motion.section
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      {...enter}
      aria-labelledby="prio-title"
      className="glass glass-frost liquid tilt rounded-[28px] p-4"
    >
      <div className="relative z-[3] flex items-center justify-between">
        <h3 id="prio-title" className="display text-[22px]">
          Suas prioridades
        </h3>
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--brass)]">
          <Sparkles size={13} aria-hidden /> Fazer primeiro
        </span>
      </div>
      <ol className="relative z-[3] mt-3 flex flex-col gap-2">
        {TOP.map((r, i) => (
          <li key={r.id}>
            <button type="button" onClick={() => onPick(r.id)} className="glass glass-well flex w-full cursor-pointer items-start gap-3 rounded-[20px] p-3 text-left outline-none">
              <span className="display relative z-[3] grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] text-[var(--color-pine)]" style={{ background: 'linear-gradient(145deg, #f0dcae, var(--brass))', boxShadow: '0 6px 14px -6px rgb(216 185 126 / 0.7), inset 0 1px 0 rgb(255 255 255 / 0.7)' }}>
                {i + 1}
              </span>
              <span className="relative z-[3] min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold">{r.name}</span>
                <span className="block text-[13px] leading-[1.4] text-[var(--text-2)]">{r.note}</span>
                {r.because && <span className="mt-1 block text-[12px] text-[var(--sage)]">porque {r.because[0].toLowerCase() + r.because.slice(1)}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </motion.section>
  )
}

/** Detail of the active region: note, source, quality to value, priority and why. */
function RegionDetail({ region }: { region: RegionReading }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.section
        key={region.id}
        role="tabpanel"
        aria-label={region.name}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={springs.snappy}
        className="glass glass-smoke liquid rounded-[28px] p-4"
      >
        <div className="relative z-[3] flex items-start justify-between gap-3">
          <h3 className="display text-[24px] leading-tight">{region.name}</h3>
          <PriorityPill p={region.priority} />
        </div>
        <div className="relative z-[3] mt-2">
          <SourceChip source={region.source} />
        </div>
        <p className="relative z-[3] mt-3 text-[15px] leading-[1.45]">{region.note}</p>
        {region.value && (
          <div className="glass glass-sage relative z-[3] mt-3 rounded-[18px] p-3">
            <p className="label relative z-[3] !text-[var(--mist)]">Qualidade a valorizar</p>
            <p className="relative z-[3] mt-1 text-[14px] font-semibold">{region.value}</p>
          </div>
        )}
        {region.because && (
          <p className="relative z-[3] mt-3 text-[13px] text-[var(--text-2)]">
            <span className="font-semibold text-[var(--text)]">Por quê · </span>
            {region.because}
          </p>
        )}
      </motion.section>
    </AnimatePresence>
  )
}

/** What the capture can't support — calm, with the fix. */
function Uncertain({ onRetake }: { onRetake: () => void }) {
  if (!UNCERTAIN.length) return null
  return (
    <motion.section {...enter} aria-labelledby="unc-title" className="glass glass-frost rounded-[28px] border border-dashed border-[rgb(227_164_138/0.35)] p-4">
      <h3 id="unc-title" className="relative z-[3] text-[16px] font-semibold">
        O que não dá para concluir
      </h3>
      <ul className="relative z-[3] mt-2 flex flex-col gap-2">
        {UNCERTAIN.map((r) => (
          <li key={r.id} className="flex items-start gap-2 text-[13.5px] leading-[1.45] text-[var(--text-2)]">
            <SourceChip source="incerto" compact />
            <span>
              <span className="font-semibold text-[var(--text)]">{r.name}:</span> {r.because ?? r.note}
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onRetake} className="glass glass-pill liquid relative z-[3] mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold outline-none">
        <Camera size={15} className="relative z-[3]" aria-hidden />
        <span className="relative z-[3]">Nova foto com luz natural de frente</span>
      </button>
    </motion.section>
  )
}
