import { EYE_COLORS, SHIRT_COLORS, useStudio } from '../../store'
import { Label, SwatchRow } from '../kit'

const SHIRTS = SHIRT_COLORS.map((hex, i) => ({ id: `shirt-${i}`, label: ['Chalk', 'Ink', 'Sand', 'Mist', 'Rose'][i] ?? hex, hex }))

export function EyeColor() {
  const nav = useStudio((s) => s.nav)
  const eyeColor = useStudio((s) => s.look.eyeColor)
  const shirt = useStudio((s) => s.look.shirt)
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)

  if (nav === 'outfit')
    return (
      <div className="flex h-full w-full flex-col gap-4">
        <Label>Shirt color</Label>
        <SwatchRow label="Shirt colour" colors={SHIRTS} value={shirt} onPick={(hex) => edit({ shirt: hex })} />
      </div>
    )

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Label region="eyes">Eye color</Label>
      <SwatchRow
        label="Eye colour"
        colors={EYE_COLORS}
        value={eyeColor}
        onPick={(hex) => {
          setRegion('eyes')
          edit({ eyeColor: hex })
        }}
      />
    </div>
  )
}
