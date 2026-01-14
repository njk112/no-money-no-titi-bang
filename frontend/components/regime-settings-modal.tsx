'use client'

import { useState, useEffect } from 'react'
import { Settings2, Info, RotateCcw, Save, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useRegimeThresholds, type ThresholdUpdates } from '@/hooks/use-regime-thresholds'

const thresholdInfo = {
  chop_max: {
    label: 'Chop Max',
    description: 'Maximum chop ratio for RANGE_BOUND. Lower = stricter (more items classified as TRENDING).',
    default: 0.25,
    step: 0.01,
    min: 0,
    max: 1,
  },
  range_norm_max: {
    label: 'Range % Max',
    description: 'Maximum normalized price range for RANGE_BOUND. Lower = tighter bands required.',
    default: 0.02,
    step: 0.005,
    min: 0,
    max: 0.5,
  },
  slope_norm_max: {
    label: 'Slope Max',
    description: 'Maximum normalized slope for RANGE_BOUND. Lower = flatter price line required.',
    default: 0.0005,
    step: 0.0001,
    min: 0,
    max: 0.01,
  },
  cross_rate_min: {
    label: 'Cross Rate Min',
    description: 'Minimum mean-crossing rate for RANGE_BOUND. Higher = more frequent mean reversion required.',
    default: 0.08,
    step: 0.01,
    min: 0,
    max: 1,
  },
  window_size: {
    label: 'Window Size',
    description: 'Number of data points per analysis window. Larger = smoother but slower to detect changes.',
    default: 24,
    step: 1,
    min: 5,
    max: 100,
  },
}

interface ThresholdInputProps {
  name: keyof typeof thresholdInfo
  value: string
  onChange: (value: string) => void
}

function ThresholdInput({ name, value, onChange }: ThresholdInputProps) {
  const info = thresholdInfo[name]

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={name} className="text-sm font-medium">
          {info.label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p>{info.description}</p>
            <p className="text-xs text-muted-foreground mt-1">Default: {info.default}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Input
        id={name}
        type="number"
        step={info.step}
        min={info.min}
        max={info.max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
      />
    </div>
  )
}

export function RegimeSettingsModal() {
  const { thresholds, isLoading, error, updateThresholds } = useRegimeThresholds()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localValues, setLocalValues] = useState({
    chop_max: '',
    range_norm_max: '',
    slope_norm_max: '',
    cross_rate_min: '',
    window_size: '',
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local values with fetched thresholds
  useEffect(() => {
    if (thresholds) {
      setLocalValues({
        chop_max: thresholds.chop_max.toString(),
        range_norm_max: thresholds.range_norm_max.toString(),
        slope_norm_max: thresholds.slope_norm_max.toString(),
        cross_rate_min: thresholds.cross_rate_min.toString(),
        window_size: thresholds.window_size.toString(),
      })
      setHasChanges(false)
    }
  }, [thresholds])

  const handleValueChange = (name: keyof typeof localValues, value: string) => {
    setLocalValues((prev) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  const handleResetToDefaults = () => {
    setLocalValues({
      chop_max: thresholdInfo.chop_max.default.toString(),
      range_norm_max: thresholdInfo.range_norm_max.default.toString(),
      slope_norm_max: thresholdInfo.slope_norm_max.default.toString(),
      cross_rate_min: thresholdInfo.cross_rate_min.default.toString(),
      window_size: thresholdInfo.window_size.default.toString(),
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates: ThresholdUpdates = {
        chop_max: parseFloat(localValues.chop_max),
        range_norm_max: parseFloat(localValues.range_norm_max),
        slope_norm_max: parseFloat(localValues.slope_norm_max),
        cross_rate_min: parseFloat(localValues.cross_rate_min),
        window_size: parseInt(localValues.window_size, 10),
      }
      await updateThresholds(updates)
      setHasChanges(false)
    } catch (err) {
      console.error('Failed to save thresholds:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Settings2 className="w-4 h-4" />
          Regime Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            Regime Classification Settings
          </DialogTitle>
        </DialogHeader>

        {isLoading && !thresholds ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            Failed to load thresholds
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Adjust these thresholds to fine-tune how items are classified as Range-Bound vs Trending.
              Changes affect future classifications.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <ThresholdInput
                name="chop_max"
                value={localValues.chop_max}
                onChange={(v) => handleValueChange('chop_max', v)}
              />
              <ThresholdInput
                name="range_norm_max"
                value={localValues.range_norm_max}
                onChange={(v) => handleValueChange('range_norm_max', v)}
              />
              <ThresholdInput
                name="slope_norm_max"
                value={localValues.slope_norm_max}
                onChange={(v) => handleValueChange('slope_norm_max', v)}
              />
              <ThresholdInput
                name="cross_rate_min"
                value={localValues.cross_rate_min}
                onChange={(v) => handleValueChange('cross_rate_min', v)}
              />
              <div className="col-span-2">
                <ThresholdInput
                  name="window_size"
                  value={localValues.window_size}
                  onChange={(v) => handleValueChange('window_size', v)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefaults}
                className="gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: After saving, items need to be re-classified for changes to take effect.
              Classification runs automatically during data sync.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
