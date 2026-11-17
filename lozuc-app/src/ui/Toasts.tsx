import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useLozuc } from '../store'
import { springs } from '../lib/utils'

/** Top-centre liquid-glass toasts. */
export function Toasts() {
  const toasts = useLozuc((s) => s.toasts)
  const dismiss = useLozuc((s) => s.dismissToast)
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-5 z-[60] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            layout
            onClick={() => dismiss(t.id)}
            initial={{ y: -30, scale: 0.92 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -30, scale: 0.92 }}
            transition={springs.bouncy}
            className="glass glass-smoke liquid pointer-events-auto flex cursor-pointer items-center gap-3 rounded-full py-2 pl-2 pr-5 text-left"
          >
            <span className="relative z-[3] grid h-8 w-8 place-items-center rounded-full bg-[var(--sage)] text-[var(--color-pine)]">
              <Check size={16} strokeWidth={2.4} />
            </span>
            <span className="relative z-[3]">
              <span className="block text-[13px] font-semibold">{t.title}</span>
              {t.detail && <span className="block text-[11.5px] text-[var(--text-3)]">{t.detail}</span>}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
