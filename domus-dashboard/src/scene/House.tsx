import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { easing } from 'maath'
import { useDomus } from '../store'
import { materials } from './materials'
import { mergeBoxes, mergePlanes, type BoxSpec } from './geometry'
import { DOOR, FIN_X1, PAV, PLINTH, SLAB, STAIRS, TOWER, TOWER_GLASS, WING, cx, cy, cz, sx, sy, sz } from './layout'
import { SolarArray } from './SolarArray'
import { Interior } from './Interior'

const M = 0.07 // mullion width
const FRONT_MULLIONS = [FIN_X1, -5.4, -3.8, -2.2, -0.6, 0.95, 2.4, DOOR.x0, DOOR.x1]
const SIDE_MULLIONS = [-3.3, -1.7, -0.1, 1.5, 3.05]
const TOWER_MULLIONS = [-3.2, -1.6, 0, 1.6, 3.2, 4.8, 6.4]

function useGeometry() {
  return useMemo(() => {
    const zf = PAV.z1
    /* ── black frames: mullions, fins, head & sill rails ── */
    const frames: BoxSpec[] = []
    for (const x of FRONT_MULLIONS) frames.push([x - M / 2, x + M / 2, PAV.y0, PAV.y1, zf - 0.05, zf + 0.05])
    // dense fins on the left part of the façade (as in the reference)
    for (let x = PAV.x0 + 0.08; x < FIN_X1 - 0.1; x += 0.42) frames.push([x - 0.035, x + 0.035, PAV.y0, PAV.y1, zf - 0.02, zf + 0.22])
    frames.push([PAV.x0, PAV.x1, PAV.y1 - 0.08, PAV.y1, zf - 0.06, zf + 0.06]) // head
    frames.push([PAV.x0, PAV.x1, PAV.y0, PAV.y0 + 0.08, zf - 0.06, zf + 0.06]) // sill
    // right end façade (faces the camera)
    const xr = PAV.x1
    for (const z of [PAV.z0, ...SIDE_MULLIONS, PAV.z1]) frames.push([xr - 0.05, xr + 0.05, PAV.y0, PAV.y1, z - M / 2, z + M / 2])
    frames.push([xr - 0.06, xr + 0.06, PAV.y1 - 0.08, PAV.y1, PAV.z0, PAV.z1])
    frames.push([xr - 0.06, xr + 0.06, PAV.y0, PAV.y0 + 0.08, PAV.z0, PAV.z1])
    // tower glazing above the slab
    const tz = TOWER.z1
    const ty0 = TOWER_GLASS.y0
    const ty1 = TOWER_GLASS.y1
    for (const x of TOWER_MULLIONS) frames.push([x - M / 2, x + M / 2, ty0, ty1, tz - 0.05, tz + 0.05])
    frames.push([TOWER.x0 + 0.8, TOWER.x1, ty1 - 0.08, ty1, tz - 0.06, tz + 0.06])
    frames.push([TOWER.x0 + 0.8, TOWER.x1, ty0, ty0 + 0.08, tz - 0.06, tz + 0.06])
    // tower horizontal transom (gives the "grid" reading of the reference)
    frames.push([TOWER.x0 + 0.8, TOWER.x1, (ty0 + ty1) / 2, (ty0 + ty1) / 2 + 0.05, tz - 0.04, tz + 0.04])
    // wing glazing
    for (let z = WING.z0 + 0.2; z <= WING.z1; z += 1.55) frames.push([WING.x1 - 0.04, WING.x1 + 0.06, 0.45, 2.85, z - 0.035, z + 0.035])
    for (let x = WING.x0 + 0.9; x <= WING.x1; x += 1.6) frames.push([x - 0.035, x + 0.035, 0.45, 2.85, WING.z1 - 0.04, WING.z1 + 0.06])
    // lower-level window band in the podium (front-left)
    for (let x = PLINTH.x0 + 0.4; x < STAIRS.x0 - 0.3; x += 1.1) frames.push([x - 0.03, x + 0.03, 0.16, 0.84, PLINTH.z1 - 0.02, PLINTH.z1 + 0.02])

    /* ── glass panes ── */
    const panes: Parameters<typeof mergePlanes>[0] = []
    const fx = [PAV.x0, ...FRONT_MULLIONS, PAV.x1]
    for (let i = 0; i < fx.length - 1; i++) {
      if (fx[i] === DOOR.x0) continue // door bay (separate, animated)
      panes.push({ axis: 'z', at: zf, a0: fx[i], a1: fx[i + 1], y0: PAV.y0 + 0.08, y1: PAV.y1 - 0.08 })
    }
    panes.push({ axis: 'x', at: xr, a0: PAV.z0, a1: PAV.z1, y0: PAV.y0 + 0.08, y1: PAV.y1 - 0.08, flip: false })
    panes.push({ axis: 'z', at: tz, a0: TOWER.x0 + 0.8, a1: TOWER.x1, y0: ty0, y1: ty1 })
    panes.push({ axis: 'x', at: WING.x1 + 0.01, a0: WING.z0, a1: WING.z1, y0: 0.45, y1: 2.85 })
    panes.push({ axis: 'z', at: WING.z1 + 0.01, a0: WING.x0, a1: WING.x1, y0: 0.45, y1: 2.85 })

    /* ── white masonry (merged) ── */
    // interior faces get the softly self-lit interior material (fakes bounce light under the slab)
    const inner: BoxSpec[] = [
      [PAV.x0, PAV.x0 + 0.3, PAV.y0, PAV.y1, PAV.z0, PAV.z1], // left end wall
      [PAV.x0, PAV.x1, PAV.y0, PAV.y1, PAV.z0, PAV.z0 + 0.3], // back wall
      [0.9, 2.2, PAV.y0, PAV.y1, PAV.z0, -0.2], // service core
    ]
    const walls: BoxSpec[] = [
      // tower body
      [TOWER.x0, TOWER.x0 + 0.8, ty0 - 1, ty1 + 0.3, TOWER.z0, TOWER.z1 + 0.02], // tower left pier
      [TOWER.x0, TOWER.x1, ty0 - 1, ty1, TOWER.z0, TOWER.z1 - 0.6], // tower mass
      // wing body
      [WING.x0, WING.x1, 0, 0.45, WING.z0, WING.z1 + 0.05],
      [WING.x0, WING.x0 + 0.3, 0, WING.y1, WING.z0, WING.z1],
      [WING.x0, WING.x1, 0, WING.y1, WING.z0, WING.z0 + 0.3],
    ]
    // stairs
    for (let i = 0; i < STAIRS.steps; i++) {
      const top = PLINTH.y1 - (i + 1) * (PLINTH.y1 / (STAIRS.steps + 1))
      walls.push([STAIRS.x0, STAIRS.x1, 0, top, PLINTH.z1 + i * STAIRS.tread, PLINTH.z1 + (i + 1) * STAIRS.tread])
    }
    // dark reveal under the tower roof
    const reveals: BoxSpec[] = [[TOWER.x0 + 0.6, TOWER.x1 + 0.1, ty1, ty1 + 0.3, TOWER.z1 - 0.3, TOWER.z1 - 0.1]]
    // lower-level glazing band
    const bandGlass: Parameters<typeof mergePlanes>[0] = [
      { axis: 'z', at: PLINTH.z1 + 0.005, a0: PLINTH.x0 + 0.3, a1: STAIRS.x0 - 0.3, y0: 0.16, y1: 0.84 },
    ]

    const lip: BoxSpec[] = [
      [SLAB.x0 + 0.1, SLAB.x1 - 0.1, SLAB.y1, SLAB.y1 + 0.12, SLAB.z1 - 0.32, SLAB.z1 - 0.1],
      [SLAB.x0 + 0.1, SLAB.x1 - 0.1, SLAB.y1, SLAB.y1 + 0.12, SLAB.z0 + 0.1, SLAB.z0 + 0.32],
      [SLAB.x0 + 0.1, SLAB.x0 + 0.32, SLAB.y1, SLAB.y1 + 0.12, SLAB.z0 + 0.1, SLAB.z1 - 0.1],
      [SLAB.x1 - 0.32, SLAB.x1 - 0.1, SLAB.y1, SLAB.y1 + 0.12, SLAB.z0 + 0.1, SLAB.z1 - 0.1],
    ]
    const skylights: BoxSpec[] = Array.from({ length: 5 }, (_, i): BoxSpec => {
      const x0 = TOWER.x0 + 1.1 + i * 2.2
      return [x0, x0 + 2.05, TOWER.y1, TOWER.y1 + 0.05, TOWER.z0 + 0.9, TOWER.z1 - 0.9]
    })

    return {
      inner: mergeBoxes(inner),
      lip: mergeBoxes(lip),
      skylights: mergeBoxes(skylights),
      frames: mergeBoxes(frames),
      panes: mergePlanes(panes),
      walls: mergeBoxes(walls),
      reveals: mergeBoxes(reveals),
      bandGlass: mergePlanes(bandGlass),
    }
  }, [])
}

