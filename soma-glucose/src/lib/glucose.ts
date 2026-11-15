/* ──────────────────────────────────────────────────────────────
   Physiologically plausible CGM day: 288 readings (every 5 min).
   Fasting baseline, dawn rise, three meal excursions with insulin-like
   decay, an activity dip, sensor noise. Deterministic per seed.
   ────────────────────────────────────────────────────────────── */

export const SLOTS = 288 // 24 h × 12
export const SLOT_MIN = 5
export const RANGE_LOW = 70
export const RANGE_HIGH = 140

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

export interface DayProfile {
  baseline: number
  meals: { at: number; peak: number }[] // at = hour
  activity?: { at: number; depth: number }
}

const excursion = (tHours: number, at: number, peak: number) => {
  const dt = tHours - at
  if (dt < 0) return 0
  // rise ~35–45 min, decay over ~2.5 h (gamma-like)
  const k = 1.6
  return peak * Math.pow(dt * k, 2) * Math.exp(2 - dt * k * 2) * 0.55
}

export function generateDay(profile: DayProfile, seed: number): number[] {
  const r = rng(seed)
  const out: number[] = []
  let drift = 0
  for (let i = 0; i < SLOTS; i++) {
    const t = (i * SLOT_MIN) / 60
    let g = profile.baseline
    g += 9 * Math.exp(-Math.pow((t - 6) / 1.4, 2)) // dawn phenomenon
    for (const m of profile.meals) g += excursion(t, m.at, m.peak)
    if (profile.activity) g -= profile.activity.depth * Math.exp(-Math.pow((t - profile.activity.at) / 0.6, 2))
    drift = drift * 0.92 + (r() - 0.5) * 3
    g += drift + (r() - 0.5) * 2.4
    out.push(Math.round(g))
  }
  return out
}

export interface GlucoseStats {
  current: number
  avg: number
  min: number
  max: number
  /** % of readings inside [RANGE_LOW, RANGE_HIGH] */
  timeInRange: number
  /** coefficient of variation % (lower = steadier) */
  cv: number
  /** 0–100 */
  stability: number
  trend: 'rising' | 'falling' | 'steady'
}

export function stats(series: number[], upTo: number): GlucoseStats {
  const s = series.slice(0, Math.max(2, upTo + 1))
  const n = s.length
  const avg = s.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(s.reduce((a, b) => a + (b - avg) ** 2, 0) / n)
  const inRange = s.filter((v) => v >= RANGE_LOW && v <= RANGE_HIGH).length
  const cv = (sd / avg) * 100
  const last = s[n - 1]
  const prev = s[Math.max(0, n - 4)]
  return {
    current: last,
    avg: Math.round(avg),
    min: Math.min(...s),
    max: Math.max(...s),
    timeInRange: Math.round((inRange / n) * 100),
    cv: Math.round(cv * 10) / 10,
    stability: Math.max(0, Math.min(100, Math.round(100 - cv * 2.2))),
    trend: last - prev > 4 ? 'rising' : last - prev < -4 ? 'falling' : 'steady',
  }
}

export const slotLabel = (i: number) => {
  const m = i * SLOT_MIN
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
