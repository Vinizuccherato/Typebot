import { createContext, useContext } from 'react'
import type { ScreenId } from '../store'

export interface ScreenCtx {
  id: ScreenId
  /** board = all six screens live side by side; app = one screen at a time (prototype / phone) */
  mode: 'board' | 'app'
  /** true when this screen is the one on display (always true on the board) */
  active: boolean
  /** device chrome: the board and prototype draw a status bar; a real phone already has one */
  chrome: boolean
  /** navigate: in app mode switches screens; on the board spotlights the target screen */
  go: (id: ScreenId) => void
}

export const ScreenContext = createContext<ScreenCtx>({ id: 'splash', mode: 'app', active: true, chrome: false, go: () => {} })
export const useScreen = () => useContext(ScreenContext)
