import { create } from 'zustand'

/* ──────────────────────────────────────────────────────────────
   Ring app state — the hero (active ring) and the "My Rings" sheet
   both read from here.
   ────────────────────────────────────────────────────────────── */

export type FinishId = 'titanium' | 'cloud' | 'petal' | 'tide'

export interface Ring {
  id: FinishId
  material: string // "Ceramic" | "Titanium"
  color: string // "Cloud"
  size: number // US ring size 6–13
  battery: number // %
}

export const SIZES = [6, 7, 8, 9, 10, 11, 12, 13]

export const batteryLabel = (b: number) => (b >= 60 ? 'Optimal' : b >= 30 ? 'Good' : b >= 15 ? 'Low' : 'Critical')

interface RingState {
  rings: Record<FinishId, Ring>
  order: FinishId[]
  /** The ring being worn (hero). */
  activeId: FinishId
  /** The ring shown in the "My Rings" sheet carousel. */
  selectedId: FinishId
  sheetOpen: boolean
  charging: boolean
  /** Increments on every activation so 3D/UI can play a flourish. */
  pulse: number
  toast: string | null

  select: (id: FinishId) => void
  step: (dir: 1 | -1) => void
  setSize: (id: FinishId, size: number) => void
  activate: (id: FinishId) => void
  setSheetOpen: (open: boolean) => void
  setCharging: (on: boolean) => void
  showToast: (msg: string) => void
  tick: () => void
}

let toastTimer = 0

export const useRings = create<RingState>()((set, get) => ({
  rings: {
    titanium: { id: 'titanium', material: 'Titanium', color: 'Silver', size: 8, battery: 74 },
    cloud: { id: 'cloud', material: 'Ceramic', color: 'Cloud', size: 8, battery: 19 },
    petal: { id: 'petal', material: 'Ceramic', color: 'Petal', size: 7, battery: 52 },
    tide: { id: 'tide', material: 'Ceramic', color: 'Tide', size: 9, battery: 88 },
  },
  order: ['cloud', 'petal', 'tide', 'titanium'],
  activeId: 'titanium',
  selectedId: 'cloud',
  sheetOpen: false,
  charging: false,
  pulse: 0,
  toast: null,

  select: (selectedId) => set({ selectedId }),
  step: (dir) => {
    const { order, selectedId } = get()
    const i = order.indexOf(selectedId)
    set({ selectedId: order[(i + dir + order.length) % order.length] })
  },
  setSize: (id, size) => set((s) => ({ rings: { ...s.rings, [id]: { ...s.rings[id], size } } })),
  activate: (id) => {
    if (get().activeId === id) return
    set((s) => ({ activeId: id, pulse: s.pulse + 1, charging: false }))
    const r = get().rings[id]
    get().showToast(`${r.material} ${r.color} is now active`)
  },
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  setCharging: (charging) => set({ charging }),
  showToast: (toast) => {
    window.clearTimeout(toastTimer)
    set({ toast })
    toastTimer = window.setTimeout(() => set({ toast: null }), 2600)
  },
  /** ~1s heartbeat: charging fills the active ring's battery. */
  tick: () => {
    const { charging, activeId, rings } = get()
    if (!charging) return
    const r = rings[activeId]
    if (r.battery >= 100) return set({ charging: false })
    set({ rings: { ...rings, [activeId]: { ...r, battery: Math.min(100, r.battery + 1) } } })
  },
}))
