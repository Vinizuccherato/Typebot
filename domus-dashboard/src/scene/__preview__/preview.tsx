// Dev-only harness: renders the 3D scene without the UI layer (not part of the production build).
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { ArtboardProvider } from '../../layout/Artboard'
import { SceneCanvas } from '../SceneCanvas'

createRoot(document.getElementById('root')!).render(
  <ArtboardProvider>
    <SceneCanvas />
  </ArtboardProvider>,
)
