'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with function to avoid hydration mismatch
  // During SSR, always use initialValue since window is not available
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Check for window availability (SSR compatibility)
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value

        // Check for window availability before accessing localStorage
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore))
          } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error)
          }
        }

        return valueToStore
      })
    },
    [key]
  )

  // Sync across browser tabs via storage event listener
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      } else if (event.key === key && event.newValue === null) {
        // Key was removed
        setStoredValue(initialValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue]
}
