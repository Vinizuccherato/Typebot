/// <reference lib="webworker" />
import { buildGeometry } from './buildGeometry'

/* Meshes the SDF off the main thread (~1–2 s) and hands back transferable arrays. */
const { head, body } = buildGeometry()
const pack = (g: typeof head) => ({
  position: g.attributes.position.array as Float32Array,
  normal: g.attributes.normal.array as Float32Array,
  cavity: g.attributes.cavity.array as Float32Array,
  baseNormal: g.attributes.baseNormal.array as Float32Array,
  index: g.index!.array as Uint32Array | Uint16Array,
})
const h = pack(head)
const b = pack(body)
;(self as DedicatedWorkerGlobalScope).postMessage({ head: h, body: b }, [
  h.position.buffer, h.normal.buffer, h.cavity.buffer, h.baseNormal.buffer, h.index.buffer,
  b.position.buffer, b.normal.buffer, b.cavity.buffer, b.baseNormal.buffer, b.index.buffer,
])
