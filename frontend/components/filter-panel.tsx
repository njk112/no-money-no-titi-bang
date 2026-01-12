'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface FilterPanelProps {
  children: React.ReactNode
  onResetFilters?: () => void
}

export function FilterPanel({ children, onResetFilters }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop: always visible */}
      <Card className="hidden md:block">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {onResetFilters && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={onResetFilters}
            >
              Reset to Defaults
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Mobile: collapsible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:hidden">
        <Card>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-4 py-3 h-auto"
            >
              <span className="font-semibold">Filters</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {children}
              {onResetFilters && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={onResetFilters}
                >
                  Reset to Defaults
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </>
  )
}
