'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post as PostType, User } from '../../types/models';
import Post from '../../components/Post';
import { MdInfo, MdSearch } from 'react-icons/md';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';

export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Force re-render quand la langue change
  const [lang, setLang] = useState('');
  useEffect(() => {
    const updateLang = () => {
      const lsLang = typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') : '';
      setLang(lsLang || i18n.language);
    };
    updateLang();
    i18n.on('languageChanged', updateLang);
    return () => { i18n.off('languageChanged', updateLang); };
  }, [i18n]);

  // Fonction de recherche optimisée
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      setTags([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      // Rechercher les posts par tags et contenu
      const postsPromise = fetch(`/api/posts/search?tags=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Rechercher les utilisateurs
      const usersPromise = fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Rechercher les tags
      const tagsPromise = fetch(`/api/posts/tags/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Exécuter les trois requêtes en parallèle
      const [postsResponse, usersResponse, tagsResponse] = await Promise.all([
        postsPromise, 
        usersPromise, 
        tagsPromise
      ]);
      
      // Traiter les réponses
      if (!postsResponse.ok) {
        console.error(`Erreur recherche posts: ${postsResponse.status}`);
        setPosts([]);
      } else {
        const postsData = await postsResponse.json();
        setPosts(postsData || []);
      }
      
      if (!usersResponse.ok) {
        console.error(`Erreur recherche utilisateurs: ${usersResponse.status}`);
        setUsers([]);
      } else {
        const usersData = await usersResponse.json();
        setUsers(usersData || []);
      }
      
      if (!tagsResponse.ok) {
        console.error(`Erreur recherche tags: ${tagsResponse.status}`);
        setTags([]);
      } else {
        const tagsData = await tagsResponse.json();
        console.log('🏷️ Tags reçus:', tagsData);
        setTags(tagsData || []);
      }
      
    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err instanceof Error ? err.message : t('search.searchError'));
      setPosts([]);
      setUsers([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 300),
    [performSearch]
  );

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

  // Vérifier s'il y a un paramètre tag dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tagParam = urlParams.get('tag');
    if (tagParam) {
      setSearchQuery(tagParam);
      performSearch(tagParam);
    }
  }, [performSearch]);

  // Effectuer la recherche quand la query change
  useEffect(() => {
    console.log('Effect déclenché - searchQuery:', searchQuery, 'length:', searchQuery.trim().length);
    
    if (searchQuery.trim().length >= 2) {
      console.log('Lancement de la recherche avec debounce');
      debouncedSearch(searchQuery);
    } else {
      console.log('Query trop courte, reset des états');
      setPosts([]);
      setUsers([]);
      setTags([]);
      setSearchPerformed(false);
    }
  }, [searchQuery, debouncedSearch]);

  // Debug des états
  useEffect(() => {
    console.log('États mis à jour:', {
      posts: posts.length,
      users: users.length,
      tags: tags.length,
      tagsContent: tags
    });
  }, [posts, users, tags]);

  // Mettre à jour les likes dans l'état
  const updatePostLikesInState = (
    postId: string,
    update: { liked: boolean; totalLikes: number }
  ) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post._id !== postId) return post;

        const userId = currentUser?._id;
        let newLikes = post.likes;

        if (userId) {
          if (update.liked) {
            if (!newLikes.includes(userId)) {
              newLikes = [...newLikes, userId];
            }
          } else {
            newLikes = newLikes.filter(id => id !== userId);
          }
        }

        return { ...post, likes: newLikes };
      })
    );
  };

  const updatePostInState = (updatedPost: PostType) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  // Gérer le partage sans notification
  const handleShare = (postId: string) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => console.log('Lien copié dans le presse-papier'))
      .catch(err => console.error('Erreur de copie:', err));
  };

  // Supprimer un post sans notifications
  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        console.log('Post supprimé avec succès');
      } else {
        console.error('Erreur lors de la suppression du post');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Fonction pour gérer le clic sur un tag
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    performSearch(tag);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors">
      <div className="flex flex-col w-full max-w-full md:max-w-2xl mx-auto px-2 py-4 sm:px-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
          🔍 {t('search.title')}
        </h1>

        {/* Barre de recherche personnalisée */}
        <div className="flex flex-col space-y-3 sm:space-y-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MdSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 transition-colors"
            />
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="my-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
            <p className="flex items-center gap-2">
              <MdInfo className="text-xl" /> {error}
            </p>
          </div>
        )}
        
        {searchPerformed && !loading && posts.length === 0 && users.length === 0 && tags.length === 0 && !error && searchQuery.trim() && (
          <div className="my-8 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('search.noResultsTitle')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('search.noResultsMessage', { query: searchQuery })}
              </p>
            </div>
          </div>
        )}
        
        {/* Section tags */}
        {tags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              🏷️ {t('search.tags')} ({tags.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tags.map((tag, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">#</span>
                      <span className="font-medium text-gray-900 dark:text-white">{tag}</span>
                    </div>
                    <button
                      onClick={() => handleTagClick(tag)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 font-medium rounded-lg text-xs transition-colors"
                    >
                      {t('search.search')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section utilisateurs */}
        {users.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              👥 {t('search.users')} ({users.length})
            </h2>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center hover:shadow-md transition-shadow">
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                    <Image 
                      src={user.profilePicture || '/default-avatar.png'} 
                      alt={user.username}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.name || user.username}
                      </h3>
                      <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                        @{user.username}
                      </span>
                    </div>
                    {user.bio && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <Link 
                    href={`/profile/${user._id}`} 
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 font-medium rounded-lg text-xs sm:text-sm ml-2 transition-colors shadow-md"
                  >
                    {t('search.viewProfile')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}  

        {/* Section posts */}
        {posts.length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
              📝 {t('search.posts')} ({posts.length})
            </h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <Post 
                  key={post._id} 
                  post={post} 
                  currentUser={currentUser}
                  onLike={(postId, update) => updatePostLikesInState(postId, update)}
                  onComment={async (postId, updatedPost) => updatePostInState(updatedPost)}
                  onShare={handleShare}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message d'accueil si pas de recherche */}
        {!searchPerformed && !searchQuery.trim() && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('search.welcomeTitle')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('search.welcomeMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}