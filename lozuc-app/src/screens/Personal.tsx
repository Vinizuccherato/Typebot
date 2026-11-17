import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Brain, Camera, Check, Clock, Heart, RefreshCcw, Stethoscope, Trash2, type LucideIcon } from 'lucide-react'
import { ScreenFrame, TABBAR_SPACE } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { useLozuc, type ChatMessage, type Memory } from '../store'
import { Glass } from '../ui/Glass'
import { cn, springs } from '../lib/utils'
import { ScrollScreen, Sheet } from './c/kit'

type CardKind = NonNullable<ChatMessage['card']>['kind']

const CARD: Record<CardKind, { icon: LucideIcon; label: string; tone: string }> = {
  manter: { icon: Check, label: 'Manter', tone: 'var(--sage)' },
  adaptar: { icon: RefreshCcw, label: 'Adaptar', tone: 'var(--mist)' },
  'pedir-foto': { icon: Camera, label: 'Pedir informação', tone: 'var(--brass)' },
  adiar: { icon: Clock, label: 'Adiar', tone: 'var(--brass)' },
  presencial: { icon: Stethoscope, label: 'Avaliação presencial', tone: 'var(--clay)' },
}

const SUGGESTIONS = ['Cortei ontem', 'Tenho um evento sábado', 'Senti ardor ao barbear', 'A barba está crescendo']

const MEMORY_LABEL: Record<keyof Memory, string> = {
  preferencias: 'Preferências',
  condicoes: 'Condições informadas',
  decisoes: 'Decisões',
  execucoes: 'Execuções',
  retornos: 'Retornos',
}

/** Distress language gets support and a helpline before anything about appearance (PLAYBOOK §16). */
const DISTRESS = /(odeio (meu|o meu) rosto|sou feio|me acho feio|n[aã]o aguento (mais )?me ver|vontade de sumir|me odeio)/i

function Bubble({ m }: { m: ChatMessage }) {
  const mine = m.role === 'user'
  const card = m.card ? CARD[m.card.kind] : null
  return (
    <motion.li layout initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={springs.soft} className={cn('flex flex-col gap-2', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[82%] px-4 py-3 text-[14.5px] leading-[1.45] @3xl:max-w-[560px]',
          mine ? 'rounded-[22px] rounded-br-[8px] bg-[var(--color-bone)] text-[var(--color-pine)]' : 'glass glass-frost rounded-[22px] rounded-bl-[8px]',
        )}
      >
        <span className="relative z-[3]">{m.text}</span>
      </div>
      {m.card && card && (
        <Glass variant="frost" radius={20} className="liquid flex max-w-[82%] items-center gap-3 p-3 pr-4 @3xl:max-w-[420px]">
          <span className="relative z-[3] grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: card.tone, color: 'var(--color-pine)' }}>
            <card.icon size={18} strokeWidth={2} />
          </span>
          <span className="relative z-[3] min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-3)]">{card.label}</span>
            <span className="block text-[14px] font-semibold">{m.card.title}</span>
            <span className="block text-[12.5px] text-[var(--text-2)]">{m.card.detail}</span>
          </span>
        </Glass>
      )}
      {m.remembered?.map((r) => (
        <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-1 text-[11.5px] text-[var(--text-3)]">
          <Brain size={12} className="text-[var(--sage)]" /> Lembrado · {r.split(': ')[1] ?? r}
        </span>
      ))}
    </motion.li>
  )
}

