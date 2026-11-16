import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useRenderedLook, useStudio } from '../store'
import { syncBase, syncMorph } from './anchors'
import { Brows } from './Brows'
import { Glasses } from './Glasses'
import { Picking } from './Picking'
import { FocusOverlay } from './FocusOverlay'

/* ──────────────────────────────────────────────────────────────
   Accessories & overlays, mounted by the sculptor INSIDE the head-local
   group (1 unit = 10 cm, origin = nasion, +Z toward the viewer).
   Renders the look on screen right now (`useRenderedLook`), so
   hold-to-compare swaps brows and glasses too.
   ────────────────────────────────────────────────────────────── */

/** Mounted first so its frame callback runs before the accessories read the anchors. */
function AnchorSync({ space }: { space: React.RefObject<Group | null> }) {
  useFrame(() => {
    if (!space.current) return
    syncBase(space.current)
    // the face form in effect right now (compare shows the saved one)
    const s = useStudio.getState()
    const l = s.comparing ? s.saved : s.look
    syncMorph(l.face, l.strength.face)
  })
  return null
}

export function AccessoryLayer() {
  const space = useRef<Group>(null)
  const look = useRenderedLook()
  const comparing = useStudio((s) => s.comparing)
  const nav = useStudio((s) => s.nav)

  return (
    <group ref={space}>
      <AnchorSync space={space} />
      <Brows form={look.browForm} color={look.browColor} strength={look.strength.brows} faded={false} />
      <Glasses style={look.glasses} weight={look.strength.accessories} faded={false} />
      <Picking enabled={!comparing && nav === 'head'} />
      {nav === 'head' && <FocusOverlay space={space} />}
    </group>
  )
}
