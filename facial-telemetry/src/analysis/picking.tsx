import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { AdditiveBlending, Color, Matrix4, Mesh, ShaderMaterial, SphereGeometry, Vector3, type BufferGeometry, type Group } from 'three'
import { headRegistry, type FeatureId } from '../lib/face'
import { useFace } from '../store'
import { classify, FEATURE_ORDER, REGION_ELLIPSES } from './model'
import { MINT } from './primitives'

/* Invisible-until-needed twin of the head: receives pointer events for feature
   picking and paints a surface-hugging mint highlight on the hovered / selected region. */

/** Soft ellipsoid head used until the sculpted mesh is published. */
function placeholderGeometry(): BufferGeometry {
  const g = new SphereGeometry(1, 96, 96)
  const pos = g.attributes.position
  const v = new Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const x = v.x * 0.86
    const y = v.y * 1.12 - 0.3
    let z = v.z * 0.92 - 0.36
    if (v.z > 0) z += 0.2 * Math.exp(-(x * x) / 0.012 - ((y + 0.3) * (y + 0.3)) / 0.05)
    pos.setXYZ(i, x, y, z)
  }
  g.computeVertexNormals()
  return g
}

const vert = /* glsl */ `
  uniform mat4 uRel;
  varying vec3 vPos;
  varying vec3 vViewN;
  void main() {
    vPos = (uRel * vec4(position, 1.0)).xyz;
    vViewN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Mirrors classify() in model.ts (same ellipses).
const ELLIPSES = REGION_ELLIPSES.map((e) => `vec4(${e.map((n) => n.toFixed(3)).join(', ')})`).join(', ')
const frag = /* glsl */ `
  uniform float uHover;
  uniform float uSel;
  uniform float uHoverAmt;
  uniform float uSelAmt;
  uniform float uTime;
  uniform vec3 uColor;
  varying vec3 vPos;
  varying vec3 vViewN;

  const vec4 E[8] = vec4[8](${ELLIPSES});
  float region(vec3 p) {
    if (p.z < -0.32) return -1.0;
    float ax = abs(p.x);
    float best = -1.0;
    float bd = 2.6;
    for (int i = 0; i < 8; i++) {
      vec4 e = E[i];
      float d = pow((ax - e.x) / e.z, 2.0) + pow((p.y - e.y) / e.w, 2.0);
      if (d < bd) { bd = d; best = float(i); }
    }
    return best;
  }

  void main() {
    float r = region(vPos);
    float sel = (abs(r - uSel) < 0.5 ? 1.0 : 0.0) * uSelAmt;
    float hov = (abs(r - uHover) < 0.5 ? 1.0 : 0.0) * uHoverAmt;
    float k = max(sel, hov * 0.6);
    if (k < 0.001) discard;
    // soft edge: fade near the neighbouring region by sampling a small ring
    float e = 0.0;
    for (int i = 0; i < 6; i++) {
      float a = float(i) * 1.0472;
      vec3 q = vPos + vec3(cos(a), sin(a), 0.0) * 0.035;
      e += abs(region(q) - r) < 0.5 ? 1.0 : 0.0;
    }
    float inner = e / 6.0;
    vec2 g = fract(vPos.xy * 58.0) - 0.5;
    float dots = smoothstep(0.2, 0.08, length(g));
    float band = exp(-pow((vPos.y - (mod(uTime * 0.45, 1.0) * 2.2 - 1.35)) * 16.0, 2.0));
    float rim = pow(1.0 - abs(normalize(vViewN).z), 2.0);
    // fill (dots + sweep + rim) inside the region, a brighter contour where it meets its neighbours
    float a = k * inner * (0.08 + 0.3 * dots + 0.45 * band * sel + 0.22 * rim) + k * (1.0 - inner) * 0.55;
    gl_FragColor = vec4(uColor * a, a);
  }
`

const rel = new Matrix4()
const inv = new Matrix4()

export function RegionPicker({ space }: { space: React.RefObject<Group | null> }) {
  const proxy = useRef<Mesh>(null)
  const fallback = useMemo(placeholderGeometry, [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uRel: { value: new Matrix4() },
          uHover: { value: -1 },
          uSel: { value: -1 },
          uHoverAmt: { value: 0 },
          uSelAmt: { value: 0 },
          uTime: { value: 0 },
          uColor: { value: new Color(MINT) },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        toneMapped: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => () => fallback.dispose(), [fallback])

  const hover = useFace((s) => s.hover)
  const select = useFace((s) => s.select)
  const tool = useFace((s) => s.tool)
  const picking = tool === 'inspect' || tool === 'measure'
  const lastHover = useRef<FeatureId | null>(null)

  useFrame(({ clock }, dt) => {
    const m = proxy.current
    const g = space.current
    if (!m || !g) return
    const head = headRegistry.mesh
    if (head) {
      if (m.geometry !== head.geometry) m.geometry = head.geometry
      head.updateWorldMatrix(true, false)
      g.updateWorldMatrix(true, false)
      rel.multiplyMatrices(inv.copy(g.matrixWorld).invert(), head.matrixWorld)
      m.matrix.copy(rel)
    } else {
      if (m.geometry !== fallback) m.geometry = fallback
      rel.identity()
      m.matrix.identity()
    }
    m.matrixWorldNeedsUpdate = true
    const u = material.uniforms
    u.uRel.value.copy(rel)
    u.uTime.value = clock.elapsedTime
    const st = useFace.getState()
    const sel = st.selected ? FEATURE_ORDER.indexOf(st.selected) : -1
    const hov = st.hovered ? FEATURE_ORDER.indexOf(st.hovered) : -1
    if (sel !== u.uSel.value) {
      if (sel >= 0) u.uSelAmt.value = 0
      if (sel >= 0) u.uSel.value = sel
    }
    if (hov !== u.uHover.value && hov >= 0) {
      u.uHover.value = hov
      u.uHoverAmt.value = 0
    }
    const k = 1 - Math.exp(-dt * 8)
    u.uSelAmt.value += ((sel >= 0 ? 1 : 0) - u.uSelAmt.value) * k
    u.uHoverAmt.value += ((hov >= 0 && hov !== sel ? 1 : 0) - u.uHoverAmt.value) * k
  })

  const featureAt = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const g = space.current
    if (!g) return null
    const p = g.worldToLocal(e.point.clone())
    return classify(p.x, p.y, p.z)
  }

  return (
    <mesh
      ref={proxy}
      matrixAutoUpdate={false}
      material={material}
      geometry={fallback}
      renderOrder={5}
      onPointerMove={(e) => {
        if (!picking) return
        e.stopPropagation()
        const f = featureAt(e)
        if (f !== lastHover.current) {
          lastHover.current = f
          hover(f)
          document.body.style.cursor = f ? 'pointer' : ''
        }
      }}
      onPointerOut={() => {
        if (lastHover.current) hover(null)
        lastHover.current = null
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        if (!picking || e.delta > 5) return
        e.stopPropagation()
        const f = featureAt(e)
        if (!f) return
        select(useFace.getState().selected === f ? null : f)
      }}
    />
  )
}
