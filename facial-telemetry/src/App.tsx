import { useEffect } from 'react'
import { Artboard, ArtboardProvider, Slot, useArtboard } from './layout/Artboard'
import { useFace } from './store'
import { SceneCanvas } from './scene/SceneCanvas'
import { Header } from './components/chrome/Header'
import { Toasts } from './components/chrome/Toasts'
import { Title } from './components/left/Title'
import { ToolGrid } from './components/left/ToolGrid'
import { HeartRate } from './components/left/HeartRate'
import { MentalStress } from './components/left/MentalStress'
import { GeneralFitness } from './components/left/GeneralFitness'
import { Respiratory } from './components/right/Respiratory'
import { RppgSignal } from './components/right/RppgSignal'
import { Timeline } from './components/right/Timeline'
import { Cognitive } from './components/right/Cognitive'
import { Gfi } from './components/right/Gfi'
import { AnalyticConfig } from './components/right/AnalyticConfig'
import { Inspector } from './analysis/Inspector'

/* Layout map — design px on the 1600×1000 reference (see SPEC.md). The head
   occupies the centre (≈ x 540–1120); the inspector docks right of it. */
export const LAYOUT = {
  header: { left: 40, right: 40, top: 28, height: 48 },
  title: { left: 48, top: 140, width: 440 },
  tools: { left: 160, top: 430, width: 124, height: 124 },
  heart: { left: 300, top: 420, width: 280, height: 180 },
  stress: { left: 40, bottom: 24, width: 400, height: 220 },
  fitness: { left: 456, bottom: 24, width: 390, height: 132 },
  timeline: { left: 470, bottom: 172, width: 660, height: 64 },
  cognitive: { left: 862, bottom: 24, width: 240, height: 132 },
  gfi: { left: 1114, bottom: 24, width: 150, height: 132 },
  respiratory: { right: 344, top: 112, width: 220, height: 180 },
  rppg: { right: 40, top: 112, width: 290, height: 340 },
  inspector: { right: 344, top: 306, width: 300, height: 390 },
  config: { right: 40, bottom: 24, width: 290, height: 470 },
} as const

function DesktopLayout() {
  const L = LAYOUT
  return (
    <Artboard>
      <Slot name="header" {...L.header}><Header /></Slot>
      <Slot name="title" {...L.title}><Title /></Slot>
      <Slot name="viewer tools" {...L.tools}><ToolGrid /></Slot>
      <Slot name="heart rate" {...L.heart}><HeartRate /></Slot>
      <Slot name="mental stress" {...L.stress}><MentalStress /></Slot>
      <Slot name="general fitness" {...L.fitness}><GeneralFitness /></Slot>
      <Slot name="timeline" {...L.timeline}><Timeline /></Slot>
      <Slot name="cognitive state" {...L.cognitive}><Cognitive /></Slot>
      <Slot name="general fitness index" {...L.gfi}><Gfi /></Slot>
      <Slot name="respiratory rate" {...L.respiratory}><Respiratory /></Slot>
      <Slot name="rPPG signal" {...L.rppg}><RppgSignal /></Slot>
      <Slot name="feature inspector" {...L.inspector}><Inspector /></Slot>
      <Slot name="analytic configuration" {...L.config}><AnalyticConfig /></Slot>
    </Artboard>
  )
}

/** Phones / portrait tablets: vertical flow over the fixed 3D head. */
function CompactLayout() {
  return (
    <main
      className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-4 pb-10 pt-4"
      style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}
    >
      <div className="min-h-[48px]"><Header /></div>
      <Title />
      <div aria-hidden className="pointer-events-none h-[56vh] min-h-[340px]" />
      <div className="grid grid-cols-[124px_1fr] gap-4">
        <div className="h-[124px]"><ToolGrid /></div>
        <div className="h-[124px]"><HeartRate /></div>
      </div>
      <div className="min-h-[300px]"><Inspector /></div>
      <div className="h-[64px]"><Timeline /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[180px]"><Respiratory /></div>
        <div className="h-[180px]"><Gfi /></div>
      </div>
      <div className="h-[300px]"><RppgSignal /></div>
      <div className="h-[220px]"><MentalStress /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[132px]"><GeneralFitness /></div>
        <div className="h-[132px]"><Cognitive /></div>
      </div>
      <div className="h-[470px]"><AnalyticConfig /></div>
    </main>
  )
}

function Shell() {
  const { mode } = useArtboard()
  const tick = useFace((s) => s.tick)
  useEffect(() => {
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      tick(Math.min(0.5, (now - last) / 1000))
      last = now
    }, 100)
    return () => window.clearInterval(id)
  }, [tick])
  return (
    <>
      {mode === 'desktop' ? <DesktopLayout /> : <CompactLayout />}
      {/* after the layout in DOM order so Tab starts at the header (stacking is set by z-index) */}
      <SceneCanvas />
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
