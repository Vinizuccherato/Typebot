import { useEffect } from 'react'
import { preloadHead } from './geo/useHeadGeometry'

/** Mount once near the app root: starts meshing the shared head geometry in the worker. */
export function SceneRoot() {
  useEffect(() => preloadHead(), [])
  return null
}
