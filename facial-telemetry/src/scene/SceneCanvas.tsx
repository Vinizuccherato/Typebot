import { useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { ShaderMaterial, Vector2, type Group } from 'three'
import { AnalysisLayer } from '../analysis/AnalysisLayer'
import { Head } from './Head'
import { Construction, Crosshair } from './Construction'
import { CameraRig, FOV } from './CameraRig'
import { PIVOT } from './anchors'
import { backdropFragment, backdropVertex } from './thermalMaterial'

const isSoftware = () =>
  typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

/** Full-screen gradient matching the CSS room, drawn first. */
function Backdrop() {
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        uniforms: { uRes: { value: new Vector2() } },
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )
  mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
  return (
    <mesh renderOrder={-10} frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

/**
 * Full-viewport WebGL scene behind the artboard: the procedural head in a thermal shader,
 * scan construction graphics, the visagism layer (head-local) and the orbit camera.
 */
export function SceneCanvas() {
  const soft = isSoftware()
  const [quality, setQuality] = useState<0 | 1 | 2>(2) // 2 full, 1 reduced DPR, 0 + no bloom
  const head = useRef<Group>(null)
  const floor = typeof window === 'undefined' ? 1 : Math.max(1, Math.min(1.5, window.devicePixelRatio))
  const dpr: number | [number, number] = soft ? 0.75 : quality === 2 ? [1, 2] : floor

  return (
    <div className="fixed inset-0 z-0" aria-label="3D facial scan — drag to rotate, scroll to zoom, click a feature to analyse it">
      <Canvas
        dpr={dpr}
        flat
        resize={{ offsetSize: true }}
        camera={{ fov: FOV, near: 0.05, far: 60, position: [0, 0, 8] }}
        gl={{ antialias: !soft, powerPreference: 'high-performance', alpha: false }}
      >
        <PerformanceMonitor onDecline={() => setQuality((q) => (q > 0 ? ((q - 1) as 0 | 1) : q))} flipflops={3} />
        <Backdrop />
        <Crosshair />
        {/* rotate around the skull centre; children live in the head-local frame */}
        <group ref={head} position={PIVOT}>
          <group position={[-PIVOT.x, -PIVOT.y, -PIVOT.z]}>
            <Head />
            <Construction />
            <AnalysisLayer />
          </group>
        </group>
        <CameraRig head={head} />
        {quality > 0 && (
          <EffectComposer multisampling={soft ? 0 : 4}>
            <Bloom mipmapBlur luminanceThreshold={0.88} luminanceSmoothing={0.2} intensity={soft ? 0.7 : 0.9} radius={0.72} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}
