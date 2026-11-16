import type { GlassesId } from '../../store'

/** Tiny line drawings of each frame style (24×12), for chips and swatch rows. */
const PATHS: Record<Exclude<GlassesId, 'none'>, string> = {
  round: 'M2 6a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0M13 6a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0M11 5.2q1 -1 2 0',
  aviator: 'M1.5 3h9q0 6 -4.5 7.5q-4.5 -1.5 -4.5 -7.5M13.5 3h9q0 6 -4.5 7.5q-4.5 -1.5 -4.5 -7.5M10.5 3.2h3M10.5 1.8h3',
  wayfarer: 'M1.5 2.5h9.5l-1 6q-0.5 2 -3.5 2h-2q-2.5 0 -3 -2zM13 2.5h9.5l-0.5 6q-0.5 2 -3 2h-2q-3 0 -3.5 -2zM11 4q1 -0.8 2 0',
  cateye: 'M1 2.5q5 -1.5 10 1l-1 4q-1 2.5 -4 2.5q-3 0 -4 -3zM13 3.5q5 -2.5 10 -1l-1 4.5q-1 3 -4 3q-3 0 -4 -2.5zM11 4.5q1 -0.8 2 0',
  browline: 'M1.5 3h9.5v1.6h-9.5zM13 3h9.5v1.6h-9.5zM2 4.6q0 5.4 4.5 5.4q4.5 0 4.5 -5.4M13 4.6q0 5.4 4.5 5.4q4.5 0 4.5 -5.4M11 3.8h2',
  rimless: 'M2 4q0 -1.5 2 -1.5h5q2 0 2 1.5v2.5q0 3 -4.5 3q-4.5 0 -4.5 -3zM13 4q0 -1.5 2 -1.5h5q2 0 2 1.5v2.5q0 3 -4.5 3q-4.5 0 -4.5 -3zM11 4.2h2',
}

export function FrameGlyph({ id, className }: { id: GlassesId; className?: string }) {
  if (id === 'none') return null
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden className={className}>
      <path d={PATHS[id]} fill="none" stroke="currentColor" strokeWidth={id === 'rimless' ? 0.9 : 1.4} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