/** LZ-07 — personal de imagem com IA: conversa com memória do plano e ações contextuais. */
export function PersonalScreen() {
  const { mode, active } = useScreen()
  const messages = useLozuc((s) => s.messages)
  const typing = useLozuc((s) => s.typing)
  const send = useLozuc((s) => s.send)
  const memory = useLozuc((s) => s.memory)
  const forget = useLozuc((s) => s.forget)
  const [text, setText] = useState('')
  const [memOpen, setMemOpen] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  const memCount = Object.values(memory).reduce((a, l) => a + l.length, 0)

  // keep the newest message in view — scroll only the conversation, never the board around it
  useEffect(() => {
    const scroller = sentinel.current?.closest('.overflow-y-auto') as HTMLElement | null
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: messages.length > 3 ? 'smooth' : 'auto' })
  }, [messages.length, typing])

  const submit = (t = text) => {
    if (!t.trim()) return
    send(t)
    setText('')
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const distressed = !!lastUser && DISTRESS.test(lastUser.text)

  const composer = (
    <div className="relative z-20 px-4 pt-2" style={{ paddingBottom: mode === 'web' ? 20 : TABBAR_SPACE - 6 }}>
      <div className="mb-2 flex gap-2 overflow-x-auto pb-0.5 @3xl:justify-center" style={{ scrollbarWidth: 'none' }}>
        {SUGGESTIONS.map((q) => (
          <button key={q} type="button" onClick={() => submit(q)} disabled={typing} className="glass glass-pill liquid h-11 shrink-0 cursor-pointer rounded-full px-4 text-[13px] font-medium outline-none disabled:opacity-50">
            <span className="relative z-[3]">{q}</span>
          </button>
        ))}
      </div>
      <form
        className="glass glass-smoke liquid mx-auto flex max-w-[720px] items-center gap-2 rounded-[28px] p-1.5 pl-4 focus-within:ring-2 focus-within:ring-[var(--sage)]/60"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <label htmlFor="personal-input" className="sr-only">
          Mensagem para o personal
        </label>
        <input
          id="personal-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Conte o que fez ou pergunte…"
          autoComplete="off"
          tabIndex={active ? 0 : -1}
          className="relative z-[3] h-11 min-w-0 flex-1 bg-transparent text-[15px] text-[var(--text)] placeholder:text-[var(--text-4)]"
          // the whole capsule shows the focus ring (focus-within) — the global input outline would draw a box inside it
          style={{ outline: 'none' }}
        />
        <motion.button type="submit" aria-label="Enviar" disabled={!text.trim() || typing} whileTap={{ scale: 0.9 }} className="glass glass-ink relative grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none disabled:opacity-40">
          <ArrowUp size={19} strokeWidth={2.4} className="relative z-[3]" />
        </motion.button>
      </form>
      <p className="mt-2 text-center text-[11px] text-[var(--text-4)]">Personal com IA · não substitui avaliação presencial</p>
    </div>
  )

  return (
    <ScreenFrame tabs>
      <ScrollScreen
        title="Personal"
        eyebrow={<span className="label text-[var(--sage)]">LZ-07 · lembra do seu plano</span>}
        trailing={
          <button type="button" onClick={() => setMemOpen(true)} className="glass glass-pill liquid flex h-11 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold outline-none">
            <Brain size={16} className="relative z-[3] text-[var(--sage)]" />
            <span className="relative z-[3] tabular">{memCount}</span>
          </button>
        }
        footer={composer}
      >
        <ol className="mx-auto flex max-w-[760px] flex-col gap-4 px-5 pb-4" aria-live="polite" aria-label="Conversa">
          {messages.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}
          <AnimatePresence>
            {distressed && !typing && (
              <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="self-stretch">
                <Glass variant="sage" radius={22} className="flex gap-3 p-4">
                  <Heart size={18} className="relative z-[3] mt-0.5 shrink-0" />
                  <p className="relative z-[3] text-[13.5px] leading-[1.5]">
                    Sinto muito que esteja se sentindo assim. Seu valor não depende da sua aparência. Se quiser conversar com alguém agora, o CVV atende 24h pelo <strong>188</strong> (ligação gratuita) ou em cvv.org.br.
                  </p>
                </Glass>
              </motion.li>
            )}
            {typing && (
              <motion.li key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass glass-frost self-start rounded-[22px] rounded-bl-[8px] px-4 py-3.5" aria-label="O personal está digitando">
                <span className="relative z-[3] flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="h-2 w-2 rounded-full bg-[var(--sage)]" animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </span>
              </motion.li>
            )}
          </AnimatePresence>
          <div ref={sentinel} aria-hidden />
        </ol>
      </ScrollScreen>

      <Sheet open={memOpen} onClose={() => setMemOpen(false)} title="Memória do plano" height="large">
        <p className="mb-4 text-[13px] leading-[1.45] text-[var(--text-3)]">O que o personal usa para orientar você. Apague o que não quiser que ele considere — isso não treina nenhum modelo.</p>
        {(Object.keys(MEMORY_LABEL) as (keyof Memory)[]).map((k) => (
          <section key={k} className="mb-4" aria-label={MEMORY_LABEL[k]}>
            <h3 className="label mb-2">{MEMORY_LABEL[k]}</h3>
            {memory[k].length === 0 ? (
              <p className="text-[13px] text-[var(--text-4)]">Nada registrado.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {memory[k].map((item) => (
                    <motion.li key={item} layout exit={{ opacity: 0, x: 30 }} className="glass glass-frost flex items-center gap-2 rounded-[16px] py-1 pl-3.5 pr-1">
                      <span className="relative z-[3] flex-1 text-[14px]">{item}</span>
                      <button type="button" onClick={() => forget(k, item)} aria-label={`Esquecer: ${item}`} className="relative z-[3] grid h-11 w-11 cursor-pointer place-items-center rounded-full text-[var(--text-3)] outline-none hover:bg-white/8 hover:text-[var(--clay)]">
                        <Trash2 size={16} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </section>
        ))}
      </Sheet>
    </ScreenFrame>
  )
}
