export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ')

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Maps v from [a,b] to [c,d] (unclamped). */
export const mapRange = (v: number, a: number, b: number, c: number, d: number) => c + ((v - a) / (b - a)) * (d - c)

export const round = (v: number, step = 1) => Math.round(v / step) * step

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Spring presets shared across the UI, tuned to feel like iOS. */
export const springs = {
  snappy: { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 },
  soft: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 },
  bouncy: { type: 'spring', stiffness: 420, damping: 22, mass: 0.8 },
  glide: { type: 'spring', stiffness: 140, damping: 26, mass: 1 },
} as const
