'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Ne pas afficher la navbar sur les pages d'authentification
  if (['/login', '/signup'].includes(pathname)) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            Breezy
          </Link>
          
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link 
                href="/feed" 
                className={`${pathname === '/feed' 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              >
                Feed
              </Link>
              <Link 
                href="/explore" 
                className={`${pathname === '/explore'
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              >
                Explorer
              </Link>
              <Link 
                href="/profile" 
                className={`${pathname === '/(protected)/profile' || pathname.startsWith('/(protected)/profile/')
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}
              >
                Profil
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Connexion
              </Link>
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}