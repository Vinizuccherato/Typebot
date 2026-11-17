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
  /** x side-fade amount (short sides under a top shell), y nape fade, z unused */
  uFade: { value: Vector3 }
  /** x brow density, y glabella cleaned (0..1), z definition */
  uBrow: { value: Vector3 }
  /** carved beard relief amounts: x short-boxed, y full, z goatee */
  uBeard: { value: Vector3 }
  uRegion: { value: number }
  uRegionAmt: { value: number }
  uClay: { value: number }
  uTime: { value: number }
}

/** Default "sculpted portrait" skin: warm, desaturated porcelain clay. */
export const PORCELAIN = '#e6cbba'

export const createSkinUniforms = (): SkinUniforms => ({
  uSkin: { value: new Color(PORCELAIN) },
  uShirt: { value: new Color('#1d2a25') },
  uHairTone: { value: new Color('#3b2a20') },
  uBeardTone: { value: new Color('#3b2a20') },
  uGroom: { value: new Vector3(1, 0.3, 0) },
  uFade: { value: new Vector3(0, 0, 0) },
  uBrow: { value: new Vector3(1, 0, 0.3) },
  uBeard: { value: new Vector3(0, 0, 0) },
  uRegion: { value: -1 },
  uRegionAmt: { value: 0 },
  uClay: { value: 0 },
  uTime: { value: 0 },
})

const CLAY = 'vec3(0.78, 0.8, 0.78)'

/** Tone (linear) → a matte "tonal clay": darker clay in the hair/beard colour, lifted enough for carving to read. */
const TONAL = /* glsl */ `
  vec3 tonal(vec3 tone, vec3 base) {
    vec3 t = tone * 3.2 + 0.16;
    t = mix(vec3(dot(t, vec3(0.3, 0.59, 0.11))), t, 0.55); // desaturated: toned clay, not paint
    return base * t;
  }
  // Mikkelsen bump with world-unit heights (unnormalised screen derivatives)
  vec3 lzBump(vec3 surf_pos, vec3 surf_norm, float h, float faceDir) {
    vec3 sx = dFdx(surf_pos); vec3 sy = dFdy(surf_pos);
    vec3 R1 = cross(sy, surf_norm); vec3 R2 = cross(surf_norm, sx);
    float det = dot(sx, R1) * faceDir;
    vec3 grad = sign(det) * (dFdx(h) * R1 + dFdy(h) * R2);
    return normalize(abs(det) * surf_norm - grad);
  }
`

/** Carved beard relief (head-local P, 1 unit = 10 cm) — shared by vertex (displacement) and fragment (tint). */
const RELIEF = /* glsl */ `
  float rgB(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
  float bzone(vec3 P, float lift, float drop, float s) {
    float ax = abs(P.x);
    float cheek = -0.2 - 0.35 * (1.0 - smoothstep(0.24, 0.74, ax)) + lift;
    float neck = -1.32 - drop + 0.55 * (1.0 - smoothstep(-1.0, -0.55, P.z));
    float m = (1.0 - smoothstep(cheek - s, cheek + s, P.y)) * smoothstep(neck - s * 1.5, neck + s * 1.5, P.y) * smoothstep(-1.06, -0.98, P.z);
    float lips = rgB(P.xy, vec2(0.0, -0.67), vec2(0.2, 0.075));
    float mous = rgB(P.xy, vec2(0.0, -0.545), vec2(0.24, 0.06)) * smoothstep(-0.3, 0.0, P.z);
    return clamp(max(m, mous) * (1.0 - smoothstep(0.5, 0.88, lips)), 0.0, 1.0);
  }
  float reliefH(vec3 P, vec3 amt) {
    if (amt.x + amt.y + amt.z < 0.001) return 0.0;
    float ax = abs(P.x);
    float chin = rgB(P.xy, vec2(0.0, -1.0), vec2(0.34, 0.22));
    // thin to nothing toward the sideburns
    float burn = 1.0 - 0.75 * smoothstep(-0.5, -0.2, P.y) * smoothstep(0.5, 0.74, ax);
    float h = amt.x * 0.07 * bzone(P, -0.07, -0.02, 0.012) * burn;                     // short boxed: 7 mm, crisp lines
    h += amt.y * (0.065 + 0.04 * chin) * bzone(P, 0.0, 0.07, 0.035) * burn;           // full
    vec2 qa = vec2(abs(P.x), P.y);
    float goat = max(max(rgB(P.xy, vec2(0.0, -0.95), vec2(0.17, 0.17)), rgB(P.xy, vec2(0.0, -0.55), vec2(0.21, 0.055)) * smoothstep(-0.3, 0.0, P.z)),
                     rgB(qa, vec2(0.17, -0.78), vec2(0.045, 0.16)) * smoothstep(-0.3, 0.0, P.z)); // circle beard: chin + moustache joined at the mouth corners
    goat *= 1.0 - smoothstep(0.3, 0.75, rgB(P.xy, vec2(0.0, -0.67), vec2(0.2, 0.075)));
    h += amt.z * 0.04 * smoothstep(0.25, 0.6, goat) * smoothstep(-0.5, -0.1, P.z);   // goatee
    return h;
  }
`

