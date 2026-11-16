import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, LayoutGrid, Play } from 'lucide-react'
import { SCREENS, useFacet, type ScreenId } from './store'
import { ScreenContext, type ScreenCtx } from './shell/screenContext'
import { SCREEN_H, SCREEN_W } from './shell/ScreenFrame'
import { SceneRoot } from './three/SceneRoot'
import { Toasts } from './ui/Toasts'
import { SplashScreen } from './screens/Splash'
import { OnboardingScreen } from './screens/Onboarding'
import { GoalsScreen } from './screens/Goals'
import { ScanScreen } from './screens/Scan'
import { ResultsScreen } from './screens/Results'
import { TryOnScreen } from './screens/TryOn'
import { cn, springs } from './lib/utils'

const COMPONENTS: Record<ScreenId, ComponentType> = {
  splash: SplashScreen,
  onboarding: OnboardingScreen,
  goals: GoalsScreen,
  scan: ScanScreen,
  results: ResultsScreen,
  tryon: TryOnScreen,
}

/* `zoom` re-lays out and re-rasterises at device resolution (crisp text, glass and WebGL
   views); a transform would be rasterised at 1× and stretched. */
const ZOOM = typeof CSS !== 'undefined' && CSS.supports('zoom', '1.5')
const scaled = (s: number) => (ZOOM ? { zoom: s } : { transform: `scale(${s})`, transformOrigin: 'top left' })

type Mode = 'phone' | 'board' | 'prototype'

