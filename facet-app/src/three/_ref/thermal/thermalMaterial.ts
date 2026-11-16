import { Color, ShaderMaterial, Vector3 } from 'three'
import type { Palette } from '../store'

/* ──────────────────────────────────────────────────────────────
   Thermal camera look: dark teal body, a thick pale-mint heat rim
   (fresnel), cooler creases (baked cavity), mottled sensor noise, a
   cardiac pulse, a horizontal scan sweep, and two alternate modes:
   depth (iso-contour bands) and mesh (topology grid). Values above
   ~1 feed the bloom pass.
   ────────────────────────────────────────────────────────────── */

export const PALETTES: Record<Palette, [string, string, string, string]> = {
  //        dark       mid        hot        white
  mint: ['#08241f', '#1a6a5e', '#8ff0c0', '#e4fff1'],
  amber: ['#1f1209', '#7a4a1f', '#f0c46b', '#fff3d8'],
  ice: ['#071726', '#1f4f7a', '#8fd0f0', '#e8f6ff'],
}

const vertex = /* glsl */ `
  attribute float cavity;
  attribute vec3 baseNormal;
  varying vec3 vBaseV;
  varying vec3 vLocal;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  varying float vCavity;
  void main() {
    vLocal = position;
    vCavity = cavity;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    vNormalV = normalize(normalMatrix * normal);
    vBaseV = normalize(normalMatrix * baseNormal);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uDark;
  uniform vec3 uMid;
  uniform vec3 uHot;
  uniform vec3 uWhite;
  uniform vec3 uMode;      // weights: thermal, depth, mesh
  uniform float uScanY;    // head-local y of the sweep line
  uniform float uScanOn;   // 0..1 while scanning
  uniform float uPulse;    // 0..1 cardiac
  uniform float uBody;     // 0 head mesh, 1 shoulders mesh
  uniform float uReveal;   // 0..1 intro
  uniform vec3 uBg;
  varying vec3 vLocal;
  varying vec3 vViewPos;
  varying vec3 vNormalV;
  varying vec3 vBaseV;
  varying float vCavity;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  vec3 ramp(float h) {
    h = clamp(h, 0.0, 1.0);
    if (h < 0.5) return mix(uDark, uMid, h / 0.5);
    if (h < 0.8) return mix(uMid, uHot, (h - 0.5) / 0.3);
    return mix(uHot, uWhite, (h - 0.8) / 0.2);
  }

  void main() {
    vec3 N = normalize(vNormalV);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = 1.0 - ndv;
    float y = vLocal.y;
    // shoulders/neck sink into the room's darkness
    float fade = smoothstep(-2.9, -1.25, y);
    float fade2 = fade * fade;

    // ── thermal ───────────────────────────────────────────
    // silhouette heat follows the big masses (base normal), so the nose/lips don't get halos
    float bfres = 1.0 - clamp(dot(normalize(vBaseV), V), 0.0, 1.0);
    // broad cream halo: wide falloff from the silhouette inwards
    float rim = smoothstep(0.2, 0.98, bfres);
    float heat = 0.08 + 0.78 * rim + 0.13 * smoothstep(0.0, 0.6, bfres);
    heat += 0.08 * smoothstep(0.55, 0.95, fres) * (1.0 - rim);
    heat -= vCavity * 0.34;
    float n = noise(vLocal * 9.0 + vec3(0.0, uTime * 0.06, 0.0)) * 0.6 + noise(vLocal * 23.0 - uTime * 0.04) * 0.4;
    heat += (n - 0.5) * 0.16;
    vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
    float lam = max(dot(N, L), 0.0);
    heat += 0.23 * lam - 0.05;
    // warm ridges: brow, cheekbone, nose bridge and lips catch a little extra heat
    heat += 0.1 * pow(max(dot(N, normalize(vec3(0.0, 0.25, 1.0))), 0.0), 8.0);
    heat *= 1.0 + 0.06 * uPulse;
    heat *= mix(1.0, 0.62, uBody);
    vec3 thermal = ramp(heat) * (1.0 + 1.5 * smoothstep(0.74, 1.0, heat));

    // ── depth: iso-contour bands on view depth ────────────
    float dz = -vViewPos.z * 14.0;
    float band = abs(fract(dz) - 0.5) / max(fwidth(dz), 1e-4);
    float iso = 1.0 - clamp(band - 0.5, 0.0, 1.0);
    vec3 depth = mix(uDark, uMid, 0.35 + 0.5 * ndv) + (uHot * iso * (0.55 + rim) + uHot * rim * 0.35) * fade2;

    // ── mesh: topology grid over darker skin ──────────────
    vec2 g = vLocal.xy * 26.0;
    vec2 gw = abs(fract(g) - 0.5) / max(fwidth(g), vec2(1e-4));
    float line = 1.0 - clamp(min(gw.x, gw.y) - 0.4, 0.0, 1.0);
    vec3 mesh = uDark * (0.7 + 0.5 * ndv) + (uHot * line * (0.35 + 0.9 * rim) + uMid * rim * 0.4) * fade2;

    vec3 col = thermal * uMode.x + depth * uMode.y + mesh * uMode.z;

    // ── scan sweep: scanned area bright, unscanned dimmed ─
    float scanned = smoothstep(uScanY - 0.02, uScanY + 0.02, y);
    col *= mix(1.0, mix(0.45, 1.0, scanned), uScanOn);
    float sweep = exp(-pow((y - uScanY) / 0.007, 2.0));
    col += uHot * sweep * 0.9 * uScanOn * (0.35 + 0.65 * fres);

    // depth/mesh modes fade harder so the grid never runs full-bright behind the cards
    col = mix(uBg, col, mix(fade, fade2, 1.0 - uMode.x));
    // intro fade
    col = mix(uBg, col, uReveal);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`

export function createThermalMaterial(body: boolean) {
  const [d, m, h, w] = PALETTES.mint
  return new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uDark: { value: new Color(d) },
      uMid: { value: new Color(m) },
      uHot: { value: new Color(h) },
      uWhite: { value: new Color(w) },
      uMode: { value: new Vector3(1, 0, 0) },
      uScanY: { value: 1.2 },
      uScanOn: { value: 1 },
      uPulse: { value: 0 },
      uBody: { value: body ? 1 : 0 },
      uReveal: { value: 0 },
      uBg: { value: new Color('#0a1513') },
    },
  })
}

/* Full-screen backdrop matching the CSS room gradient (so bloom never sees transparency). */
export const backdropVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.9999, 1.0); }
`
export const backdropFragment = /* glsl */ `
  uniform vec2 uRes;
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 d = (uv - vec2(0.52, 0.6)) / vec2(0.9, 0.8);
    float r = length(d);
    vec3 a = vec3(0.0784, 0.1569, 0.1451);  // #142825
    vec3 b = vec3(0.0510, 0.0980, 0.0902);  // #0d1917
    vec3 c = vec3(0.0275, 0.0549, 0.0510);  // #070e0d
    vec3 col = r < 0.55 ? mix(a, b, r / 0.55) : mix(b, c, clamp((r - 0.55) / 0.45, 0.0, 1.0));
    gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0); // authored in sRGB → linear working space
    #include <colorspace_fragment>
  }
`
