/* LED swatch model — the CSS gradients and the hex sampler share these stops,
   so the colour under the handle is exactly the colour sent to the strip. */

type RGB = [number, number, number]

export const SWATCH_STOPS: Array<[number, RGB]> = [
  [0, [226, 226, 224]], // bright silver
  [0.3, [172, 172, 168]], // brushed steel
  [0.64, [182, 168, 108]], // champagne-olive
  [1, [210, 184, 70]], // gold
]

const WHITE_END = 0.32 // white sheen fades out by here
const DARK_START = 0.5 // shade begins here
const WHITE_A = 0.32
const DARK_A = 0.42

export const SWATCH_BASE_CSS = `linear-gradient(90deg, ${SWATCH_STOPS.map(
  ([t, [r, g, b]]) => `rgb(${r} ${g} ${b}) ${t * 100}%`,
).join(', ')})`

export const SWATCH_SHADE_CSS = `linear-gradient(180deg, rgb(255 255 255 / ${WHITE_A}) 0%, rgb(255 255 255 / 0) ${
  WHITE_END * 100
}%, rgb(0 0 0 / 0) ${DARK_START * 100}%, rgb(0 0 0 / ${DARK_A}) 100%)`

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

export function swatchRgb(x: number, y: number): RGB {
  x = Math.min(1, Math.max(0, x))
  y = Math.min(1, Math.max(0, y))
  let base: RGB = SWATCH_STOPS[SWATCH_STOPS.length - 1][1]
  for (let i = 0; i < SWATCH_STOPS.length - 1; i++) {
    const [t0, c0] = SWATCH_STOPS[i]
    const [t1, c1] = SWATCH_STOPS[i + 1]
    if (x <= t1) {
      base = mix(c0, c1, (x - t0) / (t1 - t0))
      break
    }
  }
  if (y < WHITE_END) return mix(base, [255, 255, 255], WHITE_A * (1 - y / WHITE_END))
  if (y > DARK_START) return mix(base, [0, 0, 0], (DARK_A * (y - DARK_START)) / (1 - DARK_START))
  return base
}

export const toHex = ([r, g, b]: RGB) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export const swatchHex = (x: number, y: number) => toHex(swatchRgb(x, y))

/** Distance between the strip colour and what the swatch shows under the handle. */
export function offSwatch(color: string, x: number, y: number) {
  const a = hexToRgb(color)
  const b = swatchRgb(x, y)
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export interface LedPreset {
  id: string
  name: string
  color: string
  x: number
  y: number
}

export const LED_PRESETS: LedPreset[] = [
  { id: 'gold', name: 'Warm Gold', color: '#d8b25a', x: 0.92, y: 0.12 },
  { id: 'champagne', name: 'Champagne', color: swatchHex(0.7, 0.04), x: 0.7, y: 0.04 },
  { id: 'lime', name: 'Lime', color: '#c6ef8e', x: 0.5, y: 0.2 },
  { id: 'ice', name: 'Ice', color: '#cfe3f2', x: 0.08, y: 0.08 },
  { id: 'rose', name: 'Rose', color: '#e9b6ad', x: 0.5, y: 0.3 },
  { id: 'white', name: 'White', color: swatchHex(0.02, 0.02), x: 0.02, y: 0.02 },
]
