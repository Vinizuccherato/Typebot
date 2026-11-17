import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Columns3, Sparkles } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { PageDots } from '../ui/PageDots'
import { DIRECTIONS, useLozuc, type Direction } from '../store'
import { useTilt } from '../lib/useTilt'
import { useSpecular } from '../lib/useSpecular'
import { cn, springs } from '../lib/utils'
import { AiLabel, Meter, PinnedCTA, TopBar, useSafe } from './b/kit'

const HINTS = {
  manutencao: ['Baixa', 'Média', 'Alta'] as [string, string, string],
  esforco: ['5 min', '10 min', '15+ min'] as [string, string, string],
  custo: ['Baixo', 'Médio', 'Alto'] as [string, string, string],
}

/** LZ-02 — Até três direções viáveis, each previewed live on the client's head. */
export function DirectionsScreen() {
  const { go, id: screenId } = useScreen()
  const { top } = useSafe()
  const chosen = useLozuc((s) => s.chosenDirection)
  const choose = useLozuc((s) => s.chooseDirection)
  const [compare, setCompare] = useState(false)
  const [index, setIndex] = useState(() => Math.max(0, DIRECTIONS.findIndex((d) => d.id === chosen)))
  const rail = useRef<HTMLDivElement>(null)

  // pager follows the snap position
  useEffect(() => {
    const el = rail.current
    if (!el || compare) return
    const on = () => {
      const cards = [...el.querySelectorAll<HTMLElement>('[data-card]')]
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)) best = i
      })
      setIndex(best)
    }
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [compare])

  const scrollTo = (i: number) => {
    const c = rail.current?.querySelectorAll<HTMLElement>('[data-card]')[i]
    c?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    setIndex(i)
  }

  return (
    <ScreenFrame>
      <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="flex flex-col gap-4 pb-[150px] @3xl:mx-auto @3xl:max-w-[1180px]" style={{ paddingTop: top }}>
          <div className="px-5 @3xl:px-8">
            <TopBar
              title="Direções"
              tag="LZ-02"
              onBack={() => go('reading')}
              right={
                <button
                  type="button"
                  aria-pressed={compare}
                  aria-label={compare ? 'Ver uma por vez' : 'Comparar lado a lado'}
                  title={compare ? 'Ver uma por vez' : 'Comparar lado a lado'}
                  onClick={() => setCompare((c) => !c)}
                  className={cn('glass liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none', compare ? 'glass-ink' : 'glass-pill')}
                >
                  <Columns3 size={18} className="relative z-[3]" />
                </button>
              }
            />
            <header className="mt-3">
              <AiLabel />
              <h2 className="display mt-2 text-[32px] leading-[1.02]">
                {DIRECTIONS.length} caminhos <span className="text-[var(--sage)]">viáveis</span> para você
              </h2>
              <p className="mt-2 text-[14.5px] leading-[1.45] text-[var(--text-2)]">Mostramos só alternativas viáveis — no máximo três. Cada uma combina cabelo, barba, sobrancelha e tom, com a manutenção que ela pede.</p>
            </header>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {compare ? (
              <motion.div key="compare" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springs.soft} className="px-5 @3xl:px-8">
                <CompareTable chosen={chosen} onChoose={choose} />
              </motion.div>
            ) : (
              <motion.div key="cards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={springs.soft}>
                <div
                  ref={rail}
                  role="list"
                  aria-label="Direções de imagem"
                  className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 pt-1 @3xl:grid @3xl:grid-cols-3 @3xl:gap-5 @3xl:overflow-visible @3xl:px-8"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {DIRECTIONS.map((d) => (
                    <DirectionCard key={d.id} d={d} chosen={d.id === chosen} onChoose={() => choose(d.id)} screenId={screenId} />
                  ))}
                </div>
                <div className="flex justify-center @3xl:hidden">
                  <PageDots count={DIRECTIONS.length} index={index} onSelect={scrollTo} labels={DIRECTIONS.map((d) => d.name)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PinnedCTA className="@3xl:left-auto @3xl:right-0 @3xl:w-[420px]">
        <Button onClick={() => go('simulation')} icon={<ArrowRight size={18} />}>
          Ver no meu rosto
        </Button>
      </PinnedCTA>
    </ScreenFrame>
  )
}

