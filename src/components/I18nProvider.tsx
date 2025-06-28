'use client'

import { ReactNode, useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

interface I18nProviderProps {
  children: ReactNode
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // S'assurer que i18n est initialisé
    const initI18n = async () => {
      try {
        if (!i18n.isInitialized) {
          await i18n.init()
        }
        
        // Vérifier si une langue est stockée en localStorage
        const savedLanguage = localStorage.getItem('i18nextLng')
        if (savedLanguage && ['en', 'fr'].includes(savedLanguage)) {
          await i18n.changeLanguage(savedLanguage)
        } else {
          // Définir une langue par défaut si aucune n'est sauvegardée
          const browserLang = navigator.language.split('-')[0]
          const defaultLang = ['en', 'fr'].includes(browserLang) ? browserLang : 'fr'
          await i18n.changeLanguage(defaultLang)
          localStorage.setItem('i18nextLng', defaultLang)
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('Erreur lors de l\'initialisation d\'i18n:', error)
        // En cas d'erreur, initialiser avec le français par défaut
        await i18n.changeLanguage('fr')
        setIsInitialized(true)
      }
    }

    initI18n()
  }, [])

  // Afficher un loader pendant l'initialisation pour éviter le flash de contenu non traduit
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}
