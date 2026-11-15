import { createContext, useContext } from 'react'

/** CSS scale of the enclosing transformed region — lets WebGL render at matching resolution. */
export const UiScale = createContext(1)
export const useUiScale = () => useContext(UiScale)
