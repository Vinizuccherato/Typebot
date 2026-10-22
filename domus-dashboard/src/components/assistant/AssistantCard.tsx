import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Check, Mic, Sparkle, X } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { IconButton } from '../../ui/IconButton'
import { cn, prefersReducedMotion, springs } from '../../lib/utils'
import { useDomus, type ChatMessage } from '../../store'
import { detectLang, interpret, SUGGESTIONS, WELCOME, type Lang } from './brain'
import { useSpeech } from './useSpeech'

/** Chat sheet height when no room slot is found (compact flow). On desktop it covers the room panel exactly. */
const OPEN_H = 560
const THINK_MS = 520
const CHAR_MS = 16

/* ── live waveform (mic level from the analyser, synthetic fallback) ── */
function Waveform({ level }: { level: React.MutableRefObject<number> }) {
  const bars = useRef<Array<HTMLSpanElement | null>>([])
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const loop = (t: number) => {
      const k = (t - t0) / 1000
      const lv = level.current
      bars.current.forEach((el, i) => {
        if (!el) return
        const wave = 0.5 + 0.5 * Math.sin(k * 7 + i * 0.75) * Math.sin(k * 2.3 + i * 0.31)
        const h = 0.14 + wave * (0.22 + lv * 1.6)
        el.style.transform = `scaleY(${Math.min(1, h).toFixed(3)})`
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [level])
  return (
    <div className="flex h-5 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            bars.current[i] = el
          }}
          className="h-full w-[2px] origin-center rounded-full bg-lime-glow/90"
          style={{ transform: 'scaleY(0.2)' }}
        />
      ))}
    </div>
  )
}

