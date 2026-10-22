import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useDomus } from '../store'
import { House } from './House'
import { Landscape } from './Landscape'
import { Hotspots } from './Hotspots'
import { CameraRig } from './CameraRig'
import { backgroundTexture, neutralCompensate } from './textures'
import { isAutomation, isSoftwareRenderer, wantsNoFx } from './gpu'

/** Backdrop identical to the CSS body gradient + matching fog. */
function Atmosphere() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.background = backgroundTexture()
    scene.fog = new THREE.Fog(neutralCompensate('#b6b1a9'), 45, 115)
    return () => {
      scene.background = null
      scene.fog = null
    }
  }, [scene])
  return null
}

/**
 * Shadows are baked on demand: the architecture is static, so the shadow
 * map only re-renders for a moment after something that casts one moves.
 */
function ShadowPolicy() {
  const gl = useThree((s) => s.gl)
  const frames = useRef(30)
  const locked = useDomus((s) => s.door.locked)
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
  }, [gl])
  useEffect(() => {
    frames.current = Math.max(frames.current, 120)
  }, [locked])
  useFrame(() => {
    if (frames.current > 0) {
      frames.current--
      gl.shadowMap.needsUpdate = true
    }
  })
  return null
}

function Lights({ shadowSize }: { shadowSize: number }) {
  return (
    <>
      <hemisphereLight args={['#f1f1f0', '#6b665f', 0.5]} />
      <directionalLight
        position={[-16, 30, 22]}
        intensity={1.8}
        color="#fffaf3"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={5}
        shadow-camera-far={90}
      />
      <directionalLight position={[26, 9, -8]} intensity={0.4} color="#dde7f4" />
    </>
  )
}

/** Studio environment made only of light-formers (no network HDRI). */
function Studio({ lowPower }: { lowPower: boolean }) {
  return (
    <Environment frames={1} resolution={lowPower ? 128 : 256} environmentIntensity={0.6}>
      <color attach="background" args={['#4a4743']} />
      <Lightformer form="rect" intensity={1.2} color="#fffaf1" position={[0, 22, 0]} rotation-x={Math.PI / 2} scale={[40, 40, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#fff1dc" position={[-26, 9, 18]} scale={[22, 7, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.8} color="#e4ecf8" position={[28, 6, -6]} scale={[18, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.5} color="#d9d3ca" position={[0, 3, 40]} scale={[60, 4, 1]} target={[0, 0, 0]} />
      {/* vertical strips → the streaky reflections running down the glazing */}
      {[-18, -10, -3, 5].map((x, i) => (
        <Lightformer key={i} form="rect" intensity={1.6} color="#ffffff" position={[x, 4, 30]} scale={[1.4, 14, 1]} target={[0, 3, 0]} />
      ))}
      <Lightformer form="ring" intensity={2} color="#ffffff" position={[22, 18, 24]} scale={7} target={[0, 0, 0]} />
      {/* low sky behind the house → the blue-grey sheen the solar panels reflect at grazing angles */}
      <Lightformer form="rect" intensity={0.85} color="#dde2ea" position={[-12, 7, -45]} scale={[90, 18, 1]} target={[0, 3, 0]} />
    </Environment>
  )
}

function Effects({ msaa, lean }: { msaa: number; lean: boolean }) {
  return (
    <EffectComposer multisampling={msaa} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1.3} luminanceSmoothing={0.3} intensity={0.5} radius={0.45} levels={lean ? 5 : 7} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  )
}

export function SceneCanvas() {
  const [dpr, setDpr] = useState(() => (isAutomation() ? 1 : Math.min(2, window.devicePixelRatio || 1)))
  const [fx, setFx] = useState(() => !wantsNoFx())
  // Software rasterisers (SwiftShader / llvmpipe) and automation get a lean profile.
  const [lowPower, setLowPower] = useState(() => isAutomation())

  return (
    <div className="fixed inset-0 z-0" role="img" aria-label="Interactive 3D view of the residence">
      <Canvas
        shadows="soft"
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1 }}
        camera={{ fov: 30, near: 1, far: 420, position: [40, 32, 46] }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          if (isSoftwareRenderer(gl)) {
            setLowPower(true)
            setDpr(1)
          }
        }}
      >
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(1, d - 0.5))}
          onIncline={() => setDpr((d) => Math.min(Math.min(2, window.devicePixelRatio || 1), d + 0.5))}
          onFallback={() => {
            setDpr(1)
            setFx(false)
          }}
        />
        <Atmosphere />
        <ShadowPolicy />
        <Lights shadowSize={lowPower ? 1024 : 2048} />
        <Suspense fallback={null}>
          <Studio lowPower={lowPower} />
        </Suspense>
        <House />
        <Landscape />
        <Hotspots />
        <CameraRig />
        {fx && <Effects lean={lowPower} msaa={lowPower || dpr >= 2 ? 0 : 4} />}
      </Canvas>
    </div>
  )
}
