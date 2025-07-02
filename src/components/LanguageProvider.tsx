'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import i18n from '../i18n'

type Language = 'fr' | 'en'
type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
}

const defaultLanguageContext: LanguageContextType = {
  language: 'fr',
  setLanguage: () => {}
}

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext)

interface LanguageProviderProps {
  children: React.ReactNode
}

function setLanguageCookie(lang: Language) {
  document.cookie = `language=${lang}; path=/; max-age=31536000`
}
function getLanguageCookie(): Language | null {
  const match = document.cookie.match(/(?:^|; )language=(fr|en)/)
  return match ? (match[1] as Language) : null
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('fr')
  const [mounted, setMounted] = useState(false)

  // Éviter l'hydratation non concordante
  useEffect(() => {
    // Récupérer la langue sauvegardée dans le cookie, si elle existe
    const savedLanguage = getLanguageCookie()
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    }
    setMounted(true)
  }, [])

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    setLanguageCookie(newLanguage)
     localStorage.setItem('i18nextLng', newLanguage)
    i18n.changeLanguage(newLanguage)
  }

  if (!mounted) {
    return null
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleLanguageChange
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => useContext(LanguageContext)