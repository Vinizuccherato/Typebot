import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { History, MoreHorizontal, Share2, type LucideIcon } from 'lucide-react'
import { useSoma } from '../../store'
import { IconButton } from '../../ui/IconButton'
import { Popover } from './kit'

function RailButton({ icon, label, onClick, btnRef }: { icon: LucideIcon; label: string; onClick: () => void; btnRef?: React.Ref<HTMLButtonElement> }) {
  const [hover, setHover] = useState(false)
  return (
    <div className="relative" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <IconButton ref={btnRef} icon={icon} label={label} size={40} iconSize={15} onClick={onClick} onFocus={() => setHover(true)} onBlur={() => setHover(false)} />
      <AnimatePresence>
        {hover && (
          <motion.span
            role="tooltip"
            className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[var(--ink)] px-2.5 py-1 text-[11px] text-white"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Quick actions: history, share report, more. */
export function SideRail() {
  const setExpanded = useSoma((s) => s.setExpanded)
  const toast = useSoma((s) => s.toast)
  const stats = useSoma((s) => s.stats)
  const [more, setMore] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)

  const share = async () => {
    const text = `Soma · avg ${stats.avg} mg/dl · ${stats.timeInRange}% in range today`
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Summary copied', detail: text, tone: 'success' })
    } catch {
      toast({ title: 'Summary ready', detail: text })
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-between py-1">
      <RailButton icon={History} label="24 h history" onClick={() => setExpanded('glucose')} />
      <RailButton icon={Share2} label="Share summary" onClick={share} />
      <RailButton icon={MoreHorizontal} label="More" onClick={() => setMore((m) => !m)} btnRef={moreRef} />
      <Popover anchor={moreRef} open={more} onClose={() => setMore(false)} side="left" width={200} label="More actions">
        <div className="flex flex-col gap-1 text-[12.5px]">
          {[
            ['Score breakdown', () => setExpanded('score')],
            ['Lipid panel', () => setExpanded('cholesterol')],
            ['Export CSV', () => toast({ title: 'Export prepared', detail: '288 readings · today' })],
          ].map(([l, fn]) => (
            <button
              key={l as string}
              type="button"
              onClick={() => {
                ;(fn as () => void)()
                setMore(false)
              }}
              className="cursor-pointer rounded-xl px-2.5 py-2 text-left outline-none transition-colors hover:bg-black/[0.05]"
            >
              {l as string}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  )
}
