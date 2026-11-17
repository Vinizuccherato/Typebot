import type { RegionId, StyleSpec } from '../store'

/* CONTRACT (3D agent owns the implementation). A live 3D viewport of the client's
   head (male, anonymous, procedural) or the brand mark. Used on almost every screen. */
export interface FaceViewProps {
  className?: string
  /** 'mark' = lozuc brand object; 'face' = the client's head */
  subject: 'mark' | 'face'
  /** 'skin' = natural render; 'scan' = sage hologram (capture/processing); 'map' = matte clay-like render for the region map */
  material?: 'skin' | 'scan' | 'map'
  /** 0–100 reveal / sweep progress for 'scan' */
  scan?: number
  /** hair, beard, brows and tones to render (defaults to CURRENT_STYLE) */
  style?: StyleSpec
  /** standardized capture pose */
  pose?: 'front' | 'profile' | 'threeQuarter'
  /** LZ-01 region map: show hotspots, highlight the active region, report clicks */
  regions?: { show: boolean; active?: RegionId | null; onSelect?: (id: RegionId) => void; priorities?: Partial<Record<RegionId, 'alta' | 'media' | 'baixa' | null>> }
  landmarks?: boolean
  autoRotate?: boolean
  /** drag to rotate, wheel/pinch to zoom */
  interactive?: boolean
  framing?: 'head' | 'face' | 'bust' | 'hair' | 'beard' | 'brows'
}

/** STUB — replaced by the 3D agent. */
export function FaceView({ className }: FaceViewProps) {
  return <div className={className} style={{ background: 'radial-gradient(closest-side, rgb(169 199 182 / 0.22), transparent)' }} />
}
