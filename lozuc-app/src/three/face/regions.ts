import type { RegionId } from '../../store'

/* Region ids ↔ shader ids, and the GLSL masks that light a region on the head
   surface (skin/map shaders). Masks use the head-local position P. */

export const REGION_IDS: RegionId[] = ['composition', 'hair', 'beard', 'brows', 'contrast', 'eyes', 'noseEars', 'lips', 'jaw', 'neck', 'skin']
export const regionIndex = (id: RegionId | null | undefined) => (id ? REGION_IDS.indexOf(id) : -1)

export const PRIORITY_COLOR = { alta: '#d8b97e', media: '#a9c7b6', baixa: '#d7e8de', none: '#6f7f77' } as const

export const REGION_GLSL = /* glsl */ `
  float rgBlob(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
  // beard zone on the skin: below the cheek line, above the neckline, lips excluded
  float beardZone(vec3 P) {
    float ax = abs(P.x);
    float cheek = -0.2 - 0.35 * smoothstep(0.74, 0.24, ax);
    float neck = -1.32 + 0.55 * smoothstep(-0.55, -1.0, P.z);
    float m = smoothstep(cheek + 0.03, cheek - 0.03, P.y) * smoothstep(neck - 0.04, neck + 0.04, P.y) * smoothstep(-1.06, -0.98, P.z);
    float lips = rgBlob(vec2(P.x, P.y), vec2(0.0, -0.67), vec2(0.2, 0.075));
    float mous = rgBlob(vec2(P.x, P.y), vec2(0.0, -0.545), vec2(0.24, 0.06)) * smoothstep(-0.3, 0.0, P.z);
    return clamp(max(m, mous) * (1.0 - smoothstep(0.35, 0.8, lips)), 0.0, 1.0);
  }
  float regionMask(vec3 P, float id) {
    float ax = abs(P.x);
    vec2 q = vec2(ax, P.y);
    float front = smoothstep(-0.7, -0.2, P.z);
    if (id < -0.5) return 0.0;
    if (id < 0.5) return front * smoothstep(-1.25, -1.1, P.y);                                     // composition: whole face
    if (id < 1.5) return smoothstep(0.35, 0.6, P.y) * (1.0 - front * 0.4);                         // hair (scalp)
    if (id < 2.5) return beardZone(P);                                                           // beard
    if (id < 3.5) return rgBlob(q, vec2(0.38, 0.14), vec2(0.25, 0.07)) * front;                  // brows
    if (id < 4.5) return rgBlob(q, vec2(0.42, -0.28), vec2(0.2, 0.16)) * front;                  // contrast (cheeks)
    if (id < 5.5) return rgBlob(q, vec2(0.345, -0.08), vec2(0.2, 0.12)) * front;                 // eyes + infraorbital
    if (id < 6.5) return max(rgBlob(vec2(P.x, P.y), vec2(0.0, -0.25), vec2(0.12, 0.22)) * front, rgBlob(vec2(ax, P.z), vec2(0.78, -0.95), vec2(0.12, 0.2)) * smoothstep(-0.5, -0.3, P.y) * (1.0 - smoothstep(0.15, 0.35, P.y))); // nose + ears
    if (id < 7.5) return rgBlob(vec2(P.x, P.y), vec2(0.0, -0.67), vec2(0.2, 0.09)) * front;      // lips
    if (id < 8.5) return smoothstep(0.2, 0.5, ax) * rgBlob(vec2(0.0, P.y), vec2(0.0, -0.78), vec2(1.0, 0.22)) + rgBlob(vec2(P.x, P.y), vec2(0.0, -1.04), vec2(0.25, 0.12)) * front; // jaw + chin
    if (id < 9.5) return smoothstep(-1.15, -1.3, P.y) * smoothstep(-2.0, -1.6, P.y);              // neck
    return (rgBlob(q, vec2(0.42, -0.3), vec2(0.22, 0.2)) + rgBlob(vec2(P.x, P.y), vec2(0.0, 0.36), vec2(0.4, 0.14))) * front; // skin: cheeks + forehead
  }
`
