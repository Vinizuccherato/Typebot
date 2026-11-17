/**
 * SVG filter used by `.glass.liquid` (backdrop-filter: url(#lz-refract) …).
 * A low-frequency displacement map bends the backdrop near edges like thick
 * glass; Chromium applies it, other engines drop it and keep the blur.
 * Render once at the app root.
 */
export function LiquidFilter() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <filter id="lz-refract" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="4" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="18" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}
