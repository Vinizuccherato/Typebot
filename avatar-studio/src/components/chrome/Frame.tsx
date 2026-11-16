/** The big outline window around the avatar, with the hairline divider before the right column. */
export function Frame() {
  return (
    <div aria-hidden className="glass glass-smoke relative h-full w-full rounded-[30px]">
      <span
        className="absolute bottom-0 top-0 z-[3] w-px"
        style={{ left: 861, background: 'linear-gradient(180deg, rgb(255 255 255 / 0.05), rgb(255 255 255 / 0.55) 20%, rgb(255 255 255 / 0.55) 80%, rgb(255 255 255 / 0.05))' }}
      />
    </div>
  )
}
