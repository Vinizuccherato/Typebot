import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Glass } from '../../ui/Glass'
import { useFace } from '../../store'
import { springs } from '../../lib/utils'
import { Tip } from './kit'

const N = 22 // one sample every 30 s → last 11 minutes

const attention = (i: number, t: number) => Math.round(70 + 18 * Math.sin((i + t) / 3.1) + 7 * Math.sin((i + t) * 1.7))

/** Cognitive state with an attention strip (newest on the right). */
export function Cognitive() {
  const state = useFace((s) => s.vitals.cognitive)
  const [t, setT] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  // a new attention sample every 5 s (accelerated session time)
  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 1), 5000)
    return () => window.clearInterval(id)
  }, [])

  const samples = useMemo(() => Array.from({ length: N }, (_, i) => attention(i, t)), [t])
  const current = samples[N - 1]

  return (
    <Glass variant="smoke" radius={22} specular={0.5} className="flex h-full w-full flex-col p-4">
      <div className="relative z-[3] flex items-start justify-between">
        <div>
          <div className="label">Cognitive State</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state}
              className="mt-0.5 text-[17px] font-normal text-white"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              {state}
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="tabular text-[11px] text-white/50">{current}% focus</span>
      </div>

      <div className="relative z-[3] mt-auto flex h-[34px] items-end justify-between" role="img" aria-label={`Attention over the last 11 minutes, now ${current}%`}>
        {samples.map((v, i) => {
          const now = i === N - 1
          const h = 6 + ((v - 50) / 50) * 26
          return (
            <motion.span
              key={i}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              className="relative w-[4px] rounded-full"
              initial={false}
              animate={{ height: now ? Math.max(8, h) : 4, opacity: now ? 1 : 0.35 + (v - 50) / 120 }}
              transition={springs.soft}
              style={{
                background: now ? 'var(--mint)' : v > 85 ? 'rgb(143 240 192 / 0.8)' : 'rgb(255 255 255 / 0.7)',
                boxShadow: now ? '0 0 10px var(--mint)' : 'none',
              }}
            />
          )
        })}
        <AnimatePresence>
          {hover !== null && (
            <Tip x={`${(hover / (N - 1)) * 100}%`} y={-4}>
              <span className="tabular">
                {hover === N - 1 ? 'now' : `−${((N - 1 - hover) * 0.5).toFixed(1)} min`} · {samples[hover]}% focus
              </span>
            </Tip>
          )}
        </AnimatePresence>
      </div>
    </Glass>
  )
}
