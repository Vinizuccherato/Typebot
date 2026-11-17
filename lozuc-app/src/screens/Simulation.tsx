import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ChevronsLeftRight, ShieldCheck } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { CURRENT_STYLE, DIRECTIONS, useLozuc, type StyleSpec } from '../store'
import { usePointerDrag } from '../lib/usePointerDrag'
import { clamp, cn, springs } from '../lib/utils'
import { AiLabel, PinnedCTA, Segmented, TopBar, useSafe } from './b/kit'

type Part = 'cabelo' | 'barba' | 'sobrancelha'
type Pose = 'front' | 'threeQuarter' | 'profile'

/** The style to simulate: the whole direction, or one part of it over what the client has today. */
export function simulatedStyle(direction: StyleSpec, mode: 'combinada' | 'isolada', part: Part): StyleSpec {
  if (mode === 'combinada') return direction
  if (part === 'cabelo') return { ...CURRENT_STYLE, hair: direction.hair, hairTone: direction.hairTone }
  if (part === 'barba') return { ...CURRENT_STYLE, beard: direction.beard, beardTone: direction.beardTone }
  return { ...CURRENT_STYLE, brows: direction.brows }
}

const HAIR: Record<StyleSpec['hair'], string> = {
  current: 'Atual, volume nas laterais',
  buzz: 'Máquina uniforme',
  'textured-crop': 'Laterais baixas, topo texturizado',
  'side-part': 'Risca lateral',
  'slick-back': 'Penteado para trás',
  'medium-flow': 'Topo médio com movimento',
}
const BEARD: Record<StyleSpec['beard'], string> = { clean: 'Sem barba', stubble: 'Por fazer', 'short-boxed': 'Curta desenhada', full: 'Cheia aparada', goatee: 'Cavanhaque' }
const BROWS: Record<StyleSpec['brows'], string> = { natural: 'Natural', 'clean-up': 'Limpeza leve', defined: 'Definidas' }

