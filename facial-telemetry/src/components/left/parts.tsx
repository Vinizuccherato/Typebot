import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { springs } from '../../lib/utils'

/** The small ↗ corner affordance used on every card in the reference. */
export function CornerArrow({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className="relative z-[3] grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-full text-white/60 outline-none transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      <ArrowUpRight size={15} strokeWidth={1.6} />
    </motion.button>
  )
}

/** Small floating tooltip rendered inside a relative container. */
export function Tip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] border border-white/10 bg-[#0d1715]/95 px-2.5 py-1.5 text-[11px] text-white shadow-[0_8px_24px_-8px_rgb(0_0_0/0.6)]"
      style={{ left: x, top: y - 8 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.div>
  )
}
