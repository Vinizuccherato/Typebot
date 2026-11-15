import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RingScene } from '../RingScene'
import type { FinishId } from '../../store'

const FINISHES: FinishId[] = ['cloud', 'petal', 'tide', 'titanium']

function Preview() {
  const [pulse, setPulse] = useState(0)
  const [hero, setHero] = useState<FinishId>(new URLSearchParams(location.search).get('hero') as FinishId || 'titanium')
  return (
    <>
      <div>
        <div className="hero">
          <RingScene variant="hero" finish={hero} pulse={pulse} className="hero-canvas" />
          <svg className="arc" viewBox="0 0 390 560">
            <path d="M 44 345 A 166 166 0 1 0 330 470" fill="none" stroke="white" strokeWidth="2" opacity="0.9" />
          </svg>
        </div>
        <button onClick={() => setPulse((p) => p + 1)}>pulse</button>
        {FINISHES.map((f) => (
          <button key={f} onClick={() => setHero(f)}>{f}</button>
        ))}
      </div>
      <div className="grid">
        {FINISHES.map((f) => (
          <div className="card" key={f}>
            <span>{f}</span>
            <RingScene variant="product" finish={f} pulse={pulse} className="ring-canvas" />
          </div>
        ))}
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(<Preview />)
