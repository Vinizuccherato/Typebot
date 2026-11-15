import { useCallback, useRef } from 'react'

/**
 * Pointer-following specular reflex for `.glass` surfaces.
 * Writes --mx/--my (px, local to the element) and --spec-o on the element.
 * Uses rAF + getBoundingClientRect so it works inside the scaled artboard.
 */
export function useSpecular<T extends HTMLElement>(strength = 1) {
  const ref = useRef<T | null>(null)
  const frame = useRef(0)

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current
      if (!el || e.pointerType === 'touch') return
      const { clientX, clientY } = e
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const sx = r.width / el.offsetWidth || 1
        const sy = r.height / el.offsetHeight || 1
        el.style.setProperty('--mx', `${(clientX - r.left) / sx}px`)
        el.style.setProperty('--my', `${(clientY - r.top) / sy}px`)
        el.style.setProperty('--spec-o', String(strength))
      })
    },
    [strength],
  )

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current)
    ref.current?.style.setProperty('--spec-o', '0')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
