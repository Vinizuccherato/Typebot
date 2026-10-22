import * as THREE from 'three'
import { solarCellTexture } from './textures'

/* Shared materials — one instance each, reused by every mesh (fewer programs, fewer state changes). */

let cache: ReturnType<typeof build> | null = null

function build() {
  const concrete = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.62, metalness: 0, envMapIntensity: 0.9 })
  const concreteShade = new THREE.MeshStandardMaterial({ color: '#e3e0da', roughness: 0.7, metalness: 0, envMapIntensity: 0.7 })
  const frame = new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.38, metalness: 0.55, envMapIntensity: 1 })
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#5d6668',
    metalness: 0.1,
    roughness: 0.04,
    transparent: true,
    opacity: 0.46,
    envMapIntensity: 3.6,
    ior: 1.5,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    depthWrite: false,
    side: THREE.FrontSide,
  })
  const glassDark = glass.clone()
  glassDark.color.set('#3a4144')
  glassDark.opacity = 0.62
  const floor = new THREE.MeshStandardMaterial({ color: '#5a554e', roughness: 0.3, metalness: 0.05, envMapIntensity: 0.9, emissive: '#15130f' })
  const wallInner = new THREE.MeshStandardMaterial({ color: '#e9e6e0', roughness: 0.85, metalness: 0, emissive: '#2c2925' })
  const fabric = new THREE.MeshStandardMaterial({ color: '#8f897f', roughness: 0.96, metalness: 0 })
  const wood = new THREE.MeshStandardMaterial({ color: '#7b6550', roughness: 0.6, metalness: 0 })
  const darkMatte = new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.55, metalness: 0.2 })
  const solar = new THREE.MeshStandardMaterial({
    map: solarCellTexture(),
    color: '#ffffff',
    roughness: 0.34,
    metalness: 0.3,
    envMapIntensity: 1.4,
  })
  const solarFrame = new THREE.MeshStandardMaterial({ color: '#e6e9ee', roughness: 0.3, metalness: 0.4 })
  const leaf = new THREE.MeshStandardMaterial({ color: '#6f7a5c', roughness: 0.95, metalness: 0 })
  const leafDark = new THREE.MeshStandardMaterial({ color: '#515c45', roughness: 0.95, metalness: 0 })
  const trunk = new THREE.MeshStandardMaterial({ color: '#4b4038', roughness: 1 })
  const pot = new THREE.MeshStandardMaterial({ color: '#d9d4cc', roughness: 0.8 })
  const white = new THREE.MeshStandardMaterial({ color: '#fafafa', roughness: 0.35, metalness: 0.05 })
  return {
    concrete,
    concreteShade,
    frame,
    glass,
    glassDark,
    floor,
    wallInner,
    fabric,
    wood,
    darkMatte,
    solar,
    solarFrame,
    leaf,
    leafDark,
    trunk,
    pot,
    white,
  }
}

export const materials = () => (cache ??= build())
