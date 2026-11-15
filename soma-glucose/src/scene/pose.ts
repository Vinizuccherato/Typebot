/* ──────────────────────────────────────────────────────────────
   Shared geometry between the shader and the DOM overlay.

   World space: x right, y up, z toward the viewer, 1 unit = 100 design px.
   The z = 0 plane is pinned to the 1440×1000 design canvas:
     design (u, v)  ↔  world ((u − 720)/100, (500 − v)/100, 0)
   The camera sits at (cam.x, cam.y, F) and looks through that plane, so
   moving it gives true parallax while z = 0 stays registered with the cards.
   ────────────────────────────────────────────────────────────── */

export type V3 = [number, number, number]

export const F = 14 // camera distance to the design plane (world units)

/* Upper-arm round cone (must match FIGURE_GLSL). */
export const ARM_A: V3 = [0.0, 1.5, 0.0]
export const ARM_B: V3 = [-1.9, -5.8, 0.4]
export const ARM_RA = 1.05
export const ARM_RB = 0.85

/** Design point the sensor is aimed at (back of the upper arm). */
const SENSOR_DESIGN = { u: 655, v: 472 }

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
const norm = (a: V3): V3 => scale(a, 1 / Math.hypot(a[0], a[1], a[2]))

/** Sensor pose on the arm surface: position + outward normal (computed once). */
export const SENSOR = (() => {
  const x = (SENSOR_DESIGN.u - 720) / 100
  const y = (500 - SENSOR_DESIGN.v) / 100
  const t = (ARM_A[1] - y) / (ARM_A[1] - ARM_B[1])
  const axis: V3 = [ARM_A[0] + (ARM_B[0] - ARM_A[0]) * t, y, ARM_A[2] + (ARM_B[2] - ARM_A[2]) * t]
  const r = ARM_RA + (ARM_RB - ARM_RA) * t
  const dx = x - axis[0]
  const dz = Math.sqrt(Math.max(0.01, r * r - dx * dx))
  const p: V3 = [x, y, axis[2] + dz]
  const dir = norm(sub(ARM_B, ARM_A))
  const v = sub(p, axis)
  const n = norm(sub(v, scale(dir, dot(v, dir))))
  return { p, n }
})()

/** Sensor puck radius in world units (≈ 55 design px). */
export const SENSOR_R = 0.55

/** Maps design px → CSS px for the current layout. */
export interface ViewMap {
  scale: number
  originX: number
  originY: number
}

/** Where the sensor lands on screen (CSS px) for a camera offset and breathing lift. */
export function projectSensor(view: ViewMap, camX: number, camY: number, breath: number) {
  const [sx, sy0, sz] = SENSOR.p
  const sy = sy0 + breath
  const t = F / (F - sz)
  const x0 = camX + (sx - camX) * t
  const y0 = camY + (sy - camY) * t
  const u = 720 + x0 * 100
  const v = 500 - y0 * 100
  return { x: view.originX + u * view.scale, y: view.originY + v * view.scale, k: t }
}
