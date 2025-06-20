'use client'

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { useEffect } from 'react'

// Composant pour appliquer les variables CSS en fonction du thème
const ThemeVariables = () => {
  const { theme } = useNextTheme()
  
  useEffect(() => {
    // Appliquer des classes CSS en fonction du thème
    const root = window.document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.setProperty('--color-bg', '#0f172a')
      root.style.setProperty('--color-bg-card', '#1e293b')
      root.style.setProperty('--color-text', '#f8fafc')
      root.style.setProperty('--color-text-muted', '#94a3b8')
      root.style.setProperty('--color-border', '#334155')
    } else {
      root.classList.remove('dark')
      root.style.setProperty('--color-bg', '#ffffff')
      root.style.setProperty('--color-bg-card', '#f9fafb')
      root.style.setProperty('--color-text', '#111827')
      root.style.setProperty('--color-text-muted', '#4b5563')
      root.style.setProperty('--color-border', '#e5e7eb')
    }
  }, [theme])
  
  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeVariables />
      {children}
    </NextThemesProvider>
  )
}
