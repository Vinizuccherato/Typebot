import { create } from 'zustand'

/* ──────────────────────────────────────────────────────────────
   Domus — single source of truth.
   The 3D scene and every panel read/write this store, so an action
   anywhere (panel, 3D hotspot, command palette, AI assistant)
   is reflected everywhere.
   ────────────────────────────────────────────────────────────── */

export type NavId = 'home' | 'scenes' | 'lighting' | 'climate' | 'energy' | 'security'

export type RoomId = 'main-hall' | 'kitchen' | 'master-suite' | 'studio' | 'terrace'

export interface Room {
  id: RoomId
  name: string
  code: string
  area: number // m²
  temperature: number // °C measured
  target: number // °C zonal set-point
  humidity: number // %
  occupants: number
  devices: number
}

export type NodeId = 'tv' | 'sonos' | 'cleanbot'

export interface NodeDevice {
  id: NodeId
  name: string
  model: string
  on: boolean
}

export type ClimateMode = 'auto' | 'cold' | 'warm' | 'eco'

/** Where the 3D camera is focused. */
export type FocusId = 'overview' | 'solar' | 'main-hall' | 'front-door'

export interface Toast {
  id: number
  title: string
  detail?: string
  tone?: 'default' | 'success' | 'warning'
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  /** Optional list of actions the assistant executed, rendered as chips. */
  actions?: string[]
}

export const TEMP_MIN = 16
export const TEMP_MAX = 30

/** 25 points, 00:00 → 24:00, kWh drawn per hour. Shaped like the reference step chart. */
export const ENERGY_SERIES: number[] = [
  0.32, 0.28, 0.26, 0.25, 0.27, 0.36, 0.78, 0.92, 0.64, 0.42, 0.38, 0.4, 0.71, 0.86, 0.58, 0.41, 0.39,
  0.52, 0.84, 0.97, 0.88, 0.6, 0.44, 0.36, 0.33,
]

interface DomusState {
  /* navigation & UI */
  nav: NavId
  focus: FocusId
  selectedRoom: RoomId
  paletteOpen: boolean
  assistantOpen: boolean
  toasts: Toast[]

  /* home model */
  rooms: Record<RoomId, Room>
  nodes: Record<NodeId, NodeDevice>
  door: { locked: boolean }
  eco: { active: boolean; savings: number }
  solar: { kw: number; peak: number }
  energy: { today: number; deltaVsYesterday: number; series: number[] }
  climate: { current: number; target: number; humidity: number; mode: ClimateMode }
  lamp: { on: boolean; intensity: number } // 0–100
  led: { on: boolean; color: string; x: number; y: number; brightness: number } // x,y ∈ [0,1] on the swatch; brightness 0–100
  speaker: { on: boolean; playing: boolean; volume: number; track: string; artist: string } // volume 0–100
  zonesSynced: number

  /* assistant */
  messages: ChatMessage[]
  thinking: boolean

  /* actions */
  setNav: (nav: NavId) => void
  setFocus: (focus: FocusId) => void
  selectRoom: (id: RoomId) => void
  setPaletteOpen: (open: boolean) => void
  setAssistantOpen: (open: boolean) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void

  setRoomTarget: (id: RoomId, target: number) => void
  nudgeRoomTarget: (id: RoomId, delta: number) => void
  toggleNode: (id: NodeId, on?: boolean) => void
  setDoorLocked: (locked: boolean) => void
  setEco: (active: boolean) => void
  setClimateTarget: (target: number) => void
  setClimateMode: (mode: ClimateMode) => void
  setLamp: (patch: Partial<DomusState['lamp']>) => void
  setLed: (patch: Partial<DomusState['led']>) => void
  setSpeaker: (patch: Partial<DomusState['speaker']>) => void

  pushMessage: (m: Omit<ChatMessage, 'id'>) => number
  patchMessage: (id: number, patch: Partial<ChatMessage>) => void
  setThinking: (thinking: boolean) => void

  /** Called by a global interval (~2.5s) to make telemetry feel live. */
  tick: () => void
}

let uid = 1
const nextId = () => uid++

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const round1 = (v: number) => Math.round(v * 10) / 10

