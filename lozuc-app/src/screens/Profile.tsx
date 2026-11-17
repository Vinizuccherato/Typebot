import { AnimatePresence, motion } from 'motion/react'
import { Briefcase, CalendarHeart, Info, RefreshCw, Shuffle } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { PRODUCT_OPTIONS, TONES, useLozuc, type BeardId, type HairId, type Profile, type StyleSpec } from '../store'
import { useScreen } from '../shell/screenContext'
import { cn, springs } from '../lib/utils'
import { OptionRow, PinnedCTA, Segmented, StepBar, TopBar, Why, useIsWeb, useReducedMotion } from './a/kit'

const STEP_TITLES = ['Qual é o seu objetivo?', 'Como é a sua rotina?', 'Como você está hoje?', 'Como a sua pele se comporta?']

const GOALS: { value: NonNullable<Profile['goal']>; title: string; hint: string; icon: typeof Briefcase }[] = [
  { value: 'profissional', title: 'Imagem profissional', hint: 'Reuniões, entrevistas, escritório', icon: Briefcase },
  { value: 'versatil', title: 'Versátil no dia a dia', hint: 'Funciona do trabalho ao fim de semana', icon: Shuffle },
  { value: 'evento', title: 'Um evento chegando', hint: 'Casamento, formatura, apresentação', icon: CalendarHeart },
  { value: 'renovar', title: 'Quero renovar o visual', hint: 'Abrir espaço para algo diferente', icon: RefreshCw },
]

const HAIR_OF: Record<NonNullable<Profile['hairNow']>, HairId> = { curto: 'buzz', medio: 'current', longo: 'medium-flow' }
const BEARD_OF: Record<NonNullable<Profile['beardNow']>, BeardId> = { sem: 'clean', 'por-fazer': 'stubble', curta: 'short-boxed', cheia: 'full' }

/** The 3D preview mirrors what the man DECLARES today (never inferred from the face). */
const declaredStyle = (p: Profile): StyleSpec => ({
  hair: p.hairNow ? HAIR_OF[p.hairNow] : 'current',
  hairTone: TONES.natural,
  beard: p.beardNow ? BEARD_OF[p.beardNow] : 'stubble',
  beardTone: TONES.natural,
  brows: 'natural',
})

const TRI = [
  { value: '0', label: 'Nada' },
  { value: '1', label: 'Às vezes' },
  { value: '2', label: 'Frequente' },
] as const

const SKIN: { key: keyof Profile['skin']; label: string; why: string }[] = [
  { key: 'oleosidade', label: 'Oleosidade', why: 'Brilho na testa e no nariz ao longo do dia' },
  { key: 'ressecamento', label: 'Ressecamento', why: 'Repuxa ou descama, principalmente após o banho' },
  { key: 'sensibilidade', label: 'Sensibilidade', why: 'Arde, coça ou fica vermelha ao barbear' },
]

function StepGoal() {
  const goal = useLozuc((s) => s.profile.goal)
  const setProfile = useLozuc((s) => s.setProfile)
  return (
    <div role="radiogroup" aria-label="Objetivo" className="flex flex-col gap-2.5">
      {GOALS.map((g) => (
        <OptionRow key={g.value} selected={goal === g.value} onSelect={() => setProfile({ goal: g.value })} icon={<g.icon size={19} strokeWidth={1.8} />} title={g.title} hint={g.hint} />
      ))}
    </div>
  )
}

