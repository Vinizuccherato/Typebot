import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/* ──────────────────────────────────────────────────────────────
   Scan materials for the face model (head-local geometry carries
   `baseNormal` = normal of the big masses, and `cavity`).

   thermal   — Midnight Orchid heat ramp (plum → lilac → champagne → white),
               broad silhouette halo, cool creases, sensor mottling, a bright
               sweep line at the scan height.
   hologram  — lilac iso-contour + grid hologram with fresnel glow, revealed
               top→down by the scan sweep (additive, see-through).
   Scan sweep: y = SCAN_TOP − (SCAN_TOP − SCAN_BOTTOM) · scan/100.
   ────────────────────────────────────────────────────────────── */

export const SCAN_TOP = 1.3
export const SCAN_BOTTOM = -1.45
export const scanY = (scan: number) => SCAN_TOP - (SCAN_TOP - SCAN_BOTTOM) * Math.min(1, Math.max(0, scan / 100))

export const RAMP = ['#1d1528', '#3a2a55', '#c3b4ff', '#e8cba8', '#fff8f0']

export interface FxUniforms {
  uTime: { value: number }
  uScanY: { value: number }
  /** 0 → no sweep line (scan finished), 1 → sweep visible */
  uSweep: { value: number }
  /** 0..1 coolness (hair reads cooler than skin) */
  uCool: { value: number }
  /** heart-beat pulse 0..1 */
  uPulse: { value: number }
  uReveal: { value: number }
}

export const createFxUniforms = (): FxUniforms => ({
  uTime: { value: 0 },
  uScanY: { value: SCAN_TOP },
  uSweep: { value: 0 },
  uCool: { value: 0 },
  uPulse: { value: 0 },
  uReveal: { value: 1 },
})

const VERT = /* glsl */ `
  #ifndef NO_ATTR
  attribute float cavity;
  attribute vec3 baseNormal;
  #endif
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vBN;
  varying vec3 vView;
  varying float vCav;
  void main() {
    #ifdef NO_ATTR
    // eyeballs: positioned by their own matrix; report head-local-ish height via the model matrix
    vLocal = (modelMatrix * vec4(position, 1.0)).xyz;
    vCav = 0.15;
    vN = normalize(normalMatrix * normal);
    vBN = vN;
    #else
    vLocal = position;
    vCav = cavity;
    vN = normalize(normalMatrix * normal);
    vBN = normalize(normalMatrix * baseNormal);
    #endif
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const NOISE = /* glsl */ `
  float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
`

const THERMAL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScanY;
  uniform float uSweep;
  uniform float uCool;
  uniform float uPulse;
  uniform float uReveal;
  uniform vec3 uR0; uniform vec3 uR1; uniform vec3 uR2; uniform vec3 uR3; uniform vec3 uR4;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vBN;
  varying vec3 vView;
  varying float vCav;
  ${NOISE}
  vec3 ramp(float h) {
    h = clamp(h, 0.0, 1.0);
    if (h < 0.25) return mix(uR0, uR1, h / 0.25);
    if (h < 0.55) return mix(uR1, uR2, (h - 0.25) / 0.3);
    if (h < 0.82) return mix(uR2, uR3, (h - 0.55) / 0.27);
    return mix(uR3, uR4, (h - 0.82) / 0.18);
  }
  void main() {
    vec3 V = normalize(vView);
    float ndv = clamp(dot(normalize(vN), V), 0.0, 1.0);
    float bfres = 1.0 - clamp(dot(normalize(vBN), V), 0.0, 1.0);
    // broad halo from the silhouette of the big masses
    float rim = smoothstep(0.18, 0.95, bfres);
    float heat = 0.12 + 0.72 * rim + 0.12 * smoothstep(0.0, 0.6, bfres);
    heat += 0.18 * pow(ndv, 3.0) * (1.0 - rim);             // warm frontal planes
    heat -= vCav * 0.42;                                      // cool creases
    float n = vnoise(vLocal * 14.0 + vec3(0.0, uTime * 0.07, 0.0)) * 0.6 + vnoise(vLocal * 31.0 - uTime * 0.05) * 0.4;
    heat += (n - 0.5) * 0.07;
    heat *= 1.0 + 0.06 * uPulse;
    heat *= 1.0 - 0.45 * uCool;
    vec3 col = ramp(heat);
    // sweep line
    float d = vLocal.y - uScanY;
    col += uR2 * exp(-pow(d / 0.012, 2.0)) * 1.6 * uSweep;
    col += uR2 * exp(-pow(max(0.0, d) / 0.25, 2.0)) * 0.12 * uSweep;
    // below the shoulders fade into the room
    float fade = smoothstep(-3.6, -1.9, vLocal.y);
    gl_FragColor = vec4(col, fade * uReveal);
    #include <colorspace_fragment>
  }
`

const HOLO_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uScanY;
  uniform float uSweep;
  uniform float uCool;
  uniform float uReveal;
  uniform vec3 uR2; uniform vec3 uR3;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vBN;
  varying vec3 vView;
  varying float vCav;
  void main() {
    vec3 V = normalize(vView);
    float ndv = abs(dot(normalize(vN), V));
    float fres = pow(1.0 - ndv, 2.2);
    // iso-contours along depth + a light lattice
    float z = vLocal.z * 26.0;
    float zl = 1.0 - clamp(abs(fract(z) - 0.5) / max(fwidth(z), 1e-4) - 0.5, 0.0, 1.0);
    vec2 g = vLocal.xy * vec2(22.0, 22.0);
    vec2 gw = abs(fract(g) - 0.5) / max(fwidth(g), vec2(1e-4));
    float grid = 1.0 - clamp(min(gw.x, gw.y) - 0.5, 0.0, 1.0);
    // revealed above the sweep (top → down)
    float d = vLocal.y - uScanY;
    float shown = smoothstep(-0.02, 0.04, d);
    float a = (0.02 + 0.34 * fres + 0.2 * zl + 0.07 * grid) * shown * (1.0 - 0.55 * uCool);
    vec3 col = mix(uR2, uR3, smoothstep(0.45, 1.0, fres)) * a;
    col += vec3(1.0) * exp(-pow(d / 0.008, 2.0)) * 0.7 * uSweep;          // bright scan line
    col += uR2 * exp(-pow(max(0.0, d) / 0.16, 2.0)) * 0.12 * uSweep;       // afterglow
    float fade = smoothstep(-3.4, -1.8, vLocal.y);
    col *= fade * uReveal;
    // premultiplied-style alpha so the additive glow composites over the transparent canvas
    gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
    #include <colorspace_fragment>
  }
`

const rampUniforms = () => {
  const c = RAMP.map((h) => new Color(h))
  return { uR0: { value: c[0] }, uR1: { value: c[1] }, uR2: { value: c[2] }, uR3: { value: c[3] }, uR4: { value: c[4] } }
}

export function createThermal(u: FxUniforms, cool = 0) {
  const m = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: THERMAL_FRAG,
    uniforms: { ...u, uCool: { value: cool }, ...rampUniforms() },
    transparent: true,
  })
  return m
}

export function createHologram(u: FxUniforms, cool = 0) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: HOLO_FRAG,
    uniforms: { ...u, uCool: { value: cool }, ...rampUniforms() },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}

/** Eyeball variant (sphere geometry has no cavity/baseNormal attributes). */
export function createFxEye(kind: 'thermal' | 'hologram', u: FxUniforms) {
  const m = kind === 'thermal' ? createThermal(u, 0.25) : createHologram(u, 0.3)
  m.defines = { ...m.defines, NO_ATTR: '' }
  return m
}
