export const STORAGE_KEYS = {
  FAVORITES: 'osrs-ge-favorites',
  BLOCKED_ITEMS: 'osrs-ge-blocked-items',
  DEFAULT_FILTERS: 'osrs-ge-default-filters',
  SHOW_FAVORITES_ONLY: 'osrs-ge-show-favorites-only',
} as const

export interface DefaultFilters {
  minPrice: string
  maxPrice: string
  minMargin: string
  minVolume: string
  maxVolume: string
}

export const SYSTEM_DEFAULT_FILTERS: DefaultFilters = {
  minPrice: '',
  maxPrice: '',
  minMargin: '',
  minVolume: '',
  maxVolume: '',
}
