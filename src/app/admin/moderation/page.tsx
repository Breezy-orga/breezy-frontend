'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AdminModerationPanel from '@/components/AdminModerationPanel';

export default function AdminModerationPage() {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkModerationAccess = async () => {
      try {
        const response = await fetch('/api/users/me', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) {
          const user = await response.json();
          console.log('Utilisateur connecté:', user.role, user.username);
          
          //  Autoriser admin ET moderator
          if (user.role === 'admin' || user.role === 'moderator') {
            setUserRole(user.role);
          } else {
            console.log('Accès refusé: rôle insuffisant');
            setError(t('admin.access_denied', 'Accès refusé: droits de modération requis'));
            setTimeout(() => router.push('/'), 2000);
          }
        } else if (response.status === 401) {
          console.log('Utilisateur non authentifié');
          setError(t('admin.not_authenticated', 'Non authentifié'));
          setTimeout(() => router.push('/login'), 2000);
        } else {
          console.log('Erreur de vérification des droits');
          setError(t('admin.verification_error', 'Erreur de vérification des droits'));
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des droits:', error);
        setError(t('admin.network_error', 'Erreur de connexion'));
        setTimeout(() => router.push('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    checkModerationAccess();
  }, [router, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('admin.checking_access', 'Vérification des droits d\'accès...')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t('admin.please_wait', 'Veuillez patienter')}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('admin.access_denied_title', 'Accès refusé')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t('admin.return_home', 'Retour à l\'accueil')}
          </button>
        </div>
      </div>
    );
  }

  //  Autoriser admin ET moderator
  if (!userRole || !['admin', 'moderator'].includes(userRole)) {
    return null; // Sécurité supplémentaire
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* En-tête de la page admin/modération */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ← {t('admin.back_to_app', 'Retour à l\'application')}
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                🛡️ {userRole === 'admin' 
                      ? t('admin.panel_title', 'Panel d\'administration') 
                      : t('moderation.panel_title', 'Panel de modération')
                    }
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                userRole === 'admin' 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              }`}>
                {userRole === 'admin' 
                  ? t('admin.admin_mode', 'Mode Administrateur')
                  : t('moderation.moderator_mode', 'Mode Modérateur')
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminModerationPanel userRole={userRole as 'admin' | 'moderator'} />
      </div>
    </div>
  );
}