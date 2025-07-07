"use client";
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useTheme } from 'next-themes'; 
import { useTranslation } from 'react-i18next';

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    identifier: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const endpoint = mode === 'login'
        ? '/api/auth/login'
        : '/api/auth/register';

      const payload = mode === 'login' 
        ? { identifier: formData.identifier, password: formData.password } 
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password
          };
      
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials : true,
      });
      
      if (response.status === 200) {
        router.push('/feed');
      }

    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(t('auth.error_incorrect'));
      } else if (err.response?.status === 500) {
        setError(t('auth.error_server'));
      } else {
        setError(err.response?.data?.message || t('auth.error_generic'));
      }
    }
  }

  return (
    <div className={`relative w-full max-w-md mx-auto p-8 rounded-2xl shadow-xl border
      ${theme === 'dark' 
        ? 'bg-gray-900 text-white border-gray-800' 
        : 'bg-white text-gray-900 border-gray-200'}`}>
      
      {/* Bouton dark mode en haut à droite */}
      <button
        type="button"
        aria-label={theme === 'dark' ? t('sidebar.light_mode') : t('sidebar.dark_mode')}
        className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.05l-.71-.71M4.05 4.05l-.71-.71" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        )}
      </button>

      {mode === 'login' ? (
        <div className="flex justify-center mb-8">
          {/* Logo toujours bleu */}
          <Image src="/logo_breezy.png" alt="Breezy logo" width={60} height={60} priority className="drop-shadow-lg" />
        </div>
      ) : (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('auth.join_breezy', { defaultValue: 'Join ' })}<span className="text-blue-500">Breezy</span>
          </h2>
          <p className="text-gray-400 mt-2 dark:text-gray-400">{t('auth.create_account')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 flex items-center dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'register' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('auth.username')}</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={t('auth.username_placeholder')}
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>
        )}
        {mode === 'login' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('auth.identifier')}</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={t('auth.identifier_placeholder')}
              value={formData.identifier}
              onChange={(e) => setFormData({...formData, identifier: e.target.value})}
              required
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('auth.email')}</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder={t('auth.email_placeholder')}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('auth.password')}</label>
          <input
            type="password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('auth.password_placeholder')}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all transform hover:scale-[1.02] focus:scale-[0.98]"
        >
          {mode === 'login' ? t('auth.login_button') : t('auth.register_button')}
        </button>
        {mode === 'login' && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="mx-4 text-gray-400 font-medium dark:text-gray-300">{t('auth.or')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-700 rounded-xl py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] focus:scale-[0.98] shadow-sm"
              onClick={() => signIn('google')}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2">
                {/* Google logo paths... */}
                <g>
                  <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11 0 20.5-8 20.5-20.5 0-1.4-.2-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.1l6.6 4.8C14.5 16.1 18.9 13 24 13c2.7 0 5.2.9 7.2 2.4l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.2 0-13.4 4.1-16.7 10.6z"/>
                  <path fill="#FBBC05" d="M24 44.5c5.5 0 10.5-1.8 14.4-4.9l-6.6-5.4c-2 1.4-4.5 2.3-7.8 2.3-5.6 0-10.3-3.8-12-9l-6.5 5c3.3 6.5 10.5 11 18.5 11z"/>
                  <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-4.1 5.5-7.3 5.5-4.2 0-7.7-3.5-7.7-7.7 0-.6.1-1.2.2-1.8l-6.5-5C7.2 23.1 7 23.5 7 24c0 7.2 5.8 13 13 13 6.6 0 12-5.4 12-12 0-.8-.1-1.5-.2-2.2z"/>
                </g>
              </svg>
              <span className="text-gray-700 dark:text-gray-200 font-medium">{t('auth.google')}</span>
            </button>
          </>
        )}
      </form>
    </div>
  )
}
