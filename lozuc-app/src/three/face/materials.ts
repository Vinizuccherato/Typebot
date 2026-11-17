import { Color, DoubleSide, MeshPhysicalMaterial, Vector3 } from 'three'
import { REGION_GLSL } from './regions'

/* ──────────────────────────────────────────────────────────────
   lozuc materials. MeshPhysicalMaterial (lit by the studio + env)
   extended via onBeforeCompile. Patterns are painted from the head-local
   position (vLocal): stubble, scalp fades, brows, lips, region glow.
   `uClay` (0..1) blends every surface to the matte "map" render used by
   the LZ-01 region map.
   ────────────────────────────────────────────────────────────── */

export const NOISE = /* glsl */ `
  float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float sq2(float v) { return v * v; }
`

/** Per-canvas uniforms shared by the skin, body and lid materials. */
export interface SkinUniforms {
  uSkin: { value: Color }
  uShirt: { value: Color }
  uHairTone: { value: Color }
  uBeardTone: { value: Color }
  /** x stubble density, y clean-shave shadow, z scalp density (buzz) */
  uGroom: { value: Vector3 }
  /** x side-fade amount (short sides under a top shell), y nape fade, z beard-shell coverage (hides skin stubble edges) */
  uFade: { value: Vector3 }
  /** x brow density, y glabella cleaned (0..1), z definition */
  uBrow: { value: Vector3 }
  uRegion: { value: number }
  uRegionAmt: { value: number }
  uClay: { value: number }
  uTime: { value: number }
}

export const createSkinUniforms = (): SkinUniforms => ({
  uSkin: { value: new Color('#c99876') },
  uShirt: { value: new Color('#1d2a25') },
  uHairTone: { value: new Color('#3b2a20') },
  uBeardTone: { value: new Color('#3b2a20') },
  uGroom: { value: new Vector3(1, 0.3, 0) },
  uFade: { value: new Vector3(0, 0, 0) },
  uBrow: { value: new Vector3(1, 0, 0.3) },
  uRegion: { value: -1 },
  uRegionAmt: { value: 0 },
  uClay: { value: 0 },
  uTime: { value: 0 },
})

const SAGE = 'vec3(0.663, 0.78, 0.714)'
const CLAY = 'vec3(0.78, 0.8, 0.78)'

