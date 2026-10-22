import { create } from 'zustand'
import { useDomus } from '../../store'

/** Local UI state for the command palette (scope filter). */
export type PaletteScope = 'all' | 'rooms' | 'scenes' | 'devices' | 'navigate'

export const PALETTE_SCOPES: { id: PaletteScope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'scenes', label: 'Scenes' },
  { id: 'devices', label: 'Devices' },
  { id: 'navigate', label: 'Navigate' },
]

interface PaletteScopeState {
  scope: PaletteScope
  setScope: (scope: PaletteScope) => void
}

export const usePaletteScope = create<PaletteScopeState>()((set) => ({
  scope: 'all',
  setScope: (scope) => set({ scope }),
}))

export function openPalette(scope: PaletteScope = 'all') {
  usePaletteScope.getState().setScope(scope)
  useDomus.getState().setPaletteOpen(true)
}
