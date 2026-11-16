import { create } from 'zustand'

/* ──────────────────────────────────────────────────────────────
   facet. — one store for the whole flow. Every screen reads and
   writes it, so the board (all six screens live side by side) and
   the prototype/phone mode stay in sync: answer the goals on screen 3,
   finish the scan on screen 4, and screens 5–6 reflect it.
   ────────────────────────────────────────────────────────────── */

export type ScreenId = 'splash' | 'onboarding' | 'goals' | 'scan' | 'results' | 'tryon'

export const SCREENS: { id: ScreenId; n: string; title: string; note: string }[] = [
  { id: 'splash', n: '01', title: 'Splash', note: 'Brand moment · ≤ 2.5 s' },
  { id: 'onboarding', n: '02', title: 'Onboarding', note: '3 value slides · privacy promise' },
  { id: 'goals', n: '03', title: 'Goals', note: 'One question per step · editable' },
  { id: 'scan', n: '04', title: 'Face scan', note: 'Priming · guide · live feedback' },
  { id: 'results', n: '05', title: 'Your analysis', note: 'Summary first · ratios · meaning' },
  { id: 'tryon', n: '06', title: 'Try-on', note: 'Recommendations · live preview' },
]

export type GoalId = 'hair' | 'brows' | 'eyewear' | 'makeup' | 'contour' | 'beard'
export type VibeId = 'natural' | 'classic' | 'bold' | 'editorial'

export const GOALS: { id: GoalId; label: string; hint: string }[] = [
  { id: 'hair', label: 'Haircut', hint: 'Length, part and volume' },
  { id: 'brows', label: 'Eyebrows', hint: 'Shape, arch and fill' },
  { id: 'eyewear', label: 'Eyewear', hint: 'Frames that fit' },
  { id: 'makeup', label: 'Makeup', hint: 'Contour and light' },
  { id: 'contour', label: 'Harmony', hint: 'Balance proportions' },
  { id: 'beard', label: 'Beard', hint: 'Line and density' },
]

export const VIBES: { id: VibeId; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'classic', label: 'Classic' },
  { id: 'bold', label: 'Bold' },
  { id: 'editorial', label: 'Editorial' },
]

export type FaceShape = 'Oval' | 'Round' | 'Square' | 'Heart' | 'Diamond' | 'Oblong'

/** Measured result (simulated scan of the procedural avatar). */
export interface Analysis {
  shape: FaceShape
  shapeConfidence: number // %
  harmony: number // 0–100
  thirds: [number, number, number] // % upper / middle / lower
  symmetry: number // %
  lengthToWidth: number // ratio
  eyeSpacing: number // ICD : eye width
  jawToCheek: number // ratio
  landmarks: number
}

/** Avatar face-form morph (0..1, 0.5 = neutral) — consumed by the 3D face model. */
export interface FaceForm {
  width: number
  eyes: number
  roundness: number
  lips: number
}

export type GlassesId = 'none' | 'round' | 'aviator' | 'wayfarer' | 'cateye' | 'browline' | 'rimless'
export type BrowFormId = 'straight' | 'soft-arch' | 'high-arch' | 'rounded' | 's-shaped' | 'bold-flat'
export type TryTab = 'eyewear' | 'brows' | 'hair'

export interface Look {
  glasses: GlassesId
  browForm: BrowFormId
  browColor: string
  eyeColor: string
  hairColor: string
  hairPart: 'centre' | 'side'
}

export const HAIR_COLORS = ['#3b2418', '#6b4128', '#9a6a43', '#c79b6c', '#1c1714']
export const BROW_COLORS = ['#5b3940', '#3b2418', '#8a6650', '#b39a8e', '#2b2220']
export const EYE_COLORS = ['#7d8b6a', '#8c7766', '#6f8fa6', '#9db1b6', '#5a4636']

/** How well each frame suits each face shape (0–100) — drives the "match" badges. */
export const FRAME_MATCH: Record<FaceShape, Partial<Record<GlassesId, number>>> = {
  Oval: { wayfarer: 96, aviator: 93, round: 88, browline: 90, cateye: 85, rimless: 82 },
  Round: { wayfarer: 95, browline: 92, cateye: 89, aviator: 80, rimless: 74, round: 58 },
  Square: { round: 96, aviator: 90, cateye: 86, rimless: 88, wayfarer: 70, browline: 72 },
  Heart: { aviator: 95, rimless: 92, round: 88, browline: 70, cateye: 66, wayfarer: 80 },
  Diamond: { cateye: 96, browline: 94, rimless: 88, round: 85, aviator: 80, wayfarer: 78 },
  Oblong: { wayfarer: 94, round: 90, browline: 86, aviator: 84, cateye: 80, rimless: 70 },
}

