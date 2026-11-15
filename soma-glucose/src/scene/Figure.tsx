import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { NormalBlending, ShaderMaterial, Vector2, Vector3 } from 'three'
import { useSoma, type MetricId, type TabId } from '../store'
import { FRAG, VERT } from './figureShader'
import { F, SENSOR, projectSensor, type ViewMap } from './pose'

/* sensor-core colours per metric (linear RGB) */
const CORE: Record<MetricId, [number, number, number]> = {
  glucose: [0.72, 0.84, 0.09],
  hemoglobin: [0.87, 0.38, 0.27],
  ketones: [0.89, 0.65, 0.2],
  cholesterol: [0.53, 0.79, 0.58],
}

/* each tab gets its own light and a slightly different vantage */
const LOOK: Record<TabId, { cam: [number, number]; rim: [number, number, number]; key: [number, number, number]; rimI: number }> = {
  overview: { cam: [0, 0], rim: [1.0, 0.72, 0.5], key: [1.0, 0.93, 0.85], rimI: 1.0 },
  activity: { cam: [-0.6, 0.25], rim: [1.0, 0.6, 0.36], key: [1.05, 0.9, 0.76], rimI: 1.25 },
  recovery: { cam: [0.5, -0.15], rim: [0.7, 0.8, 1.0], key: [0.88, 0.92, 1.0], rimI: 0.9 },
  progress: { cam: [-0.25, -0.35], rim: [1.0, 0.8, 0.56], key: [1.0, 0.95, 0.88], rimI: 1.15 },
}

export interface Motion {
  /** normalised pointer, -1..1 */
  px: number
  py: number
  /** drag orbit offset (world), springs back to 0 */
  dx: number
  dy: number
  dragging: boolean
}

interface FigureProps {
  view: MutableRefObject<ViewMap>
  motion: MutableRefObject<Motion>
  /** receives the sensor's screen position every frame (CSS px) */
  onSensor: (x: number, y: number, k: number) => void
  reduced: boolean
}

export function Figure({ view, motion, onSensor, reduced }: FigureProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          uRes: { value: new Vector2(1, 1) },
          uDpr: { value: 1 },
          uScale: { value: 1 },
          uOrigin: { value: new Vector2(0, 0) },
          uCam: { value: new Vector2(0, 0) },
          uF: { value: F },
          uTime: { value: 0 },
          uBreath: { value: 0 },
          uPulse: { value: 0 },
          uCore: { value: new Vector3(...CORE.glucose) },
          uRimI: { value: 1 },
          uRimCol: { value: new Vector3(...LOOK.overview.rim) },
          uKeyCol: { value: new Vector3(...LOOK.overview.key) },
          uSP: { value: new Vector3(...SENSOR.p) },
          uSN: { value: new Vector3(...SENSOR.n) },
        },
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  /* live state without re-rendering: pulse on each new reading or metric change, tab kick */
  const pulse = useRef(0)
  const kick = useRef({ x: 0, y: 0 })
  const target = useRef({ metric: useSoma.getState().metric, tab: useSoma.getState().tab })
  useEffect(
    () =>
      useSoma.subscribe((s, prev) => {
        if (s.stats.current !== prev.stats.current || s.metric !== prev.metric) pulse.current = 1
        if (s.metric !== prev.metric) target.current.metric = s.metric
        if (s.tab !== prev.tab) {
          const from = LOOK[prev.tab].cam
          const to = LOOK[s.tab].cam
          kick.current.x = (to[0] - from[0] || 0.6) * 1.6
          kick.current.y = (to[1] - from[1]) * 1.6 + 0.25
          target.current.tab = s.tab
        }
      }),
    [],
  )

  const buf = useMemo(() => new Vector2(), [])
  const cam = useRef({ x: 0, y: 0 })

  useFrame((state, dt) => {
    const u = material.uniforms
    const t = state.clock.elapsedTime
    const m = motion.current
    const look = LOOK[target.current.tab]

    state.gl.getDrawingBufferSize(buf)
    u.uRes.value.copy(buf)
    u.uDpr.value = state.viewport.dpr
    u.uScale.value = view.current.scale
    u.uOrigin.value.set(view.current.originX, view.current.originY)
    u.uTime.value = t

    if (!m.dragging) {
      m.dx += (0 - m.dx) * (1 - Math.exp(-dt * 3.5))
      m.dy += (0 - m.dy) * (1 - Math.exp(-dt * 3.5))
    }
    kick.current.x *= Math.exp(-dt * 2.2)
    kick.current.y *= Math.exp(-dt * 2.2)
    const amp = reduced ? 0 : 1
    const tx = look.cam[0] + (m.px * 0.45 + kick.current.x) * amp + m.dx
    const ty = look.cam[1] + (-m.py * 0.3 + kick.current.y) * amp + m.dy
    easing.damp(cam.current, 'x', tx, 0.35, dt)
    easing.damp(cam.current, 'y', ty, 0.35, dt)
    u.uCam.value.set(cam.current.x, cam.current.y)

    const breath = reduced ? 0 : Math.sin(t * 1.05) * 0.022
    u.uBreath.value = breath

    pulse.current *= Math.exp(-dt * 1.8)
    u.uPulse.value = pulse.current

    easing.damp3(u.uCore.value, CORE[target.current.metric], 0.25, dt)
    easing.damp3(u.uRimCol.value, look.rim, 0.5, dt)
    easing.damp3(u.uKeyCol.value, look.key, 0.5, dt)
    easing.damp(u.uRimI, 'value', look.rimI, 0.5, dt)

    const sp = projectSensor(view.current, cam.current.x, cam.current.y, breath)
    onSensor(sp.x, sp.y, sp.k)
  })

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}

/** Exposed for the DOM layer: the current pulse value is not needed there; colours are. */
export const coreCss: Record<MetricId, string> = {
  glucose: '#dcec55',
  hemoglobin: '#f0a58c',
  ketones: '#f2d27a',
  cholesterol: '#bfe6c8',
}
