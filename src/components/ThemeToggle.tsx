'use client'

import { useTheme } from './ThemeProvider'
import { MdLightMode, MdDarkMode } from 'react-icons/md'

export function ThemeToggle() {
  const { theme, toggleTheme, isLoading } = useTheme()

  // Ne pas rendre le bouton si le chargement est en cours
  if (isLoading) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
      disabled={isLoading}
    >
      {theme === 'dark' ? (
        <MdLightMode className="w-5 h-5 text-gray-200" />
      ) : (
        <MdDarkMode className="w-5 h-5 text-gray-700" />
      )}
    </button>
  )
}