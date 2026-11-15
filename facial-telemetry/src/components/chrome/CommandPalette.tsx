import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CornerDownLeft, Crosshair, Layers, RotateCcw, ScanFace, Search, SquareStack } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useFace, TABS, type Overlays } from '../../store'
import { FEATURES, type FeatureId } from '../../lib/face'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { springs } from '../../lib/utils'

interface Command {
  id: string
  group: 'Features' | 'Overlays' | 'Views' | 'Actions'
  label: string
  hint?: string
  icon: LucideIcon
  run: () => void
}

const OVERLAY_LABEL: Record<keyof Overlays, string> = {
  thirds: 'Facial thirds',
  fifths: 'Rule of fifths',
  golden: 'Golden ratio',
  symmetry: 'Symmetry axis',
  landmarks: 'Landmarks',
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** ⌘K command palette: jump to a facial feature, toggle overlays, switch views. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { scale, mode } = useArtboard()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const overlays = useFace((s) => s.overlays)
  const tab = useFace((s) => s.tab)

  const commands = useMemo<Command[]>(() => {
    const s = useFace.getState
    return [
      ...(Object.keys(FEATURES) as FeatureId[]).map((id) => ({
        id: `f-${id}`,
        group: 'Features' as const,
        label: FEATURES[id].label,
        hint: 'Inspect proportions',
        icon: Crosshair,
        run: () => {
          s().setTool('inspect')
          s().select(id)
        },
      })),
      ...(Object.keys(OVERLAY_LABEL) as (keyof Overlays)[]).map((k) => ({
        id: `o-${k}`,
        group: 'Overlays' as const,
        label: `${overlays[k] ? 'Hide' : 'Show'} ${OVERLAY_LABEL[k].toLowerCase()}`,
        hint: overlays[k] ? 'On' : 'Off',
        icon: Layers,
        run: () => s().toggleOverlay(k),
      })),
      ...TABS.map((t) => ({
        id: `t-${t.id}`,
        group: 'Views' as const,
        label: t.label,
        hint: t.id === tab ? 'Current' : undefined,
        icon: SquareStack,
        run: () => s().setTab(t.id),
      })),
      { id: 'a-reset', group: 'Actions', label: 'Reset camera', icon: RotateCcw, run: () => s().resetView() },
      {
        id: 'a-rescan',
        group: 'Actions',
        label: 'Run a new scan',
        icon: ScanFace,
        run: () => {
          s().rescan()
          s().toast({ title: 'Scanning', detail: 'Hold still for a few seconds' })
        },
      },
    ]
  }, [overlays, tab])

  const results = useMemo(() => {
    const n = norm(q.trim())
    return n ? commands.filter((c) => norm(`${c.label} ${c.group}`).includes(n)) : commands
  }, [q, commands])

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    input.current?.focus()
  }, [open])
  useEffect(() => setActive(0), [q])

  const exec = (c: Command | undefined) => {
    if (!c) return
    c.run()
    onClose()
  }

  const groups = (['Features', 'Overlays', 'Views', 'Actions'] as const)
    .map((g) => ({ g, items: results.filter((r) => r.group === g) }))
    .filter((x) => x.items.length)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="relative" style={{ marginTop: '14vh', transform: `scale(${mode === 'desktop' ? scale : 1})`, transformOrigin: 'top center' }}>
            <motion.div initial={{ y: -12, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: -8, scale: 0.97 }} transition={springs.snappy}>
              <Glass
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                variant="frost"
                radius={22}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-[min(560px,calc(100vw-32px))] overflow-hidden"
                style={{ ['--g-fill-a' as string]: 'rgb(26 38 35 / 0.92)', ['--g-fill-b' as string]: 'rgb(10 16 15 / 0.9)' }}
              >
                <div className="relative z-[3] flex items-center gap-3 border-b border-white/[0.07] px-4">
                  <Search size={16} strokeWidth={1.6} className="text-white/50" />
                  <input
                    ref={input}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(results.length - 1, a + 1)))
                      if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)))
                      if (e.key === 'Enter') exec(results[active])
                      if (e.key === 'Escape') onClose()
                    }}
                    placeholder="Jump to a feature, overlay or view…"
                    aria-label="Search commands"
                    aria-controls="palette-list"
                    aria-activedescendant={results[active] ? `pc-${results[active].id}` : undefined}
                    className="h-14 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35"
                    style={{ outline: 'none' }}
                  />
                  <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10.5px] text-white/45">Esc</kbd>
                </div>
                <div id="palette-list" role="listbox" className="relative z-[3] max-h-[380px] overflow-y-auto p-2">
                  {groups.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-white/45">No command matches “{q}”.</p>}
                  {groups.map(({ g, items }) => (
                    <div key={g} className="mb-1">
                      <p className="px-3 pb-1 pt-2 text-[10.5px] uppercase tracking-[0.08em] text-white/35">{g}</p>
                      {items.map((c) => {
                        const i = results.indexOf(c)
                        const on = i === active
                        const Icon = c.icon
                        return (
                          <div
                            key={c.id}
                            id={`pc-${c.id}`}
                            role="option"
                            aria-selected={on}
                            onPointerMove={() => setActive(i)}
                            onClick={() => exec(c)}
                            className="relative flex cursor-pointer items-center gap-3 rounded-[13px] px-3 py-2.5 text-[13.5px]"
                          >
                            {on && <motion.span layoutId="pal-hl" className="absolute inset-0 rounded-[13px] bg-white/[0.08]" transition={springs.snappy} />}
                            <Icon size={15} strokeWidth={1.6} className={`relative ${on ? 'text-[var(--mint)]' : 'text-white/50'}`} />
                            <span className="relative flex-1 text-white/90">{c.label}</span>
                            {c.hint && <span className="relative text-[11.5px] text-white/40">{c.hint}</span>}
                            {on && <CornerDownLeft size={13} className="relative text-white/40" />}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </Glass>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
