import { Color, DoubleSide, MeshPhysicalMaterial, Vector3 } from 'three'
import { MORPH_GLSL } from './morph'

/* ──────────────────────────────────────────────────────────────
   Avatar materials. All are MeshPhysicalMaterial (so the studio
   lights + environment shade them) extended via onBeforeCompile.
   Patterns are painted from the UNDEFORMED head-local position
   (vLocal), so freckles, blush and lips stay put while the face morphs.
   ────────────────────────────────────────────────────────────── */

const NOISE = /* glsl */ `
  float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  float vnoise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float sq2(float v) { return v * v; }
  float blob(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
`

export interface SkinUniforms {
  uMorph: { value: Vector3 }
  uSkin: { value: Color }
  uShirt: { value: Color }
}

/**
 * Skin (head + body + lid shells). `kind`:
 *  head — live morph + face paint (blush, lips, freckles)
 *  body — neck skin above a crew collar, tee below
 *  lid  — eyelid shell (aperture handled by the Eyes component via `extraFragment`)
 */
export function createSkinMaterial(kind: 'head' | 'body', shared: SkinUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.52,
    metalness: 0,
    sheen: 0.55,
    sheenRoughness: 0.55,
    sheenColor: new Color('#ff9a86'),
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
  })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMorph = shared.uMorph
    sh.uniforms.uSkin = shared.uSkin
    sh.uniforms.uShirt = shared.uShirt
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float cavity;
        varying vec3 vLocal;
        varying float vCav;
        ${kind === 'head' ? MORPH_GLSL : 'uniform vec3 uMorph;'}`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = ${kind === 'head' ? 'avatarMorph(position)' : 'vec3(position)'};
        vLocal = position;
        vCav = cavity;`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSkin;
        uniform vec3 uShirt;
        varying vec3 vLocal;
        varying float vCav;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 P = vLocal;
        float ax = abs(P.x);
        vec3 skin = uSkin;
        // gentle tonal variation + pores
        skin *= 0.96 + 0.06 * vnoise(P * 18.0) + 0.02 * vnoise(P * 140.0);
        ${
          kind === 'head'
            ? `
        vec2 q = vec2(ax, P.y);
        // blush: apples of the cheeks, nose tip, a touch on the chin
        float blush = blob(q, vec2(0.36, -0.3), vec2(0.2, 0.15)) * 0.9 + blob(q, vec2(0.0, -0.43), vec2(0.09, 0.08)) * 0.7 + blob(q, vec2(0.0, -1.1), vec2(0.14, 0.09)) * 0.35;
        skin = mix(skin, skin * vec3(1.02, 0.8, 0.78), clamp(blush, 0.0, 1.0) * 0.36);
        // freckles across the nose bridge and upper cheeks
        float fz = blob(q, vec2(0.16, -0.24), vec2(0.36, 0.17));
        vec3 fc = P * 62.0;
        float speck = smoothstep(0.82, 0.92, vnoise(fc)) * smoothstep(0.35, 0.7, vnoise(P * 9.0));
        skin = mix(skin, skin * vec3(0.8, 0.64, 0.56), speck * fz * 0.65);
        // lips
        float upper = blob(vec2(P.x, P.y), vec2(0.0, -0.715), vec2(0.21, 0.05));
        float lower = blob(vec2(P.x, P.y), vec2(0.0, -0.845), vec2(0.19, 0.055));
        float lip = clamp(upper + lower, 0.0, 1.0) * smoothstep(-0.2, 0.0, P.z);
        skin = mix(skin, vec3(0.8, 0.5, 0.49), lip * 0.62);
        // hair casts soft occlusion onto the temples and cheeks
        skin *= 1.0 - 0.26 * smoothstep(0.42, 0.66, ax) * smoothstep(-1.1, -0.6, P.y);
        skin *= 1.0 - 0.18 * smoothstep(0.42, 0.58, P.y) * smoothstep(0.15, 0.55, ax);
        // soft under-eye and socket shading
        skin *= 1.0 - 0.12 * blob(q, vec2(0.32, -0.16), vec2(0.15, 0.05));
        `
            : `
        // crew-neck tee below the collar line
        float yc = P.z > -0.9 ? -1.98 - 0.36 * max(0.0, 1.0 - sq2(P.x / 0.62)) : -1.86;
        float tee = smoothstep(yc + 0.012, yc - 0.012, P.y);
        float rib = smoothstep(0.05, 0.0, abs(P.y - (yc - 0.04)));
        vec3 fabric = uShirt * (0.94 + 0.06 * vnoise(P * vec3(60.0, 8.0, 60.0)));
        fabric *= 1.0 - 0.07 * rib * (0.6 + 0.4 * sin(P.x * 260.0));
        skin = mix(skin, fabric, tee);
        `
        }
        // creases and occlusion
        skin *= 1.0 - vCav * 0.55;
        diffuseColor.rgb = skin;
        ${kind === 'head' ? 'if (vLocal.y < -1.46) discard; // hide the cut cap: the body mesh carries the neck below' : ''}`,
      )
    if (kind === 'body') {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        { float yc2 = vLocal.z > -0.9 ? -1.98 - 0.36 * max(0.0, 1.0 - sq2(vLocal.x / 0.62)) : -1.86;
          roughnessFactor = mix(roughnessFactor, 0.92, smoothstep(yc2 + 0.012, yc2 - 0.012, vLocal.y)); }`,
      )
    } else {
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        { float lipR = clamp(blob(vec2(vLocal.x, vLocal.y), vec2(0.0, -0.78), vec2(0.22, 0.1)), 0.0, 1.0);
          roughnessFactor = mix(roughnessFactor, 0.32, lipR * 0.8); }`,
      )
    }
  }
  m.customProgramCacheKey = () => `skin-${kind}`
  return m
}

export interface HairUniforms {
  uMorph: { value: Vector3 }
  uKeyView: { value: Vector3 }
  uHair: { value: Color }
}

/** Hair shell: root-to-tip gradient, strand striation, Kajiya-Kay-style twin highlights. */
export function createHairMaterial(u: HairUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.62,
    metalness: 0,
    sheen: 0.25,
    sheenRoughness: 0.45,
    sheenColor: new Color('#a07a5c'),
    envMapIntensity: 0.35,
  })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uMorph = u.uMorph
    sh.uniforms.uKeyView = u.uKeyView
    sh.uniforms.uHair = u.uHair
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        ${MORPH_GLSL}
        varying vec3 vLocal;
        varying vec3 vTanView;`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = avatarMorph(position);
        vLocal = position;
        // strand direction: radiating from the centre part on the crown, falling straight below
        vec3 down = vec3(0.0, -1.0, 0.0);
        vec3 crown = normalize(vec3(sign(position.x) * 0.95, -0.45, -0.2));
        vec3 dirL = normalize(mix(down, crown, smoothstep(0.15, 0.75, position.y)));
        vec3 tl = normalize(dirL - normal * dot(normal, dirL));
        vTanView = normalize(normalMatrix * tl);`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uKeyView;
        uniform vec3 uHair;
        varying vec3 vLocal;
        varying vec3 vTanView;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 P = vLocal;
        // strands: fine striation across the fall + clumping
        float across = P.x * 70.0 + P.z * 40.0 + vnoise(P * vec3(3.0, 0.6, 3.0)) * 6.0;
        float strands = 0.55 + 0.45 * vnoise(vec3(across, P.y * 1.2, 0.0)) ;
        float clumps = 0.8 + 0.2 * vnoise(vec3(P.x * 9.0, P.y * 0.8, P.z * 9.0));
        // root → tip: darker at the part/roots, sun-lightened ends
        float tips = smoothstep(-0.6, -3.4, P.y);
        vec3 col = uHair * mix(0.7, 1.1, tips) * strands * clumps;
        col *= 1.0 - 0.35 * smoothstep(0.06, 0.0, abs(P.x)) * smoothstep(0.7, 1.1, P.y); // part shadow
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
          float s1 = pow(max(0.0, sqrt(max(0.0, 1.0 - sq2(th - 0.12)))), 90.0);
          float s2 = pow(max(0.0, sqrt(max(0.0, 1.0 - sq2(th + 0.18)))), 24.0);
          float shimmer = 0.6 + 0.4 * vnoise(vec3(vLocal.x * 120.0, vLocal.y * 2.0, vLocal.z * 120.0));
          totalEmissiveRadiance += (vec3(1.0, 0.93, 0.86) * s1 * 0.28 + uHair * 1.6 * s2 * 0.18) * shimmer;
        }`,
      )
  }
  m.customProgramCacheKey = () => 'hair'
  return m
}

