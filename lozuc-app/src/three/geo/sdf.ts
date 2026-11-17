/* ──────────────────────────────────────────────────────────────
   lozuc head: a procedural, anonymous ADULT MALE head, neck and
   shoulders as signed distance fields, plus the hair and beard shells
   used to visualise grooming directions.

   Head-local frame of lib/face.ts: 1 unit = 10 cm, origin = nasion,
   +Y up, +X viewer's right, +Z toward the viewer. Features sit on the
   frontal (x, y) of each LANDMARK (raycast along −Z). Paired features use |x|.
   Scalar math only — this runs a few million times at build (in a worker).
   ────────────────────────────────────────────────────────────── */

const sqrt = Math.sqrt
const abs = Math.abs
const max = Math.max
const min = Math.min
const sin = Math.sin

/** IQ's bound-correct ellipsoid approximation. */
function ell(px: number, py: number, pz: number, rx: number, ry: number, rz: number) {
  const ax = px / rx
  const ay = py / ry
  const az = pz / rz
  const k0 = sqrt(ax * ax + ay * ay + az * az)
  const bx = px / (rx * rx)
  const by = py / (ry * ry)
  const bz = pz / (rz * rz)
  const k1 = sqrt(bx * bx + by * by + bz * bz)
  return k1 < 1e-9 ? -min(rx, ry, rz) : (k0 * (k0 - 1)) / k1
}

function sphere(px: number, py: number, pz: number, r: number) {
  return sqrt(px * px + py * py + pz * pz) - r
}

function capsule(px: number, py: number, pz: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number) {
  const pax = px - ax
  const pay = py - ay
  const paz = pz - az
  const bax = bx - ax
  const bay = by - ay
  const baz = bz - az
  let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)
  h = h < 0 ? 0 : h > 1 ? 1 : h
  const dx = pax - bax * h
  const dy = pay - bay * h
  const dz = paz - baz * h
  return sqrt(dx * dx + dy * dy + dz * dz) - r
}

