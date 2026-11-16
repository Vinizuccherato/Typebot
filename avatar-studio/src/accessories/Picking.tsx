import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Color, DoubleSide, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry, ShaderMaterial, Vector3 } from 'three'
import { useStudio, type RegionId } from '../store'
import { anchors } from './anchors'
import { classify, glowSpots } from './regions'

/* ──────────────────────────────────────────────────────────────
   Region picking: an invisible proxy of the head receives pointer events;
   the hit point is classified into face / eyes / brows / accessories.
   Hover (from the face or from a panel via store.hovered) lights the region
   with a soft azure glow; click selects it.
   ────────────────────────────────────────────────────────────── */

const proxyMat = new MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: DoubleSide })
const inv = new Matrix4()
const hit = new Vector3()

const glowVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const glowFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uRing;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    float fill = smoothstep(1.0, 0.15, r);
    float ring = exp(-pow((r - 0.86) / 0.07, 2.0)) * (0.75 + 0.25 * sin(uTime * 2.4 + atan(q.y, q.x) * 3.0));
    float a = mix(fill * 0.55, ring, uRing);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`

function Glow({ region, on }: { region: RegionId; on: boolean }) {
  const geo = useMemo(() => new PlaneGeometry(2, 2), [])
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: { uColor: { value: new Color('#6f97ff') }, uOpacity: { value: 0 }, uRing: { value: 0 }, uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat])
  const refs = useRef<(Mesh | null)[]>([])
  const rev = useRef(-1)
  const [spots, setSpots] = useState(() => glowSpots(region))

  useFrame(({ clock }, dt) => {
    if (rev.current !== anchors.rev) {
      rev.current = anchors.rev
      setSpots(glowSpots(region))
    }
    const u = mat.uniforms
    u.uTime.value = clock.elapsedTime
    u.uOpacity.value += ((on ? 0.6 : 0) - u.uOpacity.value) * (1 - Math.exp(-dt * 10))
    for (const m of refs.current) if (m) m.visible = u.uOpacity.value > 0.005
  })

  return (
    <>
      {spots.map((s, i) => (
        <mesh
          key={i}
          ref={(m) => void (refs.current[i] = m)}
          geometry={geo}
          material={mat}
          position={s.c}
          scale={[s.rx, s.ry, 1]}
          renderOrder={8}
          raycast={() => null}
          onUpdate={() => (mat.uniforms.uRing.value = s.ring ? 1 : 0)}
        />
      ))}
    </>
  )
}

const REGIONS: RegionId[] = ['face', 'eyes', 'brows', 'accessories']

export function Picking({ enabled }: { enabled: boolean }) {
  const setRegion = useStudio((s) => s.setRegion)
  const storeHover = useStudio((s) => s.hovered)
  const [local, setLocal] = useState<RegionId | null>(null)
  const proxy = useRef<Mesh>(null)
  const seen = useRef(-1)
  const [mesh, setMesh] = useState(anchors.mesh)

  useFrame(() => {
    if (seen.current === anchors.baseRev) return
    seen.current = anchors.baseRev
    setMesh(anchors.mesh)
    if (proxy.current) {
      proxy.current.matrix.copy(anchors.meshToLayer)
      proxy.current.matrixWorldNeedsUpdate = true
    }
  })

  useEffect(() => () => void (document.body.style.cursor = ''), [])

  const toRegion = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const parent = proxy.current?.parent
    if (!parent) return 'face' as RegionId
    inv.copy(parent.matrixWorld).invert()
    hit.copy(e.point).applyMatrix4(inv)
    return classify(hit)
  }

  const lit = storeHover ?? local

  return (
    <>
      {mesh && enabled && (
        <mesh
          ref={proxy}
          geometry={mesh.geometry}
          material={proxyMat}
          matrixAutoUpdate={false}
          matrix={anchors.meshToLayer}
          onPointerMove={(e) => {
            e.stopPropagation()
            const r = toRegion(e)
            if (r !== local) setLocal(r)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setLocal(null)
            document.body.style.cursor = ''
          }}
          onClick={(e) => {
            // ignore the end of an orbit drag
            if (e.delta > 6) return
            e.stopPropagation()
            setRegion(toRegion(e))
          }}
        />
      )}
      {REGIONS.map((r) => (
        <Glow key={r} region={r} on={lit === r} />
      ))}
    </>
  )
}