export interface EyeUniforms {
  uIris: { value: Color }
  uPupil: { value: number }
}

/** Eyeball: sclera, iris fibres + collarette + limbal ring, pupil, glossy cornea (clearcoat). */
export function createEyeMaterial(u: EyeUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    ior: 1.38,
  })
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uIris = u.uIris
    sh.uniforms.uPupil = u.uPupil
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObj;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;`)
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uIris;
        uniform float uPupil;
        varying vec3 vObj;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = normalize(vObj);
        float a = acos(clamp(p.z, -1.0, 1.0));
        float th = atan(p.y, p.x);
        float ri = 0.6;
        vec3 sclera = vec3(0.95, 0.93, 0.91) * (1.0 - 0.18 * smoothstep(0.9, 1.6, a));
        sclera = mix(sclera, vec3(0.93, 0.78, 0.76), 0.25 * smoothstep(0.85, 1.5, a) * vnoise(p * 30.0));
        float r = a / ri;
        float fib = 0.55 + 0.45 * vnoise(vec3(th * 9.0, r * 3.0, 0.0)) * (0.6 + 0.4 * sin(th * 70.0 + vnoise(p * 40.0) * 4.0));
        vec3 iris = uIris * (0.62 + 0.55 * fib);
        iris = mix(iris, uIris * 1.25 + 0.06, smoothstep(0.55, 0.3, r) * 0.45);  // lighter collarette
        iris = mix(iris, uIris * 0.32, smoothstep(0.8, 1.0, r));                   // limbal ring
        vec3 col = mix(iris, sclera, smoothstep(0.97, 1.03, r));
        col = mix(vec3(0.015), col, smoothstep(uPupil - 0.015, uPupil + 0.015, a));
        // upper-lid contact shadow
        col *= 1.0 - 0.38 * smoothstep(0.05, 0.42, p.y);
        diffuseColor.rgb = col;`,
      )
  }
  m.customProgramCacheKey = () => 'eye'
  return m
}