function DirectionCard({ d, chosen, onChoose, screenId }: { d: Direction; chosen: boolean; onChoose: () => void; screenId: string }) {
  const tilt = useTilt<HTMLDivElement>(5)
  const spec = useSpecular<HTMLDivElement>(1)
  return (
    <div role="listitem" data-card className="w-[84%] shrink-0 snap-center @3xl:w-auto">
      <div
        ref={(el) => {
          tilt.ref.current = el
          spec.ref.current = el
        }}
        onPointerMove={(e) => {
          tilt.onPointerMove(e)
          spec.onPointerMove(e)
        }}
        onPointerLeave={() => {
          tilt.onPointerLeave()
          spec.onPointerLeave()
        }}
        className={cn('glass liquid tilt flex h-full flex-col rounded-[32px] p-3', chosen ? 'glass-sage' : 'glass-frost')}
      >
        <div className="glass glass-well relative h-[230px] overflow-hidden rounded-[24px]">
          <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgb(169 199 182 / 0.18), transparent 70%)' }} />
          <FaceView subject="face" material="skin" style={d.style} framing="head" autoRotate className="absolute inset-0 z-[2]" />
          {d.recommended && (
            <span className="absolute left-3 top-3 z-[4] inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold text-[var(--color-pine)]" style={{ background: 'linear-gradient(145deg, #f2e0b6, var(--brass))', boxShadow: '0 8px 18px -8px rgb(216 185 126 / 0.8)' }}>
              <Sparkles size={13} aria-hidden /> Recomendada
            </span>
          )}
          {chosen && (
            <motion.span layoutId={`chosen-${screenId}`} transition={springs.snappy} className="absolute right-3 top-3 z-[4] grid h-8 w-8 place-items-center rounded-full bg-[var(--color-bone)] text-[var(--color-pine)]">
              <Check size={16} strokeWidth={3} />
            </motion.span>
          )}
        </div>

        <div className="relative z-[3] flex flex-1 flex-col px-2 pb-1 pt-4">
          <h3 className="display text-[26px] leading-none">{d.name}</h3>
          <p className="mt-2 text-[14px] leading-[1.45] text-[var(--text-2)]">{d.summary}</p>
          <p className="mt-3 text-[13px] leading-[1.45]">
            <span className="label !text-[var(--sage)]">Efeito pretendido · </span>
            {d.effect}
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Meter label="Manutenção" value={d.maintenance} hint={HINTS.manutencao} />
            <Meter label="Esforço diário" value={d.effort} hint={HINTS.esforco} />
            <Meter label="Custo" value={d.cost} hint={HINTS.custo} />
          </div>
          {d.why && (
            <p className="mt-3 rounded-[16px] bg-[rgb(216_185_126/0.1)] px-3 py-2 text-[12.5px] leading-[1.45] text-[var(--brass)]">
              <span className="font-semibold">Por que recomendamos · </span>
              {d.why}
            </p>
          )}
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={onChoose}
              aria-pressed={chosen}
              className={cn('glass liquid flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[14px] font-semibold outline-none', chosen ? 'glass-ink' : 'glass-pill')}
            >
              <span className="relative z-[3] inline-flex items-center gap-2">
                {chosen ? (
                  <>
                    <Check size={16} strokeWidth={2.6} /> Direção escolhida
                  </>
                ) : (
                  'Escolher esta direção'
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** All directions side by side: mini head + aligned rows, so trade-offs read at a glance. */
function CompareTable({ chosen, onChoose }: { chosen: string; onChoose: (id: string) => void }) {
  const rows: { label: string; get: (d: Direction) => string }[] = [
    { label: 'Manutenção', get: (d) => HINTS.manutencao[d.maintenance - 1] },
    { label: 'Esforço diário', get: (d) => HINTS.esforco[d.effort - 1] },
    { label: 'Custo', get: (d) => HINTS.custo[d.cost - 1] },
  ]
  return (
    <div className="glass glass-frost liquid rounded-[28px] p-3">
      <div className="relative z-[3] grid gap-2" style={{ gridTemplateColumns: `repeat(${DIRECTIONS.length}, minmax(0, 1fr))` }}>
        {DIRECTIONS.map((d) => {
          const on = d.id === chosen
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onChoose(d.id)}
              aria-pressed={on}
              aria-label={`Escolher ${d.name}`}
              className={cn('glass flex cursor-pointer flex-col items-center rounded-[22px] p-2 text-center outline-none', on ? 'glass-sage' : 'glass-well')}
            >
              <span className="relative z-[3] block h-[120px] w-full overflow-hidden rounded-[16px] @3xl:h-[220px]">
                <FaceView subject="face" material="skin" style={d.style} framing="head" className="absolute inset-0" />
              </span>
              <span className="relative z-[3] mt-2 text-[12.5px] font-semibold leading-tight">{d.name}</span>
              {d.recommended && <span className="relative z-[3] mt-1 text-[10.5px] font-bold text-[var(--brass)]">Recomendada</span>}
            </button>
          )
        })}
      </div>
      <dl className="relative z-[3] mt-3 flex flex-col">
        {rows.map((r) => (
          <div key={r.label} className="border-t border-white/8 py-2.5">
            <dt className="label mb-1.5">{r.label}</dt>
            <dd className="grid gap-2" style={{ gridTemplateColumns: `repeat(${DIRECTIONS.length}, minmax(0, 1fr))` }}>
              {DIRECTIONS.map((d) => (
                <span key={d.id} className={cn('text-center text-[13px] font-semibold', d.id === chosen ? 'text-[var(--text)]' : 'text-[var(--text-2)]')}>
                  {r.get(d)}
                </span>
              ))}
            </dd>
          </div>
        ))}
        <div className="border-t border-white/8 py-2.5">
          <dt className="label mb-1.5">Efeito</dt>
          <dd className="grid gap-2" style={{ gridTemplateColumns: `repeat(${DIRECTIONS.length}, minmax(0, 1fr))` }}>
            {DIRECTIONS.map((d) => (
              <span key={d.id} className="text-center text-[11.5px] leading-[1.35] text-[var(--text-2)]">
                {d.effect}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  )
}
