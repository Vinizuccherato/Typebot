import { useEffect, useState } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'
import type { BeardShape, HairShape } from './sdf'
import { resolveAnchors } from '../face/anchors'

type Packed = { position: Float32Array; normal: Float32Array; cavity: Float32Array; baseNormal: Float32Array; index: Uint32Array | Uint16Array }

export interface HeadGeometry {
  head: BufferGeometry
  body: BufferGeometry
  hair: Partial<Record<HairShape, BufferGeometry>>
  beard: Partial<Record<BeardShape, BufferGeometry>>
  /** bumps when the second (styles) phase lands */
  rev: number
}

const unpack = (p: Packed) => {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(p.position, 3))
  g.setAttribute('normal', new BufferAttribute(p.normal, 3))
  g.setAttribute('cavity', new BufferAttribute(p.cavity, 1))
  g.setAttribute('baseNormal', new BufferAttribute(p.baseNormal, 3))
  g.setIndex(new BufferAttribute(p.index, 1))
  g.computeBoundingSphere()
  g.computeBoundingBox()
  return g
}

let started = false
let geo: HeadGeometry | null = null
const listeners = new Set<(g: HeadGeometry) => void>()
const emit = () => geo && listeners.forEach((l) => l(geo!))

/** Start the one-time worker build (idempotent). Shared by every canvas on the page. */
export function preloadHead() {
  if (started) return
  started = true
  const w = new Worker(new URL('./geometry.worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = (e: MessageEvent) => {
    const m = e.data
    if (m.phase === 'base') {
      geo = { head: unpack(m.head), body: unpack(m.body), hair: { current: unpack(m.current) }, beard: {}, rev: 0 }
      resolveAnchors(geo.head)
    } else if (m.phase === 'styles' && geo) {
      const hair = { ...geo.hair }
      for (const [k, p] of Object.entries(m.hair as Record<string, Packed>)) hair[k as HairShape] = unpack(p)
      const beard: HeadGeometry['beard'] = {}
      for (const [k, p] of Object.entries(m.beard as Record<string, Packed>)) beard[k as BeardShape] = unpack(p)
      geo = { ...geo, hair, beard, rev: geo.rev + 1 }
      w.terminate()
    }
    emit()
  }
  w.onerror = () => {
    w.terminate()
    started = false
  }
}

/** Shared head geometry; `null` until the base phase is ready, then updates once more when styles land. */
export function useHeadGeometry() {
  const [g, setG] = useState<HeadGeometry | null>(geo)
  useEffect(() => {
    preloadHead()
    if (geo && geo !== g) setG(geo)
    listeners.add(setG)
    return () => void listeners.delete(setG)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return g
}
