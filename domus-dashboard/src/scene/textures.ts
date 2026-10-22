import * as THREE from 'three'

/* Procedural textures — generated once, no network. */

const canvas = (w: number, h = w) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

/**
 * Pre-compensates an sRGB hex for the Khronos-Neutral tone mapper's toe
 * (it subtracts ~0.04 linear), so WebGL pixels match the CSS body gradient.
 */
export function neutralCompensate(hex: string) {
  const c = new THREE.Color(hex)
  const f = (v: number) => {
    const lin = toLinear(v)
    return toSrgb(Math.min(1, lin + (lin < 0.08 ? lin * 0.5 : 0.04)))
  }
  return `rgb(${Math.round(f(c.r) * 255)}, ${Math.round(f(c.g) * 255)}, ${Math.round(f(c.b) * 255)})`
}

let bg: THREE.CanvasTexture | null = null
/** Same recipe as the CSS body: radial-gradient(120% 90% at 50% 20%, top, mid 48%, bottom). */
export function backgroundTexture() {
  if (bg) return bg
  const [c, g] = canvas(512)
  g.save()
  g.translate(256, 0.2 * 512)
  g.scale(1.2, 0.9)
  const r = 512
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, r)
  grad.addColorStop(0, neutralCompensate('#cbc6bf'))
  grad.addColorStop(0.48, neutralCompensate('#a9a39a'))
  grad.addColorStop(1, neutralCompensate('#6f6a63'))
  g.fillStyle = grad
  g.fillRect(-512, -512, 2048, 2048)
  g.restore()
  // gentle dither to kill banding
  const img = g.getImageData(0, 0, 512, 512)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 3
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  g.putImageData(img, 0, 0)
  bg = new THREE.CanvasTexture(c)
  bg.colorSpace = THREE.SRGBColorSpace
  return bg
}

let cells: THREE.CanvasTexture | null = null
/** Monocrystalline panel: deep navy cells, silver busbars, faint sheen. */
export function solarCellTexture() {
  if (cells) return cells
  const S = 512
  const [c, g] = canvas(S)
  const base = g.createLinearGradient(0, 0, S, S)
  base.addColorStop(0, '#2a3552')
  base.addColorStop(0.5, '#1a2340')
  base.addColorStop(1, '#26314e')
  g.fillStyle = base
  g.fillRect(0, 0, S, S)
  const cols = 3
  const rows = 5
  const cw = S / cols
  const ch = S / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = i * cw
      const y = j * ch
      const cg = g.createLinearGradient(x, y, x + cw, y + ch)
      cg.addColorStop(0, 'rgba(70,92,130,0.22)')
      cg.addColorStop(1, 'rgba(10,14,24,0.0)')
      g.fillStyle = cg
      g.fillRect(x + 3, y + 3, cw - 6, ch - 6)
      // busbars
      g.fillStyle = 'rgba(150,165,190,0.08)'
      g.fillRect(x + cw * 0.5, y + 3, 1, ch - 6)
    }
  g.strokeStyle = 'rgba(205,214,232,0.5)'
  g.lineWidth = 2.5
  for (let i = 0; i <= cols; i++) {
    g.beginPath()
    g.moveTo(i * cw, 0)
    g.lineTo(i * cw, S)
    g.stroke()
  }
  for (let j = 0; j <= rows; j++) {
    g.beginPath()
    g.moveTo(0, j * ch)
    g.lineTo(S, j * ch)
    g.stroke()
  }
  cells = new THREE.CanvasTexture(c)
  cells.colorSpace = THREE.SRGBColorSpace
  cells.anisotropy = 8
  return cells
}

let fade: THREE.CanvasTexture | null = null
/** White centre → black edge; used as alphaMap to dissolve the ground into the backdrop. */
export function radialFadeTexture() {
  if (fade) return fade
  const [c, g] = canvas(256)
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, '#fff')
  grad.addColorStop(0.35, '#e8e8e8')
  grad.addColorStop(0.7, '#5a5a5a')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  fade = new THREE.CanvasTexture(c)
  return fade
}

const halos = new Map<string, THREE.CanvasTexture>()
/**
 * Soft glowing rounded-rect ring (fake bloom spill). `aspect` = w/h of the
 * plane it is mapped onto; `pad` = fraction of the plane outside the ring.
 */
export function haloTexture(aspect: number, pad = 0.12) {
  const key = `${aspect.toFixed(3)}-${pad}`
  const hit = halos.get(key)
  if (hit) return hit
  const W = 1024
  const H = Math.round(W / aspect)
  const [c, g] = canvas(W, H)
  const px = W * pad * 0.5
  const py = px
  const x = px
  const y = py
  const w = W - px * 2
  const h = H - py * 2
  const r = Math.min(w, h) * 0.04
  const path = () => {
    g.beginPath()
    g.roundRect(x, y, w, h, r)
  }
  g.shadowColor = 'rgba(198,239,142,1)'
  for (const [blur, alpha, lw] of [
    [60, 0.38, 14],
    [26, 0.6, 7],
    [8, 0.9, 3],
  ] as const) {
    g.shadowBlur = blur
    g.strokeStyle = `rgba(198,239,142,${alpha})`
    g.lineWidth = lw
    path()
    g.stroke()
  }
  // faint inner wash over the panels near the edge
  g.shadowBlur = 0
  const inner = g.createLinearGradient(0, 0, 0, H)
  inner.addColorStop(0, 'rgba(198,239,142,0.05)')
  inner.addColorStop(0.5, 'rgba(198,239,142,0.0)')
  inner.addColorStop(1, 'rgba(198,239,142,0.06)')
  g.fillStyle = inner
  path()
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  halos.set(key, t)
  return t
}

let screen: THREE.CanvasTexture | null = null
/** Slow ambient gradient for the OLED screen (scrolled over time). */
export function screenTexture() {
  if (screen) return screen
  const [c, g] = canvas(512, 64)
  const grad = g.createLinearGradient(0, 0, 512, 0)
  const stops = ['#2a3f8f', '#7a4bb0', '#d46a7e', '#e9a55a', '#5fb3a9', '#2a3f8f']
  stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s))
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 64)
  screen = new THREE.CanvasTexture(c)
  screen.colorSpace = THREE.SRGBColorSpace
  screen.wrapS = THREE.RepeatWrapping
  return screen
}

let soft: THREE.CanvasTexture | null = null
/** Soft round blob (contact shadow / glow sprite). */
export function softDotTexture() {
  if (soft) return soft
  const [c, g] = canvas(128)
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  soft = new THREE.CanvasTexture(c)
  return soft
}
