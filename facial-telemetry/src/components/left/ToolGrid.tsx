import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Layers, Minus, Plus, Rotate3d, RotateCcw, Ruler, ScanFace, type LucideIcon } from 'lucide-react'
import { useFace, type Overlays, type ToolId } from '../../store'
import { Toggle } from '../../ui/Toggle'
import { useArtboard } from '../../layout/Artboard'
import { springs, cn } from '../../lib/utils'
import { Popover } from '../chrome/Popover'

const TOOLS: { id: ToolId; label: string; hint: string; icon: LucideIcon }[] = [
  { id: 'rotate', label: 'Rotate', hint: 'Drag to orbit the head', icon: Rotate3d },
  { id: 'inspect', label: 'Inspect', hint: 'Click a feature to analyse it', icon: ScanFace },
  { id: 'measure', label: 'Measure', hint: 'Show distances between landmarks', icon: Ruler },
  { id: 'layers', label: 'Layers', hint: 'Proportion overlays', icon: Layers },
]

const OVERLAYS: { id: keyof Overlays; label: string; hint: string }[] = [
  { id: 'thirds', label: 'Facial thirds', hint: 'Hairline · brow · nose · chin' },
  { id: 'fifths', label: 'Rule of fifths', hint: 'Five eye-widths across' },
  { id: 'golden', label: 'Golden ratio', hint: '1 : 1.618 construction' },
  { id: 'symmetry', label: 'Symmetry axis', hint: 'Mirrored left/right deltas' },
  { id: 'landmarks', label: 'Landmarks', hint: '32 anatomical points' },
]

function Tile({ tool, active, onClick, btnRef }: { tool: (typeof TOOLS)[number]; active: boolean; onClick: () => void; btnRef?: React.Ref<HTMLButtonElement> }) {
  const Icon = tool.icon
  return (
    <motion.button
      ref={btnRef}
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={`${tool.label} — ${tool.hint}`}
      title={tool.label}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.9 }}
      transition={springs.snappy}
      className={cn(
        'glass relative grid h-14 w-14 cursor-pointer place-items-center rounded-[16px] outline-none',
        active ? 'glass-ink' : 'glass-pill text-white/70 hover:text-white',
      )}
    >
      <Icon size={19} strokeWidth={1.6} className="relative z-[3]" />
    </motion.button>
  )
}

function ZoomCapsule({ vertical }: { vertical: boolean }) {
  const zoom = useFace((s) => s.zoom)
  const reset = useFace((s) => s.resetView)
  const btn = 'relative z-[3] grid h-9 w-9 cursor-pointer place-items-center rounded-full text-white/70 outline-none transition-colors hover:bg-white/[0.08] hover:text-white active:scale-90'
  return (
    <div className={cn('glass glass-pill flex items-center justify-between rounded-full p-1', vertical ? 'h-full w-11 flex-col' : 'h-11 flex-row')} role="group" aria-label="Zoom">
      <button type="button" aria-label="Zoom in" title="Zoom in" className={btn} onClick={() => zoom(1)}>
        <Plus size={16} strokeWidth={1.7} />
      </button>
      <button type="button" aria-label="Reset view" title="Reset view" className={btn} onClick={reset}>
        <RotateCcw size={14} strokeWidth={1.7} />
      </button>
      <button type="button" aria-label="Zoom out" title="Zoom out" className={btn} onClick={() => zoom(-1)}>
        <Minus size={16} strokeWidth={1.7} />
      </button>
    </div>
  )
}

/** Viewer tools (2×2, as in the reference) + zoom capsule + overlay layers popover. */
export function ToolGrid() {
  const tool = useFace((s) => s.tool)
  const setTool = useFace((s) => s.setTool)
  const overlays = useFace((s) => s.overlays)
  const toggle = useFace((s) => s.toggleOverlay)
  const { mode } = useArtboard()
  const [layers, setLayers] = useState(false)
  const layersRef = useRef<HTMLButtonElement>(null)
  const compact = mode === 'compact'

  return (
    <div className="relative h-full w-full">
      <div className="grid h-full w-full grid-cols-2 place-items-center gap-3" role="radiogroup" aria-label="Viewer tool">
        {TOOLS.map((t) => (
          <Tile
            key={t.id}
            tool={t}
            active={t.id === 'layers' ? layers || tool === 'layers' : tool === t.id}
            btnRef={t.id === 'layers' ? layersRef : undefined}
            onClick={() => (t.id === 'layers' ? setLayers((o) => !o) : setTool(t.id))}
          />
        ))}
      </div>
      {!compact && (
        <div className="absolute -left-[58px] top-0 h-full py-1">
          <ZoomCapsule vertical />
        </div>
      )}
      <Popover anchor={layersRef} open={layers} onClose={() => setLayers(false)} side="right" width={270} label="Proportion overlays">
        <p className="px-3 pb-1 pt-2 text-[10.5px] uppercase tracking-[0.08em] text-white/40">Proportion overlays</p>
        {OVERLAYS.map((o) => (
          <div key={o.id} className="flex items-center gap-3 rounded-[13px] px-3 py-2">
            <span className="flex-1">
              <span className="block text-[13px] text-white/90">{o.label}</span>
              <span className="block text-[11px] text-white/45">{o.hint}</span>
            </span>
            <Toggle size="sm" checked={overlays[o.id]} onChange={(v) => toggle(o.id, v)} label={o.label} />
          </div>
        ))}
      </Popover>
    </div>
  )
}
