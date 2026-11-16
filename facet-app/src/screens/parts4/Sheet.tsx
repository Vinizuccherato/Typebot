import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { springs } from '../../lib/utils'

/** In-screen bottom sheet (frost/smoke glass) with backdrop; Esc and backdrop close; focus moves in. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40">
          <motion.button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass glass-smoke absolute inset-x-2 bottom-2 rounded-[32px] px-5 pb-[34px] pt-3 outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springs.glide}
          >
            <div className="relative z-[3]">
              <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[17px] font-semibold">{title}</h3>
                <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-[var(--text-2)] outline-none hover:bg-white/8 hover:text-[var(--text)]">
                  <X size={18} />
                </button>
              </div>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
