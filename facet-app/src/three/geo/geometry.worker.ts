/// <reference lib="webworker" />
import { buildGeometry } from './buildGeometry'

/* Meshes the SDFs off the main thread (~2–3 s) and hands back transferable arrays. */
const geo = buildGeometry()
const pack = (g: typeof geo.head) => ({
  position: g.attributes.position.array as Float32Array,
  normal: g.attributes.normal.array as Float32Array,
  cavity: g.attributes.cavity.array as Float32Array,
  baseNormal: g.attributes.baseNormal.array as Float32Array,
  index: g.index!.array as Uint32Array | Uint16Array,
})
const out = { head: pack(geo.head), body: pack(geo.body), hair: pack(geo.hair) }
const buffers = Object.values(out).flatMap((p) => [p.position.buffer, p.normal.buffer, p.cavity.buffer, p.baseNormal.buffer, p.index.buffer])
;(self as DedicatedWorkerGlobalScope).postMessage(out, buffers)
