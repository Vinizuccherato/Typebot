import { useId } from 'react'
import type { BrowFormId, EyeFormId, GlassesId } from '../store'

/* Hand-built SVG illustrations for the thumbnails: glasses frames, eye close-ups and brows.
   They re-tint live with the current eye / brow colour. */

/* ── glasses ─────────────────────────────────────────────── */

export function GlassesArt({ id, size = 40 }: { id: Exclude<GlassesId, 'none'>; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const lens = 'rgb(255 255 255 / 0.18)'
  const common = { fill: lens, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg width={size} height={(size * 18) / 44} viewBox="0 0 44 18" aria-hidden>
      <defs>
        <linearGradient id={`tort-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b07a4f" />
          <stop offset="0.45" stopColor="#6a3f24" />
          <stop offset="0.75" stopColor="#a8703f" />
          <stop offset="1" stopColor="#4f2d18" />
        </linearGradient>
        <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8cf9a" />
          <stop offset="1" stopColor="#9c7a45" />
        </linearGradient>
        <linearGradient id={`ink-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3d47" />
          <stop offset="1" stopColor="#14151a" />
        </linearGradient>
      </defs>
      {id === 'round' && (
        <g stroke={`url(#tort-${uid})`} strokeWidth="1.8" {...common}>
          <circle cx="11.5" cy="9.5" r="6.6" />
          <circle cx="32.5" cy="9.5" r="6.6" />
          <path d="M18 8.6 Q22 6.4 26 8.6" fill="none" />
          <path d="M5 7.5 L1 6.6 M39 7.5 L43 6.6" fill="none" />
        </g>
      )}
      {id === 'aviator' && (
        <g stroke={`url(#gold-${uid})`} strokeWidth="1.1" {...common}>
          <path d="M4 5 Q11 3.6 18.5 5 Q19.5 11 15 14.6 Q9 16.4 5.6 12.6 Q3.4 9.6 4 5 Z" />
          <path d="M40 5 Q33 3.6 25.5 5 Q24.5 11 29 14.6 Q35 16.4 38.4 12.6 Q40.6 9.6 40 5 Z" />
          <path d="M18.5 5 Q22 3.4 25.5 5 M18.6 7.4 Q22 6.4 25.4 7.4" fill="none" />
          <path d="M4 5 L1 4.4 M40 5 L43 4.4" fill="none" />
        </g>
      )}
      {id === 'wayfarer' && (
        <g stroke={`url(#ink-${uid})`} {...common}>
          <path d="M3 4 L19 4 L17.6 12.4 Q16.6 15 13 15 L8 15 Q4.6 15 4 12 Z" strokeWidth="2.6" />
          <path d="M41 4 L25 4 L26.4 12.4 Q27.4 15 31 15 L36 15 Q39.4 15 40 12 Z" strokeWidth="2.6" />
          <path d="M19 6 Q22 4.6 25 6" fill="none" strokeWidth="2" />
        </g>
      )}
      {id === 'cateye' && (
        <g stroke={`url(#ink-${uid})`} strokeWidth="2" {...common}>
          <path d="M2 3.2 Q8 5 18.2 5.4 Q18.6 11.6 14.4 14 Q8.6 15.6 5.6 12.2 Q3.4 8.4 2 3.2 Z" />
          <path d="M42 3.2 Q36 5 25.8 5.4 Q25.4 11.6 29.6 14 Q35.4 15.6 38.4 12.2 Q40.6 8.4 42 3.2 Z" />
          <path d="M18.2 6.6 Q22 5.2 25.8 6.6" fill="none" strokeWidth="1.6" />
        </g>
      )}
      {id === 'browline' && (
        <g {...common}>
          <path d="M4 9 Q4.6 15.2 11.4 15.2 Q18 15.2 18.6 9" stroke="#c9ced8" strokeWidth="0.9" fill={lens} />
          <path d="M25.4 9 Q26 15.2 32.6 15.2 Q39.4 15.2 40 9" stroke="#c9ced8" strokeWidth="0.9" fill={lens} />
          <path d="M3.4 9.6 Q3.6 4.2 11.4 4.2 Q18.6 4.2 19 9.6" stroke={`url(#ink-${uid})`} strokeWidth="2.8" fill="none" />
          <path d="M25 9.6 Q25.4 4.2 32.6 4.2 Q40.4 4.2 40.6 9.6" stroke={`url(#ink-${uid})`} strokeWidth="2.8" fill="none" />
          <path d="M19 7 Q22 5.8 25 7" stroke="#c9ced8" strokeWidth="1.1" fill="none" />
        </g>
      )}
      {id === 'rimless' && (
        <g {...common}>
          <rect x="4" y="4.4" width="14.6" height="10" rx="4.4" stroke="rgb(255 255 255 / 0.85)" strokeWidth="0.8" fill="rgb(200 220 255 / 0.22)" />
          <rect x="25.4" y="4.4" width="14.6" height="10" rx="4.4" stroke="rgb(255 255 255 / 0.85)" strokeWidth="0.8" fill="rgb(200 220 255 / 0.22)" />
          <path d="M18.6 7.6 Q22 6.2 25.4 7.6" stroke="#d9dde6" strokeWidth="1" fill="none" />
          <path d="M4 6.4 L1 5.8 M40 6.4 L43 5.8" stroke="#d9dde6" strokeWidth="0.9" fill="none" />
        </g>
      )}
    </svg>
  )
}

/* ── eyes ────────────────────────────────────────────────── */

const EYE: Record<EyeFormId, { hu: number; hl: number; tilt: number; crease: number | null; hood?: boolean }> = {
  almond: { hu: 11, hl: 6, tilt: 1.5, crease: 6 },
  round: { hu: 14, hl: 9, tilt: 0, crease: 7.5 },
  hooded: { hu: 10.5, hl: 6, tilt: 0.5, crease: 2.2, hood: true },
  monolid: { hu: 8, hl: 5, tilt: 1.5, crease: null },
  upturned: { hu: 11, hl: 5, tilt: 5.5, crease: 6 },
  downturned: { hu: 11, hl: 6.5, tilt: -4, crease: 6 },
}

type P = [number, number]
const bez = (a: P, b: P, c: P, d: P, t: number): P => {
  const u = 1 - t
  return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]
}

export function EyeArt({ form, color, width = 64, height = 44 }: { form: EyeFormId; color: string; width?: number; height?: number }) {
  const uid = useId().replace(/:/g, '')
  const e = EYE[form]
  const A: P = [11, 25]
  const D: P = [54, 25 - e.tilt]
  const B: P = [19, 25 - e.hu * 1.15]
  const C: P = [44, 25 - e.hu * 1.05 - e.tilt * 0.6]
  const Lc: P = [44, 25 - e.tilt + e.hl]
  const Lb: P = [20, 25 + e.hl]
  const eye = `M${A} C${B} ${C} ${D} C${Lc} ${Lb} ${A} Z`
  const upper = `M${A} C${B} ${C} ${D}`
  const crease = e.crease === null ? null : `M${A[0] + 2},${A[1] - e.crease * 0.55} C${B[0]},${B[1] - e.crease} ${C[0]},${C[1] - e.crease} ${D[0] + 1},${D[1] - e.crease * 0.6}`
  const iris: P = [33, 24.2 - e.tilt * 0.35]
  const ir = Math.min(8.4, (e.hu + e.hl) * 0.47)
  const lashes = Array.from({ length: 9 }, (_, i) => {
    const t = 0.38 + i * 0.075
    const p = bez(A, B, C, D, t)
    const q = bez(A, B, C, D, Math.min(1, t + 0.01))
    const nx = q[1] - p[1]
    const ny = -(q[0] - p[0])
    const n = Math.hypot(nx, ny) || 1
    const len = 1.5 + t * 2.4
    return `M${p[0].toFixed(2)},${p[1].toFixed(2)} q${((nx / n) * len * 0.4 + len * 0.55).toFixed(2)},${((ny / n) * len * 0.8 - len * 0.2).toFixed(2)} ${((nx / n) * len * 0.6 + len * 0.9).toFixed(2)},${((ny / n) * len).toFixed(2)}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox="6 6 52 36" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6c7b6" />
          <stop offset="0.6" stopColor="#d9b29e" />
          <stop offset="1" stopColor="#caa08b" />
        </linearGradient>
        <radialGradient id={`sclera-${uid}`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0.55" stopColor="#f6f2ef" />
          <stop offset="1" stopColor="#d9cdc8" />
        </radialGradient>
        <radialGradient id={`iris-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={`color-mix(in srgb, ${color} 55%, #fff4d6)`} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="0.92" stopColor={`color-mix(in srgb, ${color} 55%, #1d1a22)`} />
          <stop offset="1" stopColor="#2a2630" />
        </radialGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={eye} />
        </clipPath>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <rect width="64" height="44" fill={`url(#skin-${uid})`} />
      <ellipse cx="34" cy="10" rx="30" ry="9" fill="#f3dccf" opacity="0.45" />
      {crease && <path d={crease} fill="none" stroke="#9a6f60" strokeOpacity="0.5" strokeWidth="1" filter={`url(#soft-${uid})`} />}
      <path d={eye} fill={`url(#sclera-${uid})`} />
      <g clipPath={`url(#clip-${uid})`}>
        <circle cx={iris[0]} cy={iris[1]} r={ir} fill={`url(#iris-${uid})`} />
        <circle cx={iris[0]} cy={iris[1]} r={ir} fill="none" stroke="#2a2630" strokeOpacity="0.55" strokeWidth="0.8" />
        <circle cx={iris[0]} cy={iris[1]} r={ir * 0.4} fill="#121014" />
        <circle cx={iris[0] + ir * 0.32} cy={iris[1] - ir * 0.36} r={ir * 0.17} fill="#fff" opacity="0.9" />
        {/* lid shadow on the eyeball */}
        <path d={upper} fill="none" stroke="#5a3a33" strokeOpacity="0.35" strokeWidth="5" filter={`url(#soft-${uid})`} />
      </g>
      {e.hood && (
        <path
          d={`M${A[0] + 6},${A[1] - e.hu * 0.9} C${B[0] + 4},${B[1] - 1} ${C[0]},${C[1] + 2.4} ${D[0] + 2},${D[1] + 0.6} L${D[0] + 6},${D[1] - 8} L${A[0] + 6},${A[1] - 14} Z`}
          fill="#d6ad98"
          opacity="0.95"
        />
      )}
      <path d={upper} fill="none" stroke="#2c1f1d" strokeWidth="1.5" strokeLinecap="round" />
      <path d={lashes} fill="none" stroke="#2c1f1d" strokeWidth="0.55" strokeLinecap="round" opacity="0.75" />
      <path d={`M${D} C${Lc} ${Lb} ${A}`} fill="none" stroke="#8f6a5d" strokeOpacity="0.55" strokeWidth="0.8" />
    </svg>
  )
}

/* ── brows ───────────────────────────────────────────────── */

const BROW: Record<BrowFormId, { peak: number; rise: number; th: [number, number, number]; sharp: number; s?: boolean }> = {
  straight: { peak: 0.7, rise: 2.4, th: [6.4, 5.2, 2.2], sharp: 1 },
  'soft-arch': { peak: 0.64, rise: 6, th: [6, 4.8, 1.8], sharp: 1.4 },
  'high-arch': { peak: 0.6, rise: 9.5, th: [5.6, 4.4, 1.6], sharp: 2.6 },
  rounded: { peak: 0.5, rise: 7, th: [5.6, 5, 2], sharp: 1 },
  's-shaped': { peak: 0.66, rise: 7, th: [5.8, 4.6, 1.8], sharp: 1.8, s: true },
  'bold-flat': { peak: 0.7, rise: 1.6, th: [9, 7.6, 3.4], sharp: 1 },
}

export function BrowArt({ form, color, width = 140, height = 40 }: { form: BrowFormId; color: string; width?: number; height?: number }) {
  const uid = useId().replace(/:/g, '')
  const b = BROW[form]
  const x0 = 16
  const x1 = 126
  const base = 25
  const N = 28
  const center = (t: number) => {
    // arch profile: rises to `peak`, then falls faster (sharpness)
    const up = t <= b.peak ? Math.sin(((t / b.peak) * Math.PI) / 2) : Math.pow(Math.cos((((t - b.peak) / (1 - b.peak)) * Math.PI) / 2), b.sharp)
    let y = base - b.rise * up + (1 - t) * 1.5
    if (b.s) y += 2.2 * Math.exp(-Math.pow((t - 0.12) / 0.1, 2))
    return y
  }
  const thick = (t: number) => 1.45 * (t < 0.45 ? b.th[0] + (b.th[1] - b.th[0]) * (t / 0.45) : b.th[1] + (b.th[2] - b.th[1]) * ((t - 0.45) / 0.55))
  const top: string[] = []
  const bottom: string[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = x0 + (x1 - x0) * t
    const y = center(t)
    const h = thick(t)
    // the head is squared off slightly; the tail tapers to a point
    top.push(`${x.toFixed(1)},${(y - h * 0.55).toFixed(1)}`)
    bottom.unshift(`${x.toFixed(1)},${(y + h * 0.45).toFixed(1)}`)
  }
  const shape = `M${top.join(' L')} L${bottom.join(' L')} Z`
  const hairs = Array.from({ length: 72 }, (_, i) => {
    const t = (i + 0.5) / 72
    const x = x0 + (x1 - x0) * t
    const y = center(t) + thick(t) * 0.4
    const len = thick(t) * 1.15
    const ang = t < 0.18 ? -1.35 : -0.55 + t * 0.25
    return `M${x.toFixed(1)},${y.toFixed(1)} l${(Math.cos(ang) * len + 2.2).toFixed(1)},${(Math.sin(ang) * len).toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} viewBox="0 0 140 40" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`bskin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9cbbb" />
          <stop offset="1" stopColor="#d4ab96" />
        </linearGradient>
        <filter id={`bsoft-${uid}`} x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </defs>
      <rect width="140" height="40" fill={`url(#bskin-${uid})`} />
      {/* brow bone highlight + lid line below */}
      <ellipse cx="78" cy="31" rx="56" ry="6" fill="#f6e2d6" opacity="0.5" />
      <path d="M40 40 Q74 31 112 37" fill="none" stroke="#9c6f60" strokeOpacity="0.45" strokeWidth="1.1" />
      <path d={shape} fill={color} opacity="0.78" filter={`url(#bsoft-${uid})`} />
      <path d={hairs} fill="none" stroke={color} strokeWidth="1.15" strokeLinecap="round" opacity="0.95" />
      <path d={hairs} fill="none" stroke="#fff" strokeWidth="0.35" strokeLinecap="round" opacity="0.18" transform="translate(-0.5 -0.4)" />
      <path d={hairs} fill="none" stroke="#1d1418" strokeWidth="0.45" strokeLinecap="round" opacity="0.25" transform="translate(0.6 0.3)" />
    </svg>
  )
}
