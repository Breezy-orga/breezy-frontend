"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MdThumbUp, MdDelete, MdLink, MdRepeat, 
  MdChatBubbleOutline, MdComment, MdPersonAdd, MdSend,
  MdHome, MdPerson, MdNotifications, MdMail 
} from 'react-icons/md';
import { FaRegSmile } from 'react-icons/fa';
import PostForm from '@/components/PostForm';
import PostList from '@/components/PostList';
import LanguageSwitcher from '@/components/post/LanguageSwitcher';
import { MdTranslate } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import '../../i18n'; 
import 'flag-icons/css/flag-icons.min.css';
import { Post as PostType } from '@/types/models'

interface Story {
  username: string;
  avatar: string;
  isOnline: boolean;
}

interface User {
  name: string;
  username: string;
  avatar: string;
  isPremium: boolean;
  isOnline: boolean;
  level: number;
}

interface Poll {
  question: string;
  options: string[];
  votes: number[];
}

interface Post {
  id: number;
  user?: User | null;
  date: string;
  content: string;
  image: string | null;
  reactions: {
    like: number;
    bravo: number;
    haha: number;
    sad: number;
  };
  comments: number;
  poll: Poll | null;
}

interface Trend {
  tag: string;
  count: number;
}

const fakeStories = [
  { username: 'alice', avatar: '/pp1.jpg', isOnline: true },
  { username: 'bob', avatar: '/pp2.jpg', isOnline: false },
  { username: 'carla', avatar: '/pp3.jpg', isOnline: true },
  { username: 'david', avatar: '/pp4.jpg', isOnline: false },
  { username: 'emma', avatar: '/pp5.jpg', isOnline: true },
];

const fakePosts = [
  {
    id: 1,
    user: {
      name: 'Alice Dupont',
      username: 'alice',
      avatar: '/pp1.jpg',
      isPremium: true,
      isOnline: true,
      level: 5,
    },
    date: 'il y a 2h',
    content: 'Premier post sur Breezy ! Hâte de partager avec vous tous. #bienvenue',
    image: '/pp4.jpg',
    reactions: { like: 12, bravo: 3, haha: 1, sad: 0 },
    comments: 2,
    poll: null,
  },
  {
    id: 2,
    user: {
      name: 'Bob Martin',
      username: 'bob',
      avatar: '/pp2.jpg',
      isPremium: false,
      isOnline: false,
      level: 2,
    },
    date: 'il y a 1h',
    content: "Quelqu'un a des recommandations de séries à regarder ?",
    image: null,
    reactions: { like: 2, bravo: 0, haha: 2, sad: 1 },
    comments: 1,
    poll: {
      question: 'Séries préférées ?',
      options: ['Dark', 'Stranger Things', 'The Office', 'Autre'],
      votes: [2, 1, 0, 1],
    },
  },
];

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

function Stories() {
  return (
    <div className="flex gap-5 mb-8 overflow-x-auto pb-2">
      {fakeStories.map((story, i) => (
        <div key={story.username} className="flex flex-col items-center group cursor-pointer relative">
          <div className={`rounded-full border-4 ${story.isOnline ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'} p-1 transition-all duration-200 group-hover:scale-105`}>
            <Image src={story.avatar} alt={story.username} width={60} height={60} className="rounded-full object-cover" />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-300 mt-2">@{story.username}</span>
          {story.isOnline && <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></span>}
        </div>
      ))}
    </div>
  );
}

function Poll({ poll }: { poll: Poll }) {
  const { t } = useTranslation();
  const total = poll.votes.reduce((a: number, b: number) => a + b, 0);
  return (
    <div className="mt-3">
      <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{poll.question}</div>
      {poll.options.map((opt: string, i: number) => (
        <div key={i} className="mb-2 last:mb-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 h-1 flex-1 rounded-full overflow-hidden">
              <div className="bg-blue-500 dark:bg-blue-400 h-full" style={{ width: `${total ? (poll.votes[i] / total * 100) : 0}%` }} />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{poll.votes[i]} {t('poll.vote', { count: poll.votes[i] })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<PostType[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null) // Ajout de l'utilisateur actuel
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all');
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation();
  
  // Charger l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', { 
          credentials: 'include' 
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    fetch(`/api/posts/feed`)
      .then(res => res.json())
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
  }, [])

  const handlePostCreated = (newPost: PostType) => {
    console.log('Nouveau post créé:', newPost);
    
    // Vérifier si le post existe déjà pour éviter les doublons
    const postExists = posts.some(post => post._id === newPost._id);
    if (postExists) {
      console.log('Post déjà présent dans la liste, doublon évité');
      return;
    }
    
    // Ajouter le nouveau post en tête de liste
    setPosts(prev => [newPost, ...prev]);
  };

  // Fonction de suppression sans notifications
  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setPosts(prev => prev.filter(p => p._id !== postId));
        console.log('Post supprimé avec succès');
      } else {
        console.error('Erreur lors de la suppression du post');
      }
    } catch (err) {
      console.error('Erreur réseau lors de la suppression:', err);
    }
  };

  // NOUVELLE FONCTION : Gestion des likes dans le feed
  const handleLike = (postId: string, update: { liked: boolean; totalLikes: number }) => {
    console.log('Like dans FeedPage:', postId, update);
    
    if (!currentUser) {
      console.warn('Utilisateur non connecté');
      return;
    }
    
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post._id === postId) {
          const userId = currentUser._id;
          let newLikes = [...(post.likes || [])];
          
          if (update.liked) {
            // Ajouter le like s'il n'existe pas déjà
            if (!newLikes.includes(userId)) {
              newLikes.push(userId);
            }
          } else {
            // Retirer le like
            newLikes = newLikes.filter(id => id !== userId);
          }
          
          console.log('Mise à jour likes FeedPage:', {
            postId,
            oldLikes: post.likes,
            newLikes,
            liked: update.liked
          });
          
          return { ...post, likes: newLikes };
        }
        return post;
      })
    );
  };

  // Fonction pour récupérer l'ID de l'utilisateur actuel
  const getCurrentUserId = () => {
    return currentUser?._id || '';
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
    <div className="w-full max-w-full font-sans text-gray-900 dark:text-white px-2 sm:px-4">
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
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
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
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          )}
        </button>
      </div>
      
      <div className="mt-3 sm:mt-4">
        <PostList
          initialPosts={posts}
          fetchUrl={getFetchUrl()}
          onDelete={handleDeletePost}
          onLike={handleLike}
          key={activeTab} 
        />
      </div>
    </div>
  );
}