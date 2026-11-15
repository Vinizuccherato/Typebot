import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { easing } from 'maath'
import {
  NeutralToneMapping,
  type Group,
  type PerspectiveCamera,
  type PointLight,
} from 'three'
import type { FinishId } from '../store'
import { RingModel } from './RingModel'

export interface RingSceneProps {
  finish: FinishId
  /** hero: large floating ring behind the battery gauge. product: small 3/4 product shot in the sheet. */
  variant: 'hero' | 'product'
  /** Increments on activation — play a flourish (spin + light sweep). */
  pulse?: number
  /** CSS scale applied by a transformed parent; raises the render resolution so the ring stays crisp. */
  resolution?: number
  className?: string
}

const TAU = Math.PI * 2
const FLOURISH_S = 1.4
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

interface DragState {
  dragging: boolean
  lastX: number
  spin: number
  velocity: number
}

/* ── shared pieces ───────────────────────────────────────────── */

/** Studio made only of Lightformers — no network HDRI. Baked once. */
function Studio({ variant }: { variant: RingSceneProps['variant'] }) {
  const hero = variant === 'hero'
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={[hero ? '#a9bcc6' : '#bcc7cd']} />
      {/* top softbox */}
      <Lightformer form="rect" intensity={2} position={[0, 6, 1]} rotation-x={Math.PI / 2} scale={[12, 5, 1]} />
      {/* cool rim (left) and warm rim (right) — the reference's pale blue / peach palette */}
      <Lightformer form="rect" intensity={hero ? 2.2 : 1.3} color={hero ? '#bcd8e6' : '#e4eef3'} position={[-6, 1, 1]} rotation-y={Math.PI / 2} scale={[3, 8, 1]} />
      <Lightformer form="rect" intensity={hero ? 2 : 1.1} color={hero ? '#ffd2b8' : '#fff1e6'} position={[6, 0.5, 0]} rotation-y={-Math.PI / 2} scale={[3, 8, 1]} />
      {/* front ring light gives the round specular on ceramic */}
      <Lightformer form="ring" intensity={1.6} position={[0, 1.5, 7]} scale={2.5} />
      {/* dark flags: metal needs something dark to reflect or it reads as glass */}
      <Lightformer form="rect" intensity={1} color="#2c3439" position={[0, -1.2, -7]} scale={[16, 2.2, 1]} />
      <Lightformer form="rect" intensity={1} color="#3a454c" position={[-7, -2, -3]} rotation-y={Math.PI / 3} scale={[4, 3, 1]} />
      <Lightformer form="rect" intensity={1} color="#4a565d" position={[-4.5, 3.5, 5]} rotation-y={Math.PI / 5} scale={[3.5, 2.2, 1]} />
      <Lightformer form="rect" intensity={1} color="#56626a" position={[5, -2.5, 5]} rotation-y={-Math.PI / 5} scale={[3, 2, 1]} />
      {/* floor bounce */}
      <Lightformer form="rect" intensity={0.7} color="#d6dee2" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
    </Environment>
  )
}

/** Keeps the ring framed at a given fraction of the canvas, whatever its size. */
function CameraFit({ fit, lookY = 0, camY = 0 }: { fit: { w: number; h: number }; lookY?: number; camY?: number }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const size = useThree((s) => s.size)
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const t = Math.tan((camera.fov * Math.PI) / 360)
    const d = Math.max(fit.h / (2 * t), fit.w / (2 * t * aspect))
    camera.position.set(0, camY, d)
    camera.lookAt(0, lookY, 0)
    camera.updateProjectionMatrix()
  }, [camera, size, fit.w, fit.h, lookY, camY])
  return null
}

/** Tracks `pulse` changes (ignoring mount) and exposes flourish progress 0..1 (or -1 when idle). */
function useFlourish(pulse: number) {
  const prev = useRef(pulse)
  const start = useRef(-1)
  const clock = useThree((s) => s.clock)
  useEffect(() => {
    if (pulse !== prev.current) {
      prev.current = pulse
      start.current = clock.elapsedTime
    }
  }, [pulse, clock])
  return (now: number) => {
    if (start.current < 0) return -1
    const p = (now - start.current) / FLOURISH_S
    if (p >= 1) {
      start.current = -1
      return -1
    }
    return p
  }
}

/** A point light that sweeps across the surface during a flourish. */
function SweepLight({ lightRef }: { lightRef: MutableRefObject<PointLight | null> }) {
  return <pointLight ref={lightRef} position={[-4, 1.5, 3]} intensity={0} distance={14} decay={1.6} color="#ffffff" />
}

/* ── product shot ────────────────────────────────────────────── */

function ProductRig({ finish, pulse, drag }: { finish: FinishId; pulse: number; drag: MutableRefObject<DragState> }) {
  const turntable = useRef<Group>(null)
  const sway = useRef<Group>(null)
  const sweep = useRef<PointLight | null>(null)
  const flourish = useFlourish(pulse)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const d = drag.current
    if (!d.dragging) {
      d.spin += d.velocity
      d.velocity *= Math.pow(0.9, dt * 60)
      if (Math.abs(d.velocity) < 0.002) {
        d.velocity = 0
        // spring back to the reference angle (nearest full turn)
        const home = Math.round(d.spin / TAU) * TAU
        d.spin += (home - d.spin) * (1 - Math.exp(-dt * 5))
      }
    }
    const p = flourish(t)
    const extra = p >= 0 ? easeInOutCubic(p) * TAU : 0
    if (turntable.current) turntable.current.rotation.y = d.spin + extra
    if (sway.current) {
      sway.current.rotation.z = -0.07 + Math.sin(t * 0.7) * 0.025
      sway.current.position.y = Math.sin(t * 0.9) * 0.025
    }
    if (sweep.current) {
      sweep.current.intensity = p >= 0 ? Math.sin(p * Math.PI) * 26 : 0
      sweep.current.position.x = -4 + (p >= 0 ? p : 0) * 8
    }
  })

  return (
    <>
      <CameraFit fit={{ w: 3.7, h: 3.1 }} lookY={-0.12} camY={0.5} />
      <directionalLight position={[-2, 4, 3]} intensity={0.9} />
      <ambientLight intensity={0.25} />
      <SweepLight lightRef={sweep} />
      <group ref={turntable}>
        <group ref={sway}>
          {/* top tipped toward the camera: domed crown on top, polished sensor wall inside at the bottom */}
          <group rotation={[-0.62, 0, 0]}>
            <RingModel finish={finish} />
          </group>
        </group>
      </group>
      <ContactShadows frames={1} position={[0, -1.02, 0]} opacity={0.22} scale={4.6} blur={3.2} far={1.6} resolution={256} color="#45535b" />
    </>
  )
}

