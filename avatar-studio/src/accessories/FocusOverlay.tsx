import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Vector3, type Group } from 'three'
import { useStudio, type RegionId } from '../store'
import { useArtboard } from '../layout/Artboard'
import { anchors } from './anchors'
import { regionCorners } from './regions'

/* ──────────────────────────────────────────────────────────────
   Focus overlay, as in the reference: rounded bracket corners around the
   active region, a ring hotspot on the box's right edge with a leader line
   running to the panel column, and a ring on the forehead (face form).
   Everything is projected from head space every frame and sprung toward
   its target, so it tracks orbiting, zooming and face-form changes.
   ────────────────────────────────────────────────────────────── */

const PANEL_X = 995 // design px — the right column's divider

const LABEL: Record<RegionId, string> = { face: 'Face form', eyes: 'Eyes', brows: 'Eyebrows', accessories: 'Accessories' }

const corners: Vector3[] = []
const w = new Vector3()
const fore = new Vector3()

export function FocusOverlay({ space }: { space: React.RefObject<Group | null> }) {
  const region = useStudio((s) => s.region)
  const comparing = useStudio((s) => s.comparing)
  const setRegion = useStudio((s) => s.setRegion)
  const { mode, scale } = useArtboard()
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)

  const box = useRef<HTMLDivElement>(null)
  const leader = useRef<HTMLDivElement>(null)
  const ringR = useRef<HTMLButtonElement>(null)
  const ringTop = useRef<HTMLButtonElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const cur = useRef({ x: 0, y: 0, w: 0, h: 0, fx: 0, fy: 0, init: false, o: 0 })

  const project = (v: Vector3) => {
    w.copy(v)
    space.current?.localToWorld(w)
    w.project(camera)
    return [(w.x + 1) * 0.5 * size.width, (1 - w.y) * 0.5 * size.height, w.z] as const
  }

  useFrame((_, dt) => {
    if (!space.current || !box.current) return
    regionCorners(region, corners)
    // project all four corners of the head-space box (the head may be turned)
    const pts = [
      project(corners[0]),
      project(corners[1]),
      project(w.set(corners[0].x, corners[1].y, corners[0].z).clone()),
      project(w.set(corners[1].x, corners[0].y, corners[1].z).clone()),
    ]
    const xs = pts.map((p) => p[0])
    const ys = pts.map((p) => p[1])
    const pad = 6 * scale
    const tx = Math.min(...xs) - pad
    const ty = Math.min(...ys) - pad
    const tw = Math.max(...xs) - Math.min(...xs) + pad * 2
    const th = Math.max(...ys) - Math.min(...ys) + pad * 2
    const p = anchors.morphed
    fore.set(0, p.trichion.y - 0.06, p.glabella.z - 0.02)
    const [fx, fy, fz] = project(fore)

    const c = cur.current
    const k = c.init ? 1 - Math.exp(-dt * 11) : 1
    c.init = true
    c.x += (tx - c.x) * k
    c.y += (ty - c.y) * k
    c.w += (tw - c.w) * k
    c.h += (th - c.h) * k
    c.fx += (fx - c.fx) * k
    c.fy += (fy - c.fy) * k
    const visible = pts.every((q) => q[2] < 1) ? 1 : 0
    c.o += ((comparing ? 0.35 : 1) * visible - c.o) * (1 - Math.exp(-dt * 8))

    box.current.style.transform = `translate(${c.x}px, ${c.y}px)`
    box.current.style.width = `${c.w}px`
    box.current.style.height = `${c.h}px`
    if (root.current) root.current.style.opacity = String(c.o)

    const ry = c.y + c.h / 2
    const rx = c.x + c.w
    if (ringR.current) ringR.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`
    if (leader.current) {
      const rect = gl.domElement.getBoundingClientRect()
      const end = PANEL_X * scale - rect.left
      const len = Math.max(0, end - rx - 9 * scale)
      leader.current.style.transform = `translate(${rx + 9 * scale}px, ${ry}px)`
      leader.current.style.width = `${len}px`
      leader.current.style.display = mode === 'desktop' && len > 8 ? 'block' : 'none'
    }
    if (ringTop.current) {
      ringTop.current.style.transform = `translate(${c.fx}px, ${c.fy}px) translate(-50%, -50%)`
      ringTop.current.style.display = fz < 1 && region !== 'face' ? 'grid' : 'none'
    }
  })

  const corner = 'absolute h-[14px] w-[14px] border-white/90'
  const ring = 'absolute left-0 top-0 grid cursor-pointer place-items-center rounded-full outline-none'

  return (
    // fullscreen Html is placed at its object's projected position; pin it to the canvas centre so the
    // overlay covers the canvas exactly and our own projections line up
    <Html fullscreen calculatePosition={(_el, _cam, sz) => [sz.width / 2, sz.height / 2]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={root} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
        <div ref={box} className="absolute left-0 top-0" aria-hidden style={{ filter: 'drop-shadow(0 1px 3px rgb(40 44 70 / 0.35))' }}>
          <span className={`${corner} left-0 top-0 rounded-tl-[10px] border-l-[1.5px] border-t-[1.5px]`} />
          <span className={`${corner} right-0 top-0 rounded-tr-[10px] border-r-[1.5px] border-t-[1.5px]`} />
          <span className={`${corner} bottom-0 left-0 rounded-bl-[10px] border-b-[1.5px] border-l-[1.5px]`} />
          <span className={`${corner} bottom-0 right-0 rounded-br-[10px] border-b-[1.5px] border-r-[1.5px]`} />
        </div>
        <div
          ref={leader}
          aria-hidden
          className="absolute left-0 top-0 h-px origin-left"
          style={{ background: 'linear-gradient(90deg, rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.35))' }}
        />
        <button
          ref={ringR}
          type="button"
          aria-label={`${LABEL[region]} — active region`}
          title={LABEL[region]}
          className={ring}
          style={{ pointerEvents: 'auto', width: 18 * scale, height: 18 * scale, border: '1.5px solid rgb(255 255 255 / 0.95)', background: 'rgb(255 255 255 / 0.18)', backdropFilter: 'blur(4px)' }}
        >
          <span className="rounded-full bg-white" style={{ width: 6 * scale, height: 6 * scale }} />
        </button>
        <button
          ref={ringTop}
          type="button"
          aria-label="Edit face form"
          title="Face form"
          onClick={() => setRegion('face')}
          className={ring}
          style={{ pointerEvents: 'auto', width: 16 * scale, height: 16 * scale, border: '1.5px solid rgb(255 255 255 / 0.9)', background: 'rgb(255 255 255 / 0.12)' }}
        >
          <span className="rounded-full bg-white/90" style={{ width: 5 * scale, height: 5 * scale }} />
        </button>
      </div>
    </Html>
  )
}
