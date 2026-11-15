import { LatheGeometry, Vector2 } from 'three'

/* ──────────────────────────────────────────────────────────────
   Oura Ring 4 proportions, in ring-inner-radius units
   (inner Ø ≈ 18 mm → Ri = 1; width 7.9 mm; wall ≈ 2.9 mm).
   Axis = +Y. The band is two lathes that meet on the side faces:
   the ceramic shell (sides + domed outer) and the polished inner.
   ────────────────────────────────────────────────────────────── */

export const RI = 1 // inner radius
export const RO = 1.3 // outer radius at the edges
export const HW = 0.43 // half width along the axis
const DOME = 0.045 // outer crown height
const CR = 0.085 // outer corner radius
const CI = 0.04 // inner corner radius
const BULGE = 0.014 // comfort-fit inward bulge
export const SIDE_IN = RI + CI // where ceramic meets metal on the side faces

const arc = (pts: Vector2[], cx: number, cy: number, r: number, a0: number, a1: number, n: number) => {
  for (let i = 1; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push(new Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
}

/** Profile order bottom→outside→top so lathe normals face outward. */
function outerProfile() {
  const pts: Vector2[] = [new Vector2(SIDE_IN, -HW)]
  const steps = 6
  for (let i = 1; i <= steps; i++) pts.push(new Vector2(SIDE_IN + ((RO - CR - SIDE_IN) * i) / steps, -HW))
  arc(pts, RO - CR, -HW + CR, CR, -Math.PI / 2, 0, 14)
  const span = HW - CR
  const n = 40
  for (let i = 1; i < n; i++) {
    const y = -span + (2 * span * i) / n
    const t = y / span
    pts.push(new Vector2(RO + DOME * (1 - t * t), y))
  }
  pts.push(new Vector2(RO, span))
  arc(pts, RO - CR, HW - CR, CR, 0, Math.PI / 2, 14)
  for (let i = steps - 1; i >= 0; i--) pts.push(new Vector2(SIDE_IN + ((RO - CR - SIDE_IN) * i) / steps, HW))
  return pts
}

/** Profile order top→down the inside so lathe normals face the axis. */
function innerProfile() {
  const pts: Vector2[] = [new Vector2(SIDE_IN, HW)]
  arc(pts, SIDE_IN, HW - CI, CI, Math.PI / 2, Math.PI, 10)
  const span = HW - CI
  const n = 30
  for (let i = 1; i < n; i++) {
    const y = span - (2 * span * i) / n
    const t = y / span
    pts.push(new Vector2(RI - BULGE * (1 - t * t), y))
  }
  pts.push(new Vector2(RI, -span))
  arc(pts, SIDE_IN, -HW + CI, CI, Math.PI, (3 * Math.PI) / 2, 10)
  return pts
}

export const createOuterGeometry = (segments = 192) => new LatheGeometry(outerProfile(), segments)
export const createInnerGeometry = (segments = 192) => new LatheGeometry(innerProfile(), segments)

/** Inner-surface radius at axial position y (for placing sensors). */
export const innerRadiusAt = (y: number) => {
  const t = y / (HW - CI)
  return RI - BULGE * (1 - t * t)
}
