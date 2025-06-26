'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // Pour les contrôles d'accès basés sur les rôles (optionnel)
}

/**
 * Composant ProtectedRoute qui vérifie l'authentification via une requête API
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 * Affiche un écran de chargement pendant la vérification
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        // Vérifier l'authentification via l'API
        const user = await authApi.getMe();
        
        // Vérifier le rôle si nécessaire
        if (requiredRole && user.role !== requiredRole) {
          console.warn(`Accès refusé: rôle ${requiredRole} requis`);
          if (isMounted) {
            setIsAuthorized(false);
            setError('Accès non autorisé. Droits insuffisants.');
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
          setError(null);
        }
      } catch (err) {
        console.error('Erreur de vérification d\'authentification:', err);
        if (isMounted) {
          setIsAuthorized(false);
          setError('Session expirée ou invalide. Veuillez vous reconnecter.');
          // Rediriger vers la page de connexion avec un paramètre de redirection
          const currentPath = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, requiredRole]);

  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Afficher un message d'erreur si l'authentification a échoué
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Accès refusé</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rendre les enfants si l'utilisateur est autorisé
  return isAuthorized ? <>{children}</> : null;
}
