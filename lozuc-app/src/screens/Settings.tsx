import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Bell, Brain, ChevronRight, CreditCard, Download, FileText, Heart, LifeBuoy, Pencil, ScanFace, ShieldCheck, Trash2, UserRoundX, type LucideIcon } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { useScreen } from '../shell/screenContext'
import { DIRECTIONS, useLozuc, type Memory } from '../store'
import { Glass } from '../ui/Glass'
import { FaceView } from '../three/FaceView'
import { cn, springs } from '../lib/utils'
import { ConfirmDialog, ScrollScreen, SectionLabel, Sheet } from './c/kit'

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="relative grid h-11 w-[60px] shrink-0 cursor-pointer place-items-center outline-none">
      <span className={cn('relative h-[31px] w-[51px] rounded-full transition-colors', on ? 'bg-[var(--sage)]' : 'bg-white/14')}>
        <motion.span className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.35)]" initial={false} animate={{ left: on ? 22 : 2 }} transition={springs.bouncy} />
      </span>
    </button>
  )
}

/** Inset-grouped row (≥ 44pt). */
function Row({ icon: Icon, title, detail, onClick, trailing, tone, destructive }: { icon: LucideIcon; title: string; detail?: string; onClick?: () => void; trailing?: ReactNode; tone?: string; destructive?: boolean }) {
  const content = (
    <>
      <span className="relative z-[3] grid h-9 w-9 shrink-0 place-items-center rounded-[11px]" style={{ background: destructive ? 'rgb(227 164 138 / 0.18)' : 'rgb(255 255 255 / 0.07)', color: destructive ? 'var(--clay)' : tone ?? 'var(--text)' }}>
        <Icon size={17} strokeWidth={1.9} />
      </span>
      <span className="relative z-[3] min-w-0 flex-1 text-left">
        <span className={cn('block text-[15px] font-medium', destructive && 'text-[var(--clay)]')}>{title}</span>
        {detail && <span className="block text-[12.5px] leading-[1.4] text-[var(--text-3)]">{detail}</span>}
      </span>
      <span className="relative z-[3] flex items-center">{trailing ?? (onClick ? <ChevronRight size={17} className="text-[var(--text-4)]" /> : null)}</span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-3.5 py-2 outline-none hover:bg-white/4">
      {content}
    </button>
  ) : (
    <div className="flex min-h-[56px] w-full items-center gap-3 px-3.5 py-2">{content}</div>
  )
}

function Group({ children }: { children: ReactNode }) {
  return (
    <Glass variant="frost" radius={22} className="overflow-hidden">
      <div className="relative z-[3] divide-y divide-white/6">{children}</div>
    </Glass>
  )
}

const GOAL: Record<string, string> = { profissional: 'Imagem profissional', versatil: 'Versátil', evento: 'Evento', renovar: 'Renovar o visual' }
const TIME: Record<string, string> = { '5': '5 min/dia', '10': '10 min/dia', '20': '20+ min/dia' }
const BUDGET: Record<string, string> = { enxuto: 'Enxuto', equilibrado: 'Equilibrado', investir: 'Investir' }
const MEMORY_LABEL: Record<keyof Memory, string> = { preferencias: 'Preferências', condicoes: 'Condições informadas', decisoes: 'Decisões', execucoes: 'Execuções', retornos: 'Retornos' }

