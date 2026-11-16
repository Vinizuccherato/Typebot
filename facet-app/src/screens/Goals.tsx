import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ChevronLeft, Glasses, Palette, Ratio, Scissors } from 'lucide-react'
import type { ReactNode } from 'react'
import { ScreenFrame, SAFE_BOTTOM, SAFE_TOP } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { GOALS, VIBES, useFacet, type GoalId, type VibeId } from '../store'
import { Button } from '../ui/Button'
import { ProgressSteps } from '../ui/ProgressSteps'
import { SelectCard } from '../ui/SelectCard'
import { useSpecular } from '../lib/useSpecular'
import { springs } from '../lib/utils'

function BrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M3 12c3-4.5 9.5-6 17-2.5" />
      <path d="M6 16.5c1.6 1.2 3.6 1.8 6 1.8s4.4-.6 6-1.8" opacity=".45" />
    </svg>
  )
}

function BeardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7v4c0 5 3.6 9 8 9s8-4 8-9V7" />
      <path d="M8.5 13.5c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2" />
    </svg>
  )
}

const ICONS: Record<GoalId, ReactNode> = {
  hair: <Scissors size={19} strokeWidth={1.8} />,
  brows: <BrowIcon />,
  eyewear: <Glasses size={20} strokeWidth={1.8} />,
  makeup: <Palette size={19} strokeWidth={1.8} />,
  contour: <Ratio size={19} strokeWidth={1.8} />,
  beard: <BeardIcon />,
}

const VIBE_COPY: Record<VibeId, { line: string; swatches: string[] }> = {
  natural: { line: 'Soft, effortless, close to you', swatches: ['#d9b9a3', '#9a6a43', '#c3b4ff'] },
  classic: { line: 'Timeless lines, quiet confidence', swatches: ['#e8cba8', '#3b2418', '#f4efea'] },
  bold: { line: 'Defined shapes, high contrast', swatches: ['#1c1714', '#8f7cf0', '#e8cba8'] },
  editorial: { line: 'Directional and fashion-forward', swatches: ['#c3b4ff', '#9fe3c4', '#2b2220'] },
}

function VibeRow({ id, label, selected, onSelect }: { id: VibeId; label: string; selected: boolean; onSelect: () => void }) {
  const spec = useSpecular<HTMLButtonElement>(1)
  const copy = VIBE_COPY[id]
  return (
    <motion.button
      ref={spec.ref}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onPointerMove={spec.onPointerMove}
      onPointerLeave={spec.onPointerLeave}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className="glass glass-frost flex h-[76px] w-full cursor-pointer items-center gap-4 rounded-[22px] px-4 text-left outline-none"
      style={selected ? { ['--g-edge-a' as string]: 'rgb(195 180 255 / 0.9)', ['--g-fill-a' as string]: 'rgb(195 180 255 / 0.15)' } : undefined}
    >
      <span className="relative z-[3] flex -space-x-2" aria-hidden>
        {copy.swatches.map((c) => (
          <span key={c} className="h-7 w-7 rounded-full ring-2 ring-[#19141f]" style={{ background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / .35), transparent 55%), ${c}` }} />
        ))}
      </span>
      <span className="relative z-[3] min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{label}</span>
        <span className="block truncate text-[13px] text-[var(--text-3)]">{copy.line}</span>
      </span>
      <span aria-hidden className="relative z-[3] grid h-6 w-6 place-items-center rounded-full border border-white/25">
        <motion.span className="h-3 w-3 rounded-full bg-[var(--lilac)]" initial={false} animate={{ scale: selected ? 1 : 0 }} transition={springs.bouncy} />
      </span>
    </motion.button>
  )
}

/** 03 — Goals: one question per step, multi-select focus then a style direction. */
export function GoalsScreen() {
  const { go } = useScreen()
  const step = useFacet((s) => s.goalStep)
  const setStep = useFacet((s) => s.setGoalStep)
  const goals = useFacet((s) => s.goals)
  const toggle = useFacet((s) => s.toggleGoal)
  const vibe = useFacet((s) => s.vibe)
  const setVibe = useFacet((s) => s.setVibe)
  const dir = step === 0 ? -1 : 1

  const back = () => (step === 1 ? setStep(0) : go('onboarding'))
  const cont = () => (step === 0 ? setStep(1) : go('scan'))
  const chosen = GOALS.filter((g) => goals.includes(g.id)).map((g) => g.label)

  return (
    <ScreenFrame>
      {/* nav + progress */}
      <div className="absolute inset-x-5 flex h-11 items-center gap-3" style={{ top: SAFE_TOP }}>
        <button type="button" onClick={back} aria-label="Back" className="glass glass-pill -ml-1 grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none">
          <ChevronLeft size={20} className="relative z-[3]" />
        </button>
        <div className="flex-1">
          <ProgressSteps total={2} current={step} label="Personalisation" />
        </div>
      </div>

      <div className="absolute inset-x-5 bottom-0" style={{ top: SAFE_TOP + 68 }}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          {step === 0 ? (
            <motion.section
              key="focus"
              custom={dir}
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -60, opacity: 0 }}
              transition={springs.soft}
              aria-labelledby="goals-q1"
            >
              <span className="label">Your focus</span>
              <h2 id="goals-q1" className="display mt-2 text-[32px] font-normal leading-[1.08]">
                What would you like
                <br />
                to <em className="text-[var(--lilac)]">refine?</em>
              </h2>
              <p className="mt-2 text-[15px] text-[var(--text-2)]">Choose all that apply.</p>
              <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Goals">
                {GOALS.map((g) => (
                  <SelectCard key={g.id} selected={goals.includes(g.id)} onToggle={() => toggle(g.id)} icon={ICONS[g.id]} title={g.label} hint={g.hint} />
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="vibe"
              custom={dir}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 60, opacity: 0 }}
              transition={springs.soft}
              aria-labelledby="goals-q2"
            >
              <span className="label">Your direction</span>
              <h2 id="goals-q2" className="display mt-2 text-[32px] font-normal leading-[1.08]">
                Pick a style
                <br />
                <em className="text-[var(--lilac)]">direction</em>
              </h2>
              <p className="mt-2 text-[15px] text-[var(--text-2)]">We tune every recommendation to it.</p>
              <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Style direction">
                {VIBES.map((v) => (
                  <VibeRow key={v.id} id={v.id} label={v.label} selected={vibe === v.id} onSelect={() => setVibe(v.id)} />
                ))}
              </div>
              {chosen.length > 0 && (
                <p className="mt-4 text-[13px] text-[var(--text-3)]">
                  Refining <span className="text-[var(--text-2)]">{chosen.join(' · ')}</span>
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-5 flex flex-col items-stretch gap-3" style={{ bottom: SAFE_BOTTOM + 16 }}>
        <p className="text-center text-[12.5px] text-[var(--text-3)]">You can change these anytime.</p>
        <Button onClick={cont} disabled={step === 0 && goals.length === 0} icon={<ArrowRight size={18} />}>
          {step === 0 ? `Continue${goals.length ? ` · ${goals.length}` : ''}` : 'Continue to scan'}
        </Button>
      </div>
    </ScreenFrame>
  )
}
