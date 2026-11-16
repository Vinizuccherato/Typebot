import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { HeartPulse, Pause, Play } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { AnimatedNumber } from '../../ui/AnimatedNumber'
import { useFace } from '../../store'
import { MINT, Tip, useCanvasLoop } from './kit'

const HZ = 10 // store tick rate
const CAP = 30 * HZ // longest window

/** Backfill with the same cardiac model the store streams (systolic peak + dicrotic notch). */
const backfill = (hr: number, resp: number) =>
  Array.from({ length: CAP }, (_, i) => {
    const t = (i - CAP) / HZ
    const b = (t * hr) / 60
    const f = b - Math.floor(b)
    const pulse = Math.exp(-Math.pow((f - 0.18) / 0.07, 2)) + 0.38 * Math.exp(-Math.pow((f - 0.46) / 0.09, 2))
    return 0.22 + pulse * 0.6 + 0.08 * Math.sin((t * resp * Math.PI * 2) / 60)
  })

/** Centred moving average over `k` samples (1 s at 10 Hz) — the calm main stroke. */
const movingAvg = (a: number[], k = HZ) =>
  a.map((_, i) => {
    let sum = 0
    let n = 0
    for (let j = i - (k >> 1); j <= i + (k >> 1); j++) if (j >= 0 && j < a.length) (sum += a[j]), n++
    return sum / n
  })

/** Maps a series onto [lo, hi] of the plot height (auto-scaled, with a minimum span). */
const scaler = (a: number[], h: number, lo: number, hi: number) => {
  let min = Infinity
  let max = -Infinity
  for (const v of a) (min = Math.min(min, v)), (max = Math.max(max, v))
  const span = Math.max(0.04, max - min)
  return (v: number) => h * hi - ((v - min) / span) * h * (hi - lo)
}

