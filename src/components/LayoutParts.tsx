"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MdAddCircle, MdEdit, MdAutoAwesome, MdPoll, MdEvent, 
  MdNotifications, MdPerson, MdSettings, MdLightMode, 
  MdDarkMode, MdLogout, MdPersonAdd, MdShare, MdLink, 
  MdSend, MdExpandMore, MdHome, MdMail 
} from 'react-icons/md';
import { useTheme } from 'next-themes';

const fakeFollows = [
  { username: 'alice', avatar: '/pp1.jpg' },
  { username: 'bob', avatar: '/pp2.jpg' },
  { username: 'carla', avatar: '/pp3.jpg' },
];
const fakeTrends = [
  { tag: '#bienvenue', count: 12 },
  { tag: '#séries', count: 8 },
  { tag: '#breezy', count: 5 },
  { tag: '#dev', count: 3 },
];
const fakeStories = [
  { username: 'alice', avatar: '/pp1.jpg', isOnline: true },
  { username: 'bob', avatar: '/pp2.jpg', isOnline: false },
  { username: 'carla', avatar: '/pp3.jpg', isOnline: true },
  { username: 'david', avatar: '/pp4.jpg', isOnline: false },
  { username: 'emma', avatar: '/pp5.jpg', isOnline: true },
];

export function Header() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const notifCount = 3;
  
  // Fonction helper pour basculer entre thème clair et sombre
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Image src="/logo_breezy.png" alt="Breezy logo" width={36} height={36} />
        <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tracking-tight">Breezy</span>
      </div>
      <div className="flex-1 flex justify-center">
        <input type="text" placeholder="Rechercher..." className="w-full max-w-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
      </div>
      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button onClick={() => setCreateMenuOpen(v => !v)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl font-semibold shadow hover:opacity-90 transition text-base flex items-center gap-2">
            <MdAddCircle className="text-xl" /> Créer
          </button>
          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-40 animate-fade-in">
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdEdit className="text-xl" /> Nouveau post</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdAutoAwesome className="text-xl" /> Story</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdPoll className="text-xl" /> Sondage</button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdEvent className="text-xl" /> Événement</button>
            </div>
          )}
        </div>
        <button onClick={() => setNotifOpen(v => !v)} className="relative text-gray-600 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition">
          <MdNotifications className="text-3xl" />
          {notifCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{notifCount}</span>}
        </button>
        <div className="relative">
          <button onClick={() => setUserMenuOpen(v => !v)} className="flex items-center gap-2 focus:outline-none">
            <Image src="/pp1.jpg" alt="Mon profil" width={36} height={36} className="rounded-full border border-gray-200" />
            <MdExpandMore className="text-gray-500 dark:text-gray-300" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-40 animate-fade-in">
              <Link href="/profile" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdPerson className="text-xl" /> Mon profil</Link>
              <Link href="/settings" className="block px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"><MdSettings className="text-xl" /> Paramètres</Link>
              <button
                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
                onClick={() => {
                  toggleTheme();
                  setUserMenuOpen(false);
                }}
              >
                {theme === 'dark' ? <MdLightMode className="text-xl" /> : <MdDarkMode className="text-xl" />} <span className="text-gray-900 dark:text-gray-100">{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition flex items-center gap-2"><MdLogout className="text-xl" /> Déconnexion</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// La fonction Sidebar a été supprimée car remplacée par le composant AppSidebar plus moderne

export function Follows() {
  return (
    <aside className="hidden xl:flex flex-col w-72 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 min-h-screen px-6 py-8 gap-10">
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Comptes suivis</h2>
        <div className="flex flex-col gap-5">
          {fakeFollows.map(f => (
            <div key={f.username} className="flex items-center gap-3">
              <Image src={f.avatar} alt="Photo profil" width={36} height={36} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <span className="text-gray-900 font-medium">@{f.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Tendances</h2>
        <div className="flex flex-col gap-3">
          {fakeTrends.map(t => (
            <div key={t.tag} className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">{t.tag}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t.count} posts</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Suggestions d'amis</h2>
        <div className="flex flex-col gap-4">
          {fakeStories.slice(2).map(f => (
            <div key={f.username} className="flex items-center gap-3">
              <Image src={f.avatar} alt="Photo profil" width={32} height={32} className="rounded-full object-cover border border-gray-200 dark:border-gray-700" />
              <span className="text-gray-900 font-medium">@{f.username}</span>
              <button className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-800 transition">Suivre</button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
} 