/** Perfil e privacidade — everything the client consented to can be reviewed and undone in two taps. */
export function SettingsScreen() {
  const { go } = useScreen()
  const profile = useLozuc((s) => s.profile)
  const subscribed = useLozuc((s) => s.subscribed)
  const plan = useLozuc((s) => s.plan)
  const chosen = useLozuc((s) => s.chosenDirection)
  const memory = useLozuc((s) => s.memory)
  const forget = useLozuc((s) => s.forget)
  const toast = useLozuc((s) => s.toast)
  const [training, setTraining] = useState(false)
  const [notifs, setNotifs] = useState({ revisoes: true, rotina: false })
  const [confirm, setConfirm] = useState<null | 'faces' | 'account'>(null)
  const [memOpen, setMemOpen] = useState(false)
  const [facesDeleted, setFacesDeleted] = useState(false)
  const direction = DIRECTIONS.find((d) => d.id === chosen) ?? DIRECTIONS[0]
  const memCount = Object.values(memory).reduce((a, l) => a + l.length, 0)

  return (
    <ScreenFrame tabs>
      <ScrollScreen title="Perfil e privacidade">
        <div className="@3xl:grid @3xl:grid-cols-2 @3xl:gap-8 @3xl:px-10">
          <div className="flex flex-col gap-6">
            {/* profile card */}
            <section aria-label="Seu perfil" className="px-5 @3xl:px-0">
              <Glass variant="frost" specular radius={28} className="liquid flex items-center gap-4 p-4">
                <div className="glass glass-well relative h-[86px] w-[86px] shrink-0 overflow-hidden rounded-full">
                  {facesDeleted ? (
                    <div className="relative z-[3] grid h-full place-items-center text-[28px] font-bold text-[var(--sage)]">{profile.name[0]}</div>
                  ) : (
                    <FaceView subject="face" material="skin" style={direction.style} framing="face" className="absolute inset-0" />
                  )}
                </div>
                <div className="relative z-[3] min-w-0 flex-1">
                  <p className="display text-[24px] font-semibold leading-tight">{profile.name}</p>
                  <p className="text-[13px] text-[var(--text-2)]">{subscribed ? `Plano lozuc · ${plan === 'anual' ? 'anual' : 'mensal'}` : 'Leitura gratuita'}</p>
                  <p className="text-[12px] text-[var(--text-3)]">Entrou com a Apple</p>
                </div>
              </Glass>
            </section>

            <section aria-label="Preferências declaradas">
              <SectionLabel action={<button type="button" onClick={() => go('profile')} className="inline-flex h-11 cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-[var(--sage)] outline-none"><Pencil size={13} /> Editar</button>}>
                O que você nos contou
              </SectionLabel>
              <div className="px-5 @3xl:px-0">
                <Glass variant="frost" radius={22} className="p-4">
                  <dl className="relative z-[3] grid grid-cols-2 gap-x-4 gap-y-3">
                    {[
                      ['Objetivo', profile.goal ? GOAL[profile.goal] : '—'],
                      ['Arrumação', profile.groomingTime ? TIME[profile.groomingTime] : '—'],
                      ['Orçamento', profile.budget ? BUDGET[profile.budget] : '—'],
                      ['Produtos em uso', profile.products.join(', ') || '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[11.5px] text-[var(--text-3)]">{k}</dt>
                        <dd className="text-[14px] font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="relative z-[3] mt-3 text-[11.5px] text-[var(--text-4)]">Preferências são declaradas por você — nunca inferidas do formato do rosto.</p>
                </Glass>
              </div>
            </section>

            <section aria-label="Personal">
              <SectionLabel>Personal</SectionLabel>
              <div className="px-5 @3xl:px-0">
                <Group>
                  <Row icon={Brain} tone="var(--sage)" title="Memória do plano" detail={`${memCount} registros · ver e apagar`} onClick={() => setMemOpen(true)} />
                  <Row icon={Bell} title="Lembretes de revisão" detail="Só quando houver contexto (ex.: 7 dias após o corte)" trailing={<Switch on={notifs.revisoes} onChange={(v) => setNotifs((n) => ({ ...n, revisoes: v }))} label="Lembretes de revisão" />} />
                  <Row icon={Bell} title="Lembrete da rotina" detail="Desligado por padrão" trailing={<Switch on={notifs.rotina} onChange={(v) => setNotifs((n) => ({ ...n, rotina: v }))} label="Lembrete da rotina" />} />
                </Group>
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col gap-6 @3xl:mt-0">
            <section aria-label="Privacidade e dados">
              <SectionLabel>Privacidade e dados</SectionLabel>
              <div className="px-5 @3xl:px-0">
                <Group>
                  <Row icon={ShieldCheck} tone="var(--sage)" title="Leitura no aparelho" detail="Fotos e medidas ficam com você. Retenção: até você apagar, nunca mais que 1 ano sem uso." />
                  <Row
                    icon={ScanFace}
                    title="Usar minhas fotos para melhorar o método"
                    detail="Desligado. Só com autorização específica; você pode retirar a qualquer momento."
                    trailing={
                      <Switch
                        on={training}
                        onChange={(v) => {
                          setTraining(v)
                          toast({ title: v ? 'Autorização registrada' : 'Autorização retirada', detail: v ? 'Você pode desligar quando quiser' : 'Nenhuma foto será usada' })
                        }}
                        label="Usar minhas fotos para melhorar o método"
                      />
                    }
                  />
                  <Row icon={Download} title="Exportar meus dados" detail="Fotos, plano, rotina e histórico (.zip)" onClick={() => toast({ title: 'Exportação preparada', detail: 'Enviaremos o link para o seu e-mail' })} />
                  <Row icon={Trash2} destructive title={facesDeleted ? 'Dados faciais apagados' : 'Apagar dados faciais'} detail={facesDeleted ? 'Faça uma nova captura quando quiser' : 'Remove fotos, malha 3D e medidas'} onClick={facesDeleted ? () => go('capture') : () => setConfirm('faces')} />
                </Group>
              </div>
            </section>

            <section aria-label="Conta">
              <SectionLabel>Conta</SectionLabel>
              <div className="px-5 @3xl:px-0">
                <Group>
                  <Row icon={CreditCard} title="Assinatura" detail={subscribed ? 'Gerenciar ou cancelar na App Store' : 'Ver planos'} onClick={() => (subscribed ? toast({ title: 'Abrindo assinaturas', detail: 'Ajustes › Apple ID › Assinaturas' }) : go('paywall'))} />
                  <Row icon={FileText} title="Como o lozuc funciona" detail="Método, limites e o que não fazemos" onClick={() => toast({ title: 'Como funciona', detail: 'Sem notas de beleza, sem diagnóstico, sem cirurgia' })} />
                  <Row icon={LifeBuoy} title="Ajuda e encarregado de dados (DPO)" detail="privacidade@lozuc.app" onClick={() => toast({ title: 'privacidade@lozuc.app', detail: 'Resposta em até 15 dias' })} />
                  <Row icon={Heart} title="Precisa conversar?" detail="CVV · 188 (24h, gratuito)" />
                  <Row icon={UserRoundX} destructive title="Excluir conta" detail="Apaga a conta e todos os dados" onClick={() => setConfirm('account')} />
                </Group>
              </div>
            </section>
          </div>
        </div>
      </ScrollScreen>

      <ConfirmDialog
        open={confirm === 'faces'}
        destructive
        title="Apagar dados faciais?"
        body="Fotos, malha 3D e medidas serão removidas agora. Seu plano e a conversa continuam, mas a próxima orientação vai pedir uma nova captura."
        confirm="Apagar dados faciais"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          setFacesDeleted(true)
          toast({ title: 'Dados faciais apagados', detail: 'Nada foi mantido em servidores' })
        }}
      />
      <ConfirmDialog
        open={confirm === 'account'}
        destructive
        title="Excluir conta?"
        body="Sua conta, plano, rotina, memória e histórico serão apagados. A assinatura deve ser cancelada na App Store."
        confirm="Excluir conta"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          toast({ title: 'Conta marcada para exclusão', detail: 'Concluída em até 7 dias' })
        }}
      />

      <Sheet open={memOpen} onClose={() => setMemOpen(false)} title="Memória do plano" height="large">
        <p className="mb-4 text-[13px] leading-[1.45] text-[var(--text-3)]">O personal usa isto para orientar você. Apagar um item não afeta mais ninguém e não treina modelos.</p>
        {(Object.keys(MEMORY_LABEL) as (keyof Memory)[]).map((k) => (
          <section key={k} className="mb-4" aria-label={MEMORY_LABEL[k]}>
            <h3 className="label mb-2">{MEMORY_LABEL[k]}</h3>
            <ul className="flex flex-col gap-1.5">
              {memory[k].length === 0 && <li className="text-[13px] text-[var(--text-4)]">Nada registrado.</li>}
              {memory[k].map((item) => (
                <li key={item} className="glass glass-frost flex items-center gap-2 rounded-[16px] py-1 pl-3.5 pr-1">
                  <span className="relative z-[3] flex-1 text-[14px]">{item}</span>
                  <button type="button" onClick={() => forget(k, item)} aria-label={`Esquecer: ${item}`} className="relative z-[3] grid h-11 w-11 cursor-pointer place-items-center rounded-full text-[var(--text-3)] outline-none hover:bg-white/8 hover:text-[var(--clay)]">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Sheet>
    </ScreenFrame>
  )
}
