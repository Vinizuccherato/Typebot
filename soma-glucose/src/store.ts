import { create } from 'zustand'
import { generateDay, stats, SLOTS, SLOT_MIN, type DayProfile, type GlucoseStats } from './lib/glucose'

/* ──────────────────────────────────────────────────────────────
   Soma — single source of truth. The 3D figure, the radial metric
   menu and every card read from here; a live CGM reading arrives
   every few seconds (tick) and flows through all of them.
   ────────────────────────────────────────────────────────────── */

export type TabId = 'overview' | 'activity' | 'recovery' | 'progress'
export type MetricId = 'hemoglobin' | 'ketones' | 'glucose' | 'cholesterol'
export type CardId = 'glucose' | 'score' | 'cholesterol' | 'metabolic' | null

export interface Metric {
  id: MetricId
  name: string
  unit: string
  value: number
  decimals: number
  status: string
  /** normal band for the gauge/chart */
  low: number
  high: number
  /** 24-point hourly series for the card chart */
  series: number[]
}

export interface Toast {
  id: number
  title: string
  detail?: string
  tone?: 'default' | 'success' | 'warning'
}

export const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'progress', label: 'Progress' },
]

/* Each tab is a different lens on the day — its own profile, so every card animates to new values. */
const PROFILES: Record<TabId, DayProfile> = {
  overview: { baseline: 92, meals: [{ at: 8, peak: 62 }, { at: 13, peak: 74 }, { at: 19.5, peak: 68 }], activity: { at: 17, depth: 14 } },
  activity: { baseline: 88, meals: [{ at: 7.5, peak: 48 }, { at: 12.5, peak: 58 }, { at: 19, peak: 52 }], activity: { at: 10, depth: 26 } },
  recovery: { baseline: 96, meals: [{ at: 9, peak: 70 }, { at: 14, peak: 82 }, { at: 20, peak: 76 }] },
  progress: { baseline: 90, meals: [{ at: 8, peak: 54 }, { at: 13, peak: 60 }, { at: 19, peak: 58 }], activity: { at: 18, depth: 18 } },
}

const dateSeed = (iso: string) => iso.split('-').reduce((a, b) => a * 31 + Number(b), 7)

const nowSlot = () => {
  const d = new Date()
  return Math.min(SLOTS - 1, Math.floor((d.getHours() * 60 + d.getMinutes()) / SLOT_MIN))
}

const hourly = (series: number[]) => Array.from({ length: 24 }, (_, h) => series[h * 12 + 6])

const buildMetrics = (series: number[], upTo: number, seed: number): Record<MetricId, Metric> => {
  const g = series[upTo]
  const w = (n: number) => ((seed * (n + 3)) % 97) / 97 // stable per-day wobble 0..1
  return {
    glucose: { id: 'glucose', name: 'Glucose', unit: 'mg/dl', value: g, decimals: 0, status: g < 70 ? 'Below range' : g > 140 ? 'Above range' : 'In normal range', low: 70, high: 140, series: hourly(series) },
    hemoglobin: { id: 'hemoglobin', name: 'Hemoglobin A1c', unit: '%', value: Math.round((5.1 + w(1) * 0.6) * 10) / 10, decimals: 1, status: 'Healthy', low: 4, high: 5.7, series: Array.from({ length: 24 }, (_, i) => 5.2 + Math.sin(i / 4) * 0.08 + w(i) * 0.05) },
    ketones: { id: 'ketones', name: 'Ketones', unit: 'mmol/L', value: Math.round((0.2 + w(2) * 0.5) * 10) / 10, decimals: 1, status: 'Light ketosis', low: 0, high: 0.6, series: Array.from({ length: 24 }, (_, i) => 0.25 + Math.max(0, Math.sin((i - 4) / 3.5)) * 0.35) },
    cholesterol: { id: 'cholesterol', name: 'Cholesterol', unit: 'mg/dl', value: Math.round(168 + w(3) * 24), decimals: 0, status: 'Desirable', low: 125, high: 200, series: Array.from({ length: 24 }, (_, i) => 172 + Math.sin(i / 3) * 6 + w(i) * 4) },
  }
}

interface SomaState {
  tab: TabId
  date: string // ISO yyyy-mm-dd
  metric: MetricId
  expanded: CardId
  toasts: Toast[]

  /** today's CGM trace and the index of the latest reading */
  series: number[]
  now: number
  stats: GlucoseStats
  metrics: Record<MetricId, Metric>

