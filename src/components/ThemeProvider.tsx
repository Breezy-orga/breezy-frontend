'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

// Définir le type de Node pour éviter les erreurs TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Définir le type pour process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL?: string
    }
  }
}

type Theme = 'dark' | 'light'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
  isLoading: boolean
}

// Récupérer l'URL de l'API depuis les variables d'environnement
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // Récupérer le thème depuis l'API
  useEffect(() => {
    async function fetchTheme() {
      try {
        // Vérifier si l'utilisateur est connecté (token présent)
        const token = localStorage.getItem('token')
        console.log('[DEBUG] Token trouvé:', !!token)
        
        if (token) {
          console.log('[DEBUG] Tentative de récupération du thème depuis l\'API')
          // Utilisateur connecté - récupérer la préférence depuis l'API
          const response = await axios.get(`${API_URL}/users/preferences/theme`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          console.log('[DEBUG] Réponse API thème:', response.data)
          setTheme(response.data.theme)
          console.log('[DEBUG] Thème appliqué:', response.data.theme)
        } else {
          console.log('[DEBUG] Aucun token - application du thème clair par défaut')
          // Utilisateur non connecté - utiliser le thème clair par défaut
          setTheme('light')
        }
      } catch (error) {
        console.error('[DEBUG] Erreur lors de la récupération du thème:', error)
        // En cas d'erreur, utiliser le thème par défaut
        setTheme('light')
      } finally {
        // Définir d'abord que le composant est monté, puis désactiver le chargement
        setMounted(true)
        setIsLoading(false)
        // Note: mounted est encore false ici car setState est asynchrone
        // Le log affichera la valeur avant mise à jour
        console.log('[DEBUG] État final - Thème:', theme, 'Monté (sera true au prochain render):', mounted)
      }
    }
    
    fetchTheme()
  }, [])
  
  // S'assure que l'interface commence avec une apparence claire par défaut avant le chargement complet
  useEffect(() => {
    if (window && document) {
      const root = window.document.documentElement;
      // Supprimer temporairement la classe dark (sera réappliquée si nécessaire après le chargement)
      root.classList.remove('dark');
    }
  }, []); // S'exécute une seule fois au démarrage
  
  // Appliquer le thème lorsque le thème change
  useEffect(() => {
    // Retrait de la condition mounted pour appliquer le thème même si mounted est false
    if (typeof window === 'undefined') return;
    
    console.log('[DEBUG] Appliquer le thème:', theme, 'Monté:', mounted);
    const root = window.document.documentElement
    
    // Supprimer les deux classes pour éviter les conflits
    root.classList.remove('dark')
    root.classList.remove('light')
    
    // Ajouter la classe correspondante au thème
    root.classList.add(theme)
    console.log('[DEBUG] Classes sur root après ajout:', root.className);
    
    // Ajouter un attribut de thème sur le body pour plus de flexibilité
    document.body.setAttribute('data-theme', theme)
    
    // Ajouter une transition sur le body pour un changement de thème fluide
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease'
  }, [theme, mounted])
  
  const toggleTheme = async () => {
    // Déterminer le nouveau thème
    const newTheme = theme === 'light' ? 'dark' : 'light'
    
    try {
      const token = localStorage.getItem('token')
      
      if (token) {
        // Utilisateur connecté - mettre à jour la préférence via l'API
        await axios.put(`${API_URL}/users/preferences/theme`, 
          { theme: newTheme },
          { headers: { Authorization: `Bearer ${token}` }}
        )
      }
      
      // Mettre à jour le thème dans le state
      setTheme(newTheme)
      
      // Forcer le rechargement de la page pour garantir que le thème est correctement appliqué
      // Cette étape est importante pour supprimer tout problème de mise en cache
      window.location.reload()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du thème:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoading }}>
      {isLoading ? <div>Chargement du thème...</div> : children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 