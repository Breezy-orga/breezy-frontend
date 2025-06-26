'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/models';
import { API_ROUTES, getApiUrl } from '@/config/api.routes';

export function useAuth(required = false) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        if (required) {
          router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(getApiUrl(API_ROUTES.USERS.BASE + '/me'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expirée');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Erreur de vérification de l\'authentification:', error);
        if (required) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [required, router]);

  const login = (token: string, userId: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    setLoading(true);
    // Le prochain effet récupérera les données utilisateur
    window.location.href = '/';
  };

  const logout = async () => {
    try {
      await fetch(getApiUrl(API_ROUTES.AUTH.LOGOUT), {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setUser(null);
      window.location.href = '/';
    }
  };

  return { user, loading, login, logout };
}

export function useRequireAuth() {
  const { user, loading } = useAuth(true);
  return { user, loading };
}
