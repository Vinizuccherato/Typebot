import { AdditiveBlending, Color, ShaderMaterial } from 'three'

/* ──────────────────────────────────────────────────────────────
   'scan' material: a sage hologram — iso-contours along depth, a light
   lattice and fresnel glow, revealed top → down by the scan sweep.
   Additive, see-through. Sweep: y = SCAN_TOP − (SCAN_TOP − SCAN_BOTTOM)·scan/100.
   ────────────────────────────────────────────────────────────── */

export const SCAN_TOP = 1.35
export const SCAN_BOTTOM = -1.5
export const scanY = (scan: number) => SCAN_TOP - (SCAN_TOP - SCAN_BOTTOM) * Math.min(1, Math.max(0, scan / 100))

export interface FxUniforms {
  uTime: { value: number }
  uScanY: { value: number }
  uSweep: { value: number }
  uReveal: { value: number }
  uA: { value: Color }
  uB: { value: Color }
}

export const createFxUniforms = (): FxUniforms => ({
  uTime: { value: 0 },
  uScanY: { value: SCAN_TOP },
  uSweep: { value: 0 },
  uReveal: { value: 1 },
  uA: { value: new Color('#a9c7b6') },
  uB: { value: new Color('#e9f4ee') },
})

const VERT = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    #ifdef EYE
    vLocal = (modelMatrix * vec4(position, 1.0)).xyz;
    #else
    vLocal = position;
    #endif
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  uniform float uTime; uniform float uScanY; uniform float uSweep; uniform float uReveal; uniform float uDim;
  uniform vec3 uA; uniform vec3 uB;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vec3 V = normalize(vView);
    float ndv = abs(dot(normalize(vN), V));
    float fres = pow(1.0 - ndv, 2.2);
    float z = vLocal.z * 28.0;
    float zl = 1.0 - clamp(abs(fract(z) - 0.5) / max(fwidth(z), 1e-4) - 0.5, 0.0, 1.0);
    vec2 g = vLocal.xy * 24.0;
    vec2 gw = abs(fract(g) - 0.5) / max(fwidth(g), vec2(1e-4));
    float grid = 1.0 - clamp(min(gw.x, gw.y) - 0.5, 0.0, 1.0);
    float d = vLocal.y - uScanY;
    float shown = smoothstep(-0.02, 0.04, d);
    float a = (0.03 + 0.36 * fres + 0.22 * zl + 0.07 * grid) * shown * uDim;
    vec3 col = mix(uA, uB, smoothstep(0.45, 1.0, fres)) * a;
    col += vec3(1.0) * exp(-pow(d / 0.008, 2.0)) * 0.75 * uSweep;
    col += uA * exp(-pow(max(0.0, d) / 0.16, 2.0)) * 0.14 * uSweep;
    col *= smoothstep(-3.4, -1.8, vLocal.y) * uReveal;
    gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
    #include <colorspace_fragment>
  }
`

export function createScan(u: FxUniforms, dim = 1, eye = false) {
  return new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: { ...u, uDim: { value: dim } },
    defines: eye ? { EYE: '' } : {},
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
}
