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
  MdMenu,
  MdShield, 
  MdFlag,
  MdSecurity
} from 'react-icons/md'
import { useLanguage } from './LanguageProvider'
import NotificationBadge from './NotificationBadge'
import { useNotifications } from '../contexts/NotificationContext'
import { useTranslation } from 'react-i18next'
import { ProfileSync } from '@/utils/profileSync'

interface AppSidebarProps {
  className?: string
}

interface UserInfo {
  _id: string;
  username: string;
  name?: string;
  profilePicture?: string;
  avatar?: string;
  following?: string[];
  followers?: string[];
  role?: string;
  status?: 'active' | 'suspended' | 'banned';
  [key: string]: any;
}

export default function AppSidebar({ className = '' }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.language || 'fr'
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarKey, setAvatarKey] = useState(0)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // États pour les notifications de modération
  const [pendingReports, setPendingReports] = useState(0)
  const [loadingReports, setLoadingReports] = useState(false)

  // Fonction pour récupérer les infos utilisateur
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/users/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('User data récupérée dans sidebar:', userData);
        setUserInfo(userData);
        setAvatarKey(prev => prev + 1);
        
        // Si admin/modérateur, récupérer les signalements
        if (userData.role === 'admin' || userData.role === 'moderator') {
          fetchPendingReports();
        }
      } else {
        console.error('Erreur API users/me:', response.status, response.statusText);
        setUserInfo(null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des infos utilisateur:', err);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour récupérer les signalements en attente
  const fetchPendingReports = async () => {
    try {
      setLoadingReports(true);
      const response = await fetch('/api/moderation/reports?status=pending', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingReports(data.reports?.length || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  // Polling pour les signalements (toutes les 30 secondes)
  useEffect(() => {
    if (userInfo?.role === 'admin' || userInfo?.role === 'moderator') {
      const interval = setInterval(fetchPendingReports, 30000);
      return () => clearInterval(interval);
    }
  }, [userInfo?.role]);

  // Fonction de déconnexion
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setOptionsMenuOpen(false);
    
    try {
      console.log('Début de la déconnexion...');
      
      const response = await fetch('/api/auth/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      if (response.ok) {
        console.log('Déconnexion réussie côté serveur');
        
        setUserInfo(null);
        setLoading(true);
        
        router.push('/login');
        
        console.log('Redirection vers login...');
      } else {
        console.error('Erreur lors de la déconnexion:', response.status);
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {

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
  
  // Récupération initiale
  useEffect(() => {
    setMounted(true);
    fetchUserInfo();
  }, []);

  useEffect(() => {    
    const cleanup = ProfileSync.onUpdate((updatedUserData: UserInfo) => {
      
      // Vérifier que c'est le même utilisateur
      if (userInfo && updatedUserData._id === userInfo._id) {
        setUserInfo(prevUserInfo => ({
          ...prevUserInfo,
          ...updatedUserData
        }));
        setAvatarKey(prev => prev + 1);
      }
    });

    const handleForceRefresh = () => {
      console.log('AppSidebar: Force refresh demandé');
      fetchUserInfo();
    };

    window.addEventListener('forceUserRefresh', handleForceRefresh);

    return () => {
      cleanup();
      window.removeEventListener('forceUserRefresh', handleForceRefresh);
    };
  }, [userInfo?._id]);

  // Navigation avec logique conditionnelle pour admin/modérateur
  const getNavItems = () => {
    const baseItems = [
      { key: 'feed', label: t('sidebar.home'), icon: MdHome, href: '/feed' },
      { key: 'profile', label: t('sidebar.profile'), icon: MdPerson, href: '/profile' },
      { key: 'search', label: t('sidebar.search'), icon: MdSearch, href: '/search' },
      { key: 'messagerie', label: t('sidebar.messages'), icon: MdMail, href: '/messagerie' },
      { key: 'notifications', label: t('sidebar.notifications'), icon: MdNotifications, href: '/notifications' },
    ];

    // Ajouter le lien de modération pour admin/modérateur
    if (userInfo?.role === 'admin' || userInfo?.role === 'moderator') {
      baseItems.push({
        key: 'moderation',
        label: userInfo.role === 'admin' ? t('sidebar.admin_panel', 'Administration') : t('sidebar.moderation_panel', 'Modération'),
        icon: userInfo.role === 'admin' ? MdShield : MdSecurity,
        href: '/admin/moderation'
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    setMenuOpen(false)
  }

  // Fonction pour obtenir l'URL de l'avatar
  const getAvatarUrl = () => {
    if (!userInfo) return '/default-avatar.svg';
    return userInfo.profilePicture || userInfo.avatar || '/default-avatar.svg';
  };

  // Fonction pour obtenir le nom d'affichage
  const getDisplayName = () => {
    if (!userInfo) return 'Utilisateur';
    return userInfo.name || userInfo.username || 'Utilisateur';
  };

  // Fonction pour obtenir le nom d'utilisateur
  const getUsername = () => {
    if (!userInfo) return 'utilisateur';
    return userInfo.username || 'utilisateur';
  };

  // Fonction pour obtenir le badge de rôle
  const getRoleBadge = () => {
    if (!userInfo?.role || userInfo.role === 'user') return null;
    
    const roleConfig = {
      admin: {
        label: t('roles.admin', 'Admin'),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: '👑'
      },
      moderator: {
        label: t('roles.moderator', 'Modérateur'),
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: '🛡️'
      }
    };

    const config = roleConfig[userInfo.role as keyof typeof roleConfig];
    if (!config) return null;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  // Fonction pour obtenir l'indicateur de statut
  const getStatusIndicator = () => {
    if (!userInfo?.status || userInfo.status === 'active') return null;
    
    const statusConfig = {
      suspended: {
        label: t('status.suspended', 'Suspendu'),
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: '⏸️'
      },
      banned: {
        label: t('status.banned', 'Banni'),
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: '🚫'
      }
    };

    const config = statusConfig[userInfo.status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  return (
    <aside className={`fixed top-0 left-0 h-full flex flex-col bg-white dark:bg-gray-900 w-64 z-20 shadow-lg border-r border-gray-200 dark:border-gray-800 ${className}`}>
      {/* Section profil en haut */}
      <div className="px-6 py-8 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col gap-4">
          {/* Avatar et nom */}
          <div className="flex items-center space-x-3">
            <div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-gray-700/50">
              {loading ? (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
              ) : (
                <Image 
                  src={getAvatarUrl()} 
                  alt="Avatar"
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    console.log('Erreur chargement avatar, fallback vers default');
                    e.currentTarget.src = '/default-avatar.svg';
                  }}
                  key={`${userInfo?.profilePicture}-${avatarKey}`}
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {getDisplayName()}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    @{getUsername()}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Badges de rôle et statut */}
          {!loading && (
            <div className="flex flex-col gap-2">
              {getRoleBadge()}
              {getStatusIndicator()}
            </div>
          )}
          
          {/* Stats */}
          <div className="flex justify-start gap-6 text-sm">
            <div className="flex items-center gap-1">
              {loading ? (
                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {userInfo?.following?.length || 0}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sidebar.following')}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              {loading ? (
                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                <>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {userInfo?.followers?.length || 0}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sidebar.followers')}
                  </span>
                </>
              )}
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
                className={`flex items-center px-4 py-3 rounded-lg relative ${
                  (item.key === 'search' ? pathname.startsWith('/search') : 
                   item.key === 'moderation' ? pathname.startsWith('/admin') :
                   pathname === item.href)
                    ? 'bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
                
                {/* Badge pour les notifications */}
                {item.key === 'notifications' && (
                  <NotificationBadge className="ml-auto" />
                )}
                
                {/* Badge pour les signalements en attente */}
              {item.key === 'moderation' && pendingReports > 0 && (
                <div className="ml-auto">
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium leading-none text-white bg-red-500 rounded-full animate-pulse">
                    {pendingReports > 99 ? '99+' : pendingReports}
                  </span>
                </div>
              )}

              </Link>
            </li>
          ))}
        </ul>

        {/* Section d'accès rapide pour admin/modérateur */}
        {(userInfo?.role === 'admin' || userInfo?.role === 'moderator') && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t('sidebar.moderation_tools', 'Outils de modération')}
            </h4>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/moderation"
                  className="flex items-center px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                >
                  <MdFlag className="w-4 h-4 mr-3" />
                  {t('sidebar.reports', 'Signalements')}
                  {pendingReports > 0 && (
                    <span className="ml-auto text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded-full">
                      {pendingReports}
                    </span>
                  )}
                </Link>
              </li>
              {userInfo?.role === 'admin' && (
                <li>
                  <Link
                    href="/admin/users"
                    className="flex items-center px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <MdPerson className="w-4 h-4 mr-3" />
                    {t('sidebar.user_management', 'Gestion utilisateurs')}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}
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
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`w-full flex items-center px-4 py-2.5 text-left transition-colors ${
                  isLoggingOut 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                }`}
                role="menuitem"
              >
                <MdLogout className="w-5 h-5 mr-3" />
                {isLoggingOut ? 'Déconnexion...' : t('sidebar.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}