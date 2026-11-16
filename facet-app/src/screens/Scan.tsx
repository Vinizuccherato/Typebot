import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Camera, Check, Glasses, ImageUp, Lock, ScanFace, Smartphone, Sun } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { useFacet } from '../store'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { springs } from '../lib/utils'
import { TopBar } from './parts4/TopBar'

/* ── oval guide with a progress arc (ring-app battery-arc lineage) ─────────── */
const OW = 280
const OH = 372
const PATH = (() => {
  // ellipse drawn from 12 o'clock clockwise so the progress arc starts at the top
  const rx = OW / 2 - 6
  const ry = OH / 2 - 6
  const cx = OW / 2
  const cy = OH / 2
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry}`
})()

function OvalGuide({ progress, done }: { progress: number; done: boolean }) {
  return (
    <svg width={OW} height={OH} viewBox={`0 0 ${OW} ${OH}`} className="pointer-events-none absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="scan-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--lilac)" />
          <stop offset="1" stopColor="var(--champagne)" />
        </linearGradient>
        <filter id="scan-glow">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <path d={PATH} fill="none" stroke="rgb(244 239 234 / 0.22)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
      <motion.path d={PATH} fill="none" stroke={done ? 'var(--mint)' : 'url(#scan-arc)'} strokeWidth="5" strokeLinecap="round" filter="url(#scan-glow)" opacity={0.65} initial={false} animate={{ pathLength: progress / 100 }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
      <motion.path d={PATH} fill="none" stroke={done ? 'var(--mint)' : 'url(#scan-arc)'} strokeWidth="2.5" strokeLinecap="round" initial={false} animate={{ pathLength: progress / 100 }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
      {/* corner registration marks */}
      {[
        [18, 40, 1, 1],
        [OW - 18, 40, -1, 1],
        [18, OH - 40, 1, -1],
        [OW - 18, OH - 40, -1, -1],
      ].map(([x, y, sx, sy], i) => (
        <path key={i} d={`M ${x} ${y + sy * 14} L ${x} ${y} L ${x + sx * 14} ${y}`} fill="none" stroke="rgb(244 239 234 / 0.5)" strokeWidth="1.5" strokeLinecap="round" />
      ))}
    </svg>
  )
}

const CHECKS = [
  { at: 6, label: 'Light' },
  { at: 20, label: 'Centred' },
  { at: 36, label: 'Distance' },
]

function FeedbackChips({ progress }: { progress: number }) {
  const holding = progress >= 36 && progress < 100
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-live="polite">
      {CHECKS.map((c) => {
        const ok = progress >= c.at
        return (
          <motion.span
            key={c.label}
            className="glass glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold"
            animate={{ opacity: ok ? 1 : 0.45 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="relative z-[3] grid h-4 w-4 place-items-center rounded-full"
              initial={false}
              animate={{ backgroundColor: ok ? 'rgb(159 227 196 / 1)' : 'rgb(244 239 234 / 0.15)', scale: ok ? [1.35, 1] : 1 }}
              transition={springs.bouncy}
            >
              {ok && <Check size={10} strokeWidth={3.2} className="text-[var(--color-ink)]" />}
            </motion.span>
            <span className="relative z-[3]">{c.label}</span>
          </motion.span>
        )
      })}
      <AnimatePresence>
        {holding && (
          <motion.span
            key="hold"
            className="glass glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-[var(--lilac)]"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={springs.bouncy}
          >
            <motion.span className="relative z-[3] h-2 w-2 rounded-full bg-[var(--lilac)]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
            <span className="relative z-[3]">Hold still…</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

function Telemetry({ progress }: { progress: number }) {
  const t = progress / 100
  const cards = [
    { label: 'Symmetry', value: Math.round(62 + 33 * Math.min(1, t * 1.25)), unit: '%' },
    { label: 'Lighting', value: Math.round(180 + 140 * Math.min(1, t * 2)), unit: 'lx' },
    { label: 'Landmarks', value: Math.round(468 * t), unit: '/468' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="glass glass-frost rounded-[18px] px-3 py-2.5">
          <span className="relative z-[3] block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">{c.label}</span>
          <span className="relative z-[3] mt-1 flex items-baseline gap-0.5">
            <AnimatedNumber value={c.value} className="text-[18px] font-semibold" stiffness={260} />
            <span className="text-[11px] text-[var(--text-3)]">{c.unit}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

const TIPS = [
  { icon: Sun, title: 'Find soft, even light', hint: 'Face a window; avoid strong shadows' },
  { icon: Glasses, title: 'Take off glasses', hint: 'Pull hair back from your forehead' },
  { icon: Smartphone, title: 'Hold the phone at eye level', hint: 'About an arm’s length away' },
]

export function ScanScreen() {
  const { mode, active, go } = useScreen()
  const scan = useFacet((s) => s.scan)
  const startScan = useFacet((s) => s.startScan)
  const resetScan = useFacet((s) => s.resetScan)
  const back = useFacet((s) => s.back)
  const loop = useRef(0)

  // drive the scan while this screen is on display
  useEffect(() => {
    if (!active || scan.phase !== 'scanning') return
    let last = performance.now()
    const step = (now: number) => {
      useFacet.getState().advanceScan(Math.min(0.1, (now - last) / 1000))
      last = now
      loop.current = requestAnimationFrame(step)
    }
    loop.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(loop.current)
  }, [active, scan.phase])

  // on the board the screen demos itself: prime → scanning → done → prime …
  useEffect(() => {
    if (mode !== 'board') return
    if (scan.phase === 'prime') {
      const id = window.setTimeout(() => startScan('camera'), 3000)
      return () => window.clearTimeout(id)
    }
    if (scan.phase === 'done') {
      const id = window.setTimeout(() => resetScan(), 2600)
      return () => window.clearTimeout(id)
    }
  }, [mode, scan.phase, startScan, resetScan])

  const p = scan.progress
  const done = scan.phase === 'done'

  return (
    <ScreenFrame background="radial-gradient(110% 60% at 50% 30%, #2a1f36 0%, #120e17 55%, #0b090e 100%)">
      <TopBar
        title="Face scan"
        onBack={mode === 'app' ? back : undefined}
        trailing={
          <span className="glass glass-pill inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold text-[var(--text-2)]">
            <Lock size={11} className="relative z-[3]" />
            <span className="relative z-[3]">On-device</span>
          </span>
        }
      />

      <AnimatePresence mode="wait" initial={false}>
        {scan.phase === 'prime' ? (
          <motion.div key="prime" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.35 }}>
            {/* preview of what the scan will see */}
            <div className="absolute left-1/2 top-[118px] h-[236px] w-[178px] -translate-x-1/2">
              <div className="absolute inset-0 rounded-[50%] border border-dashed border-white/20" />
              <FaceView subject="face" material="hologram" scan={0} autoRotate framing="face" className="absolute inset-[-24px]" />
              <motion.span
                aria-hidden
                className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-[var(--lilac)] to-transparent"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>

            <div className="absolute inset-x-5 top-[380px]">
              <span className="glass glass-pill inline-grid h-11 w-11 place-items-center rounded-full">
                <Camera size={19} className="relative z-[3] text-[var(--lilac)]" />
              </span>
              <h1 className="display mt-4 text-[32px] leading-[1.05]">
                Let’s map <em className="text-[var(--lilac)]">your face</em>
              </h1>
              <p className="mt-2 text-[15px] leading-[1.45] text-[var(--text-2)]">A 10-second scan measures 468 points. Three things make it accurate:</p>
              <ul className="mt-4 flex flex-col gap-3">
                {TIPS.map((t) => (
                  <li key={t.title} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/8">
                      <t.icon size={16} className="text-[var(--champagne)]" />
                    </span>
                    <span>
                      <span className="block text-[14.5px] font-semibold">{t.title}</span>
                      <span className="block text-[12.5px] text-[var(--text-3)]">{t.hint}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute inset-x-5 bottom-[34px] flex flex-col items-stretch gap-1 pb-2">
              <p className="mb-2 flex items-start gap-2 text-[12px] leading-[1.4] text-[var(--text-3)]">
                <Lock size={13} className="mt-[2px] shrink-0" />
                Your camera feed stays on this phone. Nothing is uploaded, and you can delete your scan anytime in Settings.
              </p>
              <Button onClick={() => startScan('camera')} icon={<ScanFace size={18} />}>
                Enable camera
              </Button>
              <Button variant="ghost" size="md" onClick={() => startScan('photo')} icon={<ImageUp size={16} />}>
                Upload a photo instead
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="scan" className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <div className="absolute inset-x-5 top-[116px] text-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={done ? 'done' : p < 36 ? 'align' : 'map'} className="text-[15px] font-semibold" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  {done ? 'Mapping complete' : p < 36 ? 'Fit your face inside the oval' : scan.source === 'photo' ? 'Reading your photo…' : 'Mapping landmarks…'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* guide + live 3D preview */}
            <div className="absolute left-1/2 top-[152px] -translate-x-1/2" style={{ width: OW, height: OH }}>
              <div className="absolute inset-[10px] overflow-hidden rounded-[50%]" style={{ background: 'radial-gradient(closest-side, rgb(195 180 255 / 0.12), transparent)' }} />
              <FaceView subject="face" material="hologram" landmarks scan={p} framing="face" className="absolute inset-[10px]" />
              <OvalGuide progress={p} done={done} />
              <AnimatePresence>
                {done && (
                  <motion.span
                    className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--mint)] text-[var(--color-ink)]"
                    style={{ boxShadow: '0 0 0 8px rgb(159 227 196 / 0.18), 0 0 40px rgb(159 227 196 / 0.55)' }}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={springs.bouncy}
                  >
                    <Check size={30} strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute inset-x-5 top-[536px] flex flex-col items-center gap-3">
              <span className="flex items-baseline gap-1">
                <AnimatedNumber value={Math.floor(p)} className="display text-[44px] leading-none" stiffness={300} />
                <span className="display text-[22px] text-[var(--text-3)]">%</span>
              </span>
              <FeedbackChips progress={p} />
            </div>

            <div className="absolute inset-x-5 bottom-[34px] flex flex-col gap-3 pb-2">
              <AnimatePresence mode="wait" initial={false}>
                {done ? (
                  <motion.div key="cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={springs.soft} className="flex flex-col gap-3">
                    <p className="text-center text-[12.5px] text-[var(--text-3)]">468 landmarks · 0.4 mm precision · processed on device</p>
                    <Button onClick={() => go('results')} icon={<ArrowRight size={18} />}>
                      See my analysis
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="tele" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Telemetry progress={p} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ScreenFrame>
  )
}
