import { BufferAttribute, BufferGeometry } from 'three'

/* ──────────────────────────────────────────────────────────────
   Narrow-band Surface Nets over an SDF.
   - coarse pass (stride 4) decides which fine cells are near the surface;
     far samples get a trilinear coarse estimate (only the sign matters there)
   - one vertex per sign-changing cell, projected onto the surface (Newton)
   - normals from the SDF gradient → perfectly smooth shading
   - per-vertex `cavity` (0 convex … 1 deep crease) from SDF occlusion probes
   ────────────────────────────────────────────────────────────── */

export type Sdf = (x: number, y: number, z: number) => number

export interface Bounds {
  min: [number, number, number]
  max: [number, number, number]
}

export function meshSdf(sdf: Sdf, bounds: Bounds, h: number): BufferGeometry {
  const [x0, y0, z0] = bounds.min
  const nx = Math.ceil((bounds.max[0] - x0) / h) + 1
  const ny = Math.ceil((bounds.max[1] - y0) / h) + 1
  const nz = Math.ceil((bounds.max[2] - z0) / h) + 1
  const S = 4 // coarse stride
  const cx = Math.ceil((nx - 1) / S) + 1
  const cy = Math.ceil((ny - 1) / S) + 1
  const cz = Math.ceil((nz - 1) / S) + 1

  const coarse = new Float32Array(cx * cy * cz)
  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) coarse[i + cx * (j + cy * k)] = sdf(x0 + i * S * h, y0 + j * S * h, z0 + k * S * h)

  const band = S * h * 1.9
  const field = new Float32Array(nx * ny * nz)
  const cAt = (i: number, j: number, k: number) => coarse[Math.min(i, cx - 1) + cx * (Math.min(j, cy - 1) + cy * Math.min(k, cz - 1))]
  for (let k = 0; k < nz; k++) {
    const ck = Math.floor(k / S)
    const fk = k / S - ck
    for (let j = 0; j < ny; j++) {
      const cj = Math.floor(j / S)
      const fj = j / S - cj
      for (let i = 0; i < nx; i++) {
        const ci = Math.floor(i / S)
        const fi = i / S - ci
        const a = cAt(ci, cj, ck)
        const b = cAt(ci + 1, cj, ck)
        const c = cAt(ci, cj + 1, ck)
        const d = cAt(ci + 1, cj + 1, ck)
        const e = cAt(ci, cj, ck + 1)
        const f = cAt(ci + 1, cj, ck + 1)
        const g = cAt(ci, cj + 1, ck + 1)
        const hh = cAt(ci + 1, cj + 1, ck + 1)
        const lo = Math.min(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d), Math.abs(e), Math.abs(f), Math.abs(g), Math.abs(hh))
        const sameSign = (a > 0) === (b > 0) && (a > 0) === (c > 0) && (a > 0) === (d > 0) && (a > 0) === (e > 0) && (a > 0) === (f > 0) && (a > 0) === (g > 0) && (a > 0) === (hh > 0)
        const idx = i + nx * (j + ny * k)
        if (sameSign && lo > band) {
          const x1 = a + (b - a) * fi
          const x2 = c + (d - c) * fi
          const x3 = e + (f - e) * fi
          const x4 = g + (hh - g) * fi
          const y1 = x1 + (x2 - x1) * fj
          const y2 = x3 + (x4 - x3) * fj
          field[idx] = y1 + (y2 - y1) * fk
        } else {
          field[idx] = sdf(x0 + i * h, y0 + j * h, z0 + k * h)
        }
      }
    }
  }

  // vertices
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1)
  const pos: number[] = []
  const corners = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ]
  const edges = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
  const v = new Float32Array(8)
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0
        for (let c = 0; c < 8; c++) {
          const [di, dj, dk] = corners[c]
          v[c] = field[i + di + nx * (j + dj + ny * (k + dk))]
          if (v[c] < 0) mask |= 1 << c
        }
        if (mask === 0 || mask === 255) continue
        let sx = 0
        let sy = 0
        let sz = 0
        let n = 0
        for (const [a, b] of edges) {
          const va = v[a]
          const vb = v[b]
          if (va < 0 === vb < 0) continue
          const t = va / (va - vb)
          const ca = corners[a]
          const cb = corners[b]
          sx += ca[0] + (cb[0] - ca[0]) * t
          sy += ca[1] + (cb[1] - ca[1]) * t
          sz += ca[2] + (cb[2] - ca[2]) * t
          n++
        }
        cellVert[i + (nx - 1) * (j + (ny - 1) * k)] = pos.length / 3
        pos.push(x0 + (i + sx / n) * h, y0 + (j + sy / n) * h, z0 + (k + sz / n) * h)
      }

  // faces: one quad per sign-changing grid edge, between the 4 cells sharing it
  const idx: number[] = []
  const cv = (i: number, j: number, k: number) => cellVert[i + (nx - 1) * (j + (ny - 1) * k)]
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return
    if (flip) idx.push(a, b, c, a, c, d)
    else idx.push(a, d, c, a, c, b)
  }
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const a = field[i + nx * (j + ny * k)]
        const b = field[i + 1 + nx * (j + ny * k)]
        if (a < 0 === b < 0) continue
        quad(cv(i, j - 1, k - 1), cv(i, j, k - 1), cv(i, j, k), cv(i, j - 1, k), a < 0)
      }
  for (let k = 1; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const a = field[i + nx * (j + ny * k)]
        const b = field[i + nx * (j + 1 + ny * k)]
        if (a < 0 === b < 0) continue
        quad(cv(i - 1, j, k - 1), cv(i - 1, j, k), cv(i, j, k), cv(i, j, k - 1), a < 0)
      }
  for (let k = 0; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const a = field[i + nx * (j + ny * k)]
        const b = field[i + nx * (j + ny * (k + 1))]
        if (a < 0 === b < 0) continue
        quad(cv(i - 1, j - 1, k), cv(i, j - 1, k), cv(i, j, k), cv(i - 1, j, k), a < 0)
      }

  // project onto the surface, normals from the gradient, cavity from occlusion probes
  const vc = pos.length / 3
  const P = new Float32Array(pos)
  const N = new Float32Array(vc * 3)
  const C = new Float32Array(vc)
  const e = h * 0.25
  for (let q = 0; q < vc; q++) {
    let x = P[q * 3]
    let y = P[q * 3 + 1]
    let z = P[q * 3 + 2]
    let gx = 0
    let gy = 0
    let gz = 0
    for (let it = 0; it < 2; it++) {
      const d = sdf(x, y, z)
      gx = sdf(x + e, y, z) - sdf(x - e, y, z)
      gy = sdf(x, y + e, z) - sdf(x, y - e, z)
      gz = sdf(x, y, z + e) - sdf(x, y, z - e)
      const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1
      gx /= gl
      gy /= gl
      gz /= gl
      if (it < 1) {
        x -= gx * d
        y -= gy * d
        z -= gz * d
      }
    }
    P[q * 3] = x
    P[q * 3 + 1] = y
    P[q * 3 + 2] = z
    N[q * 3] = gx
    N[q * 3 + 1] = gy
    N[q * 3 + 2] = gz
    let occ = 0
    let w = 1
    for (let s = 1; s <= 3; s++) {
      const dist = 0.035 * s
      occ += w * Math.max(0, dist - sdf(x + gx * dist, y + gy * dist, z + gz * dist)) / dist
      w *= 0.6
    }
    C[q] = Math.min(1, occ * 0.9)
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(P, 3))
  g.setAttribute('normal', new BufferAttribute(N, 3))
  g.setAttribute('cavity', new BufferAttribute(C, 1))
  g.setIndex(vc > 65535 ? new BufferAttribute(new Uint32Array(idx), 1) : new BufferAttribute(new Uint16Array(idx), 1))
  g.computeBoundingSphere()
  g.computeBoundingBox()
  return g
}
