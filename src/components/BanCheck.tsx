'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function BanCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const [isBanned, setIsBanned] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { t } = useTranslation(); // Assurez-vous que i18next est configuré correctement
  useEffect(() => {
    // Ne pas vérifier si on est déjà sur la page banned ou login
    if (pathname === '/banned' || pathname === '/login' || pathname === '/register') {
      setIsChecking(false);
      return;
    }

    const checkBanStatus = async () => {
      try {
        const response = await fetch('/api/users/me', { 
          credentials: 'include',
          cache: 'no-cache'
        });
        
        if (response.ok) {
          const user = await response.json();
          
          // Si l'utilisateur est banni, bloquer l'accès
          if (user.status === 'banned') {
            console.log('Utilisateur banni détecté, redirection vers /banned');
            setIsBanned(true);
            router.push('/banned');
          } else {
            setIsBanned(false);
          }
        } else if (response.status === 403) {
          // Réponse 403 = probablement banni
          const errorData = await response.json().catch(() => ({}));
          if (errorData.userStatus?.status === 'banned') {
            setIsBanned(true);
            router.push('/banned');
          }
        }
      } catch (error) {
        // Erreur silencieuse pour ne pas perturber l'expérience
        console.debug('Erreur vérification ban status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkBanStatus();

    const interval = setInterval(checkBanStatus, 10000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  // Bloquer l'affichage si l'utilisateur est banni et pas sur la page banned
  if (isBanned && pathname !== '/banned') {
    return (
      <div className="fixed inset-0 bg-red-600 flex items-center justify-center z-50">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-semibold">{t("user_status.redirecting")}</p>
        </div>
      </div>
    );
  }

  // Afficher un écran de chargement pendant la vérification initiale
  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("user_status.checking")}</p>
        </div>
      </div>
    );
  }

  return null;
}