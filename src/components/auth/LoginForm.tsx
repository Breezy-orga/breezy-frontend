'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ApiErrorResponse } from '@/lib/api';
import { useCurrentUser } from '@/context/CurrentUserContext';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    login: '', // Peut être un email ou un nom d'utilisateur
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const { refresh } = useCurrentUser();

  useEffect(() => {
    if (registered) {
      setError('Inscription réussie ! Veuillez vous connecter.');
    }
  }, [registered]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setLoading(true);

    // Validation des champs
    if (!formData.login.trim() || !formData.password) {
      setError('Veuillez remplir tous les champs');
      setIsSubmitting(false);
      setLoading(false);
      return;
    }

    // Préparer les données de la requête
    const requestData = {
      identifier: formData.login.trim(),
      password: formData.password,
    };

    try {
      console.log('Tentative de connexion avec:', { ...requestData, password: '***' });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include', // Important pour les cookies
      });

      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      // Gestion des erreurs HTTP
      if (!response.ok) {
        const errorMessage = data?.message || 
                          (response.status === 401 ? 'Identifiants incorrects' : 
                          response.status === 400 ? 'Requête invalide' :
                          response.status === 403 ? 'Accès refusé' :
                          response.status === 404 ? 'Service non trouvé' :
                          response.status === 429 ? 'Trop de tentatives. Veuillez réessayer plus tard.' :
                          'Une erreur est survenue lors de la connexion');
        
        console.error(`Erreur ${response.status}:`, errorMessage);
        setError(errorMessage);
        return;
      }

      // Vérifier si la réponse contient des données valides
      if (!data) {
        throw new Error('Réponse du serveur invalide');
      }

      // Rafraîchir le contexte utilisateur avant la redirection
      try {
        await refresh();
        
        // Récupérer la destination de redirection ou utiliser '/feed' par défaut
        const redirectTo = searchParams.get('redirect') || '/feed';
        console.log('Connexion réussie, redirection vers:', redirectTo);
        
        // Utiliser window.location pour un rechargement complet de la page
        // Cela garantit que tous les composants sont correctement actualisés
        window.location.href = redirectTo;
      } catch (refreshError) {
        console.error('Erreur lors du rafraîchissement du contexte utilisateur:', refreshError);
        // En cas d'erreur, rediriger quand même vers la page de connexion
        router.push('/login');
      }
      
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      
      // Gestion des erreurs réseau
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } 
      // Gestion des erreurs de validation
      else if ((err as any).name === 'ValidationError') {
        setError('Données de connexion invalides');
      }
      // Autres erreurs
      else {
        const error = err as Error;
        setError(error.message || 'Une erreur inattendue est survenue');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Connexion à Breezy
          </h2>
        </div>

        {error && (
          <div className={`px-4 py-3 rounded-md text-sm ${registered ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email ou nom d'utilisateur
              </label>
              <input
                id="login"
                name="login"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email ou nom d'utilisateur"
                value={formData.login}
                onChange={handleChange}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Votre mot de passe"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>



          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
        </form>

        {/* Séparateur */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Ou continuez avec
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/google`}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span className="sr-only">Se connecter avec Google</span>
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            </a>
          </div>

          <div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/github`}
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span className="sr-only">Se connecter avec GitHub</span>
              <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.195 20 14.436 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
