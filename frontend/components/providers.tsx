'use client'

import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { SettingsProvider } from '@/contexts/settings-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SettingsProvider>
      {children}
      <Toaster position="bottom-right" />
    </SettingsProvider>
  )
}
