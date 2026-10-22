import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { easing } from 'maath'
import { useDomus } from '../store'
import { materials } from './materials'
import { ARRAY, ARRAY_CENTER, RETICLE } from './layout'
import { haloTexture } from './textures'

const W = ARRAY.x1 - ARRAY.x0
const D = ARRAY.z1 - ARRAY.z0
const GAP = 0.085
/** halo sprite margin (m) — kept tight: the reference edge is a thin dotted LED line */
const HALO = 1.4
const LIME = new THREE.Color('#c6ef8e')

/** Rounded-rect outline as a flat ring (XZ plane). */
function ringGeometry(w: number, d: number, r: number, t: number) {
  const rr = (s: THREE.Shape | THREE.Path, hw: number, hd: number, rad: number) => {
    s.moveTo(-hw + rad, -hd)
    s.lineTo(hw - rad, -hd)
    s.quadraticCurveTo(hw, -hd, hw, -hd + rad)
    s.lineTo(hw, hd - rad)
    s.quadraticCurveTo(hw, hd, hw - rad, hd)
    s.lineTo(-hw + rad, hd)
    s.quadraticCurveTo(-hw, hd, -hw, hd - rad)
    s.lineTo(-hw, -hd + rad)
    s.quadraticCurveTo(-hw, -hd, -hw + rad, -hd)
  }
  const shape = new THREE.Shape()
  rr(shape, w / 2 + t, d / 2 + t, r + t)
  const hole = new THREE.Path()
  rr(hole, w / 2, d / 2, r)
  shape.holes.push(hole)
  const g = new THREE.ShapeGeometry(shape, 6)
  g.rotateX(-Math.PI / 2)
  return g
}

