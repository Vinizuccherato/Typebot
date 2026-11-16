import { useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bookmark, Eye, Share2, Sparkles } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { BROW_COLORS, FRAME_MATCH, HAIR_COLORS, useFacet, type BrowFormId, type GlassesId, type TryTab } from '../store'
import { FaceView } from '../three/FaceView'
import { cn, springs } from '../lib/utils'
import { TopBar } from './parts4/TopBar'
import { Segmented } from './parts4/Segmented'
import { GooeyRow } from './parts4/GooeyRow'
import { BrowArt, GlassesArt } from './parts4/art'

const FRAME_NAMES: Record<Exclude<GlassesId, 'none'>, string> = {
  wayfarer: 'Wayfarer',
  aviator: 'Aviator',
  round: 'Round',
  browline: 'Browline',
  cateye: 'Cat-eye',
  rimless: 'Rimless',
}

const FRAME_WHY: Record<Exclude<GlassesId, 'none'>, string> = {
  wayfarer: 'Straight brow line adds structure to soft, oval curves.',
  aviator: 'The teardrop follows your cheekbones and lifts the eye line.',
  round: 'Gentle curves echo your oval outline for a calm, balanced look.',
  browline: 'A strong top bar frames the brows and shortens the midface slightly.',
  cateye: 'Lifted outer corners draw the eye up toward the temples.',
  rimless: 'Almost invisible — keeps the focus on your natural proportions.',
}

const BROW_FORMS: { id: BrowFormId; label: string }[] = [
  { id: 'soft-arch', label: 'Soft arch' },
  { id: 'straight', label: 'Straight' },
  { id: 'high-arch', label: 'High arch' },
  { id: 'rounded', label: 'Rounded' },
  { id: 's-shaped', label: 'S-shaped' },
  { id: 'bold-flat', label: 'Bold flat' },
]

const BROW_WHY: Record<BrowFormId, string> = {
  'soft-arch': 'A soft lift above the outer iris mirrors your cheekbone line.',
  straight: 'A straighter brow shortens the face visually and reads relaxed.',
  'high-arch': 'A high peak adds drama — strongest with an editorial vibe.',
  rounded: 'Rounded brows soften angles; subtle on an oval face.',
  's-shaped': 'A defined head and lifted tail give a sculpted, groomed look.',
  'bold-flat': 'Full, flat brows add weight to the upper third.',
}

function Swatches({ colors, value, onChange, label }: { colors: string[]; value: string; onChange: (c: string) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const i = Math.max(0, colors.indexOf(value))
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-3">
      {colors.map((c, k) => {
        const on = k === i
        return (
          <button
            key={c}
            ref={(el) => void (refs.current[k] = el)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${label} ${k + 1}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(c)}
            onKeyDown={(e) => {
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
              if (!d) return
              e.preventDefault()
              const n = (k + d + colors.length) % colors.length
              onChange(colors[n])
              refs.current[n]?.focus()
            }}
            className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none"
          >
            {on && <motion.span layoutId={`ring-${label}`} className="absolute inset-0 rounded-full border-2 border-[var(--color-porcelain)]" transition={springs.snappy} />}
            <span className="h-8 w-8 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${c}cc, ${c} 60%)`, boxShadow: 'inset 0 1px 1px rgb(255 255 255 / 0.25), 0 4px 10px -4px rgb(0 0 0 / 0.6)' }} />
          </button>
        )
      })}
    </div>
  )
}