export interface Toast {
  id: number
  title: string
  detail?: string
}

interface FacetState {
  /** current screen in prototype / phone mode */
  screen: ScreenId
  direction: 1 | -1
  /** board highlight (CTA on a board screen pulses its target) */
  spotlight: ScreenId | null

  onboardingSlide: number
  goals: GoalId[]
  vibe: VibeId
  goalStep: 0 | 1

  scan: { phase: 'prime' | 'scanning' | 'done'; progress: number; source: 'camera' | 'photo' }
  analysis: Analysis

  tryTab: TryTab
  look: Look
  savedLooks: Look[]
  comparing: boolean
  toasts: Toast[]

  go: (id: ScreenId) => void
  next: () => void
  back: () => void
  setSpotlight: (id: ScreenId | null) => void
  setSlide: (i: number) => void
  toggleGoal: (g: GoalId) => void
  setVibe: (v: VibeId) => void
  setGoalStep: (s: 0 | 1) => void
  startScan: (source?: 'camera' | 'photo') => void
  /** called by the scan screen's loop (dt in seconds) */
  advanceScan: (dt: number) => void
  resetScan: () => void
  setTryTab: (t: TryTab) => void
  setLook: (patch: Partial<Look>) => void
  saveLook: () => void
  setComparing: (c: boolean) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

const ORDER = SCREENS.map((s) => s.id)
let uid = 1

const ANALYSIS: Analysis = {
  shape: 'Oval',
  shapeConfidence: 92,
  harmony: 86,
  thirds: [32, 34, 34],
  symmetry: 95,
  lengthToWidth: 1.33,
  eyeSpacing: 1.04,
  jawToCheek: 0.83,
  landmarks: 468,
}

export const useFacet = create<FacetState>()((set, get) => ({
  screen: 'splash',
  direction: 1,
  spotlight: null,

  onboardingSlide: 0,
  goals: ['brows', 'eyewear'],
  vibe: 'natural',
  goalStep: 0,

  scan: { phase: 'prime', progress: 0, source: 'camera' },
  analysis: ANALYSIS,

  tryTab: 'eyewear',
  look: { glasses: 'wayfarer', browForm: 'soft-arch', browColor: BROW_COLORS[0], eyeColor: EYE_COLORS[3], hairColor: HAIR_COLORS[1], hairPart: 'centre' },
  savedLooks: [],
  comparing: false,
  toasts: [],

  go: (id) => set((s) => ({ screen: id, direction: ORDER.indexOf(id) >= ORDER.indexOf(s.screen) ? 1 : -1 })),
  next: () => {
    const i = ORDER.indexOf(get().screen)
    if (i < ORDER.length - 1) set({ screen: ORDER[i + 1], direction: 1 })
  },
  back: () => {
    const i = ORDER.indexOf(get().screen)
    if (i > 0) set({ screen: ORDER[i - 1], direction: -1 })
  },
  setSpotlight: (spotlight) => set({ spotlight }),
  setSlide: (onboardingSlide) => set({ onboardingSlide }),
  toggleGoal: (g) => set((s) => ({ goals: s.goals.includes(g) ? s.goals.filter((x) => x !== g) : [...s.goals, g] })),
  setVibe: (vibe) => set({ vibe }),
  setGoalStep: (goalStep) => set({ goalStep }),
  startScan: (source = 'camera') => set({ scan: { phase: 'scanning', progress: 0, source } }),
  advanceScan: (dt) => {
    const { scan } = get()
    if (scan.phase !== 'scanning') return
    // fast to ~70 %, then a careful finish (landmark refinement)
    const rate = scan.progress < 70 ? 26 : 9
    const progress = Math.min(100, scan.progress + rate * dt)
    set({ scan: { ...scan, progress, phase: progress >= 100 ? 'done' : 'scanning' } })
    if (progress >= 100) get().toast({ title: 'Scan complete', detail: '468 landmarks · processed on device' })
  },
  resetScan: () => set({ scan: { phase: 'prime', progress: 0, source: 'camera' } }),
  setTryTab: (tryTab) => set({ tryTab }),
  setLook: (patch) => set((s) => ({ look: { ...s.look, ...patch } })),
  saveLook: () => {
    set((s) => ({ savedLooks: [...s.savedLooks, s.look] }))
    get().toast({ title: 'Look saved', detail: 'Find it in your looks' })
  },
  setComparing: (comparing) => set({ comparing }),
  toast: (t) => {
    const id = uid++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
