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

/** Head, face and neck — premium stylized adult: round, soft, short midface. */
export function sdfHead(x: number, y: number, z: number): number {
  const ax = abs(x)

  // cranium (round) + occiput
  let d = ell(x, y - 0.38, z + 0.92, 0.78, 0.76, 0.9)
  d = smin(d, ell(x, y - 0.14, z + 1.2, 0.68, 0.64, 0.62), 0.22)
  // face: one soft egg from forehead to chin
  d = smin(d, ell(x, y + 0.25, z + 0.45, 0.68, 0.82, 0.55), 0.26)
  // soft rounded jaw
  d = smin(d, ell(x, y + 0.7, z + 0.42, 0.52, 0.42, 0.47), 0.22)
  d = smin(d, ell(ax - 0.47, y + 0.6, z + 0.66, 0.11, 0.3, 0.24), 0.22)
  // small rounded chin
  d = smin(d, ell(x, y + 0.98, z + 0.2, 0.17, 0.14, 0.13), 0.18)
  // full, soft cheeks
  d = smin(d, ell(ax - 0.36, y + 0.33, z + 0.18, 0.24, 0.22, 0.2), 0.22)
  // a whisper of brow ridge
  d = smin(d, capsule(ax, y, z, 0, 0.1, -0.03, 0.55, 0.15, -0.25, 0.055), 0.16)
  // eye sockets — the eyeballs + lid shells (Eyes.tsx) sit here
  d = smax(d, -ell(ax - 0.345, y + 0.035, z + 0.1, 0.195, 0.128, 0.12), 0.06)
  // nose: short narrow bridge blending into the brow, small rounded tip, subtle alae
  d = smin(d, capsule(x, y, z, 0, -0.02, 0.03, 0, -0.29, 0.12, 0.042), 0.14)
  d = smin(d, sphere(x, y + 0.34, z - 0.13, 0.052), 0.09)
  d = smin(d, sphere(ax - 0.08, y + 0.4, z - 0.065, 0.033), 0.1)
  // philtrum (barely there)
  d = smin(d, ell(x, y + 0.52, z - 0.03, 0.07, 0.05, 0.04), 0.07)
  // soft lips sitting flat on the face, clean mouth line with the corners slightly up
  d = smin(d, ell(x, y + 0.6, z - 0.045, 0.155, 0.038, 0.05), 0.05)
  d = smin(d, ell(x, y + 0.71, z - 0.05, 0.135, 0.046, 0.05), 0.05)
  d = smax(d, -capsule(ax, y, z, 0, -0.655, 0.1, 0.19, -0.643, 0.06, 0.004), 0.02)
  // ears (mostly under the hair)
  d = smin(d, ell(ax - 0.74, y + 0.12, z + 0.92, 0.08, 0.22, 0.14), 0.07)
  // short, softly tapered neck
  d = smin(d, capsule(x, y, z, 0, -0.7, -0.9, 0, -2.3, -0.8, 0.36), 0.3)
  return d
}

/** Head + trapezius + shoulders + chest + upper arms. */
export function sdfFigure(x: number, y: number, z: number): number {
  const ax = abs(x)
  let d = sdfHead(x, y, z)
  if (y < -0.95) {
    d = smin(d, capsule(ax, y, z, 0.2, -1.78, -0.95, 1.15, -2.2, -0.92, 0.3), 0.34)
    d = smin(d, capsule(ax, y, z, 0.95, -2.35, -0.88, 1.62, -2.66, -0.85, 0.36), 0.3)
    d = smin(d, ell(x, y + 2.95, z + 0.72, 1.4, 0.62, 0.55), 0.34)
    d = smin(d, ell(x, y + 4.3, z + 0.74, 1.45, 1.6, 0.6), 0.4)
    d = smin(d, capsule(ax, y, z, 1.55, -2.72, -0.85, 1.8, -5.8, -0.85, 0.4), 0.3)
  }
  return d
}

/** The big masses only — used for the mesher's base normals. */
export function sdfBase(x: number, y: number, z: number): number {
  let d = ell(x, y - 0.38, z + 0.92, 0.78, 0.76, 0.9)
  d = smin(d, ell(x, y + 0.25, z + 0.45, 0.68, 0.82, 0.55), 0.3)
  d = smin(d, ell(x, y + 0.7, z + 0.42, 0.52, 0.42, 0.47), 0.3)
  d = smin(d, capsule(x, y, z, 0, -0.7, -0.9, 0, -2.3, -0.8, 0.36), 0.3)
  return d
}

/* ── hair ─────────────────────────────────────────────────────────
   Long, straight, centre-parted: a cap hugging the skull, a crisp part,
   and two smooth sheets that fall from the part over the forehead corners
   and ears, frame the cheeks and drop to the chest; a back sheet behind. */

/** Hairline seen from the front: high at the part, sweeping down to the temples. */
const hairline = (ax: number) => 0.64 - 0.72 * ax * ax

/** One front sheet (x mirrored by the caller), swept as a dense chain of flattened ellipsoids. */
function sheet(ax: number, y: number, z: number): number {
  let d = 1e9
  const N = 20
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const cx = 0.7 + 0.08 * t + 0.34 * t * t
    const cy = 0.22 - 3.25 * t
    const cz = -0.5 + 0.66 * t * (1.25 - t)
    const taper = 1 - 0.55 * smoothT(0.7, 1, t)
    const rx = (0.12 + 0.02 * t) * taper
    const ry = 0.36
    const rz = (0.38 - 0.06 * t) * (0.6 + 0.4 * taper)
    d = smin(d, ell(ax - cx, y - cy, z - cz, rx, ry, rz), 0.2)
  }
  return d
}
function smoothT(a: number, b: number, t: number) {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)))
  return u * u * (3 - 2 * u)
}

export function sdfHair(x: number, y: number, z: number): number {
  const ax = abs(x)
  // cap hugging the skull (low, not tall)
  let d = ell(x, y - 0.38, z + 0.92, 0.835, 0.81, 0.955)
  d = smin(d, ell(x, y - 0.14, z + 1.2, 0.73, 0.69, 0.67), 0.2)
  // open the face below the hairline (front only), so no window outline
  const cutter = max(y - hairline(ax), -0.52 - z)
  d = smax(d, -cutter, 0.1)
  // front sheets framing the face
  d = smin(d, sheet(ax, y, z), 0.22)
  // back sheet
  d = smin(d, ell(x, y + 1.3, z + 1.22, 0.92, 2.15, 0.36), 0.28)
  // keep the sheets off the cheeks and jaw
  d = smax(d, -ell(x, y + 0.45, z - 0.05, 0.67, 1.1, 0.75), 0.05)
  // crisp centre part
  d = smax(d, -capsule(x, y, z, 0, 1.25, 0.06, 0, 0.92, -1.45, 0.011), 0.014)
  // never inside the head
  d = smax(d, -(sdfHead(x, y, z) - 0.018), 0.025)
  return d
}
