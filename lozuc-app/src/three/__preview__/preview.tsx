import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { FaceView, type FaceViewProps } from '../FaceView'
import { SceneRoot } from '../SceneRoot'
import { CURRENT_STYLE, TONES, type RegionId } from '../../store'

/* Dev-only harness for the 3D engine (not imported by the app). */
const cells: { label: string; props: FaceViewProps }[] = [
  { label: 'skin · current · front', props: { subject: 'face', interactive: true } },
  { label: 'textured-crop + short-boxed · ¾', props: { subject: 'face', pose: 'threeQuarter', style: { hair: 'textured-crop', hairTone: TONES.espresso, beard: 'short-boxed', beardTone: TONES.espresso, brows: 'clean-up' } } },
  { label: 'slick-back + full · profile', props: { subject: 'face', pose: 'profile', style: { hair: 'slick-back', hairTone: TONES.castanho, beard: 'full', beardTone: TONES.castanho, brows: 'natural' } } },
  { label: 'scan 60', props: { subject: 'face', material: 'scan', scan: 60, landmarks: true } },
  { label: 'buzz + goatee · bust', props: { subject: 'face', framing: 'bust', style: { hair: 'buzz', hairTone: TONES.grafite, beard: 'goatee', beardTone: TONES.grafite, brows: 'defined' } } },
  { label: 'mark', props: { subject: 'mark' } },
  { label: 'side-part · hair framing', props: { subject: 'face', framing: 'hair', pose: 'threeQuarter', style: { ...CURRENT_STYLE, hair: 'side-part', beard: 'clean' } } },
]

const qs = new URLSearchParams(location.search)

function MapCell() {
  const [active, setActive] = useState<RegionId | null>((qs.get('active') as RegionId) ?? 'jaw')
  return (
    <FaceView
      className="absolute inset-0"
      subject="face"
      material="map"
      interactive
      regions={{ show: true, active, onSelect: setActive, priorities: { composition: 'alta', hair: 'alta', beard: 'alta', brows: 'media', jaw: 'media', contrast: 'baixa', eyes: 'baixa', lips: 'baixa', noseEars: null, neck: null, skin: 'baixa' } }}
    />
  )
}

function App() {
  if (qs.get('only') === 'map')
    return (
      <div style={{ position: 'relative', width: 400, height: 470 }}>
        <SceneRoot />
        <MapCell />
      </div>
    )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 10 }}>
      <SceneRoot />
      {cells.map((c) => (
        <div key={c.label} style={{ position: 'relative', height: 470, borderRadius: 18, background: 'linear-gradient(#16221d,#0d1411)', overflow: 'hidden' }}>
          <FaceView className="absolute inset-0" {...c.props} />
          <div style={{ position: 'absolute', left: 12, bottom: 10 }}>{c.label}</div>
        </div>
      ))}
      <div style={{ position: 'relative', height: 470, borderRadius: 18, background: 'linear-gradient(#16221d,#0d1411)', overflow: 'hidden' }}>
        <MapCell />
        <div style={{ position: 'absolute', left: 12, bottom: 10 }}>map · regions (jaw)</div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
