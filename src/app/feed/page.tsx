"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdSearch } from 'react-icons/md';
import { FaRegSmile } from 'react-icons/fa';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';
import RightSidebar from '@/components/RightSidebar';
import { Follows } from '@/components/LayoutParts';
import { useTranslation } from 'react-i18next';
import '../../i18n'; 
import 'flag-icons/css/flag-icons.min.css';
import { Post as PostType } from '@/types/models'

export default function FeedPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = (newPost: PostType) => {
    // Forcer le rafraîchissement de la liste des posts
    setRefreshKey(prev => prev + 1);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Forcer le rafraîchissement de la liste des posts
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Erreur lors de la suppression du post');
      }
    } catch (err) {
      alert('Erreur réseau lors de la suppression');
    }
  };

  // URL de l'API en fonction de l'onglet actif
  const getFetchUrl = () => {
    if (activeTab === 'following') {
      return `/api/posts/feed?following=true`;
    } else {
      return `/api/posts/feed`;
    }
  };

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 w-full max-w-full font-sans text-gray-900 dark:text-white px-2 sm:px-4">
        <PostForm onPostCreated={handlePostCreated} />
        
        {/* Onglets Pour Toi / Abonnement */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-4 sm:mt-6 mb-3 sm:mb-4">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-2 py-2 sm:px-4 sm:py-3 font-medium text-xs sm:text-sm relative ${activeTab === 'all' 
              ? 'text-blue-600 dark:text-blue-400 font-semibold' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            {t('feed.for_you')}
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`flex-1 px-2 py-2 sm:px-4 sm:py-3 font-medium text-xs sm:text-sm relative ${activeTab === 'following' 
              ? 'text-blue-600 dark:text-blue-400 font-semibold' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
          >
            {t('feed.following')}
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            )}
          </button>
        </div>

        {/* Liste des posts */}
        <PostList 
          key={`${activeTab}-${refreshKey}`}
          fetchUrl={getFetchUrl()}
          onDelete={handleDeletePost}
        />
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-72 flex-shrink-0">
        <RightSidebar />
      </div>
    </div>
  );
}
