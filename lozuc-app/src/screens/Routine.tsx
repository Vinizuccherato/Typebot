import { motion, AnimatePresence } from 'motion/react'
import { Info, Moon, Sun } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { ROUTINE, useLozuc, type Budget, type RoutineStep } from '../store'
import { Glass } from '../ui/Glass'
import { cn, springs } from '../lib/utils'
import { useTilt } from '../lib/useTilt'
import { ScrollScreen, Segmented, SectionLabel } from './c/kit'

const BUDGETS: { id: Budget; label: string }[] = [
  { id: 'enxuto', label: 'Enxuto' },
  { id: 'equilibrado', label: 'Equilibrado' },
  { id: 'investir', label: 'Investir' },
]

/** Last 14 days of adherence (illustrative: 12 of 14 — matches the history entry). */
const ADHERENCE = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0.5, 1, 1, 1, 1]

/** Liquid check — the drop fills, then the tick draws. */
export function LiquidCheck({ done, onToggle, label, size = 34 }: { done: boolean; onToggle: () => void; label: string; size?: number }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      whileTap={{ scale: 0.86 }}
      transition={springs.bouncy}
      className="relative grid shrink-0 cursor-pointer place-items-center rounded-full outline-none"
      style={{ width: Math.max(44, size), height: Math.max(44, size) }}
    >
      <span className="absolute grid place-items-center overflow-hidden rounded-full border border-white/20 bg-white/5" style={{ width: size, height: size }}>
        <motion.span
          className="absolute inset-x-0 bottom-0 bg-[var(--sage)]"
          initial={false}
          animate={{ height: done ? '100%' : '0%', borderRadius: done ? '0%' : '50% 50% 0 0' }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        />
        <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} className="relative">
          <motion.path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="var(--color-pine)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: 0.28, delay: done ? 0.12 : 0 }} />
        </svg>
      </span>
    </motion.button>
  )
}

function StepCard({ step, budget, done, onToggle, last }: { step: RoutineStep; budget: Budget; done: boolean; onToggle: () => void; last: boolean }) {
  const tilt = useTilt<HTMLDivElement>(4)
  return (
    <li className="relative flex gap-3">
      {/* rail */}
      <div className="relative flex w-11 shrink-0 flex-col items-center">
        <LiquidCheck done={done} onToggle={onToggle} label={`${step.category} feito hoje`} />
        {!last && <span aria-hidden className={cn('mt-1 w-px flex-1', done ? 'bg-[var(--sage)]/60' : 'bg-white/12')} />}
      </div>
      <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="tilt mb-3 min-w-0 flex-1">
        <Glass variant={done ? 'sage' : 'frost'} specular radius={24} className="p-4">
          <div className="relative z-[3] flex items-start justify-between gap-2">
            <div>
              <p className="label">Passo {step.order}</p>
              <h3 className="mt-0.5 text-[16px] font-semibold">{step.category}</h3>
            </div>
            {step.alreadyHave && <span className="rounded-full bg-[var(--brass)]/20 px-2.5 py-1 text-[11px] font-semibold text-[var(--brass)]">Já tenho</span>}
          </div>
          <p className="relative z-[3] mt-2 text-[13.5px] leading-[1.45] text-[var(--text)]">{step.purpose}</p>
          <p className="relative z-[3] mt-1 text-[12.5px] leading-[1.45] text-[var(--text-3)]">{step.how}</p>
          <div className="relative z-[3] mt-3 flex items-center gap-2 rounded-[14px] bg-black/20 px-3 py-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sage)]" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={budget} className="text-[12.5px] text-[var(--text-2)]" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }}>
                {step.alreadyHave ? 'Use o que você já tem — ' : 'Categoria: '}
                {step.options[budget]}
              </motion.span>
            </AnimatePresence>
          </div>
        </Glass>
      </div>
    </li>
  )
}

