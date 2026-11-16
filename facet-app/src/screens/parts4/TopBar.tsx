import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'

/** Screen nav bar: 44pt back button, centred title, optional trailing control (sits under the safe area). */
export function TopBar({ title, onBack, trailing }: { title: string; onBack?: () => void; trailing?: ReactNode }) {
  return (
    <div className="absolute inset-x-0 top-[59px] z-30 flex h-11 items-center justify-between px-3">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className="glass glass-pill grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
          <ChevronLeft size={20} className="relative z-[3]" />
        </button>
      ) : (
        <span className="w-11" />
      )}
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="flex w-11 justify-end">{trailing}</span>
    </div>
  )
}
