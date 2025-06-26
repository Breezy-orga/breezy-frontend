'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton({ className = '' }: { className?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Appel à l'API de déconnexion
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Suppression des données locales
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      
      // Redirection vers la page de connexion
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white ${className}`}
    >
      Déconnexion
    </button>
  );
}
