import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Download, RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Glass } from '../../ui/Glass'
import { Toggle } from '../../ui/Toggle'
import { useFace, type Palette, type ScanMode } from '../../store'
import { cn, springs } from '../../lib/utils'
import { Segmented } from './kit'

const PALETTES: { id: Palette; label: string; grad: string }[] = [
  { id: 'mint', label: 'Mint', grad: 'linear-gradient(135deg, #d6ffe9, #8ff0c0 45%, #1f6b51)' },
  { id: 'amber', label: 'Amber', grad: 'linear-gradient(135deg, #fff2cf, #f0c46b 45%, #8a4b1d)' },
  { id: 'ice', label: 'Ice', grad: 'linear-gradient(135deg, #eef8ff, #9fd2f0 45%, #1d4f73)' },
]

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="glass glass-well flex items-center justify-between gap-3 rounded-[16px] px-3 py-[9px]">
      <div className="relative z-[3] min-w-0">
        <div className="text-[12px] text-white">{label}</div>
        {hint && <div className="truncate text-[10px] text-white/45">{hint}</div>}
      </div>
      <div className="relative z-[3] shrink-0">{children}</div>
    </div>
  )
}

/** Scan configuration: mode, pulse window, stress palette, viewer and scan actions. */
export function AnalyticConfig() {
  const scan = useFace((s) => s.scan)
  const autoRotate = useFace((s) => s.autoRotate)
  const setScan = useFace((s) => s.setScan)
  const setAutoRotate = useFace((s) => s.setAutoRotate)
  const rescan = useFace((s) => s.rescan)
  const resetView = useFace((s) => s.resetView)
  const toast = useFace((s) => s.toast)
  const pct = Math.round(scan.progress)

  return (
    <Glass variant="smoke" radius={24} specular={0.5} className="flex h-full w-full flex-col gap-2.5 p-4">
      <div className="relative z-[3] mb-1 flex items-center gap-2.5">
        <span className="glass glass-pill grid h-8 w-8 place-items-center rounded-[10px] text-white/85">
          <SlidersHorizontal size={14} strokeWidth={1.6} className="relative z-[3]" />
        </span>
        <h3 className="text-[14px] font-normal text-white">Analytic Configuration</h3>
      </div>

      <Row label="Scan Mode" hint={scan.mode === 'thermal' ? 'Infrared heat map' : scan.mode === 'depth' ? 'Structured-light depth' : 'Topology wireframe'}>
        <Segmented<ScanMode>
          label="Scan mode"
          value={scan.mode}
          onChange={(mode) => setScan({ mode })}
          options={[
            { value: 'thermal', label: 'Thermal' },
            { value: 'depth', label: 'Depth' },
            { value: 'mesh', label: 'Mesh' },
          ]}
          className="w-[150px]"
        />
      </Row>

      <Row label="Pulse Window" hint="rPPG averaging">
        <Segmented<10 | 20 | 30>
          label="Pulse window"
          value={scan.pulseWindow}
          onChange={(pulseWindow) => setScan({ pulseWindow })}
          options={[
            { value: 10, label: '10s' },
            { value: 20, label: '20s' },
            { value: 30, label: '30s' },
          ]}
          className="w-[132px]"
        />
      </Row>

      <Row label="Stress Color" hint={PALETTES.find((p) => p.id === scan.palette)?.label}>
        <div role="radiogroup" aria-label="Stress colour" className="flex gap-2">
          {PALETTES.map((p) => {
            const on = p.id === scan.palette
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={p.label}
                onClick={() => setScan({ palette: p.id })}
                className="relative grid h-7 w-7 cursor-pointer place-items-center rounded-full outline-none"
              >
                {on && <motion.span layoutId="palette-ring" className="absolute inset-0 rounded-full ring-[1.5px] ring-white/85" transition={springs.snappy} />}
                <span className={cn('h-[18px] w-[18px] rounded-full transition-transform', on ? 'scale-100' : 'scale-90 hover:scale-100')} style={{ background: p.grad }} />
              </button>
            )
          })}
        </div>
      </Row>

      <Row label="Auto-rotate" hint="Idle turntable">
        <Toggle size="sm" label="Auto-rotate head" checked={autoRotate} onChange={setAutoRotate} />
      </Row>

      {/* capture spec */}
      <dl className="relative z-[3] mt-1 grid grid-cols-3 gap-2 text-center">
        {[
          ['468', 'Landmarks'],
          ['±0.4', 'mm accuracy'],
          ['60', 'fps capture'],
        ].map(([v, k]) => (
          <div key={k} className="rounded-[12px] border border-white/[0.06] px-1 py-2">
            <dd className="tabular text-[15px] font-light text-white">{v}</dd>
            <dt className="text-[9.5px] text-white/45">{k}</dt>
          </div>
        ))}
      </dl>

      {/* scan progress */}
      <div className="relative z-[3] mt-auto">
        <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
          <span className="text-white/60">{scan.running ? 'Scanning…' : 'Scan complete'}</span>
          <span className="tabular text-white">{pct}%</span>
        </div>
        <div className="h-[4px] overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Scan progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2f9e74, #8ff0c0)', boxShadow: '0 0 10px rgb(143 240 192 / 0.6)', transition: 'width 120ms linear' }}
          />
        </div>
      </div>

      <div className="relative z-[3] grid grid-cols-3 gap-2">
        <Action icon={<RefreshCw size={13} />} label="Re-scan" onClick={rescan} primary />
        <Action icon={<RotateCcw size={13} />} label="Reset" onClick={resetView} />
        <Action icon={<Download size={13} />} label="Export" onClick={() => toast({ title: 'Report exported', detail: 'Facial telemetry · PDF · 2.4 MB', tone: 'success' })} />
      </div>
    </Glass>
  )
}

function Action({ icon, label, onClick, primary }: { icon: ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={springs.snappy}
      className={cn(
        'glass relative flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[11.5px] outline-none',
        primary ? 'glass-ink font-medium' : 'glass-pill text-white/80 hover:text-white',
      )}
    >
      <span className="relative z-[3] flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </motion.button>
  )
}
