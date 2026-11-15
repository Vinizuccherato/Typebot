import { useEffect } from 'react'
import { useRings } from './store'
import { useScreen, SCREEN_W, HERO_H } from './lib/useScreen'
import { Backdrop, Hero } from './app/Hero'
import { RingsSheet } from './app/RingsSheet'
import { Toast } from './app/Toast'
import { UiScale } from './lib/uiScale'

/* Phones: `zoom` lays the 390pt column out at device size, so Safari/Chrome rasterise
   text, glass and canvases at full resolution. A transform would be rasterised at 1×
   and stretched — the soft, blurry look on iOS. */
const ZOOM = typeof CSS !== 'undefined' && CSS.supports('zoom', '1.5')

export default function App() {
  const screen = useScreen()
  const tick = useRings((s) => s.tick)
  const setSheetOpen = useRings((s) => s.setSheetOpen)

  useEffect(() => {
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [tick])

  // the desktop panel has room to show every ring
  useEffect(() => setSheetOpen(screen.mode === 'desktop'), [screen.mode, setSheetOpen])

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--sky-b)]">
      <Backdrop />
      {screen.mode === 'mobile' ? (
        <div
          className="absolute inset-x-0 top-0 mx-auto"
          style={
            ZOOM
              ? { width: SCREEN_W, height: screen.height, zoom: screen.scale }
              : { width: SCREEN_W, height: screen.height, left: '50%', right: 'auto', transformOrigin: 'top', transform: `translateX(-50%) scale(${screen.scale})` }
          }
        >
          <UiScale.Provider value={screen.scale}>
            <Hero />
            <RingsSheet />
            <Toast />
          </UiScale.Provider>
        </div>
      ) : (
        <>
          {/* hero: ring + battery gauge */}
          <div
            className="absolute top-1/2 origin-center"
            style={{ left: '36%', width: SCREEN_W, height: HERO_H, transform: `translate(-50%, -50%) scale(${screen.heroScale})` }}
          >
            <UiScale.Provider value={screen.heroScale}>
              <Hero />
            </UiScale.Provider>
          </div>
          {/* My Rings panel */}
          <div
            className="absolute top-1/2 origin-center"
            style={{ left: '76%', width: SCREEN_W - 36, transform: `translate(-50%, -50%) scale(${screen.panelScale})` }}
          >
            <UiScale.Provider value={screen.panelScale}>
              <RingsSheet placement="panel" />
            </UiScale.Provider>
          </div>
          <div className="absolute inset-x-0 top-0 origin-top" style={{ transform: `scale(${screen.panelScale})` }}>
            <div className="relative mx-auto" style={{ width: SCREEN_W }}>
              <Toast />
            </div>
          </div>
        </>
      )}
    </main>
  )
}
