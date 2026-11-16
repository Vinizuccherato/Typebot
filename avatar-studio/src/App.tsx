import { useEffect } from 'react'
import { Artboard, ArtboardProvider, Slot, useArtboard } from './layout/Artboard'
import { useStudio } from './store'
import { AvatarCanvas } from './scene/AvatarCanvas'
import { Header } from './components/chrome/Header'
import { Rail } from './components/chrome/Rail'
import { Frame } from './components/chrome/Frame'
import { ZoomControl, StrengthSlider, ViewTools } from './components/chrome/BottomBar'
import { Toasts } from './components/chrome/Toasts'
import { FaceForm } from './components/left/FaceForm'
import { Accessories } from './components/left/Accessories'
import { EyeForm } from './components/right/EyeForm'
import { EyeColor } from './components/right/EyeColor'
import { BrowForm } from './components/right/BrowForm'
import { BrowColor } from './components/right/BrowColor'

/* Layout map — design px on the 1440×1020 reference (see SPEC.md). The avatar is centred
   at x≈715 inside the frame; the right column starts at the frame divider (x≈995). */
export const LAYOUT = {
  header: { left: 36, right: 40, top: 30, height: 60 },
  rail: { left: 36, top: 420, width: 60, height: 230 },
  frame: { left: 134, top: 123, width: 1264, height: 784 },
  faceForm: { left: 181, top: 157, width: 226, height: 290 },
  accessories: { left: 181, top: 535, width: 236, height: 190 },
  eyeForm: { left: 1035, top: 150, width: 330, height: 180 },
  eyeColor: { left: 1035, top: 360, width: 330, height: 84 },
  browForm: { left: 1035, top: 492, width: 330, height: 200 },
  browColor: { left: 1035, top: 728, width: 330, height: 92 },
  zoom: { left: 36, bottom: 30, width: 84, height: 52 },
  strength: { left: 470, bottom: 30, width: 500, height: 52 },
  viewTools: { right: 40, bottom: 30, width: 110, height: 52 },
} as const

function DesktopLayout() {
  const L = LAYOUT
  return (
    <Artboard>
      <Slot name="frame" {...L.frame} className="pointer-events-none"><Frame /></Slot>
      <Slot name="header" {...L.header}><Header /></Slot>
      <Slot name="sections" {...L.rail}><Rail /></Slot>
      <Slot name="face form" {...L.faceForm}><FaceForm /></Slot>
      <Slot name="accessories" {...L.accessories}><Accessories /></Slot>
      <Slot name="eye form" {...L.eyeForm}><EyeForm /></Slot>
      <Slot name="eye color" {...L.eyeColor}><EyeColor /></Slot>
      <Slot name="eyebrow form" {...L.browForm}><BrowForm /></Slot>
      <Slot name="eyebrow color" {...L.browColor}><BrowColor /></Slot>
      <Slot name="zoom" {...L.zoom}><ZoomControl /></Slot>
      <Slot name="strength" {...L.strength}><StrengthSlider /></Slot>
      <Slot name="view tools" {...L.viewTools}><ViewTools /></Slot>
    </Artboard>
  )
}

/** Phones / portrait tablets: avatar on top, controls in a scrolling sheet. */
function CompactLayout() {
  return (
    <main
      className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-4 pb-10 pt-4"
      style={{ paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))', paddingRight: 'max(16px, env(safe-area-inset-right, 0px))' }}
    >
      <div className="min-h-[60px]"><Header /></div>
      <div aria-hidden className="pointer-events-none h-[50vh] min-h-[320px]" />
      <div className="h-[52px]"><StrengthSlider /></div>
      <div className="flex justify-between gap-3">
        <div className="h-[52px] w-[84px]"><ZoomControl /></div>
        <div className="h-[52px] w-[230px]"><Rail /></div>
        <div className="h-[52px] w-[110px]"><ViewTools /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[290px]"><FaceForm /></div>
        <div className="h-[290px]"><Accessories /></div>
      </div>
      <div className="h-[180px]"><EyeForm /></div>
      <div className="h-[84px]"><EyeColor /></div>
      <div className="h-[200px]"><BrowForm /></div>
      <div className="h-[92px]"><BrowColor /></div>
    </main>
  )
}

function Shell() {
  const { mode } = useArtboard()
  const undo = useStudio((s) => s.undo)
  const redo = useStudio((s) => s.redo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea')) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])
  return (
    <>
      {mode === 'desktop' ? <DesktopLayout /> : <CompactLayout />}
      <AvatarCanvas />
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
