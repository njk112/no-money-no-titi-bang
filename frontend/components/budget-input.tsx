'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface BudgetInputProps {
  onSubmit: (budget: number) => void
  isLoading?: boolean
}

export function BudgetInput({ onSubmit, isLoading }: BudgetInputProps) {
  const [value, setValue] = useState('')

  const numericValue = parseInt(value.replace(/,/g, ''), 10) || 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '')
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      const num = parseInt(rawValue, 10)
      if (rawValue === '') {
        setValue('')
      } else if (!isNaN(num)) {
        setValue(num.toLocaleString())
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (numericValue > 0) {
      onSubmit(numericValue)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1">
        <label htmlFor="budget" className="block text-sm font-medium mb-1">
          Enter your budget (GP)
        </label>
        <Input
          id="budget"
          type="text"
          inputMode="numeric"
          placeholder="1,000,000"
          value={value}
          onChange={handleChange}
          className="text-lg"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={numericValue <= 0 || isLoading}>
          {isLoading ? 'Loading...' : 'Get Suggestions'}
        </Button>
      </div>
    </form>
  )
}
