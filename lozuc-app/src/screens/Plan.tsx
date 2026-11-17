import { motion } from 'motion/react'
import { ArrowRight, Hourglass, RefreshCcw, Scissors, Sparkles, UserRound, Users, Zap, type LucideIcon } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { DIRECTIONS, PRIORITIES, useLozuc, type Priority } from '../store'
import { Glass } from '../ui/Glass'
import { FaceView } from '../three/FaceView'
import { useTilt } from '../lib/useTilt'
import { cn, springs } from '../lib/utils'
import { ScrollScreen, SectionLabel } from './c/kit'

const BUCKETS: { id: Priority['bucket']; title: string; hint: string; icon: LucideIcon; tone: string }[] = [
  { id: 'agora', title: 'Agora', hint: 'Primeiros passos, já executáveis', icon: Zap, tone: 'var(--sage)' },
  { id: 'depende', title: 'Depende de crescimento ou adaptação', hint: 'Libera quando a condição for atingida', icon: Hourglass, tone: 'var(--brass)' },
  { id: 'reavaliar', title: 'Reavaliar', hint: 'Faltou informação para concluir', icon: RefreshCcw, tone: 'var(--clay)' },
]

const WHO_ICON: Record<Priority['who'], LucideIcon> = { Você: UserRound, Barbeiro: Scissors, 'Você + barbeiro': Users }

/** Milestones on a perspective track (review points, not biological promises). */
const MILESTONES = [
  { when: 'Hoje', what: 'Corte + rotina da manhã' },
  { when: '+7 dias', what: 'Foto comparável do corte' },
  { when: '+14 dias', what: 'Adesão da rotina' },
  { when: '~6 mm', what: 'Desenho da barba' },
  { when: '+30 dias', what: 'Revisão combinada' },
]

function PriorityCard({ p, lead, onOpen }: { p: Priority; lead: boolean; onOpen?: () => void }) {
  const tilt = useTilt<HTMLDivElement>(5)
  const Who = WHO_ICON[p.who]
  return (
    <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="tilt">
      <Glass variant={lead ? 'sage' : 'frost'} specular radius={24} className={cn('p-4', lead && 'liquid')}>
        {lead && (
          <span className="relative z-[3] mb-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bone)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-pine)]">
            <Sparkles size={12} /> Primeira ação
          </span>
        )}
        <h3 className="relative z-[3] text-[16px] font-semibold leading-[1.3]">{p.action}</h3>
        <p className="relative z-[3] mt-1 text-[13px] text-[var(--text-2)]">Para: {p.purpose}</p>
        <div className="relative z-[3] mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--text-3)]">
          <span className="inline-flex items-center gap-1.5">
            <Who size={13} /> {p.who}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCcw size={13} /> {p.review}
          </span>
        </div>
        {onOpen && (
          <button type="button" onClick={onOpen} className="relative z-[3] mt-3 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full text-[13.5px] font-semibold text-[var(--text)] outline-none hover:text-[var(--sage)]">
            Ver como fazer <ArrowRight size={15} />
          </button>
        )}
      </Glass>
    </div>
  )
}

