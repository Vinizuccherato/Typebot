import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Maximize2, Scissors, Share2, Sparkles, UserRound, X } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView, type FaceViewProps } from '../three/FaceView'
import { DIRECTIONS, GUIDE, useLozuc, type GuideItem } from '../store'
import { Glass } from '../ui/Glass'
import { useTilt } from '../lib/useTilt'
import { springs } from '../lib/utils'
import { ScrollScreen, Segmented, SectionLabel, SourceChip } from './c/kit'

const FRAMING: Record<GuideItem['area'], FaceViewProps['framing']> = {
  Cabelo: 'hair',
  Barba: 'beard',
  Sobrancelha: 'brows',
  Cor: 'face',
  Manutenção: 'head',
}

function AreaCard({ item, view, style, index }: { item: GuideItem; view: 'voce' | 'barbeiro'; style: FaceViewProps['style']; index: number }) {
  const tilt = useTilt<HTMLDivElement>(5)
  const text = view === 'voce' ? item.forYou : item.forPro
  return (
    <motion.div
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="tilt"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.soft, delay: index * 0.05 }}
    >
      <Glass variant="frost" specular radius={26} className="flex gap-4 p-3.5">
        <div className="glass glass-well relative h-[104px] w-[92px] shrink-0 overflow-hidden rounded-[20px]">
          {item.area !== 'Manutenção' ? (
            <FaceView subject="face" material="skin" style={style} framing={FRAMING[item.area]} className="absolute inset-0" />
          ) : (
            <div className="relative z-[3] grid h-full place-items-center text-[var(--sage)]">
              <CalendarClock size={30} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="relative z-[3] flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold">{item.area}</h3>
              <SourceChip source={item.supportedBy} prefix="por " />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={view}
                className={view === 'barbeiro' ? 'mt-1.5 text-[13.5px] leading-[1.45] text-[var(--text)]' : 'mt-1.5 text-[14px] leading-[1.45] text-[var(--text-2)]'}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </Glass>
    </motion.div>
  )
}

/** LZ-04 — guia de execução: for the client and, in professional language, for the barber. */
export function GuideScreen() {
  const { go } = useScreen()
  const view = useLozuc((s) => s.guideView)
  const setView = useLozuc((s) => s.setGuideView)
  const chosen = useLozuc((s) => s.chosenDirection)
  const toast = useLozuc((s) => s.toast)
  const [present, setPresent] = useState(false)
  const direction = DIRECTIONS.find((d) => d.id === chosen) ?? DIRECTIONS[0]
  const items = GUIDE[direction.id] ?? GUIDE.executivo

  const share = () => toast({ title: 'Link do guia copiado', detail: 'O barbeiro vê o guia sem precisar de conta' })

  return (
    <ScreenFrame tabs>
      <ScrollScreen
        title="Guia de execução"
        eyebrow={<span className="label text-[var(--sage)]">LZ-04 · {direction.name}</span>}
        back={{ label: 'Voltar para prioridades', onClick: () => go('plan') }}
        trailing={
          <button type="button" onClick={share} aria-label="Compartilhar guia" className="glass glass-pill liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
            <Share2 size={18} className="relative z-[3]" />
          </button>
        }
      >
        <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] @3xl:gap-8 @3xl:px-10">
          {/* hero: the chosen look, rotating */}
          <div className="px-5 @3xl:px-0">
            <Glass variant="frost" radius={30} className="relative h-[280px] overflow-hidden @3xl:sticky @3xl:top-4 @3xl:h-[520px]">
              <FaceView subject="face" material="skin" style={direction.style} framing="head" autoRotate interactive className="absolute inset-0" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 z-[3] flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] text-[var(--text-3)]">Referência 3D da direção</p>
                  <p className="text-[15px] font-semibold">{direction.summary}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPresent(true)}
                  className="glass glass-ink liquid flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold outline-none"
                >
                  <Maximize2 size={15} className="relative z-[3]" />
                  <span className="relative z-[3]">Mostrar ao barbeiro</span>
                </button>
              </div>
            </Glass>
          </div>

          <div>
            <div className="mt-5 px-5 @3xl:mt-0 @3xl:px-0">
              <Segmented
                label="Versão do guia"
                value={view}
                onChange={setView}
                options={[
                  { id: 'voce', label: 'Para você', icon: UserRound },
                  { id: 'barbeiro', label: 'Para o barbeiro', icon: Scissors },
                ]}
              />
              <p className="mt-2.5 text-[12.5px] leading-[1.45] text-[var(--text-3)]">
                {view === 'voce' ? 'O que pedir e como manter, em linguagem simples.' : 'Termos técnicos para o profissional executar sem interpretar uma foto solta.'}
              </p>
            </div>

            <section className="mt-5" aria-label="Instruções por área">
              <SectionLabel>Por área</SectionLabel>
              <div className="flex flex-col gap-3 px-5 @3xl:px-0">
                {items.map((it, i) => (
                  <AreaCard key={it.area} item={it} view={view} style={direction.style} index={i} />
                ))}
              </div>
            </section>

            <section className="mt-6 px-5 @3xl:px-0" aria-label="Limites do guia">
              <Glass variant="well" radius={22} className="flex gap-3 p-4">
                <Sparkles size={18} className="relative z-[3] mt-0.5 shrink-0 text-[var(--brass)]" />
                <p className="relative z-[3] text-[12.5px] leading-[1.5] text-[var(--text-3)]">
                  Faixas em milímetros aparecem só quando os dados da captura sustentam. Em coloração, o guia orienta a intenção visual — a viabilidade se avalia no salão.
                </p>
              </Glass>
            </section>
          </div>
        </div>
      </ScrollScreen>

      {/* full-screen presentation for the barber */}
      <AnimatePresence>
        {present && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Guia para o barbeiro"
            className="absolute inset-0 z-[80] flex flex-col overflow-hidden bg-[#070b09]"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={springs.soft}
            onKeyDown={(e) => e.key === 'Escape' && setPresent(false)}
          >
            <div className="relative h-[46%] min-h-[260px] shrink-0">
              <FaceView subject="face" material="skin" style={direction.style} framing="head" autoRotate className="absolute inset-0" />
              <button
                type="button"
                autoFocus
                onClick={() => setPresent(false)}
                aria-label="Fechar apresentação"
                className="glass glass-pill liquid absolute right-4 top-[62px] z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none @3xl:top-5"
              >
                <X size={18} className="relative z-[3]" />
              </button>
              <span className="glass glass-pill liquid absolute left-4 top-[62px] z-10 rounded-full px-3 py-1.5 text-[12px] font-semibold @3xl:top-5">
                <span className="relative z-[3]">lozuc · {direction.name}</span>
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-12 @3xl:px-16" style={{ scrollbarWidth: 'none' }}>
              {items
                .filter((it) => it.area !== 'Cor')
                .map((it) => (
                  <div key={it.area} className="border-b border-white/8 py-4">
                    <p className="label">{it.area}</p>
                    <p className="display mt-1 text-[22px] font-medium leading-[1.25] @3xl:text-[30px]">{it.forPro}</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenFrame>
  )
}