  /** composite 0–100 and its parts (Score Calculation card) */
  score: { total: number; parts: { id: string; label: string; value: number; max: number }[] }
  sensor: { expiresInDays: number; lifeDays: number; signal: 'connected' | 'searching' | 'off'; battery: number }
  macros: { kcal: number; target: number; carbs: number; protein: number; fat: number }
  cholesterol: { daysLogged: number; ofDays: number; total: number; hdl: number; ldl: number }
  goals: { streakDays: number; weightKg: number; targetWeightKg: number }

  setTab: (t: TabId) => void
  setDate: (iso: string) => void
  setMetric: (m: MetricId) => void
  setExpanded: (c: CardId) => void
  setSignal: (s: SomaState['sensor']['signal']) => void
  logMeal: (kcal: number, carbs: number) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  /** live CGM: append/advance one reading (called every ~4 s) */
  tick: () => void
}

let uid = 1

const derive = (series: number[], now: number, seed: number, tab: TabId) => {
  const st = stats(series, now)
  const parts = [
    { id: 'tir', label: 'Time in range', value: Math.round(st.timeInRange * 0.35), max: 35 },
    { id: 'stability', label: 'Stability', value: Math.round(st.stability * 0.3), max: 30 },
    { id: 'recovery', label: 'Recovery', value: tab === 'recovery' ? 13 : 16, max: 20 },
    { id: 'activity', label: 'Activity', value: tab === 'activity' ? 15 : 11, max: 15 },
  ]
  return {
    stats: st,
    metrics: buildMetrics(series, now, seed),
    score: { total: Math.min(100, parts.reduce((a, p) => a + p.value, 0)), parts },
  }
}

const today = () => new Date().toISOString().slice(0, 10)

const init = (() => {
  const date = today()
  const seed = dateSeed(date)
  const series = generateDay(PROFILES.overview, seed)
  const now = nowSlot()
  return { date, seed, series, now, ...derive(series, now, seed, 'overview') }
})()

export const useSoma = create<SomaState>()((set, get) => ({
  tab: 'overview',
  date: init.date,
  metric: 'glucose',
  expanded: null,
  toasts: [],

  series: init.series,
  now: init.now,
  stats: init.stats,
  metrics: init.metrics,
  score: init.score,
  sensor: { expiresInDays: 11, lifeDays: 14, signal: 'connected', battery: 82 },
  macros: { kcal: 2762, target: 2900, carbs: 286, protein: 164, fat: 98 },
  cholesterol: { daysLogged: 23, ofDays: 26, total: init.metrics.cholesterol.value, hdl: 58, ldl: 96 },
  goals: { streakDays: 7, weightKg: 64.8, targetWeightKg: 62 },

  setTab: (tab) => {
    const { date } = get()
    const seed = dateSeed(date) + TABS.findIndex((t) => t.id === tab) * 101
    const series = generateDay(PROFILES[tab], seed)
    const now = get().now
    set({ tab, series, ...derive(series, now, seed, tab) })
  },
  setDate: (date) => {
    const { tab } = get()
    const seed = dateSeed(date) + TABS.findIndex((t) => t.id === tab) * 101
    const series = generateDay(PROFILES[tab], seed)
    const isToday = date === today()
    const now = isToday ? nowSlot() : SLOTS - 1
    set({ date, series, now, ...derive(series, now, seed, tab) })
  },
  setMetric: (metric) => set({ metric }),
  setExpanded: (expanded) => set({ expanded }),
  setSignal: (signal) => set((s) => ({ sensor: { ...s.sensor, signal } })),
  logMeal: (kcal, carbs) => set((s) => ({ macros: { ...s.macros, kcal: s.macros.kcal + kcal, carbs: s.macros.carbs + carbs } })),

  toast: (t) => {
    const id = uid++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  tick: () => {
    const s = get()
    if (s.sensor.signal !== 'connected' || s.date !== today()) return
    // live reading: nudge the latest value toward the modelled curve with a little noise
    const series = s.series.slice()
    const i = s.now
    const target = series[Math.min(SLOTS - 1, i + 1)] ?? series[i]
    series[i] = Math.round(series[i] + (target - series[i]) * 0.5 + (Math.random() - 0.5) * 3)
    const seed = dateSeed(s.date) + TABS.findIndex((t) => t.id === s.tab) * 101
    const next = derive(series, i, seed, s.tab)
    const prev = s.stats.current
    set({ series, ...next })
    const v = next.stats.current
    if (prev <= 140 && v > 140) get().toast({ title: 'Glucose above range', detail: `${v} mg/dl · consider a short walk`, tone: 'warning' })
    if (prev >= 70 && v < 70) get().toast({ title: 'Glucose below range', detail: `${v} mg/dl · have 15 g of carbs`, tone: 'warning' })
  },
}))
