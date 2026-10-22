import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { clamp } from '../../lib/utils'

/** Element size in unscaled CSS px (offsetWidth/Height ignore the artboard transform). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** Non-passive wheel listener that steps a value (trackpad deltas are accumulated). */
export function useWheelStep(ref: RefObject<Element | null>, onStep: (dir: 1 | -1) => void) {
  const cb = useRef(onStep)
  cb.current = onStep
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let acc = 0
    const handler = (e: Event) => {
      const w = e as WheelEvent
      w.preventDefault()
      acc += Math.abs(w.deltaY) >= Math.abs(w.deltaX) ? -w.deltaY : w.deltaX
      if (Math.abs(acc) >= 24) {
        cb.current(acc > 0 ? 1 : -1)
        acc = 0
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [ref])
}

/** WAI-ARIA slider keyboard model. Returns the next value, or null if the key is not handled. */
export function keyToValue(e: React.KeyboardEvent, v: number, min = 0, max = 100, step = 1, page = 10): number | null {
  const inc = e.shiftKey ? page : step
  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(v + inc, min, max)
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(v - inc, min, max)
    case 'PageUp':
      return clamp(v + page, min, max)
    case 'PageDown':
      return clamp(v - page, min, max)
    case 'Home':
      return min
    case 'End':
      return max
  }
  return null
}

/** SVG-safe unique id (React 19 ids contain characters that break url(#…)). */
export const svgId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '')
