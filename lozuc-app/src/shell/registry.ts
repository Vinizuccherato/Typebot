import type { ComponentType } from 'react'
import type { ScreenId } from '../store'
import { WelcomeScreen } from '../screens/Welcome'
import { ProfileScreen } from '../screens/Profile'
import { ConsentScreen } from '../screens/Consent'
import { CaptureScreen } from '../screens/Capture'
import { ProcessingScreen } from '../screens/Processing'
import { ReadingScreen } from '../screens/Reading'
import { PaywallScreen } from '../screens/Paywall'
import { DirectionsScreen } from '../screens/Directions'
import { SimulationScreen } from '../screens/Simulation'
import { GuideScreen } from '../screens/Guide'
import { RoutineScreen } from '../screens/Routine'
import { PlanScreen } from '../screens/Plan'
import { HomeScreen } from '../screens/Home'
import { PersonalScreen } from '../screens/Personal'
import { EvolutionScreen } from '../screens/Evolution'
import { SettingsScreen } from '../screens/Settings'

/** Screen id → component (shared by the board, prototype, phone and web app). */
export const COMPONENTS: Record<ScreenId, ComponentType> = {
  welcome: WelcomeScreen,
  profile: ProfileScreen,
  consent: ConsentScreen,
  capture: CaptureScreen,
  processing: ProcessingScreen,
  reading: ReadingScreen,
  paywall: PaywallScreen,
  directions: DirectionsScreen,
  simulation: SimulationScreen,
  guide: GuideScreen,
  routine: RoutineScreen,
  plan: PlanScreen,
  home: HomeScreen,
  personal: PersonalScreen,
  evolution: EvolutionScreen,
  settings: SettingsScreen,
}
