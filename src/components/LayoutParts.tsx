"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SuggestedUser } from '@/types/models';
import api from '@/lib/axios';
import { MdTranslate } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { ProfileSync } from '@/utils/profileSync';

import { 
  MdAddCircle, MdEdit, MdAutoAwesome, MdPoll, MdEvent, 
  MdNotifications, MdPerson, MdSettings, MdLightMode, 
  MdDarkMode, MdLogout, MdPersonAdd, MdDelete, MdLink, 
  MdSend, MdExpandMore, MdHome, MdMail 
} from 'react-icons/md';
import { useTheme } from 'next-themes';


export function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const notifCount = 3;
  
  // Fonction helper pour basculer entre thème clair et sombre
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language === 'fr' ? 'fr' : 'en';

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Image src="/logo_breezy.png" alt="Breezy logo" width={36} height={36} />
        <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight">Breezy</span>
      </div>
      <div className="flex-1 flex justify-center">
        <input type="text" placeholder={t('rightbar.search_placeholder', 'Search...')} className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
      </div>
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button onClick={() => setCreateMenuOpen(v => !v)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:opacity-90 transition text-base flex items-center gap-2">
            <MdAddCircle className="text-xl" /> {t('rightbar.create', 'Create')}
          </button>
          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 animate-fade-in">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdEdit className="text-xl" /> {t('rightbar.new_post', 'New post')}</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdAutoAwesome className="text-xl" /> {t('rightbar.story', 'Story')}</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdPoll className="text-xl" /> {t('rightbar.poll', 'Poll')}</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdEvent className="text-xl" /> {t('rightbar.event', 'Event')}</button>
            </div>
          )}
        </div>
        <button onClick={() => setNotifOpen(v => !v)} className="relative text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition">
          <MdNotifications className="text-3xl" />
          {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{notifCount}</span>}
        </button>
        <div className="relative">
          <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 focus:outline-none">
            <Image src="/pp1.jpg" alt={t('sidebar.profile', 'Profile')} width={36} height={36} className="rounded-full border border-gray-200" />
            <MdExpandMore className="text-gray-500 dark:text-gray-300" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-40 animate-fade-in">
              <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdPerson className="text-xl" /> {t('sidebar.profile')}</Link>
              <Link href="/settings" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdSettings className="text-xl" /> {t('sidebar.settings')}</Link>
              <button
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                onClick={() => {
                  toggleTheme();
                  setUserMenuOpen(false);
                }}>
                {theme === 'dark' ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />} <span className="text-gray-900 dark:text-gray-100">{theme === 'dark' ? t('sidebar.light_mode') : t('sidebar.dark_mode')}</span>
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdLogout className="text-xl" /> {t('sidebar.logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


export function Follows() {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users/suggestions')
        setSuggestions((res.data as SuggestedUser[]).map(u => ({
          _id: u._id,
          username: u.username,
          profilePicture: u.profilePicture || '/default-avatar.png',
          isFollowing: !!u.isFollowing,
          role: u.role || 'user',
        })))
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleFollowToggle = async (userId: string, username: string) => {
    try {
      console.log('handleFollowToggle démarré (Follows):');
      console.log('- User à follow:', userId, '@' + username);
      
      const res = await api.post(`/users/${userId}/follow`);
      
      console.log('Réponse API follow:', res.data);
      
      // Retirer l'utilisateur de la liste des suggestions
      setSuggestions(prev =>
        prev.filter(user => user._id !== userId)
      );
      
      // Récupérer les nouvelles données utilisateur
      const meRes = await api.get('/users/me');
      
      // Déclencher l'événement pour rafraîchir la sidebar
      console.log('Déclenchement événement userFollowUpdate (Follows)');
      
      window.dispatchEvent(new CustomEvent('userFollowUpdate', {
        detail: {
          userId: userId,
          username: username,
          action: res.data.action || 'followed',
          source: 'suggestions',
          timestamp: Date.now(),
          newUserData: meRes.data,
          followingCount: meRes.data.following?.length || 0,
          followersCount: meRes.data.followers?.length || 0
        }
      }));
      
      ProfileSync.emitUpdate(meRes.data);
      
      console.log('Follow depuis suggestions réussi');
      
    } catch (error) {
      console.error('Erreur lors du follow depuis suggestions:', error);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen px-6 py-8">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('rightbar.suggested_friends')}</h2>

        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-500">{t('rightbar.loading', 'Loading...')}</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center p-4">
            <div className="text-gray-400 text-4xl mb-2">👥</div>
            <p className="text-gray-500 text-sm">{t('rightbar.no_suggestions', 'No suggestions available.')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map(user => (
              <div key={user._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Link href={`/profile/${user._id}`} className="flex-shrink-0">
                  <Image
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={`Avatar de ${user.username}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${user._id}`}
                    className="block hover:underline"
                  >
                    <p className="text-gray-900 dark:text-white font-medium truncate">
                      @{user.username}
                    </p>
                    {user.role && user.role !== 'user' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.role === 'admin' ? '👑 Admin' : user.role === 'moderator' ? '🛡️ Modérateur' : ''}
                      </p>
                    )}
                  </Link>
                </div>
                <button
                  onClick={() => handleFollowToggle(user._id, user.username)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 truncate min-w-[70px] ${
                    user.isFollowing
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 shadow-sm'
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                  disabled={loading}
                >
                  {user.isFollowing ? t('rightbar.unfollow', 'Ne plus suivre') : t('rightbar.follow', 'Suivre')}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Section d'information supplémentaire */}
        {suggestions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('rightbar.suggestions_info', 'Suggestions basées sur votre activité')}
            </p>
          </div>
        )}

        {/* Bouton pour rafraîchir les suggestions */}
        <div className="mt-4">
          <button
            onClick={() => {
              setLoading(true);
              const fetchUsers = async () => {
                try {
                  const res = await api.get('/users/suggestions')
                  setSuggestions((res.data as SuggestedUser[]).map(u => ({
                    _id: u._id,
                    username: u.username,
                    profilePicture: u.profilePicture || '/default-avatar.png',
                    isFollowing: !!u.isFollowing,
                    role: u.role || 'user',
                  })))
                } catch (error) {
                  console.error('Erreur lors de la récupération des utilisateurs :', error)
                } finally {
                  setLoading(false)
                }
              }
              fetchUsers();
            }}
            disabled={loading}
            className="w-full px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {loading ? t('rightbar.refreshing', 'Actualisation...') : t('rightbar.refresh_suggestions', 'Actualiser les suggestions')}
          </button>
        </div>
      </div>
    </aside>
  )
}