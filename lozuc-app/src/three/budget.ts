/* WebGL context budget shared by every FaceView on the page.
   Views ask to be live while within NEAR px of the viewport; at most MAX are
   granted, nearest first (ties → most recently visible). A view that loses its
   grant unmounts its Canvas (R3F disposes + forceContextLoss) and shows a static
   placeholder, so the page never holds more than MAX contexts. */

export const MAX_LIVE = 8
export const NEAR = 600

interface Entry {
  dist: number
  seen: number
  live: boolean
  set: (live: boolean) => void
}

const entries = new Map<number, Entry>()
let seq = 0
let queued = false

function rebalance() {
  queued = false
  const want = [...entries.values()].filter((e) => e.dist <= NEAR).sort((a, b) => a.dist - b.dist || b.seen - a.seen)
  const grant = new Set(want.slice(0, MAX_LIVE))
  for (const e of entries.values()) {
    const live = grant.has(e)
    if (live !== e.live) {
      e.live = live
      e.set(live)
    }
  }
}
const schedule = () => {
  if (queued) return
  queued = true
  queueMicrotask(rebalance)
}

/** distance (px) from a rect to the viewport, 0 when intersecting */
export function viewportDistance(r: DOMRectReadOnly) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const dx = r.right < 0 ? -r.right : r.left > vw ? r.left - vw : 0
  const dy = r.bottom < 0 ? -r.bottom : r.top > vh ? r.top - vh : 0
  return Math.hypot(dx, dy)
}

export function register(set: (live: boolean) => void) {
  const id = ++seq
  entries.set(id, { dist: Infinity, seen: 0, live: false, set })
  return {
    update(dist: number) {
      const e = entries.get(id)
      if (!e) return
      e.dist = dist
      if (dist === 0) e.seen = performance.now()
      schedule()
    },
    release() {
      entries.delete(id)
      schedule()
    },
  }
}