/** Skin. kind 'head' paints the face (and carries the carved beard relief); 'body' paints the neck and the crew-neck tee. */
export function createSkinMaterial(kind: 'head' | 'body', u: SkinUniforms) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.74,
    metalness: 0,
    specularIntensity: 0.35,
    sheen: 0.14,
    sheenRoughness: 0.8,
    sheenColor: new Color('#e8b8a2'), // a breath of subsurface warmth at grazing angles, no plastic highlight
  })
  if (kind === 'head') m.defines = { LZ_HEAD: '' }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float cavity;
        uniform vec3 uBeard;
        varying vec3 vLocal;
        varying float vCav;
        varying float vRelief;
        ${RELIEF}`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        float lzH = 0.0;
        #ifdef LZ_HEAD
        lzH = reliefH(position, uBeard);
        if (uBeard.x + uBeard.y + uBeard.z > 0.001) {
          const float e = 0.012;
          vec3 g = vec3(
            reliefH(position + vec3(e, 0.0, 0.0), uBeard) - reliefH(position - vec3(e, 0.0, 0.0), uBeard),
            reliefH(position + vec3(0.0, e, 0.0), uBeard) - reliefH(position - vec3(0.0, e, 0.0), uBeard),
            reliefH(position + vec3(0.0, 0.0, e), uBeard) - reliefH(position - vec3(0.0, 0.0, e), uBeard)) / (2.0 * e);
          objectNormal = normalize(objectNormal - (g - objectNormal * dot(g, objectNormal)));
        }
        #endif`,
      )
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvLocal = position;\nvCav = cavity;\nvRelief = lzH;\ntransformed += normal * lzH;`)
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uSkin; uniform vec3 uShirt; uniform vec3 uHairTone; uniform vec3 uBeardTone;
        uniform vec3 uGroom; uniform vec3 uFade; uniform vec3 uBrow;
        uniform float uRegion; uniform float uRegionAmt; uniform float uClay; uniform float uTime;
        varying vec3 vLocal;
        varying float vCav;
        varying float vRelief;
        ${NOISE}
        ${REGION_GLSL}
        ${TONAL}
        float hairlineH(float ax, float z) {
          float front = 0.6 - 0.55 * ax * ax - 0.12 * smoothstep(0.32, 0.52, ax);
          float side = 0.03 - 0.62 * (1.0 - smoothstep(-1.5, -0.98, z));
          float w = 1.0 - smoothstep(-0.72, -0.32, z);
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
        float tee = 0.0;
        float bumpH = 0.00022 * vnoise(P * 320.0); // fine micro-grain of unglazed porcelain
        vec3 skin = uSkin * (0.985 + 0.025 * vnoise(P * 9.0) + 0.012 * vnoise(P * 140.0));
        ${
          kind === 'head'
            ? `
        vec2 q = vec2(ax, P.y);
        // subsurface warmth on nose, ears and cheeks, a hint cooler at the temples
        skin = mix(skin, skin * vec3(1.02, 0.9, 0.86), 0.2 * (rgBlob(q, vec2(0.36, -0.32), vec2(0.2, 0.16)) + rgBlob(vec2(P.x, P.y), vec2(0.0, -0.36), vec2(0.08, 0.07)) + rgBlob(vec2(ax, P.z), vec2(0.78, -0.95), vec2(0.1, 0.18))));
        // lips: tonal, never painted
        float lip = clamp(rgBlob(vec2(P.x, P.y), vec2(0.0, -0.615), vec2(0.16, 0.03)) + rgBlob(vec2(P.x, P.y), vec2(0.0, -0.712), vec2(0.14, 0.04)), 0.0, 1.0) * smoothstep(-0.2, 0.0, P.z);
        skin = mix(skin, skin * vec3(0.94, 0.8, 0.78), lip * 0.55);
        float mouth = exp(-sq2((P.y + 0.655 - 0.12 * sq2(P.x)) / 0.006)) * (1.0 - smoothstep(0.17, 0.21, ax)) * smoothstep(-0.1, 0.05, P.z);
        skin *= 1.0 - 0.45 * mouth;

        // ── beard on the skin: shave shadow, stubble engraved as fine stipple ──
        float bz = beardZone(P);
        vec3 bTone = tonal(uBeardTone, skin);
        skin = mix(skin, skin * mix(vec3(0.86, 0.85, 0.86), bTone * 2.2, 0.25), bz * uGroom.y * 0.3);
        float dots = smoothstep(0.6, 0.86, vnoise(P * 430.0)) * (0.55 + 0.45 * vnoise(P * 70.0));
        float stub = bz * uGroom.x * clamp(dots * 1.15 + 0.3, 0.0, 1.0);
        skin = mix(skin, bTone, stub * 0.5);
        bumpH -= bz * uGroom.x * dots * 0.0006;
        // carved beard relief (displaced in the vertex shader): tonal clay with downward strand grooves
        float cov = smoothstep(0.0, 0.026, vRelief);
        float grooves = vnoise(vec3(P.x * 240.0, P.y * 34.0, P.z * 240.0));
        float locks = vnoise(P * vec3(36.0, 11.0, 36.0));
        skin = mix(skin, bTone * (0.86 + 0.18 * grooves) * (0.9 + 0.12 * locks), cov);
        bumpH += cov * (0.0016 * grooves + 0.004 * locks);

        // ── scalp: buzz and short-side fades as a sculpted gradient into the skin ──
        float H = hairlineH(ax, P.z);
        float scalp = smoothstep(H - 0.03, H + 0.03, P.y);
        float fadeUp = smoothstep(H - 0.02, H + 0.45, P.y);
        float sideW = (1.0 - smoothstep(-0.55, -0.25, P.z)) + smoothstep(0.42, 0.62, ax);
        float density = max(uGroom.z, uFade.x * clamp(sideW, 0.0, 1.0) * mix(0.2, 1.0, fadeUp));
        float sdots = smoothstep(0.4, 0.85, vnoise(P * 260.0)) * 0.6 + 0.4 * vnoise(P * 80.0);
        float hairA = scalp * density * clamp(sdots * 0.9 + 0.35, 0.0, 1.0) * 0.85;
        skin = mix(skin, tonal(uHairTone, skin), hairA);
        bumpH -= scalp * density * sdots * 0.0007;

        // ── brows: tonal strokes, slightly raised ──
        float u = clamp((ax - 0.15) / 0.47, 0.0, 1.0);
        float cy = 0.112 + 0.085 * sin(3.14159 * min(u * 1.12, 1.0)) - 0.025 * u;
        float hh = mix(0.04, 0.016, u) * (0.8 + 0.4 * uBrow.x);
        float inBrow = (1.0 - smoothstep(hh * (0.65 + 0.35 * (1.0 - uBrow.z)), hh, abs(P.y - cy))) * step(0.15, ax) * (1.0 - smoothstep(0.6, 0.66, ax)) * smoothstep(-0.25, -0.05, P.z);
        float strokes = 0.55 + 0.45 * vnoise(vec3(P.x * 160.0 + P.y * 220.0 * sign(P.x), P.y * 40.0, 0.0));
        float glab = exp(-sq2(P.x / 0.07) - sq2((P.y - 0.115) / 0.03)) * (1.0 - uBrow.y) * smoothstep(0.6, 0.9, vnoise(P * 300.0));
        float browA = clamp(inBrow * strokes * (0.72 + 0.25 * uBrow.z) + glab * 0.7, 0.0, 1.0);
        skin = mix(skin, tonal(uHairTone, skin) * 0.9, browA);
        bumpH += browA * 0.0012 * strokes;
        `
            : `
        // crew-neck tee below the collar line
        float yc = P.z > -0.95 ? -1.78 - 0.32 * max(0.0, 1.0 - sq2(P.x / 0.62)) : -1.62;
        tee = smoothstep(yc + 0.012, yc - 0.012, P.y);
        float rib = smoothstep(0.05, 0.0, abs(P.y - (yc - 0.04)));
        vec3 fabric = uShirt * (0.92 + 0.08 * vnoise(P * vec3(60.0, 8.0, 60.0)));
        fabric *= 1.0 - 0.08 * rib * (0.6 + 0.4 * sin(P.x * 260.0));
        skin = mix(skin, fabric, tee);
        `
        }
        // creases: gentle AO with warm (subsurface) cavities
        skin *= mix(vec3(1.0), vec3(0.97, 0.84, 0.8), clamp(vCav * 1.4, 0.0, 1.0) * (1.0 - tee));
        skin *= 1.0 - vCav * 0.32;
        // map mode: matte clay
        skin = mix(skin, ${CLAY} * (1.0 - vCav * 0.6), uClay);
        bumpH *= 1.0 - 0.5 * uClay;
        // region glow
        ${kind === 'head' ? 'float rm = regionMask(P, uRegion) * uRegionAmt;' : 'float rm = (uRegion > 8.5 && uRegion < 9.5 ? (1.0 - smoothstep(-1.3, -1.15, P.y)) * smoothstep(-2.0, -1.6, P.y) : 0.0) * uRegionAmt;'}
        skin = mix(skin, mix(vec3(0.396, 0.571, 0.468), vec3(0.11, 0.24, 0.17), uClay), rm * mix(0.5, 0.85, uClay));
        diffuseColor.rgb = skin;
        ${kind === 'head' ? 'if (vLocal.y < -1.31) discard;' : ''}`,
      )
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\nnormal = lzBump(-vViewPosition, normal, bumpH, faceDirection);`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.396, 0.571, 0.468) * rm * (0.12 + 0.06 * sin(uTime * 3.0)) * (1.0 - 0.6 * uClay);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(roughnessFactor, 0.92, tee), 0.85, uClay);`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
        #ifdef USE_SHEEN
        material.sheenColor *= 1.0 - tee * 0.9;
        #endif`,
      )
  }
  m.customProgramCacheKey = () => `lz-skin2-${kind}`
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

