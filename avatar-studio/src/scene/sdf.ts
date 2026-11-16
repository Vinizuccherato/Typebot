/* ──────────────────────────────────────────────────────────────
   Procedural, anonymous adult avatar (head, open-eye sockets, hair, shoulders)
   as signed distance fields.
   Head-local frame of lib/face.ts: 1 unit = 10 cm, origin = nasion,
   +Y up, +X viewer's right, +Z toward the viewer.

   Every primitive is placed so the frontal (x, y) of each LANDMARK
   falls on its anatomy (raycast along −Z). Paired features use |x|.
   Scalar math only — this runs a few hundred thousand times at build.
   ────────────────────────────────────────────────────────────── */

const sqrt = Math.sqrt
const abs = Math.abs
const max = Math.max
const min = Math.min

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

function capsule(
  px: number, py: number, pz: number,
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  r: number,
) {
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

/** Head, face and neck (no shoulders). */
export function sdfHead(x: number, y: number, z: number): number {
  const ax = abs(x)

  // cranium
  let d = ell(x, y - 0.36, z + 0.95, 0.75, 0.74, 0.92)
  // occipital fullness
  d = smin(d, ell(x, y - 0.12, z + 1.25, 0.66, 0.62, 0.62), 0.2)
  // midface
  d = smin(d, ell(x, y + 0.2, z + 0.5, 0.68, 0.55, 0.48), 0.18)
  // cheekbones (malar → zygomatic arch)
  d = smin(d, ell(ax - 0.5, y + 0.14, z + 0.4, 0.23, 0.13, 0.22), 0.14)
  d = smin(d, ell(ax - 0.38, y + 0.2, z + 0.18, 0.17, 0.12, 0.14), 0.12)
  // lower face / mandible body
  d = smin(d, ell(x, y + 0.78, z + 0.48, 0.58, 0.45, 0.47), 0.16)
  // ramus + gonial angle
  d = smin(d, ell(ax - 0.52, y + 0.85, z + 0.66, 0.1, 0.3, 0.25), 0.14)
  // chin
  d = smin(d, ell(x, y + 1.08, z + 0.13, 0.22, 0.18, 0.15), 0.1)
  // brow ridge (glabella → tail)
  d = smin(d, capsule(ax, y, z, 0, 0.1, -0.04, 0.6, 0.15, -0.32, 0.09), 0.1)
  // forehead plane softening above brows
  d = smin(d, ell(x, y - 0.38, z + 0.32, 0.52, 0.3, 0.24), 0.16)
  // eye sockets — open: the eyeballs and lid shells (Eyes.tsx) sit in here
  d = smax(d, -ell(ax - 0.32, y + 0.04, z + 0.13, 0.172, 0.112, 0.115), 0.05)
  // nose: bridge, tip, alae, columella, nostrils
  d = smin(d, capsule(x, y, z, 0, 0, -0.07, 0, -0.38, 0.12, 0.075), 0.12)
  d = smin(d, sphere(x, y + 0.43, z - 0.165, 0.08), 0.07)
  d = smin(d, sphere(ax - 0.13, y + 0.5, z - 0.005, 0.064), 0.09)
  d = smin(d, ell(x, y + 0.56, z - 0.03, 0.07, 0.05, 0.07), 0.05)
  d = smax(d, -sphere(ax - 0.065, y + 0.545, z - 0.09, 0.03), 0.02)
  // philtrum
  d = smin(d, ell(x, y + 0.64, z + 0.02, 0.12, 0.08, 0.08), 0.06)
  d = smax(d, -ell(x, y + 0.64, z - 0.07, 0.022, 0.06, 0.02), 0.03)
  // lips
  d = smin(d, ell(x, y + 0.71, z + 0.03, 0.23, 0.065, 0.11), 0.05)
  d = smin(d, ell(x, y + 0.85, z + 0.05, 0.21, 0.07, 0.11), 0.05)
  d = smax(d, -ell(x, y + 0.78, z - 0.06, 0.25, 0.012, 0.09), 0.015)
  // ears
  d = smin(d, ell(ax - 0.75, y + 0.15, z + 0.95, 0.095, 0.27, 0.16), 0.07)
  d = smax(d, -ell(ax - 0.8, y + 0.12, z + 0.93, 0.03, 0.2, 0.1), 0.03)
  // neck
  d = smin(d, capsule(x, y, z, 0, -0.85, -0.95, 0, -2.6, -0.85, 0.52), 0.22)
  return d
}

/** Head + trapezius + shoulders + upper chest. */
export function sdfFigure(x: number, y: number, z: number): number {
  const ax = abs(x)
  let d = sdfHead(x, y, z)
  if (y < -1.05) {
    d = smin(d, capsule(ax, y, z, 0.2, -1.9, -1.0, 1.5, -2.45, -0.95, 0.36), 0.3)
    d = smin(d, capsule(ax, y, z, 1.2, -2.55, -0.9, 2.1, -2.8, -0.85, 0.42), 0.25)
    d = smin(d, ell(x, y + 3.05, z + 0.75, 1.65, 0.62, 0.58), 0.3)
  }
  return d
}

/** The big masses only (cranium, face, jaw, chin, neck, shoulders) — drives the thermal silhouette rim. */
export function sdfBase(x: number, y: number, z: number): number {
  const ax = abs(x)
  let d = ell(x, y - 0.36, z + 0.95, 0.75, 0.74, 0.92)
  d = smin(d, ell(x, y - 0.12, z + 1.25, 0.66, 0.62, 0.62), 0.25)
  d = smin(d, ell(x, y + 0.2, z + 0.42, 0.7, 0.62, 0.5), 0.3)
  d = smin(d, ell(x, y + 0.78, z + 0.45, 0.6, 0.48, 0.5), 0.3)
  d = smin(d, ell(x, y + 1.08, z + 0.15, 0.24, 0.2, 0.16), 0.2)
  d = smin(d, capsule(x, y, z, 0, -0.85, -0.95, 0, -2.6, -0.85, 0.52), 0.3)
  if (y < -1.05) {
    d = smin(d, capsule(ax, y, z, 0.2, -1.9, -1.0, 1.5, -2.45, -0.95, 0.36), 0.3)
    d = smin(d, capsule(ax, y, z, 1.2, -2.55, -0.9, 2.1, -2.8, -0.85, 0.42), 0.25)
    d = smin(d, ell(x, y + 3.05, z + 0.75, 1.65, 0.62, 0.58), 0.3)
  }
  return d
}

/* ── hair ─────────────────────────────────────────────────────────
   Long, straight, centre-parted hair: a scalp cap with the face cut out
   along a natural hairline, two curtains framing the face and falling in
   front of the shoulders, and a back mass. Head-local units. */

/** One curtain of hair (x mirrored by the caller), swept as a chain of ellipsoids. */
function curtain(ax: number, y: number, z: number): number {
  let d = 1e9
  const N = 9
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const cx = 0.7 + 0.32 * t * t + 0.06 * t
    const cy = 0.35 - 3.75 * t
    const cz = -0.62 + 0.62 * t * (1.6 - t)
    const rx = 0.2 - 0.07 * t
    const ry = 0.42
    const rz = 0.5 - 0.18 * t
    d = smin(d, ell(ax - cx, y - cy, z - cz, rx, ry, rz), 0.16)
  }
  return d
}

