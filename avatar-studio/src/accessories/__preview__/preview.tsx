/* Dev-only harness: accessories on a placeholder head (no sculptor needed).
   http://localhost:5210/src/accessories/__preview__/index.html */
import { StrictMode, useEffect, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, SphereGeometry } from 'three'
import '../../index.css'
import { ArtboardProvider } from '../../layout/Artboard'
import { avatarRegistry } from '../../lib/avatar'
import { BROW_FORMS, GLASSES, useStudio, type RegionId } from '../../store'
import { AccessoryLayer } from '../AccessoryLayer'
import { placeholderZ } from '../anchors'

function PlaceholderHead() {
  const mesh = useMemo(() => {
    const g = new SphereGeometry(1, 128, 96)
    const p = g.getAttribute('position')
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) * 0.86
      const y = p.getY(i) * 1.12 - 0.3
      let z = p.getZ(i) * 0.92 - 0.36
      if (z > -0.36) z = Math.max(z, placeholderZ(x, y))
      p.setXYZ(i, x, y, z)
    }
    g.computeVertexNormals()
    return new Mesh(g, new MeshStandardMaterial({ color: '#e7c3ad', roughness: 0.55 }))
  }, [])
  useEffect(() => {
    avatarRegistry.mesh = mesh
    // test morph: width widens the mid/lower face
    avatarRegistry.morph = (v, face, out) => {
      const k = 1 + (face.width - 0.5) * 0.25 * Math.min(1, Math.max(0, (0.3 - v.y) / 0.6))
      return out.set(v.x * k, v.y, v.z)
    }
    avatarRegistry.version++
  }, [mesh])
  return <primitive object={mesh} />
}

function Controls() {
  const s = useStudio()
  const btn = 'rounded-full bg-white/70 px-3 py-1 text-xs text-black'
  return (
    <div className="fixed left-3 top-3 z-50 flex max-w-[420px] flex-wrap gap-1">
      {BROW_FORMS.map((b) => (
        <button key={b.id} className={btn} onClick={() => s.edit({ browForm: b.id })}>{b.label}</button>
      ))}
      <button className={btn} onClick={() => s.edit({ glasses: 'none' })}>No glasses</button>
      {GLASSES.map((g) => (
        <button key={g.id} className={btn} onClick={() => s.edit({ glasses: g.id })}>{g.label}</button>
      ))}
      {(['face', 'eyes', 'brows', 'accessories'] as RegionId[]).map((r) => (
        <button key={r} className={btn} onClick={() => s.setRegion(r)}>{r}</button>
      ))}
      <button className={btn} onClick={() => s.edit({ face: { ...s.look.face, width: s.look.face.width > 0.6 ? 0.2 : 1 } })}>width</button>
      <button className={btn} onClick={() => s.edit({ browColor: s.look.browColor === '#5b3940' ? '#b39a8e' : '#5b3940' })}>brow colour</button>
    </div>
  )
}

function App() {
  return (
    <ArtboardProvider>
      <Controls />
      <div className="fixed inset-0">
        <Canvas camera={{ position: [0, -0.1, 4.2], fov: 30 }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 4]} intensity={1.6} />
          <Environment resolution={128}>
            <Lightformer form="rect" intensity={2} position={[0, 3, 4]} scale={[6, 3, 1]} />
            <Lightformer form="rect" intensity={1} color="#ffd9cf" position={[-4, 0, 2]} scale={[3, 5, 1]} />
          </Environment>
          <group>
            <PlaceholderHead />
            <AccessoryLayer />
          </group>
          <OrbitControls enablePan={false} />
        </Canvas>
      </div>
    </ArtboardProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
