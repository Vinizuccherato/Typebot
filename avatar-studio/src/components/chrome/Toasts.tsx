import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useStudio } from '../../store'
import { springs } from '../../lib/utils'
import { Glass } from '../../ui/Glass'

/** Top-centre glass toasts. */
export function Toasts() {
  const toasts = useStudio((s) => s.toasts)
  const dismiss = useStudio((s) => s.dismissToast)
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(18px*var(--s)+env(safe-area-inset-top,0px))] z-[70] flex flex-col items-center gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: -40, scale: 0.92 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -30, scale: 0.92 }}
            transition={springs.bouncy}
            className="pointer-events-auto"
          >
            <div style={{ transform: 'scale(var(--s))' }}>
            <Glass
              radius={999}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dismiss(t.id)}
              className="flex cursor-pointer items-center gap-3 py-2 pl-2 pr-5 text-[var(--text)]"
              style={{ background: 'linear-gradient(150deg, rgb(255 255 255 / 0.85), rgb(240 241 248 / 0.75))' }}
            >
              <span className="relative z-[3] grid h-8 w-8 place-items-center rounded-full bg-azure text-white">
                <Check size={15} strokeWidth={2.4} />
              </span>
              <span className="relative z-[3] flex flex-col leading-tight">
                <span className="text-[13.5px] font-medium">{t.title}</span>
                {t.detail && <span className="text-[11.5px] text-[var(--text-2)]">{t.detail}</span>}
              </span>
            </Glass>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
