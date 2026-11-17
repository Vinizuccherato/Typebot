import { AnimatePresence, motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import { SCREENS, STAGES, ORDER, useLozuc, type ScreenId } from '../store'
import { ScreenContext, type ScreenCtx } from '../shell/screenContext'
import { COMPONENTS } from '../shell/registry'
import { cn, springs } from '../lib/utils'

const meta = (id: ScreenId) => SCREENS.find((s) => s.id === id)!

/**
 * The desktop web app: a liquid-glass sidebar with the six-stage journey, and the
 * active screen filling the pane. Screens adapt with container queries (two columns
 * from ~768px of pane width), so this is the same product, not a stretched phone.
 */
export function WebApp() {
  const screen = useLozuc((s) => s.screen)
  const dir = useLozuc((s) => s.direction)
  const go = useLozuc((s) => s.go)
  const subscribed = useLozuc((s) => s.subscribed)
  const name = useLozuc((s) => s.profile.name)
  const Comp = COMPONENTS[screen]
  const ctx: ScreenCtx = { id: screen, mode: 'web', active: true, chrome: false, go }
  const current = ORDER.indexOf(screen)
  const locked = (id: ScreenId) => !subscribed && ORDER.indexOf(id) > ORDER.indexOf('paywall')

  return (
    <div className="absolute inset-x-0 bottom-0 top-[76px] grid grid-cols-[288px_1fr] gap-5 px-6 pb-6">
      <aside aria-label="Jornada lozuc" className="glass glass-smoke liquid flex min-h-0 flex-col rounded-[28px] p-3">
        <div className="relative z-[3] flex items-center gap-3 px-3 pb-4 pt-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--sage)] text-[15px] font-bold text-[var(--color-pine)]">{name[0]}</span>
          <span>
            <span className="block text-[14px] font-semibold">{name}</span>
            <span className="block text-[12px] text-[var(--text-3)]">{subscribed ? 'Plano lozuc ativo' : 'Leitura gratuita'}</span>
          </span>
        </div>
        <nav className="relative z-[3] min-h-0 flex-1 overflow-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {STAGES.map((stage) => (
            <div key={stage.id} className="mb-2">
              <p className="label px-3 pb-1 pt-2">
                {stage.n} · {stage.title}
              </p>
              <ul>
                {stage.screens.map((id) => {
                  const m = meta(id)
                  const on = id === screen
                  const done = ORDER.indexOf(id) < current
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => go(id)}
                        aria-current={on ? 'page' : undefined}
                        className={cn('relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-[16px] px-3 text-left outline-none', on ? 'text-[var(--text)]' : 'text-[var(--text-2)] hover:text-[var(--text)]')}
                      >
                        {on && <motion.span layoutId="web-nav" className="glass glass-sage absolute inset-0 rounded-[16px]" transition={springs.snappy} />}
                        <span className={cn('relative z-[3] grid h-5 w-5 place-items-center rounded-full border text-[10px]', done ? 'border-[var(--sage)] bg-[var(--sage)] text-[var(--color-pine)]' : 'border-white/20')}>
                          {done ? <Check size={11} strokeWidth={3} /> : locked(id) ? <Lock size={9} /> : null}
                        </span>
                        <span className="relative z-[3] flex-1 truncate text-[13.5px] font-medium">{m.title}</span>
                        {m.lz && <span className="relative z-[3] text-[11px] text-[var(--sage)]">{m.lz}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <section aria-label={meta(screen).title} className="relative min-h-0 overflow-hidden rounded-[28px]" style={{ boxShadow: '0 0 0 1px rgb(255 255 255 / 0.08), 0 40px 80px -40px rgb(0 0 0 / 0.9)' }}>
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div key={screen} className="absolute inset-0" initial={{ y: dir * 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: dir * -12, opacity: 0 }} transition={springs.soft}>
            <ScreenContext.Provider value={ctx}>
              <Comp />
            </ScreenContext.Provider>
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}
