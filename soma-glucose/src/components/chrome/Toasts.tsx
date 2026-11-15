import { AnimatePresence, motion } from 'motion/react'
import { useSoma } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { springs } from '../../lib/utils'
import { Glass } from '../../ui/Glass'

const DOT = { default: 'var(--ink)', success: 'var(--volt)', warning: '#f0a13a' } as const

/** Top-centre glass toasts (outside the artboard, scaled with it). */
export function Toasts() {
  const toasts = useSoma((s) => s.toasts)
  const dismiss = useSoma((s) => s.dismissToast)
  const { scale } = useArtboard()

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-0 z-[70] flex flex-col items-center gap-2"
      style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center', paddingTop: 92 }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: -24, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -16, scale: 0.96 }}
            transition={springs.snappy}
            className="pointer-events-auto"
          >
            <Glass
              variant="frost"
              radius={999}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => dismiss(t.id)}
              style={{ ['--g-fill-a' as string]: 'rgb(255 255 255 / 0.86)', ['--g-fill-b' as string]: 'rgb(250 250 248 / 0.74)' }}
              className="flex cursor-pointer items-center gap-3 py-2.5 pl-3.5 pr-5 text-[var(--ink)]"
            >
              <span className="relative z-[3] grid h-6 w-6 place-items-center rounded-full bg-[var(--ink)]">
                <span className="h-2 w-2 rounded-full" style={{ background: DOT[t.tone ?? 'default'] === 'var(--ink)' ? 'var(--volt)' : DOT[t.tone ?? 'default'] }} />
              </span>
              <span className="relative z-[3] flex flex-col leading-tight">
                <span className="text-[13px] font-medium">{t.title}</span>
                {t.detail && <span className="text-[11.5px] text-[var(--ink-2)]">{t.detail}</span>}
              </span>
            </Glass>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
