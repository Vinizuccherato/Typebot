import { CanvasTexture, SRGBColorSpace } from 'three'

/* Text labels as sprite textures (works inside any canvas, no font downloads):
   small-caps Manrope on a smoked capsule, drawn with Canvas2D once and cached. */

const cache = new Map<string, { tex: CanvasTexture; aspect: number }>()

export function labelTexture(text: string, accent = '#c3b4ff', value?: string) {
  const key = `${text}|${accent}|${value ?? ''}`
  const hit = cache.get(key)
  if (hit) return hit
  const H = 64
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')!
  const fontLabel = '700 26px "Manrope Variable", Manrope, system-ui, sans-serif'
  const fontValue = '700 30px "Manrope Variable", Manrope, system-ui, sans-serif'
  ctx.font = fontLabel
  const lt = text.toUpperCase()
  const ls = 3
  const lw = ctx.measureText(lt).width + ls * lt.length
  ctx.font = fontValue
  const vw = value ? ctx.measureText(value).width + 16 : 0
  const W = Math.ceil(lw + vw + 44)
  c.width = W * 2
  c.height = H * 2
  ctx.scale(2, 2)
  // capsule
  ctx.fillStyle = 'rgba(18, 14, 24, 0.78)'
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1.5
  const r = H / 2 - 6
  ctx.beginPath()
  ctx.roundRect(3, 6, W - 6, H - 12, r)
  ctx.fill()
  ctx.stroke()
  ctx.textBaseline = 'middle'
  ctx.font = fontLabel
  ctx.fillStyle = 'rgba(244,239,234,0.72)'
  let x = 22
  for (const ch of lt) {
    ctx.fillText(ch, x, H / 2 + 1)
    x += ctx.measureText(ch).width + ls
  }
  if (value) {
    ctx.font = fontValue
    ctx.fillStyle = accent
    ctx.fillText(value, x + 12, H / 2 + 1)
  }
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  const out = { tex, aspect: W / H }
  cache.set(key, out)
  return out
}

/** Soft round glow sprite (additive dots, halos). */
let glow: CanvasTexture | null = null
export function glowTexture() {
  if (glow) return glow
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.22, 'rgba(255,255,255,0.65)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  glow = new CanvasTexture(c)
  glow.colorSpace = SRGBColorSpace
  return glow
}
