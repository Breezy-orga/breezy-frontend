'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/models';
import { authApi } from '@/lib/api';

interface CurrentUserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setUserLoading] = useState(true);
  const [error, setUserError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    // Ne pas essayer de charger l'utilisateur côté serveur
    if (typeof window === 'undefined') return;
    
    setUserLoading(true);
    setUserError(null);
    
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (e: any) {
      console.error('Erreur lors du chargement du profil:', e);
      setUserError(e.message || 'Erreur lors du chargement du profil');
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      // Rediriger vers la page de connexion après déconnexion
      router.push('/login');
    } catch (e) {
      console.error('Erreur lors de la déconnexion:', e);
    }
  }, [router]);

  // Charger l'utilisateur au montage
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Vérifier périodiquement la validité de la session (toutes les 30 minutes)
  // ou lors d'une interaction utilisateur
  useEffect(() => {
    if (!user) return;
    
    const checkSession = async () => {
      try {
        await authApi.getMe();
      } catch (e) {
        console.warn('Session expirée, déconnexion...');
        setUser(null);
        // Rediriger vers la page de connexion
        router.push('/login');
      }
    };

    // Vérifier la session moins fréquemment (toutes les 30 minutes)
    const interval = setInterval(checkSession, 30 * 60 * 1000);
    
    // Vérifier la session lors d'une interaction utilisateur
    const handleUserInteraction = () => {
      checkSession().catch(console.error);
    };
    
    window.addEventListener('focus', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction, { once: true });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
    };
  }, [user, router]);

  const value = {
    user,
    loading,
    error,
    refresh: fetchUser,
    logout,
    isAuthenticated: !!user && !loading && !error,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
};

export function useCurrentUser() {
  const context = useContext(CurrentUserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return context;
}
