'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/contexts/settings-context'

export default function SettingsPage() {
  const { defaultFilters, setDefaultFilters, resetToSystemDefaults } = useSettings()

  const [minPrice, setMinPrice] = useState(defaultFilters.minPrice)
  const [maxPrice, setMaxPrice] = useState(defaultFilters.maxPrice)
  const [minMargin, setMinMargin] = useState(defaultFilters.minMargin)
  const [minVolume, setMinVolume] = useState(defaultFilters.minVolume)
  const [maxVolume, setMaxVolume] = useState(defaultFilters.maxVolume)
  const [showSaved, setShowSaved] = useState(false)

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
    </div>
  )
}
