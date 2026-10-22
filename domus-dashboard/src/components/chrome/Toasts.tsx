import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useDomus, type Toast } from '../../store'
import { useArtboard } from '../../layout/Artboard'
import { Glass } from '../../ui/Glass'
import { springs } from '../../lib/utils'

const TONE = {
  default: { icon: Info, color: 'rgb(255 255 255 / 0.85)', bg: 'rgb(255 255 255 / 0.12)' },
  success: { icon: CircleCheck, color: '#c6ef8e', bg: 'rgb(198 239 142 / 0.16)' },
  warning: { icon: TriangleAlert, color: '#f2b36b', bg: 'rgb(242 179 107 / 0.16)' },
} as const

function ToastPill({ t }: { t: Toast }) {
  const dismiss = useDomus((s) => s.dismissToast)
  const tone = TONE[t.tone ?? 'default']
  const Icon = tone.icon
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -18, scale: 0.9, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.92, filter: 'blur(6px)', transition: { duration: 0.2 } }}
      transition={springs.bouncy}
      className="pointer-events-auto list-none"
    >
      <Glass
        variant="pill"
        radius={999}
        specular={0.7}
        className="cursor-pointer"
        style={{
          ['--g-fill-a' as string]: 'rgb(92 89 83 / 0.62)',
          ['--g-fill-b' as string]: 'rgb(52 50 46 / 0.58)',
          ['--g-blur' as string]: '30px',
          ['--g-shadow' as string]: '0 18px 40px -16px rgb(10 8 6 / 0.55)',
        }}
      >
        <button
          type="button"
          onClick={() => dismiss(t.id)}
          aria-label={`Dismiss: ${t.title}`}
          className="relative z-[3] flex max-w-[460px] cursor-pointer items-center gap-2.5 rounded-full py-[7px] pl-[7px] pr-4 text-left outline-none"
        >
          <span className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full" style={{ background: tone.bg, color: tone.color }}>
            <Icon size={14} strokeWidth={1.8} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] leading-tight text-white">{t.title}</span>
            {t.detail && <span className="block truncate text-[11.5px] leading-tight text-white/55">{t.detail}</span>}
          </span>
        </button>
      </Glass>
    </motion.li>
  )
}

/** Top-centre notification stack (outside the artboard, scaled with it). */
export function Toasts() {
  const toasts = useDomus((s) => s.toasts)
  const { mode, scale } = useArtboard()
  const s = mode === 'desktop' ? scale : 1

  return (
    <MotionConfig reducedMotion="user">
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed left-1/2 top-0 z-[90]"
        style={{
          transform: `translateX(-50%) scale(${s})`,
          transformOrigin: 'top center',
          marginTop: mode === 'desktop' ? 86 * s : 12,
        }}
      >
        <ul className="m-0 flex flex-col items-center gap-2 p-0">
          <AnimatePresence initial={false} mode="popLayout">
            {[...toasts].reverse().map((t) => (
              <ToastPill key={t.id} t={t} />
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </MotionConfig>
  )
}