export function sdfHair(x: number, y: number, z: number): number {
  const ax = abs(x)
  // scalp cap: cranium offset outward
  let d = ell(x, y - 0.38, z + 0.95, 0.83, 0.82, 0.99)
  d = smin(d, ell(x, y - 0.12, z + 1.27, 0.73, 0.7, 0.7), 0.2)
  // side volume over the ears
  d = smin(d, ell(ax - 0.62, y + 0.05, z + 0.75, 0.24, 0.62, 0.55), 0.18)
  // curtains framing the face
  d = smin(d, curtain(ax, y, z), 0.14)
  // back mass, falling behind the neck to below the shoulders
  d = smin(d, ell(x, y + 1.35, z + 1.3, 0.98, 2.25, 0.42), 0.3)
  // face window: hairline at the trichion, lower at the temples
  d = smax(d, -ell(x, y + 0.3, z - 0.15, 0.6, 0.93, 0.95), 0.08)
  // keep the curtains clear of the cheeks/jaw
  d = smax(d, -ell(x, y + 0.75, z + 0.05, 0.6, 1.2, 0.9), 0.06)
  // centre part
  d = smax(d, -capsule(x, y, z, 0, 1.25, 0.0, 0, 0.95, -1.5, 0.018), 0.025)
  // never inside the head
  d = smax(d, -(sdfHead(x, y, z) - 0.025), 0.03)
  return d
}
