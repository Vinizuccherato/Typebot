import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { CameraRig } from './CameraRig'
import { Avatar } from './Avatar'

/* Full-viewport, transparent canvas behind the artboard (the CSS paints the studio).
   Soft portrait lighting: warm-pink key from the front-left (the reference's blush glow),
   cool lavender fill from the right, a gentle rim — reflections from Lightformers only. */

const isSoftware = () => typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

export function AvatarCanvas() {
  const soft = isSoftware()
  const dense = typeof window !== 'undefined' && window.devicePixelRatio >= 2
  const [dpr, setDpr] = useState<number>(soft ? 1 : Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1))

  return (
    <div className="fixed inset-0 z-0" aria-label="3D avatar preview — drag to turn the head, scroll to zoom" role="img">
      <Canvas
        dpr={dpr}
        resize={{ offsetSize: true }}
        gl={{ alpha: true, antialias: !soft, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, outputColorSpace: SRGBColorSpace, powerPreference: 'high-performance' }}
        camera={{ fov: 18, position: [0, 0, 20], near: 0.1, far: 60 }}
        style={{ width: '100%', height: '100%' }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(dense ? 1.5 : 1, d - 0.5))}
          onIncline={() => setDpr((d) => Math.min(2, d + 0.25))}
        />
        <CameraRig />
        <hemisphereLight args={['#e6e2f6', '#9c8f9c', 0.38]} />
        <directionalLight position={[-4.2, 2.8, 3.6]} intensity={2.5} color="#ffe4dc" />
        <directionalLight position={[3.6, 1.2, 3.4]} intensity={0.75} color="#c9cdf2" />
        <directionalLight position={[0.5, 3.5, -4]} intensity={1.1} color="#fff1ea" />
        <Suspense fallback={null}>
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={1.3} color="#fff3ee" position={[-1.5, 2, 6]} scale={[4, 2.5, 1]} />
            <Lightformer form="rect" intensity={1.6} color="#ffc6b8" position={[-5, 0.5, 2]} rotation-y={Math.PI / 2.4} scale={[3, 5, 1]} />
            <Lightformer form="rect" intensity={1.1} color="#c8ccf5" position={[5, 0.5, 2]} rotation-y={-Math.PI / 2.4} scale={[3, 5, 1]} />
            <Lightformer form="ring" intensity={2} color="#ffffff" position={[-1.2, 1.6, 5]} scale={0.6} />
          </Environment>
        </Suspense>
        <Avatar />
      </Canvas>
    </div>
  )
}
