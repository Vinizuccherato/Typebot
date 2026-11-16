import { useId } from 'react'
import type { BrowFormId, GlassesId } from '../../store'

/* Hand-built SVG illustrations (carried over from the Appearance studio): glasses frames and
   brows. Brows re-tint live with the chosen colour. */

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
