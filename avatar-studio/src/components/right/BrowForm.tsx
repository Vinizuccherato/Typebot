import { BROW_FORMS, useStudio } from '../../store'
import { BrowArt } from '../art'
import { Label, Thumb, rovingKeys } from '../kit'

export function BrowForm() {
  const form = useStudio((s) => s.look.browForm)
  const color = useStudio((s) => s.look.browColor)
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)
  const idx = Math.max(0, BROW_FORMS.findIndex((f) => f.id === form))
  const pick = (id: (typeof BROW_FORMS)[number]['id']) => {
    setRegion('brows')
    edit({ browForm: id })
  }
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Label region="brows" id="browform-label">Eyebrow form</Label>
      <div role="radiogroup" aria-labelledby="browform-label" className="grid grid-cols-2 gap-x-[14px] gap-y-[12px] self-start" onKeyDown={rovingKeys(BROW_FORMS, idx, (f) => pick(f.id), 2)}>
        {BROW_FORMS.map((f, i) => (
          <Thumb key={f.id} label={`${f.label} brows`} selected={f.id === form} idx={i} tabIndex={i === idx ? 0 : -1} onClick={() => pick(f.id)} className="h-[40px] w-[150px]">
            <BrowArt form={f.id} color={color} width={150} height={40} />
          </Thumb>
        ))}
      </div>
    </div>
  )
}
