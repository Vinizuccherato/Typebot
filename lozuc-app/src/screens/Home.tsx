import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Camera, CalendarDays, MessageSquareText, PartyPopper, Plus, Scissors, Sparkles } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { DIRECTIONS, PRIORITIES, ROUTINE, useLozuc } from '../store'
import { Glass } from '../ui/Glass'
import { FaceView } from '../three/FaceView'
import { useTilt } from '../lib/useTilt'
import { springs } from '../lib/utils'
import { ScrollScreen, SectionLabel, Sheet, IconDisc } from './c/kit'
import { LiquidCheck } from './Routine'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function Ring({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={6} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sage)" strokeWidth={6} strokeLinecap="round" initial={false} animate={{ pathLength: value }} transition={springs.soft} />
    </svg>
  )
}

/** "Hoje" — the place to come back to: next action, today's routine, what's growing, what's next. */
export function HomeScreen() {
  const { go } = useScreen()
  const name = useLozuc((s) => s.profile.name)
  const chosen = useLozuc((s) => s.chosenDirection)
  const done = useLozuc((s) => s.routineDone)
  const toggle = useLozuc((s) => s.toggleRoutineDone)
  const send = useLozuc((s) => s.send)
  const [sheet, setSheet] = useState(false)
  const tilt = useTilt<HTMLDivElement>(4)
  const direction = DIRECTIONS.find((d) => d.id === chosen) ?? DIRECTIONS[0]
  const next = PRIORITIES.find((p) => p.bucket === 'agora')!
  const morning = ROUTINE.filter((r) => r.when === 'manha')
  const doneCount = morning.filter((r) => done[r.id]).length

  const ask = (text: string) => {
    send(text)
    go('personal')
  }

  return (
    <ScreenFrame tabs>
      <ScrollScreen
        title={`${greeting()}, ${name}`}
        eyebrow={<span className="label">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
        trailing={
          <button type="button" onClick={() => setSheet(true)} aria-label="Novo registro" className="glass glass-ink liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
            <Plus size={20} className="relative z-[3]" />
          </button>
        }
      >
        <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] @3xl:gap-6 @3xl:px-10">
          {/* hero: next action with the chosen look in 3D */}
          <section aria-label="Próxima ação" className="px-5 @3xl:px-0">
            <div ref={tilt.ref} onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="tilt">
              <Glass variant="frost" specular radius={32} className="liquid relative h-[330px] overflow-hidden @3xl:h-[440px]">
                <FaceView subject="face" material="skin" style={direction.style} framing="head" autoRotate className="absolute inset-y-0 right-[-14%] w-[78%]" />
                <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-[#0a0f0d]/85 via-[#0a0f0d]/35 to-transparent" />
                <div className="relative z-[3] flex h-full max-w-[62%] flex-col justify-between p-5">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bone)] px-2.5 py-1 text-[11px] font-bold text-[var(--color-pine)]">
                      <Sparkles size={12} /> Próxima ação
                    </span>
                    <h2 className="display mt-3 text-[26px] font-semibold leading-[1.08] @3xl:text-[32px]">{next.action}</h2>
                    <p className="mt-2 text-[13.5px] leading-[1.45] text-[var(--text-2)]">Para {next.purpose.toLowerCase()}. {next.review}.</p>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <button type="button" onClick={() => go('guide')} className="glass glass-ink liquid inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-5 text-[14.5px] font-semibold outline-none">
                      <Scissors size={16} className="relative z-[3]" />
                      <span className="relative z-[3]">Abrir guia do barbeiro</span>
                    </button>
                    <span className="text-[12px] text-[var(--text-3)]">{direction.name}</span>
                  </div>
                </div>
              </Glass>
            </div>
          </section>

          <div className="mt-5 flex flex-col gap-5 @3xl:mt-0">
            {/* today's routine */}
            <section aria-label="Rotina de hoje" className="px-5 @3xl:px-0">
              <Glass variant="frost" radius={26} className="p-4">
                <div className="relative z-[3] flex items-center gap-4">
                  <div className="relative grid place-items-center">
                    <Ring value={doneCount / morning.length} />
                    <span className="tabular absolute text-[14px] font-bold">
                      {doneCount}/{morning.length}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="label">Rotina da manhã</p>
                    <p className="text-[15px] font-semibold">{doneCount === morning.length ? 'Tudo feito. Boa.' : 'Faltam ' + (morning.length - doneCount) + ' passos · 3 min'}</p>
                  </div>
                  <button type="button" onClick={() => go('routine')} aria-label="Abrir rotina" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/8 outline-none hover:bg-white/12">
                    <ArrowRight size={17} />
                  </button>
                </div>
                <ul className="relative z-[3] mt-2">
                  {morning.map((r) => (
                    <li key={r.id} className="flex items-center gap-1 border-t border-white/6 py-0.5 first:border-t-0">
                      <LiquidCheck done={!!done[r.id]} onToggle={() => toggle(r.id)} label={`${r.category} feito hoje`} size={26} />
                      <span className={done[r.id] ? 'text-[14px] text-[var(--text-3)] line-through decoration-white/30' : 'text-[14px]'}>{r.category}</span>
                    </li>
                  ))}
                </ul>
              </Glass>
            </section>

            {/* growth + upcoming review */}
            <section aria-label="Em andamento" className="grid grid-cols-2 gap-3 px-5 @3xl:px-0">
              <Glass variant="frost" radius={24} className="p-4">
                <p className="label relative z-[3]">Barba crescendo</p>
                <p className="display relative z-[3] mt-1 text-[28px] font-semibold leading-none">
                  ~4<span className="text-[15px] text-[var(--text-3)]"> / 6 mm</span>
                </p>
                <div className="relative z-[3] mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--sage)] to-[var(--brass)]" initial={{ width: 0 }} animate={{ width: '66%' }} transition={springs.glide} />
                </div>
                <p className="relative z-[3] mt-2 text-[11.5px] leading-[1.4] text-[var(--text-3)]">Desenho liberado a ~6 mm. Estimativa pelo seu relato.</p>
              </Glass>
              <Glass variant="frost" radius={24} className="p-4">
                <p className="label relative z-[3]">Próxima revisão</p>
                <p className="display relative z-[3] mt-1 text-[28px] font-semibold leading-none">em 5 dias</p>
                <p className="relative z-[3] mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-2)]">
                  <CalendarDays size={13} /> Foto comparável do corte
                </p>
              </Glass>
            </section>

            {/* personal prompt row */}
            <section aria-label="Falar com o personal">
              <SectionLabel action={<button type="button" onClick={() => go('personal')} className="h-11 cursor-pointer text-[12.5px] font-semibold text-[var(--sage)] outline-none">Abrir conversa</button>}>Pergunte ao personal</SectionLabel>
              <div className="flex gap-2 overflow-x-auto px-5 pb-1 @3xl:flex-wrap @3xl:px-0" style={{ scrollbarWidth: 'none' }}>
                {['Cortei ontem', 'Tenho um evento sábado', 'A barba está crescendo'].map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="glass glass-pill liquid h-11 shrink-0 cursor-pointer rounded-full px-4 text-[13.5px] font-medium outline-none">
                    <span className="relative z-[3]">{q}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </ScrollScreen>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Novo registro">
        <p className="mb-3 text-[13px] text-[var(--text-3)]">Registros alimentam a memória do plano e a próxima orientação.</p>
        <ul className="flex flex-col gap-2">
          {[
            { icon: Camera, title: 'Foto comparável', hint: 'Mesma luz e distância da primeira leitura', onClick: () => go('capture') },
            { icon: MessageSquareText, title: 'Relato', hint: 'O que você fez, gostou ou estranhou', onClick: () => go('personal') },
            { icon: PartyPopper, title: 'Tenho um evento', hint: 'Organizamos o que fazer e quando', onClick: () => ask('Tenho um evento sábado') },
          ].map((o) => (
            <li key={o.title}>
              <button
                type="button"
                onClick={() => {
                  setSheet(false)
                  o.onClick()
                }}
                className="glass glass-frost flex w-full cursor-pointer items-center gap-3 rounded-[22px] p-3 text-left outline-none"
              >
                <IconDisc icon={o.icon} tone="sage" />
                <span className="relative z-[3] min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{o.title}</span>
                  <span className="block text-[12.5px] text-[var(--text-3)]">{o.hint}</span>
                </span>
                <ArrowRight size={16} className="relative z-[3] text-[var(--text-3)]" />
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </ScreenFrame>
  )
}