export function TryOnScreen() {
  const { mode } = useScreen()
  const back = useFacet((s) => s.back)
  const shape = useFacet((s) => s.analysis.shape)
  const tab = useFacet((s) => s.tryTab)
  const setTab = useFacet((s) => s.setTryTab)
  const look = useFacet((s) => s.look)
  const setLook = useFacet((s) => s.setLook)
  const saveLook = useFacet((s) => s.saveLook)
  const saved = useFacet((s) => s.savedLooks.length)
  const comparing = useFacet((s) => s.comparing)
  const setComparing = useFacet((s) => s.setComparing)
  const toast = useFacet((s) => s.toast)

  const frames = useMemo(() => {
    const m = FRAME_MATCH[shape]
    return (Object.keys(FRAME_NAMES) as Exclude<GlassesId, 'none'>[]).map((id) => ({ id, match: m[id] ?? 70 })).sort((a, b) => b.match - a.match)
  }, [shape])
  const best = frames[0].id

  // "compare" shows the bare face: no frames, default brows
  const shown = comparing ? { ...look, glasses: 'none' as GlassesId, browForm: 'straight' as BrowFormId } : look

  const why =
    tab === 'eyewear'
      ? look.glasses === 'none'
        ? 'No frames — your proportions speak for themselves.'
        : FRAME_WHY[look.glasses]
      : tab === 'brows'
        ? BROW_WHY[look.browForm]
        : look.hairPart === 'side'
          ? 'A side part adds asymmetry and lift at the crown.'
          : 'A centre part frames an oval face evenly.'

  return (
    <ScreenFrame background="radial-gradient(90% 55% at 50% 28%, #33263f 0%, #16111b 60%, #0e0c12 100%)">
      <TopBar
        title="Try-on"
        onBack={mode === 'app' ? back : undefined}
        trailing={
          <span className="glass glass-pill relative inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-[12.5px] font-semibold" aria-label={`${saved} saved looks`}>
            <Bookmark size={14} className="relative z-[3]" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={saved} className="relative z-[3] tabular" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
                {saved}
              </motion.span>
            </AnimatePresence>
          </span>
        }
      />

      {/* live avatar */}
      <div className="absolute inset-x-0 top-[104px] h-[372px]">
        <FaceView subject="face" material="skin" accessories interactive look={shown} framing="bust" className="absolute inset-0" />
        <div className="absolute left-5 top-2 z-[3] flex flex-col gap-2">
          <span className="glass glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold">
            <Sparkles size={13} className="relative z-[3] text-[var(--champagne)]" />
            <span className="relative z-[3]">Tuned for {shape}</span>
          </span>
        </div>
        <AnimatePresence>
          {comparing && (
            <motion.span
              className="absolute right-5 top-2 z-[3] inline-flex h-8 items-center rounded-full bg-[var(--color-porcelain)] px-3 text-[12px] font-semibold text-[var(--color-ink)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              Before
            </motion.span>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(180deg, transparent, #120e17)' }} />
      </div>

      {/* controls */}
      <div className="absolute inset-x-0 top-[476px]">
        <div className="px-5">
          <Segmented<TryTab>
            label="Category"
            value={tab}
            onChange={setTab}
            options={[
              { id: 'eyewear', label: 'Eyewear' },
              { id: 'brows', label: 'Brows' },
              { id: 'hair', label: 'Hair' },
            ]}
          />
        </div>

        <div className="mt-3 h-[150px]">
          <AnimatePresence mode="wait" initial={false}>
            {tab === 'eyewear' && (
              <motion.div key="eyewear" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div data-wheel role="radiogroup" aria-label="Frames" className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                  {frames.map((f) => {
                    const on = look.glasses === f.id
                    return (
                      <motion.button
                        key={f.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${FRAME_NAMES[f.id]}, ${f.match}% match`}
                        onClick={() => setLook({ glasses: on ? 'none' : f.id })}
                        whileTap={{ scale: 0.96 }}
                        transition={springs.snappy}
                        className="glass glass-frost relative flex h-[136px] w-[112px] shrink-0 cursor-pointer snap-start flex-col items-center justify-between rounded-[22px] px-2 pb-3 pt-2.5 outline-none"
                        style={on ? { ['--g-edge-a' as string]: 'rgb(195 180 255 / 0.95)', ['--g-fill-a' as string]: 'rgb(195 180 255 / 0.16)' } : undefined}
                      >
                        <span
                          className={cn(
                            'relative z-[3] self-end rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular',
                            f.match >= 90 ? 'bg-[var(--lilac)] text-[var(--color-ink)]' : 'bg-white/10 text-[var(--text-2)]',
                          )}
                        >
                          {f.match}%
                        </span>
                        <span className="relative z-[3] grid h-12 place-items-center rounded-2xl bg-white/90 px-2">
                          <GlassesArt id={f.id} size={76} />
                        </span>
                        <span className="relative z-[3] text-center">
                          <span className="block text-[13px] font-semibold">{FRAME_NAMES[f.id]}</span>
                          {f.id === best && <span className="block text-[10.5px] font-semibold text-[var(--champagne)]">Best for {shape}</span>}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {tab === 'brows' && (
              <motion.div key="brows" className="px-5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div role="radiogroup" aria-label="Brow shape" className="grid grid-cols-3 gap-2">
                  {BROW_FORMS.map((b) => {
                    const on = look.browForm === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={b.label}
                        onClick={() => setLook({ browForm: b.id })}
                        className={cn('relative h-11 cursor-pointer overflow-hidden rounded-[14px] outline-none transition-transform active:scale-95', on ? 'ring-2 ring-[var(--color-porcelain)]' : 'ring-1 ring-white/10')}
                      >
                        <BrowArt form={b.id} color={look.browColor} width={112} height={44} />
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <Swatches colors={BROW_COLORS} value={look.browColor} onChange={(c) => setLook({ browColor: c })} label="Brow colour" />
                </div>
              </motion.div>
            )}

            {tab === 'hair' && (
              <motion.div key="hair" className="px-5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <span className="label">Colour</span>
                <div className="mt-2">
                  <Swatches colors={HAIR_COLORS} value={look.hairColor} onChange={(c) => setLook({ hairColor: c })} label="Hair colour" />
                </div>
                <span className="label mt-3 block">Part</span>
                <div className="mt-2 w-[220px]">
                  <Segmented
                    label="Hair part"
                    size="sm"
                    value={look.hairPart}
                    onChange={(v) => setLook({ hairPart: v })}
                    options={[
                      { id: 'centre', label: 'Centre' },
                      { id: 'side', label: 'Side' },
                    ]}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-1 h-10 px-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={why} className="flex items-start gap-2 text-[12.5px] leading-[1.4] text-[var(--text-2)]" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
              <Sparkles size={13} className="mt-[2px] shrink-0 text-[var(--lilac)]" />
              <span>
                <span className="font-semibold text-[var(--text)]">Why it suits you · </span>
                {why}
              </span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* metaball action row (ring-app lineage) */}
      <div className="absolute inset-x-5 bottom-[40px]">
        <GooeyRow
          left={{ icon: <Eye size={20} />, label: 'Hold to compare with no changes', onHoldStart: () => setComparing(true), onHoldEnd: () => setComparing(false), active: comparing }}
          center={{ label: <><Bookmark size={17} /> Save look</>, ariaLabel: 'Save this look', onPress: saveLook }}
          right={{ icon: <Share2 size={19} />, label: 'Share look', onPress: () => toast({ title: 'Ready to share', detail: 'A preview card was created' }) }}
        />
      </div>
    </ScreenFrame>
  )
}
