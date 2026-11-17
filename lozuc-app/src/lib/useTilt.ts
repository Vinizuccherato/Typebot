import { useCallback, useRef } from 'react'

/** Depth: a card tilts toward the pointer (sets --rx/--ry for the `.tilt` class). Max ±`deg`. */
export function useTilt<T extends HTMLElement>(deg = 6) {
  const ref = useRef<T | null>(null)
  const raf = useRef(0)
  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current
      if (!el || e.pointerType === 'touch') return
      const { clientX, clientY } = e
      cancelAnimationFrame(raf.current)
      raf.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (clientX - r.left) / r.width - 0.5
        const y = (clientY - r.top) / r.height - 0.5
        el.style.setProperty('--ry', `${(x * deg).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${(-y * deg).toFixed(2)}deg`)
      })
    },
    [deg],
  )
  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(raf.current)
    ref.current?.style.setProperty('--rx', '0deg')
    ref.current?.style.setProperty('--ry', '0deg')
  }, [])
  return { ref, onPointerMove, onPointerLeave }
}
