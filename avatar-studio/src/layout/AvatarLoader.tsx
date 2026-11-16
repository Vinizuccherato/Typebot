import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { avatarRegistry } from '../lib/avatar'

/** Glass pill shown while the avatar meshes are built in the worker (~5 s on first load). */
export function AvatarLoader() {
  const [ready, setReady] = useState(() => !!avatarRegistry.mesh)
  useEffect(() => {
    if (ready) return
    const id = window.setInterval(() => avatarRegistry.mesh && setReady(true), 200)
    return () => window.clearInterval(id)
  }, [ready])

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-20 grid place-items-center"
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.4 }}
        >
          <div className="glass glass-pill flex items-center gap-3 rounded-full py-3 pl-3 pr-5 text-[13px] text-[var(--text)]">
            <span className="relative z-[3] grid h-7 w-7 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[var(--azure)] border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              />
            </span>
            <span className="relative z-[3]">Preparing your avatar…</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
