import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { Plus } from 'lucide-react'
import { useSoma } from '../../store'
import { Glass } from '../../ui/Glass'
import { springs } from '../../lib/utils'
import { Popover, PopRow } from '../chrome/Popover'
import { CardHead, Corner } from './parts'

function Kcal({ value }: { value: number }) {
  const s = useSpring(value, { stiffness: 140, damping: 24 })
  const t = useTransform(s, (v) => Math.round(v).toLocaleString('en-US'))
  useEffect(() => s.set(value), [s, value])
  return <motion.span className="tabular">{t}</motion.span>
}

const PRESETS = [
  { name: 'Greek yogurt bowl', kcal: 420, carbs: 52 },
  { name: 'Salmon & rice', kcal: 610, carbs: 64 },
  { name: 'Apple & almonds', kcal: 180, carbs: 18 },
]

export function Macros() {
  const m = useSoma((s) => s.macros)
  const logMeal = useSoma((s) => s.logMeal)
  const toast = useSoma((s) => s.toast)
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)

  const parts = [
    { id: 'carbs', label: 'Carbs', g: m.carbs, kcal: m.carbs * 4, color: 'var(--ink)' },
    { id: 'protein', label: 'Protein', g: m.protein, kcal: m.protein * 4, color: 'rgb(18 18 18 / 0.38)' },
    { id: 'fat', label: 'Fat', g: m.fat, kcal: m.fat * 9, color: 'var(--volt)' },
  ]
  const scale = Math.max(m.target, m.kcal)
  const sum = parts.reduce((a, p) => a + p.kcal, 0)

  return (
    <Glass variant="frost" radius={24} specular={0.6} className="flex h-full w-full flex-col px-[18px] pb-[14px] pt-[15px]">
      <CardHead label="Daily macronutrients" right={<Corner label="Log a meal" onClick={() => setOpen(true)} />} />
      <div className="relative z-[3] mt-2 flex items-end justify-between">
        <p className="flex items-end gap-1.5">
          <span className="text-[34px] font-light leading-none tracking-[-0.03em]">
            <Kcal value={m.kcal} />
          </span>
          <span className="pb-[3px] text-[12px] text-[var(--ink-2)]">kcal</span>
        </p>
        <span className="pb-[3px] text-[11px] text-[var(--ink-3)] tabular">of {m.target.toLocaleString('en-US')}</span>
      </div>

      <div className="relative z-[3] mt-3 flex h-[9px] w-full overflow-hidden rounded-full bg-black/[0.06]" role="img" aria-label={parts.map((p) => `${p.label} ${p.g} g`).join(', ')}>
        {parts.map((p) => (
          <motion.span
            key={p.id}
            className="h-full first:rounded-l-full"
            style={{ background: p.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(p.kcal / sum) * (m.kcal / scale) * 100}%` }}
            transition={springs.glide}
          />
        ))}
      </div>

      <div className="relative z-[3] mt-auto flex items-center justify-between pt-2">
        <ul className="flex gap-2.5">
          {parts.map((p) => (
            <li key={p.id} className="flex items-center gap-1 whitespace-nowrap text-[10.5px] text-[var(--ink-2)]">
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: p.color, boxShadow: p.id === 'fat' ? 'inset 0 0 0 1px rgb(18 18 18 / 0.35)' : undefined }} />
              {p.label} <span className="text-[var(--ink)] tabular">{p.g}g</span>
            </li>
          ))}
        </ul>
        <motion.button
          ref={anchor}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          whileTap={{ scale: 0.94 }}
          transition={springs.snappy}
          className="glass glass-ink flex h-[28px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-full pl-2 pr-3 text-[11.5px] outline-none"
        >
          <Plus size={13} strokeWidth={2} className="relative z-[3]" />
          <span className="relative z-[3]">Log</span>
        </motion.button>
      </div>

      <Popover anchor={anchor} open={open} onClose={() => setOpen(false)} side="top" width={250} label="Log a meal">
        <p className="label px-3 pb-1 pt-2 text-[var(--ink-3)]">Quick log</p>
        {PRESETS.map((p) => (
          <PopRow
            key={p.name}
            onClick={() => {
              logMeal(p.kcal, p.carbs)
              setOpen(false)
              toast({ title: `${p.name} logged`, detail: `+${p.kcal} kcal · ${p.carbs} g carbs`, tone: 'success' })
            }}
          >
            <span className="flex-1">{p.name}</span>
            <span className="text-[11.5px] text-[var(--ink-3)] tabular">{p.kcal} kcal</span>
          </PopRow>
        ))}
      </Popover>
    </Glass>
  )
}
