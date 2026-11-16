import { motion } from 'motion/react'
import { GLASSES, useStudio, type GlassesId } from '../../store'
import { springs } from '../../lib/utils'
import { GlassesArt } from '../art'
import { Label, rovingKeys } from '../kit'
import { useArtboard } from '../../layout/Artboard'

export function Accessories() {
  const glasses = useStudio((s) => s.look.glasses)
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)
  const toast = useStudio((s) => s.toast)
  const idx = Math.max(0, GLASSES.findIndex((g) => g.id === glasses))
  const compact = useArtboard().mode === 'compact'
  const d = compact ? 48 : 60

  const pick = (id: GlassesId) => {
    setRegion('accessories')
    const next = id === glasses ? 'none' : id
    edit({ glasses: next })
    if (next === 'none') toast({ title: 'Glasses removed' })
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Label region="accessories" id="acc-label">Accessories</Label>
      <div
        role="radiogroup"
        aria-labelledby="acc-label"
        className={compact ? "grid grid-cols-3 gap-[9px] self-start" : "grid grid-cols-3 gap-x-[14px] gap-y-[14px] self-start"}
        onKeyDown={rovingKeys(GLASSES, idx, (g) => pick(g.id), 3)}
      >
        {GLASSES.map((g, i) => {
          const on = g.id === glasses
          return (
            <motion.button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${g.label}${on ? ' (click to remove)' : ''}`}
              title={g.label}
              data-idx={i}
              tabIndex={i === idx ? 0 : -1}
              onClick={() => pick(g.id)}
              whileHover={{ scale: 1.07, y: -1 }}
              whileTap={{ scale: 0.92 }}
              transition={springs.snappy}
              className="glass glass-well relative grid cursor-pointer place-items-center rounded-full outline-none"
              style={{ width: d, height: d, ['--g-fill-a' as string]: 'rgb(120 128 165 / 0.32)', ['--g-fill-b' as string]: 'rgb(120 128 165 / 0.2)' }}
            >
              <span className="relative z-[3]">
                <GlassesArt id={g.id as Exclude<GlassesId, 'none'>} size={compact ? 34 : 42} />
              </span>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -inset-[4px] z-[3] rounded-full border-2 border-azure"
                style={{ boxShadow: '0 0 14px rgb(60 108 246 / 0.45)' }}
                initial={false}
                animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.85 }}
                transition={springs.bouncy}
              />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
