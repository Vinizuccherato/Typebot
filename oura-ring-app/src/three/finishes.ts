import { Color } from 'three'
import type { FinishId } from '../store'

export interface SurfaceSpec {
  color: Color
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  sheen: number
  anisotropy: number
  envMapIntensity: number
}

const surf = (s: Omit<SurfaceSpec, 'color'> & { color: string }): SurfaceSpec => ({
  ...s,
  color: new Color(s.color),
})

/* Every scalar stays > 0 so shader defines never toggle (no recompile hitch on crossfade). */
const polishedSilver = surf({ color: '#dcdfe2', roughness: 0.11, metalness: 1, clearcoat: 0.001, clearcoatRoughness: 0.1, sheen: 0.001, anisotropy: 0.001, envMapIntensity: 1.15 })
const ceramic = (color: string) =>
  surf({ color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.35, anisotropy: 0.001, envMapIntensity: 1 })

export const FINISHES: Record<FinishId, { outer: SurfaceSpec; inner: SurfaceSpec }> = {
  cloud: { outer: ceramic('#f3f2ee'), inner: polishedSilver },
  petal: { outer: ceramic('#eed6d0'), inner: polishedSilver },
  tide: { outer: ceramic('#cbd8de'), inner: polishedSilver },
  titanium: {
    outer: surf({ color: '#aeb2b6', roughness: 0.3, metalness: 1, clearcoat: 0.001, clearcoatRoughness: 0.1, sheen: 0.001, anisotropy: 0.75, envMapIntensity: 1.1 }),
    inner: surf({ color: '#d4d7da', roughness: 0.16, metalness: 1, clearcoat: 0.001, clearcoatRoughness: 0.1, sheen: 0.001, anisotropy: 0.4, envMapIntensity: 1.1 }),
  },
}