/** LZ-06 — plano de prioridades: o que fazer agora, o que depende de crescimento e o que reavaliar. */
export function PlanScreen() {
  const { go } = useScreen()
  const chosen = useLozuc((s) => s.chosenDirection)
  const direction = DIRECTIONS.find((d) => d.id === chosen) ?? DIRECTIONS[0]
  const firstId = PRIORITIES.find((p) => p.bucket === 'agora')?.id

  const open = (p: Priority) => (/rotina/i.test(p.action) ? go('routine') : go('guide'))

  return (
    <ScreenFrame tabs>
      <ScrollScreen title="Prioridades" eyebrow={<span className="label text-[var(--sage)]">LZ-06 · plano v2 · {direction.name}</span>}>
        {/* quick links into the plan's three deliverables */}
        <div className="flex gap-2 overflow-x-auto px-5 pb-1 @3xl:px-10" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Guia de execução', to: 'guide' as const },
            { label: 'Rotina de pele', to: 'routine' as const },
          ].map((l) => (
            <button key={l.to} type="button" onClick={() => go(l.to)} className="glass glass-pill liquid inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold outline-none">
              <span className="relative z-[3]">{l.label}</span>
              <ArrowRight size={14} className="relative z-[3]" />
            </button>
          ))}
        </div>

        {/* perspective milestone track */}
        <section className="mt-5" aria-label="Marcos de revisão">
          <SectionLabel>Marcos de revisão</SectionLabel>
          <div className="relative mx-5 h-[150px] overflow-hidden @3xl:mx-10" style={{ perspective: 700 }}>
            <div className="absolute inset-x-0 bottom-0 h-[260px] origin-bottom" style={{ transform: 'rotateX(52deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 rounded-[28px] border border-white/10" style={{ background: 'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.05) 0 1px, transparent 1px 20%), linear-gradient(180deg, rgb(169 199 182 / 0.14), rgb(169 199 182 / 0.02))' }} />
            </div>
            <ol className="absolute inset-x-0 bottom-3 flex justify-between px-2">
              {MILESTONES.map((m, i) => (
                <motion.li key={m.when} className="flex w-[19%] flex-col items-center text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.1 + i * 0.07 }}>
                  <span className={cn('glass liquid mb-2 grid h-9 w-9 place-items-center rounded-full', i === 0 ? 'glass-ink' : 'glass-pill')}>
                    <span className="relative z-[3] text-[11px] font-bold">{i + 1}</span>
                  </span>
                  <span className="text-[11.5px] font-semibold leading-tight">{m.when}</span>
                  <span className="mt-0.5 text-[10.5px] leading-tight text-[var(--text-3)]">{m.what}</span>
                </motion.li>
              ))}
            </ol>
          </div>
          <p className="mt-2 px-5 text-[11.5px] text-[var(--text-3)] @3xl:px-10">Datas são marcos de execução e revisão, não promessa de resultado em prazo fixo.</p>
        </section>

        <div className="mt-5 @3xl:grid @3xl:grid-cols-3 @3xl:gap-5 @3xl:px-10">
          {BUCKETS.map((b) => {
            const list = PRIORITIES.filter((p) => p.bucket === b.id)
            return (
              <section key={b.id} aria-label={b.title} className="mb-6">
                <div className="mb-3 flex items-start gap-3 px-5 @3xl:px-0">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: b.tone, color: 'var(--color-pine)' }}>
                    <b.icon size={15} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h2 className="text-[15.5px] font-semibold leading-tight">{b.title}</h2>
                    <p className="text-[12px] text-[var(--text-3)]">{b.hint}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-5 @3xl:px-0">
                  {list.map((p) => (
                    <PriorityCard key={p.id} p={p} lead={p.id === firstId} onOpen={b.id === 'agora' ? () => open(p) : undefined} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* the look this plan executes */}
        <section className="mb-4 px-5 @3xl:px-10" aria-label="Direção do plano">
          <Glass variant="frost" radius={26} className="flex items-center gap-4 p-3">
            <div className="glass glass-well relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[20px]">
              <FaceView subject="face" material="skin" style={direction.style} framing="face" className="absolute inset-0" />
            </div>
            <div className="relative z-[3] min-w-0 flex-1">
              <p className="label">Direção escolhida</p>
              <p className="text-[15px] font-semibold">{direction.name}</p>
              <p className="truncate text-[12.5px] text-[var(--text-3)]">{direction.summary}</p>
            </div>
            <button type="button" onClick={() => go('directions')} className="relative z-[3] h-11 shrink-0 cursor-pointer rounded-full px-3 text-[13px] font-semibold text-[var(--sage)] outline-none hover:text-[var(--text)]">
              Trocar
            </button>
          </Glass>
        </section>
      </ScrollScreen>
    </ScreenFrame>
  )
}
