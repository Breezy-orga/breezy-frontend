'use client'

import { useState, useEffect } from 'react'
import { MdMenu } from 'react-icons/md'
import AppSidebar from './AppSidebar'
import { Follows } from './LayoutParts'
import { usePathname } from 'next/navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  
  // Vérifier si nous sommes sur les pages de login/register pour ne pas afficher les barres latérales
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  // Vérifier si nous sommes sur la page feed pour afficher la barre latérale droite
  const isFeedPage = pathname === '/feed'
  
  // Vérifier si nous sommes sur une page qui devrait avoir la barre latérale gauche
  // (toutes les pages sauf login/register)
  const shouldShowLeftSidebar = !isAuthPage

  // Éviter l'hydratation non concordante
  useEffect(() => {
    setMounted(true)
  }, [])

  // Ne pas rendre le composant côté serveur
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Contenu vide pendant le chargement */}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950">
      {/* Conditionally render sidebars based on current page */}
      
      {/* Left sidebar - only visible on non-auth pages on md+ screens */}
      {shouldShowLeftSidebar && (
        <div className="hidden md:block">
          <AppSidebar 
            className={`fixed left-0 top-0 h-full z-20 transition-transform duration-300 ease-in-out transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`} 
          />
        </div>
      )}
      
      {/* Right sidebar - only visible on feed page on xl+ screens */}
      {isFeedPage && (
        <div className="hidden xl:block">
          <div className="fixed right-0 top-0 h-full z-20 w-72 transition-transform duration-300 ease-in-out transform translate-x-0">
            <Follows />
          </div>
        </div>
      )}
      
      {/* Mobile sidebar overlay - only when sidebar is open and not on auth pages */}
      {shouldShowLeftSidebar && sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-10 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile sidebar - visible on small screens when toggled and not on auth pages */}
      {shouldShowLeftSidebar && (
        <div className="md:hidden">
          <AppSidebar 
            className={`fixed left-0 top-0 h-full z-20 w-64 transition-transform duration-300 ease-in-out transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          />
        </div>
      )}

      {/* Main content - with padding to avoid sidebar overlay */}
      <div className={`min-h-screen transition-all duration-300 ${
        shouldShowLeftSidebar && sidebarOpen ? 'md:ml-64' : 'md:ml-0'
      } ${isFeedPage ? 'xl:mr-72' : ''}`}>
        {/* Mobile header with menu button - not shown on auth pages */}
        {shouldShowLeftSidebar && (
          <header className="md:hidden sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              <MdMenu className="text-2xl text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Breezy</h1>
            <div className="w-8"></div> {/* Pour équilibrer le layout */}
          </header>
        )}
        
        {/* Page content with proper padding - adjusted for auth pages */}
        <main className={`p-4 md:p-6 lg:p-8 ${isAuthPage ? 'w-full' : 'max-w-4xl mx-auto'}`}>
          {isAuthPage ? (
            // Pour les pages d'authentification, rendre directement les enfants sans wrapper
            children
          ) : (
            // Pour les autres pages, utiliser le wrapper habituel
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
