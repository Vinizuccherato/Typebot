import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, ExtrudeGeometry, MeshPhysicalMaterial, Shape, ShaderMaterial, type Group, type PointLight } from 'three'

/* The lozuc brand object: an original liquid-glass lozenge — a rounded rhombus
   pebble with soft bevelled shoulders, clear glass with a faint sage body,
   a mist/sage fresnel rim on its own surface (no sprite halo), a slow turn and
   one light sweep across it on mount. */

function lozengeGeometry() {
  const W = 0.62
  const H = 0.9
  const r = 0.2 // corner rounding along each edge
  const P = [
    [0, H],
    [W, 0],
    [0, -H],
    [-W, 0],
  ] as const
  const s = new Shape()
  const lerp = (a: readonly number[], b: readonly number[], t: number) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  for (let i = 0; i < 4; i++) {
    const prev = P[(i + 3) % 4]
    const cur = P[i]
    const next = P[(i + 1) % 4]
    const a = lerp(cur, prev, r)
    const b = lerp(cur, next, r)
    if (i === 0) s.moveTo(a[0], a[1])
    else s.lineTo(a[0], a[1])
    s.quadraticCurveTo(cur[0], cur[1], b[0], b[1])
  }
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.26, bevelSize: 0.22, bevelSegments: 14, curveSegments: 28 })
  g.center()
  g.computeVertexNormals()
  return g
}

export function Mark() {
  const geo = useMemo(lozengeGeometry, [])
  const glass = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: new Color('#f2f8f4'),
        roughness: 0.05,
        metalness: 0,
        transmission: 1,
        thickness: 1.2,
        ior: 1.55,
        iridescence: 0.35,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [200, 600],
        attenuationColor: new Color('#a9c7b6'),
        attenuationDistance: 1.6,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        specularIntensity: 1,
        envMapIntensity: 1.5,
      }),
    [],
  )
  const rim = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uA: { value: new Color('#a9c7b6') }, uB: { value: new Color('#d7e8de') }, uT: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV; varying float vY;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position * 1.012, 1.0);
            vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uA; uniform vec3 uB; uniform float uT;
          varying vec3 vN; varying vec3 vV; varying float vY;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
            vec3 c = mix(uA, uB, 0.5 + 0.5 * sin(vY * 2.4 + uT * 0.7));
            gl_FragColor = vec4(c * f * 0.55, 1.0);
          }`,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
        side: BackSide,
      }),
    [],
  )
  useEffect(() => () => (geo.dispose(), glass.dispose(), rim.dispose()), [geo, glass, rim])
  const obj = useRef<Group>(null)
  const sweep = useRef<PointLight>(null)
  const born = useRef(-1)

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime
    if (born.current < 0) born.current = t
    const age = t - born.current
    rim.uniforms.uT.value = t
    if (obj.current) {
      obj.current.rotation.y += dt * 0.32
      obj.current.rotation.x = 0.18 + Math.sin(t * 0.55) * 0.06
      obj.current.rotation.z = Math.sin(t * 0.4) * 0.05
      const intro = 1 - Math.pow(1 - Math.min(1, age / 1.2), 3)
      obj.current.scale.setScalar(0.78 + 0.22 * intro)
      obj.current.position.y = Math.sin(t * 0.9) * 0.035
    }
    if (sweep.current) {
      const k = ((age - 0.3) / 1.6) % 7 // a sweep on mount, then a slow one every ~11 s
      const kk = Math.min(1, Math.max(0, k))
      sweep.current.position.x = -2.6 + 5.2 * kk
      sweep.current.intensity = Math.sin(kk * Math.PI) * 18
    }
  })

  return (
    <group>
      <group ref={obj}>
        <mesh geometry={geo} material={glass} />
        <mesh geometry={geo} material={rim} renderOrder={2} />
      </group>
      <pointLight ref={sweep} position={[-2.6, 1, 2]} color="#f4fff8" intensity={0} distance={8} decay={1.4} />
    </group>
  )
}