/** polynomial smooth min / max */
function smin(a: number, b: number, k: number) {
  const h = max(k - abs(a - b), 0) / k
  return min(a, b) - h * h * k * 0.25
}
function smax(a: number, b: number, k: number) {
  return -smin(-a, -b, k)
}
const sstep = (a: number, b: number, x: number) => {
  const t = min(1, max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/* ── head ──────────────────────────────────────────────────── */

/** Skull (cranium + occiput) — the surface every hair shell is offset from. */
function skull(x: number, y: number, z: number) {
  let d = ell(x, y - 0.37, z + 0.93, 0.79, 0.77, 0.93)
  d = smin(d, ell(x, y - 0.12, z + 1.22, 0.69, 0.65, 0.63), 0.22)
  return d
}

/** Male head, face and neck: stronger brow ridge, defined jaw and gonial angle, squarer chin, Adam's apple. */
export function sdfHead(x: number, y: number, z: number): number {
  const ax = abs(x)
  let d = skull(x, y, z)
  // face block: a slightly longer, flatter-sided egg than the female sculpt
  d = smin(d, ell(x, y + 0.27, z + 0.46, 0.69, 0.86, 0.55), 0.24)
  // jaw: wide and firm
  d = smin(d, ell(x, y + 0.78, z + 0.44, 0.57, 0.4, 0.47), 0.17)
  // gonial angles: a clear corner under the ears
  d = smin(d, ell(ax - 0.5, y + 0.74, z + 0.66, 0.13, 0.25, 0.25), 0.13)
  // square chin with a soft mental protuberance
  d = smin(d, ell(x, y + 1.04, z + 0.2, 0.22, 0.14, 0.14), 0.13)
  d = smin(d, ell(x, y + 1.0, z + 0.1, 0.14, 0.09, 0.09), 0.08)
  // high cheekbones, leaner cheeks
  d = smin(d, ell(ax - 0.43, y + 0.17, z + 0.24, 0.21, 0.13, 0.19), 0.18)
  d = smin(d, ell(ax - 0.36, y + 0.42, z + 0.3, 0.2, 0.2, 0.17), 0.2)
  // pronounced brow ridge + glabella
  d = smin(d, capsule(ax, y, z, 0, 0.12, 0.0, 0.56, 0.14, -0.23, 0.074), 0.12)
  d = smin(d, sphere(x, y - 0.09, z - 0.01, 0.07), 0.09)
  // eye sockets — the eyeballs + lid shells (Eyes.tsx) sit here
  d = smax(d, -ell(ax - 0.345, y + 0.035, z + 0.11, 0.19, 0.122, 0.12), 0.05)
  // nose: straight bridge, defined tip, alae
  d = smin(d, capsule(x, y, z, 0, -0.02, 0.04, 0, -0.32, 0.165, 0.048), 0.12)
  d = smin(d, sphere(x, y + 0.355, z - 0.165, 0.058), 0.08)
  d = smin(d, sphere(ax - 0.095, y + 0.405, z - 0.07, 0.04), 0.09)
  // nostrils
  d = smax(d, -ell(ax - 0.045, y + 0.43, z - 0.115, 0.022, 0.012, 0.03), 0.015)
  // philtrum
  d = smin(d, ell(x, y + 0.53, z - 0.03, 0.075, 0.05, 0.04), 0.06)
  // lips: fuller lower lip, thin upper, clean mouth line
  d = smin(d, ell(x, y + 0.615, z - 0.04, 0.16, 0.03, 0.045), 0.045)
  d = smin(d, ell(x, y + 0.715, z - 0.045, 0.145, 0.04, 0.05), 0.045)
  d = smax(d, -capsule(ax, y, z, 0, -0.655, 0.1, 0.2, -0.65, 0.05, 0.004), 0.018)
  // ears, with a hollow (concha)
  d = smin(d, ell(ax - 0.76, y + 0.12, z + 0.95, 0.085, 0.24, 0.16), 0.07)
  d = smax(d, -ell(ax - 0.81, y + 0.15, z + 0.93, 0.03, 0.15, 0.09), 0.03)
  // neck: thicker, short, with the sternocleidomastoid volumes and an Adam's apple
  d = smin(d, capsule(x, y, z, 0, -0.7, -0.92, 0, -2.3, -0.82, 0.43), 0.3)
  d = smin(d, capsule(ax, y, z, 0.48, -0.55, -1.0, 0.16, -1.9, -0.52, 0.11), 0.16)
  d = smin(d, ell(x, y + 1.46, z + 0.47, 0.07, 0.1, 0.07), 0.06)
  return d
}

/** Head + trapezius + broad shoulders + chest + upper arms. */
export function sdfFigure(x: number, y: number, z: number): number {
  const ax = abs(x)
  let d = sdfHead(x, y, z)
  if (y < -0.95) {
    d = smin(d, capsule(ax, y, z, 0.25, -1.74, -0.98, 1.3, -2.18, -0.92, 0.33), 0.34)
    d = smin(d, capsule(ax, y, z, 1.05, -2.3, -0.88, 1.8, -2.62, -0.86, 0.38), 0.3)
    d = smin(d, ell(x, y + 2.95, z + 0.72, 1.55, 0.62, 0.58), 0.34)
    d = smin(d, ell(x, y + 4.3, z + 0.74, 1.6, 1.6, 0.62), 0.4)
    d = smin(d, capsule(ax, y, z, 1.72, -2.7, -0.85, 1.95, -5.8, -0.85, 0.42), 0.3)
  }
  return d
}

/** Big masses only — base normals for broad rims (scan material). */
export function sdfBase(x: number, y: number, z: number): number {
  let d = skull(x, y, z)
  d = smin(d, ell(x, y + 0.27, z + 0.46, 0.69, 0.86, 0.55), 0.3)
  d = smin(d, ell(x, y + 0.78, z + 0.44, 0.57, 0.4, 0.47), 0.3)
  d = smin(d, capsule(x, y, z, 0, -0.7, -0.92, 0, -2.3, -0.82, 0.43), 0.3)
  return d
}

/* ── hair ──────────────────────────────────────────────────────
   Every style is a shell offset from the skull, clipped by the hairline:
   forehead line with temple recesses at the front, a line above the ears
   with a sideburn strip, and the nape at the back. Short-sided styles keep a
   thin side shell; the skin shader adds the fade (stipple) beneath it. */

/** Hairline height at (|x|, z): below it there is no hair. */
export function hairlineH(ax: number, z: number) {
  const front = 0.6 - 0.55 * ax * ax - 0.12 * sstep(0.32, 0.52, ax) // temple recesses
  const side = 0.03 - 0.62 * sstep(-0.98, -1.5, z) // above the ear → nape
  const w = sstep(-0.32, -0.72, z) // 0 at the front, 1 at the side/back
  let h = front * (1 - w) + side * w
  // sideburn strip in front of the ear
  const sb = Math.exp(-(((z + 0.8) / 0.09) ** 2)) * sstep(0.6, 0.72, ax)
  h -= 0.3 * sb
  return h
}

export type HairShape = 'current' | 'textured-crop' | 'side-part' | 'slick-back' | 'medium-flow'

interface Shell {
  top: number // thickness on the crown
  side: number // thickness over the ears / temples
  back: number
  sideTop: number // height where the side thickness reaches the top thickness (fade height)
}

const SHELLS: Record<HairShape, Shell> = {
  current: { top: 0.12, side: 0.13, back: 0.1, sideTop: 0.0 },
  'textured-crop': { top: 0.11, side: 0.018, back: 0.02, sideTop: 0.48 },
  'side-part': { top: 0.1, side: 0.03, back: 0.035, sideTop: 0.38 },
  'slick-back': { top: 0.085, side: 0.028, back: 0.04, sideTop: 0.4 },
  'medium-flow': { top: 0.16, side: 0.13, back: 0.15, sideTop: 0.0 },
}

export function sdfHair(shape: HairShape) {
  const s = SHELLS[shape]
  return (x: number, y: number, z: number): number => {
    const ax = abs(x)
    // thickness: side → top across the fade height, back thickness at the occiput
    const up = sstep(s.sideTop - 0.28, s.sideTop + 0.08, y)
    const back = sstep(-0.9, -1.5, z) * (1 - sstep(0.4, 0.8, y))
    let t = s.side + (s.top - s.side) * up
    t = t * (1 - back) + max(s.back, t * 0.6) * back
    let d = skull(x, y, z) - t

    if (shape === 'current') {
      // untidy volume at the sides + a loose fringe
      d = smin(d, ell(ax - 0.62, y - 0.18, z + 0.85, 0.26, 0.32, 0.42), 0.16)
      d = smin(d, ell(x + 0.05, y - 0.6, z + 0.12, 0.42, 0.13, 0.22), 0.14)
      d -= 0.018 * sin(x * 11 + z * 5) * sin(y * 9 + x * 3) * sin(z * 8 + y * 2)
    } else if (shape === 'textured-crop') {
      // volume on top, pushed forward, with chunky texture
      d = smin(d, ell(x, y - 0.66, z + 0.62, 0.6, 0.27, 0.72), 0.12)
      d = smin(d, ell(x, y - 0.6, z + 0.08, 0.4, 0.11, 0.2), 0.1)
      d -= 0.022 * sin(x * 17 + y * 3) * sin(z * 15 + x * 2) * sstep(0.35, 0.7, y)
    } else if (shape === 'side-part') {
      // combed to the viewer's right from a part at x ≈ −0.32
      d = smin(d, ell(x - 0.08, y - 0.7, z + 0.7, 0.66, 0.24, 0.72), 0.13)
      d = smin(d, ell(x + 0.02, y - 0.62, z + 0.06, 0.46, 0.1, 0.2), 0.1)
      d = smax(d, -capsule(x, y, z, -0.33, 0.96, 0.1, -0.36, 0.92, -1.0, 0.012), 0.02)
      d -= 0.006 * sin(z * 40 + x * 6)
    } else if (shape === 'slick-back') {
      // smooth volume swept back, a little lift at the front
      d = smin(d, ell(x, y - 0.66, z + 0.78, 0.6, 0.24, 0.82), 0.14)
      d = smin(d, ell(x, y - 0.66, z + 0.2, 0.4, 0.12, 0.2), 0.12)
      d -= 0.008 * sin(x * 34 + z * 4)
    } else if (shape === 'medium-flow') {
      // longer top with movement falling to one side, covering the ear tops, longer nape
      d = smin(d, ell(x - 0.06, y - 0.66, z + 0.62, 0.68, 0.32, 0.8), 0.14)
      d = smin(d, ell(x - 0.12, y - 0.48, z + 0.06, 0.52, 0.16, 0.24), 0.12)
      d = smin(d, ell(ax - 0.68, y - 0.05, z + 0.92, 0.2, 0.36, 0.42), 0.14)
      d = smin(d, ell(x, y + 0.55, z + 1.42, 0.62, 0.42, 0.26), 0.18)
      d -= 0.02 * sin(x * 9 + y * 7) * sin(z * 7 - y * 3)
    }

    // hairline clip (keep hair only above it; front clip only in front of the ear)
    d = smax(d, hairlineH(ax, z) - y, 0.05)
    if (shape !== 'current' && shape !== 'medium-flow') d = smax(d, -0.36 - y, 0.04) // short nape
    // never inside the head
    d = smax(d, -(sdfHead(x, y, z) - 0.008), 0.02)
    return d
  }
}

/* ── beard ─────────────────────────────────────────────────────
   Shells offset from the face inside the beard zone: below the cheek line,
   above the neckline, connected to the sideburns, with the lips cut out. */

/** Signed zone function: negative inside the beard area. */
function beardZone(x: number, y: number, z: number, cheekLift: number, neckDrop: number) {
  const ax = abs(x)
  // cheek line: from the sideburn (|x| .74, y −.2) down toward the mouth corner (|x| .26, y −.55)
  const cheek = -0.2 - 0.35 * sstep(0.74, 0.24, ax) + cheekLift
  let d = y - cheek
  // neckline: two fingers above the Adam's apple at the front, rising toward the ear at the back
  const neck = -1.32 - neckDrop + 0.55 * sstep(-0.55, -1.0, z)
  d = max(d, neck - y)
  // don't wrap behind the ear
  d = max(d, -(z + 1.02))
  // lips opening
  d = max(d, -ell(x, y + 0.67, z - 0.04, 0.2, 0.1, 0.4))
  // moustache stays (fill the space above the upper lip up to the nose)
  const mous = ell(x, y + 0.545, z - 0.0, 0.25, 0.07, 0.4)
  d = min(d, max(mous, -ell(x, y + 0.67, z - 0.04, 0.2, 0.085, 0.4)))
  return d
}

export type BeardShape = 'short-boxed' | 'full' | 'goatee'

/** sdfHead normalised by its gradient near the surface, so shell offsets are real thicknesses. */
function faceDist(x: number, y: number, z: number) {
  const f = sdfHead(x, y, z)
  if (abs(f) > 0.3) return f
  const e = 0.004
  const gx = sdfHead(x + e, y, z) - sdfHead(x - e, y, z)
  const gy = sdfHead(x, y + e, z) - sdfHead(x, y - e, z)
  const gz = sdfHead(x, y, z + e) - sdfHead(x, y, z - e)
  const g = sqrt(gx * gx + gy * gy + gz * gz) / (2 * e)
  return f / max(0.35, g)
}

export function sdfBeard(shape: BeardShape) {
  return (x: number, y: number, z: number): number => {
    const ax = abs(x)
    const face = faceDist(x, y, z)
    let d: number
    if (shape === 'goatee') {
      const chin = ell(x, y + 0.95, z - 0.0, 0.2, 0.24, 0.6)
      const mous = ell(x, y + 0.56, z - 0.0, 0.22, 0.06, 0.4)
      let zone = smin(chin, mous, 0.05)
      zone = max(zone, -ell(x, y + 0.67, z - 0.04, 0.2, 0.085, 0.4))
      d = max(face - 0.04 * min(1, max(0.12, -zone / 0.05)), zone)
    } else if (shape === 'full') {
      const zone = beardZone(x, y, z, 0.06, 0.1)
      // fuller at the chin and jaw
      const bulk = 0.07 + 0.05 * Math.exp(-((x / 0.34) ** 2 + ((y + 1.0) / 0.22) ** 2)) + 0.02 * sstep(0.3, 0.6, ax) * sstep(-0.5, -0.85, y)
      d = max(face - bulk * min(1, max(0.1, -zone / 0.14)), zone)
      d -= 0.008 * sin(x * 25 + y * 6) * sin(y * 18 + z * 4)
    } else {
      // short boxed: 6–8 mm, crisp lines
      const zone = beardZone(x, y, z, -0.08, -0.02)
      d = max(face - 0.03 * min(1, max(0.2, -zone / 0.035)), zone)
    }
    // never inside the face
    d = smax(d, -(face - 0.004), 0.012)
    return d
  }
}
