/** 'skin' is a sculpted bust: mostly clay, a hint of tone in hair/beard; eyes are carved like a statue's. */
const SKIN_CLAY = 0.62
const EYE_CLAY = 0.94
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Color, Raycaster, Vector2, Vector3, type Group, type Material, type Mesh, type Object3D } from 'three'
import { easing } from 'maath'
import { useHeadGeometry } from '../geo/useHeadGeometry'
import { HAIR_SHAPES, BEARD_SHAPES } from '../geo/buildGeometry'
import type { BeardShape, HairShape } from '../geo/sdf'
import { createShellMaterial, createSkinMaterial, createSkinUniforms, type ShellUniforms } from './materials'
import { createFxUniforms, createScan, scanY, SCAN_BOTTOM } from './fx'
import { Eyes } from './Eyes'
import { Landmarks } from './Landmarks'
import { anchors } from './anchors'
import { REGION_IDS, regionIndex } from './regions'
import type { RegionId, StyleSpec } from '../../store'

/* ──────────────────────────────────────────────────────────────
   The client's head: male sculpt + eyes + hair/beard shells, styled
   live from a StyleSpec, in head-local space (1 unit = 10 cm, origin =
   nasion, +Z to the viewer). Three looks: skin, scan (hologram), map
   (matte clay for the LZ-01 region map).
   ────────────────────────────────────────────────────────────── */

export interface Pose {
  yaw: number
  pitch: number
  zoom: number
  dragging: boolean
}

/** rotation pivot ≈ top of the neck, so turns look natural */
const PIVOT = new Vector3(0, -0.6, -0.75)
const POSE_YAW = { front: 0, threeQuarter: 0.72, profile: 1.5 } as const

type HairSpec = { shell: HairShape | null; fade: number; scalp: number }
const HAIR: Record<StyleSpec['hair'], HairSpec> = {
  current: { shell: 'current', fade: 0, scalp: 0 },
  buzz: { shell: null, fade: 0, scalp: 0.85 },
  'textured-crop': { shell: 'textured-crop', fade: 1, scalp: 0 },
  'side-part': { shell: 'side-part', fade: 0.85, scalp: 0 },
  'slick-back': { shell: 'slick-back', fade: 0.85, scalp: 0 },
  'medium-flow': { shell: 'medium-flow', fade: 0, scalp: 0 },
}
const FLOW: Record<HairShape, number> = { current: 0, 'textured-crop': 1, 'side-part': 2, 'slick-back': 3, 'medium-flow': 0 }
const BEARD: Record<StyleSpec['beard'], { shell: BeardShape | null; stubble: number; shadow: number }> = {
  clean: { shell: null, stubble: 0, shadow: 0.7 },
  stubble: { shell: null, stubble: 1, shadow: 0.45 },
  'short-boxed': { shell: 'short-boxed', stubble: 0.25, shadow: 0.35 },
  full: { shell: 'full', stubble: 0.3, shadow: 0.35 },
  goatee: { shell: 'goatee', stubble: 0.12, shadow: 0.55 },
}
const BROW: Record<StyleSpec['brows'], [number, number, number]> = {
  natural: [1, 0, 0.3],
  'clean-up': [0.95, 1, 0.5],
  defined: [1.12, 1, 0.9],
}

export interface RegionLayer {
  show: boolean
  active?: RegionId | null
  /** DOM hotspot elements (owned by FaceView), positioned every frame */
  els: React.MutableRefObject<Partial<Record<RegionId, HTMLElement | null>>>
  /** pending pick request in host px (set by FaceView on click), consumed here */
  pick: React.MutableRefObject<{ x: number; y: number } | null>
  onSelect?: (id: RegionId) => void
}

interface Props {
  material: 'skin' | 'scan' | 'map'
  scan?: number
  style: StyleSpec
  pose: React.MutableRefObject<Pose>
  posePreset?: keyof typeof POSE_YAW
  landmarks?: boolean
  autoRotate?: boolean
  regions?: RegionLayer
}

const byKey = <K extends string, V>(keys: K[], f: (k: K) => V) => Object.fromEntries(keys.map((k) => [k, f(k)])) as unknown as Record<K, V>

const _v = new Vector3()
const _n = new Vector3()
const _ndc = new Vector2()