function StepRoutine() {
  const p = useLozuc((s) => s.profile)
  const setProfile = useLozuc((s) => s.setProfile)
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-[15px] font-semibold">Tempo para se arrumar por dia</h3>
        <Why>Usamos isso para sugerir cortes e rotinas que cabem no seu dia.</Why>
        <div className="mt-3">
          <Segmented
            id="pf-time"
            label="Tempo para se arrumar por dia"
            value={p.groomingTime}
            onChange={(v) => setProfile({ groomingTime: v })}
            options={[
              { value: '5', label: '5 min', hint: 'o mínimo' },
              { value: '10', label: '10 min', hint: 'com calma' },
              { value: '20', label: '20+ min', hint: 'gosto de cuidar' },
            ]}
          />
        </div>
      </section>
      <section>
        <h3 className="text-[15px] font-semibold">Orçamento para produtos e barbeiro</h3>
        <Why>Mostramos opções dentro desse limite. Nenhuma marca paga para aparecer.</Why>
        <div className="mt-3">
          <Segmented
            id="pf-budget"
            label="Orçamento"
            value={p.budget}
            onChange={(v) => setProfile({ budget: v })}
            options={[
              { value: 'enxuto', label: 'Enxuto', hint: 'o essencial' },
              { value: 'equilibrado', label: 'Equilibrado', hint: 'custo-benefício' },
              { value: 'investir', label: 'Investir', hint: 'o melhor' },
            ]}
          />
        </div>
      </section>
    </div>
  )
}

function StepToday({ showPreview }: { showPreview: boolean }) {
  const p = useLozuc((s) => s.profile)
  const setProfile = useLozuc((s) => s.setProfile)
  return (
    <div className="flex flex-col gap-5">
      {showPreview && (
        <div className="glass glass-frost relative h-[176px] overflow-hidden rounded-[26px]">
          <FaceView subject="face" material="skin" style={declaredStyle(p)} framing="face" autoRotate className="absolute inset-0" />
          <span className="glass glass-pill liquid absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold">
            <span className="relative z-[3]">Como você descreveu</span>
          </span>
        </div>
      )}
      <section>
        <h3 className="text-[15px] font-semibold">Cabelo</h3>
        <div className="mt-2.5">
          <Segmented
            id="pf-hair"
            size="sm"
            label="Comprimento do cabelo hoje"
            value={p.hairNow}
            onChange={(v) => setProfile({ hairNow: v })}
            options={[
              { value: 'curto', label: 'Curto' },
              { value: 'medio', label: 'Médio' },
              { value: 'longo', label: 'Longo' },
            ]}
          />
        </div>
      </section>
      <section>
        <h3 className="text-[15px] font-semibold">Barba</h3>
        <div className="mt-2.5">
          <Segmented
            id="pf-beard"
            size="sm"
            label="Barba hoje"
            value={p.beardNow}
            onChange={(v) => setProfile({ beardNow: v })}
            options={[
              { value: 'sem', label: 'Sem' },
              { value: 'por-fazer', label: 'Por fazer' },
              { value: 'curta', label: 'Curta' },
              { value: 'cheia', label: 'Cheia' },
            ]}
          />
        </div>
        <Why>É o ponto de partida das comparações — o “original” das simulações.</Why>
      </section>
    </div>
  )
}

function StepSkin() {
  const p = useLozuc((s) => s.profile)
  const setProfile = useLozuc((s) => s.setProfile)
  const toggleProduct = useLozuc((s) => s.toggleProduct)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5">
        {SKIN.map((row) => (
          <section key={row.key}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[14.5px] font-semibold">{row.label}</h3>
              <span className="truncate text-[11.5px] text-[var(--text-3)]">{row.why}</span>
            </div>
            <div className="mt-2">
              <Segmented
                id={`pf-skin-${row.key}`}
                size="sm"
                label={row.label}
                value={String(p.skin[row.key]) as '0' | '1' | '2'}
                onChange={(v) => setProfile({ skin: { ...p.skin, [row.key]: Number(v) as 0 | 1 | 2 } })}
                options={TRI.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
          </section>
        ))}
      </div>
      <section>
        <h3 className="text-[14.5px] font-semibold">Produtos que você já usa</h3>
        <div role="group" aria-label="Produtos em uso" className="mt-2.5 flex flex-wrap gap-2">
          {PRODUCT_OPTIONS.map((prod) => (
            <Chip key={prod} role="checkbox" selected={p.products.includes(prod)} onClick={() => toggleProduct(prod)} className="h-10 px-3.5 text-[13px]">
              {prod}
            </Chip>
          ))}
        </div>
      </section>
      <p className="flex items-start gap-2 text-[12px] leading-snug text-[var(--text-3)]">
        <Info size={13} className="mt-[1px] shrink-0 text-[var(--sage)]" />
        Isto não é diagnóstico. Irritação que persiste pede avaliação de um dermatologista.
      </p>
    </div>
  )
}

