import { useId } from 'react'
import { motion } from 'motion/react'
import { prefersReducedMotion } from '../../lib/utils'

/* Hand-drawn product renders (SVG) for the "Nodes connected in a room" tiles.
   Each fits a 100×80 viewBox and is lit from the top-left, matching the scene. */

interface IllustrationProps {
  on: boolean
  className?: string
}

const reduced = () => prefersReducedMotion()

/** Smart OLED TV 65" — razor-thin panel in a slight 3/4 view on a pedestal stand. */
export function TvIllustration({ on, className }: IllustrationProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="1" stopColor="#0b0b0b" />
        </linearGradient>
        <linearGradient id={`${id}-off`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b1c1e" />
          <stop offset="0.55" stopColor="#060607" />
          <stop offset="1" stopColor="#111214" />
        </linearGradient>
        <linearGradient id={`${id}-on`} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="#c6ef8e" />
          <stop offset="0.35" stopColor="#4d7c63" />
          <stop offset="0.7" stopColor="#23304a" />
          <stop offset="1" stopColor="#d9a35c" />
          {!reduced() && (
            <animateTransform attributeName="gradientTransform" type="rotate" values="0 .5 .5;360 .5 .5" dur="14s" repeatCount="indefinite" />
          )}
        </linearGradient>
        <linearGradient id={`${id}-glare`} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="0.43" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-stand`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1a1a1a" />
          <stop offset="0.5" stopColor="#4a4a4a" />
          <stop offset="1" stopColor="#151515" />
        </linearGradient>
        <filter id={`${id}-bloom`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <ellipse cx="50" cy="73.5" rx="24" ry="3" fill={`url(#${id}-shadow)`} />
      {/* stand */}
      <path d="M47.6 58 h4.8 l0.8 12 h-6.4 z" fill={`url(#${id}-stand)`} />
      <ellipse cx="50" cy="71" rx="13" ry="2.1" fill="#111" />
      <ellipse cx="50" cy="70.4" rx="12.4" ry="1.5" fill="#2f2f2f" />

      {/* screen light spill */}
      <motion.path
        d="M14 15 L88 11 L88 55 L14 59 Z"
        fill={`url(#${id}-on)`}
        filter={`url(#${id}-bloom)`}
        initial={false}
        animate={{ opacity: on ? 0.45 : 0 }}
        transition={{ duration: 0.8 }}
      />
      {/* panel (perspective: left edge taller → turned slightly right) */}
      <path d="M12 13.4 L89.4 9 L89.4 57 L12 61.4 Z" fill={`url(#${id}-bezel)`} />
      <path d="M89.4 9 L90.6 9.6 L90.6 56.6 L89.4 57 Z" fill="#000" />
      <path d="M13.4 14.8 L88 10.6 L88 55.6 L13.4 60 Z" fill={`url(#${id}-off)`} />
      <motion.path
        d="M13.4 14.8 L88 10.6 L88 55.6 L13.4 60 Z"
        fill={`url(#${id}-on)`}
        initial={false}
        animate={{ opacity: on ? 0.92 : 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <path d="M13.4 14.8 L88 10.6 L88 55.6 L13.4 60 Z" fill={`url(#${id}-glare)`} />
      <path d="M12 13.4 L89.4 9" stroke="#fff" strokeOpacity="0.28" strokeWidth="0.5" />
    </svg>
  )
}

/** Sonos Era 300 — sculpted hourglass body with perforated grille and status LED. */
export function SonosIllustration({ on, className }: IllustrationProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a0a0a" />
          <stop offset="0.22" stopColor="#2b2b2c" />
          <stop offset="0.5" stopColor="#171718" />
          <stop offset="1" stopColor="#060606" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a4a4b" />
          <stop offset="1" stopColor="#1c1c1d" />
        </linearGradient>
        <pattern id={`${id}-grille`} width="2.2" height="2.2" patternUnits="userSpaceOnUse">
          <circle cx="1.1" cy="1.1" r="0.42" fill="#000" fillOpacity="0.75" />
        </pattern>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.28" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.6" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-led`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e8ffd0" />
          <stop offset="0.4" stopColor="#c6ef8e" />
          <stop offset="1" stopColor="#c6ef8e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="73" rx="22" ry="3.2" fill={`url(#${id}-shadow)`} />
      {/* body: wider top & base, pinched waist */}
      <path
        d="M29 14 Q29 9 35 9 L65 9 Q71 9 71 14 L69.5 36 Q68.6 41 69.5 46 L71 66 Q71 71 65 71 L35 71 Q29 71 29 66 L30.5 46 Q31.4 41 30.5 36 Z"
        fill={`url(#${id}-body)`}
      />
      <path
        d="M31.5 16 Q31.5 12.5 36 12.5 L64 12.5 Q68.5 12.5 68.5 16 L67.2 36.5 Q66.4 41 67.2 45.5 L68.5 64 Q68.5 68 64 68 L36 68 Q31.5 68 31.5 64 L32.8 45.5 Q33.6 41 32.8 36.5 Z"
        fill={`url(#${id}-grille)`}
      />
      <path d="M29 14 Q29 9 35 9 L65 9 Q71 9 71 14 L69.5 36 Q68.6 41 69.5 46 L71 66 Q71 71 65 71 L35 71 Q29 71 29 66 L30.5 46 Q31.4 41 30.5 36 Z" fill={`url(#${id}-sheen)`} />
      {/* top cap */}
      <path d="M33 9.4 L67 9.4 Q70 9.6 70.4 12 L29.6 12 Q30 9.6 33 9.4 Z" fill={`url(#${id}-top)`} />
      <path d="M33 9.4 L67 9.4" stroke="#fff" strokeOpacity="0.25" strokeWidth="0.5" />
      {/* touch strip & LED */}
      <rect x="43" y="10.2" width="14" height="0.9" rx="0.45" fill="#000" fillOpacity="0.5" />
      <motion.circle
        cx="50"
        cy="16"
        r="3"
        fill={`url(#${id}-led)`}
        initial={false}
        animate={{ opacity: on ? [0.65, 1, 0.65] : 0 }}
        transition={on && !reduced() ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      />
      <circle cx="50" cy="16" r="0.8" fill={on ? '#f2ffe4' : '#3a3a3a'} />
    </svg>
  )
}

/** Aether CleanBot V4 — white disc robot with lidar turret and lime status ring. */
export function CleanBotIllustration({ on, className }: IllustrationProps) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-top`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eceae6" />
          <stop offset="1" stopColor="#c9c6c0" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#bdbab3" />
          <stop offset="0.35" stopColor="#f2f0ec" />
          <stop offset="1" stopColor="#8f8c86" />
        </linearGradient>
        <linearGradient id={`${id}-turret`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d6d3cd" />
          <stop offset="0.4" stopColor="#ffffff" />
          <stop offset="1" stopColor="#a9a6a0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.6" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <ellipse cx="50" cy="66" rx="40" ry="7" fill={`url(#${id}-shadow)`} />
      {/* side wall + bumper */}
      <path d="M12 46 A38 14 0 0 0 88 46 L88 54 A38 14 0 0 1 12 54 Z" fill={`url(#${id}-side)`} />
      <path d="M12.6 52 A38 14 0 0 0 87.4 52 L87.6 55 A38 14 0 0 1 12.4 55 Z" fill="#1b1b1b" fillOpacity="0.85" />
      {/* top disc */}
      <ellipse cx="50" cy="46" rx="38" ry="14" fill={`url(#${id}-top)`} />
      <ellipse cx="50" cy="46" rx="38" ry="14" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.5" />
      <ellipse cx="50" cy="47" rx="27" ry="9.6" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="0.6" />
      {/* button */}
      <ellipse cx="66" cy="49.5" rx="3.4" ry="1.3" fill="#d9d6d0" stroke="#000" strokeOpacity="0.12" strokeWidth="0.4" />
      {/* status ring around turret */}
      <motion.ellipse
        cx="50"
        cy="43"
        rx="11.5"
        ry="4.4"
        fill="none"
        stroke="#c6ef8e"
        strokeWidth="1.6"
        filter={`url(#${id}-glow)`}
        initial={false}
        animate={{ opacity: on ? [0.35, 1, 0.35] : 0 }}
        transition={on && !reduced() ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.4 }}
      />
      <ellipse cx="50" cy="43" rx="11.5" ry="4.4" fill="none" stroke={on ? '#c6ef8e' : '#b8b5ae'} strokeOpacity={on ? 0.9 : 0.5} strokeWidth="0.7" />
      {/* lidar turret */}
      <path d="M41 36 L59 36 L59 42 A9 3.4 0 0 1 41 42 Z" fill={`url(#${id}-turret)`} />
      <path d="M41 38.6 L59 38.6 L59 40.4 A9 3.4 0 0 1 41 40.4 Z" fill="#141414" fillOpacity="0.9" />
      <ellipse cx="50" cy="36" rx="9" ry="3.4" fill="#fafaf8" />
      <ellipse cx="50" cy="36" rx="9" ry="3.4" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="0.4" />
      <ellipse cx="47" cy="35.2" rx="4" ry="1" fill="#fff" />
    </svg>
  )
}
