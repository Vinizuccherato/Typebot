import { useEffect, useState } from 'react'
import { BufferAttribute, BufferGeometry } from 'three'

type Packed = { position: Float32Array; normal: Float32Array; cavity: Float32Array; baseNormal: Float32Array; index: Uint32Array | Uint16Array }

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

let pending: Promise<{ head: BufferGeometry; body: BufferGeometry }> | null = null

function load() {
  pending ??= new Promise((resolve, reject) => {
    const w = new Worker(new URL('./geometry.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ head: Packed; body: Packed }>) => {
      resolve({ head: unpack(e.data.head), body: unpack(e.data.body) })
      w.terminate()
    }
    w.onerror = (e) => {
      w.terminate()
      reject(e)
    }
  })
  return pending
}

/** The sculpted head + shoulders, meshed in a worker. `null` until ready. */
export function useHeadGeometry() {
  const [geo, setGeo] = useState<{ head: BufferGeometry; body: BufferGeometry } | null>(null)
  useEffect(() => {
    let live = true
    load().then((g) => live && setGeo(g))
    return () => {
      live = false
    }
  }, [])
  return geo
}
