/* Dev-only harness: the visagism layer on a placeholder head, before the scene lands. */
import { StrictMode, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import '../../index.css'
import { headRegistry, type FeatureId } from '../../lib/face'
import { useFace, type TabId } from '../../store'
import { AnalysisLayer } from '../AnalysisLayer'
import { Inspector } from '../Inspector'

function PlaceholderHead() {
  const ref = useRef<Mesh>(null)
  useEffect(() => {
    const g = new SphereGeometry(1, 128, 128)
    const pos = g.attributes.position
    const v = new Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const x = v.x * 0.86
      const y = v.y * 1.12 - 0.3
      let z = v.z * 0.92 - 0.36
      if (v.z > 0) z += 0.2 * Math.exp(-(x * x) / 0.012 - ((y + 0.3) * (y + 0.3)) / 0.05)
      pos.setXYZ(i, x, y, z)
    }
    g.computeVertexNormals()
    ref.current!.geometry = g
    headRegistry.mesh = ref.current
    return () => {
      headRegistry.mesh = null
    }
  }, [])
  return <mesh ref={ref} material={new MeshStandardMaterial({ color: '#1f4a3e', roughness: 0.6 })} />
}

function Harness() {
  const params = new URLSearchParams(location.search)
  useEffect(() => {
    const st = useFace.getState()
    const tab = params.get('tab') as TabId | null
    if (tab) st.setTab(tab)
    const f = params.get('f') as FeatureId | null
    if (f) setTimeout(() => st.select(f), 400)
    const id = setInterval(() => useFace.getState().tick(0.1), 100)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="fixed inset-0">
        <Canvas camera={{ position: [0, -0.25, 4.2], fov: 32 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} intensity={1.2} />
          <group rotation={[0, Number(params.get('ry') ?? 0), 0]}>
            <PlaceholderHead />
            <AnalysisLayer />
          </group>
          <OrbitControls target={[0, -0.3, 0]} />
        </Canvas>
      </div>
      <div className="fixed right-6 top-6 h-[390px] w-[300px]">
        <Inspector />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
)
