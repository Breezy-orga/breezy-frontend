'use client'

import { useState, useEffect } from 'react'
import Post from './Post'
import { Post as PostType, User } from '@/types/models'
import { useTranslation } from 'react-i18next'
import { formatRelativeDate } from '../i18n/formatRelativeDate'

interface PostListProps {
  initialPosts?: PostType[]
  fetchUrl: string
  onDelete?: (postId: string) => void
}

export default function PostList({ fetchUrl, initialPosts, onDelete }: PostListProps) {
  const { t } = useTranslation()
  const [posts, setPosts] = useState<PostType[]>(initialPosts || []);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  const updatePostInState = (updatedPost: PostType) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post._id === updatedPost._id ? updatedPost : post
      )
    )
  }

  const updatePostLikesInState = (
    postId: string,
    update: { liked: boolean; totalLikes: number }
  ) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post._id !== postId) return post

        const userId = currentUser?._id
        let newLikes = post.likes

        if (userId) {
          if (update.liked) {
            if (!newLikes.includes(userId)) {
              newLikes = [...newLikes, userId]
            }
          } else {
            newLikes = newLikes.filter(id => id !== userId)
          }
        }

        return { ...post, likes: newLikes }
      })
    )
  }

  const handlePostDelete = (postId: string) => {
    console.log('handlePostDelete appelé pour le post:', postId);
    
    const postExists = posts.some(post => post._id === postId);
    if (!postExists) {
      console.log('Post déjà supprimé de la liste, appel ignoré');
      return;
    }

    setPosts(prevPosts => {
      const newPosts = prevPosts.filter(post => post._id !== postId);
      console.log('Posts mis à jour:', newPosts.length, 'posts restants');
      return newPosts;
    });
    
    if (onDelete) {
      console.log('Appel de la fonction onDelete du parent');
      onDelete(postId);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch(fetchUrl, { credentials: 'include' })
      if (!res.ok) throw new Error('Erreur lors de la récupération des messages')
      const data = await res.json()
      setPosts(data)
      setError(null)
    } catch (err) {
      console.error('Erreur:', err)
      setError('Une erreur est survenue lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialPosts && initialPosts.length > 0) {
      setPosts(prevPosts => {
        const existingIds = new Set(prevPosts.map(post => post._id));
        
        const newPosts = initialPosts.filter(post => !existingIds.has(post._id));
        
        if (newPosts.length > 0) {
          console.log(`Ajout de ${newPosts.length} nouveaux posts`);
          return [...newPosts, ...prevPosts];
        }
        
        return prevPosts;
      });
    }
  }, [initialPosts]);

  useEffect(() => {
    fetchPosts()
  }, [fetchUrl])

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/users/me', { credentials: 'include' })
      if (!res.ok) throw new Error('Utilisateur non authentifié')
      const user = await res.json()
      setCurrentUser({
        ...user,
        profilePicture: user.profilePicture || '/default-avatar.svg',
      })
    } catch (err) {
      console.error("Erreur récupération user:", err)
      setCurrentUser({
        _id: '',
        username: 'utilisateur',
        email: '',
        profilePicture: '/default-avatar.svg',
        role: 'user',
      })
    }
  }

    // Fonction pour supprimer un post de la liste locale et appeler le parent si besoin
  const handlePostDelete = (postId: string) => {
    setPosts((prevPosts: PostType[]) => prevPosts.filter((post: PostType) => post._id !== postId));
    if (onDelete) onDelete(postId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-500">{t('postlist.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchPosts}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('postlist.retry', 'Réessayer')}
        </button>
      </div>
    )
  }

  const visiblePosts = posts

  return (

    <>
      {shareNotification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {shareNotification}
        </div>
    <div className="space-y-4">
      {visiblePosts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t('postlist.empty')}
        </div>
      ) : (
        visiblePosts.map(post => {
          if (!post?._id) {
            console.error('Post invalide détecté:', post)
            return null
          }

          return (
            <Post
              key={post._id.toString()}
              post={post}
              currentUser={currentUser || {
                _id: '',
                username: '',
                email: '',
                profilePicture: '/default-avatar.png',
                role: 'user',
              }}
              onLike={(postId, update) =>
                updatePostLikesInState(postId, update)
              }
              onComment={async (_postId, updatedPost) => {
                updatePostInState(updatedPost)
              }}
              onShare={postId => {
                console.log('Partager le post:', postId)
                navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`)
                  .then(() => console.log('Lien copié dans le presse-papier'))
                  .catch(() => console.error('Erreur lors de la copie du lien'))
              }}
              onDelete={handlePostDelete}
            />
          )
        })()}
      </div>
    </>
  )
}