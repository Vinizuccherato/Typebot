import { motion } from 'motion/react'
import { BookOpenCheck, CalendarRange, Check, Compass, Droplets, History, Layers, MessageCircle, ScissorsLineDashed, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { DIRECTIONS, useLozuc } from '../store'
import { useSpecular } from '../lib/useSpecular'
import { cn, springs } from '../lib/utils'
import { useSafe } from './b/kit'

/* Illustrative prices — the Mapa de Entregas leaves pricing to the pilot. */
const PRICES = {
  anual: { total: 'R$ 239,90', period: '/ano', equiv: '≈ R$ 19,99 por mês', save: 'Economize 33%' },
  mensal: { total: 'R$ 29,90', period: '/mês', equiv: 'Cobrado todo mês', save: null },
} as const

const INCLUDED: { lz: string; title: string; detail: string; icon: LucideIcon }[] = [
  { lz: 'LZ-02', title: 'Até 3 direções de imagem', detail: 'Estilo, manutenção e esforço comparados', icon: Compass },
  { lz: 'LZ-03', title: 'Simulações no seu rosto', detail: 'Original e simulação lado a lado', icon: Layers },
  { lz: 'LZ-04', title: 'Guia para o barbeiro', detail: 'Instruções claras para quem vai executar', icon: ScissorsLineDashed },
  { lz: 'LZ-05', title: 'Rotina de pele', detail: 'Manhã e noite, dentro do seu orçamento', icon: Droplets },
  { lz: 'LZ-06', title: 'Plano de prioridades', detail: 'O que fazer agora e quando revisar', icon: CalendarRange },
  { lz: 'LZ-07', title: 'Personal com memória', detail: 'Ajusta o plano a cada retorno seu', icon: MessageCircle },
  { lz: 'LZ-08', title: 'Histórico e evolução', detail: 'Fotos comparáveis e versões do plano', icon: History },
]

/** Paywall — shown after the free reading (value first), Apple 3.1.2-compliant: price is the biggest price text, no trial toggle. */
export function PaywallScreen() {
  const { go } = useScreen()
  const { top, web } = useSafe()
  const plan = useLozuc((s) => s.plan)
  const setPlan = useLozuc((s) => s.setPlan)
  const subscribed = useLozuc((s) => s.subscribed)
  const subscribe = useLozuc((s) => s.subscribe)
  const p = PRICES[plan]

  return (
    <ScreenFrame background="radial-gradient(90% 55% at 50% 0%, #2c4a3f 0%, #0a0f0d 66%)">
      <button
        type="button"
        onClick={() => go('reading')}
        aria-label="Fechar e voltar à leitura"
        className="glass glass-pill liquid absolute right-5 z-40 grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none @3xl:right-6"
        style={{ top }}
      >
        <X size={18} className="relative z-[3]" />
      </button>
      <div className="h-full overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="mx-auto flex max-w-[980px] flex-col gap-5 px-5 pb-[270px] @3xl:pb-[230px] @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] @3xl:items-start @3xl:gap-8 @3xl:px-8" style={{ paddingTop: top }}>
          {/* hero */}
          <div className="@3xl:sticky @3xl:top-0">
            <div className="h-11" />
            <Orb />
            <h1 className="display mt-4 text-[34px] leading-[1.02]">
              Seu plano de imagem <span className="text-[var(--brass)]">completo</span>
            </h1>
            <p className="mt-2 text-[15px] leading-[1.45] text-[var(--text-2)]">Da leitura à execução — com um personal que lembra das suas decisões e ajusta o plano a cada retorno.</p>
          </div>

          <div className="flex flex-col gap-5 @3xl:pt-14">
            {/* what's included */}
            <section aria-labelledby="inc-title" className="glass glass-frost liquid rounded-[28px] p-2">
              <h2 id="inc-title" className="label relative z-[3] px-3 pb-1 pt-2">
                O que você recebe
              </h2>
              <ul className="relative z-[3]">
                {INCLUDED.map((it, i) => (
                  <motion.li key={it.lz} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springs.soft, delay: 0.04 * i }} className="flex items-center gap-3 rounded-[18px] px-3 py-2.5">
                    <Gem icon={it.icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14.5px] font-semibold">{it.title}</span>
                      <span className="block text-[12.5px] text-[var(--text-3)]">{it.detail}</span>
                    </span>
                    <span className="text-[10.5px] font-semibold text-[var(--sage)]">{it.lz}</span>
                  </motion.li>
                ))}
              </ul>
            </section>

            {/* plans — annual pre-selected; price is the largest price text */}
            <section aria-label="Escolha o plano">
              <div role="radiogroup" aria-label="Plano" className="flex flex-col gap-3">
                {(['anual', 'mensal'] as const).map((id) => (
                  <PlanCard key={id} id={id} on={plan === id} onPick={() => setPlan(id)} />
                ))}
              </div>
              <p className="mt-2 text-center text-[11.5px] text-[var(--text-3)]">Valores ilustrativos — o preço final será definido no piloto.</p>
            </section>

            <div className="glass glass-well flex items-center gap-3 rounded-[20px] p-3">
              <ShieldCheck size={18} className="relative z-[3] shrink-0 text-[var(--sage)]" aria-hidden />
              <p className="relative z-[3] text-[12.5px] leading-[1.45] text-[var(--text-2)]">Suas fotos ficam privadas. Nada vira caso público ou treino de modelo sem a sua autorização.</p>
            </div>
          </div>
        </div>
      </div>

      <footer
        className="glass glass-smoke liquid absolute inset-x-0 bottom-0 z-30 flex flex-col gap-1.5 rounded-t-[30px] px-5 pt-4 @3xl:bottom-6 @3xl:left-[calc(50%+16px)] @3xl:right-8 @3xl:rounded-[28px] @3xl:px-5"
        style={{ paddingBottom: web ? 12 : 34 + 6 }}
      >
        {subscribed ? (
          <Button className="z-[3]" onClick={() => go('directions')} icon={<Check size={18} />}>
            Plano ativo — continuar
          </Button>
        ) : (
          <Button
            className="z-[3]"
            onClick={() => {
              subscribe()
              go('directions')
            }}
            aria-label={`Ativar plano ${plan}, ${p.total} ${p.period === '/ano' ? 'por ano' : 'por mês'}`}
          >
            Ativar plano · {p.total}
            {p.period}
          </Button>
        )}
        <p className="relative z-[3] text-center text-[11.5px] leading-[1.4] text-[var(--text-3)]">
          {plan === 'anual' ? 'Cobrança anual de R$ 239,90. ' : 'Cobrança mensal de R$ 29,90. '}
          Renova automaticamente; cancele quando quiser em Ajustes › ID Apple.
        </p>
        <div className="relative z-[3] flex items-center justify-center whitespace-nowrap text-[12px] text-[var(--text-2)]">
          <button type="button" onClick={() => go('reading')} className="h-11 cursor-pointer px-2 font-semibold outline-none hover:text-[var(--text)]">
            Agora não
          </button>
          <span aria-hidden className="text-[var(--text-4)]">·</span>
          <button type="button" onClick={() => useLozuc.getState().toast({ title: 'Nenhuma compra anterior', detail: 'Use o mesmo ID Apple da assinatura' })} className="h-11 cursor-pointer px-2 outline-none hover:text-[var(--text)]">
            Restaurar compras
          </button>
          <span aria-hidden className="text-[var(--text-4)]">·</span>
          <a href="#termos" className="flex h-11 items-center px-2 outline-none hover:text-[var(--text)]">
            Termos
          </a>
          <a href="#privacidade" className="flex h-11 items-center px-2 outline-none hover:text-[var(--text)]">
            Privacidade
          </a>
        </div>
      </footer>
    </ScreenFrame>
  )
}

