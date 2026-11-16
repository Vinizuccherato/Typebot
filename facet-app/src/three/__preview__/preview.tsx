import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../index.css'
import { FaceView } from '../FaceView'
import { SceneRoot } from '../SceneRoot'

/* Dev-only harness: every material, the brand mark and the overlays side by side. */
function Preview() {
  const [scan, setScan] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setScan((s) => (s >= 100 ? 100 : s + 2)), 100)
    return () => window.clearInterval(id)
  }, [])
  const cell = 'h-[440px] w-[300px] rounded-[28px] bg-[#16111c]'
  return (
    <div className="flex flex-wrap gap-4 p-6" style={{ overflow: 'auto', height: '100%' }}>
      <SceneRoot />
      <FaceView className={cell} subject="mark" />
      <FaceView className={cell} subject="face" material="skin" accessories framing="head" />
      <FaceView className={cell} subject="face" material="thermal" scan={scan} framing="head" />
      <FaceView className={cell} subject="face" material="hologram" scan={scan} landmarks framing="head" />
      <FaceView className={cell} subject="face" material="skin" overlays={{ thirds: true }} framing="head" />
      <FaceView className={cell} subject="face" material="thermal" overlays={{ golden: true, symmetry: true }} landmarks framing="face" />
      <FaceView className={cell} subject="face" material="skin" overlays={{ measure: 'nose' }} landmarks framing="face" interactive />
      <FaceView className={cell} subject="face" material="skin" accessories framing="eyes" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
)
