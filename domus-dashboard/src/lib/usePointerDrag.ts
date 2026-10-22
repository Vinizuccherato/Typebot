import { useCallback, useRef } from 'react'

export interface DragPoint {
  /** Normalised position inside the element, 0..1 (unclamped while dragging outside). */
  x: number
  y: number
  /** Position in element-local CSS px (unscaled — safe inside the scaled artboard). */
  px: number
  py: number
  width: number
  height: number
  phase: 'start' | 'move' | 'end'
  event: PointerEvent | React.PointerEvent
}

/**
 * Scale-safe pointer dragging (works inside a CSS-transformed artboard, unlike
 * most drag libs). Captures the pointer, reports local coordinates every move.
 */
export function usePointerDrag<T extends HTMLElement | SVGElement>(onDrag: (p: DragPoint) => void) {
  const ref = useRef<T | null>(null)
  const cb = useRef(onDrag)
  cb.current = onDrag

  const compute = (el: Element, e: PointerEvent | React.PointerEvent, phase: DragPoint['phase']): DragPoint => {
    const r = el.getBoundingClientRect()
    const w = (el as HTMLElement).offsetWidth ?? r.width
    const h = (el as HTMLElement).offsetHeight ?? r.height
    const width = w || r.width
    const height = h || r.height
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    return { x, y, px: x * width, py: y * height, width, height, phase, event: e }
  }

  const onPointerDown = useCallback((e: React.PointerEvent<T>) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    e.preventDefault()
    el.setPointerCapture?.(e.pointerId)
    cb.current(compute(el, e, 'start'))

    const move = (ev: PointerEvent) => cb.current(compute(el, ev, 'move'))
    const up = (ev: PointerEvent) => {
      cb.current(compute(el, ev, 'end'))
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }, [])

  return { ref, onPointerDown }
}
