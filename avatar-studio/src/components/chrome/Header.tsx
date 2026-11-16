import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, LogOut, MoreHorizontal, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { isDirty, useStudio } from '../../store'
import { IconButton } from '../../ui/IconButton'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { cn, springs } from '../../lib/utils'
import { MenuItem, Popover } from '../kit'

/** Soft gradient monogram — the profile thumbnail (no photo). */
function Monogram({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full text-[15px] font-medium text-white"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 30% 25%, #f6d9cf, #d79f95 45%, #8f7aa8 100%)',
        boxShadow: 'inset 0 1px 1px rgb(255 255 255 / 0.6), 0 0 0 2px rgb(255 255 255 / 0.65), 0 6px 14px -6px rgb(60 64 90 / 0.45)',
        textShadow: '0 1px 4px rgb(60 40 60 / 0.35)',
      }}
    >
      AV
    </span>
  )
}

/** In-page confirm dialog (the viewer blocks window.confirm). */
function LeaveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const save = useStudio((s) => s.save)
  const edit = useStudio((s) => s.edit)
  const toast = useStudio((s) => s.toast)
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    requestAnimationFrame(() => first.current?.focus())
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgb(60_64_90/0.25)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <div style={{ transform: 'scale(var(--s))' }}>
          <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 6 }} transition={springs.snappy}>
            <Glass
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="leave-title"
              radius={26}
              className="w-[380px] p-6 text-[var(--text)]"
              style={{ background: 'linear-gradient(150deg, rgb(255 255 255 / 0.85), rgb(238 239 247 / 0.78))' }}
            >
              <div className="relative z-[3]">
                <h2 id="leave-title" className="text-[19px] font-medium">Leave with unsaved changes?</h2>
                <p className="mt-1.5 text-[13.5px] leading-snug text-[var(--text-2)]">Your latest edits to the avatar haven’t been saved yet.</p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    ref={first}
                    type="button"
                    onClick={() => {
                      save()
                      onClose()
                    }}
                    className="glass glass-ink h-11 cursor-pointer rounded-full text-[13px] font-medium uppercase tracking-[0.14em] outline-none"
                  >
                    <span className="relative z-[3]">Save &amp; exit</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        edit(useStudio.getState().saved)
                        onClose()
                        toast({ title: 'Changes discarded', detail: 'Undo brings them back' })
                      }}
                      className="h-11 cursor-pointer rounded-full text-[13px] text-[#c2413a] outline-none transition-colors hover:bg-[rgb(194_65_58/0.08)]"
                    >
                      Discard
                    </button>
                    <button type="button" onClick={onClose} className="h-11 cursor-pointer rounded-full text-[13px] text-[var(--text)] outline-none transition-colors hover:bg-[rgb(60_64_90/0.07)]">
                      Keep editing
                    </button>
                  </div>
                </div>
              </div>
            </Glass>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function Header() {
  const dirty = useStudio(isDirty)
  const canUndo = useStudio((s) => s.past.length > 0)
  const canRedo = useStudio((s) => s.future.length > 0)
  const undo = useStudio((s) => s.undo)
  const redo = useStudio((s) => s.redo)
  const save = useStudio((s) => s.save)
  const reset = useStudio((s) => s.reset)
  const recenter = useStudio((s) => s.recenter)
  const toast = useStudio((s) => s.toast)
  const { mode } = useArtboard()
  const compact = mode === 'compact'
  const [leaving, setLeaving] = useState(false)
  const [menu, setMenu] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const menuRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!justSaved) return
    const t = window.setTimeout(() => setJustSaved(false), 1500)
    return () => window.clearTimeout(t)
  }, [justSaved])

  return (
    <header className="flex h-full w-full items-center gap-4">
      <IconButton
        icon={LogOut}
        label="Exit appearance settings"
        size={compact ? 44 : 50}
        iconSize={18}
        className="text-white [&_svg]:-scale-x-100"
        onClick={() => (dirty ? setLeaving(true) : toast({ title: 'All changes are saved', detail: 'Nothing to lose here' }))}
      />
      {!compact && <Monogram size={46} />}
      <h1 className={cn('min-w-0 truncate font-normal tracking-[-0.01em] text-white', compact ? 'text-[18px] leading-tight' : 'text-[27px]')} style={{ textShadow: '0 1px 10px rgb(60 64 90 / 0.25)' }}>
        {compact ? 'Appearance' : 'Appearance settings'}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        {!compact && (
          <>
            <IconButton icon={Undo2} label="Undo (⌘Z)" size={44} iconSize={17} className={cn('text-white', !canUndo && 'pointer-events-none opacity-40')} aria-disabled={!canUndo} onClick={undo} />
            <IconButton icon={Redo2} label="Redo (⇧⌘Z)" size={44} iconSize={17} className={cn('text-white', !canRedo && 'pointer-events-none opacity-40')} aria-disabled={!canRedo} onClick={redo} />
          </>
        )}
        <IconButton ref={menuRef} icon={MoreHorizontal} label="More options" size={44} iconSize={17} className="mr-2 text-white" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((o) => !o)} />
        <Popover open={menu} onClose={() => setMenu(false)} anchor={menuRef} placement="bottom" align="end" label="More options" width={220}>
          {compact && (
            <>
              <MenuItem onClick={() => (undo(), setMenu(false))}>
                <span className="flex items-center gap-2"><Undo2 size={15} /> Undo</span>
              </MenuItem>
              <MenuItem onClick={() => (redo(), setMenu(false))}>
                <span className="flex items-center gap-2"><Redo2 size={15} /> Redo</span>
              </MenuItem>
            </>
          )}
          <MenuItem onClick={() => (recenter(), setMenu(false))}>Recenter view</MenuItem>
          <MenuItem
            danger
            onClick={() => {
              reset()
              setMenu(false)
              toast({ title: 'Reset to defaults', detail: 'Undo with ⌘Z' })
            }}
          >
            <span className="flex items-center gap-2"><RotateCcw size={15} /> Reset all</span>
          </MenuItem>
        </Popover>

        <motion.button
          type="button"
          onClick={() => {
            if (!dirty) return
            save()
            setJustSaved(true)
          }}
          aria-disabled={!dirty}
          whileHover={dirty ? { scale: 1.02 } : undefined}
          whileTap={dirty ? { scale: 0.97 } : undefined}
          transition={springs.snappy}
          className={cn(
            'glass relative flex items-center justify-center rounded-full text-[13px] font-medium uppercase tracking-[0.18em] outline-none transition-[filter,opacity] duration-300',
            compact ? 'h-[46px] w-[92px]' : 'h-[56px] w-[280px]',
            dirty || justSaved ? 'glass-ink cursor-pointer' : 'glass-pill cursor-default text-white/80',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justSaved ? 'saved' : 'save'}
              className="relative z-[3] flex items-center gap-2"
              initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: 0.2 }}
            >
              {justSaved ? (
                <>
                  <Check size={16} strokeWidth={2.4} /> Saved
                </>
              ) : (
                'Save'
              )}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
      <LeaveDialog open={leaving} onClose={() => setLeaving(false)} />
    </header>
  )
}
