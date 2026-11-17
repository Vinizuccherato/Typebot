import { createContext, useContext } from 'react'
import type { ScreenId } from '../store'

export interface ScreenCtx {
  id: ScreenId
  /** board = all screens live; app = one at a time (prototype/phone); web = desktop web app */
  mode: 'board' | 'app' | 'web'
  /** true when this screen is the one on display (always true on the board) */
  active: boolean
  /** draw iPhone status bar + home indicator (board/prototype) */
  chrome: boolean
  /** navigate: switches screens in app/web; spotlights the target on the board */
  go: (id: ScreenId) => void
}

export const ScreenContext = createContext<ScreenCtx>({ id: 'welcome', mode: 'app', active: true, chrome: false, go: () => {} })
export const useScreen = () => useContext(ScreenContext)