export interface LidUniforms {
  uSkin: { value: Color }
  /** half-width, upper, lower (radians on the unit shell) */
  uShape: { value: Vector3 }
  /** tilt, cornerness power, hood */
  uShape2: { value: Vector3 }
  /** openness (blink × strength), side (+1 viewer's right eye, −1 left) */
  uOpen: { value: number }
  uSide: { value: number }
}

/** Eyelid shell around each eyeball: skin with the palpebral aperture cut out, lash line and crease. */
export function createLidMaterial(u: LidUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.5,
    sheen: 0.5,
    sheenRoughness: 0.5,
    sheenColor: new Color('#ff9a86'),
    side: DoubleSide,
  })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObj;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;`)
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSkin;
        uniform vec3 uShape;
        uniform vec3 uShape2;
        uniform float uOpen;
        uniform float uSide;
        varying vec3 vObj;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = normalize(vObj);
        float u = atan(p.x, max(p.z, 1e-3));
        float v = atan(p.y, max(p.z, 1e-3));
        float w = uShape.x;
        float k = clamp(abs(u) / w, 0.0, 1.0);
        float tilt = uShape2.x * u * uSide;
        float shape = 1.0 - pow(k, uShape2.y);
        float yU = uShape.y * uOpen * shape + tilt;
        float yL = -uShape.z * min(1.0, uOpen * 1.15 + 0.05) * (1.0 - pow(k, uShape2.y * 0.9)) + tilt * 0.6;
        float inside = step(0.0, p.z) * step(abs(u), w) * step(yL, v) * step(v, yU);
        if (inside > 0.5) discard;
        vec3 skin = uSkin * (0.97 + 0.05 * vnoise(p * 30.0));
        // lash line: dark, densest on the upper lid
        float dU = v - yU;
        float dL = yL - v;
        float onFront = step(0.0, p.z) * (1.0 - smoothstep(w * 0.98, w * 1.15, abs(u)));
        float lashU = smoothstep(0.075, 0.0, dU) * step(0.0, dU) * onFront;
        float lashL = smoothstep(0.035, 0.0, dL) * step(0.0, dL) * onFront;
        skin = mix(skin, vec3(0.12, 0.08, 0.07), clamp(lashU * 0.95 + lashL * 0.45, 0.0, 1.0));
        // lid crease (or hooded fold) above the upper lid
        float hz = min(uShape2.z, 1.0);
        float creaseY = yU + mix(0.2, 0.08, hz);
        float crease = exp(-sq2((v - creaseY) / 0.035)) * onFront * (1.0 - 0.6 * step(1.5, uShape2.z));
        skin *= 1.0 - 0.28 * crease;
        skin *= 1.0 - 0.2 * hz * (1.0 - smoothstep(yU, creaseY, v)) * step(yU, v) * onFront;
        // soft pink at the waterline/canthi
        skin = mix(skin, skin * vec3(1.0, 0.8, 0.8), 0.4 * exp(-sq2(dL / 0.03)) * step(0.0, dL) * onFront);
        diffuseColor.rgb = skin;`,
      )
  }
  m.customProgramCacheKey = () => 'lid'
  return m
}