export const useDomus = create<DomusState>()((set, get) => ({
  nav: 'home',
  focus: 'overview',
  selectedRoom: 'main-hall',
  paletteOpen: false,
  assistantOpen: false,
  toasts: [],

  rooms: {
    'main-hall': { id: 'main-hall', name: 'Main Hall', code: 'Room-01', area: 48, temperature: 22.5, target: 22.5, humidity: 48, occupants: 2, devices: 3 },
    kitchen: { id: 'kitchen', name: 'Kitchen', code: 'Room-02', area: 26, temperature: 21.8, target: 21.5, humidity: 44, occupants: 1, devices: 5 },
    'master-suite': { id: 'master-suite', name: 'Master Suite', code: 'Room-03', area: 34, temperature: 20.9, target: 21, humidity: 46, occupants: 0, devices: 4 },
    studio: { id: 'studio', name: 'Studio', code: 'Room-04', area: 18, temperature: 23.1, target: 22, humidity: 41, occupants: 0, devices: 2 },
    terrace: { id: 'terrace', name: 'Roof Terrace', code: 'Room-05', area: 62, temperature: 19.4, target: 19.4, humidity: 57, occupants: 0, devices: 2 },
  },

  nodes: {
    tv: { id: 'tv', name: 'Smart OLED', model: 'TV 65"', on: false },
    sonos: { id: 'sonos', name: 'Sonos Era', model: '300', on: true },
    cleanbot: { id: 'cleanbot', name: 'Aether', model: 'CleanBot V4', on: true },
  },

  door: { locked: true },
  eco: { active: true, savings: 34 },
  solar: { kw: 3.8, peak: 5.2 },
  energy: { today: 12.4, deltaVsYesterday: -18, series: ENERGY_SERIES },
  climate: { current: 16.1, target: 21.5, humidity: 51, mode: 'auto' },
  lamp: { on: true, intensity: 32 },
  led: { on: true, color: '#d8b25a', x: 0.92, y: 0.12, brightness: 86 },
  speaker: { on: true, playing: true, volume: 20, track: 'Weightless', artist: 'Marconi Union' },
  zonesSynced: 3,

  messages: [],
  thinking: false,

  setNav: (nav) => set({ nav }),
  setFocus: (focus) => set({ focus }),
  selectRoom: (id) => set({ selectedRoom: id }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setAssistantOpen: (assistantOpen) => set({ assistantOpen }),

  toast: (t) => {
    const id = nextId()
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
    window.setTimeout(() => get().dismissToast(id), 3600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setRoomTarget: (id, target) =>
    set((s) => ({ rooms: { ...s.rooms, [id]: { ...s.rooms[id], target: round1(clamp(target, TEMP_MIN, TEMP_MAX)) } } })),
  nudgeRoomTarget: (id, delta) => get().setRoomTarget(id, get().rooms[id].target + delta),

  toggleNode: (id, on) =>
    set((s) => ({ nodes: { ...s.nodes, [id]: { ...s.nodes[id], on: on ?? !s.nodes[id].on } } })),

  setDoorLocked: (locked) => set({ door: { locked } }),

  setEco: (active) => set((s) => ({ eco: { ...s.eco, active, savings: active ? 34 : 0 } })),

  setClimateTarget: (target) =>
    set((s) => ({ climate: { ...s.climate, target: round1(clamp(target, TEMP_MIN, TEMP_MAX)) } })),
  setClimateMode: (mode) => set((s) => ({ climate: { ...s.climate, mode } })),

  setLamp: (patch) => set((s) => ({ lamp: { ...s.lamp, ...patch, intensity: clamp(patch.intensity ?? s.lamp.intensity, 0, 100) } })),
  setLed: (patch) => set((s) => ({ led: { ...s.led, ...patch } })),
  setSpeaker: (patch) => set((s) => ({ speaker: { ...s.speaker, ...patch, volume: clamp(patch.volume ?? s.speaker.volume, 0, 100) } })),

  pushMessage: (m) => {
    const id = nextId()
    set((s) => ({ messages: [...s.messages, { ...m, id }] }))
    return id
  },
  patchMessage: (id, patch) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
  setThinking: (thinking) => set({ thinking }),

  tick: () =>
    set((s) => {
      const jitter = (amp: number) => (Math.random() - 0.5) * amp
      const solarKw = round1(clamp(s.solar.kw + jitter(0.3), 3.2, 4.4))
      // Rooms drift toward their set-point
      const rooms = { ...s.rooms }
      for (const id of Object.keys(rooms) as RoomId[]) {
        const r = rooms[id]
        const diff = r.target - r.temperature
        const step = Math.abs(diff) < 0.05 ? 0 : clamp(diff * 0.25, -0.3, 0.3)
        rooms[id] = { ...r, temperature: round1(r.temperature + step) }
      }
      // Outdoor-ish comfort reading drifts toward target when not eco
      const cDiff = s.climate.target - s.climate.current
      const climateCurrent = round1(s.climate.current + clamp(cDiff * 0.04, -0.1, 0.1))
      return {
        solar: { ...s.solar, kw: solarKw },
        energy: { ...s.energy, today: round1(s.energy.today + (s.eco.active ? 0.01 : 0.03)) },
        rooms,
        climate: { ...s.climate, current: climateCurrent },
      }
    }),
}))

/** Convenience selector for the currently selected room. */
export const useSelectedRoom = () => useDomus((s) => s.rooms[s.selectedRoom])
