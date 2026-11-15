import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { CardLabel } from './kit'

function Stepper({ onStep, label }: { onStep: (d: number) => void; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {[-1, 1].map((d) => (
        <button
          key={d}
          type="button"
          aria-label={`${d < 0 ? 'Decrease' : 'Increase'} ${label}`}
          onClick={(e) => {
            e.stopPropagation()
            onStep(d)
          }}
          className="grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/[0.06] text-[var(--ink)] outline-none transition-colors hover:bg-black/[0.1] active:scale-90"
        >
          {d < 0 ? <Minus size={12} /> : <Plus size={12} />}
        </button>
      ))}
    </span>
  )
}

function Tile({ label, editing, onToggle, children }: { label: string; editing: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <Glass variant="frost" radius={22} specular={0.6} className="min-h-0 flex-1">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={editing}
        aria-label={`${label}. ${editing ? 'Done editing' : 'Edit'}`}
        onClick={onToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
        className="relative z-[3] flex h-full cursor-pointer flex-col justify-between rounded-[22px] px-4 py-[14px] outline-none"
      >
        <span className="flex items-center justify-between">
          <CardLabel className="text-[var(--ink-2)]">{label}</CardLabel>
          <AnimatePresence>{editing && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] text-[var(--ink-3)]">tap to close</motion.span>}</AnimatePresence>
        </span>
        {children}
      </div>
    </Glass>
  )
}

/** Streak and weight target tiles (edits are local to this view). */
export function Goals() {
  const goals = useSoma((s) => s.goals)
  const [streakGoal, setStreakGoal] = useState(10)
  const [target, setTarget] = useState(goals.targetWeightKg)
  const [edit, setEdit] = useState<'streak' | 'weight' | null>(null)
  const toWeight = Math.max(0, goals.weightKg - target)
  const progress = Math.max(0, Math.min(1, 1 - toWeight / 6))

  return (
    <div className="flex h-full flex-col gap-3">
      <Tile label="Streak" editing={edit === 'streak'} onToggle={() => setEdit((e) => (e === 'streak' ? null : 'streak'))}>
        <span className="flex items-end justify-between">
          <span className="flex items-baseline gap-1">
            <AnimatedNumber value={goals.streakDays} className="text-[34px] font-light leading-none tracking-[-0.03em]" />
            <span className="text-[11px] text-[var(--ink-3)]">/ {streakGoal} days</span>
          </span>
          {edit === 'streak' && <Stepper label="streak goal" onStep={(d) => setStreakGoal((g) => Math.max(goals.streakDays, Math.min(30, g + d)))} />}
        </span>
        <span className="flex gap-[3px]" aria-hidden>
          {Array.from({ length: streakGoal }, (_, i) => (
            <motion.span key={i} layout className={`h-[5px] flex-1 rounded-full ${i < goals.streakDays ? 'bg-[var(--ink)]' : 'bg-black/[0.08]'}`} />
          ))}
        </span>
      </Tile>
      <Tile label="Target weight" editing={edit === 'weight'} onToggle={() => setEdit((e) => (e === 'weight' ? null : 'weight'))}>
        <span className="flex items-end justify-between">
          <span className="flex items-baseline gap-1">
            <AnimatedNumber value={target} decimals={1} className="text-[34px] font-light leading-none tracking-[-0.03em]" />
            <span className="text-[11px] text-[var(--ink-3)]">kg</span>
          </span>
          {edit === 'weight' && <Stepper label="target weight" onStep={(d) => setTarget((t) => Math.round((t + d * 0.5) * 10) / 10)} />}
        </span>
        <span className="flex flex-col gap-1">
          <span className="h-[5px] overflow-hidden rounded-full bg-black/[0.08]">
            <motion.span className="block h-full rounded-full bg-[var(--ink)]" animate={{ width: `${progress * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
          </span>
          <span className="tabular text-[10px] text-[var(--ink-3)]">{toWeight > 0 ? `${toWeight.toFixed(1)} kg to go · now ${goals.weightKg}` : 'Target reached'}</span>
        </span>
      </Tile>
    </div>
  )
}
