import { Glass } from '../../ui/Glass'

/** STUB — replaced by its owner agent. */
export function ZoomControl() {
  return (
    <Glass variant="pill" className="grid h-full w-full place-items-center text-sm text-white">
      <span className="relative z-[3]">Zoom</span>
    </Glass>
  )
}

/** STUB — MIN–MAX strength slider for the active region. */
export function StrengthSlider() {
  return <Glass variant="pill" className="h-full w-full" />
}

/** STUB — compare (hold) + edit buttons. */
export function ViewTools() {
  return <Glass variant="pill" className="h-full w-full" />
}