/** Stage 1 · "Conhecer o homem" — declared preferences, never inferred from the face. */
export function ProfileScreen() {
  const step = useLozuc((s) => s.profileStep)
  const setStep = useLozuc((s) => s.setProfileStep)
  const p = useLozuc((s) => s.profile)
  const { go } = useScreen()
  const web = useIsWeb()
  const reduced = useReducedMotion()

  const answered = [p.goal !== null, p.groomingTime !== null && p.budget !== null, p.hairNow !== null && p.beardNow !== null, true][step]
  const next = () => (step < 3 ? setStep(step + 1) : go('consent'))
  const back = () => (step > 0 ? setStep(step - 1) : go('welcome'))

  const body = (
    <>
      <p className="label">Etapa 1 · Conhecer você</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={reduced ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? undefined : { opacity: 0, x: -24 }}
          transition={springs.soft}
        >
          <h1 className="display mt-2 text-[30px] font-semibold leading-[1.05] @3xl:text-[40px]">{STEP_TITLES[step]}</h1>
          <Why>
            {step === 3 ? 'Preferências que você declara — não inferimos nada do seu rosto.' : 'Suas respostas orientam as direções. Dá para mudar depois em Perfil.'}
          </Why>
          <div className="mt-5">
            {step === 0 && <StepGoal />}
            {step === 1 && <StepRoutine />}
            {step === 2 && <StepToday showPreview={!web} />}
            {step === 3 && <StepSkin />}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )

  const cta = (
    <PinnedCTA web={web}>
      <Button onClick={next} disabled={!answered} className="w-full">
        {step < 3 ? 'Continuar' : 'Continuar para as fotos'}
      </Button>
    </PinnedCTA>
  )

  const top = <TopBar onBack={back} backLabel={step > 0 ? 'Pergunta anterior' : 'Voltar ao início'}>{<StepBar total={4} current={step} label="Progresso do perfil" />}</TopBar>

  if (web) {
    return (
      <ScreenFrame>
        <div className="grid h-full grid-cols-1 gap-8 p-8 @3xl:grid-cols-[1fr_1.05fr]">
          <div className="glass glass-frost relative hidden overflow-hidden rounded-[32px] @3xl:block">
            <FaceView subject="face" material="skin" style={declaredStyle(p)} framing="bust" autoRotate className="absolute inset-0" />
            <div className="absolute inset-x-5 bottom-5 flex flex-wrap gap-2">
              {[p.goal && GOALS.find((g) => g.value === p.goal)?.title, p.groomingTime && `${p.groomingTime} min/dia`, p.budget, p.hairNow && `cabelo ${p.hairNow}`, p.beardNow && `barba ${p.beardNow}`]
                .filter(Boolean)
                .map((t) => (
                  <span key={t as string} className="glass glass-pill liquid rounded-full px-3 py-1.5 text-[12px] font-medium">
                    <span className="relative z-[3]">{t}</span>
                  </span>
                ))}
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            {top}
            <div className="mt-6 min-h-0 flex-1 overflow-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {body}
              {cta}
            </div>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame>
      <div className="relative h-full">
        <div className="absolute inset-x-5 top-[59px] z-20">{top}</div>
        <div className={cn('absolute inset-x-0 bottom-0 top-[115px] overflow-y-auto px-5 pb-[130px] pt-3')} style={{ scrollbarWidth: 'none' }}>
          {body}
        </div>
        {cta}
      </div>
    </ScreenFrame>
  )
}
