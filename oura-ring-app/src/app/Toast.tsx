import { AnimatePresence, motion } from 'motion/react'
import { Zap } from 'lucide-react'
import { useRings } from '../store'
import { springs } from '../lib/utils'

/** In-app glass toast that drops from the top; also shows a live "Charging" chip. */
export function Toast() {
  const toast = useRings((s) => s.toast)
  const charging = useRings((s) => s.charging)
  const show = toast ?? (charging ? 'Charging' : null)

  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[18px] z-40 flex justify-center">
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key={show}
            className="frost flex h-[44px] max-w-[340px] items-center gap-2.5 rounded-full pl-[6px] pr-4 text-[13px] font-normal text-white"
            initial={{ y: -60, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -60, scale: 0.92 }}
            transition={springs.bouncy}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/85 text-[#1b2024]">
              {show === 'Charging' ? <Zap size={14} strokeWidth={1.8} /> : <RingGlyph />}
            </span>
            <span className="truncate">{show}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RingGlyph() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
      <ellipse cx="9" cy="7" rx="7" ry="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}
