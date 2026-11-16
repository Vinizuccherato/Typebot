import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { GlassesId } from '../store'

/* ──────────────────────────────────────────────────────────────
   Procedural eyewear, built in a canonical frame space:
   lens centres at x = ±0.32 (64 mm IPD), y = 0, front plane z = 0,
   +x = the wearer's left (viewer's right). The fitter scales/places it.
   ────────────────────────────────────────────────────────────── */

export const CANON_IPD = 0.64

type RimKind = 'acetate' | 'metal' | 'browline' | 'rimless'

interface Style {
  kind: RimKind
  /** lens half width / height (units) */
  hw: number
  hh: number
  /** superellipse exponent: 2 = ellipse, higher = squarer */
  n: number
  /** >0 = wider at the top */
  taper: number
  /** outer-top corner lift (cat-eye / wayfarer) */
  lift: number
  /** outer-bottom drop (aviator teardrop) */
  drop: number
  /** rim band width at strength 0.5 */
  rim: number
  frame: 'tortoise' | 'black' | 'gold' | 'silver' | 'burgundy' | 'smoke'
  lensTint: string
  lensOpacity: number
  doubleBridge?: boolean
}

export const STYLES: Record<Exclude<GlassesId, 'none'>, Style> = {
  round: { kind: 'acetate', hw: 0.215, hh: 0.205, n: 2, taper: 0, lift: 0, drop: 0, rim: 0.026, frame: 'tortoise', lensTint: '#e8ddc8', lensOpacity: 0.12 },
  aviator: { kind: 'metal', hw: 0.25, hh: 0.2, n: 2.2, taper: 0.1, lift: 0, drop: 0.13, rim: 0.009, frame: 'gold', lensTint: '#5d6b5a', lensOpacity: 0.32, doubleBridge: true },
  wayfarer: { kind: 'acetate', hw: 0.245, hh: 0.175, n: 3.6, taper: 0.12, lift: 0.03, drop: 0, rim: 0.038, frame: 'black', lensTint: '#9aa3b0', lensOpacity: 0.14 },
  cateye: { kind: 'acetate', hw: 0.24, hh: 0.17, n: 2.8, taper: 0.1, lift: 0.085, drop: 0, rim: 0.034, frame: 'burgundy', lensTint: '#e9d6d6', lensOpacity: 0.12 },
  browline: { kind: 'browline', hw: 0.24, hh: 0.18, n: 3, taper: 0.06, lift: 0.015, drop: 0, rim: 0.034, frame: 'smoke', lensTint: '#dfe4ea', lensOpacity: 0.1 },
  rimless: { kind: 'rimless', hw: 0.23, hh: 0.155, n: 3.2, taper: 0.04, lift: 0, drop: 0, rim: 0.006, frame: 'silver', lensTint: '#eef3f8', lensOpacity: 0.1 },
}

/** Closed lens outline for the LEFT lens (outer side = +x), centred at the origin. */
export function lensOutline(st: Style, scale = 1, samples = 72): Vector2[] {
  const pts: Vector2[] = []
  for (let i = 0; i < samples; i++) {
    const th = (i / samples) * Math.PI * 2
    const c = Math.cos(th)
    const s = Math.sin(th)
    let x = st.hw * Math.sign(c) * Math.abs(c) ** (2 / st.n)
    let y = st.hh * Math.sign(s) * Math.abs(s) ** (2 / st.n)
    x *= 1 + st.taper * (y / st.hh)
    const ox = Math.max(0, x / st.hw)
    y += st.lift * ox ** 3 * Math.max(0, y / st.hh) * 1.6
    y -= st.drop * ox ** 1.5 * Math.max(0, -y / st.hh)
    // aviator: drop pulls the outer-bottom out a little too
    x += st.drop * 0.25 * ox * Math.max(0, -y / st.hh)
    pts.push(new Vector2(x * scale, y * scale))
  }
  return pts
}

/** Offset a closed polyline along its outward normals. */
function offset(pts: Vector2[], d: number): Vector2[] {
  const n = pts.length
  return pts.map((p, i) => {
    const a = pts[(i - 1 + n) % n]
    const b = pts[(i + 1) % n]
    const t = new Vector2(b.x - a.x, b.y - a.y).normalize()
    // CCW outline → outward normal is (t.y, −t.x)
    return new Vector2(p.x + t.y * d, p.y - t.x * d)
  })
}

const mirrorX = (pts: Vector2[]) => pts.map((p) => new Vector2(-p.x, p.y)).reverse()

function ringExtrude(outer: Vector2[], inner: Vector2[], depth: number, bevel: number) {
  const shape = new Shape(outer)
  shape.holes.push(new Shape(inner.slice().reverse()))
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 1, steps: 1 })
  g.translate(0, 0, -depth / 2)
  return g
}

function tubeLoop(pts: Vector2[], r: number, z = 0) {
  const curve = new CatmullRomCurve3(
    pts.map((p) => new Vector3(p.x, p.y, z)),
    true,
  )
  return new TubeGeometry(curve, pts.length * 2, r, 8, true)
}

