import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, CircleHelp, Image as ImageIcon, RotateCcw, X } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { CHECK_LABEL, SHOT_LABEL, useLozuc, type CheckId, type ShotId } from '../store'
import { useScreen } from '../shell/screenContext'
import { cn, springs } from '../lib/utils'
import { PinnedCTA, useActiveInterval, useIsWeb, useReducedMotion } from './a/kit'

const SHOTS: ShotId[] = ['frente', 'perfil', 'tresQuartos']
const CHECKS: CheckId[] = ['luz', 'pose', 'foco', 'filtro', 'distancia']
const POSE = { frente: 'front', perfil: 'profile', tresQuartos: 'threeQuarter' } as const
const INSTRUCTION: Record<ShotId, string> = {
  frente: 'Olhe para a lente, queixo reto.',
  perfil: 'Vire o rosto 90° para a direita.',
  tresQuartos: 'Vire o rosto até ver só um olho de frente.',
}

/** Small pose glyph for the shot strip (no photos involved). */
function PoseGlyph({ shot, on }: { shot: ShotId; on: boolean }) {
  const c = on ? 'var(--mist)' : 'rgb(238 243 239 / 0.55)'
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" aria-hidden>
      {shot === 'frente' && <ellipse cx="13" cy="13" rx="8" ry="10" fill="none" stroke={c} strokeWidth="1.6" />}
      {shot === 'perfil' && <path d="M9 3c6 0 10 4 10 10 0 2 2 3 2 4l-2 1c0 3-1 5-4 5h-2v4H8V18C5 16 4 13 4 10c0-4 2-7 5-7Z" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />}
      {shot === 'tresQuartos' && (
        <>
          <ellipse cx="13" cy="13" rx="7.5" ry="10" fill="none" stroke={c} strokeWidth="1.6" />
          <path d="M15 9c2 1 3 3 3 5" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      <path d="M8 26h10" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Oval guide: dashed outline, progress arc of passed checks, corner ticks. */
function OvalGuide({ progress, state }: { progress: number; state: 'idle' | 'checking' | 'ok' | 'retake' }) {
  const stroke = state === 'ok' ? 'var(--ok)' : state === 'retake' ? 'var(--clay)' : 'var(--mist)'
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 250 320" preserveAspectRatio="none" aria-hidden>
      <defs>
        <filter id="cap-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <ellipse cx="125" cy="160" rx="118" ry="152" fill="none" stroke="rgb(255 255 255 / 0.28)" strokeWidth="1.5" strokeDasharray="3 7" />
      <motion.ellipse
        cx="125"
        cy="160"
        rx="118"
        ry="152"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        filter="url(#cap-glow)"
        opacity={0.6}
        transform="rotate(-90 125 160)"
        initial={false}
        animate={{ pathLength: progress }}
        transition={springs.soft}
      />
      <motion.ellipse
        cx="125"
        cy="160"
        rx="118"
        ry="152"
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        transform="rotate(-90 125 160)"
        initial={false}
        animate={{ pathLength: progress }}
        transition={springs.soft}
      />
    </svg>
  )
}

/** Stage 2 · guided capture: frente, perfil, ¾ with live quality checks (full-screen modal). */
export function CaptureScreen() {
  const shots = useLozuc((s) => s.shots)
  const active = useLozuc((s) => s.activeShot)
  const setActive = useLozuc((s) => s.setActiveShot)
  const setShot = useLozuc((s) => s.setShot)
  const toast = useLozuc((s) => s.toast)
  const { go, mode } = useScreen()
  const web = useIsWeb()
  const reduced = useReducedMotion()

  const [ticked, setTicked] = useState<CheckId[]>([])
  const [checking, setChecking] = useState(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const shot = shots[active]
  const allOk = SHOTS.every((s) => shots[s].status === 'ok')

  /** Simulated live checks: tick one by one, then approve the shot and move on. */
  const capture = useCallback(() => {
    if (checking) return
    const st = useLozuc.getState()
    const target = st.activeShot
    setChecking(true)
    setTicked([])
    navigator.vibrate?.(8)
    CHECKS.forEach((c, i) => {
      timers.current.push(window.setTimeout(() => setTicked((t) => [...t, c]), reduced ? 0 : 260 * (i + 1)))
    })
    timers.current.push(
      window.setTimeout(() => {
        setShot(target, { status: 'ok', checks: { luz: true, pose: true, foco: true, filtro: true, distancia: true }, issue: undefined })
        setChecking(false)
        navigator.vibrate?.([6, 40, 12])
        const nextPending = SHOTS.find((s) => s !== target && useLozuc.getState().shots[s].status !== 'ok')
        if (nextPending) setActive(nextPending)
      }, reduced ? 50 : 260 * (CHECKS.length + 1)),
    )
  }, [checking, reduced, setActive, setShot])

  /* Board demo loop: walk the shots, retake ¾, then reset ¾ so it plays again. */
  const demoStep = useRef(0)
  const demo = useCallback(() => {
    const st = useLozuc.getState()
    const k = demoStep.current++ % 5
    if (k === 0) setActive('frente')
    if (k === 1) setActive('perfil')
    if (k === 2) setActive('tresQuartos')
    if (k === 3 && st.shots.tresQuartos.status !== 'ok') capture()
    if (k === 4) {
      setShot('tresQuartos', { status: 'refazer', checks: { luz: false, pose: true, foco: true, filtro: true, distancia: true }, issue: 'Sombra forte no lado esquerdo — vire-se para a janela.' })
      setActive('frente')
    }
  }, [capture, setActive, setShot])
  useActiveInterval(demo, 2600, mode === 'board')

  const passed: CheckId[] = checking ? ticked : shot.status === 'ok' ? CHECKS : shot.status === 'refazer' ? CHECKS.filter((c) => shot.checks[c]) : []
  const failed: CheckId[] = !checking && shot.status === 'refazer' ? CHECKS.filter((c) => !shot.checks[c]) : []
  const guideState = checking ? 'checking' : shot.status === 'ok' ? 'ok' : shot.status === 'refazer' ? 'retake' : 'idle'
  const line = checking ? 'Segure firme…' : shot.status === 'ok' ? `${SHOT_LABEL[active]} aprovada.` : shot.status === 'refazer' ? shot.issue ?? 'Vamos refazer esta foto.' : INSTRUCTION[active]

  const guide = (
    <div className="relative mx-auto aspect-[250/320] w-[64%] max-w-[300px] @3xl:w-[min(78%,360px)] @3xl:max-w-none">
      {/* clear glass dim behind the preview (35% over a bright scene, per HIG) */}
      <div className="absolute inset-0 overflow-hidden rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgb(169 199 182 / 0.14), rgb(0 0 0 / 0.35))' }}>
        <FaceView subject="face" material="scan" pose={POSE[active]} scan={checking ? (ticked.length / CHECKS.length) * 100 : shot.status === 'ok' ? 100 : 40} framing="face" className="absolute inset-0" />
      </div>
      <OvalGuide progress={passed.length / CHECKS.length} state={guideState} />
      {/* corner ticks */}
      {['left-0 top-0 border-l border-t rounded-tl-xl', 'right-0 top-0 border-r border-t rounded-tr-xl', 'left-0 bottom-0 border-l border-b rounded-bl-xl', 'right-0 bottom-0 border-r border-b rounded-br-xl'].map((c) => (
        <span key={c} aria-hidden className={cn('absolute h-5 w-5 border-white/40', c)} />
      ))}
    </div>
  )

  const strip = (
    <div role="tablist" aria-label="Fotos" className="grid grid-cols-3 gap-2">
      {SHOTS.map((s) => {
        const st = shots[s]
        const on = s === active
        return (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={on}
            aria-label={`${SHOT_LABEL[s]}: ${st.status === 'ok' ? 'aprovada' : st.status === 'refazer' ? 'refazer' : 'pendente'}`}
            onClick={() => setActive(s)}
            className={cn('glass relative flex h-[60px] cursor-pointer items-center gap-2 rounded-[18px] px-3 outline-none', on ? 'glass-sage' : 'glass-frost')}
          >
            <span className="relative z-[3]">
              <PoseGlyph shot={s} on={on} />
            </span>
            <span className="relative z-[3] text-left">
              <span className="block text-[13px] font-semibold">{SHOT_LABEL[s]}</span>
              <span className={cn('block text-[11px]', st.status === 'ok' ? 'text-[var(--ok)]' : st.status === 'refazer' ? 'text-[var(--clay)]' : 'text-[var(--text-3)]')}>
                {st.status === 'ok' ? 'Aprovada' : st.status === 'refazer' ? 'Refazer' : 'Pendente'}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )

  const checks = (
    <ul aria-label="Checagens da foto" className="flex flex-wrap justify-center gap-1.5 p-0 @3xl:justify-start">
      {CHECKS.map((c) => {
        const ok = passed.includes(c)
        const bad = failed.includes(c)
        return (
          <li key={c} className={cn('glass glass-pill flex h-8 list-none items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium', bad ? 'text-[var(--clay)]' : ok ? 'text-[var(--text)]' : 'text-[var(--text-3)]')}>
            <span className={cn('relative z-[3] grid h-4 w-4 place-items-center rounded-full', ok ? 'bg-[var(--ok)] text-[var(--color-pine)]' : bad ? 'bg-[rgb(227_164_138/0.25)]' : 'border border-white/25')}>
              <AnimatePresence>
                {ok && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={springs.bouncy}>
                    <Check size={10} strokeWidth={3.4} />
                  </motion.span>
                )}
                {bad && <X size={10} strokeWidth={3} />}
              </AnimatePresence>
            </span>
            <span className="relative z-[3]">{CHECK_LABEL[c]}</span>
          </li>
        )
      })}
    </ul>
  )

  const instruction = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={line}
        aria-live="polite"
        className={cn('text-center text-[17px] font-semibold leading-snug @3xl:text-left @3xl:text-[20px]', shot.status === 'refazer' && !checking ? 'text-[var(--clay)]' : 'text-[var(--text)]')}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22 }}
      >
        {line}
      </motion.p>
    </AnimatePresence>
  )

  const controls = allOk ? (
    <PinnedCTA web={web}>
      <Button className="w-full" onClick={() => go('processing')}>
        Ler meu rosto
      </Button>
    </PinnedCTA>
  ) : (
    <div className={cn('flex items-center justify-between', web ? 'mt-8 max-w-[360px]' : 'absolute inset-x-8 bottom-[52px]')}>
      <motion.button
        type="button"
        aria-label="Escolher da galeria"
        onClick={() => toast({ title: 'Galeria', detail: 'Escolha 3 fotos: frente, perfil e ¾' })}
        whileTap={{ scale: 0.9 }}
        className="glass glass-pill liquid grid h-12 w-12 cursor-pointer place-items-center rounded-full outline-none"
      >
        <ImageIcon size={19} className="relative z-[3]" />
      </motion.button>
      <motion.button
        type="button"
        aria-label={shot.status === 'refazer' ? `Refazer ${SHOT_LABEL[active]}` : `Capturar ${SHOT_LABEL[active]}`}
        onClick={capture}
        disabled={checking}
        whileTap={{ scale: 0.88 }}
        transition={springs.bouncy}
        className="glass glass-pill liquid relative grid h-[72px] w-[72px] cursor-pointer place-items-center rounded-full outline-none disabled:cursor-wait"
      >
        <span className="relative z-[3] h-[56px] w-[56px] rounded-full bg-[var(--color-bone)] shadow-[inset_0_-3px_6px_rgb(35_70_59/0.25)]" />
      </motion.button>
      {shot.status === 'refazer' ? (
        <motion.button type="button" onClick={capture} whileTap={{ scale: 0.92 }} className="glass glass-pill liquid flex h-12 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold outline-none">
          <RotateCcw size={14} className="relative z-[3]" />
          <span className="relative z-[3]">Refazer</span>
        </motion.button>
      ) : (
        <span className="w-12" aria-hidden />
      )}
    </div>
  )

  const tip = <p className="text-center text-[12px] leading-snug text-[var(--text-3)] @3xl:text-left">Braço esticado: de perto, a lente distorce as proporções do rosto.</p>

  const top = (
    <div className="flex h-11 items-center justify-between">
      <motion.button type="button" aria-label="Fechar captura" onClick={() => go('consent')} whileTap={{ scale: 0.9 }} className="glass glass-pill liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
        <X size={18} className="relative z-[3]" />
      </motion.button>
      <span className="text-center">
        <span className="block text-[15px] font-semibold">Captura guiada</span>
        <span className="block text-[12px] text-[var(--text-3)]">
          {SHOTS.filter((s) => shots[s].status === 'ok').length} de 3 fotos aprovadas
        </span>
      </span>
      <motion.button
        type="button"
        aria-label="Dicas de captura"
        onClick={() => toast({ title: 'Dicas', detail: 'Luz de janela à frente · sem óculos · cabelo fora da testa' })}
        whileTap={{ scale: 0.9 }}
        className="glass glass-pill liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none"
      >
        <CircleHelp size={18} className="relative z-[3]" />
      </motion.button>
    </div>
  )

  if (web) {
    return (
      <ScreenFrame background="radial-gradient(90% 70% at 30% 40%, #18302a 0%, #070b0a 70%)">
        <div className="grid h-full grid-cols-1 gap-8 p-8 @3xl:grid-cols-[1.1fr_1fr]">
          <div className="glass glass-frost relative grid place-items-center overflow-hidden rounded-[32px] py-8">{guide}</div>
          <div className="flex min-h-0 flex-col justify-center gap-5 overflow-auto pr-2">
            {top}
            <p className="label mt-4">Etapa 2 · Receber boas imagens</p>
            {strip}
            {instruction}
            {checks}
            {tip}
            {controls}
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame background="radial-gradient(120% 70% at 50% 35%, #18302a 0%, #070b0a 70%)">
      <div className="relative h-full">
        <div className="absolute inset-x-5 top-[59px] z-20">{top}</div>
        <div className="absolute inset-x-5 top-[118px]">{strip}</div>
        <div className="absolute inset-x-0 top-[194px]">{guide}</div>
        <div className="absolute inset-x-5 top-[520px] flex flex-col gap-3">
          {instruction}
          {checks}
          {tip}
        </div>
        {controls}
      </div>
    </ScreenFrame>
  )
}
