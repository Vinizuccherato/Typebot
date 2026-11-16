import type { ReactNode } from 'react'
import { useScreen } from './screenContext'

export const SCREEN_W = 393
export const SCREEN_H = 852
export const SAFE_TOP = 59
export const SAFE_BOTTOM = 34

function StatusBar() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-[54px] items-center justify-between px-[34px] pt-[6px] text-[15px] font-semibold text-[var(--text)]">
      <span className="tabular">9:41</span>
      <span className="absolute left-1/2 top-[11px] h-[37px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.8" /><rect x="4.6" y="5" width="3" height="6" rx="0.8" /><rect x="9.2" y="2.6" width="3" height="8.4" rx="0.8" /><rect x="13.8" y="0" width="3" height="11" rx="0.8" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.3" fill="none" stroke="currentColor" strokeOpacity="0.45" /><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" /></svg>
      </span>
    </div>
  )
}

/**
 * One 393×852 app screen. Children lay out inside safe areas themselves
 * (top 59 / bottom 34 — see RESEARCH.md). Background is the screen's own.
 */
export function ScreenFrame({ children, background }: { children: ReactNode; background?: string }) {
  const { chrome, mode } = useScreen()
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: SCREEN_W,
        height: '100%',
        minHeight: mode === 'board' ? SCREEN_H : undefined,
        background: background ?? 'radial-gradient(120% 70% at 50% 0%, #241b2e 0%, #0e0c12 62%)',
        borderRadius: chrome ? 48 : 0,
        isolation: 'isolate',
      }}
    >
      {children}
      {chrome && <StatusBar />}
      {chrome && <span aria-hidden className="pointer-events-none absolute bottom-[8px] left-1/2 z-50 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80" />}
    </div>
  )
}
