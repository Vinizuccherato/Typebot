import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, LatheGeometry, MeshPhysicalMaterial, Vector2, type Group, type PointLight, type Sprite } from 'three'
import { glowTexture } from './labels'

/* The splash brand object: an original faceted gem — "facet." — cut as a
   12-sided brilliant (table, crown, girdle, pavilion), iridescent glass with a
   lilac body tint, turning slowly in a soft halo; a light sweeps across it on mount. */

function gemGeometry() {
  const pts = [
    new Vector2(0.0001, 0.42), // table centre
    new Vector2(0.56, 0.42), // table edge
    new Vector2(0.86, 0.24), // star / crown break
    new Vector2(1.0, 0.06), // girdle top
    new Vector2(1.0, 0.0), // girdle bottom
    new Vector2(0.62, -0.42), // pavilion break
    new Vector2(0.0001, -1.0), // culet
  ]
  const g = new LatheGeometry(pts, 12).toNonIndexed()
  g.computeVertexNormals()
  return g
}

export function Mark() {
  const geo = useMemo(gemGeometry, [])
  const mat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color('#f3eeff'),
        roughness: 0.03,
        metalness: 0,
        transmission: 1,
        thickness: 1.4,
        ior: 2.1,
        iridescence: 1,
        iridescenceIOR: 1.7,
        iridescenceThicknessRange: [180, 820],
        attenuationColor: new Color('#b7a6ff'),
        attenuationDistance: 2.2,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        specularIntensity: 1,
        envMapIntensity: 1.6,
        flatShading: true,
      }),
    [],
  )
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat])
  const gem = useRef<Group>(null)
  const sweep = useRef<PointLight>(null)
  const halo = useRef<Sprite>(null)
  const born = useRef(-1)

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    if (born.current < 0) born.current = t
    const age = t - born.current
    if (gem.current) {
      gem.current.rotation.y += dt * 0.35
      gem.current.rotation.x = 0.32 + Math.sin(t * 0.6) * 0.04
      const intro = 1 - Math.pow(1 - Math.min(1, age / 1.1), 3)
      gem.current.scale.setScalar(0.72 + 0.28 * intro)
      gem.current.position.y = Math.sin(t * 0.9) * 0.04
    }
    if (sweep.current) {
      const k = Math.min(1, Math.max(0, (age - 0.35) / 1.4))
      sweep.current.position.x = -3 + 6 * k
      sweep.current.intensity = Math.sin(k * Math.PI) * 26
    }
    if (halo.current) {
      const m = halo.current.material
      m.opacity = (0.35 + 0.08 * Math.sin(t * 1.3)) * Math.min(1, age / 0.8)
    }
  })

  return (
    <group>
      <sprite ref={halo} position={[0, 0, -1.2]} scale={[5.2, 5.2, 1]}>
        <spriteMaterial map={glowTexture()} color="#9d86ff" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <group ref={gem}>
        <mesh geometry={geo} material={mat} />
      </group>
      <pointLight ref={sweep} position={[-3, 1.2, 2.2]} color="#fff3e6" intensity={0} distance={9} decay={1.4} />
    </group>
  )
}
