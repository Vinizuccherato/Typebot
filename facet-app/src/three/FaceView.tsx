import type { Look } from '../store'

/* CONTRACT (3D agent owns the implementation): a DOM element that shows a live 3D
   viewport into the ONE shared WebGL canvas (drei <View>), so six screens can show
   3D at once without six GL contexts. */
export interface FaceViewProps {
  className?: string
  /** 'mark' = the splash brand crystal; the rest show the face model */
  subject: 'mark' | 'face'
  /** surface treatment of the face */
  material?: 'hologram' | 'thermal' | 'skin'
  /** 0–100 scan sweep / reveal progress (hologram & thermal) */
  scan?: number
  landmarks?: boolean
  overlays?: { thirds?: boolean; golden?: boolean; symmetry?: boolean; measure?: 'brows' | 'eyes' | 'nose' | 'lips' | 'jaw' | null }
  /** brows + glasses + hair colour from this look (defaults to the store look) */
  look?: Look
  accessories?: boolean
  autoRotate?: boolean
  /** drag to rotate, pinch/wheel to zoom */
  interactive?: boolean
  framing?: 'head' | 'bust' | 'face' | 'eyes'
}

/** STUB — replaced by the 3D agent. */
export function FaceView({ className }: FaceViewProps) {
  return <div className={className} style={{ background: 'radial-gradient(closest-side, rgb(195 180 255 / 0.18), transparent)' }} />
}
