import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { easing } from 'maath'
import { useDomus } from '../store'
import { materials } from './materials'
import { mergeBoxes } from './geometry'
import { PAV } from './layout'
import { screenTexture } from './textures'

const Y = PAV.y0 // floor level
const TV = { x: -5.9, y: Y + 1.55, z: -0.25, w: 2.3, h: 1.3 }
const LAMP = { x: -9.05, z: 1.15 }
const WARM = new THREE.Color('#ffc98a')
const tmp = new THREE.Color()

/** Main Hall furniture + store-driven lighting (lamp, LED strip, TV, CleanBot). */
export function Interior() {
  const mats = materials()

  const furniture = useMemo(
    () =>
      mergeBoxes([
        // TV partition wall (freestanding, floor to ceiling)
        [-8.1, -3.7, Y, PAV.y1, -0.55, -0.35],
        // media console
        [-7.4, -4.4, Y, Y + 0.42, -0.35, 0.15],
        // dining table + legs
        [-2.6, -0.4, Y + 0.72, Y + 0.78, 1.2, 2.3],
        [-2.5, -2.42, Y, Y + 0.72, 1.3, 1.38],
        [-0.58, -0.5, Y, Y + 0.72, 2.12, 2.2],
        // kitchen island
        [-1.2, 0.6, Y, Y + 0.92, -2.6, -1.4],
      ]),
    [],
  )

  /* ── live refs ── */
  const lampLight = useRef<THREE.PointLight>(null)
  const lampShade = useRef<THREE.MeshBasicMaterial>(null)
  const ledCove = useRef<THREE.MeshBasicMaterial>(null)
  const ledFrame = useRef<THREE.MeshBasicMaterial>(null)
  const tvScreen = useRef<THREE.MeshBasicMaterial>(null)
  const tvLight = useRef<THREE.PointLight>(null)
  const bot = useRef<THREE.Group>(null)
  const botLed = useRef<THREE.MeshBasicMaterial>(null)
  const botState = useRef({ t: 0, x: -7.5, z: 3.4, heading: 0 })
  const tv = useMemo(() => screenTexture(), [])

  useFrame((state, dt) => {
    const s = useDomus.getState()
    const t = state.clock.elapsedTime

    // Hue master lamp
    const lampK = s.lamp.on ? s.lamp.intensity / 100 : 0
    if (lampLight.current) easing.damp(lampLight.current, 'intensity', 2 + lampK * 38, 0.3, dt)
    if (lampShade.current) {
      tmp.copy(WARM).multiplyScalar(0.35 + lampK * 3.2)
      easing.dampC(lampShade.current.color, tmp, 0.3, dt)
    }

    // LED strip frame
    const ledK = s.led.on ? s.led.brightness / 100 : 0
    tmp.set(s.led.color).multiplyScalar(0.05 + ledK * 2.6)
    if (ledCove.current) easing.dampC(ledCove.current.color, tmp, 0.35, dt)
    if (ledFrame.current) easing.dampC(ledFrame.current.color, tmp, 0.35, dt)

    // TV
    const tvOn = s.nodes.tv.on ? 1 : 0
    tv.offset.x = (t * 0.02) % 1
    if (tvScreen.current) {
      tmp.setScalar(0.02 + tvOn * 1.25)
      easing.dampC(tvScreen.current.color, tmp, 0.4, dt)
    }
    if (tvLight.current) easing.damp(tvLight.current, 'intensity', tvOn * 9, 0.4, dt)

    // CleanBot glides an eased loop when on, docks when off
    const b = botState.current
    const on = s.nodes.cleanbot.on
    if (on) b.t += dt * 0.12
    const tx = on ? -5.6 + Math.sin(b.t * Math.PI * 2) * 3.1 : -8.9
    const tz = on ? 3.0 + Math.sin(b.t * Math.PI * 4) * 0.75 : -1.3
    const nx = THREE.MathUtils.damp(b.x, tx, on ? 6 : 1.5, dt)
    const nz = THREE.MathUtils.damp(b.z, tz, on ? 6 : 1.5, dt)
    const vx = nx - b.x
    const vz = nz - b.z
    if (vx * vx + vz * vz > 1e-7) b.heading = Math.atan2(vx, vz)
    b.x = nx
    b.z = nz
    if (bot.current) {
      bot.current.position.set(b.x, Y + 0.01, b.z)
      easing.dampAngle(bot.current.rotation, 'y', b.heading, 0.2, dt)
    }
    if (botLed.current) {
      const blink = on ? 0.6 + 0.4 * Math.sin(t * 6) : 0.15
      botLed.current.color.setRGB(0.8 * blink * 2, 2 * blink, 0.6 * blink * 2)
    }
  })

  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[(PAV.x0 + PAV.x1) / 2, Y + 0.012, (PAV.z0 + PAV.z1) / 2]} material={mats.floor} receiveShadow>
        <planeGeometry args={[PAV.x1 - PAV.x0, PAV.z1 - PAV.z0]} />
      </mesh>
      {/* rug */}
      <mesh rotation-x={-Math.PI / 2} position={[-6.3, Y + 0.02, 1.9]} receiveShadow>
        <planeGeometry args={[4.4, 2.8]} />
        <meshStandardMaterial color="#cfc6b8" roughness={1} />
      </mesh>

      <mesh geometry={furniture} material={mats.wallInner} castShadow receiveShadow />

      {/* sofa (L) */}
      <group position={[-6.3, Y, 2.6]}>
        <RoundedBox args={[3.4, 0.42, 1.0]} position={[0, 0.21, 0]} radius={0.12} smoothness={3} material={mats.fabric} castShadow receiveShadow />
        <RoundedBox args={[3.4, 0.5, 0.28]} position={[0, 0.55, 0.42]} radius={0.12} smoothness={3} material={mats.fabric} castShadow />
        <RoundedBox args={[0.95, 0.42, 1.7]} position={[-1.22, 0.21, -0.85]} radius={0.12} smoothness={3} material={mats.fabric} castShadow />
      </group>
      {/* coffee table */}
      <mesh position={[-6.0, Y + 0.2, 1.25]} material={mats.wood} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 40]} />
      </mesh>
      <mesh position={[-6.0, Y + 0.08, 1.25]} material={mats.darkMatte}>
        <cylinderGeometry args={[0.1, 0.14, 0.16, 16]} />
      </mesh>

      {/* TV + LED frame backlight */}
      <mesh position={[TV.x, TV.y, TV.z - 0.06]}>
        <planeGeometry args={[TV.w + 0.5, TV.h + 0.4]} />
        <meshBasicMaterial ref={ledFrame} toneMapped={false} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[TV.x, TV.y, TV.z - 0.02]} material={mats.darkMatte}>
        <boxGeometry args={[TV.w + 0.04, TV.h + 0.04, 0.04]} />
      </mesh>
      <mesh position={[TV.x, TV.y, TV.z + 0.005]}>
        <planeGeometry args={[TV.w, TV.h]} />
        <meshBasicMaterial ref={tvScreen} map={tv} toneMapped={false} />
      </mesh>
      <pointLight ref={tvLight} position={[TV.x, TV.y, TV.z + 1.2]} color="#9aa7ff" intensity={0} distance={6} decay={2} />

      {/* Sonos Era 300 on the console */}
      <RoundedBox args={[0.34, 0.22, 0.26]} position={[-4.85, Y + 0.53, -0.1]} radius={0.08} smoothness={3} material={mats.darkMatte} castShadow />

      {/* LED cove strip along the front glazing head */}
      <mesh position={[(PAV.x0 + PAV.x1) / 2, PAV.y1 - 0.2, PAV.z1 - 0.35]}>
        <boxGeometry args={[PAV.x1 - PAV.x0 - 0.6, 0.035, 0.035]} />
        <meshBasicMaterial ref={ledCove} toneMapped={false} />
      </mesh>

      {/* Hue master lamp */}
      <group position={[LAMP.x, Y, LAMP.z]}>
        <mesh position={[0, 0.02, 0]} material={mats.darkMatte} castShadow>
          <cylinderGeometry args={[0.2, 0.22, 0.04, 24]} />
        </mesh>
        <mesh position={[0, 0.85, 0]} material={mats.darkMatte} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 1.7, 8]} />
        </mesh>
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial ref={lampShade} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <pointLight ref={lampLight} position={[0, 1.55, 0.25]} color={WARM} intensity={10} distance={9} decay={1.6} />
      </group>

      {/* pendant over the dining table */}
      <mesh position={[-1.5, PAV.y1 - 0.9, 1.75]} material={mats.darkMatte}>
        <cylinderGeometry args={[0.04, 0.32, 0.22, 24, 1, true]} />
      </mesh>

      {/* planters */}
      {[
        [-3.4, 3.7, 1.1],
        [4.9, 3.4, 0.9],
        [-9.2, -3.6, 1.2],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, Y, z]} scale={s}>
          <mesh position={[0, 0.28, 0]} material={mats.pot} castShadow>
            <cylinderGeometry args={[0.28, 0.22, 0.56, 24]} />
          </mesh>
          <mesh position={[0, 0.95, 0]} material={mats.leaf} castShadow>
            <icosahedronGeometry args={[0.5, 1]} />
          </mesh>
          <mesh position={[0.18, 1.3, 0.1]} material={mats.leafDark} castShadow>
            <icosahedronGeometry args={[0.34, 1]} />
          </mesh>
        </group>
      ))}

      {/* Aether CleanBot V4 */}
      <group ref={bot}>
        <mesh position={[0, 0.06, 0]} material={mats.white} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.1, 40]} />
        </mesh>
        <mesh position={[0, 0.13, -0.08]} material={mats.white}>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 24]} />
        </mesh>
        <mesh position={[0, 0.112, 0.22]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.035, 16]} />
          <meshBasicMaterial ref={botLed} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
