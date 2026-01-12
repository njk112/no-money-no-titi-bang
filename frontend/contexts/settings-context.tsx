'use client'

import { createContext, useContext, useCallback, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import {
  STORAGE_KEYS,
  DefaultFilters,
  SYSTEM_DEFAULT_FILTERS,
} from '@/lib/constants'

interface SettingsContextValue {
  // Favorites
  favorites: number[]
  toggleFavorite: (id: number) => void
  removeFavorite: (id: number) => void
  clearFavorites: () => void

  // Blocked items
  blockedItems: number[]
  toggleBlocked: (id: number) => void
  removeBlocked: (id: number) => void
  clearBlocked: () => void

  // Default filters
  defaultFilters: DefaultFilters
  setDefaultFilters: (filters: DefaultFilters) => void
  resetToSystemDefaults: () => void

  // Show favorites only
  showFavoritesOnly: boolean
  setShowFavoritesOnly: (show: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  // Favorites state
  const [favorites, setFavorites] = useLocalStorage<number[]>(
    STORAGE_KEYS.FAVORITES,
    []
  )

  // Blocked items state
  const [blockedItems, setBlockedItems] = useLocalStorage<number[]>(
    STORAGE_KEYS.BLOCKED_ITEMS,
    []
  )

  // Default filters state
  const [defaultFilters, setDefaultFiltersState] =
    useLocalStorage<DefaultFilters>(
      STORAGE_KEYS.DEFAULT_FILTERS,
      SYSTEM_DEFAULT_FILTERS
    )

  // Show favorites only state
  const [showFavoritesOnly, setShowFavoritesOnly] = useLocalStorage<boolean>(
    STORAGE_KEYS.SHOW_FAVORITES_ONLY,
    false
  )

  // Favorites handlers
  const toggleFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) =>
        prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
      )
    },
    [setFavorites]
  )

  const removeFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) => prev.filter((fid) => fid !== id))
    },
    [setFavorites]
  )

  const clearFavorites = useCallback(() => {
    setFavorites([])
  }, [setFavorites])

  // Blocked items handlers
  const toggleBlocked = useCallback(
    (id: number) => {
      setBlockedItems((prev) =>
        prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
      )
    },
    [setBlockedItems]
  )

  const removeBlocked = useCallback(
    (id: number) => {
      setBlockedItems((prev) => prev.filter((bid) => bid !== id))
    },
    [setBlockedItems]
  )

  const clearBlocked = useCallback(() => {
    setBlockedItems([])
  }, [setBlockedItems])

  // Default filters handlers
  const setDefaultFilters = useCallback(
    (filters: DefaultFilters) => {
      setDefaultFiltersState(filters)
    },
    [setDefaultFiltersState]
  )

  const resetToSystemDefaults = useCallback(() => {
    setDefaultFiltersState(SYSTEM_DEFAULT_FILTERS)
  }, [setDefaultFiltersState])

  const value: SettingsContextValue = {
    favorites,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    blockedItems,
    toggleBlocked,
    removeBlocked,
    clearBlocked,
    defaultFilters,
    setDefaultFilters,
    resetToSystemDefaults,
    showFavoritesOnly,
    setShowFavoritesOnly,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