/** The recommended direction on the client's head, inside a liquid-glass orb with a brass halo. */
function Orb() {
  const rec = DIRECTIONS.find((d) => d.recommended) ?? DIRECTIONS[0]
  return (
    <div className="relative mx-auto mt-2 aspect-square w-full max-w-[300px]">
      <div aria-hidden className="absolute inset-[8%] rounded-full blur-[40px]" style={{ background: 'radial-gradient(closest-side, rgb(216 185 126 / 0.45), rgb(169 199 182 / 0.15) 60%, transparent)' }} />
      <div className="glass glass-frost liquid absolute inset-0 overflow-hidden rounded-full" style={{ ['--g-rim' as string]: 'rgb(255 255 255 / 0.7)' }}>
        <FaceView subject="face" material="skin" style={rec.style} framing="head" autoRotate className="absolute inset-0 z-[2]" />
        <div aria-hidden className="absolute inset-0 z-[3] rounded-full" style={{ background: 'radial-gradient(70% 40% at 35% 12%, rgb(255 255 255 / 0.18), transparent 60%)' }} />
      </div>
      <span className="glass glass-smoke liquid absolute bottom-3 left-1/2 z-[4] inline-flex h-9 -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12px] font-semibold">
        <BookOpenCheck size={13} className="relative z-[3] text-[var(--brass)]" aria-hidden />
        <span className="relative z-[3]">Direção recomendada: {rec.name}</span>
      </span>
    </div>
  )
}

/** Small faceted glass tile holding an icon (depth via layered highlights). */
function Gem({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px]"
      style={{
        background: 'linear-gradient(145deg, rgb(215 232 222 / 0.28), rgb(169 199 182 / 0.08) 55%, rgb(35 70 59 / 0.4))',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.45), inset 0 -2px 4px rgb(0 0 0 / 0.3), 0 8px 18px -10px rgb(169 199 182 / 0.6)',
        transform: 'perspective(200px) rotateX(10deg)',
      }}
    >
      <Icon size={18} strokeWidth={1.8} className="text-[var(--mist)]" />
    </span>
  )
}

function PlanCard({ id, on, onPick }: { id: 'anual' | 'mensal'; on: boolean; onPick: () => void }) {
  const p = PRICES[id]
  const spec = useSpecular<HTMLButtonElement>(1)
  return (
    <motion.button
      ref={spec.ref}
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={`${id === 'anual' ? 'Anual' : 'Mensal'}, ${p.total} ${id === 'anual' ? 'por ano' : 'por mês'}, ${p.equiv}${on ? ', selecionado' : ''}`}
      onClick={onPick}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className={cn('glass relative flex min-h-[76px] w-full cursor-pointer items-center gap-4 rounded-[24px] px-4 py-3 text-left outline-none', on ? 'glass-sage liquid' : 'glass-frost')}
    >
      <span className={cn('relative z-[3] grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-[var(--mist)] bg-[var(--mist)]' : 'border-white/30')}>
        {on && <Check size={14} strokeWidth={3} className="text-[var(--color-pine)]" />}
      </span>
      <span className="relative z-[3] flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{id === 'anual' ? 'Anual' : 'Mensal'}</span>
          {p.save && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-[var(--color-pine)]" style={{ background: 'linear-gradient(145deg, #f0dcae, var(--brass))' }}>{p.save}</span>}
        </span>
        <span className="block text-[12.5px] text-[var(--text-3)]">{p.equiv}</span>
      </span>
      <span className="relative z-[3] text-right">
        <span className="display tabular block text-[24px] leading-none">{p.total}</span>
        <span className="block text-[12px] text-[var(--text-3)]">{p.period}</span>
      </span>
    </motion.button>
  )
}
