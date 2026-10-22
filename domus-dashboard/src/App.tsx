import { useEffect } from 'react'
import { Artboard, ArtboardProvider, Slot, useArtboard } from './layout/Artboard'
import { useDomus } from './store'
import { SceneCanvas } from './scene/SceneCanvas'
import { Header } from './components/chrome/Header'
import { Sidebar } from './components/chrome/Sidebar'
import { CommandPalette } from './components/chrome/CommandPalette'
import { Toasts } from './components/chrome/Toasts'
import { Greeting } from './components/left/Greeting'
import { EnergyCard } from './components/left/EnergyCard'
import { ClimateCard } from './components/left/ClimateCard'
import { SmartDevices } from './components/devices/SmartDevices'
import { RoomPanel } from './components/room/RoomPanel'
import { AssistantCard } from './components/assistant/AssistantCard'

/* Layout map — design px on the 1600×900 reference (see SPEC.md). */
export const LAYOUT = {
  margin: 32,
  header: { top: 26, height: 46 },
  sidebar: { left: 32, top: 120, width: 52 },
  greeting: { left: 132, top: 122, width: 300 },
  energy: { left: 132, top: 272, width: 280, height: 258 },
  climate: { left: 32, bottom: 32, width: 392, height: 282 },
  devices: { left: 436, bottom: 32, width: 700, height: 282 },
  room: { right: 32, top: 98, width: 388, bottom: 208 },
  assistant: { right: 32, bottom: 32, width: 388, height: 162 },
} as const

function DesktopLayout() {
  const L = LAYOUT
  return (
    <Artboard>
      <Slot name="header" left={L.margin} right={L.margin} top={L.header.top} height={L.header.height}>
        <Header />
      </Slot>
      <Slot name="sidebar" {...L.sidebar}>
        <Sidebar />
      </Slot>
      <Slot name="greeting" {...L.greeting}>
        <Greeting />
      </Slot>
      <Slot name="energy" {...L.energy}>
        <EnergyCard />
      </Slot>
      <Slot name="climate" {...L.climate}>
        <ClimateCard />
      </Slot>
      <Slot name="devices" {...L.devices}>
        <SmartDevices />
      </Slot>
      <Slot name="room" {...L.room}>
        <RoomPanel />
      </Slot>
      <Slot name="assistant" {...L.assistant}>
        <AssistantCard />
      </Slot>
    </Artboard>
  )
}

/** Phones / tablets / portrait: same components, natural vertical flow over the fixed 3D scene. */
function CompactLayout() {
  return (
    <main className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-4 px-4 pb-10 pt-4">
      <div className="min-h-[46px]">
        <Header />
      </div>
      <Greeting />
      {/* window onto the 3D house */}
      <div aria-hidden className="h-[46vh] min-h-[280px]" />
      <div className="h-[258px]">
        <EnergyCard />
      </div>
      <div className="h-[600px]">
        <RoomPanel />
      </div>
      <div className="h-[162px]">
        <AssistantCard />
      </div>
      <div className="h-[282px]">
        <ClimateCard />
      </div>
      <div className="min-h-[282px]">
        <SmartDevices />
      </div>
      <div className="sticky bottom-4 z-20 mx-auto">
        <Sidebar />
      </div>
    </main>
  )
}

function Shell() {
  const { mode } = useArtboard()
  const tick = useDomus((s) => s.tick)

  useEffect(() => {
    const id = window.setInterval(tick, 2500)
    return () => window.clearInterval(id)
  }, [tick])

  return (
    <>
      <SceneCanvas />
      {mode === 'desktop' ? <DesktopLayout /> : <CompactLayout />}
      <CommandPalette />
      <Toasts />
    </>
  )
}

export default function App() {
  return (
    <ArtboardProvider>
      <Shell />
    </ArtboardProvider>
  )
}
