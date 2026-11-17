import { motion } from 'motion/react'
import { Camera, Flag, GitBranch, MessageSquareText, Repeat, ScanFace, type LucideIcon } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { CURRENT_STYLE, HISTORY, useLozuc, type HistoryEntry } from '../store'
import { Glass } from '../ui/Glass'
import { FaceView } from '../three/FaceView'
import { cn, springs } from '../lib/utils'
import { ScrollScreen, SectionLabel, shortDate } from './c/kit'

const KIND: Record<HistoryEntry['kind'], { icon: LucideIcon; label: string; tone: string }> = {
  foto: { icon: Camera, label: 'Foto', tone: 'var(--sage)' },
  decisao: { icon: Flag, label: 'Decisão', tone: 'var(--mist)' },
  rotina: { icon: Repeat, label: 'Rotina', tone: 'var(--brass)' },
  retorno: { icon: MessageSquareText, label: 'Retorno', tone: 'var(--clay)' },
  versao: { icon: GitBranch, label: 'Versão do plano', tone: 'var(--mist)' },
}

const PHOTOS = HISTORY.filter((h) => h.kind === 'foto' || h.style)

function CompareHead({ entry, label }: { entry: HistoryEntry; label: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <div className="glass glass-well relative h-[230px] overflow-hidden rounded-[24px] @3xl:h-[360px]">
        <FaceView subject="face" material="skin" style={entry.style ?? CURRENT_STYLE} framing="head" pose="front" className="absolute inset-0" />
        <span className="glass glass-pill liquid absolute left-2.5 top-2.5 z-[3] rounded-full px-2.5 py-1 text-[11px] font-semibold">
          <span className="relative z-[3]">{label}</span>
        </span>
      </div>
      <p className="mt-2 text-[13.5px] font-semibold">{entry.title}</p>
      <p className="text-[12px] text-[var(--text-3)]">{shortDate(entry.date)}</p>
    </div>
  )
}

/** LZ-08 — histórico de imagem e evolução: fotos padronizadas, decisões, rotinas e versões do plano. */
export function EvolutionScreen() {
  const { go } = useScreen()
  const compare = useLozuc((s) => s.compare)
  const setCompare = useLozuc((s) => s.setCompare)
  const a = HISTORY.find((h) => h.id === compare[0]) ?? PHOTOS[0]
  const b = HISTORY.find((h) => h.id === compare[1]) ?? PHOTOS[PHOTOS.length - 1]
  const versions = HISTORY.filter((h) => h.kind === 'versao' || h.kind === 'decisao')

  const pick = (id: string) => {
    if (id === a.id || id === b.id) return
    // newest selection replaces the older side, keeping chronology left → right
    const pair = [b.id, id].sort((x, y) => HISTORY.findIndex((h) => h.id === x) - HISTORY.findIndex((h) => h.id === y)) as [string, string]
    setCompare(pair)
  }

  return (
    <ScreenFrame tabs>
      <ScrollScreen
        title="Evolução"
        eyebrow={<span className="label text-[var(--sage)]">LZ-08 · {HISTORY.length} registros</span>}
        trailing={
          <button type="button" onClick={() => go('capture')} aria-label="Nova foto comparável" className="glass glass-ink liquid grid h-11 w-11 cursor-pointer place-items-center rounded-full outline-none">
            <ScanFace size={19} className="relative z-[3]" />
          </button>
        }
      >
        <div className="@3xl:grid @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @3xl:gap-8 @3xl:px-10">
          <div>
            {/* comparison */}
            <section aria-label="Comparar datas" className="px-5 @3xl:px-0">
              <Glass variant="frost" radius={30} className="p-3">
                <div className="relative z-[3] flex gap-3">
                  <CompareHead entry={a} label="Antes" />
                  <CompareHead entry={b} label="Depois" />
                </div>
                <p className="relative z-[3] mt-3 rounded-[16px] bg-black/20 px-3 py-2.5 text-[12px] leading-[1.45] text-[var(--text-2)]">
                  Comparamos fotos com a mesma luz, pose e distância. Diferenças de iluminação, expressão ou câmera não contam como evolução.
                </p>
              </Glass>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }} role="group" aria-label="Escolher fotos para comparar">
                {PHOTOS.map((p) => {
                  const on = p.id === a.id || p.id === b.id
                  return (
                    <button key={p.id} type="button" aria-pressed={on} onClick={() => pick(p.id)} className={cn('glass liquid flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full px-3.5 text-[12.5px] font-semibold outline-none', on ? 'glass-sage' : 'glass-pill text-[var(--text-2)]')}>
                      <Camera size={14} className="relative z-[3]" />
                      <span className="relative z-[3]">{shortDate(p.date)}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          <div>
            {/* timeline */}
            <section className="mt-6 @3xl:mt-0" aria-label="Linha do tempo">
              <SectionLabel>Linha do tempo</SectionLabel>
              <ol className="relative px-5 @3xl:px-0">
                <span aria-hidden className="absolute bottom-6 left-[41px] top-4 w-px bg-gradient-to-b from-[var(--sage)]/60 via-white/12 to-transparent @3xl:left-[21px]" />
                {[...HISTORY].reverse().map((h, i) => {
                  const k = KIND[h.kind]
                  return (
                    <motion.li key={h.id} className="relative mb-3 flex gap-3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...springs.soft, delay: i * 0.04 }}>
                      <span className="glass glass-pill liquid relative z-[1] mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full">
                        <k.icon size={17} className="relative z-[3]" style={{ color: k.tone }} />
                      </span>
                      <Glass variant="frost" radius={20} className="min-w-0 flex-1 p-3.5">
                        <div className="relative z-[3] flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: k.tone }}>
                            {k.label}
                          </span>
                          <span className="tabular text-[11.5px] text-[var(--text-3)]">{shortDate(h.date)}</span>
                        </div>
                        <p className="relative z-[3] mt-1 text-[14.5px] font-semibold">{h.title}</p>
                        <p className="relative z-[3] mt-0.5 text-[12.5px] leading-[1.45] text-[var(--text-2)]">{h.detail}</p>
                      </Glass>
                    </motion.li>
                  )
                })}
              </ol>
            </section>

            {/* plan versions */}
            <section className="mt-3" aria-label="Versões do plano">
              <SectionLabel>Versões do plano</SectionLabel>
              <div className="grid grid-cols-2 gap-3 px-5 @3xl:px-0">
                {[
                  { v: 'v1', when: versions[0]?.date ?? HISTORY[0].date, what: 'Direção, guia e rotina iniciais' },
                  { v: 'v2', when: versions.find((x) => x.kind === 'versao')?.date ?? HISTORY[4].date, what: 'Topo 5–6 cm · barba curta liberada', current: true },
                ].map((ver) => (
                  <Glass key={ver.v} variant={ver.current ? 'sage' : 'frost'} radius={22} className="p-3.5">
                    <p className="relative z-[3] flex items-baseline justify-between">
                      <span className="display text-[24px] font-semibold">{ver.v}</span>
                      <span className="text-[11.5px] text-[var(--text-3)]">{shortDate(ver.when)}</span>
                    </p>
                    <p className="relative z-[3] mt-1 text-[12.5px] leading-[1.4] text-[var(--text-2)]">{ver.what}</p>
                    {ver.current && <p className="relative z-[3] mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text)]">Atual</p>}
                  </Glass>
                ))}
              </div>
            </section>
          </div>
        </div>
      </ScrollScreen>
    </ScreenFrame>
  )
}
