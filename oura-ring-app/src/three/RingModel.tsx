import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { BoxGeometry, MeshPhysicalMaterial, SphereGeometry, type Mesh } from 'three'
import type { FinishId } from '../store'
import { FINISHES, type SurfaceSpec } from './finishes'
import { createInnerGeometry, createOuterGeometry, HW, innerRadiusAt } from './geometry'

const makeMaterial = (s: SurfaceSpec) =>
  new MeshPhysicalMaterial({
    color: s.color.clone(),
    roughness: s.roughness,
    metalness: s.metalness,
    clearcoat: s.clearcoat,
    clearcoatRoughness: s.clearcoatRoughness,
    sheen: s.sheen,
    sheenColor: '#ffffff',
    sheenRoughness: 0.5,
    anisotropy: s.anisotropy,
    envMapIntensity: s.envMapIntensity,
  })

const SCALARS = ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'anisotropy', 'envMapIntensity'] as const

/** Damps a material toward a finish spec (crossfade between finishes). */
function dampSurface(m: MeshPhysicalMaterial, s: SurfaceSpec, dt: number) {
  easing.dampC(m.color, s.color, 0.28, dt)
  for (const k of SCALARS) easing.damp(m, k, s[k], 0.28, dt)
}

/* Sensor layout on the palm side of the inner wall (local −Z). */
const SENSOR_ANGLES = [-0.6, -0.2, 0.2, 0.6]
const DOME_ANGLES = [-0.35, 0, 0.35]

/**
 * Oura Ring 4: ceramic/titanium shell + polished inner wall with
 * dark sensor windows and three small optical domes. Axis = +Y.
 */
export function RingModel({ finish }: { finish: FinishId }) {
  const outerGeo = useMemo(() => createOuterGeometry(), [])
  const innerGeo = useMemo(() => createInnerGeometry(), [])
  const outerMat = useMemo(() => makeMaterial(FINISHES[finish].outer), []) // eslint-disable-line react-hooks/exhaustive-deps
  const innerMat = useMemo(() => makeMaterial(FINISHES[finish].inner), []) // eslint-disable-line react-hooks/exhaustive-deps
  const windowMat = useMemo(
    () => new MeshPhysicalMaterial({ color: '#15171a', roughness: 0.18, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
    [],
  )
  const domeMat = useMemo(
    () => new MeshPhysicalMaterial({ color: '#2b3035', roughness: 0.08, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.03 }),
    [],
  )
  const windowGeo = useMemo(() => new BoxGeometry(0.15, 0.25, 0.02), [])
  const domeGeo = useMemo(() => new SphereGeometry(0.032, 20, 12), [])

  useEffect(
    () => () => {
      for (const d of [outerGeo, innerGeo, outerMat, innerMat, windowMat, domeMat, windowGeo, domeGeo]) d.dispose()
    },
    [outerGeo, innerGeo, outerMat, innerMat, windowMat, domeMat, windowGeo, domeGeo],
  )

  const spec = FINISHES[finish]
  useFrame((_, dt) => {
    dampSurface(outerMat, spec.outer, dt)
    dampSurface(innerMat, spec.inner, dt)
  })

  const r = innerRadiusAt(0)
  const place = (mesh: Mesh | null, a: number, rr: number, y: number) => {
    if (!mesh) return
    mesh.position.set(Math.sin(a) * rr, y, -Math.cos(a) * rr)
    mesh.rotation.set(0, -a, 0) // face the axis
  }

  return (
    <group>
      <mesh geometry={outerGeo} material={outerMat} />
      <mesh geometry={innerGeo} material={innerMat} />
      {SENSOR_ANGLES.map((a) => (
        <mesh key={a} ref={(m) => place(m, a, r - 0.004, -HW * 0.08)} geometry={windowGeo} material={windowMat} />
      ))}
      {DOME_ANGLES.map((a) => (
        <mesh key={a} ref={(m) => place(m, a, r + 0.012, HW * 0.62)} geometry={domeGeo} material={domeMat} />
      ))}
    </group>
  )
}