/** LZ-03 — Simulações no próprio rosto: Original × Simulação with a wipe divider, same pose on both. */
export function SimulationScreen() {
  const { go } = useScreen()
  const { top } = useSafe()
  const sim = useLozuc((s) => s.simulation)
  const setSim = useLozuc((s) => s.setSimulation)
  const chosen = useLozuc((s) => s.chosenDirection)
  const choose = useLozuc((s) => s.chooseDirection)
  const direction = DIRECTIONS.find((d) => d.id === chosen) ?? DIRECTIONS[0]
  const style = simulatedStyle(direction.style, sim.mode, sim.part)

  const changes = [
    { area: 'Cabelo', from: HAIR[CURRENT_STYLE.hair], to: HAIR[style.hair] },
    { area: 'Barba', from: BEARD[CURRENT_STYLE.beard], to: BEARD[style.beard] },
    { area: 'Sobrancelha', from: BROWS[CURRENT_STYLE.brows], to: BROWS[style.brows] },
  ]

  return (
    <ScreenFrame>
      <div className="h-full overflow-y-auto @3xl:overflow-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="@3xl:grid @3xl:h-full @3xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="px-5 @3xl:flex @3xl:h-full @3xl:flex-col @3xl:p-6" style={{ paddingTop: top }}>
            <TopBar title="Simulação" tag="LZ-03" onBack={() => go('directions')} />
            <CompareStage style={style} split={sim.split} onSplit={(v) => setSim({ split: v })} />
          </div>

          <div className="@3xl:h-full @3xl:overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex flex-col gap-4 px-5 pb-[150px] pt-4 @3xl:px-6 @3xl:pt-[84px]">
              <header>
                <AiLabel text="Imagem simulada por IA" />
                <h2 className="display mt-2 text-[30px] leading-[1.04]">{direction.name}, no seu rosto</h2>
              </header>

              <section aria-label="Direção" className="-mx-5 flex gap-2 overflow-x-auto px-5 @3xl:-mx-6 @3xl:px-6" style={{ scrollbarWidth: 'none' }}>
                {DIRECTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={d.id === chosen}
                    onClick={() => choose(d.id)}
                    className={cn('glass liquid relative h-11 shrink-0 cursor-pointer rounded-full px-4 text-[13.5px] font-semibold outline-none', d.id === chosen ? 'glass-ink' : 'glass-pill text-[var(--text-2)]')}
                  >
                    <span className="relative z-[3]">
                      {d.name}
                      {d.recommended && <span className="ml-1.5 text-[11px] text-[var(--brass)]">★</span>}
                    </span>
                  </button>
                ))}
              </section>

              <section aria-label="O que simular" className="glass glass-frost liquid flex flex-col gap-3 rounded-[28px] p-3">
                <div className="relative z-[3]">
                  <Segmented
                    id="sim-mode"
                    label="Tipo de simulação"
                    value={sim.mode}
                    onChange={(mode) => setSim({ mode })}
                    options={[
                      { id: 'combinada', label: 'Combinada' },
                      { id: 'isolada', label: 'Isolada' },
                    ]}
                  />
                </div>
                <motion.div className="relative z-[3] overflow-hidden" initial={false} animate={{ height: sim.mode === 'isolada' ? 'auto' : 0, opacity: sim.mode === 'isolada' ? 1 : 0 }} transition={springs.soft}>
                  <Segmented
                    id="sim-part"
                    size="sm"
                    label="Parte isolada"
                    value={sim.part}
                    onChange={(part) => setSim({ part })}
                    options={[
                      { id: 'cabelo', label: 'Cabelo' },
                      { id: 'barba', label: 'Barba' },
                      { id: 'sobrancelha', label: 'Sobrancelha' },
                    ]}
                  />
                </motion.div>
                <p className="relative z-[3] px-1 text-[12.5px] leading-[1.45] text-[var(--text-3)]">
                  {sim.mode === 'combinada' ? 'Mostra a direção inteira: cabelo, barba, sobrancelha e tom juntos.' : 'Muda só uma parte sobre o seu visual atual, para você entender o efeito de cada escolha.'}
                </p>
              </section>

              <section aria-labelledby="chg-title" className="glass glass-smoke rounded-[28px] p-4">
                <h3 id="chg-title" className="label relative z-[3]">
                  O que muda
                </h3>
                <ul className="relative z-[3] mt-2 flex flex-col">
                  {changes.map((c) => {
                    const same = c.from === c.to
                    return (
                      <li key={c.area} className="flex items-center gap-3 border-b border-white/6 py-2.5 last:border-0">
                        <span className="w-[92px] shrink-0 text-[13px] text-[var(--text-2)]">{c.area}</span>
                        <span className={cn('flex-1 text-[13.5px] font-semibold', same && 'font-normal text-[var(--text-3)]')}>
                          {same ? 'Sem mudança' : (
                            <>
                              <span className="text-[var(--text-3)] line-through decoration-white/25">{c.from}</span>
                              <span className="mx-1.5 text-[var(--sage)]">→</span>
                              {c.to}
                            </>
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <div className="glass glass-well flex gap-3 rounded-[20px] p-3">
                <ShieldCheck size={18} className="relative z-[3] mt-0.5 shrink-0 text-[var(--sage)]" aria-hidden />
                <p className="relative z-[3] text-[12.5px] leading-[1.45] text-[var(--text-2)]">
                  <span className="font-semibold text-[var(--text)]">Preservamos sua identidade:</span> só cabelo, barba, sobrancelhas e tons mudam. A simulação mostra o que dá para executar — não afina nariz, não muda mandíbula nem dentes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PinnedCTA className="@3xl:left-[54%]">
        <Button onClick={() => go('guide')} icon={<ArrowRight size={18} />}>
          Ver guia de execução
        </Button>
      </PinnedCTA>
    </ScreenFrame>
  )
}

/** Two stacked views of the same head in the same pose; the top one is wiped by a draggable divider. */
function CompareStage({ style, split, onSplit }: { style: StyleSpec; split: number; onSplit: (v: number) => void }) {
  // one pose state drives both views, so Original and Simulação always match
  const [p, setPose] = useState<Pose>('front')
  const drag = usePointerDrag<HTMLDivElement>((d) => onSplit(clamp(d.x, 0.04, 0.96)))
  const pct = `${(split * 100).toFixed(2)}%`

  return (
    <div className="mt-4 @3xl:flex @3xl:flex-1 @3xl:flex-col">
      <div
        ref={drag.ref}
        onPointerDown={drag.onPointerDown}
        className="glass glass-frost relative h-[400px] cursor-ew-resize touch-none overflow-hidden rounded-[32px] @3xl:h-auto @3xl:flex-1"
      >
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgb(169 199 182 / 0.18), transparent 70%)' }} />
        {/* Original (full) */}
        <FaceView subject="face" material="skin" style={CURRENT_STYLE} pose={p} framing="head" className="absolute inset-0 z-[2]" />
        {/* Simulação (revealed right of the divider) */}
        <div className="absolute inset-0 z-[3]" style={{ clipPath: `inset(0 0 0 ${pct})` }}>
          <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 55% at 50% 42%, rgb(216 185 126 / 0.14), transparent 70%)' }} />
          <FaceView subject="face" material="skin" style={style} pose={p} framing="head" className="absolute inset-0" />
        </div>

        {/* labels (required) */}
        <span className="glass glass-smoke liquid absolute left-3 top-3 z-[5] inline-flex h-8 items-center rounded-full px-3 text-[12px] font-semibold">
          <span className="relative z-[3]">Original</span>
        </span>
        <span className="absolute right-3 top-3 z-[5] inline-flex h-8 items-center rounded-full px-3 text-[12px] font-bold text-[var(--color-pine)]" style={{ background: 'linear-gradient(145deg, #f2e0b6, var(--brass))' }}>
          Simulação
        </span>

        {/* divider */}
        <div aria-hidden className="absolute inset-y-0 z-[5] w-px bg-white/85 shadow-[0_0_12px_rgb(255_255_255/0.6)]" style={{ left: pct }} />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparar original e simulação"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(split * 100)}
          aria-valuetext={`${Math.round(split * 100)}% original`}
          onKeyDown={(e) => {
            const d = e.key === 'ArrowRight' ? 0.05 : e.key === 'ArrowLeft' ? -0.05 : 0
            if (!d) return
            e.preventDefault()
            onSplit(clamp(split + d, 0.04, 0.96))
          }}
          className="glass glass-pill liquid absolute top-1/2 z-[6] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none"
          style={{ left: pct }}
        >
          <ChevronsLeftRight size={20} className="relative z-[3]" />
        </div>

      </div>
      {/* same pose on both sides */}
      <div className="mt-3">
        <Segmented
          id="sim-pose"
          size="sm"
          label="Ângulo"
          value={p}
          onChange={setPose}
          options={[
            { id: 'front', label: 'Frente' },
            { id: 'threeQuarter', label: '¾' },
            { id: 'profile', label: 'Perfil' },
          ]}
        />
      </div>
    </div>
  )
}
