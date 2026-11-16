import { create } from 'zustand'

/* ──────────────────────────────────────────────────────────────
   Appearance studio — the avatar's parameters are the single source
   of truth: every panel writes them, the 3D avatar renders them live.
   Edits are undoable; Save commits a snapshot.
   ────────────────────────────────────────────────────────────── */

export type NavId = 'head' | 'body' | 'outfit'
export type RegionId = 'face' | 'eyes' | 'brows' | 'accessories'

export type GlassesId = 'none' | 'round' | 'aviator' | 'wayfarer' | 'cateye' | 'browline' | 'rimless'
export type EyeFormId = 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned'
export type BrowFormId = 'straight' | 'soft-arch' | 'high-arch' | 'rounded' | 's-shaped' | 'bold-flat'

/** The four "Face Form" sliders (0..1, 0.5 = neutral). */
export interface FaceForm {
  width: number // face width / cheek breadth
  eyes: number // eye size
  roundness: number // jaw & chin roundness (0 = angular, 1 = soft)
  lips: number // lip fullness
}

export interface Look {
  face: FaceForm
  glasses: GlassesId
  eyeForm: EyeFormId
  eyeColor: string
  browForm: BrowFormId
  browColor: string
  /** MIN–MAX slider: intensity of the active region (eyes = openness, brows = thickness, face = sculpt depth, accessories = frame weight) */
  strength: Record<RegionId, number>
  shirt: string
}

export const EYE_COLORS = [
  { id: 'olive', label: 'Olive', hex: '#8b8b57' },
  { id: 'grey', label: 'Grey', hex: '#b5b2bb' },
  { id: 'sea', label: 'Sea grey', hex: '#9db1b6' },
  { id: 'mauve', label: 'Mauve', hex: '#8c7b8b' },
  { id: 'lavender', label: 'Lavender', hex: '#a4a2c9' },
] as const

export const BROW_COLORS = [
  { id: 'ash', label: 'Ash', hex: '#a3a5c5' },
  { id: 'espresso', label: 'Espresso', hex: '#5b3940' },
  { id: 'taupe', label: 'Taupe', hex: '#b39a8e' },
  { id: 'smoke', label: 'Smoke', hex: '#887f87' },
  { id: 'slate', label: 'Slate', hex: '#6f88a8' },
] as const

export const GLASSES: { id: GlassesId; label: string }[] = [
  { id: 'round', label: 'Round tortoise' },
  { id: 'aviator', label: 'Aviator' },
  { id: 'wayfarer', label: 'Wayfarer' },
  { id: 'cateye', label: 'Cat-eye' },
  { id: 'browline', label: 'Browline' },
  { id: 'rimless', label: 'Rimless' },
]

export const EYE_FORMS: { id: EyeFormId; label: string }[] = [
  { id: 'almond', label: 'Almond' },
  { id: 'round', label: 'Round' },
  { id: 'hooded', label: 'Hooded' },
  { id: 'monolid', label: 'Monolid' },
  { id: 'upturned', label: 'Upturned' },
  { id: 'downturned', label: 'Downturned' },
]

export const BROW_FORMS: { id: BrowFormId; label: string }[] = [
  { id: 'straight', label: 'Straight' },
  { id: 'soft-arch', label: 'Soft arch' },
  { id: 'high-arch', label: 'High arch' },
  { id: 'rounded', label: 'Rounded' },
  { id: 's-shaped', label: 'S-shaped' },
  { id: 'bold-flat', label: 'Bold flat' },
]

export const SHIRT_COLORS = ['#f4f2ee', '#2b2f3a', '#c8b8a6', '#9fb3c8', '#d9a7a0']

const DEFAULT_LOOK: Look = {
  face: { width: 0.5, eyes: 0.55, roundness: 0.6, lips: 0.5 },
  glasses: 'none',
  eyeForm: 'round',
  eyeColor: EYE_COLORS[2].hex,
  browForm: 'soft-arch',
  browColor: BROW_COLORS[2].hex,
  strength: { face: 0.5, eyes: 0.6, brows: 0.6, accessories: 0.5 },
  shirt: SHIRT_COLORS[0],
}

export interface Toast {
  id: number
  title: string
  detail?: string
}

interface StudioState {
  nav: NavId
  region: RegionId
  hovered: RegionId | null
  look: Look
  /** last saved look (Save button enables when look differs) */
  saved: Look
  /** hold-to-compare: render `saved` instead of `look` */
  comparing: boolean
  zoom: 1 | 1.25 | 1.5
  /** bump to ask the camera to recentre */
  resetNonce: number
  past: Look[]
  future: Look[]
  toasts: Toast[]

  setNav: (n: NavId) => void
  setRegion: (r: RegionId) => void
  hover: (r: RegionId | null) => void
  /** apply a change; `commit=false` while dragging (no history entry), then commit on release */
  edit: (patch: Partial<Look> | ((l: Look) => Partial<Look>), commit?: boolean) => void
  /** push the pre-drag look onto history when a continuous gesture ends */
  commitGesture: (before: Look) => void
  undo: () => void
  redo: () => void
  reset: () => void
  save: () => void
  setComparing: (c: boolean) => void
  setZoom: (z: StudioState['zoom']) => void
  recenter: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

let uid = 1
const same = (a: Look, b: Look) => JSON.stringify(a) === JSON.stringify(b)

export const useStudio = create<StudioState>()((set, get) => ({
  nav: 'head',
  region: 'eyes',
  hovered: null,
  look: DEFAULT_LOOK,
  saved: DEFAULT_LOOK,
  comparing: false,
  zoom: 1,
  resetNonce: 0,
  past: [],
  future: [],
  toasts: [],

  setNav: (nav) => set({ nav }),
  setRegion: (region) => set({ region }),
  hover: (hovered) => set({ hovered }),
  edit: (patch, commit = true) =>
    set((s) => {
      const p = typeof patch === 'function' ? patch(s.look) : patch
      const look = { ...s.look, ...p }
      if (same(look, s.look)) return {}
      return commit ? { look, past: [...s.past.slice(-49), s.look], future: [] } : { look }
    }),
  commitGesture: (before) =>
    set((s) => (same(before, s.look) ? {} : { past: [...s.past.slice(-49), before], future: [] })),
  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1]
      return prev ? { look: prev, past: s.past.slice(0, -1), future: [s.look, ...s.future] } : {}
    }),
  redo: () =>
    set((s) => {
      const next = s.future[0]
      return next ? { look: next, past: [...s.past, s.look], future: s.future.slice(1) } : {}
    }),
  reset: () => get().edit(DEFAULT_LOOK),
  save: () => {
    set((s) => ({ saved: s.look }))
    get().toast({ title: 'Appearance saved', detail: 'Your avatar is up to date everywhere' })
  },
  setComparing: (comparing) => set({ comparing }),
  setZoom: (zoom) => set({ zoom }),
  recenter: () => set((s) => ({ resetNonce: s.resetNonce + 1 })),
  toast: (t) => {
    const id = uid++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** The look the avatar should render right now (compare shows the last saved one). */
export const useRenderedLook = () => useStudio((s) => (s.comparing ? s.saved : s.look))
export const isDirty = (s: StudioState) => !same(s.look, s.saved)
