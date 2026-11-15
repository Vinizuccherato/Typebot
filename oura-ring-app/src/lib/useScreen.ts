import { useLayoutEffect, useState } from 'react'

/* Designed on a 390pt-wide screen.
   mobile  — one column that fills the viewport (sheet anchored to the bottom).
   desktop — the hero (ring + gauge) and the My Rings panel side by side, each scaled
             to the viewport; the painted backdrop is always full-bleed. */
export const SCREEN_W = 390
export const SCREEN_H = 844
export const HERO_H = 640

export type ScreenInfo =
  | { mode: 'mobile'; scale: number; height: number }
  | { mode: 'desktop'; heroScale: number; panelScale: number }

const measure = (): ScreenInfo => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (vw < 900 || vw / vh < 1.05) {
    const scale = Math.min(vw / SCREEN_W, vh / SCREEN_H, 1.35)
    return { mode: 'mobile', scale, height: Math.max(720, vh / scale) }
  }
  return {
    mode: 'desktop',
    heroScale: Math.min((vh * 0.94) / HERO_H, (vw * 0.48) / SCREEN_W),
    panelScale: Math.min((vh * 0.9) / 600, (vw * 0.3) / SCREEN_W, 1.3),
  }
}

export function useScreen() {
  const [info, setInfo] = useState<ScreenInfo>(measure)
  useLayoutEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setInfo(measure()))
    }
    window.addEventListener('resize', on)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', on)
    }
  }, [])
  return info
}
