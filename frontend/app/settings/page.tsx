'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/contexts/settings-context'
import { useRegimeThresholds } from '@/hooks/use-regime-thresholds'
import { SYSTEM_DEFAULT_FILTERS } from '@/lib/constants'
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

  // Regime thresholds
  const {
    thresholds,
    isLoading: isLoadingThresholds,
    error: thresholdsError,
    updateThresholds,
    runCalibration,
    suggestedThresholds,
    isCalibrating,
  } = useRegimeThresholds()

  const [chopMax, setChopMax] = useState('')
  const [rangeNormMax, setRangeNormMax] = useState('')
  const [slopeNormMax, setSlopeNormMax] = useState('')
  const [crossRateMin, setCrossRateMin] = useState('')
  const [windowSize, setWindowSize] = useState('')
  const [isSavingThresholds, setIsSavingThresholds] = useState(false)
  const [thresholdsSaved, setThresholdsSaved] = useState(false)
  const [thresholdsSaveError, setThresholdsSaveError] = useState<string | null>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [recalculateResult, setRecalculateResult] = useState<string | null>(null)
  const [recalculateError, setRecalculateError] = useState<string | null>(null)

  // Sync threshold inputs when thresholds load
  useEffect(() => {
    if (thresholds) {
      setChopMax(String(thresholds.chop_max))
      setRangeNormMax(String(thresholds.range_norm_max))
      setSlopeNormMax(String(thresholds.slope_norm_max))
      setCrossRateMin(String(thresholds.cross_rate_min))
      setWindowSize(String(thresholds.window_size))
    }
  }, [thresholds])

  // Sync local state when defaultFilters changes (e.g., from another tab)
  useEffect(() => {
    setMinPrice(defaultFilters.minPrice)
    setMaxPrice(defaultFilters.maxPrice)
    setMinMargin(defaultFilters.minMargin)
    setMinVolume(defaultFilters.minVolume)
    setMaxVolume(defaultFilters.maxVolume)
  }, [defaultFilters])

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
    api
      .get<Item[]>(`/api/items/batch?ids=${favorites.join(',')}`)
      .then((items) => setFavoriteItems(items))
      .catch(() => setFavoriteItems([]))
      .finally(() => setLoadingFavorites(false))
  }, [favorites])

  // Fetch blocked items
  useEffect(() => {
    if (blockedItems.length === 0) {
      setBlockedItemDetails([])
      return
    }

    setLoadingBlocked(true)
    api
      .get<Item[]>(`/api/items/batch?ids=${blockedItems.join(',')}`)
      .then((items) => setBlockedItemDetails(items))
      .catch(() => setBlockedItemDetails([]))
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
    setMinPrice(SYSTEM_DEFAULT_FILTERS.minPrice)
    setMaxPrice(SYSTEM_DEFAULT_FILTERS.maxPrice)
    setMinMargin(SYSTEM_DEFAULT_FILTERS.minMargin)
    setMinVolume(SYSTEM_DEFAULT_FILTERS.minVolume)
    setMaxVolume(SYSTEM_DEFAULT_FILTERS.maxVolume)
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

  const handleSaveThresholds = async () => {
    setIsSavingThresholds(true)
    setThresholdsSaveError(null)
    try {
      await updateThresholds({
        chop_max: parseFloat(chopMax),
        range_norm_max: parseFloat(rangeNormMax),
        slope_norm_max: parseFloat(slopeNormMax),
        cross_rate_min: parseFloat(crossRateMin),
        window_size: parseInt(windowSize, 10),
      })
      setThresholdsSaved(true)
      setTimeout(() => setThresholdsSaved(false), 2000)
    } catch {
      setThresholdsSaveError('Failed to save thresholds')
    } finally {
      setIsSavingThresholds(false)
    }
  }

  const handleRunCalibration = async () => {
    try {
      await runCalibration()
    } catch {
      // Error already handled by hook
    }
  }

  const handleApplySuggestions = () => {
    if (suggestedThresholds) {
      setChopMax(String(suggestedThresholds.suggested.chop_max))
      setRangeNormMax(String(suggestedThresholds.suggested.range_norm_max))
      setSlopeNormMax(String(suggestedThresholds.suggested.slope_norm_max))
      setCrossRateMin(String(suggestedThresholds.suggested.cross_rate_min))
    }
  }

  const handleRecalculate = async () => {
    if (!window.confirm('This may take a while. Continue?')) {
      return
    }

    setIsRecalculating(true)
    setRecalculateResult(null)
    setRecalculateError(null)

    try {
      const result = await api.post<{ itemsProcessed: number; segmentsCreated: number }>(
        '/api/regime/recalculate',
        {}
      )
      setRecalculateResult(
        `Recalculated ${result.itemsProcessed} items, ${result.segmentsCreated} segments created`
      )
      setTimeout(() => setRecalculateResult(null), 5000)
    } catch {
      setRecalculateError('Failed to recalculate segments')
    } finally {
      setIsRecalculating(false)
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

      {/* Regime Classification Section */}
      <Card>
        <CardHeader>
          <CardTitle>Regime Classification</CardTitle>
          <CardDescription>
            Configure thresholds for classifying price regimes as range-bound or trending.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingThresholds ? (
            <p className="text-muted-foreground">Loading thresholds...</p>
          ) : thresholdsError ? (
            <p className="text-destructive">Failed to load thresholds</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chopMax">Chop Max</Label>
                  <Input
                    id="chopMax"
                    type="number"
                    step="0.01"
                    placeholder="0.25"
                    value={chopMax}
                    onChange={(e) => setChopMax(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Maximum chop ratio for range-bound (0-1)
                    {suggestedThresholds && (
                      <span className="block text-blue-600" title={`p25: ${suggestedThresholds.stats.chop.p25.toFixed(4)}, p50: ${suggestedThresholds.stats.chop.p50.toFixed(4)}, p75: ${suggestedThresholds.stats.chop.p75.toFixed(4)}`}>
                        Suggested: {suggestedThresholds.suggested.chop_max.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="rangeNormMax">Range % Max</Label>
                  <Input
                    id="rangeNormMax"
                    type="number"
                    step="0.001"
                    placeholder="0.02"
                    value={rangeNormMax}
                    onChange={(e) => setRangeNormMax(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Maximum normalized range for range-bound
                    {suggestedThresholds && (
                      <span className="block text-blue-600" title={`p25: ${suggestedThresholds.stats.range_norm.p25.toFixed(6)}, p50: ${suggestedThresholds.stats.range_norm.p50.toFixed(6)}, p75: ${suggestedThresholds.stats.range_norm.p75.toFixed(6)}`}>
                        Suggested: {suggestedThresholds.suggested.range_norm_max.toFixed(6)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slopeNormMax">Slope Max</Label>
                  <Input
                    id="slopeNormMax"
                    type="number"
                    step="0.0001"
                    placeholder="0.0005"
                    value={slopeNormMax}
                    onChange={(e) => setSlopeNormMax(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Maximum normalized slope for range-bound
                    {suggestedThresholds && (
                      <span className="block text-blue-600" title={`p25: ${suggestedThresholds.stats.slope_norm.p25.toFixed(8)}, p50: ${suggestedThresholds.stats.slope_norm.p50.toFixed(8)}, p75: ${suggestedThresholds.stats.slope_norm.p75.toFixed(8)}`}>
                        Suggested: {suggestedThresholds.suggested.slope_norm_max.toFixed(8)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="crossRateMin">Cross Rate Min</Label>
                  <Input
                    id="crossRateMin"
                    type="number"
                    step="0.01"
                    placeholder="0.08"
                    value={crossRateMin}
                    onChange={(e) => setCrossRateMin(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    Minimum mean-crossing rate for range-bound (0-1)
                    {suggestedThresholds && (
                      <span className="block text-blue-600" title={`p25: ${suggestedThresholds.stats.cross_rate.p25.toFixed(4)}, p50: ${suggestedThresholds.stats.cross_rate.p50.toFixed(4)}, p75: ${suggestedThresholds.stats.cross_rate.p75.toFixed(4)}`}>
                        Suggested: {suggestedThresholds.suggested.cross_rate_min.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="windowSize">Window Size</Label>
                <Input
                  id="windowSize"
                  type="number"
                  placeholder="24"
                  value={windowSize}
                  onChange={(e) => setWindowSize(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of price points per analysis window
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveThresholds}
                  disabled={isSavingThresholds}
                >
                  {isSavingThresholds ? 'Saving...' : 'Save Thresholds'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRunCalibration}
                  disabled={isCalibrating}
                >
                  {isCalibrating ? 'Calibrating...' : 'Auto-Calibrate'}
                </Button>
                {suggestedThresholds && (
                  <Button
                    variant="outline"
                    onClick={handleApplySuggestions}
                  >
                    Apply Suggestions
                  </Button>
                )}
              </div>
              {suggestedThresholds && (
                <p className="text-xs text-muted-foreground">
                  Calibrated from {suggestedThresholds.meta.items_sampled} items, {suggestedThresholds.meta.windows_analyzed} windows analyzed
                </p>
              )}
              {thresholdsSaved && (
                <p className="text-sm text-green-600">Thresholds saved successfully!</p>
              )}
              {thresholdsSaveError && (
                <p className="text-sm text-destructive">{thresholdsSaveError}</p>
              )}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  After changing thresholds, recalculate all regime segments to apply the new settings.
                </p>
                <Button
                  variant="secondary"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                >
                  {isRecalculating ? 'Recalculating...' : 'Recalculate All Segments'}
                </Button>
              </div>
              {recalculateResult && (
                <p className="text-sm text-green-600">{recalculateResult}</p>
              )}
              {recalculateError && (
                <p className="text-sm text-destructive">{recalculateError}</p>
              )}
            </>
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
