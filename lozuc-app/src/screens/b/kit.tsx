import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, Eye, HelpCircle, MessageSquare, type LucideIcon } from 'lucide-react'
import type { RegionReading, Source } from '../../store'
import { useScreen } from '../../shell/screenContext'
import { cn, springs } from '../../lib/utils'

/* Shared pieces for stages 3–4 (Leitura, Paywall, Direções, Simulação). */

/** Safe-area paddings: iPhone 59/34; the web pane has no status bar or home indicator. */
export function useSafe() {
  const { mode } = useScreen()
  const web = mode === 'web'
  return { web, top: web ? 24 : 59, bottom: web ? 24 : 34 }
}

/** Back + centred title + optional trailing control (44pt targets). */
export function TopBar({ title, tag, onBack, right }: { title: string; tag?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between gap-2">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Voltar" className="glass glass-pill liquid grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none">
          <ChevronLeft size={20} className="relative z-[3]" />
        </button>
      ) : (
        <span className="w-11" />
      )}
      <h1 className="flex min-w-0 items-baseline gap-2 truncate text-[17px] font-semibold">
        {title}
        {tag && <span className="text-[11.5px] font-semibold tracking-[0.04em] text-[var(--sage)]">{tag}</span>}
      </h1>
      <span className="flex w-11 shrink-0 justify-end">{right}</span>
    </div>
  )
}

const SOURCE: Record<Source, { label: string; icon: LucideIcon; cls: string }> = {
  observado: { label: 'Observado na foto', icon: Eye, cls: 'text-[var(--sage)] border-[rgb(169_199_182/0.45)] bg-[rgb(169_199_182/0.1)]' },
  informado: { label: 'Informado por você', icon: MessageSquare, cls: 'text-[var(--mist)] border-[rgb(215_232_222/0.35)] bg-[rgb(215_232_222/0.07)]' },
  incerto: { label: 'Incerto', icon: HelpCircle, cls: 'text-[var(--clay)] border-dashed border-[rgb(227_164_138/0.6)] bg-[rgb(227_164_138/0.07)]' },
}

/** Where an observation comes from — required next to every reading (Mapa de Entregas). */
export function SourceChip({ source, compact }: { source: Source; compact?: boolean }) {
  const s = SOURCE[source]
  return (
    <span className={cn('inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-semibold', s.cls)}>
      <s.icon size={12} strokeWidth={2} aria-hidden />
      {compact ? source[0].toUpperCase() + source.slice(1) : s.label}
    </span>
  )
}

const PRIORITY: Record<'alta' | 'media' | 'baixa', { label: string; bg: string; fg: string }> = {
  alta: { label: 'Prioridade alta', bg: 'var(--brass)', fg: 'var(--color-pine)' },
  media: { label: 'Prioridade média', bg: 'var(--sage)', fg: 'var(--color-pine)' },
  baixa: { label: 'Prioridade baixa', bg: 'rgb(215 232 222 / 0.18)', fg: 'var(--mist)' },
}

export const priorityColor = (p: RegionReading['priority']) => (p ? PRIORITY[p].bg : 'rgb(255 255 255 / 0.18)')

/** Priority as colour + text (never colour alone). */
export function PriorityPill({ p }: { p: RegionReading['priority'] }) {
  if (!p) return <span className="inline-flex h-7 items-center rounded-full border border-white/12 px-2.5 text-[11.5px] font-semibold text-[var(--text-3)]">Sem ação agora</span>
  const s = PRIORITY[p]
  return (
    <span className="inline-flex h-7 items-center rounded-full px-2.5 text-[11.5px] font-bold" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

/** 3-step segmented meter (manutenção / esforço / custo). */
export function Meter({ label, value, hint }: { label: string; value: 1 | 2 | 3; hint: [string, string, string] }) {
  return (
    <div role="img" aria-label={`${label}: ${hint[value - 1]}`} className="flex items-center gap-3">
      <span className="w-[86px] shrink-0 text-[12.5px] text-[var(--text-2)]">{label}</span>
      <span className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-[7px] flex-1 rounded-full"
            style={{
              background: i <= value ? 'linear-gradient(90deg, var(--sage), var(--mist))' : 'rgb(255 255 255 / 0.1)',
              boxShadow: i <= value ? '0 0 10px rgb(169 199 182 / 0.35), inset 0 1px 0 rgb(255 255 255 / 0.5)' : 'inset 0 1px 1px rgb(0 0 0 / 0.4)',
            }}
          />
        ))}
      </span>
      <span className="w-[52px] shrink-0 text-right text-[11.5px] font-semibold text-[var(--text-3)]">{hint[value - 1]}</span>
    </div>
  )
}

/** Sliding-pill segmented control (radiogroup, arrow keys). `id` keeps layoutIds unique per screen. */
export function Segmented<T extends string>({ id, value, options, onChange, label, size = 'md' }: { id: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  const i = options.findIndex((o) => o.id === value)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="glass glass-well flex rounded-full p-1"
      onKeyDown={(e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
        if (!d) return
        e.preventDefault()
        onChange(options[(i + d + options.length) % options.length].id)
      }}
    >
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.id)}
            className={cn('relative z-[3] flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 font-semibold outline-none transition-colors', size === 'sm' ? 'h-9 text-[12.5px]' : 'h-11 text-[13.5px]', on ? 'text-[var(--color-pine)]' : 'text-[var(--text-2)] hover:text-[var(--text)]')}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-[var(--color-bone)] shadow-[0_6px_16px_-8px_rgb(169_199_182/0.6)]" transition={springs.snappy} />}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Bottom-pinned CTA area with a fade so content scrolls beneath it (56pt button, 16pt above the home indicator). */
export function PinnedCTA({ children, className }: { children: ReactNode; className?: string }) {
  const { bottom } = useSafe()
  return (
    <div className={cn('pointer-events-none absolute inset-x-0 bottom-0 z-30', className)} style={{ paddingBottom: bottom + 16 }}>
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-[#0a0f0d] via-[#0a0f0d]/85 to-transparent" />
      <div className="pointer-events-auto relative flex flex-col items-stretch gap-2 px-5">{children}</div>
    </div>
  )
}

/** "Análise assistida por IA" label (AI Act Art. 50 transparency). */
export function AiLabel({ text = 'Análise assistida por IA' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--text-3)]">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--sage)] shadow-[0_0_8px_var(--sage)]" />
      {text}
    </span>
  )
}

export const enter = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: springs.soft }