const useViewport = () => {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useLayoutEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

/* ── phone: the real app, one screen at a time ───────────────── */
function PhoneApp() {
  const { w, h } = useViewport()
  const screen = useFacet((s) => s.screen)
  const dir = useFacet((s) => s.direction)
  const go = useFacet((s) => s.go)
  const s = w / SCREEN_W
  const Comp = COMPONENTS[screen]
  const ctx: ScreenCtx = { id: screen, mode: 'app', active: true, chrome: false, go }
  return (
    <div className="fixed inset-0 overflow-hidden">
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={screen}
          custom={dir}
          className="absolute inset-0"
          initial={{ x: `${dir * 100}%` }}
          animate={{ x: 0 }}
          exit={{ x: `${dir * -30}%` }}
          transition={springs.glide}
        >
          <div style={{ width: SCREEN_W, height: h / s, ...scaled(s) }}>
            <ScreenContext.Provider value={ctx}>
              <Comp />
            </ScreenContext.Provider>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ── board: all six screens live, side by side ───────────────── */
function Board() {
  const { h } = useViewport()
  const spotlight = useFacet((s) => s.spotlight)
  const setSpotlight = useFacet((s) => s.setSpotlight)
  const scroller = useRef<HTMLDivElement>(null)
  const refs = useRef<Partial<Record<ScreenId, HTMLElement | null>>>({})
  const s = Math.min(1, Math.max(0.55, (h - 170) / SCREEN_H))

  const spot = (id: ScreenId) => {
    setSpotlight(id)
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    window.setTimeout(() => useFacet.getState().spotlight === id && setSpotlight(null), 1600)
  }

  // vertical wheel → horizontal pan
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('[data-wheel]')) return
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY
        e.preventDefault()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div ref={scroller} className="absolute inset-x-0 bottom-0 top-[76px] overflow-x-auto overflow-y-hidden" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex h-full items-start gap-14 px-14 pt-6">
        {SCREENS.map((meta) => {
          const Comp = COMPONENTS[meta.id]
          const ctx: ScreenCtx = { id: meta.id, mode: 'board', active: true, chrome: true, go: spot }
          return (
            <section key={meta.id} ref={(el) => void (refs.current[meta.id] = el)} aria-label={`${meta.n} ${meta.title}`} className="shrink-0">
              <header className="mb-4 flex items-baseline gap-3 px-1">
                <span className="display text-[22px] text-[var(--lilac)]">{meta.n}</span>
                <span className="text-[15px] font-semibold">{meta.title}</span>
                <span className="text-[12.5px] text-[var(--text-3)]">{meta.note}</span>
              </header>
              <motion.div
                className="relative rounded-[48px]"
                animate={{ boxShadow: spotlight === meta.id ? '0 0 0 3px rgb(195 180 255 / 0.9), 0 40px 80px -30px rgb(195 180 255 / 0.5)' : '0 0 0 1px rgb(255 255 255 / 0.08), 0 40px 80px -40px rgb(0 0 0 / 0.9)' }}
                transition={{ duration: 0.35 }}
                style={{ width: SCREEN_W * s, height: SCREEN_H * s }}
              >
                <div style={{ width: SCREEN_W, height: SCREEN_H, ...scaled(s) }}>
                  <ScreenContext.Provider value={ctx}>
                    <Comp />
                  </ScreenContext.Provider>
                </div>
              </motion.div>
            </section>
          )
        })}
        <div aria-hidden className="w-1 shrink-0" />
      </div>
    </div>
  )
}

/* ── prototype: tap through the flow on one screen ───────────── */
function Prototype() {
  const { h } = useViewport()
  const screen = useFacet((s) => s.screen)
  const dir = useFacet((s) => s.direction)
  const go = useFacet((s) => s.go)
  const next = useFacet((s) => s.next)
  const back = useFacet((s) => s.back)
  const s = Math.min(1.05, (h - 120) / SCREEN_H)
  const i = SCREENS.findIndex((x) => x.id === screen)
  const Comp = COMPONENTS[screen]
  const ctx: ScreenCtx = { id: screen, mode: 'app', active: true, chrome: true, go }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, [role=slider]')) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back])

  return (
    <div className="absolute inset-x-0 bottom-0 top-[76px] grid grid-cols-[minmax(220px,1fr)_auto_minmax(220px,1fr)] items-center gap-10 px-10 pb-6">
      <nav aria-label="Flow steps" className="justify-self-end">
        <ol className="flex flex-col gap-1">
          {SCREENS.map((m, k) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => go(m.id)}
                aria-current={m.id === screen ? 'step' : undefined}
                className={cn('flex w-[230px] cursor-pointer items-baseline gap-3 rounded-2xl px-4 py-2.5 text-left outline-none transition-colors', m.id === screen ? 'bg-white/8' : 'hover:bg-white/4')}
              >
                <span className={cn('display text-[17px]', m.id === screen ? 'text-[var(--lilac)]' : 'text-[var(--text-4)]')}>{m.n}</span>
                <span>
                  <span className={cn('block text-[14px] font-semibold', k <= i ? 'text-[var(--text)]' : 'text-[var(--text-3)]')}>{m.title}</span>
                  <span className="block text-[12px] text-[var(--text-3)]">{m.note}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="relative overflow-hidden rounded-[48px]" style={{ width: SCREEN_W * s, height: SCREEN_H * s, boxShadow: '0 0 0 1px rgb(255 255 255 / 0.08), 0 50px 100px -40px rgb(0 0 0 / 0.9)' }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={screen}
            custom={dir}
            className="absolute inset-0"
            initial={{ x: `${dir * 100}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${dir * -30}%`, opacity: 0.4 }}
            transition={springs.glide}
          >
            <div style={{ width: SCREEN_W, height: SCREEN_H, ...scaled(s) }}>
              <ScreenContext.Provider value={ctx}>
                <Comp />
              </ScreenContext.Provider>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 justify-self-start">
        <button type="button" onClick={back} disabled={i === 0} aria-label="Previous screen" className="glass glass-pill grid h-12 w-12 cursor-pointer place-items-center rounded-full outline-none disabled:opacity-30">
          <ChevronLeft size={20} className="relative z-[3]" />
        </button>
        <button type="button" onClick={next} disabled={i === SCREENS.length - 1} aria-label="Next screen" className="glass glass-pill grid h-12 w-12 cursor-pointer place-items-center rounded-full outline-none disabled:opacity-30">
          <ChevronRight size={20} className="relative z-[3]" />
        </button>
        <span className="text-[12.5px] text-[var(--text-3)]">← → to navigate</span>
      </div>
    </div>
  )
}

function TopBar({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-[76px] items-center justify-between px-10">
      <div className="flex items-baseline gap-4">
        <span className="display text-[28px] italic">
          facet<span className="text-[var(--lilac)]">.</span>
        </span>
        <span className="text-[13px] text-[var(--text-3)]">Visagism app · first-run flow · 6 screens · iPhone 393×852</span>
      </div>
      <div role="tablist" aria-label="View" className="glass glass-pill relative flex rounded-full p-1">
        {(
          [
            ['board', 'Board', LayoutGrid],
            ['prototype', 'Prototype', Play],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn('relative z-[3] flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-semibold outline-none', mode === id ? 'text-[var(--color-ink)]' : 'text-[var(--text-2)]')}
          >
            {mode === id && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-[var(--color-porcelain)]" transition={springs.snappy} />}
            <Icon size={15} className="relative" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
    </header>
  )
}

export default function App() {
  const { w } = useViewport()
  const [desk, setDesk] = useState<Mode>('board')
  const mode: Mode = w < 700 ? 'phone' : desk
  return (
    <>
      {mode === 'phone' ? (
        <PhoneApp />
      ) : (
        <main className="fixed inset-0">
          <TopBar mode={desk} setMode={setDesk} />
          {mode === 'board' ? <Board /> : <Prototype />}
        </main>
      )}
      <SceneRoot />
      <Toasts />
    </>
  )
}
