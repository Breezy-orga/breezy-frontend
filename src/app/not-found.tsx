'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md mx-auto">
        <Image
          src="/logo_breezy.png" 
          alt="Breezy Logo"
          width={80}
          height={80}
          className="mx-auto mb-8"
        />
        
        <h1 className="text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">Page non trouvée</h1>
        
        <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        
        <Link 
          href="/feed"
          className="block w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}