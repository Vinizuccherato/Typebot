import type { ReactNode } from 'react'
import { useScreen } from './screenContext'
import { TabBar } from './TabBar'

export const SCREEN_W = 393
export const SCREEN_H = 852
export const SAFE_TOP = 59
export const SAFE_BOTTOM = 34
/** space a screen must leave at the bottom when the floating tab bar is shown */
export const TABBAR_SPACE = 112

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
 * One app screen. Mobile: 393×852 with safe areas (top 59 / bottom 34). Web: fills the
 * web-app pane. It is a CSS container (`@container`), so screens adapt with container
 * queries (e.g. `@3xl:grid-cols-2`) instead of viewport breakpoints.
 */
export function ScreenFrame({ children, background, tabs = false }: { children: ReactNode; background?: string; tabs?: boolean }) {
  const { chrome, mode } = useScreen()
  const web = mode === 'web'
  return (
    <div
      className="@container relative overflow-hidden"
      style={{
        width: web ? '100%' : SCREEN_W,
        height: '100%',
        minHeight: mode === 'board' ? SCREEN_H : undefined,
        background: background ?? 'radial-gradient(120% 70% at 50% -5%, #1d3a31 0%, #0a0f0d 62%)',
        borderRadius: chrome ? 48 : web ? 28 : 0,
        isolation: 'isolate',
      }}
    >
      {children}
      {tabs && <TabBar />}
      {chrome && <StatusBar />}
      {chrome && <span aria-hidden className="pointer-events-none absolute bottom-[8px] left-1/2 z-50 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80" />}
    </div>
  )
}
