'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/contexts/settings-context'
import { api } from '@/lib/api'
import type { Item } from '@/lib/types'

export default function SettingsPage() {
  const {
    defaultFilters,
    setDefaultFilters,
    resetToSystemDefaults,
    favorites,
    removeFavorite,
    clearFavorites,
    blockedItems,
    removeBlocked,
    clearBlocked,
  } = useSettings()

  const [minPrice, setMinPrice] = useState(defaultFilters.minPrice)
  const [maxPrice, setMaxPrice] = useState(defaultFilters.maxPrice)
  const [minMargin, setMinMargin] = useState(defaultFilters.minMargin)
  const [minVolume, setMinVolume] = useState(defaultFilters.minVolume)
  const [maxVolume, setMaxVolume] = useState(defaultFilters.maxVolume)
  const [showSaved, setShowSaved] = useState(false)

  // Favorites state
  const [favoriteItems, setFavoriteItems] = useState<Item[]>([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  // Blocked items state
  const [blockedItemDetails, setBlockedItemDetails] = useState<Item[]>([])
  const [loadingBlocked, setLoadingBlocked] = useState(false)

  // Fetch favorite items
  useEffect(() => {
    if (favorites.length === 0) {
      setFavoriteItems([])
      return
    }

    setLoadingFavorites(true)
    Promise.all(
      favorites.map((id) =>
        api.get<Item>(`/api/items/${id}`).catch(() => null)
      )
    )
      .then((items) => {
        setFavoriteItems(items.filter((item): item is Item => item !== null))
      })
      .finally(() => setLoadingFavorites(false))
  }, [favorites])

  // Fetch blocked items
  useEffect(() => {
    if (blockedItems.length === 0) {
      setBlockedItemDetails([])
      return
    }

    setLoadingBlocked(true)
    Promise.all(
      blockedItems.map((id) =>
        api.get<Item>(`/api/items/${id}`).catch(() => null)
      )
    )
      .then((items) => {
        setBlockedItemDetails(items.filter((item): item is Item => item !== null))
      })
      .finally(() => setLoadingBlocked(false))
  }, [blockedItems])

  const handleSaveDefaults = () => {
    setDefaultFilters({
      minPrice,
      maxPrice,
      minMargin,
      minVolume,
      maxVolume,
    })
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleResetToSystemDefaults = () => {
    resetToSystemDefaults()
    setMinPrice('')
    setMaxPrice('')
    setMinMargin('')
    setMinVolume('')
    setMaxVolume('')
  }

  const handleClearAllFavorites = () => {
    if (window.confirm('Are you sure you want to clear all favorites?')) {
      clearFavorites()
    }
  }

  const handleClearAllBlocked = () => {
    if (window.confirm('Are you sure you want to clear all blocked items?')) {
      clearBlocked()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Default Filter Values Section */}
      <Card>
        <CardHeader>
          <CardTitle>Default Filter Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultMinPrice">Min Price</Label>
              <Input
                id="defaultMinPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="defaultMaxPrice">Max Price</Label>
              <Input
                id="defaultMaxPrice"
                type="number"
                placeholder="No limit"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="defaultMinMargin">Min Margin</Label>
            <Input
              id="defaultMinMargin"
              type="number"
              placeholder="0"
              value={minMargin}
              onChange={(e) => setMinMargin(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultMinVolume">Min Volume</Label>
              <Input
                id="defaultMinVolume"
                type="number"
                placeholder="0"
                value={minVolume}
                onChange={(e) => setMinVolume(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="defaultMaxVolume">Max Volume</Label>
              <Input
                id="defaultMaxVolume"
                type="number"
                placeholder="No limit"
                value={maxVolume}
                onChange={(e) => setMaxVolume(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSaveDefaults}>
              Save Defaults
            </Button>
            <Button variant="outline" onClick={handleResetToSystemDefaults}>
              Reset to System Defaults
            </Button>
          </div>
          {showSaved && (
            <p className="text-sm text-green-600">Defaults saved successfully!</p>
          )}
        </CardContent>
      </Card>

      {/* Favorites Section */}
      <Card>
        <CardHeader>
          <CardTitle>Favorites ({favorites.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {favorites.length === 0 ? (
            <p className="text-muted-foreground">No favorites yet</p>
          ) : loadingFavorites ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {favoriteItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.icon_url && (
                      <img
                        src={item.icon_url}
                        alt={item.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span>{item.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorite(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleClearAllFavorites}
              >
                Clear All Favorites
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Blocked Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Items ({blockedItems.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {blockedItems.length === 0 ? (
            <p className="text-muted-foreground">No blocked items</p>
          ) : loadingBlocked ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {blockedItemDetails.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {item.icon_url && (
                      <img
                        src={item.icon_url}
                        alt={item.name}
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span>{item.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlocked(item.id)}
                  >
                    Unblock
                  </Button>
                </div>
              ))}
              <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleClearAllBlocked}
              >
                Clear All Blocked
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
