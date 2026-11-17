import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Brain, Camera, Clock, Image as ImageIcon, Images, Lock, Settings2, ShieldCheck, Trash2 } from 'lucide-react'
import { ScreenFrame } from '../shell/ScreenFrame'
import { FaceView } from '../three/FaceView'
import { Button } from '../ui/Button'
import { useLozuc } from '../store'
import { useScreen } from '../shell/screenContext'
import { cn, springs } from '../lib/utils'
import { IconDisc, PinnedCTA, TopBar, useIsWeb, useReducedMotion } from './a/kit'

/** LGPD-specific items: what, why, where, how long, training. One short line each. */
const ITEMS = [
  { icon: Images, title: '3 fotos do seu rosto', detail: 'Frente, perfil e ¾ — nada além disso.' },
  { icon: Brain, title: 'Só para o seu plano', detail: 'Geram sua leitura, direções e simulações.' },
  { icon: Lock, title: 'Privadas na sua conta', detail: 'Ninguém vê sem você compartilhar.' },
  { icon: Trash2, title: 'Você apaga quando quiser', detail: 'A qualquer momento em Perfil → Privacidade.' },
  { icon: ShieldCheck, title: 'Sem treino de IA', detail: 'Nunca, sem uma permissão separada sua.' },
]

/** Consent switch — required, never pre-checked. */
function ConsentSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={cn('glass flex w-full cursor-pointer items-center gap-3.5 rounded-[22px] p-4 text-left outline-none', on ? 'glass-sage' : 'glass-frost')}
    >
      <span className="relative z-[3] min-w-0 flex-1 text-[14px] font-semibold leading-snug">
        Concordo com o uso das minhas fotos para gerar meu plano
        <span className="mt-0.5 block text-[12px] font-normal text-[var(--text-3)]">
          Dado biométrico sensível (LGPD, art. 11). <span className="underline decoration-white/30 underline-offset-2">Política de dados faciais</span>
        </span>
      </span>
      <span aria-hidden className={cn('relative z-[3] h-[30px] w-[50px] shrink-0 rounded-full p-[3px] transition-colors', on ? 'bg-[var(--sage)]' : 'bg-white/15')}>
        <motion.span className="block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.4)]" initial={false} animate={{ x: on ? 20 : 0 }} transition={springs.bouncy} />
      </span>
    </button>
  )
}

/** Stage 2 · biometric consent on its own screen, then the camera primer (one "Continuar"). */
export function ConsentScreen() {
  const consent = useLozuc((s) => s.consent)
  const setConsent = useLozuc((s) => s.setConsent)
  const toast = useLozuc((s) => s.toast)
  const { go } = useScreen()
  const web = useIsWeb()
  const reduced = useReducedMotion()
  const [declined, setDeclined] = useState(false)
  const denied = consent.camera === 'denied'

  const visual = (
    <div className={cn('glass glass-frost relative overflow-hidden', web ? 'h-full rounded-[32px]' : 'h-[170px] rounded-[26px]')}>
      <FaceView subject="face" material="scan" scan={62} framing="face" autoRotate className="absolute inset-0" />
      <span className="glass glass-pill liquid absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
        <Camera size={12} className="relative z-[3]" />
        <span className="relative z-[3]">Prévia da captura</span>
      </span>
    </div>
  )

  const body = (
    <>
      <p className="label">Etapa 2 · Receber boas imagens</p>
      <h1 className="display mt-2 text-[28px] font-semibold leading-[1.05] @3xl:text-[40px]">Antes da câmera, o combinado.</h1>

      <ul className="mt-4 flex flex-col gap-2.5 p-0">
        {ITEMS.map((it, i) => (
          <motion.li
            key={it.title}
            className="flex list-none items-center gap-3"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.4 }}
          >
            <IconDisc>
              <it.icon size={16} strokeWidth={1.8} />
            </IconDisc>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold leading-tight">{it.title}</span>
              <span className="block text-[12.5px] leading-snug text-[var(--text-3)]">{it.detail}</span>
            </span>
          </motion.li>
        ))}
      </ul>

      <div className="mt-4">
        <ConsentSwitch on={consent.biometric} onToggle={() => setConsent({ biometric: !consent.biometric })} />
      </div>

      <AnimatePresence initial={false}>
        {(declined || denied) && (
          <motion.div
            key={denied ? 'denied' : 'declined'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springs.soft}
            className="overflow-hidden"
          >
            <div className="glass glass-well mt-3 rounded-[20px] p-3.5 text-[12.5px] leading-snug text-[var(--text-2)]">
              <span className="relative z-[3] block">
                {denied
                  ? 'A câmera está desativada para o lozuc. Você pode enviar 3 fotos da galeria ou liberar a câmera nos Ajustes.'
                  : 'Sem as fotos não conseguimos montar sua leitura. Você pode voltar quando quiser — nada foi salvo.'}
              </span>
              {denied && (
                <span className="relative z-[3] mt-3 flex gap-2">
                  <Button variant="secondary" size="md" icon={<ImageIcon size={15} />} onClick={() => go('capture')}>
                    Enviar fotos da galeria
                  </Button>
                  <Button variant="ghost" size="md" icon={<Settings2 size={15} />} onClick={() => toast({ title: 'Ajustes do iPhone', detail: 'Privacidade → Câmera → lozuc' })}>
                    Abrir Ajustes
                  </Button>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--text-3)]">
        <Clock size={12} /> Na próxima tela o iPhone pede acesso à câmera.
      </p>
    </>
  )

  const cta = (
    <PinnedCTA web={web}>
      <Button
        className="w-full"
        disabled={!consent.biometric}
        onClick={() => {
          setConsent({ camera: 'granted' })
          go('capture')
        }}
      >
        Continuar
      </Button>
      {!consent.biometric && (
        <Button variant="ghost" size="md" className="w-full" onClick={() => setDeclined(true)}>
          Agora não
        </Button>
      )}
    </PinnedCTA>
  )

  const top = <TopBar onBack={() => go('profile')} backLabel="Voltar ao perfil" />

  if (web) {
    return (
      <ScreenFrame>
        <div className="grid h-full grid-cols-1 gap-8 p-8 @3xl:grid-cols-[1fr_1.05fr]">
          <div className="hidden @3xl:block">{visual}</div>
          <div className="flex min-h-0 flex-col">
            {top}
            <div className="mt-5 min-h-0 flex-1 overflow-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              {body}
              {cta}
            </div>
          </div>
        </div>
      </ScreenFrame>
    )
  }

  return (
    <ScreenFrame>
      <div className="relative h-full">
        <div className="absolute inset-x-5 top-[59px] z-20">{top}</div>
        <div className="absolute inset-x-0 bottom-0 top-[112px] overflow-y-auto px-5 pb-[150px] pt-2" style={{ scrollbarWidth: 'none' }}>
          {visual}
          <div className="mt-4">{body}</div>
        </div>
        {cta}
      </div>
    </ScreenFrame>
  )
}
