/* World layout (metres). Front façade faces +z; camera sits front-right. */

export interface Box3 {
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
}

export const cx = (b: Box3) => (b.x0 + b.x1) / 2
export const cy = (b: Box3) => (b.y0 + b.y1) / 2
export const cz = (b: Box3) => (b.z0 + b.z1) / 2
export const sx = (b: Box3) => b.x1 - b.x0
export const sy = (b: Box3) => b.y1 - b.y0
export const sz = (b: Box3) => b.z1 - b.z0

/** White podium the house stands on. */
export const PLINTH: Box3 = { x0: -11.2, x1: 8.2, y0: 0, y1: 1, z0: -10.6, z1: 6.0 }

/** Glass pavilion — the Main Hall. */
export const PAV: Box3 = { x0: -10, x1: 6.4, y0: 1, y1: 5.0, z0: -4.9, z1: 4.6 }

/** Thick cantilevered roof slab carrying the solar array. */
export const SLAB: Box3 = { x0: -10.6, x1: 7.3, y0: 5.0, y1: 5.85, z0: -5.7, z1: 5.55 }

/** Taller white volume at the back-right. */
export const TOWER: Box3 = { x0: -5.6, x1: 7.4, y0: 1, y1: 8.2, z0: -10.2, z1: -5.0 }

/** Low wing to the right (mostly behind the right UI column). */
export const WING: Box3 = { x0: 7.4, x1: 10.2, y0: 0, y1: 3.1, z0: -10.2, z1: -4.6 }

/** Solar array footprint on SLAB's top. */
export const ARRAY = { x0: -9.1, x1: 5.5, z0: -2.9, z1: 4.55, y: SLAB.y1 + 0.02, cols: 7, rows: 3 }

/** Left part of the pavilion façade with dense vertical fins. */
export const FIN_X1 = -7.0

/** Sliding front door (in the front glazing). */
export const DOOR = { x0: 3.9, x1: 5.5, slide: 1.56 }

/** Front stair down from the podium. */
export const STAIRS = { x0: -0.8, x1: 3.4, steps: 4, tread: 0.5 }

export const ARRAY_CENTER: [number, number, number] = [(ARRAY.x0 + ARRAY.x1) / 2, ARRAY.y, (ARRAY.z0 + ARRAY.z1) / 2]

/** Tower glazing band above the slab. */
export const TOWER_GLASS = { y0: SLAB.y1, y1: SLAB.y1 + 1.35 }

/** Reticle sits left of the array centre, as in the reference. */
export const RETICLE: [number, number, number] = [-3.2, ARRAY.y, (ARRAY.z0 + ARRAY.z1) / 2 - 0.3]
