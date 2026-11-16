import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ScreenFrame, SAFE_BOTTOM } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { FaceView } from '../three/FaceView'
import { Brackets, Construction } from './parts1/Decor'

const DURATION = 2.4

/** 01 — Splash: brand gem, wordmark, a hairline loader. Auto-advances in app mode. */
export function SplashScreen() {
  const { mode, active, go } = useScreen()
  const app = mode === 'app' && active
  // on the board the intro replays so the moment stays visible
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (app) {
      const t = window.setTimeout(() => go('onboarding'), DURATION * 1000)
      return () => window.clearTimeout(t)
    }
    const t = window.setInterval(() => setCycle((c) => c + 1), 6000)
    return () => window.clearInterval(t)
  }, [app, go])

  return (
    <ScreenFrame background="radial-gradient(90% 55% at 50% 42%, #2d2140 0%, #16111d 55%, #0b090f 100%)">
      <div key={cycle} className="absolute inset-0">
        {/* faint aura behind the gem */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-[300px] h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[50px]"
          style={{ background: 'radial-gradient(closest-side, rgb(195 180 255 / 0.32), rgb(232 203 168 / 0.12) 55%, transparent)' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <Construction className="inset-x-0 top-[60px] h-[560px] w-full" delay={0.5} opacity={0.28} />

        {/* brand gem */}
        <div className="absolute left-1/2 top-[180px] h-[240px] w-[240px] -translate-x-1/2">
          <FaceView subject="mark" className="absolute inset-0" />
          <Brackets className="-inset-4" size={16} delay={0.9} />
        </div>

        {/* wordmark */}
        <div className="absolute inset-x-0 top-[468px] flex flex-col items-center">
          <motion.h1
            className="display text-[56px] font-normal italic leading-none"
            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            facet<span className="not-italic text-[var(--lilac)]">.</span>
          </motion.h1>
          <motion.p
            className="mt-4 text-[12px] font-semibold uppercase tracking-[0.32em] text-[var(--text-3)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            The geometry of you
          </motion.p>
        </div>

        {/* loader: hairline that fills over the splash duration */}
        <div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ bottom: SAFE_BOTTOM + 40 }}>
          <div className="relative h-[2px] w-[120px] overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Loading facet">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: 'linear-gradient(90deg, var(--lilac), var(--champagne))', boxShadow: '0 0 10px var(--lilac)' }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.3, duration: DURATION - 0.3, ease: [0.45, 0, 0.2, 1] }}
            />
          </div>
          <motion.span
            className="text-[11px] tracking-[0.08em] text-[var(--text-4)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Calibrating on-device model
          </motion.span>
        </div>
      </div>
    </ScreenFrame>
  )
}
