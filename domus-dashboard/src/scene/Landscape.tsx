import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { materials } from './materials'
import { radialFadeTexture } from './textures'
import { PLINTH, STAIRS } from './layout'

type Tree = { p: [number, number, number]; s: number; dark?: boolean }

// Hand-placed so the composition matches the reference: canopy at bottom-left & bottom-right, backdrop behind.
const TREES: Tree[] = [
  { p: [-15.5, 0, 8.5], s: 0.95 },
  { p: [-18.5, 0, 3], s: 1.2, dark: true },
  { p: [15.5, 0, 10.5], s: 1.05 },
  { p: [19, 0, 5], s: 1.35, dark: true },
  { p: [21, 0, -2.5], s: 1.5 },
  { p: [17, 0, -11], s: 1.8, dark: true },
  { p: [-16, 0, -12], s: 1.7, dark: true },
  { p: [-6, 0, -19], s: 2, dark: true },
  { p: [6, 0, -20], s: 2.1, dark: true },
  { p: [-22, 0, -5], s: 1.5 },
]

/** Soft canopy = a few smooth, gently lumpy spheres merged (lumps are position-hashed → no cracks). */
function canopyGeometry(seed: number) {
  let r = seed * 9301 + 49297
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  const parts: THREE.BufferGeometry[] = []
  const n = 3 + Math.floor(rnd() * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(1, 3)
    const R = 1.0 + rnd() * 0.6
    const phase = rnd() * 10
    const pos = g.attributes.position
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k)
      const lump = 1 + 0.09 * Math.sin(v.x * 3.1 + phase) * Math.sin(v.y * 2.7 + phase * 0.7) * Math.sin(v.z * 3.3 + phase * 1.3)
      v.multiplyScalar(R * lump)
      v.y *= 0.82
      pos.setXYZ(k, v.x, v.y, v.z)
    }
    g.translate((rnd() - 0.5) * 2, 2.7 + rnd() * 1.3, (rnd() - 0.5) * 2)
    parts.push(g)
  }
  const merged = mergeGeometries(parts)!
  merged.computeVertexNormals()
  parts.forEach((p) => p.dispose())
  return merged
}

export function Landscape() {
  const mats = materials()
  const fade = radialFadeTexture()

  const trees = useMemo(() => TREES.map((t, i) => ({ ...t, geo: canopyGeometry(i + 1) })), [])
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.12, 0.18, 2.8, 6).translate(0, 1.4, 0), [])

  return (
    <group>
      {/* ground — dissolves radially into the backdrop */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]} receiveShadow>
        <circleGeometry args={[34, 64]} />
        <meshStandardMaterial color="#a9a39a" roughness={1} metalness={0} transparent alphaMap={fade} depthWrite={false} />
      </mesh>
      {/* shadow catcher for crisper contact */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
        <circleGeometry args={[30, 48]} />
        <shadowMaterial transparent opacity={0.2} depthWrite={false} />
      </mesh>

      {trees.map((t, i) => (
        <group key={i} position={t.p} scale={t.s}>
          <mesh geometry={trunk} material={mats.trunk} castShadow />
          <mesh geometry={t.geo} material={t.dark ? mats.leafDark : mats.leaf} castShadow />
        </group>
      ))}

      {/* shrubs beside the stair */}
      {[
        [STAIRS.x0 - 0.9, PLINTH.z1 + 0.9, 0.55],
        [STAIRS.x0 - 1.7, PLINTH.z1 + 1.3, 0.42],
        [STAIRS.x1 + 0.9, PLINTH.z1 + 1.0, 0.5],
        [STAIRS.x1 + 1.8, PLINTH.z1 + 0.8, 0.38],
      ].map(([x, z, s], i) => (
        <mesh key={i} position={[x, s * 0.7, z]} scale={s} material={i % 2 ? mats.leafDark : mats.leaf} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  )
}
