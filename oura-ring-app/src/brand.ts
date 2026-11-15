/**
 * Product naming. Defaults reproduce the reference shot; set VITE_BRAND=neutral
 * at build time for a publicly hosted demo that carries no third-party branding.
 */
const neutral = import.meta.env.VITE_BRAND === 'neutral'

export const BRAND = {
  neutral,
  model: neutral ? 'Halo Ring 4' : 'Oura Ring 4',
}
