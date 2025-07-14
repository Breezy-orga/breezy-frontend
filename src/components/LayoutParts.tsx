"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SuggestedUser } from '@/types/models';
import api from '@/lib/axios';
import { MdTranslate } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

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

  const handleFollowToggle = async (userId: string) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setSuggestions(prev =>
        prev.filter(user => user._id !== userId)
      );
    } catch (error) {
      console.error('Erreur lors du (un)follow :', error);
    }
  };

  const { t } = useTranslation();

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen px-6 py-8 gap-10">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t('rightbar.suggested_friends')}</h2>

        {loading ? (
          <p className="text-gray-500">{t('rightbar.loading', 'Loading...')}</p>
        ) : suggestions.length === 0 ? (
          <p className="text-gray-500">{t('rightbar.no_suggestions', 'No suggestions available.')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map(user => (
              <div key={user._id} className="flex items-center gap-3">
                <Image
                  src={user.profilePicture || '/default-avatar.png'}
                  alt={t('rightbar.profile_picture')}
                  width={32}
                  height={32}
                  className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
                <Link
                  href={`/profile/${user._id}`}
                  className="text-gray-900 dark:text-white font-medium hover:underline"
                >
                  @{user.username}
                </Link>
                <button
                  onClick={() => handleFollowToggle(user._id)}
                  className={`ml-auto px-3 py-1 rounded-lg text-xs font-semibold transition truncate max-w-[80px] ${
                    user.isFollowing
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                  }`}
                >
                  {t('rightbar.follow')}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </aside>
  )
}