/** Sliding front door: springs open when unlocked. */
function FrontDoor() {
  const g = useRef<THREE.Group>(null)
  const locked = useDomus((s) => s.door.locked)
  const mats = materials()
  const w = DOOR.x1 - DOOR.x0
  const h = PAV.y1 - PAV.y0 - 0.16
  useFrame((_, dt) => {
    if (!g.current) return
    easing.damp(g.current.position, 'x', locked ? 0 : -DOOR.slide, 0.45, dt)
  })
  return (
    <group position={[DOOR.x0 + w / 2, PAV.y0 + 0.08 + h / 2, PAV.z1 - 0.09]}>
      <group ref={g}>
        <mesh material={mats.glass} renderOrder={2}>
          <planeGeometry args={[w - 0.1, h - 0.1]} />
        </mesh>
        {/* frame */}
        <mesh material={mats.frame} castShadow position={[0, h / 2 - 0.04, 0]}>
          <boxGeometry args={[w, 0.08, 0.06]} />
        </mesh>
        <mesh material={mats.frame} position={[0, -h / 2 + 0.04, 0]}>
          <boxGeometry args={[w, 0.08, 0.06]} />
        </mesh>
        <mesh material={mats.frame} position={[-w / 2 + 0.04, 0, 0]}>
          <boxGeometry args={[0.08, h, 0.06]} />
        </mesh>
        <mesh material={mats.frame} position={[w / 2 - 0.04, 0, 0]}>
          <boxGeometry args={[0.08, h, 0.06]} />
        </mesh>
        {/* pull handle */}
        <mesh material={mats.solarFrame} position={[w / 2 - 0.22, 0, 0.07]}>
          <boxGeometry args={[0.04, 1.1, 0.04]} />
        </mesh>
      </group>
    </group>
  )
}

