'use client'

import { ReactNode } from 'react'
import { SettingsProvider } from '@/contexts/settings-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return <SettingsProvider>{children}</SettingsProvider>
}
