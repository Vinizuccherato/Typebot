/// <reference lib="webworker" />
import type { BufferGeometry } from 'three'
import { buildBase, buildStyles } from './buildGeometry'

/* Meshes the SDFs off the main thread and hands back transferable arrays in two
   messages: { phase: 'base' } (head, body, current hair) then { phase: 'styles' }. */

const pack = (g: BufferGeometry) => ({
  position: g.attributes.position.array as Float32Array,
  normal: g.attributes.normal.array as Float32Array,
  cavity: g.attributes.cavity.array as Float32Array,
  baseNormal: g.attributes.baseNormal.array as Float32Array,
  index: g.index!.array as Uint32Array | Uint16Array,
})
type Packed = ReturnType<typeof pack>
const buffers = (ps: Packed[]) => ps.flatMap((p) => [p.position.buffer, p.normal.buffer, p.cavity.buffer, p.baseNormal.buffer, p.index.buffer])

const post = self as DedicatedWorkerGlobalScope
const base = buildBase()
const b = { head: pack(base.head), body: pack(base.body), current: pack(base.current) }
post.postMessage({ phase: 'base', ...b }, buffers(Object.values(b)))

const styles = buildStyles()
const hair = Object.fromEntries(Object.entries(styles.hair).map(([k, g]) => [k, pack(g!)]))
const beard = Object.fromEntries(Object.entries(styles.beard).map(([k, g]) => [k, pack(g!)]))
post.postMessage({ phase: 'styles', hair, beard }, buffers([...Object.values(hair), ...Object.values(beard)]))