/** Skin. kind 'head' paints the face; 'body' paints the neck and the crew-neck tee. */
export function createSkinMaterial(kind: 'head' | 'body', u: SkinUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.56,
    metalness: 0,
    sheen: 0.55,
    sheenRoughness: 0.65,
    sheenColor: new Color('#e09a80'),
    clearcoat: 0.05,
    clearcoatRoughness: 0.55,
  })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float cavity;\nvarying vec3 vLocal;\nvarying float vCav;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvLocal = position;\nvCav = cavity;`)
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSkin; uniform vec3 uShirt; uniform vec3 uHairTone; uniform vec3 uBeardTone;
        uniform vec3 uGroom; uniform vec3 uFade; uniform vec3 uBrow;
        uniform float uRegion; uniform float uRegionAmt; uniform float uClay; uniform float uTime;
        varying vec3 vLocal;
        varying float vCav;
        ${NOISE}
        ${REGION_GLSL}
        float hairlineH(float ax, float z) {
          float front = 0.6 - 0.55 * ax * ax - 0.12 * smoothstep(0.32, 0.52, ax);
          float side = 0.03 - 0.62 * smoothstep(-0.98, -1.5, z);
          float w = smoothstep(-0.32, -0.72, z);
          float h = mix(front, side, w);
          h -= 0.3 * exp(-sq2((z + 0.8) / 0.09)) * smoothstep(0.6, 0.72, ax);
          return h;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 P = vLocal;
        float ax = abs(P.x);
        vec3 skin = uSkin * (0.97 + 0.04 * vnoise(P * 14.0) + 0.014 * vnoise(P * 150.0));
        ${
          kind === 'head'
            ? `
        vec2 q = vec2(ax, P.y);
        // warmth on nose, ears and cheeks (blood flow), cooler temples
        skin = mix(skin, skin * vec3(1.03, 0.88, 0.84), 0.22 * (rgBlob(q, vec2(0.36, -0.32), vec2(0.2, 0.16)) + rgBlob(vec2(P.x, P.y), vec2(0.0, -0.36), vec2(0.08, 0.07)) + rgBlob(vec2(ax, P.z), vec2(0.78, -0.95), vec2(0.1, 0.18))));
        // lips: subtle, not painted
        float lip = clamp(rgBlob(vec2(P.x, P.y), vec2(0.0, -0.615), vec2(0.16, 0.03)) + rgBlob(vec2(P.x, P.y), vec2(0.0, -0.712), vec2(0.14, 0.04)), 0.0, 1.0) * smoothstep(-0.2, 0.0, P.z);
        skin = mix(skin, skin * vec3(0.93, 0.74, 0.72), lip * 0.6);
        float mouth = exp(-sq2((P.y + 0.655 - 0.12 * sq2(P.x)) / 0.006)) * (1.0 - smoothstep(0.17, 0.21, ax)) * smoothstep(-0.1, 0.05, P.z);
        skin = mix(skin, vec3(0.32, 0.2, 0.18), mouth * 0.7);
        // under-eye and socket shading
        skin *= 1.0 - 0.08 * rgBlob(q, vec2(0.345, -0.17), vec2(0.15, 0.05));

        // ── beard: clean-shave shadow + stubble stipple ──
        float bz = beardZone(P);
        float shadowA = bz * uGroom.y * 0.35;
        skin = mix(skin, skin * mix(vec3(0.72, 0.74, 0.76), uBeardTone * 1.6, 0.3), shadowA);
        float dots = smoothstep(0.55, 0.9, vnoise(P * 240.0)) * (0.6 + 0.4 * vnoise(P * 60.0));
        float stub = bz * uGroom.x * clamp(dots * 1.4 + 0.25, 0.0, 1.0);
        skin = mix(skin, uBeardTone, stub * 0.85);

        // ── scalp: buzz density and short-side fades below the hair shell ──
        float H = hairlineH(ax, P.z);
        float scalp = smoothstep(H - 0.03, H + 0.03, P.y);
        float fadeUp = smoothstep(H - 0.02, H + 0.45, P.y);  // denser toward the top
        float sideW = smoothstep(-0.25, -0.55, P.z) + smoothstep(0.42, 0.62, ax);
        float density = max(uGroom.z, uFade.x * clamp(sideW, 0.0, 1.0) * mix(0.25, 1.0, fadeUp));
        float sdots = smoothstep(0.4, 0.85, vnoise(P * 210.0)) * 0.7 + 0.3 * vnoise(P * 70.0);
        skin = mix(skin, uHairTone, scalp * density * clamp(sdots * 1.2 + 0.2, 0.0, 1.0) * 0.92);

        // ── brows: painted strokes along the brow arc ──
        float u = clamp((ax - 0.15) / 0.47, 0.0, 1.0);
        float cy = 0.112 + 0.085 * sin(3.14159 * min(u * 1.12, 1.0)) - 0.025 * u;
        float hh = mix(0.04, 0.016, u) * (0.8 + 0.4 * uBrow.x);
        float inBrow = (1.0 - smoothstep(hh * (0.65 + 0.35 * (1.0 - uBrow.z)), hh, abs(P.y - cy))) * step(0.15, ax) * (1.0 - smoothstep(0.6, 0.66, ax)) * smoothstep(-0.25, -0.05, P.z);
        float strokes = 0.55 + 0.45 * vnoise(vec3(P.x * 160.0 + P.y * 220.0 * sign(P.x), P.y * 40.0, 0.0));
        float glab = exp(-sq2(P.x / 0.07) - sq2((P.y - 0.115) / 0.03)) * (1.0 - uBrow.y) * smoothstep(0.6, 0.9, vnoise(P * 300.0));
        skin = mix(skin, uHairTone * 0.85, clamp(inBrow * strokes * (0.75 + 0.25 * uBrow.z) + glab * 0.8, 0.0, 1.0));
        `
            : `
        // crew-neck tee below the collar line
        float yc = P.z > -0.95 ? -1.78 - 0.32 * max(0.0, 1.0 - sq2(P.x / 0.62)) : -1.62;
        float tee = smoothstep(yc + 0.012, yc - 0.012, P.y);
        float rib = smoothstep(0.05, 0.0, abs(P.y - (yc - 0.04)));
        vec3 fabric = uShirt * (0.92 + 0.08 * vnoise(P * vec3(60.0, 8.0, 60.0)));
        fabric *= 1.0 - 0.08 * rib * (0.6 + 0.4 * sin(P.x * 260.0));
        skin = mix(skin, fabric, tee);
        `
        }
        // creases and occlusion
        skin *= 1.0 - vCav * 0.5;
        // map mode: matte clay
        skin = mix(skin, ${CLAY} * (1.0 - vCav * 0.6), uClay);
        // region glow
        ${kind === 'head' ? 'float rm = regionMask(P, uRegion) * uRegionAmt;' : 'float rm = (uRegion > 8.5 && uRegion < 9.5 ? smoothstep(-1.15, -1.3, P.y) * smoothstep(-2.0, -1.6, P.y) : 0.0) * uRegionAmt;'}
        skin = mix(skin, ${SAGE}, rm * 0.45);
        diffuseColor.rgb = skin;
        ${kind === 'head' ? 'if (vLocal.y < -1.31) discard;' : ''}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += ${SAGE} * rm * (0.22 + 0.08 * sin(uTime * 3.0));`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.85, uClay);`,
      )
  }
  m.customProgramCacheKey = () => `lz-skin-${kind}`
  return m
}

/* ── hair & beard shells ─────────────────────────────────────── */

export interface ShellUniforms {
  uTone: { value: Color }
  /** 0 = gone, 1 = fully shown (dithered dissolve: no sorting issues) */
  uShow: { value: number }
  /** strand flow: 0 down/radial, 1 forward-up (crop), 2 sideways from a part, 3 swept back, 4 beard (down) */
  uFlow: { value: number }
  uKeyView: { value: Vector3 }
  uHi: { value: number }
  uClay: { value: number }
  uTime: { value: number }
}

/** Hair/beard shell: strand striation, Kajiya-Kay twin highlights, soft dithered edges. */
export function createShellMaterial(u: ShellUniforms, beard = false) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.78,
    metalness: 0,
    sheen: 0.15,
    sheenRoughness: 0.45,
    sheenColor: new Color('#8a6a52'),
    envMapIntensity: 0.25,
  })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uFlow;\nvarying vec3 vLocal;\nvarying vec3 vTanView;`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vLocal = position;
        vec3 P = position;
        vec3 dirL;
        if (uFlow < 0.5) dirL = normalize(mix(vec3(0.0, -1.0, 0.0), normalize(vec3(P.x, -0.3, P.z + 0.9)), smoothstep(0.2, 0.8, P.y)));
        else if (uFlow < 1.5) dirL = normalize(vec3(P.x * 0.3, 0.55, 1.0));
        else if (uFlow < 2.5) dirL = normalize(vec3(sign(P.x + 0.33) * 1.0, -0.25, 0.15));
        else if (uFlow < 3.5) dirL = normalize(vec3(P.x * 0.2, -0.1, -1.0));
        else dirL = normalize(vec3(0.0, -1.0, 0.25));
        vec3 tl = normalize(dirL - normal * dot(normal, dirL));
        vTanView = normalize(normalMatrix * tl);`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uTone; uniform float uShow; uniform vec3 uKeyView; uniform float uHi; uniform float uClay; uniform float uTime;
        varying vec3 vLocal;
        varying vec3 vTanView;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 P = vLocal;
        // dithered dissolve: crossfades between styles without transparency sorting
        if (hash31(floor(gl_FragCoord.xyz * vec3(1.0, 1.0, 0.0)) + vec3(0.0, 0.0, 7.0)) > uShow) discard;
        float across = dot(P, vec3(${beard ? '120.0, 30.0, 90.0' : '70.0, 18.0, 52.0'})) + vnoise(P * 4.0) * 6.0;
        float strands = 0.6 + 0.4 * vnoise(vec3(across, P.y * 2.0, 0.0));
        float clumps = 0.82 + 0.18 * vnoise(P * 11.0);
        vec3 col = uTone * strands * clumps;
        col = mix(col, vec3(0.6, 0.65, 0.62) * (0.8 + 0.2 * strands), uClay);
        col = mix(col, vec3(0.663, 0.78, 0.714), uHi * 0.4);
        diffuseColor.rgb = col;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          vec3 V = normalize(vViewPosition);
          vec3 H = normalize(uKeyView + V);
          vec3 T = normalize(vTanView);
          float th = dot(T, H);
          float s1 = pow(max(0.0, sqrt(max(0.0, 1.0 - sq2(th - 0.1)))), 80.0);
          float s2 = pow(max(0.0, sqrt(max(0.0, 1.0 - sq2(th + 0.16)))), 22.0);
          float shimmer = 0.6 + 0.4 * vnoise(vec3(vLocal.x * 140.0, vLocal.y * 3.0, vLocal.z * 140.0));
          totalEmissiveRadiance += (vec3(1.0, 0.95, 0.88) * s1 * ${beard ? '0.08' : '0.18'} + uTone * 1.4 * s2 * 0.1) * shimmer * (1.0 - uClay);
          totalEmissiveRadiance += vec3(0.663, 0.78, 0.714) * uHi * (0.18 + 0.06 * sin(uTime * 3.0));
          // soft silhouette: dither away the grazing rim so edges read as hair, not a shell
          float ndv = abs(dot(normal, V));
          float rimA = smoothstep(0.02, 0.22, ndv);
          float fray = vnoise(vec3(vLocal.x * 190.0, vLocal.y * 190.0, vLocal.z * 190.0));
          if (rimA < fray * 0.85) discard;
        }`,
      )
  }
  m.customProgramCacheKey = () => `lz-shell-${beard ? 'b' : 'h'}`
  return m
}