/** LZ-05 — rotina de skincare: manhã e noite, ordem, finalidade e opções por orçamento. */
export function RoutineScreen() {
  const { go } = useScreen()
  const when = useLozuc((s) => s.routineWhen)
  const setWhen = useLozuc((s) => s.setRoutineWhen)
  const budget = useLozuc((s) => s.budget)
  const setBudget = useLozuc((s) => s.setBudget)
  const done = useLozuc((s) => s.routineDone)
  const toggle = useLozuc((s) => s.toggleRoutineDone)
  const steps = ROUTINE.filter((r) => r.when === when).sort((a, b) => a.order - b.order)
  const doneCount = steps.filter((s) => done[s.id]).length

  return (
    <ScreenFrame tabs>
      <ScrollScreen title="Rotina de pele" eyebrow={<span className="label text-[var(--sage)]">LZ-05 · cuidado cosmético</span>} back={{ label: 'Voltar para prioridades', onClick: () => go('plan') }}>
        <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] @3xl:gap-8 @3xl:px-10">
          <div>
            <div className="flex flex-col gap-3 px-5 @3xl:px-0">
              <Segmented
                label="Período"
                value={when}
                onChange={setWhen}
                options={[
                  { id: 'manha', label: 'Manhã', icon: Sun },
                  { id: 'noite', label: 'Noite', icon: Moon },
                ]}
              />
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[var(--text-2)]">
                  <span className="tabular font-semibold text-[var(--text)]">
                    {doneCount}/{steps.length}
                  </span>{' '}
                  feitos hoje · 3 min
                </p>
                <div role="radiogroup" aria-label="Orçamento" className="flex gap-1">
                  {BUDGETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="radio"
                      aria-checked={budget === b.id}
                      onClick={() => setBudget(b.id)}
                      className={cn('h-8 cursor-pointer rounded-full px-2.5 text-[11.5px] font-semibold outline-none transition-colors', budget === b.id ? 'bg-[var(--color-bone)] text-[var(--color-pine)]' : 'bg-white/6 text-[var(--text-3)] hover:text-[var(--text)]')}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.ol key={when} className="mt-5 px-5 @3xl:px-0" aria-label={when === 'manha' ? 'Rotina da manhã' : 'Rotina da noite'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                {steps.map((s, i) => (
                  <StepCard key={s.id} step={s} budget={budget} done={!!done[s.id]} onToggle={() => toggle(s.id)} last={i === steps.length - 1} />
                ))}
              </motion.ol>
            </AnimatePresence>
          </div>

          <div className="@3xl:pt-0">
            <section className="mt-3 @3xl:mt-0" aria-label="Adesão nos últimos 14 dias">
              <SectionLabel>Últimos 14 dias</SectionLabel>
              <div className="px-5 @3xl:px-0">
                <Glass variant="frost" radius={24} className="p-4">
                  <div className="relative z-[3] flex items-baseline justify-between">
                    <p className="display text-[30px] font-semibold leading-none">
                      12<span className="text-[16px] text-[var(--text-3)]">/14</span>
                    </p>
                    <p className="text-[12px] text-[var(--text-3)]">dias com a rotina completa</p>
                  </div>
                  <div className="relative z-[3] mt-4 flex h-16 items-end gap-1.5" role="img" aria-label="12 de 14 dias completos">
                    {ADHERENCE.map((v, i) => (
                      <motion.span
                        key={i}
                        className={cn('flex-1 rounded-[6px]', v === 1 ? 'bg-[var(--sage)]' : v > 0 ? 'bg-[var(--brass)]' : 'bg-white/10')}
                        initial={{ height: 4 }}
                        animate={{ height: v === 0 ? 6 : `${v * 100}%` }}
                        transition={{ ...springs.soft, delay: i * 0.03 }}
                      />
                    ))}
                  </div>
                  <p className="relative z-[3] mt-3 text-[12.5px] leading-[1.45] text-[var(--text-2)]">Você relatou menos ardor ao barbear desde o dia 8. Mantemos a rotina como está.</p>
                </Glass>
              </div>
            </section>

            <section className="mt-5 px-5 @3xl:px-0" aria-label="Limite clínico">
              <Glass variant="well" radius={22} className="flex gap-3 p-4">
                <Info size={18} className="relative z-[3] mt-0.5 shrink-0 text-[var(--clay)]" />
                <p className="relative z-[3] text-[12.5px] leading-[1.5] text-[var(--text-2)]">
                  Rotina de cuidado cosmético — dúvidas clínicas pedem avaliação profissional. Se surgir irritação, simplificamos: nada de adicionar ativos para compensar.
                </p>
              </Glass>
            </section>
          </div>
        </div>
      </ScrollScreen>
    </ScreenFrame>
  )
}
