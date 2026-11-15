import { useEffect } from 'react'
import { Artboard, ArtboardProvider, Slot, useArtboard } from './layout/Artboard'
import { useSoma } from './store'
import { SceneCanvas } from './scene/SceneCanvas'
import { Header } from './components/chrome/Header'
import { Toasts } from './components/chrome/Toasts'
import { Title } from './components/left/Title'
import { MetabolicScore } from './components/left/MetabolicScore'
import { Variability } from './components/left/Variability'
import { RangeCard } from './components/left/RangeCard'
import { Macros } from './components/left/Macros'
import { GlucoseCard } from './components/right/GlucoseCard'
import { Expiration } from './components/right/Expiration'
import { Signal } from './components/right/Signal'
import { SideRail } from './components/right/SideRail'
import { ScoreCalc } from './components/right/ScoreCalc'
import { Cholesterol } from './components/right/Cholesterol'
import { Goals } from './components/right/Goals'
import { ExpandedCard } from './components/right/ExpandedCard'

/* Layout map — design px on the 1440×1000 reference (see SPEC.md). */
export const LAYOUT = {
  header: { left: 40, right: 40, top: 32, height: 44 },
  title: { left: 44, top: 116, width: 420 },
  metabolic: { left: 60, top: 330, width: 350, height: 240 },
  variability: { left: 92, top: 588, width: 180, height: 200 },
  range: { left: 282, top: 588, width: 150, height: 200 },
  macros: { left: 104, bottom: 24, width: 336, height: 168 },
  glucose: { left: 790, top: 296, width: 300, height: 264 },
  expiration: { right: 150, top: 100, width: 210, height: 130 },
  signal: { right: 140, top: 244, width: 200, height: 76 },
  rail: { right: 66, top: 560, width: 44, height: 150 },
  score: { left: 452, bottom: 24, width: 452, height: 200 },
  cholesterol: { left: 916, bottom: 24, width: 268, height: 246 },
  goals: { right: 56, bottom: 24, width: 192, height: 246 },
} as const

function DesktopLayout() {
  const L = LAYOUT
  return (
    <Artboard>
      <Slot name="header" {...L.header}><Header /></Slot>
      <Slot name="title" {...L.title}><Title /></Slot>
      <Slot name="metabolic score" {...L.metabolic}><MetabolicScore /></Slot>
      <Slot name="variability" {...L.variability}><Variability /></Slot>
      <Slot name="range" {...L.range}><RangeCard /></Slot>
      <Slot name="daily macronutrients" {...L.macros}><Macros /></Slot>
      <Slot name="glucose" {...L.glucose}><GlucoseCard /></Slot>
      <Slot name="sensor expiration" {...L.expiration}><Expiration /></Slot>
      <Slot name="signal" {...L.signal}><Signal /></Slot>
      <Slot name="quick actions" {...L.rail}><SideRail /></Slot>
      <Slot name="score calculation" {...L.score}><ScoreCalc /></Slot>
      <Slot name="cholesterol" {...L.cholesterol}><Cholesterol /></Slot>
      <Slot name="goals" {...L.goals}><Goals /></Slot>
    </Artboard>
  )
}

/** Phones / portrait tablets: same components in a vertical flow over the fixed 3D figure. */
function CompactLayout() {
  return (
    <main
      className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-4 pb-10 pt-4"
      style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}
    >
      <div className="min-h-[44px]"><Header /></div>
      <Title />
      <div aria-hidden className="pointer-events-none h-[52vh] min-h-[320px]" />
      <div className="h-[264px]"><GlucoseCard /></div>
      <div className="h-[240px]"><MetabolicScore /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[200px]"><Variability /></div>
        <div className="h-[200px]"><RangeCard /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[130px]"><Expiration /></div>
        <div className="h-[130px]"><Signal /></div>
      </div>
      <div className="h-[200px]"><ScoreCalc /></div>
      <div className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="h-[246px]"><Cholesterol /></div>
        <div className="h-[246px]"><Goals /></div>
      </div>
      <div className="h-[168px]"><Macros /></div>
    </main>
  )
}

function Shell() {
  const { mode } = useArtboard()
  const tick = useSoma((s) => s.tick)
  useEffect(() => {
    const id = window.setInterval(tick, 4000)
    return () => window.clearInterval(id)
  }, [tick])
  return (
    <>
      <SceneCanvas />
      {mode === 'desktop' ? <DesktopLayout /> : <CompactLayout />}
      <ExpandedCard />
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
