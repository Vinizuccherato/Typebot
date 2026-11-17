import { motion } from 'motion/react'
import { CalendarCheck, Home, MessageCircle, TrendingUp, UserRound, type LucideIcon } from 'lucide-react'
import { TAB_OF, type ScreenId, type TabId } from '../store'
import { useScreen } from './screenContext'
import { springs } from '../lib/utils'

const TABS: { id: TabId; label: string; icon: LucideIcon; screen: ScreenId }[] = [
  { id: 'home', label: 'Hoje', icon: Home, screen: 'home' },
  { id: 'plan', label: 'Plano', icon: CalendarCheck, screen: 'plan' },
  { id: 'personal', label: 'Personal', icon: MessageCircle, screen: 'personal' },
  { id: 'evolution', label: 'Evolução', icon: TrendingUp, screen: 'evolution' },
  { id: 'settings', label: 'Perfil', icon: UserRound, screen: 'settings' },
]

/** iOS 26-style floating liquid-glass tab bar. Navigation only — actions live in the screens. */
export function TabBar() {
  const { id, go, mode } = useScreen()
  if (mode === 'web') return null
  const active = TAB_OF[id]
  return (
    <nav aria-label="Navegação principal" className="pointer-events-none absolute inset-x-0 bottom-[30px] z-40 flex justify-center px-4">
      <div className="glass glass-smoke liquid pointer-events-auto flex w-full max-w-[361px] items-center justify-between rounded-[30px] p-1.5">
        {TABS.map((t) => {
          const on = t.id === active
          return (
            <button
              key={t.id}
              type="button"
              aria-current={on ? 'page' : undefined}
              onClick={() => go(t.screen)}
              className="relative z-[3] flex h-[52px] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[24px] outline-none"
            >
              {on && <motion.span layoutId={`tab-pill-${id}`} className="glass glass-sage absolute inset-0 rounded-[24px]" transition={springs.snappy} />}
              <t.icon size={20} strokeWidth={on ? 2.1 : 1.7} className={`relative z-[3] ${on ? 'text-[var(--text)]' : 'text-[var(--text-3)]'}`} />
              <span className={`relative z-[3] text-[10.5px] font-semibold ${on ? 'text-[var(--text)]' : 'text-[var(--text-3)]'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