/* ── chat bubbles ── */
function Bubble({ m, streaming }: { m: ChatMessage; streaming: boolean }) {
  const isUser = m.role === 'user'
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={springs.soft}
      className={cn('flex w-full', isUser ? 'justify-end' : 'items-start gap-2')}
    >
      {!isUser && (
        <span className="glass glass-pill mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-lime-glow">
          <Sparkle size={13} strokeWidth={1.8} className="relative z-[3]" />
        </span>
      )}
      <div className={cn('max-w-[84%]', isUser ? '' : 'min-w-0')}>
        <div
          className={cn(
            'whitespace-pre-wrap text-[13px] leading-[1.5]',
            isUser
              ? 'rounded-[18px] rounded-br-[6px] bg-white/92 px-3.5 py-2 text-ink shadow-[0_6px_18px_-8px_rgb(0_0_0/0.4)]'
              : 'glass glass-inset rounded-[18px] rounded-tl-[6px] px-3.5 py-2.5 text-white/90',
          )}
        >
          <span className="relative z-[3]">
            {m.text}
            {streaming && <span className="ml-0.5 inline-block h-[13px] w-[2px] translate-y-[2px] animate-pulse rounded-full bg-lime-glow" />}
          </span>
        </div>
        <AnimatePresence>
          {!isUser && !streaming && m.actions && m.actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.soft, delay: 0.05 }}
              className="mt-1.5 flex flex-wrap gap-1"
            >
              {m.actions.map((a, i) => (
                <motion.span
                  key={a}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springs.bouncy, delay: 0.06 * i }}
                  className="inline-flex h-6 items-center gap-1 rounded-full border border-lime-glow/25 bg-lime-glow/12 px-2 text-[11px] text-lime-glow"
                >
                  <Check size={11} strokeWidth={2.2} />
                  {a}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2">
      <span className="glass glass-pill mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-lime-glow">
        <Sparkle size={13} strokeWidth={1.8} className="relative z-[3] animate-spin [animation-duration:2.4s]" />
      </span>
      <div className="glass glass-inset flex h-9 items-center gap-1 rounded-[18px] rounded-tl-[6px] px-3.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="relative z-[3] h-1.5 w-1.5 rounded-full bg-white/80"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}

const initialLang = (): Lang => {
  const n = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en'
  return n === 'pt' ? 'pt' : n === 'es' ? 'es' : 'en'
}

/* ── card ── */
export function AssistantCard() {
  const open = useDomus((s) => s.assistantOpen)
  const setOpen = useDomus((s) => s.setAssistantOpen)
  const messages = useDomus((s) => s.messages)
  const thinking = useDomus((s) => s.thinking)
  const toast = useDomus((s) => s.toast)

  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [streamingId, setStreamingId] = useState<number | null>(null)
  const [lang, setLang] = useState<Lang>(initialLang)
  const [baseH, setBaseH] = useState(162)
  const [openH, setOpenH] = useState(OPEN_H)

  const root = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const scroller = useRef<HTMLDivElement | null>(null)
  const streamTimer = useRef<number | undefined>(undefined)
  const flush = useRef<(() => void) | null>(null)

  /* collapsed height = slot height; open height = from the room panel's top edge down to our bottom edge */
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const measure = () => {
      setBaseH(el.offsetHeight)
      const room = document.querySelector('[data-slot="room"]')
      if (!room) return setOpenH(OPEN_H)
      const r = el.getBoundingClientRect()
      const scale = r.height / (el.offsetHeight || 1) || 1
      setOpenH(Math.round((r.bottom - room.getBoundingClientRect().top) / scale))
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  useEffect(() => () => window.clearInterval(streamTimer.current), [])

  const stream = useCallback((id: number, full: string) => {
    const { patchMessage } = useDomus.getState()
    window.clearInterval(streamTimer.current)
    if (prefersReducedMotion()) {
      patchMessage(id, { text: full })
      setStreamingId(null)
      return
    }
    setStreamingId(id)
    let i = 0
    const step = Math.max(1, Math.ceil(full.length / 240))
    const done = () => {
      window.clearInterval(streamTimer.current)
      patchMessage(id, { text: full })
      setStreamingId(null)
      flush.current = null
    }
    flush.current = done
    streamTimer.current = window.setInterval(() => {
      i += step
      if (i >= full.length) done()
      else patchMessage(id, { text: full.slice(0, i) })
    }, CHAR_MS)
  }, [])

  const ask = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      const st = useDomus.getState()
      if (!text || st.thinking) return
      flush.current?.()
      setInput('')
      setOpen(true)
      setLang(detectLang(text))
      st.pushMessage({ role: 'user', text })
      st.setThinking(true)
      await new Promise((r) => window.setTimeout(r, prefersReducedMotion() ? 120 : THINK_MS))
      const reply = interpret(text)
      setLang(reply.lang)
      useDomus.getState().setThinking(false)
      const id = useDomus.getState().pushMessage({ role: 'assistant', text: '', actions: reply.actions })
      stream(id, reply.text)
    },
    [setOpen, stream],
  )

  const speech = useSpeech((t) => void ask(t))

  useEffect(() => {
    if (speech.error === 'unsupported') toast({ title: 'Voice input unavailable', detail: 'This browser has no speech recognition — type your request instead.', tone: 'warning' })
    else if (speech.error === 'denied') toast({ title: 'Microphone blocked', detail: 'Allow microphone access to talk to Domus.', tone: 'warning' })
  }, [speech.error, toast])

  /* close on outside pointer / Esc */
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  /* opened from elsewhere (palette, shortcut) → focus the field */
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true })
  }, [open])

  /* keep the latest message in view */
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [messages, thinking, open])

  const glow = open || focused || thinking || speech.listening
  const value = speech.listening && speech.interim ? speech.interim : input

  return (
    <div ref={root} className="relative h-full w-full">
      <Glass
        variant="frost"
        radius={28}
        specular={0.5}
        initial={false}
        animate={{ height: open ? Math.max(openH, baseH) : baseH }}
        transition={springs.glide}
        className={cn('absolute inset-x-0 bottom-0 flex flex-col overflow-hidden', open && 'z-50')}
        style={{
          background: 'linear-gradient(150deg, rgb(84 90 70 / 0.62) 0%, rgb(42 44 36 / 0.74) 100%)',
          boxShadow: glow
            ? 'inset 0 1px 0 rgb(255 255 255 / 0.3), 0 0 0 1px rgb(198 239 142 / 0.18), 0 0 46px -8px rgb(198 239 142 / 0.45), 0 24px 60px -24px rgb(20 18 14 / 0.5)'
            : undefined,
          transition: 'box-shadow 0.6s var(--ease-glass)',
        }}
      >
        {/* lime aurora */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]">
          <motion.div
            className="absolute -bottom-[64px] -left-[18%] h-[200px] w-[78%] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgb(198 239 142 / 0.62), rgb(169 215 124 / 0.22) 55%, transparent 100%)', filter: 'blur(18px)' }}
            animate={
              prefersReducedMotion()
                ? { opacity: glow ? 1 : 0.8 }
                : { opacity: glow ? [0.9, 1, 0.9] : 0.8, x: glow ? [0, 18, 0] : 0, scale: thinking ? [1, 1.12, 1] : 1 }
            }
            transition={{ duration: thinking ? 1.6 : 6, repeat: glow && !prefersReducedMotion() ? Infinity : 0, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-[22%] bottom-[4px] h-[146px] w-[46%] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgb(198 239 142 / 0.32), transparent 100%)', filter: 'blur(22px)' }}
            animate={{ opacity: glow ? 0.95 : 0.55 }}
            transition={{ duration: 0.8 }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, rgb(198 239 142 / 0.9), rgb(198 239 142 / 0.15) 55%, rgb(198 239 142 / 0.5))', filter: 'blur(1.5px)' }}
          />
          {/* top-right lime-cream sheen */}
          <div
            className="absolute -right-[10%] -top-[48px] h-[130px] w-[60%] rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgb(232 246 196 / 0.28), transparent 100%)', filter: 'blur(16px)' }}
          />
        </div>
        {/* lime-cream rim along the top-right edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
          style={{
            padding: 1.5,
            background: 'linear-gradient(205deg, rgb(240 250 210 / 0.95) 0%, rgb(214 240 170 / 0.55) 14%, rgb(198 239 142 / 0.12) 34%, transparent 48%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />

        {/* header */}
        <div className="relative z-[3] flex shrink-0 items-center gap-3 px-[18px] pt-[24px]">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#1d1e1a]"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #f4f4ee, #8d8f86 60%, #4b4c47)',
              boxShadow: 'inset 0 -2px 4px rgb(0 0 0 / 0.25), inset 0 1px 1px rgb(255 255 255 / 0.6), 0 6px 14px -6px rgb(0 0 0 / 0.55)',
            }}
          >
            <motion.span
              className="relative z-[3]"
              animate={thinking && !prefersReducedMotion() ? { rotate: 360 } : { rotate: 0 }}
              transition={thinking ? { duration: 2.4, repeat: Infinity, ease: 'linear' } : springs.soft}
            >
              <Sparkle size={17} strokeWidth={1.9} />
            </motion.span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] leading-tight text-white">Home AI Assistants</div>
            <div className="mt-0.5 text-[11.5px] leading-tight text-white/60">Optimize and control your home with the help of AI</div>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.snappy}
              className="absolute right-3 top-3 z-[5]"
            >
              <IconButton icon={X} label="Close assistant" size={30} iconSize={14} onClick={() => setOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* conversation */}
        <div className="relative z-[3] min-h-0 flex-1">
          <AnimatePresence>
            {open && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.15 } }}
                transition={{ duration: 0.35, delay: 0.12 }}
                className="absolute inset-0 flex flex-col"
              >
                <div
                  ref={scroller}
                  className="scroll-thin flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-[18px] pb-2 pt-4"
                  style={{ maskImage: 'linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 10px), transparent 100%)' }}
                  aria-live="polite"
                >
                  {messages.length === 0 && (
                    <Bubble m={{ id: -1, role: 'assistant', text: WELCOME[lang === 'pt' ? 1 : lang === 'es' ? 2 : 0] }} streaming={false} />
                  )}
                  {messages.map((m) => (
                    <Bubble key={m.id} m={m} streaming={m.id === streamingId} />
                  ))}
                  <AnimatePresence>{thinking && <Thinking key="thinking" />}</AnimatePresence>
                </div>
                <div
                  className="flex shrink-0 gap-1.5 overflow-x-auto px-[18px] pb-2.5 pt-1 [scrollbar-width:none]"
                  style={{ maskImage: 'linear-gradient(to right, transparent 0, #000 16px, #000 calc(100% - 24px), transparent 100%)' }}
                >
                  {SUGGESTIONS[lang].map((sug, i) => (
                    <motion.button
                      key={sug}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springs.soft, delay: 0.18 + i * 0.04 }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={thinking}
                      onClick={() => void ask(sug)}
                      className="glass glass-pill h-8 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 text-[11.5px] text-white/80 transition-colors hover:text-white disabled:opacity-50"
                    >
                      <span className="relative z-[3]">{sug}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* composer */}
        <form
          className="relative z-[3] shrink-0 px-[16px] pb-[22px]"
          onSubmit={(e) => {
            e.preventDefault()
            void ask(value)
          }}
        >
          <div
            className="glass glass-well flex h-[46px] items-center gap-2 rounded-full pl-[18px] pr-[6px]"
            style={{
              background: 'rgb(30 31 27 / 0.72)',
              boxShadow: focused ? 'inset 0 0 0 1px rgb(198 239 142 / 0.4), 0 0 0 3px rgb(198 239 142 / 0.1), 0 12px 30px -20px rgb(0 0 0 / 0.6)' : undefined,
              transition: 'box-shadow 0.35s var(--ease-glass)',
            }}
          >
            <div className="relative z-[3] min-w-0 flex-1">
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  setFocused(true)
                  if (useDomus.getState().messages.length) setOpen(true)
                }}
                onBlur={() => setFocused(false)}
                placeholder={speech.listening ? '' : 'Ask me something about your home.'}
                aria-label="Ask the home assistant"
                enterKeyHint="send"
                autoComplete="off"
                className="h-[46px] w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/50 focus-visible:outline-none"
              />
              {speech.listening && !speech.interim && (
                <div className="pointer-events-none absolute inset-0 flex items-center gap-2.5">
                  <Waveform level={speech.level} />
                  <span className="text-[12px] text-white/55">Listening…</span>
                </div>
              )}
            </div>
            <AnimatePresence mode="popLayout" initial={false}>
              {value.trim() && !speech.listening ? (
                <motion.button
                  key="send"
                  type="submit"
                  aria-label="Send"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.bouncy}
                  disabled={thinking}
                  className="relative z-[3] grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full bg-lime-glow text-ink shadow-[0_0_16px_rgb(198_239_142/0.5)] disabled:opacity-60"
                >
                  <ArrowUp size={16} strokeWidth={2.2} />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  type="button"
                  aria-label={speech.listening ? 'Stop listening' : 'Speak to the assistant'}
                  aria-pressed={speech.listening}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.9 }}
                  transition={springs.bouncy}
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  className={cn(
                    'relative z-[3] grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full transition-colors duration-300',
                    speech.listening ? 'bg-lime-glow text-ink' : 'text-white ring-[1.5px] ring-white/75 ring-inset hover:bg-white/10',
                  )}
                >
                  {speech.listening && !prefersReducedMotion() && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full ring-2 ring-lime-glow"
                      animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <Mic size={15} strokeWidth={1.8} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>
      </Glass>
    </div>
  )
}
