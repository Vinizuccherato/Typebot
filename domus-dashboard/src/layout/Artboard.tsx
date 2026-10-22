import { createContext, useContext, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react'

/* ──────────────────────────────────────────────────────────────
   Design canvas: 1600×900 reference (the Domus shot).
   Desktop: a virtual canvas of (vw/s × vh/s) where
   s = min(vw/1600, vh/900) — so it is never smaller than 1600×900
   and panels anchor to its edges (no letterboxing, ultrawide-safe).
   Compact (< 1024px wide or portrait): natural vertical flow.
   ────────────────────────────────────────────────────────────── */

export const BASE_W = 1600
export const BASE_H = 900

export interface ArtboardInfo {
  mode: 'desktop' | 'compact'
  /** CSS px per design px */
  scale: number
  /** virtual canvas size in design px */
  width: number
  height: number
}

const measure = (): ArtboardInfo => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const scale = Math.min(vw / BASE_W, vh / BASE_H)
  // Below ~0.74 the 11px labels would render under 8px — switch to the flow layout instead.
  const compact = vw < 1024 || vw / vh < 1.15 || scale < 0.74
  if (compact) return { mode: 'compact', scale: 1, width: vw, height: vh }
  return { mode: 'desktop', scale, width: vw / scale, height: vh / scale }
}

const Ctx = createContext<ArtboardInfo>({ mode: 'desktop', scale: 1, width: BASE_W, height: BASE_H })

export const useArtboard = () => useContext(Ctx)

export function ArtboardProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<ArtboardInfo>(() =>
    typeof window === 'undefined' ? { mode: 'desktop', scale: 1, width: BASE_W, height: BASE_H } : measure(),
  )

  useLayoutEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setInfo(measure()))
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--s', String(info.scale))
    document.body.classList.toggle('compact', info.mode === 'compact')
  }, [info])

  return <Ctx.Provider value={info}>{children}</Ctx.Provider>
}

/** The scaled desktop canvas. Children are positioned with <Slot/>. */
export function Artboard({ children }: { children: ReactNode }) {
  const { scale, width, height } = useArtboard()
  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-10 origin-top-left"
      style={{ width, height, transform: `scale(${scale})` }}
    >
      {children}
    </div>
  )
}

export interface SlotProps {
  name: string
  left?: number
  right?: number
  top?: number
  bottom?: number
  width?: number
  height?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/** Absolutely positioned region of the artboard (design px). Re-enables pointer events. */
export function Slot({ name, left, right, top, bottom, width, height, children, className, style }: SlotProps) {
  return (
    <section
      data-slot={name}
      aria-label={name}
      className={`pointer-events-auto absolute ${className ?? ''}`}
      style={{ left, right, top, bottom, width, height, ...style }}
    >
      {children}
    </section>
  )
}
