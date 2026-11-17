import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, LayoutGrid, Minus, MonitorSmartphone, Play, Plus } from 'lucide-react'
import { SCREENS, STAGES, useLozuc, type ScreenId } from './store'
import { ScreenContext, type ScreenCtx } from './shell/screenContext'
import { SCREEN_H, SCREEN_W } from './shell/ScreenFrame'
import { SceneRoot } from './three/SceneRoot'
import { LiquidFilter } from './ui/LiquidFilter'
import { Toasts } from './ui/Toasts'
import { WebApp } from './web/WebApp'
import { COMPONENTS } from './shell/registry'
import { cn, springs } from './lib/utils'


/* `zoom` re-lays out at device resolution (crisp text, glass, WebGL); a transform would blur. */
const ZOOM = typeof CSS !== 'undefined' && CSS.supports('zoom', '1.5')
export const scaled = (s: number) => (ZOOM ? { zoom: s } : { transform: `scale(${s})`, transformOrigin: 'top left' })

type Mode = 'phone' | 'board' | 'prototype' | 'web'

export const useViewport = () => {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useLayoutEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return vp
}

const meta = (id: ScreenId) => SCREENS.find((s) => s.id === id)!

/* ── phone: the real app ───────────────────────────────────── */
function PhoneApp() {
  const { w, h } = useViewport()
  const screen = useLozuc((s) => s.screen)
  const dir = useLozuc((s) => s.direction)
  const go = useLozuc((s) => s.go)
  const s = w / SCREEN_W
  const Comp = COMPONENTS[screen]
  const ctx: ScreenCtx = { id: screen, mode: 'app', active: true, chrome: false, go }
  return (
    <div className="fixed inset-0 overflow-hidden">
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div key={screen} className="absolute inset-0" initial={{ x: `${dir * 100}%` }} animate={{ x: 0 }} exit={{ x: `${dir * -30}%` }} transition={springs.glide}>
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

/* ── board: every screen live, grouped by journey stage ─────── */
function Board() {
  const [s, setS] = useState(0.6)
  const spotlight = useLozuc((st) => st.spotlight)
  const setSpotlight = useLozuc((st) => st.setSpotlight)
  const refs = useRef<Partial<Record<ScreenId, HTMLElement | null>>>({})

  const spot = (id: ScreenId) => {
    setSpotlight(id)
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    window.setTimeout(() => useLozuc.getState().spotlight === id && setSpotlight(null), 1600)
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-[76px] overflow-auto" style={{ scrollbarWidth: 'thin' }}>
      <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
        <div className="glass glass-pill liquid flex items-center gap-1 rounded-full p-1">
          <button type="button" aria-label="Diminuir" onClick={() => setS((v) => Math.max(0.4, +(v - 0.1).toFixed(2)))} className="relative z-[3] grid h-10 w-10 cursor-pointer place-items-center rounded-full outline-none hover:bg-white/8">
            <Minus size={16} />
          </button>
          <span className="tabular relative z-[3] w-12 text-center text-[13px] font-semibold">{Math.round(s * 100)}%</span>
          <button type="button" aria-label="Aumentar" onClick={() => setS((v) => Math.min(1, +(v + 0.1).toFixed(2)))} className="relative z-[3] grid h-10 w-10 cursor-pointer place-items-center rounded-full outline-none hover:bg-white/8">
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-14 px-14 pb-32 pt-6">
        {STAGES.map((stage) => (
          <section key={stage.id} aria-label={`Etapa ${stage.n}: ${stage.title}`}>
            <header className="mb-5 flex items-baseline gap-4">
              <span className="display text-[34px] leading-none text-[var(--sage)]">{String(stage.n).padStart(2, '0')}</span>
              <h2 className="display text-[24px] leading-none">{stage.title}</h2>
              <span className="text-[13px] text-[var(--text-3)]">{stage.screens.length} telas</span>
            </header>
            <div className="flex flex-wrap gap-10">
              {stage.screens.map((id) => {
                const m = meta(id)
                const Comp = COMPONENTS[id]
                const ctx: ScreenCtx = { id, mode: 'board', active: true, chrome: true, go: spot }
                return (
                  <figure key={id} ref={(el) => void (refs.current[id] = el)} className="m-0">
                    <figcaption className="mb-3 flex items-baseline gap-2 px-1">
                      {m.lz && <span className="glass glass-pill rounded-full px-2 py-0.5 text-[11px] font-semibold"><span className="relative z-[3]">{m.lz}</span></span>}
                      <span className="text-[14px] font-semibold">{m.title}</span>
                      <span className="text-[12px] text-[var(--text-3)]">{m.note}</span>
                    </figcaption>
                    <motion.div
                      className="relative rounded-[48px]"
                      animate={{ boxShadow: spotlight === id ? '0 0 0 3px rgb(169 199 182 / 0.95), 0 40px 80px -30px rgb(169 199 182 / 0.5)' : '0 0 0 1px rgb(255 255 255 / 0.08), 0 40px 80px -40px rgb(0 0 0 / 0.9)' }}
                      transition={{ duration: 0.35 }}
                      style={{ width: SCREEN_W * s, height: SCREEN_H * s }}
                    >
                      <div style={{ width: SCREEN_W, height: SCREEN_H, ...scaled(s) }}>
                        <ScreenContext.Provider value={ctx}>
                          <Comp />
                        </ScreenContext.Provider>
                      </div>
                    </motion.div>
                  </figure>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/* ── prototype: tap through on one screen ──────────────────── */
function Prototype() {
  const { h } = useViewport()
  const screen = useLozuc((s) => s.screen)
  const dir = useLozuc((s) => s.direction)
  const go = useLozuc((s) => s.go)
  const next = useLozuc((s) => s.next)
  const back = useLozuc((s) => s.back)
  const s = Math.min(1.05, (h - 120) / SCREEN_H)
  const Comp = COMPONENTS[screen]
  const ctx: ScreenCtx = { id: screen, mode: 'app', active: true, chrome: true, go }
  const i = SCREENS.findIndex((x) => x.id === screen)

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
    <div className="absolute inset-x-0 bottom-0 top-[76px] grid grid-cols-[minmax(260px,1fr)_auto_minmax(220px,1fr)] items-center gap-10 px-10 pb-6">
      <nav aria-label="Jornada" className="max-h-full justify-self-end overflow-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
        {STAGES.map((stage) => (
          <div key={stage.id} className="mb-3">
            <p className="label mb-1 px-4">
              {stage.n} · {stage.title}
            </p>
            <ol>
              {stage.screens.map((id) => {
                const m = meta(id)
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => go(id)}
                      aria-current={id === screen ? 'step' : undefined}
                      className={cn('flex w-[250px] cursor-pointer items-baseline gap-2 rounded-2xl px-4 py-2 text-left outline-none transition-colors', id === screen ? 'bg-white/8' : 'hover:bg-white/4')}
                    >
                      <span className={cn('text-[13.5px] font-semibold', id === screen ? 'text-[var(--text)]' : 'text-[var(--text-2)]')}>{m.title}</span>
                      {m.lz && <span className="text-[11px] text-[var(--sage)]">{m.lz}</span>}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </nav>

      <div className="relative overflow-hidden rounded-[48px]" style={{ width: SCREEN_W * s, height: SCREEN_H * s, boxShadow: '0 0 0 1px rgb(255 255 255 / 0.08), 0 50px 100px -40px rgb(0 0 0 / 0.9)' }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div key={screen} className="absolute inset-0" initial={{ x: `${dir * 100}%` }} animate={{ x: 0 }} exit={{ x: `${dir * -30}%`, opacity: 0.4 }} transition={springs.glide}>
            <div style={{ width: SCREEN_W, height: SCREEN_H, ...scaled(s) }}>
              <ScreenContext.Provider value={ctx}>
                <Comp />
              </ScreenContext.Provider>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 justify-self-start">
        <button type="button" onClick={back} disabled={i === 0} aria-label="Tela anterior" className="glass glass-pill liquid grid h-12 w-12 cursor-pointer place-items-center rounded-full outline-none disabled:opacity-30">
          <ChevronLeft size={20} className="relative z-[3]" />
        </button>
        <button type="button" onClick={next} disabled={i === SCREENS.length - 1} aria-label="Próxima tela" className="glass glass-pill liquid grid h-12 w-12 cursor-pointer place-items-center rounded-full outline-none disabled:opacity-30">
          <ChevronRight size={20} className="relative z-[3]" />
        </button>
        <span className="text-[12.5px] text-[var(--text-3)]">← → para navegar</span>
      </div>
    </div>
  )
}

function TopBar({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-[76px] items-center justify-between px-10">
      <div className="flex items-baseline gap-4">
        <span className="display text-[30px] font-semibold">lozuc</span>
        <span className="text-[13px] text-[var(--text-3)]">Personal de imagem masculina com IA · 16 telas · iPhone 393×852 + web app</span>
      </div>
      <div role="tablist" aria-label="Visualização" className="glass glass-pill liquid relative flex rounded-full p-1">
        {(
          [
            ['board', 'Board', LayoutGrid],
            ['prototype', 'Protótipo', Play],
            ['web', 'Web app', MonitorSmartphone],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn('relative z-[3] flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-[13px] font-semibold outline-none', mode === id ? 'text-[var(--color-pine)]' : 'text-[var(--text-2)]')}
          >
            {mode === id && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full bg-[var(--color-bone)]" transition={springs.snappy} />}
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
      <LiquidFilter />
      {mode === 'phone' ? (
        <PhoneApp />
      ) : (
        <main className="fixed inset-0">
          <TopBar mode={desk} setMode={setDesk} />
          {mode === 'board' && <Board />}
          {mode === 'prototype' && <Prototype />}
          {mode === 'web' && <WebApp />}
        </main>
      )}
      <SceneRoot />
      <Toasts />
    </>
  )
}
