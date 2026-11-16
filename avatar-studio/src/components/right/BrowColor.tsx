import { BROW_COLORS, useStudio } from '../../store'
import { Label, SwatchRow } from '../kit'

export function BrowColor() {
  const color = useStudio((s) => s.look.browColor)
  const edit = useStudio((s) => s.edit)
  const setRegion = useStudio((s) => s.setRegion)
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <Label region="brows">Eyebrow color</Label>
      <SwatchRow
        label="Eyebrow colour"
        colors={BROW_COLORS}
        value={color}
        onPick={(hex) => {
          setRegion('brows')
          edit({ browColor: hex })
        }}
      />
    </div>
  )
}