/** Hair/beard shell as a sculpted mass: matte tonal clay, strand grooves carved along the flow, tufted silhouette. */
export function createShellMaterial(u: ShellUniforms, beard = false) {
  const m = new MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.82,
    metalness: 0,
    specularIntensity: 0.3,
    sheen: 0.25,
    sheenRoughness: 0.7,
    sheenColor: new Color('#b9cbbf'), // soft cool rim on the mass
    envMapIntensity: 0.4,
  })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uFlow;\nvarying vec3 vLocal;\nvarying float vAcross;\nvarying float vAlong;`)
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
        vAcross = dot(P, normalize(cross(normal, tl)));
        vAlong = dot(P, tl);`,
      )
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uTone; uniform float uShow; uniform vec3 uKeyView; uniform float uHi; uniform float uClay; uniform float uTime;
        varying vec3 vLocal;
        varying float vAcross;
        varying float vAlong;
        ${NOISE}
        ${TONAL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 P = vLocal;
        // dithered dissolve: crossfades between styles without transparency sorting
        if (hash31(floor(gl_FragCoord.xyz * vec3(1.0, 1.0, 0.0)) + vec3(0.0, 0.0, 7.0)) > uShow) discard;
        float warp = vnoise(P * 5.0) * 4.0;
        float grooves = 0.5 + 0.5 * sin(vAcross * ${beard ? '320.0' : '120.0'} + warp * 1.5 + 3.0 * vnoise(vec3(vAcross * 20.0, vAlong * 4.0, 1.0)));
        float locks = vnoise(vec3(vAcross * 12.0 + warp * 0.3, vAlong * 2.0, P.y * 1.5));
        vec3 col = tonal(uTone, vec3(0.86, 0.69, 0.59)) * (0.93 + 0.09 * grooves) * (0.88 + 0.16 * locks);
        col = mix(col, vec3(0.6, 0.65, 0.62) * (0.85 + 0.15 * grooves), uClay);
        col = mix(col, vec3(0.396, 0.571, 0.468), uHi * 0.4);
        diffuseColor.rgb = col;
        float bumpH = (0.0032 * grooves + 0.012 * locks) * (1.0 - 0.6 * uClay);`,
      )
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\nnormal = lzBump(-vViewPosition, normal, bumpH, faceDirection);`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          totalEmissiveRadiance += vec3(0.396, 0.571, 0.468) * uHi * (0.14 + 0.05 * sin(uTime * 3.0));
          // tufted silhouette: dither the grazing rim so the mass reads as hair, not a helmet
          vec3 V = normalize(vViewPosition);
          float ndv = abs(dot(normal, V));
          float rimA = smoothstep(0.0, 0.08, ndv);
          float fray = vnoise(vec3(vAcross * 30.0, vAlong * 4.0, P.y * 8.0));
          if (rimA < fray * 0.4) discard;
        }`,
      )
  }
  m.customProgramCacheKey = () => `lz-shell2-${beard ? 'b' : 'h'}`
  return m
}

/* ── eyes: sculpted, calm ───────────────────────────────────── */

export interface EyeUniforms {
  uIris: { value: Color }
  uPupil: { value: number }
  uSkin: { value: Color }
  uClay: { value: number }
}

/** Eyeball as a sculptor would carve it: porcelain sclera (no white stare), softly painted iris, carved pupil, low gloss. */
export function createEyeMaterial(u: EyeUniforms) {
  const m = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.25, specularIntensity: 0.5 })
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\nvarying vec3 vObj;`).replace('#include <begin_vertex>', `#include <begin_vertex>\nvObj = position;`)
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nuniform vec3 uIris;\nuniform float uPupil;\nuniform vec3 uSkin;\nuniform float uClay;\nvarying vec3 vObj;\n${NOISE}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 p = normalize(vObj);
        float a = acos(clamp(p.z, -1.0, 1.0));
        float th = atan(p.y, p.x);
        float ri = 0.64;
        vec3 sclera = uSkin * vec3(0.97, 0.97, 0.97) * (1.0 - 0.38 * smoothstep(0.7, 1.4, a));
        float r = a / ri;
        float fib = 0.7 + 0.3 * vnoise(vec3(th * 9.0, r * 3.0, 0.0)) * (0.6 + 0.4 * sin(th * 60.0 + vnoise(p * 40.0) * 4.0));
        vec3 iris = (uIris * 2.4 + uSkin * 0.05) * fib;
        iris = mix(iris, iris * 0.55, smoothstep(0.72, 1.0, r));
        vec3 col = mix(iris, sclera, smoothstep(0.95, 1.06, r));
        col = mix(col * 0.25, col, smoothstep(uPupil - 0.02, uPupil + 0.03, a)); // carved pupil, not a black hole
        col *= 1.0 - 0.5 * smoothstep(-0.1, 0.3, p.y); // shadow of the hooded upper lid
        col = mix(col, vec3(0.78, 0.8, 0.78) * mix(0.62, 1.0, smoothstep(0.92, 1.04, r)) * mix(0.6, 1.0, smoothstep(uPupil - 0.02, uPupil + 0.03, a)), uClay);
        diffuseColor.rgb = col;`,
      )
  }
  m.customProgramCacheKey = () => 'lz-eye2'
  return m
}

export interface LidUniforms {
  uSkin: { value: Color }
  uClay: { value: number }
  uOpen: { value: number }
  uSide: { value: number }
}

/** Eyelid shell: porcelain skin with the palpebral aperture cut out (male almond, slightly hooded, ~25% narrower). */
export function createLidMaterial(u: LidUniforms) {
  const m = new MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.74, specularIntensity: 0.35, sheen: 0.14, sheenRoughness: 0.8, sheenColor: new Color('#e8b8a2'), side: DoubleSide })
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
        float w = 0.97;
        float k = clamp(abs(u) / w, 0.0, 1.0);
        float tilt = 0.05 * u * uSide;
        float yU = 0.235 * uOpen * (1.0 - pow(k, 1.5)) + tilt - 0.02;
        float yL = -0.2 * min(1.0, uOpen * 1.15 + 0.05) * (1.0 - pow(k, 1.4)) + tilt * 0.6;
        float inside = step(0.0, p.z) * step(abs(u), w) * step(yL, v) * step(v, yU);
        if (inside > 0.5) discard;
        vec3 skin = uSkin * (0.94 + 0.03 * vnoise(p * 30.0));
        // melt into the socket: darker toward the shell's rim, like the face's own creases
        skin *= 1.0 - 0.28 * smoothstep(0.55, 1.25, acos(clamp(p.z, -1.0, 1.0)));
        float onFront = step(0.0, p.z) * (1.0 - smoothstep(w * 0.98, w * 1.15, abs(u)));
        float dU = v - yU;
        float dL = yL - v;
        // soft carved lid margins (no painted lash line)
        skin *= 1.0 - clamp(smoothstep(0.05, 0.0, dU) * step(0.0, dU) * onFront * 0.42 + smoothstep(0.025, 0.0, dL) * step(0.0, dL) * onFront * 0.18, 0.0, 1.0);
        // hooded fold just above the lid
        skin *= 1.0 - 0.2 * exp(-sq2((v - (yU + 0.09)) / 0.035)) * onFront;
        skin = mix(skin, vec3(0.78, 0.8, 0.78), uClay);
        diffuseColor.rgb = skin;`,
      )
  }
  m.customProgramCacheKey = () => 'lz-lid2'
  return m
}
