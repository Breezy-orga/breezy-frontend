'use client'

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { useEffect } from 'react'

// Utilitaires cookie
function setThemeCookie(theme: string) {
  document.cookie = `theme=${theme}; path=/; max-age=31536000`
}
function getThemeCookie(): string | null {
  const match = document.cookie.match(/(?:^|; )theme=(light|dark|system)/)
  return match ? match[1] : null
}

// Composant pour appliquer les variables CSS en fonction du thème
const ThemeVariables = () => {
  const { theme, setTheme } = useNextTheme()

  // Appliquer le thème depuis le cookie au premier chargement
  useEffect(() => {
    const cookieTheme = getThemeCookie()
    if (cookieTheme && cookieTheme !== theme) {
      setTheme(cookieTheme)
    }
  }, [])

  // Mettre à jour le cookie à chaque changement de thème
  useEffect(() => {
    if (theme) setThemeCookie(theme)
  }, [theme])

  useEffect(() => {
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