/** Live remote-photoplethysmography trace with a selectable time window. */
export function RppgSignal() {
  const hr = useFace((s) => s.vitals.heartRate)
  const hrv = useFace((s) => s.vitals.hrv)
  const win = useFace((s) => s.scan.pulseWindow)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState<{ x: number; y: number; ago: number; amp: number } | null>(null)

  /* local ring buffer, longer than the store's (≤30 s) */
  const buf = useRef<number[]>([])
  const lastAt = useRef(performance.now())
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  useEffect(() => {
    const v = useFace.getState().vitals
    buf.current = backfill(v.heartRate, v.respiratory)
    return useFace.subscribe((s, prev) => {
      if (s.vitals.rppg === prev.vitals.rppg || pausedRef.current) return
      buf.current.push(s.vitals.rppg[s.vitals.rppg.length - 1])
      if (buf.current.length > CAP) buf.current.splice(0, buf.current.length - CAP)
      lastAt.current = performance.now()
    })
  }, [])

  const geo = useRef({ n: 0, w: 0, h: 0 })

  const canvas = useCanvasLoop((ctx, w, h) => {
    const n = useFace.getState().scan.pulseWindow * HZ
    const raw = buf.current.slice(-n)
    const data = movingAvg(raw)
    geo.current = { n, w, h }
    const pad = 8
    const step = w / (n - 1)
    // sub-sample scroll for smoothness between 10 Hz ticks
    const frac = pausedRef.current ? 0 : Math.min(1, (performance.now() - lastAt.current) / (1000 / HZ))
    const off = -frac * step

    // dotted grid
    ctx.fillStyle = 'rgba(255,255,255,0.09)'
    for (let gx = 0; gx <= w; gx += 16) for (let gy = 6; gy <= h; gy += 16) ctx.fillRect(gx, gy, 1, 1)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.setLineDash([2, 4])
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    ctx.setLineDash([])

    if (data.length < 2) return
    const start = n - data.length
    const X = (i: number) => (start + i) * step + off
    const Yraw = (v: number) => pad + (1 - Math.min(1.05, Math.max(0, v))) * (h - pad * 2)
    const Y = scaler(data, h, 0.18, 0.78)

    // raw beat-to-beat trace, faint underneath
    ctx.beginPath()
    for (let i = 0; i < raw.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(i), Yraw(raw[i]))
    ctx.strokeStyle = 'rgba(143,240,192,0.25)'
    ctx.lineWidth = 1
    ctx.stroke()

    // area
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(143,240,192,0.22)')
    grad.addColorStop(1, 'rgba(143,240,192,0)')
    ctx.beginPath()
    ctx.moveTo(X(0), h)
    for (let i = 0; i < data.length; i++) ctx.lineTo(X(i), Y(data[i]))
    ctx.lineTo(X(data.length - 1), h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // trace, fading in from the left
    const lg = ctx.createLinearGradient(0, 0, w, 0)
    lg.addColorStop(0, 'rgba(143,240,192,0.15)')
    lg.addColorStop(0.35, 'rgba(143,240,192,0.8)')
    lg.addColorStop(1, MINT)
    ctx.beginPath()
    ctx.moveTo(X(0), Y(data[0]))
    for (let i = 1; i < data.length - 1; i++) {
      const mx = (X(i) + X(i + 1)) / 2
      const my = (Y(data[i]) + Y(data[i + 1])) / 2
      ctx.quadraticCurveTo(X(i), Y(data[i]), mx, my)
    }
    ctx.lineTo(X(data.length - 1), Y(data[data.length - 1]))
    ctx.strokeStyle = lg
    ctx.lineWidth = 1.8
    ctx.lineJoin = 'round'
    ctx.shadowColor = 'rgba(143,240,192,0.55)'
    ctx.shadowBlur = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // latest local crest of the smoothed wave
    let pi = data.length - 1
    for (let i = data.length - 2; i > 0; i--)
      if (data[i] >= data[i - 1] && data[i] >= data[i + 1]) {
        pi = i
        break
      }
    const px = X(pi)
    const py = Y(data[pi])
    ctx.strokeStyle = 'rgba(143,240,192,0.25)'
    ctx.beginPath()
    ctx.moveTo(px, py + 6)
    ctx.lineTo(px, h)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(143,240,192,0.18)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px, py, 2.6, 0, Math.PI * 2)
    ctx.fillStyle = '#eafff4'
    ctx.fill()
  })

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const { n, w, h } = geo.current
    const data = movingAvg(buf.current.slice(-n))
    const i = Math.round(fx * (n - 1)) - (n - data.length)
    if (i < 0 || i >= data.length) return setHover(null)
    const amp = data[i]
    setHover({ x: fx * w, y: scaler(data, h, 0.18, 0.78)(amp), ago: (n - 1 - Math.round(fx * (n - 1))) / HZ, amp })
  }

  return (
    <Glass variant="frost" radius={22} specular={0.6} className="flex h-full w-full flex-col p-4">
      <div className="relative z-[3] flex items-center gap-2.5">
        <span className="glass glass-pill grid h-7 w-7 place-items-center rounded-[9px] text-mint">
          <HeartPulse size={14} strokeWidth={1.6} className="relative z-[3]" />
        </span>
        <h3 className="text-[14px] font-normal text-white">rPPG Signal</h3>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? 'Resume live signal' : 'Pause live signal'}
          className="glass glass-pill relative ml-auto grid h-7 w-7 cursor-pointer place-items-center rounded-full text-white/80 outline-none transition-transform hover:text-white active:scale-90"
        >
          {paused ? <Play size={12} className="relative z-[3] translate-x-[1px]" /> : <Pause size={12} className="relative z-[3]" />}
        </button>
      </div>

      <div className="relative z-[3] mt-3 flex items-center justify-between text-[10.5px] text-white/45">
        <span className="tabular">{win} sec window</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${paused ? 'bg-white/40' : 'bg-mint shadow-[0_0_8px_var(--mint)]'}`} />
          {paused ? 'Paused' : 'Live'}
        </span>
      </div>

      <div
        className="relative z-[3] mt-2 min-h-0 flex-1 cursor-crosshair"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`rPPG waveform, ${win} second window, heart rate ${hr} bpm`}
      >
        <canvas ref={canvas} className="block h-full w-full" />
        <AnimatePresence>
          {hover && (
            <Tip x={hover.x} y={hover.y - 8}>
              <span className="tabular">−{hover.ago.toFixed(1)} s · amplitude {(hover.amp * 100).toFixed(0)}%</span>
            </Tip>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-[3] mt-3 grid grid-cols-3 gap-2">
        <Stat label="Avg HR" unit="bpm">
          <AnimatedNumber value={hr} />
        </Stat>
        <Stat label="SpO₂" unit="%">
          <span className="tabular">98</span>
        </Stat>
        <Stat label="HRV" unit="ms">
          <AnimatedNumber value={hrv} />
        </Stat>
      </div>
    </Glass>
  )
}

function Stat({ label, unit, children }: { label: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="glass glass-well rounded-[14px] px-2.5 py-2">
      <div className="relative z-[3] text-[10px] text-white/50">{label}</div>
      <div className="relative z-[3] mt-0.5 flex items-baseline gap-1">
        <span className="text-[22px] font-light leading-none text-white">{children}</span>
        <span className="text-[9.5px] text-white/40">{unit}</span>
      </div>
    </div>
  )
}
