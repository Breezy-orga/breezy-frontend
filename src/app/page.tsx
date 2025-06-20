'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  // Rediriger automatiquement vers la page de connexion
  useEffect(() => {
    router.replace('/login')
  }, [])

  // Retourner un contenu vide ou un indicateur de chargement
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 via-white to-white">
      <div className="animate-pulse text-blue-600 text-xl">
        Redirection...
      </div>
    </div>
  )
}