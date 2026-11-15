import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { Color, Vector3, type Mesh } from 'three'
import { useFace, type ScanMode } from '../store'
import { headRegistry } from '../lib/face'
import { createThermalMaterial, PALETTES } from './thermalMaterial'
import { useHeadGeometry } from './useHeadGeometry'

const MODE_W: Record<ScanMode, [number, number, number]> = {
  thermal: [1, 0, 0],
  depth: [0, 1, 0],
  mesh: [0, 0, 1],
}

/** The sculpted head (fine mesh, raycastable) + shoulders, both in the thermal shader. */
export function Head() {
  const geo = useHeadGeometry()
  const headMat = useMemo(() => createThermalMaterial(false), [])
  const bodyMat = useMemo(() => createThermalMaterial(true), [])
  const headRef = useRef<Mesh>(null)
  const born = useRef(-1)
  const tmp = useMemo(() => ({ c: [new Color(), new Color(), new Color(), new Color()], mode: new Vector3() }), [])

  useEffect(() => {
    if (!geo || !headRef.current) return
    headRegistry.mesh = headRef.current
    return () => {
      if (headRegistry.mesh === headRef.current) headRegistry.mesh = null
    }
  }, [geo])

  useEffect(
    () => () => {
      headMat.dispose()
      bodyMat.dispose()
    },
    [headMat, bodyMat],
  )

  useFrame((state, dt) => {
    if (!geo) return
    const s = useFace.getState()
    const t = state.clock.elapsedTime
    if (born.current < 0) born.current = t

    // palette + mode crossfade
    const pal = PALETTES[s.scan.palette]
    for (let i = 0; i < 4; i++) tmp.c[i].set(pal[i])
    const w = MODE_W[s.scan.mode]
    tmp.mode.set(w[0], w[1], w[2])

    // cardiac pulse: sharp systolic rise, slow decay
    const beat = (t * s.vitals.heartRate) / 60
    const f = beat - Math.floor(beat)
    const pulse = Math.exp(-Math.pow((f - 0.12) / 0.08, 2))

    // scan sweep travels top → bottom with progress; a faint idle sweep afterwards
    const running = s.scan.running
    const p = s.scan.progress / 100
    const idle = ((t * 0.12) % 1.6) / 1.6
    const scanY = running ? 1.2 - p * 2.6 : 1.2 - idle * 3.2
    const scanOn = running ? 1 : 0.18

    for (const m of [headMat, bodyMat]) {
      const u = m.uniforms
      u.uTime.value = t
      easing.dampC(u.uDark.value, tmp.c[0], 0.35, dt)
      easing.dampC(u.uMid.value, tmp.c[1], 0.35, dt)
      easing.dampC(u.uHot.value, tmp.c[2], 0.35, dt)
      easing.dampC(u.uWhite.value, tmp.c[3], 0.35, dt)
      easing.damp3(u.uMode.value, tmp.mode, 0.3, dt)
      u.uPulse.value = pulse
      u.uScanY.value = scanY
      easing.damp(u.uScanOn, 'value', scanOn, 0.5, dt)
      u.uReveal.value = Math.min(1, (t - born.current) / 1.4)
    }
  })

  if (!geo) return null
  return (
    <>
      <mesh ref={headRef} geometry={geo.head} material={headMat} name="head" />
      <mesh geometry={geo.body} material={bodyMat} name="shoulders" raycast={() => null} />
    </>
  )
}
