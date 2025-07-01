'use client';

import { useState, useEffect } from 'react';
import { Post as PostType } from '../../types/models';
import Post from '../../components/Post';
import SearchBar from '../../components/SearchBar';
import { MdInfo } from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function SearchPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  async function search(query: string) {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      // Rechercher les posts par tags
      const postsPromise = fetch(`api/posts/search?tags=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Rechercher les utilisateurs
      const usersPromise = fetch(`api/users/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Exécuter les deux requêtes en parallèle
      const [postsResponse, usersResponse] = await Promise.all([postsPromise, usersPromise]);
      
      if (!postsResponse.ok) {
        console.error(`Erreur recherche posts: ${postsResponse.status}`);
        setPosts([]);
      } else {
        const postsData = await postsResponse.json();
        setPosts(postsData);
      }
      
      if (!usersResponse.ok) {
        console.error(`Erreur recherche utilisateurs: ${usersResponse.status}`);
        setUsers([]);
      } else {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la recherche');
      setPosts([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Récupérer l'utilisateur actuel au chargement
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me', {
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        setCurrentUser(null);
        console.error('Erreur lors du chargement des infos utilisateur:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Gérer l'action "Like"
const handleLike = async (postId: string) => {
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    // Mettre à jour l'état local
    const updatedPosts = posts.map(post => {
      if (post._id === postId) {
        const userId = currentUser?._id;
        if (!userId) return post; // Ne rien faire si pas d'utilisateur connecté
        const isLiked = post.likes.some((like: any) => (typeof like === 'object' ? like._id : like) === userId);
        return {
          ...post,
          likes: isLiked
            ? post.likes.filter(id => id !== userId)
            : [...post.likes, userId]
        };
      }
      return post;
    });

    setPosts(updatedPosts);
  } catch (err) {
    console.error('Erreur lors du like:', err);
  }
};

  const handleComment = async (postId: string, updatedPost: PostType) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === postId ? updatedPost : post
      )
    );
  };

  // Gérer le partage
  const handleShare = (postId: string) => {
    // Copier l'URL du post dans le presse-papier
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => alert('Lien copié dans le presse-papier'))
      .catch(err => console.error('Erreur de copie:', err));
  };

  function handleSearch(query: string) {
    setSearchQuery(query);
    search(query);
  }

  return (
    <div className="flex flex-col w-full max-w-full md:max-w-2xl mx-auto px-2 py-4 sm:px-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('search.title')}</h1>

      <div className="flex flex-col space-y-3 sm:space-y-4">
        <SearchBar 
          onSearch={handleSearch} 
          placeholder={t('search.placeholder')} 
        />
      </div>
      
      {loading && (
        <div className="my-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="my-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <p className="flex items-center gap-2">
            <MdInfo className="text-xl" /> {t('search.error', { error })}
          </p>
        </div>
      )}
      
      {searchPerformed && !loading && posts.length === 0 && users.length === 0 && !error && (
        <div className="my-8 text-center">
          <p className="text-gray-500">{t('search.no_results', { query: searchQuery })}</p>
        </div>
      )}
      
      {/* Section utilisateurs */}
      {users.length > 0 && (
        <div className="mt-5 sm:mt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">{t('search.users')}</h2>
          <div className="space-y-3 sm:space-y-4">
            {users.map((user) => (
              <div key={user._id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center">
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden mr-3 sm:mr-4">
                  <Image 
                    src={user.profilePicture || '/default-avatar.png'} 
                    alt={user.username}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{user.username}</h3>
                  {user.bio && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{user.bio}</p>
                  )}
                </div>
                <Link 
                  href={`/profile/${user._id}`} 
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-md text-xs sm:text-sm ml-2 shadow-md border border-blue-300 dark:border-blue-400 dark:shadow-lg dark:text-white dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                >
                  {t('search.view_profile')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}  

      {/* Section posts */}
      {posts.length > 0 && (
        <div className="mt-5 sm:mt-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">{t('search.posts')}</h2>
          <div className="space-y-3 sm:space-y-4">
            {posts.map((post) => (
              <Post 
                key={post._id} 
                post={post} 
                currentUser={currentUser}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
