import { motion } from 'motion/react'
import { CalendarCheck, Lock, ScanFace, Sparkles, type LucideIcon } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { useLozuc } from '../store'
import { useScreen } from '../shell/screenContext'
import { useTilt } from '../lib/useTilt'
import { useSpecular } from '../lib/useSpecular'
import { cn } from '../lib/utils'
import { PinnedCTA, useIsWeb, useReducedMotion } from './a/kit'

const STEPS: { n: string; title: string; detail: string; lz: string; icon: LucideIcon }[] = [
  { n: '1', title: 'Entender o rosto', detail: 'O que valorizar e o que priorizar.', lz: 'LZ-01', icon: ScanFace },
  { n: '2', title: 'Escolher uma direção', detail: 'Até 3 caminhos, simulados em você.', lz: 'LZ-02 · 03', icon: Sparkles },
  { n: '3', title: 'Executar e acompanhar', detail: 'Guia, rotina de pele e personal.', lz: 'LZ-04 → 08', icon: CalendarCheck },
]

/** One value step: layered glass disc with depth + text; the card tilts toward the pointer. */
function StepCard({ step, i }: { step: (typeof STEPS)[number]; i: number }) {
  const tilt = useTilt<HTMLLIElement>(5)
  const spec = useSpecular<HTMLDivElement>(1)
  const reduced = useReducedMotion()
  return (
    <motion.li
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="tilt list-none"
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 + i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div ref={spec.ref} onPointerMove={spec.onPointerMove} onPointerLeave={spec.onPointerLeave} className="glass glass-frost flex items-center gap-3.5 rounded-[22px] px-4 py-2.5">
        {/* depth disc: back plate + glass lens + glyph, offset in Z by the tilt */}
        <span className="relative z-[3] grid h-12 w-12 shrink-0 place-items-center" style={{ transform: 'translateZ(18px)' }}>
          <span className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, rgb(215 232 222 / 0.55), rgb(35 70 59 / 0.9) 70%)', boxShadow: '0 8px 18px -8px rgb(0 0 0 / 0.8)' }} />
          <span className="absolute inset-[5px] rounded-full border border-white/25 bg-white/5 backdrop-blur-sm" />
          <step.icon size={19} strokeWidth={1.8} className="relative text-[var(--color-bone)]" />
        </span>
        <span className="relative z-[3] min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold">{step.title}</span>
            <span className="text-[10.5px] font-semibold tracking-wide text-[var(--sage)]">{step.lz}</span>
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--text-3)]">{step.detail}</span>
        </span>
      </div>
    </motion.li>
  )
}

/** First in-app screen (the launch screen itself stays plain, per HIG). */
export function WelcomeScreen() {
  const toast = useLozuc((s) => s.toast)
  const { go: nav } = useScreen()
  const web = useIsWeb()
  const reduced = useReducedMotion()

  const hero = (
    <div className={cn('relative grid place-items-center', web ? 'h-full min-h-[420px]' : 'h-[240px]')}>
      {/* halo + orbit rings (depth behind the 3D mark) */}
      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="absolute h-[250px] w-[250px] rounded-full blur-[40px]" style={{ background: 'radial-gradient(closest-side, rgb(169 199 182 / 0.38), transparent)' }} />
        <motion.span
          className="absolute h-[236px] w-[236px] rounded-full border border-white/10"
          style={{ rotateX: 68 }}
          animate={reduced ? undefined : { rotateZ: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-[-3px] h-1.5 w-1.5 rounded-full bg-[var(--mist)] shadow-[0_0_10px_var(--mist)]" />
        </motion.span>
        <span className="absolute h-[176px] w-[176px] rounded-full border border-dashed border-white/10" />
      </div>
      <FaceView subject="mark" className={cn('absolute', web ? 'inset-[8%]' : 'left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2')} />
    </div>
  )

  const copy = (
    <>
      <motion.h1
        className="display text-center text-[42px] font-semibold leading-none @3xl:text-left @3xl:text-[64px]"
        initial={reduced ? false : { opacity: 0, y: 10, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        lozuc
      </motion.h1>
      <motion.p
        className="mt-2.5 text-center text-[17px] leading-snug text-[var(--text-2)] @3xl:text-left @3xl:text-[20px]"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.6 }}
      >
        Seu personal de imagem com IA.
        <span className="block text-[14px] text-[var(--text-3)] @3xl:text-[15px]">Cabelo, barba, sobrancelhas e pele.</span>
      </motion.p>

      <ol className="mt-5 flex flex-col gap-2.5 p-0" aria-label="Como funciona">
        {STEPS.map((s, i) => (
          <StepCard key={s.n} step={s} i={i} />
        ))}
      </ol>

      <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-snug text-[var(--text-3)]">
        <Lock size={13} className="mt-[2px] shrink-0 text-[var(--sage)]" />
        Suas fotos são analisadas para o seu plano e você pode apagá-las quando quiser.
      </p>
    </>
  )

  const cta = (
    <PinnedCTA web={web}>
      <Button onClick={() => nav('profile')} className="w-full">
        Começar
      </Button>
      <Button variant="ghost" size="md" className="w-full" onClick={() => toast({ title: 'Entrar', detail: 'Login com Apple chega na próxima versão' })}>
        Já tenho conta
      </Button>
    </PinnedCTA>
  )

  if (web) {
    return (
      <ScreenFrame>
        <div className="grid h-full grid-cols-1 gap-8 p-8 @3xl:grid-cols-[1.1fr_1fr]">
          <div className="glass glass-frost relative overflow-hidden rounded-[32px]">{hero}</div>
          <div className="flex min-h-0 flex-col justify-center overflow-auto px-2 @3xl:px-6">
            {copy}
            {cta}
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame>
      <div className="relative h-full overflow-hidden">
        <div className="absolute inset-x-0 top-[59px]">{hero}</div>
        <div className="absolute inset-x-0 top-[290px] px-5">{copy}</div>
        {cta}
      </div>
    </ScreenFrame>
  )
}
