import { Server } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { useArtboard } from '../../layout/Artboard'
import { cn } from '../../lib/utils'
import { LampCard } from './LampCard'
import { LedCard } from './LedCard'
import { EQ_CSS, SpeakerCard } from './SpeakerCard'
import { ZonePill } from './Zones'

/** Deep warm smoke — measured against the reference panel (#423e3b). */
const PANEL_MATERIAL = {
  '--g-fill-a': 'rgb(52 49 46 / 0.74)',
  '--g-fill-b': 'rgb(24 23 21 / 0.82)',
  '--g-blur': '32px',
  '--g-sat': '130%',
} as React.CSSProperties

/** Smart Devices — bottom-centre smoked-glass panel (700×282 on the 1600×900 canvas). */
export function SmartDevices() {
  const { mode } = useArtboard()
  const compact = mode === 'compact'

  return (
    <Glass
      variant="smoke"
      radius={32}
      specular={0.45}
      className={cn('@container flex w-full flex-col px-[18px] pb-4 pt-[18px]', compact ? 'min-h-[282px]' : 'h-full')}
      style={PANEL_MATERIAL}
    >
      <style>{EQ_CSS}</style>

      <header className="relative z-30 flex h-[44px] shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5 @max-sm:gap-2.5">
          <span className="glass glass-well grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full @max-sm:h-[38px] @max-sm:w-[38px]">
            <Server size={17} strokeWidth={1.6} className="relative z-[3] text-white/90" />
          </span>
          <h2 className="truncate text-[19px] font-normal tracking-[-0.01em] text-white/95 @max-sm:text-[17px]">Smart Devices</h2>
        </div>
        <ZonePill />
      </header>

      {compact ? (
        <div className="scroll-thin relative z-[3] -mx-[18px] mt-3 flex snap-x snap-mandatory gap-[14px] overflow-x-auto px-[18px] pb-1 [scroll-padding-inline:18px]">
          {[LampCard, LedCard, SpeakerCard].map((Card, i) => (
            <div key={i} className="h-[190px] w-[212px] shrink-0 snap-start">
              <Card />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative z-[3] mt-3 grid min-h-0 flex-1 grid-cols-3 gap-[14px]">
          <LampCard />
          <LedCard />
          <SpeakerCard />
        </div>
      )}
    </Glass>
  )
}
