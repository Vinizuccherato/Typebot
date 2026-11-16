import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, Group, Matrix4, Mesh, Quaternion, Vector3, type Material } from 'three'
import type { GlassesId } from '../store'
import { anchors } from './anchors'
import { buildGlasses, CANON_IPD, type BuiltGlasses } from './glassesGeometry'

/* ──────────────────────────────────────────────────────────────
   Fits the procedural frames to the face: bridge on the nasion, lenses
   centred on the pupils (scaled to the IPD), temples running back to the
   ears. Re-fitted whenever the morphed anchors move (face-form sliders).
   Style changes pop out → swap → spring in.
   ────────────────────────────────────────────────────────────── */

const unitBox = new BoxGeometry(1, 1, 1).translate(0, 0, 0.5) // extends along +Z from the origin

const _a = new Vector3()
const _b = new Vector3()
const _mid = new Vector3()
const _m = new Matrix4()
const _q = new Quaternion()
const _s = new Vector3()
const Z = new Vector3(0, 0, 1)

/** Place a unit box between two points with a given cross-section. */
function strut(mesh: Mesh, from: Vector3, to: Vector3, w: number, h: number) {
  const dir = _mid.subVectors(to, from)
  const len = dir.length()
  _q.setFromUnitVectors(Z, dir.divideScalar(len || 1))
  _s.set(w, h, len)
  _m.compose(from, _q, _s)
  mesh.matrix.copy(_m)
  mesh.matrixWorldNeedsUpdate = true
}

function setOpacity(mats: Material[], o: number) {
  for (const m of mats) {
    const base = (m.userData.baseOpacity as number | undefined) ?? (m.userData.baseOpacity = m.opacity)
    m.opacity = base * o
    m.visible = o > 0.01
  }
}

export function Glasses({ style, weight, faded }: { style: GlassesId; weight: number; faded: boolean }) {
  // the style on screen lags the requested one while the old pair pops out
  const [shown, setShown] = useState<GlassesId>(style)
  const pop = useRef(style === 'none' ? 0 : 1)
  const built = useMemo<BuiltGlasses | null>(() => (shown === 'none' ? null : buildGlasses(shown, weight)), [shown, weight])
  useEffect(
    () => () => {
      if (!built) return
      built.frame.dispose()
      built.metal?.dispose()
      built.lens.dispose()
      built.frameMat.dispose()
      built.metalMat.dispose()
      built.lensMat.dispose()
    },
    [built],
  )

  const rig = useRef<Group>(null)
  const templeR = useRef<Mesh>(null)
  const templeL = useRef<Mesh>(null)
  const tipR = useRef<Mesh>(null)
  const tipL = useRef<Mesh>(null)
  const fitRev = useRef(-1)
  const builtRef = useRef(built)
  builtRef.current = built
  // a new pair (style or rim weight) needs a fresh fit
  useEffect(() => void (fitRev.current = -1), [built])

  useFrame((_, dt) => {
    // pop out → swap → pop in
    const target = style === shown && style !== 'none' ? 1 : 0
    pop.current += (target - pop.current) * (1 - Math.exp(-dt * (target ? 9 : 14)))
    if (style !== shown && pop.current < 0.03) {
      pop.current = 0
      setShown(style)
    }
    const g = rig.current
    const b = builtRef.current
    if (!g || !b) return

    const p = anchors.morphed
    if (fitRev.current !== anchors.rev) {
      fitRev.current = anchors.rev
      // lenses on the pupils, bridge resting on the nasion
      const ipd = p.pupilL.distanceTo(p.pupilR)
      const s = (ipd / CANON_IPD) * 0.95
      _mid.addVectors(p.pupilL, p.pupilR).multiplyScalar(0.5)
      const z = Math.max(p.nasion.z + 0.045, p.pupilL.z + 0.17)
      // pupils sit a touch above the optical centre, as with real frames
      g.position.set(_mid.x, _mid.y - 0.018, z)
      g.rotation.set(-0.07, 0, Math.atan2(p.pupilL.y - p.pupilR.y, p.pupilL.x - p.pupilR.x))
      g.scale.setScalar(s)
      g.updateMatrix()
      // temples: hinge → just above the ear, then a short bend behind it
      const [tw, th] = b.templeSize
      for (const [mesh, tip, hinge, ear] of [
        [templeR.current, tipR.current, b.hinge[0], p.tragusR],
        [templeL.current, tipL.current, b.hinge[1], p.tragusL],
      ] as const) {
        if (!mesh || !tip) continue
        _a.copy(hinge).applyMatrix4(g.matrix)
        _b.set(ear.x * 0.98, ear.y + 0.075, ear.z + 0.08)
        strut(mesh, _a, _b, tw * s, th * s)
        _a.copy(_b)
        _b.set(ear.x * 0.97, ear.y - 0.02, ear.z - 0.06)
        strut(tip, _a, _b, tw * s, th * s * 0.8)
      }
    }
    // spring scale + fade
    const e = pop.current
    const k = 0.9 + 0.1 * e
    g.scale.setScalar((p.pupilL.distanceTo(p.pupilR) / CANON_IPD) * 0.95 * k)
    const fade = e * (faded ? 0.45 : 1)
    setOpacity([b.frameMat, b.metalMat], fade)
    b.lensMat.opacity = ((b.lensMat.userData.baseOpacity as number | undefined) ?? (b.lensMat.userData.baseOpacity = b.lensMat.opacity)) * fade
    b.lensMat.visible = fade > 0.01
  })

  if (!built) return null
  return (
    <group>
      <group ref={rig} renderOrder={4}>
        <mesh geometry={built.frame} material={built.frameMat} castShadow />
        {built.metal && <mesh geometry={built.metal} material={built.metalMat} />}
        <mesh geometry={built.lens} material={built.lensMat} renderOrder={6} />
      </group>
      <mesh ref={templeR} geometry={unitBox} material={built.frameMat} matrixAutoUpdate={false} />
      <mesh ref={templeL} geometry={unitBox} material={built.frameMat} matrixAutoUpdate={false} />
      <mesh ref={tipR} geometry={unitBox} material={built.frameMat} matrixAutoUpdate={false} />
      <mesh ref={tipL} geometry={unitBox} material={built.frameMat} matrixAutoUpdate={false} />
    </group>
  )
}
