'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MdHome, 
  MdPerson, 
  MdSettings, 
  MdLanguage, 
  MdBrightness4, 
  MdExplore, 
  MdNotifications, 
  MdMail, 
  MdClose,
  MdLogout,
  MdSearch,
  MdMenu
} from 'react-icons/md'
import { useLanguage } from './LanguageProvider'
import NotificationBadge from './NotificationBadge'
import { useNotifications } from '../contexts/NotificationContext'
import { useTranslation } from 'react-i18next'

interface AppSidebarProps {
  className?: string
}

export default function AppSidebar({ className = '' }: AppSidebarProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false) // Pour d'autres menus existants ou futurs
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.language || 'fr'
  const [userInfo, setUserInfo] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
   useEffect(() => {
    console.log('i18n debug:', {
      language: i18n.language,
      isInitialized: i18n.isInitialized,
      hasResources: !!i18n.options?.resources,
      testTranslation: t('sidebar.feed')
    })
  }, [i18n.language, t])
  // Fermer le menu d'options lorsqu'on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const optionsMenu = document.getElementById('options-menu');
      const optionsButton = document.getElementById('options-button');
      
      if (
        optionsMenuOpen && 
        optionsMenu && 
        optionsButton &&
        !optionsMenu.contains(event.target as Node) && 
        !optionsButton.contains(event.target as Node)
      ) {
        setOptionsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [optionsMenuOpen]);
  
  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setMounted(true);
    // Récupérer l'info utilisateur via l'API (cookie JWT)
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData);
        } else {
          setUserInfo(null);
        }
      } catch (err) {
        setUserInfo(null);
        console.error('Erreur lors de la récupération des infos utilisateur:', err);
      }
    };

    fetchUserInfo();
  }, []);

  // Navigation principale
  const navItems = [
    { key: 'feed', label: t('sidebar.home'), icon: MdHome, href: '/feed' },
    { key: 'profile', label: t('sidebar.profile'), icon: MdPerson, href: '/profile' },
    { key: 'search', label: t('sidebar.search'), icon: MdSearch, href: '/search' },
    { key: 'messagerie', label: t('sidebar.messages'), icon: MdMail, href: '/messagerie' },
    { key: 'notifications', label: t('sidebar.notifications'), icon: MdNotifications, href: '/notifications' },
  ];

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setMenuOpen(false)
  }

  return (
    <aside className={`fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-900 w-64 z-20 shadow-lg border-r border-gray-200 dark:border-gray-800 ${className}`}>
      {/* Section profil en haut */}
      <div className="px-6 py-8 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col gap-4">
          {/* Avatar et nom */}
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-gray-700/50">
              <Image 
                src={userInfo?.avatar || '/default-avatar.png'} 
                alt="Avatar"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{userInfo?.username || 'Utilisateur'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{userInfo?.username || 'utilisateur'}</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex justify-start gap-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{userInfo?.following?.length || 0}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('sidebar.following')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">{userInfo?.followers?.length || 0}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('sidebar.followers')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg ${
                  (item.key === 'search' ? pathname.startsWith('/search') : pathname === item.href)
                    ? 'bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Menu options */}
      <div className="mt-auto px-6 py-6">
        <div className="relative">
          <button 
            id="options-button"
            onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={optionsMenuOpen}
            aria-controls="options-menu"
          >
            <div className="flex items-center">
              <MdSettings className="w-5 h-5 mr-3" />
              {t('sidebar.options')}
            </div>
            <svg
              className={`w-5 h-5 ml-2 transition-transform ${optionsMenuOpen ? 'transform rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          
          {/* Dropdown menu */}
          {optionsMenuOpen && (
            <div 
              id="options-menu"
              className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
              role="menu"
              aria-orientation="vertical"
            >
              <button 
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setOptionsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2.5 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                role="menuitem"
              >
                <MdBrightness4 className="w-5 h-5 mr-3" />
                {theme === 'dark' ? t('sidebar.light_mode') : t('sidebar.dark_mode')}
              </button>
              
              {
                   <button 
                onClick={() => {
                  i18n.changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr');
                  setOptionsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-2.5 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                role="menuitem"
              >
                <span className={`fi fi-${currentLanguage === 'fr' ? 'gb' : 'fr'}`}></span>
                <span className="ml-2">{currentLanguage === 'fr' ? t('sidebar.english') : t('sidebar.french')}</span>
              </button>
              
              }
              
              <Link 
                href="/settings" 
                className="flex items-center px-4 py-2.5 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                role="menuitem"
                onClick={() => setOptionsMenuOpen(false)}
              >
                <MdSettings className="w-5 h-5 mr-3" />
                {t('sidebar.settings')}
              </Link>
              
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                  window.location.href = '/login';
                }}
                className="w-full flex items-center px-4 py-2.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                role="menuitem"
              >
                <MdLogout className="w-5 h-5 mr-3" />
                {t('sidebar.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