export function SolarArray() {
  const mats = materials()
  const eco = useDomus((s) => s.eco.active)
  const setFocus = useDomus((s) => s.setFocus)
  const toast = useDomus((s) => s.toast)

  const panels = useRef<THREE.InstancedMesh>(null)
  const dots = useRef<THREE.InstancedMesh>(null)
  const lineMat = useRef<THREE.MeshBasicMaterial>(null)
  const dotMat = useRef<THREE.MeshBasicMaterial>(null)
  const haloMat = useRef<THREE.MeshBasicMaterial>(null)
  const reticle = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.Mesh>(null)
  const pulseMat = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useRef({ level: eco ? 1 : 0.3 })

  const { pw, pd, count, dotPositions, ring, halo } = useMemo(() => {
    const pw = (W - GAP * (ARRAY.cols + 1)) / ARRAY.cols
    const pd = (D - GAP * (ARRAY.rows + 1)) / ARRAY.rows
    const count = ARRAY.cols * ARRAY.rows
    // LED dots along the perimeter, slightly outside the array
    const pad = 0.16
    const hw = W / 2 + pad
    const hd = D / 2 + pad
    const step = 0.16
    const pts: Array<[number, number]> = []
    for (let x = -hw; x <= hw; x += step) pts.push([x, -hd], [x, hd])
    for (let z = -hd + step; z < hd; z += step) pts.push([-hw, z], [hw, z])
    const ring = ringGeometry(W + pad * 2 - 0.1, D + pad * 2 - 0.1, 0.18, 0.04)
    const halo = haloTexture((W + HALO) / (D + HALO), HALO / (W + HALO))
    return { pw, pd, count, dotPositions: pts, ring, halo }
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    if (panels.current) {
      let i = 0
      for (let c = 0; c < ARRAY.cols; c++)
        for (let r = 0; r < ARRAY.rows; r++) {
          const x = ARRAY.x0 + GAP + pw / 2 + c * (pw + GAP)
          const z = ARRAY.z0 + GAP + pd / 2 + r * (pd + GAP)
          m.makeTranslation(x, ARRAY.y + 0.07, z)
          panels.current.setMatrixAt(i++, m)
        }
      panels.current.instanceMatrix.needsUpdate = true
      panels.current.computeBoundingSphere()
    }
    if (dots.current) {
      dotPositions.forEach(([x, z], i) => {
        m.makeTranslation(ARRAY_CENTER[0] + x, ARRAY.y + 0.06, ARRAY_CENTER[2] + z)
        dots.current!.setMatrixAt(i, m)
      })
      dots.current.instanceMatrix.needsUpdate = true
      dots.current.computeBoundingSphere()
    }
  }, [pw, pd, dotPositions])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const g = glow.current
    easing.damp(g, 'level', eco ? 1 : 0.28, 0.6, dt)
    const breathe = eco ? 0.86 + 0.14 * Math.sin(t * 1.7) : 1
    const k = g.level * breathe
    if (lineMat.current) lineMat.current.color.copy(LIME).multiplyScalar(0.4 + 0.9 * k)
    if (dotMat.current) dotMat.current.color.copy(LIME).multiplyScalar(0.8 + 2.8 * k)
    if (haloMat.current) haloMat.current.opacity = 0.15 + 0.55 * k
    // reticle
    if (reticle.current) reticle.current.rotation.y = t * 0.25
    if (pulse.current && pulseMat.current) {
      const p = (t * 0.55) % 1
      const s = 1 + p * 1.8
      pulse.current.scale.set(s, s, s)
      pulseMat.current.opacity = (1 - p) * 0.7
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return
    e.stopPropagation()
    setFocus('solar')
    const kw = useDomus.getState().solar.kw
    toast({ title: 'Solar array', detail: `Producing ${kw.toFixed(1)} kW · 32 panels online`, tone: 'success' })
  }
  const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = on ? 'pointer' : ''
  }

  return (
    <group>
      {/* aluminium tray visible through the panel gaps */}
      <mesh material={mats.solarFrame} position={[ARRAY_CENTER[0], ARRAY.y + 0.02, ARRAY_CENTER[2]]} receiveShadow>
        <boxGeometry args={[W, 0.04, D]} />
      </mesh>
      <instancedMesh
        ref={panels}
        args={[undefined, undefined, count]}
        material={mats.solar}
        castShadow
        receiveShadow
        onClick={onClick}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <boxGeometry args={[pw, 0.06, pd]} />
      </instancedMesh>

      {/* LED border: dotted emitters + continuous line + soft spill */}
      <instancedMesh ref={dots} args={[undefined, undefined, dotPositions.length]}>
        <boxGeometry args={[0.07, 0.04, 0.07]} />
        <meshBasicMaterial ref={dotMat} toneMapped={false} />
      </instancedMesh>
      <mesh geometry={ring} position={[ARRAY_CENTER[0], ARRAY.y + 0.045, ARRAY_CENTER[2]]}>
        <meshBasicMaterial ref={lineMat} toneMapped={false} />
      </mesh>
      <mesh position={[ARRAY_CENTER[0], ARRAY.y + 0.11, ARRAY_CENTER[2]]} rotation-x={-Math.PI / 2} renderOrder={3}>
        <planeGeometry args={[W + HALO, D + HALO]} />
        <meshBasicMaterial
          ref={haloMat}
          map={halo}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* target reticle */}
      <group position={[RETICLE[0], RETICLE[1] + 0.12, RETICLE[2]]}>
        <group ref={reticle}>
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.42, 0.5, 48]} />
            <meshBasicMaterial color={[3, 3, 3]} toneMapped={false} transparent opacity={0.95} depthWrite={false} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.62, 0.65, 48, 1, 0, Math.PI * 0.4]} />
            <meshBasicMaterial color={[1.6, 1.6, 1.6]} toneMapped={false} transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} rotation-z={Math.PI}>
            <ringGeometry args={[0.62, 0.65, 48, 1, 0, Math.PI * 0.4]} />
            <meshBasicMaterial color={[1.6, 1.6, 1.6]} toneMapped={false} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        </group>
        <mesh rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.13, 32]} />
          <meshBasicMaterial color={[3.2, 3.2, 3.2]} toneMapped={false} />
        </mesh>
        <mesh ref={pulse} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.5, 0.54, 48]} />
          <meshBasicMaterial ref={pulseMat} color={[1.8, 2.2, 1.6]} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
