/* Signed-distance sculpture of an anonymous figure seen over the shoulder:
   upper arm + deltoid, shoulder cap, trapezius, neck, head (soft-focus hair),
   back in a dark tank top with a strap, and a CGM sensor puck on the arm.
   Raymarched per pixel inside a tight bounding box; transparent elsewhere. */

export const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

export const FRAG = /* glsl */ `
uniform vec2 uRes;      // drawing buffer, device px
uniform float uDpr;
uniform float uScale;   // CSS px per design px
uniform vec2 uOrigin;   // CSS px of design (0,0)
uniform vec2 uCam;      // camera offset (world)
uniform float uF;       // camera distance
uniform float uTime;
uniform float uBreath;
uniform float uPulse;   // 0..1 reading pulse
uniform vec3 uCore;     // sensor core colour (linear)
uniform float uRimI;
uniform vec3 uRimCol;
uniform vec3 uKeyCol;
uniform vec3 uSP;       // sensor position
uniform vec3 uSN;       // sensor normal

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / k1;
}

// iq — round cone between arbitrary points
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a;
  float l2 = dot(ba, ba);
  float rr = r1 - r2;
  float a2 = l2 - rr * rr;
  float il2 = 1.0 / l2;
  vec3 pa = p - a;
  float y = dot(pa, ba);
  float z = y - l2;
  vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv);
  float y2 = y * y * l2;
  float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}

float sdSegment(vec3 p, vec3 a, vec3 b) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

/* components — kept separate so the hit can be classified into materials */
void parts(vec3 p, out float arm, out float back, out float head) {
  arm = sdRoundCone(p, vec3(0.0, 1.5, 0.0), vec3(-1.9, -5.8, 0.4), 1.05, 0.85);
  float delt = sdEllipsoid(p - vec3(-0.12, 1.55, 0.14), vec3(1.16, 1.12, 1.02));
  arm = smin(arm, delt, 0.5);

  float cap = length(p - vec3(0.25, 1.62, -0.15)) - 0.95;
  float trap = sdRoundCone(p, vec3(0.3, 1.8, -0.25), vec3(0.62, 2.55, -1.05), 0.78, 0.56);
  float neck = sdRoundCone(p, vec3(0.55, 2.35, -1.05), vec3(0.08, 3.9, -1.6), 0.5, 0.44);
  // back: slanted so the shoulder line falls away to the right, as in a 3/4 back view
  vec3 tq = p - vec3(2.7, -2.0, -1.35);
  tq.y += 0.2 * tq.x;
  float torso = sdEllipsoid(tq, vec3(2.55, 4.3, 1.3));
  // shoulder blade, a soft swell under the fabric
  float blade = sdEllipsoid(p - vec3(1.75, 0.2, -0.32), vec3(0.95, 1.2, 0.35));
  back = smin(smin(cap, trap, 0.55), torso, 0.9);
  back = smin(back, blade, 0.45);
  back = smin(back, neck, 0.35);

  head = sdEllipsoid(p - vec3(0.15, 4.05, -2.25), vec3(1.2, 1.38, 1.15));
}

float sdSensor(vec3 p) {
  vec3 q = p - uSP;
  float h = dot(q, uSN);
  float r = length(q - uSN * h);
  vec2 w = vec2(r - 0.5, abs(h - 0.04) - 0.03);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.055;
}

float mapD(vec3 p) {
  p.y -= uBreath;
  float arm, back, head;
  parts(p, arm, back, head);
  float body = smin(arm, back, 0.26);
  body = smin(body, head, 0.18);
  return min(body, sdSensor(p));
}

/* 0 skin · 1 fabric · 2 hair · 3 sensor body · 4 sensor core */
float material(vec3 p) {
  vec3 b = p; b.y -= uBreath;
  vec3 q = b - uSP;
  float h = dot(q, uSN);
  float sr = length(q - uSN * h);
  float arm, back, head;
  parts(b, arm, back, head);
  float body = smin(arm, back, 0.26);
  float sens = sdSensor(b);
  if (sens < body + 0.002 && sens < head) return (h > 0.09 && sr < 0.25) ? 4.0 : 3.0;
  if (head < body - 0.02) return 2.0;
  if (back < arm - 0.04) {
    // tank top: covers the back below a neckline, plus a strap over the trapezius
    float neckline = 2.05 - 0.12 * (b.x - 0.6);
    float strap = sdSegment(b, vec3(0.72, 2.35, -0.95), vec3(1.45, 0.3, -0.25));
    if (b.y < neckline || strap < 0.26) return 1.0;
  }
  return 0.0;
}

vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0025;
  return normalize(
    e.xyy * mapD(p + e.xyy) + e.yyx * mapD(p + e.yyx) + e.yxy * mapD(p + e.yxy) + e.xxx * mapD(p + e.xxx)
  );
}

float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 1; i <= 4; i++) {
    float h = 0.07 * float(i);
    occ += (h - mapD(p + n * h)) * sca;
    sca *= 0.6;
  }
  return clamp(1.0 - 1.8 * occ, 0.0, 1.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

vec3 shade(vec3 p, vec3 rd, float id) {
  vec3 n = calcNormal(p);
  vec3 v = -rd;
  float ndv = max(dot(n, v), 0.0);
  float ao = calcAO(p, n);

  vec3 L = normalize(vec3(0.55, 0.62, 0.58));     // warm key, upper right front
  vec3 Lf = normalize(vec3(-0.85, 0.25, 0.55));   // cool fill, left
  vec3 H = normalize(L + v);
  float ndl = dot(n, L);
  float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  float rim = pow(1.0 - ndv, 2.6) * smoothstep(-0.25, 0.85, n.x + 0.25 * n.y) * uRimI;
  vec3 amb = mix(vec3(0.025, 0.02, 0.018), vec3(0.2, 0.2, 0.21), n.y * 0.5 + 0.5);

  vec3 col;
  if (id < 0.5) {
    // skin — warm umber satin with a wrapped (subsurface-like) terminator
    vec3 alb = vec3(0.078, 0.05, 0.036);
    float wrap = max((ndl + 0.38) / 1.38, 0.0);
    float sss = smoothstep(0.0, 0.35, wrap) * smoothstep(0.75, 0.15, wrap);
    col = alb * (uKeyCol * wrap * 1.15 + amb * 0.9 + vec3(0.28, 0.33, 0.42) * max(dot(n, Lf), 0.0) * 0.35);
    col += vec3(0.32, 0.09, 0.04) * sss * 0.22;
    float spec = pow(max(dot(n, H), 0.0), 34.0) * 0.95 + pow(max(dot(n, H), 0.0), 7.0) * 0.08;
    col += uKeyCol * spec * fres * 3.2 * max(ndl, 0.0);
    col += uRimCol * rim * 0.8;
  } else if (id < 1.5) {
    // fabric — near-black jersey, faint sheen and weave
    vec3 alb = vec3(0.016, 0.016, 0.018) * (0.92 + 0.16 * hash(floor(p.xy * 160.0)));
    float wrap = max((ndl + 0.2) / 1.2, 0.0);
    col = alb * (uKeyCol * wrap + amb * 1.2);
    col += uKeyCol * pow(max(dot(n, H), 0.0), 10.0) * 0.035;
    col += uRimCol * rim * 0.16;
  } else if (id < 2.5) {
    // hair — deep matte brown, soft
    vec3 alb = vec3(0.03, 0.021, 0.015);
    col = alb * (uKeyCol * max(ndl, 0.0) + amb) + uRimCol * rim * 0.12;
  } else {
    // sensor
    vec3 q = p - vec3(0.0, uBreath, 0.0) - uSP;
    float h = dot(q, uSN);
    float r = length(q - uSN * h);
    vec3 body = vec3(0.028, 0.028, 0.031);
    float groove = smoothstep(0.012, 0.0, abs(r - 0.36)) * step(0.09, h);
    col = body * (uKeyCol * max(ndl, 0.0) * 0.9 + amb * 1.4) * (1.0 - groove * 0.6);
    col += uKeyCol * pow(max(dot(n, H), 0.0), 70.0) * 0.9 * fres * 4.0;
    col += vec3(0.6) * pow(1.0 - ndv, 4.0) * 0.08;
    if (id > 3.5) {
      // glowing chartreuse core with concentric etched rings + centre dot
      float ring = smoothstep(0.009, 0.0, abs(r - 0.115)) + smoothstep(0.008, 0.0, abs(r - 0.19)) * 0.7;
      float dotc = smoothstep(0.035, 0.025, r);
      float edge = smoothstep(0.25, 0.225, r);
      vec3 core = uCore * (0.55 + 0.45 * smoothstep(0.24, 0.0, r));
      core *= 1.0 - ring * 0.35 - dotc * 0.55;
      col = mix(col, core * (0.9 + uPulse * 0.9), edge);
      col += uKeyCol * pow(max(dot(n, H), 0.0), 120.0) * 0.6;
    }
    return col;
  }
  return col * mix(0.55, 1.0, ao);
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 d = (css - uOrigin) / uScale;
  vec3 P0 = vec3((d.x - 720.0) / 100.0, (500.0 - d.y) / 100.0, 0.0);
  vec3 ro = vec3(uCam, uF);
  vec3 rd = normalize(P0 - ro);

  // bounding box
  vec3 bmin = vec3(-3.6, -8.0, -3.4);
  vec3 bmax = vec3(5.4, 6.4, 1.9);
  vec3 inv = 1.0 / rd;
  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 tmn = min(t0, t1), tmx = max(t0, t1);
  float tn = max(max(tmn.x, tmn.y), tmn.z);
  float tf = min(min(tmx.x, tmx.y), tmx.z);
  if (tn > tf || tf < 0.0) discard;

  float pf = 0.01 / (uScale * uDpr);   // world size of one device pixel on the design plane
  float t = max(tn, 0.0);
  float minR = 1e9, tBest = t;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t;
    float dd = mapD(p);
    if (dd < minR) { minR = dd; tBest = t; }
    if (dd < pf * 0.35) { hit = true; break; }
    t += dd * 0.92;
    if (t > tf) break;
  }

  float alpha = 1.0;
  vec3 p;
  if (hit) {
    p = ro + rd * t;
  } else {
    p = ro + rd * tBest;
    // out-of-focus hair edge, crisp elsewhere
    float soft = pf * mix(1.6, 22.0, smoothstep(2.9, 4.0, p.y - uBreath));
    alpha = 1.0 - smoothstep(0.0, soft, minR);
    if (alpha <= 0.002) discard;
  }

  float id = material(p);
  vec3 col = shade(p, rd, id);
  if (id < 0.5 || id > 1.5 && id < 2.5) {
    // the head sits behind the focal plane — soften toward the studio grey
    float defocus = smoothstep(2.9, 4.4, p.y - uBreath);
    col = mix(col, vec3(0.16, 0.15, 0.145), defocus * 0.5);
  }
  // filmic + sRGB
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  gl_FragColor = vec4(col, alpha);
}
`
