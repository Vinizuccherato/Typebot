import { create } from 'zustand'
import type { FeatureId } from '../lib/face'
import { analyse, placeholderPoints, type FaceSummary, type FeatureReport, type Normals, type Points } from './model'

/* Resolved landmarks + derived visagism report, shared by the 3D layer and the inspector. */
interface AnalysisState {
  points: Points
  normals: Normals
  /** true once landmarks were raycast onto the real sculpted head */
  fromMesh: boolean
  reports: Record<FeatureId, FeatureReport>
  summary: FaceSummary
  setResolved: (points: Points, normals: Normals, fromMesh: boolean) => void
}

const init = placeholderPoints()
const initReport = analyse(init.points)

export const useAnalysis = create<AnalysisState>()((set) => ({
  points: init.points,
  normals: init.normals,
  fromMesh: false,
  reports: initReport.reports,
  summary: initReport.summary,
  setResolved: (points, normals, fromMesh) => set({ points, normals, fromMesh, ...analyse(points) }),
}))
