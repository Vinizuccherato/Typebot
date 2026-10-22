import { Clapperboard, Moon, Plane, Sunrise, type LucideIcon } from 'lucide-react'
import { useDomus } from '../store'

/** Home "scenes" — macros shared by the command palette and the AI assistant. */
export interface SceneMacro {
  id: 'movie' | 'goodnight' | 'away' | 'morning'
  name: string
  hint: string
  icon: LucideIcon
  keywords: string[]
  run: () => string[] // returns human-readable list of actions performed
}

const s = () => useDomus.getState()

export const SCENES: SceneMacro[] = [
  {
    id: 'movie',
    name: 'Movie Night',
    hint: 'TV on · lamp 12% · warm LED · speaker 55%',
    icon: Clapperboard,
    keywords: ['movie', 'cinema', 'film', 'filme', 'cine', 'pelicula', 'película'],
    run: () => {
      s().toggleNode('tv', true)
      s().toggleNode('sonos', true)
      s().setLamp({ on: true, intensity: 12 })
      s().setLed({ on: true, color: '#e0a64a', x: 0.96, y: 0.2, brightness: 40 })
      s().setSpeaker({ on: true, playing: true, volume: 55 })
      s().selectRoom('main-hall')
      s().setFocus('main-hall')
      return ['TV on', 'Lamp 12%', 'Warm LED', 'Speaker 55%']
    },
  },
  {
    id: 'goodnight',
    name: 'Good Night',
    hint: 'Lights off · door locked · 20.5°C · eco on',
    icon: Moon,
    keywords: ['night', 'sleep', 'bed', 'noite', 'dormir', 'noche', 'goodnight'],
    run: () => {
      s().setLamp({ on: false })
      s().setLed({ on: false })
      s().toggleNode('tv', false)
      s().setSpeaker({ playing: false })
      s().setDoorLocked(true)
      s().setRoomTarget('main-hall', 20.5)
      s().setEco(true)
      s().setFocus('overview')
      return ['Lights off', 'Door locked', 'Main Hall 20.5°C', 'Eco on']
    },
  },
  {
    id: 'away',
    name: 'Away Mode',
    hint: 'Everything off · CleanBot runs · door locked',
    icon: Plane,
    keywords: ['away', 'leave', 'leaving', 'out', 'sair', 'fora', 'viagem', 'salir', 'fuera'],
    run: () => {
      s().setLamp({ on: false })
      s().setLed({ on: false })
      s().toggleNode('tv', false)
      s().toggleNode('sonos', false)
      s().setSpeaker({ playing: false, on: false })
      s().toggleNode('cleanbot', true)
      s().setDoorLocked(true)
      s().setEco(true)
      s().setFocus('front-door')
      return ['All off', 'CleanBot running', 'Door locked', 'Eco on']
    },
  },
  {
    id: 'morning',
    name: 'Good Morning',
    hint: 'Lamp 70% · 22°C · speaker on · solar view',
    icon: Sunrise,
    keywords: ['morning', 'wake', 'manhã', 'manha', 'bom dia', 'mañana', 'buenos dias'],
    run: () => {
      s().setLamp({ on: true, intensity: 70 })
      s().setLed({ on: true, color: '#f1e3b8', x: 0.55, y: 0.08, brightness: 80 })
      s().setRoomTarget('main-hall', 22)
      s().toggleNode('sonos', true)
      s().setSpeaker({ on: true, playing: true, volume: 35 })
      s().setFocus('solar')
      return ['Lamp 70%', 'Main Hall 22°C', 'Speaker 35%', 'Solar view']
    },
  },
]
