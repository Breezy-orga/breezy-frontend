'use client'

import { useEffect, useState } from 'react'
import { MdLightMode, MdDarkMode, MdOutlineAutoAwesome } from 'react-icons/md'
import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { MdLightMode, MdDarkMode, MdOutlineAutoAwesome } from 'react-icons/md'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useTranslation } from 'react-i18next'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  
  // Éviter le rendu côté serveur pour prévenir les erreurs d'hydratation
  useEffect(() => {
    setMounted(true)
  }, [])

  // Ne rien rendre côté serveur
  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`} />
    )
  }

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme as Theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <MdLightMode className="w-5 h-5 text-yellow-500" />
      case 'dark':
        return <MdDarkMode className="w-5 h-5 text-blue-400" />
      case 'system':
      default:
        return <MdOutlineAutoAwesome className="w-5 h-5 text-purple-500" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Thème clair actif'
      case 'dark':
        return 'Thème sombre actif'
      case 'system':
      default:
        return 'Thème système actif'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg flex items-center justify-center transition-all duration-200
        hover:bg-gray-100/60 dark:hover:bg-gray-800/60
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
        ${className}`}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
    >
      <span className="sr-only">Changer de thème</span>
      {getThemeIcon()}
    </button>
  )
}