function tubePath(pts: Vector3[], r: number) {
  return new TubeGeometry(new CatmullRomCurve3(pts), 24, r, 8, false)
}

const place = (g: BufferGeometry, dx: number) => g.translate(dx, 0, 0)
/** merge needs matching index state; Extrude/Tube differ */
const ni = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g)

let tortoiseTex: CanvasTexture | null = null
function tortoise() {
  if (tortoiseTex) return tortoiseTex
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#5b3a22'
  g.fillRect(0, 0, 256, 256)
  let s = 7
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 220; i++) {
    const x = r() * 256
    const y = r() * 256
    const rad = 4 + r() * 22
    const grad = g.createRadialGradient(x, y, 0, x, y, rad)
    const amber = r() > 0.55
    grad.addColorStop(0, amber ? 'rgba(214,150,70,0.85)' : 'rgba(25,14,8,0.8)')
    grad.addColorStop(1, amber ? 'rgba(160,96,40,0)' : 'rgba(25,14,8,0)')
    g.fillStyle = grad
    g.beginPath()
    g.ellipse(x, y, rad, rad * (0.5 + r()), r() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  tortoiseTex = new CanvasTexture(c)
  tortoiseTex.colorSpace = SRGBColorSpace
  tortoiseTex.wrapS = tortoiseTex.wrapT = RepeatWrapping
  tortoiseTex.repeat.set(3, 3)
  return tortoiseTex
}

function frameMaterial(kind: Style['frame']): Material {
  switch (kind) {
    case 'gold':
      return new MeshStandardMaterial({ color: new Color('#d8b36a'), metalness: 1, roughness: 0.22, transparent: true })
    case 'silver':
      return new MeshStandardMaterial({ color: new Color('#d9dde3'), metalness: 1, roughness: 0.18, transparent: true })
    case 'tortoise':
      return new MeshPhysicalMaterial({ map: tortoise(), color: '#ffffff', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true })
    case 'burgundy':
      return new MeshPhysicalMaterial({ color: '#3d1119', roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true })
    case 'smoke':
      return new MeshPhysicalMaterial({ color: '#2b2a2e', roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true })
    default:
      return new MeshPhysicalMaterial({ color: '#141416', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true })
  }
}

export interface BuiltGlasses {
  frame: BufferGeometry
  frameMat: Material
  /** thin metal bits on acetate frames (pins, pads) */
  metal: BufferGeometry | null
  metalMat: Material
  lens: BufferGeometry
  lensMat: MeshPhysicalMaterial
  /** hinge points in canonical frame space (right, left) */
  hinge: [Vector3, Vector3]
  /** temple cross-section (width, height) */
  templeSize: [number, number]
}

/** Build one pair. `weight` = strength.accessories (0..1) → rim weight 0.6×..1.5×. */
export function buildGlasses(id: Exclude<GlassesId, 'none'>, weight: number): BuiltGlasses {
  const st = STYLES[id]
  const k = 0.6 + weight * 0.9
  const rim = st.rim * k
  const left = lensOutline(st)
  const right = mirrorX(left)
  const cx = CANON_IPD / 2
  const parts: BufferGeometry[] = []
  const metal: BufferGeometry[] = []

  const outerEdgeX = Math.max(...left.map((p) => p.x))
  const innerEdgeX = Math.min(...left.map((p) => p.x))
  const topY = Math.max(...left.map((p) => p.y))

  if (st.kind === 'acetate') {
    const depth = 0.03 + rim * 0.25
    for (const [pts, dx] of [
      [left, cx],
      [right, -cx],
    ] as const) {
      parts.push(place(ringExtrude(offset(pts, rim), pts, depth, Math.min(0.008, rim * 0.25)), dx))
    }
    // keyhole-free saddle bridge
    const bx = cx + innerEdgeX - rim * 0.3
    const by = topY * 0.32
    parts.push(tubePath([new Vector3(-bx, by, 0), new Vector3(-bx * 0.4, by + 0.035, 0.004), new Vector3(0, by + 0.045, 0.006), new Vector3(bx * 0.4, by + 0.035, 0.004), new Vector3(bx, by, 0)], rim * 0.42))
    // hinge pins
    for (const s of [-1, 1]) metal.push(tubePath([new Vector3(s * (cx + outerEdgeX + rim * 0.6), topY * 0.55, -0.012), new Vector3(s * (cx + outerEdgeX + rim * 0.6), topY * 0.55, -0.03)], 0.004))
  } else if (st.kind === 'metal') {
    for (const [pts, dx] of [
      [left, cx],
      [right, -cx],
    ] as const)
      parts.push(place(tubeLoop(pts, rim), dx))
    const bx = cx + innerEdgeX
    // double bridge (aviator)
    parts.push(tubePath([new Vector3(-bx, topY * 0.55, 0), new Vector3(0, topY * 0.68, 0.006), new Vector3(bx, topY * 0.55, 0)], rim * 0.9))
    if (st.doubleBridge) parts.push(tubePath([new Vector3(-bx - 0.02, topY * 0.98, 0), new Vector3(0, topY * 1.02, 0.004), new Vector3(bx + 0.02, topY * 0.98, 0)], rim * 0.8))
    // nose pads
    for (const s of [-1, 1]) {
      const p = new Vector3(s * (bx - 0.045), -st.hh * 0.32, -0.035)
      metal.push(tubePath([new Vector3(s * bx, -st.hh * 0.05, 0), p], rim * 0.55))
      const pad = new ExtrudeGeometry(new Shape(lensOutline({ ...st, hw: 0.018, hh: 0.032, n: 2, taper: 0, lift: 0, drop: 0 })), { depth: 0.004, bevelEnabled: false })
      pad.rotateY(s * 0.9)
      pad.translate(p.x, p.y, p.z)
      metal.push(pad)
    }
  } else if (st.kind === 'browline') {
    // heavy brow bar over the top half…
    for (const [pts, dx] of [
      [left, cx],
      [right, -cx],
    ] as const) {
      // same sample indices on both edges (θ just past 0 → just past π), so the band never folds
      const n = pts.length
      const ring = offset(pts, rim)
      const idx: number[] = []
      for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2
        if (th <= Math.PI + 0.14 || th >= Math.PI * 2 - 0.14) idx.push(i)
      }
      // order the arc continuously from the outer-bottom (θ≈−0.14) round the top to the inner-bottom
      idx.sort((a, b) => ((a / n) * Math.PI * 2 + (a / n > 0.5 ? -Math.PI * 2 : 0)) - ((b / n) * Math.PI * 2 + (b / n > 0.5 ? -Math.PI * 2 : 0)))
      const bar = new Shape([...idx.map((i) => ring[i]), ...idx.slice().reverse().map((i) => pts[i])])
      const g = new ExtrudeGeometry(bar, { depth: 0.032, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 })
      g.translate(dx, 0, -0.016)
      parts.push(g)
      // …and a fine wire under the lens
      metal.push(place(tubeLoop(pts, 0.0045), dx))
    }
    const bx = cx + innerEdgeX
    metal.push(tubePath([new Vector3(-bx, topY * 0.5, 0), new Vector3(0, topY * 0.62, 0.006), new Vector3(bx, topY * 0.5, 0)], 0.007))
  } else {
    // rimless: drilled lenses, a fine bridge and studs
    const bx = cx + innerEdgeX
    metal.push(tubePath([new Vector3(-bx - 0.01, topY * 0.35, 0.002), new Vector3(0, topY * 0.55, 0.008), new Vector3(bx + 0.01, topY * 0.35, 0.002)], 0.006))
    for (const s of [-1, 1])
      for (const ex of [cx + outerEdgeX - 0.02, cx + innerEdgeX + 0.02])
        metal.push(tubePath([new Vector3(s * ex, topY * 0.4, 0.008), new Vector3(s * ex, topY * 0.4, -0.012)], 0.0055))
  }

  // lenses (slightly domed slabs)
  const lensParts: BufferGeometry[] = []
  for (const [pts, dx] of [
    [left, cx],
    [right, -cx],
  ] as const) {
    const g = new ExtrudeGeometry(new Shape(pts), { depth: st.kind === 'rimless' ? 0.01 : 0.006, bevelEnabled: st.kind === 'rimless', bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 })
    g.translate(dx, 0, -0.004)
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - dx
      const y = pos.getY(i)
      pos.setZ(i, pos.getZ(i) + 0.03 * (1 - (x * x + y * y) / (st.hw * st.hw + st.hh * st.hh)))
    }
    g.computeVertexNormals()
    lensParts.push(g)
  }

  const frame = parts.length ? mergeGeometries(parts.map(ni)) : new BufferGeometry()
  const metalGeo = metal.length ? mergeGeometries(metal.map(ni)) : null
  parts.forEach((g) => g.dispose())
  metal.forEach((g) => g.dispose())
  const lens = mergeGeometries(lensParts.map(ni))
  lensParts.forEach((g) => g.dispose())

  const hx = cx + outerEdgeX + rim * 0.6
  const hy = topY * 0.55
  const metalLook = st.frame === 'gold' ? 'gold' : 'silver'
  return {
    frame,
    frameMat: frameMaterial(st.kind === 'rimless' ? 'silver' : st.frame),
    metal: metalGeo,
    metalMat: frameMaterial(metalLook),
    lens,
    lensMat: new MeshPhysicalMaterial({
      color: st.lensTint,
      transparent: true,
      opacity: st.lensOpacity,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.6,
      depthWrite: false,
    }),
    hinge: [new Vector3(-hx, hy, -0.02), new Vector3(hx, hy, -0.02)],
    templeSize: st.kind === 'acetate' || st.kind === 'browline' ? [0.012 * k, 0.026 * Math.min(1.2, k)] : [0.007, 0.009],
  }
}

/** Arc used by the temples' ear bend. */
export const earBend = (from: Vector3, down: number, back: number) =>
  new QuadraticBezierCurve3(from, from.clone().add(new Vector3(0, 0.005, -back * 0.6)), from.clone().add(new Vector3(0, -down, -back)))
