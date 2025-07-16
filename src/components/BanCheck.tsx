// components/BanCheck.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BanCheck() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne pas vérifier si on est déjà sur la page banned ou login
    if (pathname === '/banned' || pathname === '/login' || pathname === '/register') {
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
          
          // Si l'utilisateur est banni, rediriger immédiatement
          if (user.status === 'banned') {
            console.log('Utilisateur banni détecté, redirection vers /banned');
            router.push('/banned');
          }
        } else if (response.status === 403) {
          // Réponse 403 = probablement banni
          const errorData = await response.json().catch(() => ({}));
          if (errorData.userStatus?.status === 'banned') {
            router.push('/banned');
          }
        }
      } catch (error) {
        // Erreur silencieuse pour ne pas perturber l'expérience
        console.debug('Erreur vérification ban status:', error);
      }
    };

    // Vérification immédiate
    checkBanStatus();

    // Vérification périodique toutes les 30 secondes
    const interval = setInterval(checkBanStatus, 30000);

    return () => clearInterval(interval);
  }, [router, pathname]);

  // Ce composant ne rend rien
  return null;
}