/** Lime outline that lights up the Main Hall when it is focused or hovered. */
function HallHighlight({ hovered }: { hovered: React.RefObject<boolean> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const focus = useDomus((s) => s.focus)
  const geo = useMemo(() => {
    const y = PAV.y0 + 0.03
    const t = 0.05
    return mergeBoxes([
      [PAV.x0, PAV.x1, y, y + t, PAV.z1 + 0.12, PAV.z1 + 0.16],
      [PAV.x1 + 0.12, PAV.x1 + 0.16, y, y + t, PAV.z0, PAV.z1 + 0.16],
      [PAV.x0, PAV.x1, PAV.y1 - 0.12, PAV.y1 - 0.08, PAV.z1 + 0.07, PAV.z1 + 0.1],
    ])
  }, [])
  useFrame((_, dt) => {
    if (!mat.current) return
    const on = focus === 'main-hall' ? 1 : hovered.current ? 0.55 : 0
    easing.damp(mat.current, 'opacity', on, 0.25, dt)
    mat.current.visible = mat.current.opacity > 0.01
  })
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial ref={mat} color={[1.35, 1.9, 0.95]} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export function House() {
  const geo = useGeometry()
  const mats = materials()
  const selectRoom = useDomus((s) => s.selectRoom)
  const setFocus = useDomus((s) => s.setFocus)
  const hallHover = useRef(false)

  const onHallClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return
    e.stopPropagation()
    selectRoom('main-hall')
    setFocus('main-hall')
  }
  const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hallHover.current = on
    document.body.style.cursor = on ? 'pointer' : ''
  }

  return (
    <group>
      {/* Podium */}
      <RoundedBox
        args={[sx(PLINTH), sy(PLINTH), sz(PLINTH)]}
        position={[cx(PLINTH), cy(PLINTH), cz(PLINTH)]}
        radius={0.06}
        smoothness={2}
        material={mats.concrete}
        receiveShadow
        castShadow
      />
      <mesh geometry={geo.bandGlass} material={mats.glassDark} renderOrder={1} />

      {/* Masonry */}
      <mesh geometry={geo.walls} material={mats.concrete} castShadow receiveShadow />
      <mesh geometry={geo.inner} material={mats.wallInner} castShadow receiveShadow />
      <mesh geometry={geo.reveals} material={mats.darkMatte} />

      {/* Roof slab over the pavilion */}
      <RoundedBox
        args={[sx(SLAB), sy(SLAB), sz(SLAB)]}
        position={[cx(SLAB), cy(SLAB), cz(SLAB)]}
        radius={0.22}
        smoothness={4}
        material={mats.concrete}
        castShadow
        receiveShadow
      />
      {/* roof lip */}
      <mesh geometry={geo.lip} material={mats.concrete} castShadow receiveShadow />

      {/* Tower roof (taller back-right volume) */}
      <RoundedBox
        args={[sx(TOWER) + 1.1, TOWER.y1 - TOWER_GLASS.y1 - 0.3, sz(TOWER) + 1.1]}
        position={[cx(TOWER) + 0.1, (TOWER_GLASS.y1 + 0.3 + TOWER.y1) / 2, cz(TOWER)]}
        radius={0.22}
        smoothness={4}
        material={mats.concrete}
        castShadow
        receiveShadow
      />
      {/* skylight strips on the tower roof */}
      <mesh geometry={geo.skylights} material={mats.concreteShade} receiveShadow />

      {/* Wing roof */}
      <RoundedBox
        args={[sx(WING) + 0.6, 0.5, sz(WING) + 0.6]}
        position={[cx(WING) + 0.3, WING.y1 - 0.25 + 0.2, cz(WING)]}
        radius={0.15}
        smoothness={3}
        material={mats.concrete}
        castShadow
        receiveShadow
      />

      {/* Black frames + glass */}
      <mesh geometry={geo.frames} material={mats.frame} castShadow />
      <Interior />
      <FrontDoor />
      <mesh
        geometry={geo.panes}
        material={mats.glass}
        renderOrder={2}
        onClick={onHallClick}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      />
      <HallHighlight hovered={hallHover} />

      <SolarArray />
    </group>
  )
}
