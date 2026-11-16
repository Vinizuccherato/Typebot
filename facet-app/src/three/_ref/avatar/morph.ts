import type { Vector3 } from 'three'
import type { FaceForm } from '../store'

/* ──────────────────────────────────────────────────────────────
   Live face-form deformation. The SAME function exists twice:
   GLSL (vertex shader, every frame) and TS (CPU, for accessories,
   eye placement and anything that must stick to the morphed face).
   Change one → change the other.

   Inputs are the Face Form sliders (0..1, 0.5 = neutral) and the
   face "strength" (sculpt depth). Masks fade to 0 above the crown
   and below y = −1.35 so the head/neck seam never opens.
   ────────────────────────────────────────────────────────────── */

export interface MorphParams {
  /** −1..1 each, already multiplied by sculpt depth */
  width: number
  round: number
  lips: number
}

export const morphParams = (face: FaceForm, strength: number, out: MorphParams = { width: 0, round: 0, lips: 0 }) => {
  const k = 0.5 + strength
  out.width = (face.width - 0.5) * 2 * k
  out.round = (face.roundness - 0.5) * 2 * k
  out.lips = (face.lips - 0.5) * 2 * k
  return out
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** CPU twin of the GLSL `avatarMorph`. Writes into `out`. */
export function morphPoint(p: Vector3, m: MorphParams, out: Vector3): Vector3 {
  const x = p.x
  const y = p.y
  const z = p.z
  const ax = Math.abs(x)
  const neck = smooth(-1.3, -1.0, y)
  const front = smooth(-1.35, -0.55, z)
  // 1) face breadth: strongest across the cheeks
  const wMask = Math.exp(-(((y + 0.25) / 0.78) ** 2)) * neck * (0.35 + 0.65 * front)
  let nx = x * (1 + 0.1 * m.width * wMask)
  // 2) jaw roundness: soft (+) narrows the gonial corners toward a rounded chin, angular (−) squares them
  const jaw = smooth(-0.45, -0.85, y) * smooth(0.12, 0.5, ax) * neck
  nx *= 1 - 0.085 * m.round * jaw
  const chin = Math.exp(-((x / 0.28) ** 2 + ((y + 1.03) / 0.16) ** 2)) * neck
  let ny = y - 0.035 * m.round * chin
  // 3) lip fullness: lips push forward and away from the stomion
  const lip = Math.exp(-((x / 0.21) ** 2 + ((y + 0.66) / 0.1) ** 2)) * smooth(-0.25, 0.0, z)
  const nz = z + 0.032 * m.lips * lip
  ny += 0.02 * m.lips * lip * Math.tanh((y + 0.655) / 0.03)
  return out.set(nx, ny, nz)
}

/** GLSL twin — expects `uniform vec3 uMorph; // (width, round, lips)`. */
export const MORPH_GLSL = /* glsl */ `
  uniform vec3 uMorph;
  float sq(float v) { return v * v; }
  vec3 avatarMorph(vec3 p) {
    float ax = abs(p.x);
    float neck = smoothstep(-1.3, -1.0, p.y);
    float front = smoothstep(-1.35, -0.55, p.z);
    float wMask = exp(-sq((p.y + 0.25) / 0.78)) * neck * (0.35 + 0.65 * front);
    float nx = p.x * (1.0 + 0.1 * uMorph.x * wMask);
    float jaw = (1.0 - smoothstep(-0.85, -0.45, p.y)) * smoothstep(0.12, 0.5, ax) * neck;
    nx *= 1.0 - 0.085 * uMorph.y * jaw;
    float chin = exp(-(sq(p.x / 0.28) + sq((p.y + 1.03) / 0.16))) * neck;
    float ny = p.y - 0.035 * uMorph.y * chin;
    float lip = exp(-(sq(p.x / 0.21) + sq((p.y + 0.66) / 0.1))) * smoothstep(-0.25, 0.0, p.z);
    float nz = p.z + 0.032 * uMorph.z * lip;
    ny += 0.02 * uMorph.z * lip * tanh((p.y + 0.655) / 0.03);
    return vec3(nx, ny, nz);
  }
`
