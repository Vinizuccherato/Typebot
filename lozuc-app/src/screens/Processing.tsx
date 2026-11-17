import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, CircleAlert } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { READING, useLozuc } from '../store'
import { useScreen } from '../shell/screenContext'
import { cn, springs } from '../lib/utils'
import { PinnedCTA, useActiveInterval, useIsWeb, useReducedMotion } from './a/kit'

/** The four real stages of the analysis — what each one actually does. */
const STAGES = [
  { title: 'Validando as fotos', detail: 'Luz, pose, foco e distância de cada uma.' },
  { title: 'Mapeando regiões', detail: 'Cabelo, barba, sobrancelhas, pele e moldura do rosto.' },
  { title: 'Cruzando com seu perfil', detail: 'Objetivo, tempo de arrumação e orçamento que você declarou.' },
  { title: 'Organizando prioridades', detail: 'O que valorizar, o que fazer agora e o que reavaliar.' },
]

/** Stage 2→3 · honest progress: determinate, real stages, no fake countdown. */
export function ProcessingScreen() {
  const step = useLozuc((s) => s.processing.step)
  const done = useLozuc((s) => s.processing.done)
  const advance = useLozuc((s) => s.advanceProcessing)
  const reset = useLozuc((s) => s.resetProcessing)
  const { go, mode, active } = useScreen()
  const web = useIsWeb()
  const reduced = useReducedMotion()
  const uncertain = READING.filter((r) => r.source === 'incerto')

  // entering the screen in the app restarts the analysis from stage 1
  const started = useRef(false)
  useEffect(() => {
    if (mode !== 'board' && active && !started.current) {
      started.current = true
      reset()
    }
  }, [active, mode, reset])

  // advance one real stage at a time; on the board, loop the demo after a pause
  const holdAfterDone = useRef(0)
  const tickFn = useCallback(() => {
    const st = useLozuc.getState().processing
    if (!st.done) return advance()
    if (mode === 'board' && ++holdAfterDone.current >= 2) {
      holdAfterDone.current = 0
      reset()
    }
  }, [advance, mode, reset])
  useActiveInterval(tickFn, reduced ? 600 : 1500)

  const current = Math.min(step, STAGES.length - 1)
  const status = done ? 'Leitura pronta.' : STAGES[current].title + '…'
  const pct = (step / STAGES.length) * 100

  const visual = (
    <div className={cn('relative overflow-hidden', web ? 'glass glass-frost h-full rounded-[32px]' : 'h-[300px]')}>
      <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(closest-side, rgb(169 199 182 / 0.22), transparent 75%)' }} />
      <FaceView subject="face" material="scan" scan={done ? 100 : Math.max(8, pct + 12)} landmarks framing="face" autoRotate className="absolute inset-0" />
      {/* scan rings */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="h-[230px] w-[230px] rounded-full border border-white/10" />
      </div>
    </div>
  )

  const body = (
    <>
      <p className="label">Etapa 2 → 3 · Ler e priorizar</p>
      <h1 className="display mt-2 text-[30px] font-semibold leading-[1.05] @3xl:text-[40px]">Lendo seu rosto</h1>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={status} aria-live="polite" className="mt-1.5 text-[16px] font-semibold text-[var(--sage)]" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
          {status}
        </motion.p>
      </AnimatePresence>

      {/* determinate progress */}
      <div className="mt-4 flex items-center gap-3" role="progressbar" aria-label="Progresso da leitura" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step}>
        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.span className="absolute inset-y-0 left-0 rounded-full" style={{ background: 'linear-gradient(90deg, var(--sage), var(--mist))' }} initial={false} animate={{ width: `${pct}%` }} transition={springs.soft} />
        </span>
        <span className="tabular text-[12px] font-semibold text-[var(--text-3)]">Etapa {Math.min(step + (done ? 0 : 1), 4)} de 4</span>
      </div>

      <ol className="mt-4 flex flex-col gap-2 p-0" aria-label="Etapas da leitura">
        {STAGES.map((s, i) => {
          const state = i < step ? 'done' : i === step && !done ? 'now' : 'next'
          return (
            <li key={s.title} className={cn('glass flex list-none items-center gap-3 rounded-[18px] px-3.5 py-2.5', state === 'now' ? 'glass-sage' : 'glass-frost')} aria-current={state === 'now' ? 'step' : undefined}>
              <span className="relative z-[3] grid h-7 w-7 shrink-0 place-items-center">
                {state === 'done' && (
                  <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={springs.bouncy} className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ok)] text-[var(--color-pine)]">
                    <Check size={15} strokeWidth={3} />
                  </motion.span>
                )}
                {state === 'now' && (
                  <motion.span className="h-6 w-6 rounded-full border-2 border-[var(--mist)] border-t-transparent" animate={reduced ? undefined : { rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                )}
                {state === 'next' && <span className="h-6 w-6 rounded-full border border-white/20" />}
              </span>
              <span className="relative z-[3] min-w-0">
                <span className={cn('block text-[14px] font-semibold leading-tight', state === 'next' && 'text-[var(--text-3)]')}>{s.title}</span>
                <span className="block text-[12px] leading-snug text-[var(--text-3)]">{s.detail}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {/* honesty: what the capture can't support */}
      <AnimatePresence>
        {step >= 2 && uncertain.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={springs.soft} className="glass glass-well mt-3 flex items-start gap-3 rounded-[18px] p-3.5">
            <CircleAlert size={17} className="relative z-[3] mt-[1px] shrink-0 text-[var(--clay)]" />
            <span className="relative z-[3] text-[12.5px] leading-snug text-[var(--text-2)]">
              <span className="font-semibold text-[var(--text)]">O que não dá para concluir: </span>
              {uncertain.map((u) => `${u.name.toLowerCase()} — ${u.because?.toLowerCase()}`).join('; ')}. Vamos pedir uma nova foto depois.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  const cta = (
    <PinnedCTA web={web}>
      <Button className="w-full disabled:opacity-60" variant={done ? 'primary' : 'secondary'} disabled={!done} onClick={() => go('reading')}>
        {done ? 'Ver minha leitura' : 'Lendo…'}
      </Button>
    </PinnedCTA>
  )

  if (web) {
    return (
      <ScreenFrame>
        <div className="grid h-full grid-cols-1 gap-8 p-8 @3xl:grid-cols-[1.1fr_1fr]">
          <div className="hidden @3xl:block">{visual}</div>
          <div className="flex min-h-0 flex-col justify-center overflow-auto pr-2">
            {body}
            {cta}
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame>
      <div className="relative h-full">
        <div className="absolute inset-x-0 top-[54px]">{visual}</div>
        <div className="absolute inset-x-0 bottom-0 top-[340px] overflow-y-auto px-5 pb-[130px]" style={{ scrollbarWidth: 'none' }}>
          {body}
        </div>
        {cta}
      </div>
    </ScreenFrame>
  )
}