/* ── eyes (from our avatar engine) ────────────────────────────── */

export interface EyeUniforms {
  uIris: { value: Color }
  uPupil: { value: number }
}

/** Eyeball: sclera, iris fibres + limbal ring, pupil, glossy cornea (clearcoat). */
export function createEyeMaterial(u: EyeUniforms) {
  const m = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, ior: 1.38 })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nvarying vec3 vObj;`).replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uIris;\nuniform float uPupil;\nvarying vec3 vObj;\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = normalize(vObj);
        float a = acos(clamp(p.z, -1.0, 1.0));
        float th = atan(p.y, p.x);
        float ri = 0.62;
        vec3 sclera = vec3(0.93, 0.91, 0.88) * (1.0 - 0.2 * smoothstep(0.9, 1.6, a));
        float r = a / ri;
        float fib = 0.55 + 0.45 * vnoise(vec3(th * 9.0, r * 3.0, 0.0)) * (0.6 + 0.4 * sin(th * 70.0 + vnoise(p * 40.0) * 4.0));
        vec3 iris = uIris * (0.6 + 0.55 * fib);
        iris = mix(iris, uIris * 1.25 + 0.05, smoothstep(0.55, 0.3, r) * 0.4);
        iris = mix(iris, uIris * 0.3, smoothstep(0.8, 1.0, r));
        vec3 col = mix(iris, sclera, smoothstep(0.97, 1.03, r));
        col = mix(vec3(0.015), col, smoothstep(uPupil - 0.015, uPupil + 0.015, a));
        col *= 1.0 - 0.4 * smoothstep(0.05, 0.42, p.y);
        diffuseColor.rgb = col;`,
      )
  }
  m.customProgramCacheKey = () => 'lz-eye'
  return m
}

