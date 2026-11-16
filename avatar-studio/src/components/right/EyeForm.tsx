import { motion } from 'motion/react'
import { PersonStanding } from 'lucide-react'
import { EYE_FORMS, useStudio } from '../../store'
import { EyeArt } from '../art'
import { Label, Thumb, rovingKeys } from '../kit'

function BodyNote() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex h-full w-full flex-col gap-4">
      <div className="label">Body</div>
      <div className="glass glass-frost rounded-[18px] p-4 text-white" style={{ ['--g-fill-a' as string]: 'rgb(255 255 255 / 0.16)' }}>
        <div className="relative z-[3] flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25">
            <PersonStanding size={18} strokeWidth={1.6} />
          </span>
          <p className="text-[13px] leading-snug text-white/90">
            Shoulders and posture follow your face form for now. Height and build controls arrive in the next update.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function EyeForm() {
  const nav = useStudio((s) => s.nav)
  const form = useStudio((s) => s.look.eyeForm)
  const color = useStudio((s) => s.look.eyeColor)
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)
  if (nav === 'body') return <BodyNote />
  const idx = Math.max(0, EYE_FORMS.findIndex((f) => f.id === form))
  const pick = (id: (typeof EYE_FORMS)[number]['id']) => {
    setRegion('eyes')
    edit({ eyeForm: id })
  }
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Label region="eyes" id="eyeform-label">Eye form</Label>
      <div role="radiogroup" aria-labelledby="eyeform-label" className="grid grid-cols-4 gap-x-[12px] gap-y-[12px] self-start" onKeyDown={rovingKeys(EYE_FORMS, idx, (f) => pick(f.id), 4)}>
        {EYE_FORMS.map((f, i) => (
          <Thumb key={f.id} label={`${f.label} eyes`} selected={f.id === form} idx={i} tabIndex={i === idx ? 0 : -1} onClick={() => pick(f.id)} className="h-[48px] w-[70px]">
            <EyeArt form={f.id} color={color} width={70} height={48} />
          </Thumb>
        ))}
      </div>
    </div>
  )
}
