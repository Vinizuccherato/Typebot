import type * as THREE from 'three'

/** True on software rasterisers (SwiftShader / llvmpipe) — they get a lean, intro-less profile. */
export function isSoftwareRenderer(gl: THREE.WebGLRenderer) {
  const ctx = gl.getContext()
  const ext = ctx.getExtension('WEBGL_debug_renderer_info')
  const name = String(ext ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER))
  return /swiftshader|llvmpipe|software/i.test(name)
}