export interface LidUniforms {
  uSkin: { value: Color }
  uClay: { value: number }
  uOpen: { value: number }
  uSide: { value: number }
}

/** Eyelid shell: skin with the palpebral aperture cut out, lash line and crease (male: almond, low crease). */
export function createLidMaterial(u: LidUniforms) {
  const m = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.55, sheen: 0.4, sheenRoughness: 0.5, sheenColor: new Color('#e09a80'), side: DoubleSide })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nvarying vec3 vObj;`).replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uSkin;\nuniform float uClay;\nuniform float uOpen;\nuniform float uSide;\nvarying vec3 vObj;\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = normalize(vObj);
        float u = atan(p.x, max(p.z, 1e-3));
        float v = atan(p.y, max(p.z, 1e-3));
        float w = 1.0;
        float k = clamp(abs(u) / w, 0.0, 1.0);
        float tilt = 0.05 * u * uSide;
        float yU = 0.33 * uOpen * (1.0 - pow(k, 1.6)) + tilt;
        float yL = -0.26 * min(1.0, uOpen * 1.15 + 0.05) * (1.0 - pow(k, 1.45)) + tilt * 0.6;
        float inside = step(0.0, p.z) * step(abs(u), w) * step(yL, v) * step(v, yU);
        if (inside > 0.5) discard;
        vec3 skin = uSkin * (0.97 + 0.05 * vnoise(p * 30.0));
        float onFront = step(0.0, p.z) * (1.0 - smoothstep(w * 0.98, w * 1.15, abs(u)));
        float dU = v - yU;
        float dL = yL - v;
        skin = mix(skin, vec3(0.1, 0.07, 0.06), clamp(smoothstep(0.06, 0.0, dU) * step(0.0, dU) * onFront * 0.85 + smoothstep(0.03, 0.0, dL) * step(0.0, dL) * onFront * 0.35, 0.0, 1.0));
        skin *= 1.0 - 0.26 * exp(-sq2((v - (yU + 0.13)) / 0.04)) * onFront;
        skin = mix(skin, vec3(0.78, 0.8, 0.78), uClay);
        diffuseColor.rgb = skin;`,
      )
  }
  m.customProgramCacheKey = () => 'lz-lid'
  return m
}
