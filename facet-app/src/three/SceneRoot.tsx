import { useEffect } from 'react'
import { preloadAvatar } from './geo/useAvatarGeometry'

/**
 * Starts the one-time face build (Web Worker, ~3–5 s) as soon as the app mounts, so the
 * geometry is usually ready by the time the first FaceView scrolls into view. Every
 * FaceView then shares that geometry (see the note in FaceView.tsx).
 */
export function SceneRoot() {
  useEffect(() => {
    preloadAvatar().catch(() => {})
  }, [])
  return null
}