/* ── hero ────────────────────────────────────────────────────── */

function HeroRig({ finish, pulse }: { finish: FinishId; pulse: number }) {
  const float = useRef<Group>(null)
  const spinner = useRef<Group>(null)
  const sweep = useRef<PointLight | null>(null)
  const flourish = useFlourish(pulse)
  const pointer = useThree((s) => s.pointer)

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const p = flourish(t)
    const extra = p >= 0 ? easeInOutCubic(p) * TAU : 0
    if (float.current) {
      float.current.position.y = Math.sin(t * 0.55) * 0.12
      // drift + a hint of pointer parallax
      easing.damp(float.current.rotation, 'y', Math.sin(t * 0.22) * 0.45 + pointer.x * 0.18, 0.6, dt)
      easing.damp(float.current.rotation, 'x', Math.sin(t * 0.31) * 0.08 - pointer.y * 0.1, 0.6, dt)
    }
    if (spinner.current) spinner.current.rotation.y = t * 0.18 + extra
    if (sweep.current) {
      sweep.current.intensity = p >= 0 ? Math.sin(p * Math.PI) * 40 : 0
      sweep.current.position.x = -5 + (p >= 0 ? p : 0) * 10
    }
  })

  return (
    <>
      <CameraFit fit={{ w: 6.8, h: 4.2 }} />
      <directionalLight position={[3, 3, 4]} intensity={0.8} color="#fff1e6" />
      <directionalLight position={[-4, 1, 2]} intensity={0.6} color="#d9ecf6" />
      <ambientLight intensity={0.3} />
      <SweepLight lightRef={sweep} />
      <group ref={float}>
        <group rotation={[-0.95, 0, 0.32]}>
          <group ref={spinner}>
            <RingModel finish={finish} />
          </group>
        </group>
      </group>
    </>
  )
}

/* ── public component ────────────────────────────────────────── */

const isSoftware = () =>
  typeof navigator !== 'undefined' && (navigator.webdriver || /SwiftShader|HeadlessChrome/i.test(navigator.userAgent))

/** Photoreal procedural Oura Ring 4 on a transparent canvas that fills its parent. */
export function RingScene({ finish, variant, pulse = 0, resolution = 1, className }: RingSceneProps) {
  const [degraded, setDegraded] = useState(false)
  const k = Math.max(1, resolution)
  const floor = typeof window === 'undefined' ? 1 : Math.max(1, Math.min(1.5, window.devicePixelRatio))
  const dpr: number | [number, number] = isSoftware() ? 1 : degraded ? floor * k : [k, 2 * k]
  const drag = useRef<DragState>({ dragging: false, lastX: 0, spin: 0, velocity: 0 })
  const wrap = useRef<HTMLDivElement>(null)
  const product = variant === 'product'

  const handlers = product
    ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
          if (e.button !== 0) return
          const d = drag.current
          d.dragging = true
          d.lastX = e.clientX
          d.velocity = 0
          e.currentTarget.setPointerCapture(e.pointerId)
          e.currentTarget.style.cursor = 'grabbing'
        },
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
          const d = drag.current
          if (!d.dragging) return
          const dx = e.clientX - d.lastX
          d.lastX = e.clientX
          const w = e.currentTarget.clientWidth || 200
          const delta = (dx / w) * Math.PI * 1.6
          d.spin += delta
          d.velocity = delta
        },
        onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
          drag.current.dragging = false
          e.currentTarget.style.cursor = 'grab'
        },
        onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => {
          drag.current.dragging = false
          e.currentTarget.style.cursor = 'grab'
        },
      }
    : {}

  return (
    <div
      ref={wrap}
      className={className}
      style={product ? { cursor: 'grab', touchAction: 'pan-y' } : { pointerEvents: 'none' }}
      aria-hidden
      {...handlers}
    >
      <Canvas
        dpr={dpr}
        gl={{ alpha: true, antialias: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.02, powerPreference: 'high-performance' }}
        camera={{ fov: product ? 26 : 30, near: 0.1, far: 100, position: [0, 0, 10] }}
        style={{ width: '100%', height: '100%' }}
        // measure the unscaled layout box — parents are CSS-transformed; `resolution` restores sharpness
        resize={{ offsetSize: true }}
        // the hero ignores clicks (UI sits on top) but still reads the pointer for parallax
        eventSource={product || typeof document === 'undefined' ? undefined : document.body}
        eventPrefix={product ? 'offset' : 'client'}
      >
        <PerformanceMonitor onDecline={() => setDegraded(true)} />
        <Studio variant={variant} />
        {product ? <ProductRig finish={finish} pulse={pulse} drag={drag} /> : <HeroRig finish={finish} pulse={pulse} />}
      </Canvas>
    </div>
  )
}
