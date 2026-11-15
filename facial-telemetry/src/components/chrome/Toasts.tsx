import { AnimatePresence, motion } from 'motion/react'
import { useFace } from '../../store'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { springs } from '../../lib/utils'

const TONE: Record<string, string> = {
  default: 'rgb(242 247 245 / 0.7)',
  success: 'var(--mint)',
  warning: 'var(--warn)',
}

/** Top-centre glass toasts, scaled with the artboard. */
export function Toasts() {
  const toasts = useFace((s) => s.toasts)
  const dismiss = useFace((s) => s.dismissToast)
  const { scale, mode } = useArtboard()
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-0 z-[70] flex w-[420px] flex-col items-center gap-2"
      style={{ transform: `translateX(-50%) scale(${mode === 'desktop' ? scale : 1})`, transformOrigin: 'top center', paddingTop: 92 }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: -24, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -16, scale: 0.94 }}
            transition={springs.bouncy}
            className="pointer-events-auto"
          >
            <Glass
              variant="frost"
              radius={18}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dismiss(t.id)}
              className="flex cursor-pointer items-center gap-3 py-2.5 pl-3.5 pr-4"
              style={{ ['--g-fill-a' as string]: 'rgb(30 44 40 / 0.86)', ['--g-fill-b' as string]: 'rgb(12 19 18 / 0.84)' }}
            >
              <span
                className="relative z-[3] h-2 w-2 shrink-0 rounded-full"
                style={{ background: TONE[t.tone ?? 'default'], boxShadow: `0 0 10px ${TONE[t.tone ?? 'default']}` }}
              />
              <span className="relative z-[3] flex flex-col leading-tight">
                <span className="text-[13px] font-medium text-white">{t.title}</span>
                {t.detail && <span className="text-[11.5px] text-white/55">{t.detail}</span>}
              </span>
            </Glass>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
