import { create } from 'zustand'
import type { FeatureId } from './lib/face'

/* ──────────────────────────────────────────────────────────────
   Facial telemetry — single source of truth for the 3D head, the
   visagism layer and every card. Vitals stream in via tick().
   ────────────────────────────────────────────────────────────── */

export type TabId = 'overview' | 'biometrics' | 'topology' | 'symmetry'
export type ToolId = 'inspect' | 'rotate' | 'measure' | 'layers'
export type ScanMode = 'thermal' | 'depth' | 'mesh'
export type Palette = 'mint' | 'amber' | 'ice'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'biometrics', label: 'Biometrics' },
  { id: 'topology', label: 'Topology' },
  { id: 'symmetry', label: 'Facial Symmetry' },
]

export interface Overlays {
  /** facial thirds (trichion–glabella–subnasale–menton) */
  thirds: boolean
  /** rule of fifths (eye widths across the face) */
  fifths: boolean
  /** golden-ratio construction lines */
  golden: boolean
  /** vertical symmetry axis + mirrored deltas */
  symmetry: boolean
  /** landmark dots for all features */
  landmarks: boolean
}

export interface Toast {
  id: number
  title: string
  detail?: string
  tone?: 'default' | 'success' | 'warning'
}

interface FaceState {
  /* view */
  tab: TabId
  tool: ToolId
  /** feature the user clicked (opens the inspector + measurement overlay) */
  selected: FeatureId | null
  hovered: FeatureId | null
  overlays: Overlays
  /** bump to ask the camera to reset / zoom (scene listens) */
  view: { resetNonce: number; zoomNonce: number; zoomDir: 1 | -1 }
  autoRotate: boolean

  /* scan */
  scan: { progress: number; running: boolean; mode: ScanMode; palette: Palette; pulseWindow: 10 | 20 | 30 }

  /* vitals (live) */
  vitals: {
    heartRate: number
    respiratory: number
    hrv: number // ms
    stress: number // 0–100 (tension %)
    recovery: number // %
    hemodynamic: number // ms
    gfi: number // general fitness index %
    cognitive: 'Optimal' | 'Focused' | 'Fatigued'
    /** rPPG waveform samples (most recent last), ~0..1 */
    rppg: number[]
  }

  /* timeline */
  timeline: { position: number; duration: number; playing: boolean; speed: 0.5 | 1 | 2 }

  toasts: Toast[]

  setTab: (t: TabId) => void
  setTool: (t: ToolId) => void
  select: (f: FeatureId | null) => void
  hover: (f: FeatureId | null) => void
  toggleOverlay: (k: keyof Overlays, on?: boolean) => void
  resetView: () => void
  zoom: (dir: 1 | -1) => void
  setAutoRotate: (on: boolean) => void
  setScan: (patch: Partial<FaceState['scan']>) => void
  rescan: () => void
  setTimeline: (patch: Partial<FaceState['timeline']>) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  /** ~10 Hz: advances scan, vitals, rPPG waveform and the timeline playhead */
  tick: (dt: number) => void
}

let uid = 1
let phase = 0

const TAB_OVERLAYS: Record<TabId, Overlays> = {
  overview: { thirds: false, fifths: false, golden: false, symmetry: false, landmarks: false },
  biometrics: { thirds: false, fifths: false, golden: false, symmetry: false, landmarks: true },
  topology: { thirds: true, fifths: true, golden: false, symmetry: false, landmarks: true },
  symmetry: { thirds: false, fifths: false, golden: true, symmetry: true, landmarks: true },
}

export const useFace = create<FaceState>()((set, get) => ({
  tab: 'overview',
  tool: 'inspect',
  selected: null,
  hovered: null,
  overlays: TAB_OVERLAYS.overview,
  view: { resetNonce: 0, zoomNonce: 0, zoomDir: 1 },
  autoRotate: false,

  scan: { progress: 0, running: true, mode: 'thermal', palette: 'mint', pulseWindow: 20 },

  vitals: {
    heartRate: 58,
    respiratory: 16,
    hrv: 85.4,
    stress: 14,
    recovery: 98,
    hemodynamic: 64,
    gfi: 80,
    cognitive: 'Optimal',
    rppg: Array.from({ length: 120 }, (_, i) => 0.5 + 0.35 * Math.sin(i / 3.2) * Math.exp(-((i % 19) / 9))),
  },

  timeline: { position: 12 * 3600 + 12 * 60 + 43, duration: 13 * 3600 + 13 * 60 + 5, playing: true, speed: 1 },

  toasts: [],

  setTab: (tab) => set({ tab, overlays: TAB_OVERLAYS[tab] }),
  setTool: (tool) => set({ tool }),
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  toggleOverlay: (k, on) => set((s) => ({ overlays: { ...s.overlays, [k]: on ?? !s.overlays[k] } })),
  resetView: () => set((s) => ({ view: { ...s.view, resetNonce: s.view.resetNonce + 1 }, selected: null })),
  zoom: (zoomDir) => set((s) => ({ view: { ...s.view, zoomNonce: s.view.zoomNonce + 1, zoomDir } })),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  setScan: (patch) => set((s) => ({ scan: { ...s.scan, ...patch } })),
  rescan: () => set((s) => ({ scan: { ...s.scan, progress: 0, running: true } })),
  setTimeline: (patch) => set((s) => ({ timeline: { ...s.timeline, ...patch } })),

  toast: (t) => {
    const id = uid++
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  tick: (dt) => {
    const s = get()
    phase += dt
    const patch: Partial<FaceState> = {}

    // scan: 0 → 72% quickly, then slow to 100% (the reference freezes at 72%)
    if (s.scan.running) {
      const p = s.scan.progress
      const rate = p < 72 ? 28 : 3.2
      const next = Math.min(100, p + rate * dt)
      patch.scan = { ...s.scan, progress: next, running: next < 100 }
      if (p < 100 && next >= 100) window.setTimeout(() => get().toast({ title: 'Scan complete', detail: '468 landmarks · 0.4 mm accuracy', tone: 'success' }), 0)
    }

    // vitals: slow physiological drift
    const hr = 58 + Math.sin(phase / 9) * 2.2 + Math.sin(phase / 2.7) * 0.6
    const resp = 16 + Math.sin(phase / 13) * 0.8
    // rPPG: cardiac pulse shape at the current heart rate (systolic peak + dicrotic notch)
    const beat = (phase * hr) / 60
    const f = beat - Math.floor(beat)
    const pulse = Math.exp(-Math.pow((f - 0.18) / 0.07, 2)) + 0.38 * Math.exp(-Math.pow((f - 0.46) / 0.09, 2))
    const breath = 0.08 * Math.sin((phase * resp * Math.PI * 2) / 60)
    const sample = 0.22 + pulse * 0.6 + breath
    patch.vitals = {
      ...s.vitals,
      heartRate: Math.round(hr),
      respiratory: Math.round(resp),
      hrv: Math.round((85.4 + Math.sin(phase / 11) * 3.1) * 10) / 10,
      stress: Math.round(14 + Math.sin(phase / 17) * 3),
      hemodynamic: Math.round(64 + Math.sin(phase / 7) * 6),
      rppg: [...s.vitals.rppg.slice(1), sample],
    }

    if (s.timeline.playing) {
      const pos = s.timeline.position + dt * s.timeline.speed
      patch.timeline = { ...s.timeline, position: pos >= s.timeline.duration ? 0 : pos }
    }
    set(patch)
  },
}))