export function HeadModel({ material, scan, style, pose, posePreset, landmarks, autoRotate, regions }: Props) {
  const geo = useHeadGeometry()
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const skinU = useMemo(createSkinUniforms, [])
  const eyeClay = useMemo(() => ({ value: 0 }), [])
  const shellU = useMemo(() => {
    const mk = (beard: boolean): ShellUniforms => ({ uTone: { value: new Color() }, uShow: { value: 0 }, uFlow: { value: beard ? 4 : 0 }, uKeyView: { value: new Vector3() }, uHi: { value: 0 }, uClay: skinU.uClay, uTime: skinU.uTime })
    return {
      hair: byKey<HairShape, ShellUniforms>(HAIR_SHAPES, (s) => ({ ...mk(false), uFlow: { value: FLOW[s] } })),
      beard: byKey<BeardShape, ShellUniforms>(BEARD_SHAPES, () => mk(true)),
    }
  }, [skinU])
  const fxU = useMemo(createFxUniforms, [])

  const mats = useMemo(() => {
    if (material === 'scan') {
      const head = createScan(fxU, 1)
      const body = createScan(fxU, 0.8)
      const hair = createScan(fxU, 0.55)
      const eye = createScan(fxU, 0.6, true)
      return { head, body, hair: byKey<HairShape, Material>(HAIR_SHAPES, () => hair), beard: byKey<BeardShape, Material>(BEARD_SHAPES, () => hair), eye: eye as Material | null, owned: [head, body, hair, eye] as Material[] }
    }
    const head = createSkinMaterial('head', skinU)
    const body = createSkinMaterial('body', skinU)
    const hair = byKey<HairShape, Material>(HAIR_SHAPES, (s) => createShellMaterial(shellU.hair[s]))
    const beard = byKey<BeardShape, Material>(BEARD_SHAPES, (s) => createShellMaterial(shellU.beard[s], true))
    return { head, body, hair, beard, eye: null, owned: [head, body, ...Object.values(hair), ...Object.values(beard)] as Material[] }
  }, [material, skinU, shellU, fxU])
  useEffect(() => () => mats.owned.forEach((m) => m.dispose()), [mats])

  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const headMesh = useRef<Mesh>(null)
  const hairMeshes = useRef<Partial<Record<HairShape, Mesh | null>>>({})
  const beardMeshes = useRef<Partial<Record<BeardShape, Mesh | null>>>({})
  const gaze = useRef(new Vector3(0, 0, 12))
  const keyWorld = useMemo(() => new Vector3(-0.55, 0.5, 1).normalize(), [])
  const targets = useMemo(() => ({ hair: new Color(), beard: new Color() }), [])
  const born = useRef(-1)
  const ray = useMemo(() => new Raycaster(), [])

  const hairSpec = HAIR[style.hair]
  const beardSpec = BEARD[style.beard]

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (born.current < 0) born.current = t
    skinU.uTime.value = t
    fxU.uTime.value = t
    fxU.uReveal.value = Math.min(1, (t - born.current) / 0.8)
    easing.damp(fxU.uScanY, 'value', scan === undefined ? SCAN_BOTTOM - 1 : scanY(scan), 0.12, dt)
    easing.damp(fxU.uSweep, 'value', scan !== undefined && scan < 100 ? 1 : 0, 0.25, dt)

    // style → uniforms (eased: changes morph instead of popping)
    easing.dampC(skinU.uHairTone.value, targets.hair.set(style.hairTone), 0.2, dt)
    easing.dampC(skinU.uBeardTone.value, targets.beard.set(style.beardTone), 0.2, dt)
    easing.damp(skinU.uGroom.value, 'x', beardSpec.stubble, 0.25, dt)
    easing.damp(skinU.uGroom.value, 'y', beardSpec.shadow, 0.25, dt)
    // carved beard relief on the face surface (skin/map); scan keeps the shell meshes
    easing.damp(skinU.uBeard.value, 'x', beardSpec.shell === 'short-boxed' ? 1 : 0, 0.25, dt)
    easing.damp(skinU.uBeard.value, 'y', beardSpec.shell === 'full' ? 1 : 0, 0.25, dt)
    easing.damp(skinU.uBeard.value, 'z', beardSpec.shell === 'goatee' ? 1 : 0, 0.25, dt)
    easing.damp(skinU.uGroom.value, 'z', hairSpec.scalp, 0.25, dt)
    easing.damp(skinU.uFade.value, 'x', hairSpec.fade, 0.25, dt)
    const bw = BROW[style.brows]
    easing.damp(skinU.uBrow.value, 'x', bw[0], 0.2, dt)
    easing.damp(skinU.uBrow.value, 'y', bw[1], 0.2, dt)
    easing.damp(skinU.uBrow.value, 'z', bw[2], 0.2, dt)
    easing.damp(skinU.uClay, 'value', material === 'map' ? 1 : SKIN_CLAY, 0.25, dt)
    easing.damp(eyeClay, 'value', material === 'map' ? 1 : EYE_CLAY, 0.25, dt)
    const ri = regions?.show ? regionIndex(regions.active) : -1
    if (ri >= 0) skinU.uRegion.value = ri
    easing.damp(skinU.uRegionAmt, 'value', ri >= 0 ? 1 : 0, 0.2, dt)

    const kv = _v.copy(keyWorld).transformDirection(camera.matrixWorldInverse)
    for (const s of HAIR_SHAPES) {
      const u = shellU.hair[s]
      u.uTone.value.copy(skinU.uHairTone.value)
      u.uKeyView.value.copy(kv)
      easing.damp(u.uShow, 'value', hairSpec.shell === s ? 1 : 0, 0.22, dt)
      easing.damp(u.uHi, 'value', regions?.show && regions.active === 'hair' ? 1 : 0, 0.2, dt)
      const m = hairMeshes.current[s]
      if (m) m.visible = material === 'scan' ? hairSpec.shell === s : u.uShow.value > 0.01
    }
    for (const s of BEARD_SHAPES) {
      const u = shellU.beard[s]
      u.uTone.value.copy(skinU.uBeardTone.value)
      u.uKeyView.value.copy(kv)
      easing.damp(u.uShow, 'value', beardSpec.shell === s ? 1 : 0, 0.22, dt)
      easing.damp(u.uHi, 'value', regions?.show && regions.active === 'beard' ? 1 : 0, 0.2, dt)
      const m = beardMeshes.current[s]
      if (m) m.visible = material === 'scan' && beardSpec.shell === s
    }

    // pose: preset + drag + idle life
    const P = pose.current
    const idle = P.dragging ? 0 : 1
    const base = posePreset ? POSE_YAW[posePreset] : 0
    const sway = autoRotate && !P.dragging ? Math.sin(t * 0.32) * 0.5 : 0
    const yaw = base + P.yaw + sway + idle * (Math.sin(t * 0.35) * 0.05 + (posePreset ? 0 : state.pointer.x * 0.12))
    const pitch = P.pitch + idle * (Math.sin(t * 0.27 + 1) * 0.02 - state.pointer.y * 0.05)
    if (outer.current) {
      easing.damp(outer.current.rotation, 'y', yaw, P.dragging ? 0.05 : 0.3, dt)
      easing.damp(outer.current.rotation, 'x', -pitch, P.dragging ? 0.05 : 0.3, dt)
      outer.current.position.y = PIVOT.y + Math.sin(t * 1.1) * 0.004 // breathing
    }
    gaze.current.set(state.pointer.x * 2.5, state.pointer.y * 1.2 - 0.8, 12) // relaxed, slightly lowered gaze

    // region hotspots: project anchors to host px; hide when facing away
    if (regions && inner.current) {
      const els = regions.els.current
      for (const id of REGION_IDS) {
        const el = els[id]
        if (!el) continue
        const a = anchors.regions[id]
        _v.copy(a.p).applyMatrix4(inner.current.matrixWorld)
        _n.copy(a.n).transformDirection(inner.current.matrixWorld)
        const facing = _n.dot(_v.clone().sub(camera.position).normalize().negate())
        _v.project(camera)
        const x = (_v.x * 0.5 + 0.5) * size.width
        const y = (-_v.y * 0.5 + 0.5) * size.height
        const vis = regions.show && facing > 0.12 ? Math.min(1, (facing - 0.12) / 0.2) : 0
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`
        el.style.opacity = String(vis)
        el.style.pointerEvents = vis > 0.4 ? 'auto' : 'none'
      }
      // surface pick
      const pk = regions.pick.current
      if (pk && headMesh.current) {
        regions.pick.current = null
        _ndc.set((pk.x / size.width) * 2 - 1, -(pk.y / size.height) * 2 + 1)
        ray.setFromCamera(_ndc, camera)
        const targetsO: Object3D[] = [headMesh.current]
        for (const s of HAIR_SHAPES) if (hairMeshes.current[s]?.visible) targetsO.push(hairMeshes.current[s]!)
        for (const s of BEARD_SHAPES) if (beardMeshes.current[s]?.visible) targetsO.push(beardMeshes.current[s]!)
        const hit = ray.intersectObjects(targetsO, false)[0]
        if (hit) {
          let id: RegionId | null = null
          if (Object.values(hairMeshes.current).includes(hit.object as Mesh)) id = 'hair'
          else if (Object.values(beardMeshes.current).includes(hit.object as Mesh)) id = 'beard'
          else {
            const local = inner.current.worldToLocal(hit.point.clone())
            let best = Infinity
            for (const rid of REGION_IDS) {
              if (rid === 'composition') continue
              const dd = anchors.regions[rid].p.distanceTo(local)
              if (dd < best) (best = dd), (id = rid)
            }
            if (best > 0.45) id = 'composition'
          }
          if (id) regions.onSelect?.(id)
        }
      }
    }
  })

  if (!geo) return null
  const order = material === 'scan' ? 0 : 3
  return (
    <group ref={outer} position={PIVOT}>
      <group ref={inner} position={[-PIVOT.x, -PIVOT.y, -PIVOT.z]}>
        <mesh geometry={geo.body} material={mats.body} renderOrder={1} />
        <mesh ref={headMesh} geometry={geo.head} material={mats.head} renderOrder={2} />
        <Eyes skin={skinU.uSkin.value} clay={eyeClay} gaze={gaze} override={mats.eye} />
        {HAIR_SHAPES.map((s) =>
          geo.hair[s] ? <mesh key={s} ref={(m) => void (hairMeshes.current[s] = m)} geometry={geo.hair[s]} material={mats.hair[s]} renderOrder={order} visible={false} /> : null,
        )}
        {BEARD_SHAPES.map((s) =>
          geo.beard[s] ? <mesh key={s} ref={(m) => void (beardMeshes.current[s] = m)} geometry={geo.beard[s]} material={mats.beard[s]} renderOrder={order} visible={false} /> : null,
        )}
        {landmarks && <Landmarks scan={scan} />}
      </group>
    </group>
  )
}
